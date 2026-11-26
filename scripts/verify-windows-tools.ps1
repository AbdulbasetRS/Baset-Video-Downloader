$ErrorActionPreference = 'Stop'
$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$toolsRoot = Join-Path $root 'resources/tools/win32-x64'
$ffmpegRoot = Join-Path $toolsRoot 'ffmpeg'
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
# Shared FFmpeg builds depend on DLLs shipped beside the executables.
$env:PATH = "$ffmpegRoot;$env:PATH"

$ffmpegOutput = @(& $ffmpeg -version 2>&1)
$ffmpegExitCode = $LASTEXITCODE
$ffmpegVersion = ($ffmpegOutput | Select-Object -First 1).ToString()
if ($ffmpegExitCode -ne 0) {
  $details = ($ffmpegOutput | ForEach-Object { $_.ToString() }) -join [Environment]::NewLine
  throw "FFmpeg failed its version check (exit code $ffmpegExitCode). Output: $details"
}

$ffprobeOutput = @(& $ffprobe -version 2>&1)
$ffprobeExitCode = $LASTEXITCODE
$ffprobeVersion = ($ffprobeOutput | Select-Object -First 1).ToString()
if ($ffprobeExitCode -ne 0) {
  $details = ($ffprobeOutput | ForEach-Object { $_.ToString() }) -join [Environment]::NewLine
  throw "ffprobe failed its version check (exit code $ffprobeExitCode). Output: $details"
}
Write-Host "yt-dlp: $ytVersion"
Write-Host "Node: $nodeVersion"
Write-Host $ffmpegVersion
Write-Host $ffprobeVersion
Write-Host 'All bundled Windows tools passed their smoke checks.' -ForegroundColor Green
