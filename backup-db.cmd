@echo off
echo Exporting Dentzy Databases (Local and Remote D1) to Excel...
cd /d "%~dp0backend"
node scripts\backup-db.js
pause
