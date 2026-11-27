@echo off
echo Starting Dentzy Database Live Change Watcher (Excel Exporter)...
cd /d "%~dp0backend"
node scripts\watch-backup.js
