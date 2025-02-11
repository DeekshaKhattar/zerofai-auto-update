@echo off
setlocal enabledelayedexpansion

rem Get the current date
for /f "tokens=1-3 delims=.-/ " %%a in ('date /t') do (
    set currentDate=%%c-%%a-%%b
)

rem Iterate through all user profiles in the Users directory
for /d %%u in (C:\Users\*) do (
    if exist "%%u\AppData\Roaming\ZerofAI\logs\main.log" (
        echo Processing user: %%~nU
        copy "%%u\AppData\Roaming\ZerofAI\logs\main.log" "%%u\AppData\Roaming\ZerofAI\logs\main-!currentDate!.log"
        echo. > "%%u\AppData\Roaming\ZerofAI\logs\main.log"
    )
)
echo All users processed.