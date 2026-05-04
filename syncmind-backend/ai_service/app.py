from __future__ import annotations

import base64
import json
import os
import re
import subprocess
import tempfile
import threading
import uuid
from http.client import IncompleteRead
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request as UrlRequest, urlopen

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request as FastAPIRequest
from fastapi.responses import JSONResponse
from openai import OpenAI
from pydantic import BaseModel, Field

try:
    from chromadb import PersistentClient
    CHROMA_IMPORT_ERROR = None
except Exception as exc:  # pragma: no cover - environment dependent import guard
    PersistentClient = None
    CHROMA_IMPORT_ERROR = exc

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

DEFAULT_FFMPEG_PATH = (
    r"C:\Users\rehan\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe"
    r"\ffmpeg-8.1-full_build\bin\ffmpeg.exe"
)
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")
DEEPGRAM_MODEL = os.getenv("DEEPGRAM_MODEL", "nova-3")
DEEPGRAM_LANGUAGE = os.getenv("DEEPGRAM_LANGUAGE", "en").strip()
DEEPGRAM_API_BASE_URL = os.getenv("DEEPGRAM_API_BASE_URL", "https://api.deepgram.com").rstrip("/")
FFMPEG_PATH = os.getenv("FFMPEG_PATH", DEFAULT_FFMPEG_PATH)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
OPENAI_EMBEDDING_MODEL = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
CHROMA_PERSIST_DIR = os.getenv(
    "CHROMA_PERSIST_DIR",
    str((BASE_DIR / "ai_service" / "chroma_data").resolve()),
)

_openai_client = None
_chroma_client = None
_chroma_collection = None
_vector_backend_name = "chroma" if PersistentClient else "local-json"


