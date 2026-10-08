@echo off
chcp 65001 >nul
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\launch.ps1"
if errorlevel 1 (
    echo.
    echo 新版启动失败，请检查提示。可以双击“安装依赖.bat”修复依赖。
    pause
)
