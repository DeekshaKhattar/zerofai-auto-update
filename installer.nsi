
RequestExecutionLevel admin
Section OutputPath
    SetOutPath $INSTDIR
    WriteUninstaller "$INSTDIR\uninstall.exe"
SectionEnd

SilentInstall silent
SilentUninstall silent

Section PythonInstall
    SetOutPath $INSTDIR\resources
    File "${BUILD_RESOURCES_DIR}\python_installer.exe"
    File "${BUILD_RESOURCES_DIR}\psutil-5.9.8-cp37-abi3-win_amd64.whl"
    File "${BUILD_RESOURCES_DIR}\getmac-0.9.4-py2.py3-none-any.whl"
    File "${BUILD_RESOURCES_DIR}\pywin32-306-cp312-cp312-win_amd64.whl"
    File "${BUILD_RESOURCES_DIR}\charset_normalizer-3.3.2-py3-none-any.whl"
    File "${BUILD_RESOURCES_DIR}\idna-3.7-py3-none-any.whl"
    File "${BUILD_RESOURCES_DIR}\urllib3-2.2.1-py3-none-any.whl"
    File "${BUILD_RESOURCES_DIR}\certifi-2024.2.2-py3-none-any.whl"
    File "${BUILD_RESOURCES_DIR}\requests-2.31.0-py3-none-any.whl"
    File "${BUILD_RESOURCES_DIR}\python_dotenv-1.0.1-py3-none-any.whl"
    ExecWait '"$INSTDIR\resources\python_installer.exe" /quiet InstallAllUsers=1 PrependPath=1 Include_test=0'
SectionEnd

Section ServiceInstall
    SetOutPath $INSTDIR\resources
    FileOpen $0 "$INSTDIR\resources\zerofaiservicelog.txt" w
    FileClose $0
    Sleep 5000 ; Wait 5 seconds
    SetOutPath $INSTDIR\resources
    File "${BUILD_RESOURCES_DIR}\zerofai_service.py"
    File "${BUILD_RESOURCES_DIR}\install_service.bat"
    File "${BUILD_RESOURCES_DIR}\.env"
    Sleep 5000 ; Wait 5 seconds
    ExecWait '"$INSTDIR\resources\install_service.bat"'
    Pop $0
SectionEnd


Section TaskSchedularSentimentInstall
    SetOutPath $INSTDIR\resources
    File "${BUILD_RESOURCES_DIR}\system_health.py"
    ExecWait 'schtasks /create /sc daily /mo 1 /tn "System Health Check Task 1.1" /tr "\"C:\Program Files\Python312\python.exe\" \"$INSTDIR\resources\system_health.py\"" /st 10:00 /ru SYSTEM /rl HIGHEST /f'
    ExecWait 'schtasks /create /sc daily /mo 1 /tn "System Health Check Task 1.2" /tr "\"C:\Program Files\Python312\python.exe\" \"$INSTDIR\resources\system_health.py\"" /st 15:00 /ru SYSTEM /rl HIGHEST /f'
    Sleep 5000
    ExecWait 'schtasks /run /tn "System Health Check Task 1.1"'
SectionEnd

Section TaskSchedularComplianceInstall
    Sleep 5000
    SetOutPath $INSTDIR\resources
    File "${BUILD_RESOURCES_DIR}\compliance_check.py"
    ExecWait 'schtasks /create /sc daily /mo 1 /tn "Compliance Check Task" /tr "\"C:\Program Files\Python312\python.exe\" \"$INSTDIR\resources\compliance_check.py\"" /st 12:00 /ru SYSTEM /rl HIGHEST /f'
    ExecWait 'schtasks /run /tn "Compliance Check Task"'
SectionEnd

