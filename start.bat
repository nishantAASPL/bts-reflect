@echo off
REM BTS ReflectAI - Startup Batch File
REM This script installs dependencies and starts the development server

echo.
echo ====================================================
echo   BTS ReflectAI - Development Server
echo ====================================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
    echo.
)

REM Start the development server
echo Starting development server...
echo.
echo The app will open at: http://localhost:5173
echo Press Ctrl+C to stop the server
echo.
call npm run dev

pause