class LocalJsonVectorStore:
    def __init__(self, path: str):
        self.path = Path(path)
        self.path.mkdir(parents=True, exist_ok=True)
        self.file_path = self.path / "local_vector_store.json"

    def _load(self) -> dict[str, Any]:
        if not self.file_path.exists():
            return {"items": []}
        with self.file_path.open("r", encoding="utf-8") as handle:
            return json.load(handle)

    def _save(self, payload: dict[str, Any]) -> None:
        with self.file_path.open("w", encoding="utf-8") as handle:
            json.dump(payload, handle)

    def delete(self, where: dict[str, Any] | None = None) -> None:
        payload = self._load()
        if not where:
            payload["items"] = []
            self._save(payload)
            return
        payload["items"] = [
            item for item in payload["items"]
            if not all(item["metadata"].get(key) == value for key, value in where.items())
        ]
        self._save(payload)

    def upsert(
        self,
        ids: list[str],
        embeddings: list[list[float]],
        metadatas: list[dict[str, Any]],
        documents: list[str],
    ) -> None:
        payload = self._load()
        existing = {item["id"]: item for item in payload["items"]}
        for item_id, embedding, metadata, document in zip(ids, embeddings, metadatas, documents):
            existing[item_id] = {
                "id": item_id,
                "embedding": embedding,
                "metadata": metadata,
                "document": document,
            }
        payload["items"] = list(existing.values())
        self._save(payload)

    def query(
        self,
        query_embeddings: list[list[float]],
        n_results: int,
        where: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        payload = self._load()
        items = payload["items"]
        if where:
            items = [
                item for item in items
                if all(item["metadata"].get(key) == value for key, value in where.items())
            ]

        query_embedding = query_embeddings[0]

        def cosine_similarity(left: list[float], right: list[float]) -> float:
            numerator = sum(a * b for a, b in zip(left, right))
            left_norm = sum(a * a for a in left) ** 0.5
            right_norm = sum(b * b for b in right) ** 0.5
            if not left_norm or not right_norm:
                return 0.0
            return numerator / (left_norm * right_norm)

        ranked = sorted(
            items,
            key=lambda item: cosine_similarity(query_embedding, item["embedding"]),
            reverse=True,
        )[:n_results]

        return {
            "documents": [[item["document"] for item in ranked]],
            "metadatas": [[item["metadata"] for item in ranked]],
        }


def configure_ffmpeg() -> None:
    ffmpeg_path = Path(FFMPEG_PATH)
    if ffmpeg_path.exists():
        current_path = os.environ.get("PATH", "")
        ffmpeg_dir = str(ffmpeg_path.parent)
        if ffmpeg_dir not in current_path.split(os.pathsep):
            os.environ["PATH"] = f"{ffmpeg_dir}{os.pathsep}{current_path}"


configure_ffmpeg()


def get_openai_client() -> OpenAI | None:
    global _openai_client
    if not OPENAI_API_KEY:
        return None
    if _openai_client is None:
        _openai_client = OpenAI(api_key=OPENAI_API_KEY)
    return _openai_client


def get_vector_collection():
    global _chroma_client, _chroma_collection, _vector_backend_name
    if _chroma_collection is not None:
        return _chroma_collection

    os.makedirs(CHROMA_PERSIST_DIR, exist_ok=True)

    if PersistentClient is not None:
        try:
            _chroma_client = PersistentClient(path=CHROMA_PERSIST_DIR)
            _chroma_collection = _chroma_client.get_or_create_collection(
                name="meeting_transcripts"
            )
            _vector_backend_name = "chroma"
            return _chroma_collection
        except Exception:
            pass

    _vector_backend_name = "local-json"
    _chroma_collection = LocalJsonVectorStore(CHROMA_PERSIST_DIR)
    return _chroma_collection


def normalize_whitespace(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip()


DEEPGRAM_LANGUAGE = normalize_whitespace(DEEPGRAM_LANGUAGE)


def clean_transcript_text(text: str) -> str | None:
    candidate = normalize_whitespace(text)
    if len(candidate) < 2:
        return None

    alpha_count = sum(char.isalpha() for char in candidate)
    if alpha_count < 2:
        return None

    if re.fullmatch(r"[\W_]+", candidate):
        return None

    if re.search(r"(.)\1{6,}", candidate):
        return None

    return candidate


def ensure_llm_available() -> OpenAI:
    client = get_openai_client()
    if client is None:
        raise HTTPException(
            status_code=503,
            detail="OPENAI_API_KEY is missing. Summaries and Q&A require an API key.",
        )
    return client


def generate_embeddings(texts: list[str]) -> list[list[float]]:
    client = ensure_llm_available()
    response = client.embeddings.create(
        model=OPENAI_EMBEDDING_MODEL,
        input=texts,
    )
    return [item.embedding for item in response.data]


def normalize_audio_to_wav(audio_bytes: bytes, suffix: str) -> Path:
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as source_file:
        source_file.write(audio_bytes)
        source_path = Path(source_file.name)

    output_path = source_path.with_suffix(".wav")
    command = [
        FFMPEG_PATH,
        "-y",
        "-i",
        str(source_path),
        "-map",
        "0:a:0",
        "-ac",
        "1",
        "-ar",
        "16000",
        "-af",
        "highpass=f=80,lowpass=f=7000,afftdn=nf=-25,volume=18dB,dynaudnorm=f=200:g=15",
        "-acodec",
        "pcm_s16le",
        str(output_path),
    ]

    completed = subprocess.run(
        command,
        capture_output=True,
        text=True,
        check=False,
    )
    source_path.unlink(missing_ok=True)

    if completed.returncode != 0:
        output_path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=500,
            detail=f"FFmpeg failed to normalize audio: {completed.stderr.strip() or 'unknown error'}",
        )

    return output_path


def transcribe_audio(audio_path: Path, prompt: str | None = None) -> str | None:
    _ = prompt
    if not DEEPGRAM_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="DEEPGRAM_API_KEY is missing. Live transcription is unavailable.",
        )

    with audio_path.open("rb") as audio_file:
        audio_bytes = audio_file.read()

    query_params: dict[str, Any] = {
        "model": DEEPGRAM_MODEL,
        "smart_format": "true",
        "punctuate": "true",
    }
    if DEEPGRAM_LANGUAGE:
        query_params["language"] = DEEPGRAM_LANGUAGE
    else:
        query_params["detect_language"] = "true"

    request = UrlRequest(
        f"{DEEPGRAM_API_BASE_URL}/v1/listen?{urlencode(query_params, doseq=True)}",
        data=audio_bytes,
        headers={
            "Authorization": f"Token {DEEPGRAM_API_KEY}",
            "Content-Type": "audio/wav",
            "Accept": "application/json",
        },
        method="POST",
    )

    try:
        with urlopen(request, timeout=60) as response:
            response_bytes = response.read()
    except HTTPError as exc:
        error_body = ""
        request_id = exc.headers.get("x-dg-request-id", "") if exc.headers else ""
        try:
            error_body = exc.read().decode("utf-8", errors="replace").strip()
        except Exception:
            error_body = ""

        detail = f"Deepgram transcription failed with status {exc.code}."
        if error_body:
            detail = f"{detail} {error_body}"
        if request_id:
            detail = f"{detail} Request ID: {request_id}"

        # Treat invalid credentials and permission issues as a service
        # configuration problem instead of a generic upstream gateway error.
        status_code = 503 if exc.code in {401, 403} else 502
        if exc.code in {401, 403}:
            detail = (
                "Deepgram authentication failed. Check DEEPGRAM_API_KEY and project access. "
                f"{detail}"
            )
        raise HTTPException(status_code=status_code, detail=detail) from exc
    except (URLError, TimeoutError, IncompleteRead) as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Deepgram transcription request failed: {exc}",
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Deepgram transcription failed unexpectedly: {exc}",
        ) from exc

    try:
        response_payload = json.loads(response_bytes.decode("utf-8"))
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Deepgram returned a non-JSON response: {exc}",
        ) from exc

    channel_results = (((response_payload.get("results") or {}).get("channels")) or [])
    alternatives = (channel_results[0].get("alternatives") or []) if channel_results else []
    transcript_text = alternatives[0].get("transcript", "") if alternatives else ""

    cleaned = clean_transcript_text(transcript_text)
    return cleaned