Section TaskSchedularSelfHealInstall
    Sleep 5000
    SetOutPath $INSTDIR\resources
    File "${BUILD_RESOURCES_DIR}\self_heal.py"
    ExecWait 'schtasks /create /sc daily /mo 1 /tn "Self Heal Task 1.1" /tr "\"C:\Program Files\Python312\python.exe\" \"$INSTDIR\resources\self_heal.py\"" /st 12:30 /ru SYSTEM /rl HIGHEST /f'
    ExecWait 'schtasks /create /sc daily /mo 1 /tn "Self Heal Task 1.2" /tr "\"C:\Program Files\Python312\python.exe\" \"$INSTDIR\resources\self_heal.py\"" /st 15:30 /ru SYSTEM /rl HIGHEST /f'
    ExecWait 'schtasks /run /tn "Self Heal Task 1.1"'
SectionEnd

Section TaskSchedularAgentVerificationInstall
    SetOutPath $INSTDIR\resources
    File "${BUILD_RESOURCES_DIR}\agent_verification.py"
    ExecWait 'schtasks /create /sc daily /mo 1 /tn "ZerofAI Verification 1.1" /tr "\"C:\Program Files\Python312\python.exe\" \"$INSTDIR\resources\agent_verification.py\"" /st 12:00 /ru SYSTEM /rl HIGHEST /f'
    ExecWait 'schtasks /create /sc daily /mo 1 /tn "ZerofAI Verification 1.2" /tr "\"C:\Program Files\Python312\python.exe\" \"$INSTDIR\resources\agent_verification.py\"" /st 15:30 /ru SYSTEM /rl HIGHEST /f'
    Sleep 5000
    ExecWait 'schtasks /run /tn "ZerofAI Verification 1.1"'
SectionEnd

Section "TaskSchedularLogReplicationInstall"
    Sleep 5000
    SetOutPath $INSTDIR\resources
    File "${BUILD_RESOURCES_DIR}\replicate_main_log.bat"
    ExecWait 'schtasks /create /sc weekly /d MON,THU /tn "ZerofAI Log Refresh Task" /tr "\"$INSTDIR\resources\replicate_main_log.bat\"" /st 12:00 /ru SYSTEM /rl HIGHEST /f'
    ExecWait 'schtasks /run /tn "ZerofAI Log Refresh Task"'
SectionEnd

Section "Uninstall"
    ; Stop the ZerofAIService
    ExecWait 'sc stop ZerofAIService'

    ; Wait for the service to stop
    Sleep 10000

    ; Delete the ZerofAIService
    ExecWait 'sc delete ZerofAIService'

    ; Wait for the service removal
    Sleep 5000

    ; Delete the service log file
    Delete "$INSTDIR\resources\zerofaiservicelog.txt"

    ; Uninstall Python silently
    ExecWait '"C:\Program Files\Python310\python.exe" -m pip uninstall -y pywin32 psutil requests getmac'

    ; Delete the scheduled task
    ExecWait 'schtasks /delete /tn "System Health Check Task 1.1" /f'
    ExecWait 'schtasks /delete /tn "System Health Check Task 2.1" /f'
    ExecWait 'schtasks /delete /tn "System Health Check Task 1.2" /f'
    ExecWait 'schtasks /delete /tn "System Health Check Task 2.2" /f'

    ; Delete the scheduled task
    ExecWait 'schtasks /delete /tn "Compliance Check Task" /f'

    ; Delete the scheduled task
    ExecWait 'schtasks /delete /tn "Self Heal Task 1.1" /f'

     ; Delete the scheduled task
    ExecWait 'schtasks /delete /tn "Self Heal Task 1.2" /f'

    ; Delete the scheduled task
    ExecWait 'schtasks /delete /tn "ZerofAI Log Refresh Task" /f'

    ; Delete the scheduled task
    ExecWait 'schtasks /delete /tn "ZerofAI Verification 1.1" /f'

    ; Delete the scheduled task
    ExecWait 'schtasks /delete /tn "ZerofAI Verification 1.2" /f'

    ; Wait for the task deletion
    Sleep 5000

    ; Delete the ZerofAI folder
    Delete "$INSTDIR\*.*"
    ; Remove the installation directory
    RMDir /r "$INSTDIR"
SectionEnd