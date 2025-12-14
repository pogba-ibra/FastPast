@echo off
echo ========================================
echo Starting MongoDB for FastPast
echo ========================================
echo.

echo Checking if MongoDB is already running...
netstat -ano | findstr :27017 > nul
if %errorlevel% equ 0 (
    echo [OK] MongoDB is already running on port 27017!
    echo.
    pause
    exit /b 0
)

echo MongoDB is not running. Starting it now...
echo.
echo IMPORTANT: This window must stay open for MongoDB to run!
echo Press Ctrl+C to stop MongoDB when you're done.
echo.
echo ========================================
echo.

REM Try to start MongoDB
mongod --dbpath "C:\data\db"

REM If the above fails, it might be a path issue
if %errorlevel% neq 0 (
    echo.
    echo ========================================
    echo ERROR: Failed to start MongoDB
    echo ========================================
    echo.
    echo Possible issues:
    echo 1. MongoDB is not installed or not in PATH
    echo 2. Data directory doesn't exist
    echo.
    echo Creating data directory and trying again...
    
    REM Create data directory if it doesn't exist
    if not exist "C:\data\db" (
        mkdir "C:\data\db"
        echo Created C:\data\db directory
    )
    
    echo.
    echo Retrying...
    mongod --dbpath "C:\data\db"
)

pause
