@echo off
REM Windows batch script to run full ML pipeline
REM Run this script to train models and start API server

echo ========================================
echo   Cardiac Insight AI - ML Pipeline
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.9 or higher
    pause
    exit /b 1
)

echo Step 1: Checking setup...
python setup.py
if errorlevel 1 (
    echo ERROR: Setup failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Step 2: Preparing Data
echo ========================================
echo.
python data_preparation.py
if errorlevel 1 (
    echo ERROR: Data preparation failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Step 3: Training Models
echo ========================================
echo This may take 10-30 minutes...
echo.
python train_models.py
if errorlevel 1 (
    echo ERROR: Model training failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo   SUCCESS! All models trained
echo ========================================
echo.
echo Next steps:
echo   1. Start API server:
echo      python api.py
echo.
echo   2. Test API:
echo      curl http://localhost:8000/health
echo.
echo   3. View documentation:
echo      http://localhost:8000/docs
echo.
pause