def upsert_transcript_segments(meeting_id: str, segments: list["TranscriptSegment"]) -> int:
    if not segments:
        return 0

    embeddings = generate_embeddings([segment.text for segment in segments])
    collection = get_vector_collection()
    ids = [
        segment.id
        or f"{meeting_id}:{segment.timestamp or uuid.uuid4().hex}:{index}"
        for index, segment in enumerate(segments)
    ]
    metadatas = [
        {
            "meeting_id": meeting_id,
            "speaker": segment.speaker,
            "timestamp": segment.timestamp or "",
        }
        for segment in segments
    ]
    documents = [segment.text for segment in segments]
    collection.upsert(
        ids=ids,
        embeddings=embeddings,
        metadatas=metadatas,
        documents=documents,
    )
    return len(ids)


def reindex_meeting(meeting_id: str, segments: list["TranscriptSegment"]) -> int:
    collection = get_vector_collection()
    try:
        collection.delete(where={"meeting_id": meeting_id})
    except Exception:
        pass
    return upsert_transcript_segments(meeting_id, segments)


def summarize_with_llm(title: str, transcript: list["TranscriptSegment"]) -> dict[str, Any]:
    client = ensure_llm_available()
    transcript_text = "\n".join(
        f"{segment.speaker}: {segment.text}" for segment in transcript if segment.text
    )
    response = client.chat.completions.create(
        model=OPENAI_MODEL,
        temperature=0.2,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "You are SyncMind's meeting summarizer. Return valid JSON with keys "
                    "'executive_summary', 'action_items', and 'key_decisions'. "
                    "'action_items' must be an array of objects with keys 'assignee', 'task', and 'due'. "
                    "'key_decisions' must be an array of concise strings. "
                    "Use only the transcript. If the transcript does not support an item, omit it."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Meeting title: {title}\n\n"
                    f"Transcript:\n{transcript_text}\n\n"
                    "Create a structured summary for the dashboard."
                ),
            },
        ],
        max_completion_tokens=900,
    )

    content = response.choices[0].message.content or "{}"
    payload = json.loads(content)
    action_items = payload.get("action_items") or []
    key_decisions = payload.get("key_decisions") or []
    return {
        "executive_summary": normalize_whitespace(payload.get("executive_summary", "")),
        "action_items": [
            {
                "assignee": normalize_whitespace(item.get("assignee", "Team")) or "Team",
                "task": normalize_whitespace(item.get("task", "")),
                "due": normalize_whitespace(item.get("due", "")),
            }
            for item in action_items
            if normalize_whitespace(item.get("task", ""))
        ],
        "key_decisions": [
            normalize_whitespace(item)
            for item in key_decisions
            if normalize_whitespace(item)
        ],
    }


