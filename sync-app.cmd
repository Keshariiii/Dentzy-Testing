@echo off
echo Running Dentzy App Backup to 'C:\dentzy testing backup'...
powershell -ExecutionPolicy Bypass -File "%~dp0scripts\sync-backup.ps1"
pause
