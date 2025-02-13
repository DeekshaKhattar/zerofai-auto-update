@echo off
REM Reinstall Windows Service
sc create ZerofAIService binPath= "%INSTDIR%\resources\zerofai_service.py" start= auto
sc start ZerofAIService

REM Recreate Scheduled Tasks
schtasks /create /sc daily /st 01:00 /tn "System Health Check Task 1.1" /tr "\"C:\Program Files\Python312\python.exe\" \"%INSTDIR%\resources\system_health.py\"" /ru SYSTEM /rl HIGHEST /f
schtasks /create /sc daily /st 01:00 /tn "System Health Check Task 1.2" /tr "\"C:\Program Files\Python312\python.exe\" \"%INSTDIR%\resources\system_health.py\"" /ru SYSTEM /rl HIGHEST /f

@REM schtasks /create /sc daily /st 19:00 /tn "System Health Check Task 1.2" /tr "\"C:\Program Files\Python312\python.exe\" \"%INSTDIR%\resources\complaince_check.py\"" /ru SYSTEM /rl HIGHEST /f

REM Delete marker file
del "%APPDATA%\electron-app\update-in-progress"