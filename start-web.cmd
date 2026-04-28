@echo off
REM EcoPop web: uses npm.cmd (not npx.ps1) so PowerShell execution policy cannot block it.
REM Dev server URL: http://localhost:8090 (port is set in package.json "web" script).
cd /d "%~dp0"
echo Starting EcoPop for web...
echo Open http://localhost:8090 when the bundler is ready.
echo If port 8090 is in use, edit package.json "web" script to another port.
call npm.cmd run web
if errorlevel 1 (
  echo.
  echo Failed. Try: netstat -ano ^| findstr :8090
  echo Then end the process with Task Manager or: taskkill /PID ^<pid^> /F
  pause
)
