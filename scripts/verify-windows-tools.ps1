$ErrorActionPreference = 'Stop'
$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$toolsRoot = Join-Path $root 'resources/tools/win32-x64'
$ytDlp = Join-Path $toolsRoot 'yt-dlp.exe'
$node = Join-Path $toolsRoot 'node.exe'
$ffmpeg = Join-Path $toolsRoot 'ffmpeg/ffmpeg.exe'
$ffprobe = Join-Path $toolsRoot 'ffmpeg/ffprobe.exe'
foreach ($path in @($ytDlp, $node, $ffmpeg, $ffprobe)) {
  if (-not (Test-Path $path -PathType Leaf)) { throw "Required BVD runtime tool is missing: $path" }
}
$ytVersion = (& $ytDlp --version).Trim()
if ($LASTEXITCODE -ne 0) { throw 'yt-dlp failed its version check.' }
$nodeVersion = (& $node --version).Trim()
if ($LASTEXITCODE -ne 0) { throw 'Bundled Node runtime failed its version check.' }
$ffmpegVersion = (& $ffmpeg -version 2>&1 | Select-Object -First 1).ToString()
if ($LASTEXITCODE -ne 0) { throw 'FFmpeg failed its version check.' }
$ffprobeVersion = (& $ffprobe -version 2>&1 | Select-Object -First 1).ToString()
if ($LASTEXITCODE -ne 0) { throw 'ffprobe failed its version check.' }
Write-Host "yt-dlp: $ytVersion"
Write-Host "Node: $nodeVersion"
Write-Host $ffmpegVersion
Write-Host $ffprobeVersion
Write-Host 'All bundled Windows tools passed their smoke checks.' -ForegroundColor Green
