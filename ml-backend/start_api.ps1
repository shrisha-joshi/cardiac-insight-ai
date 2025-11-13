# Start the FastAPI ML Backend Server
Set-Location "d:\Heart-attack prediction 2\cardiac-insight-ai\ml-backend"
Write-Host "Starting FastAPI server on http://localhost:8002..." -ForegroundColor Green
uvicorn api:app --host 127.0.0.1 --port 8002 --reload
