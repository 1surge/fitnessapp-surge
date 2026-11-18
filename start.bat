@echo off
setlocal
cd /d "%~dp0"
set PORT=8778
where python >nul 2>nul
if errorlevel 1 goto filemode
start "" "http://localhost:%PORT%/index.html"
echo FORGE is running at http://localhost:%PORT%/index.html
echo Close this window to stop the server.
python -m http.server %PORT%
goto :eof
:filemode
echo Python not found - opening the app directly from disk.
start "" "%~dp0index.html"
