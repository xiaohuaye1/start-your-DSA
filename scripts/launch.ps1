$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$electronExe = Join-Path $projectRoot 'node_modules\electron\dist\electron.exe'
if (-not (Test-Path -LiteralPath $electronExe)) {
    Write-Host '缺少 JavaScript 桌面运行时，请先双击“安装依赖.bat”。' -ForegroundColor Yellow
    exit 1
}
Set-Location -LiteralPath $projectRoot
$env:ELECTRON_RUN_AS_NODE = $null
& $electronExe $projectRoot
exit $LASTEXITCODE
