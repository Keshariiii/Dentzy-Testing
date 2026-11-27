Set WshShell = CreateObject("WScript.Shell")
scriptDir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
cmd = "cmd /c ""cd /d """ & scriptDir & "\backend"" && title DentzyWatcher && node scripts\watch-backup.js"""
WshShell.Run cmd, 0, False
WScript.Echo "Dentzy Database Live Watcher is now running silently in the background!"
