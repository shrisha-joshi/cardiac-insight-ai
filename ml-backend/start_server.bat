@echo off
REM Start FastAPI server
echo ========================================
echo   Starting ML API Server
echo ========================================
echo.
echo API will be available at:
echo   - API:    http://localhost:8000
echo   - Docs:   http://localhost:8000/docs
echo   - Health: http://localhost:8000/health
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

python api.py

pause
