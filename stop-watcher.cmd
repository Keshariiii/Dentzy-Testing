@echo off
echo Stopping any running Dentzy Watcher background processes...
taskkill /f /fi "WINDOWTITLE eq DentzyWatcher*" >nul 2>&1
echo Dentzy Watcher stopped.
pause