def answer_with_llm(meeting_id: str, question: str, transcript: list["TranscriptSegment"] | None) -> dict[str, Any]:
    client = ensure_llm_available()
    if transcript:
        reindex_meeting(meeting_id, transcript)

    collection = get_vector_collection()
    query_embedding = generate_embeddings([question])[0]
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=4,
        where={"meeting_id": meeting_id},
    )

    documents = (results.get("documents") or [[]])[0]
    metadatas = (results.get("metadatas") or [[]])[0]

    if not documents:
        return {
            "answer": "I could not find enough transcript context to answer that question yet.",
            "confidence": 0.12,
            "sources": [],
        }

    context_blocks = []
    source_payload = []
    for metadata, document in zip(metadatas, documents):
        speaker = metadata.get("speaker", "Participant")
        timestamp = metadata.get("timestamp", "")
        context_blocks.append(f"[{speaker} @ {timestamp}] {document}")
        source_payload.append(
            {
                "speaker": speaker,
                "timestamp": timestamp,
                "snippet": document[:220],
            }
        )

    response = client.chat.completions.create(
        model=OPENAI_MODEL,
        temperature=0.1,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "You are SyncMind's meeting assistant. Answer only from the retrieved transcript context. "
                    "If the answer is not supported by the context, say so clearly. "
                    "Return valid JSON with keys 'answer' and 'confidence'. "
                    "Confidence must be a number between 0 and 1."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Question: {question}\n\n"
                    f"Retrieved transcript context:\n{chr(10).join(context_blocks)}"
                ),
            },
        ],
        max_completion_tokens=600,
    )

    content = response.choices[0].message.content or "{}"
    payload = json.loads(content)
    confidence = payload.get("confidence", 0.5)
    try:
        confidence = float(confidence)
    except (TypeError, ValueError):
        confidence = 0.5
    confidence = max(0.0, min(confidence, 1.0))

    return {
        "answer": normalize_whitespace(payload.get("answer", "")),
        "confidence": confidence,
        "sources": source_payload,
    }


class TranscriptSegment(BaseModel):
    id: str | None = None
    speaker: str
    text: str
    timestamp: str | None = None


class TranscribeChunkRequest(BaseModel):
    meeting_id: str
    speaker: str
    audio_base64: str
    mime_type: str = "audio/webm"
    timestamp: str | None = None
    prompt: str | None = None


class FinalizeMeetingRequest(BaseModel):
    meeting_id: str
    transcript: list[TranscriptSegment] = Field(default_factory=list)


class SummarizeMeetingRequest(BaseModel):
    meeting_id: str
    title: str
    transcript: list[TranscriptSegment] = Field(default_factory=list)


