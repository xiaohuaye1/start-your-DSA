$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot
if (Test-Path -LiteralPath '.venv\Scripts\python.exe') {
    $pythonCommand = Join-Path $projectRoot '.venv\Scripts\python.exe'
} else {
    $pythonCommand = (Get-Command python -ErrorAction Stop).Source
}
& $pythonCommand -c 'import PySide6.QtCore'
if ($LASTEXITCODE -ne 0) {
    & $pythonCommand -m pip install -e .
    if ($LASTEXITCODE -ne 0) { throw 'Python 依赖安装失败。' }
}
$manifest = Get-Content -LiteralPath 'package.json' -Raw -Encoding UTF8 | ConvertFrom-Json
$javascriptReady = $true
foreach ($dependency in @($manifest.dependencies.PSObject.Properties) + @($manifest.devDependencies.PSObject.Properties)) {
    $dependencyManifest = Join-Path $projectRoot ('node_modules\' + $dependency.Name + '\package.json')
    try {
        $installed = Get-Content -LiteralPath $dependencyManifest -Raw -Encoding UTF8 | ConvertFrom-Json
        if ($installed.version -ne $dependency.Value) { $javascriptReady = $false; break }
        if ($installed.main -and -not (Test-Path -LiteralPath (Join-Path (Split-Path -Parent $dependencyManifest) $installed.main))) {
            $javascriptReady = $false
            break
        }
    } catch {
        $javascriptReady = $false
        break
    }
}
if ($javascriptReady) {
    Write-Host 'JavaScript 依赖已安装，跳过重复安装。' -ForegroundColor Green
} else {
    $npmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue
    $pnpmCommand = Get-Command pnpm.cmd -ErrorAction SilentlyContinue
    $bundledPnpm = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd'
    if ($pnpmCommand) {
        & $pnpmCommand.Source install
    } elseif ($npmCommand) {
        & $npmCommand.Source install
    } elseif (Test-Path -LiteralPath $bundledPnpm) {
        & $bundledPnpm install
    } else {
        throw '请先安装 Node.js LTS（包含 npm），再运行本脚本。'
    }
    if ($LASTEXITCODE -ne 0) { throw 'JavaScript 依赖安装失败。' }
}
$electronExe = Join-Path $projectRoot 'node_modules\electron\dist\electron.exe'
if (-not (Test-Path -LiteralPath $electronExe)) {
    $nodeCommand = Get-Command node -ErrorAction SilentlyContinue
    $bundledNode = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
    if ($nodeCommand) { $nodeExe = $nodeCommand.Source }
    elseif (Test-Path -LiteralPath $bundledNode) { $nodeExe = $bundledNode }
    else { throw '找不到 Node.js。' }
    & $nodeExe '.\node_modules\electron\install.js'
    if ($LASTEXITCODE -ne 0) { throw 'Electron 运行时下载失败。' }
}
Write-Host '安装完成，请双击“启动.bat”。' -ForegroundColor Green
