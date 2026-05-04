const AI_SERVICE_URL = (process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

async function postJson(path, payload, timeoutMs = 30000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${AI_SERVICE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data?.detail || data?.error || `AI service request failed with status ${response.status}`;
      const error = new Error(message);
      error.status = response.status;
      error.payload = data;
      error.aiDetail = data?.detail || null;
      throw error;
    }

    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`AI service request to ${path} timed out after ${timeoutMs}ms.`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function getAiServiceUrl() {
  return AI_SERVICE_URL;
}

export async function transcribeMeetingChunk({
  meetingId,
  speaker,
  timestamp,
  audioBase64,
  mimeType,
  prompt
}) {
  return postJson('/transcribe-chunk', {
    meeting_id: meetingId,
    speaker,
    timestamp,
    audio_base64: audioBase64,
    mime_type: mimeType || 'audio/webm',
    prompt: prompt || ''
  }, 45000);
}

export async function finalizeMeetingTranscript({ meetingId, transcript }) {
  return postJson('/finalize-meeting', {
    meeting_id: meetingId,
    transcript
  }, 45000);
}

export async function summarizeMeeting({ meetingId, title, transcript }) {
  return postJson('/summarize-meeting', {
    meeting_id: meetingId,
    title,
    transcript
  }, 60000);
}

export async function askMeetingQuestion({ meetingId, question, transcript }) {
  return postJson('/ask', {
    meeting_id: meetingId,
    question,
    transcript
  }, 45000);
}
