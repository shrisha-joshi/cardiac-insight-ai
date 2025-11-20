Write-Host "Starting Cardiac Insight AI Full Stack..." -ForegroundColor Green

# 1. Install Python Dependencies
Write-Host "Installing Python ML dependencies..." -ForegroundColor Yellow
pip install -r "ml-backend/requirements.txt"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to install Python dependencies." -ForegroundColor Red
    exit 1
}

# 2. Start Python Backend (Background)
Write-Host "Starting Python ML Backend (Port 8000)..." -ForegroundColor Yellow
# Using Start-Process to run in a new window/background so it doesn't block
$backendProcess = Start-Process -FilePath "uvicorn" -ArgumentList "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload" -WorkingDirectory "ml-backend" -PassThru
Write-Host "Backend started with PID: $($backendProcess.Id)" -ForegroundColor Green

# 3. Start Frontend
Write-Host "Starting React Frontend..." -ForegroundColor Yellow
npm run dev
