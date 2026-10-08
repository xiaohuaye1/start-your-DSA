@echo off
chcp 65001 >nul
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\install.ps1"
if errorlevel 1 goto failed
echo 安装完成，请双击“启动.bat”。
pause
exit /b 0
:failed
echo 安装失败，请检查 Python、Node.js 和网络连接。
pause
exit /b 1