class AskRequest(BaseModel):
    meeting_id: str
    question: str
    transcript: list[TranscriptSegment] | None = None


app = FastAPI(title="SyncMind AI Service")


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: FastAPIRequest, exc: Exception) -> JSONResponse:
    print(f"Unhandled AI service error on {request.method} {request.url.path}: {exc!r}")
    return JSONResponse(
        status_code=500,
        content={"detail": f"Unhandled AI service error: {type(exc).__name__}: {exc}"},
    )


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "transcription_provider": "deepgram",
        "deepgram_model": DEEPGRAM_MODEL,
        "language": DEEPGRAM_LANGUAGE or "auto",
        "deepgram_enabled": bool(DEEPGRAM_API_KEY),
        "deepgram_api_base_url": DEEPGRAM_API_BASE_URL,
        "openai_enabled": bool(OPENAI_API_KEY),
        "ffmpeg_path": FFMPEG_PATH,
        "whisper_model": None,
        "whisper_cache_dir": None,
        "chroma_persist_dir": CHROMA_PERSIST_DIR,
        "vector_backend": _vector_backend_name,
        "vector_warning": str(CHROMA_IMPORT_ERROR) if CHROMA_IMPORT_ERROR else None,
    }


@app.post("/transcribe-chunk")
def transcribe_chunk(request: TranscribeChunkRequest) -> dict[str, Any]:
    try:
        audio_bytes = base64.b64decode(request.audio_base64)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid audio payload.") from exc

    suffix = ".webm"
    if request.mime_type and "/" in request.mime_type:
        suffix = f".{request.mime_type.split('/')[-1].split(';')[0]}"

    audio_path = normalize_audio_to_wav(audio_bytes, suffix)
    try:
        transcript_text = transcribe_audio(audio_path, request.prompt)
    finally:
        audio_path.unlink(missing_ok=True)

    if not transcript_text:
        return {"accepted": False, "reason": "No confident speech detected."}

    timestamp = request.timestamp or ""
    segment_id = f"{request.meeting_id}:{timestamp or uuid.uuid4().hex}:{uuid.uuid4().hex[:8]}"

    if get_openai_client() is not None:
        try:
            upsert_transcript_segments(
                request.meeting_id,
                [
                    TranscriptSegment(
                        id=segment_id,
                        speaker=request.speaker,
                        text=transcript_text,
                        timestamp=timestamp,
                    )
                ],
            )
        except Exception:
            # Indexing can fail independently without blocking live transcription.
            pass

    return {
        "accepted": True,
        "segment_id": segment_id,
        "text": transcript_text,
        "timestamp": timestamp,
    }


@app.post("/finalize-meeting")
def finalize_meeting(request: FinalizeMeetingRequest) -> dict[str, Any]:
    if not request.transcript:
        return {"status": "ok", "indexed_count": 0}

    if get_openai_client() is None:
        return {
            "status": "ok",
            "indexed_count": 0,
            "warning": "OPENAI_API_KEY is missing. Transcript was not indexed for Q&A.",
        }

    indexed_count = reindex_meeting(request.meeting_id, request.transcript)
    return {"status": "ok", "indexed_count": indexed_count}


@app.post("/summarize-meeting")
def summarize_meeting(request: SummarizeMeetingRequest) -> dict[str, Any]:
    if not request.transcript:
        return {
            "executive_summary": "No transcript was captured for this meeting, so an AI summary could not be generated.",
            "action_items": [],
            "key_decisions": [],
        }

    summary = summarize_with_llm(request.title, request.transcript)
    if get_openai_client() is not None:
        try:
            reindex_meeting(request.meeting_id, request.transcript)
        except Exception:
            pass
    return summary


@app.post("/ask")
def ask_question(request: AskRequest) -> dict[str, Any]:
    if not normalize_whitespace(request.question):
        raise HTTPException(status_code=400, detail="Question is required.")

    return answer_with_llm(request.meeting_id, request.question, request.transcript)
