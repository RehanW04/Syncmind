import sys
import os
try:
    import whisper
except ImportError:
    print("Error: openai-whisper not installed. Run 'pip install openai-whisper'.", file=sys.stderr)
    sys.exit(1)

model_name = "base.en"
print(f"Loading '{model_name}' model...", file=sys.stderr)
model = whisper.load_model(model_name)
print("READY", flush=True)

for line in sys.stdin:
    filepath = line.strip()
    if not filepath:
        continue
    
    if filepath == "EXIT":
        break

    if not os.path.exists(filepath):
        print(f"ERROR: File not found - {filepath}", flush=True)
        continue

    try:
        result = model.transcribe(filepath, fp16=False)
        text = result["text"].strip()
        print(f"RESULT: {text}", flush=True)
    except Exception as e:
        print(f"ERROR: {str(e)}", flush=True)
    finally:
        try:
            os.remove(filepath)
        except:
            pass
