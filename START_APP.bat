@echo off
REM Start the application server on port 8080

cd /d "d:\Heart-attack prediction 2\cardiac-insight-ai"

REM Build the app first
echo Building application...
call npm run build

REM Wait a moment
timeout /t 2 /nobreak

REM Start HTTP server on port 8080
echo.
echo Starting server on port 8080...
echo.
echo The app will be available at: http://localhost:8080/
echo.
http-server dist -p 8080 -c-1

REM If you want to use npm dev instead, uncomment below:
REM npm run dev
