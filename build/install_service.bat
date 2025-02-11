@echo off

REM ================================================
REM ZerofaiService Installation and Setup Script
REM ================================================

REM Define the service name
set SERVICE_NAME=ZerofaiService

REM First kill any existing pythonservice processes
taskkill /F /IM pythonservice.exe /T 2>nul

REM Wait for process termination
timeout /t 4 > nul

REM Check Python executable paths
set PYTHON_PATH=C:\Program Files\Python312\Scripts\pip.exe
set PYTHON_EXEC=C:\Program Files\Python312\python.exe

if not exist "%PYTHON_PATH%" (
    echo Warning: Python pip not found at %PYTHON_PATH%
    set PYTHON_PATH=%USERPROFILE%\AppData\Local\Programs\Python\Python312\Scripts\pip.exe
)
if not exist "%PYTHON_EXEC%" (
    echo Warning: Python executable not found at %PYTHON_EXEC%
    set PYTHON_EXEC=%USERPROFILE%\AppData\Local\Programs\Python\Python312\python.exe
)

REM Validate Python installation
if not exist "%PYTHON_EXEC%" (
    echo ERROR: Python executable not found.
    pause
    exit /b 1
)

if not exist "%PYTHON_PATH%" (
    echo ERROR: pip not found.
    pause
    exit /b 1
)

REM ========================================================
REM Fetch the Active Logged-in User using PowerShell only
REM ========================================================
for /f "delims=" %%A in ('powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-WMIObject -Class Win32_ComputerSystem | Select-Object -ExpandProperty UserName"') do (
    set "LOGGED_IN_USER=%%A"
)

REM Extract username from DOMAIN\USERNAME format
for /f "tokens=2 delims=\" %%B in ("%LOGGED_IN_USER%") do (
    set "LOGGED_IN_USER=%%B"
)

REM Ensure that LOGGED_IN_USER is valid
if not defined LOGGED_IN_USER (
    echo ERROR: Unable to determine the logged-in user.
    pause
    exit /b 1
)

echo Detected Logged-in User: %LOGGED_IN_USER%
set USER_PROFILE_PATH=C:\Users\%LOGGED_IN_USER%
echo User profile path: %USER_PROFILE_PATH%

REM Save the profile path to a .env file
echo. >> "%~dp0.env"
echo USER_PROFILE_PATH=%USER_PROFILE_PATH% >> "%~dp0.env"
echo Profile path saved to .env file.

REM ================================================
REM Install required Python packages
REM ================================================
echo Installing required Python packages...
for %%f in ("%~dp0\*.whl") do (
    echo Installing %%~nxf...
    "%PYTHON_PATH%" install "%%f"
)

REM ====================================================
REM Check if the service already exists and restart it
REM ====================================================
sc query "%SERVICE_NAME%" | findstr /I /C:"RUNNING" > nul
if %errorlevel% == 0 (
    echo Service "%SERVICE_NAME%" is already running. Restarting...
    sc stop "%SERVICE_NAME%"
    timeout /t 3 > nul
    sc start "%SERVICE_NAME%"
    exit /b 0
)

REM ================================================
REM Install the service
REM ================================================
echo Installing %SERVICE_NAME%...
"%PYTHON_EXEC%" "%~dp0\zerofai_service.py" --startup=auto install

if errorlevel 1 (
    echo ERROR: Failed to install the service.
    exit /b 1
)

REM Wait for the installation to complete
timeout /t 4 > nul

REM Start the service
echo Starting %SERVICE_NAME%...
sc start "%SERVICE_NAME%"

if errorlevel 1 (
    echo ERROR: Failed to start the service.
    exit /b 1
)

echo %SERVICE_NAME% successfully installed and started.
pause