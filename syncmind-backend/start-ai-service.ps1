$pythonPath = if ($env:AI_SERVICE_PYTHON_PATH) {
  $env:AI_SERVICE_PYTHON_PATH
} elseif ($env:WHISPER_PYTHON_PATH) {
  $env:WHISPER_PYTHON_PATH
} else {
  'C:\Users\rehan\AppData\Local\Programs\Python\Python310\python.exe'
}

if (-not (Test-Path $pythonPath)) {
  Write-Error "Python executable not found at $pythonPath. Set AI_SERVICE_PYTHON_PATH to the correct path."
  exit 1
}

& $pythonPath -m uvicorn ai_service.app:app --host 127.0.0.1 --port 8000 --reload
