$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$toolsRoot = Join-Path $root 'resources/tools/win32-x64'
$ffmpegRoot = Join-Path $toolsRoot 'ffmpeg'
$licensesRoot = Join-Path $toolsRoot 'licenses'
$fontLicensesRoot = Join-Path $root 'resources/licenses'
$tempRoot = Join-Path $env:RUNNER_TEMP 'bvd-tools'

New-Item -ItemType Directory -Force -Path $toolsRoot, $ffmpegRoot, $licensesRoot, $fontLicensesRoot, $tempRoot | Out-Null

function Get-GitHubAsset($Repository, $AssetName) {
  $headers = @{ 'User-Agent' = 'Baset-Video-Downloader-Build'; 'Accept' = 'application/vnd.github+json' }
  if ($env:GITHUB_TOKEN) {
    $headers['Authorization'] = "Bearer $($env:GITHUB_TOKEN)"
  }
  $release = Invoke-RestMethod -Uri "https://api.github.com/repos/$Repository/releases/latest" -Headers $headers
  $asset = $release.assets | Where-Object { $_.name -eq $AssetName } | Select-Object -First 1
  if (-not $asset) { throw "Could not find '$AssetName' in the latest $Repository release." }
  return @{ Release = $release; Asset = $asset }
}

# yt-dlp standalone binary and the upstream third-party license inventory.
$yt = Get-GitHubAsset 'yt-dlp/yt-dlp' 'yt-dlp.exe'
$ytSums = Get-GitHubAsset 'yt-dlp/yt-dlp' 'SHA2-256SUMS'
$ytPath = Join-Path $tempRoot 'yt-dlp.exe'
$ytSumsPath = Join-Path $tempRoot 'yt-dlp-SHA2-256SUMS'
$ytLicensePath = Join-Path $licensesRoot 'yt-dlp-THIRD_PARTY_LICENSES.txt'
Invoke-WebRequest -Uri $yt.Asset.browser_download_url -OutFile $ytPath
Invoke-WebRequest -Uri $ytSums.Asset.browser_download_url -OutFile $ytSumsPath
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/yt-dlp/yt-dlp/$($yt.Release.tag_name)/THIRD_PARTY_LICENSES.txt" -OutFile $ytLicensePath
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/yt-dlp/yt-dlp/$($yt.Release.tag_name)/LICENSE" -OutFile (Join-Path $licensesRoot 'yt-dlp-LICENSE.txt')
$expectedLine = Get-Content $ytSumsPath | Where-Object { $_ -match '\s+yt-dlp\.exe$' } | Select-Object -First 1
if (-not $expectedLine) { throw 'yt-dlp checksum entry is missing.' }
$expectedHash = ($expectedLine -split '\s+')[0].ToLowerInvariant()
$sha256 = [System.Security.Cryptography.SHA256]::Create()
$ytStream = [System.IO.File]::OpenRead($ytPath)
try {
  $actualHash = [BitConverter]::ToString($sha256.ComputeHash($ytStream)).Replace('-', '').ToLowerInvariant()
}
finally {
  $ytStream.Dispose()
  $sha256.Dispose()
}
if ($expectedHash -ne $actualHash) { throw 'yt-dlp SHA-256 verification failed.' }
Copy-Item $ytPath (Join-Path $toolsRoot 'yt-dlp.exe') -Force

# FFmpeg LGPL static build. A static package avoids missing-DLL failures on clean Windows installations.
$ffHeaders = @{ 'User-Agent' = 'Baset-Video-Downloader-Build'; 'Accept' = 'application/vnd.github+json' }
if ($env:GITHUB_TOKEN) {
  $ffHeaders['Authorization'] = "Bearer $($env:GITHUB_TOKEN)"
}
$ffRelease = Invoke-RestMethod -Uri 'https://api.github.com/repos/FFmpeg-Builds/FFmpeg-Builds/releases/latest' -Headers $ffHeaders
$ffAsset = $ffRelease.assets | Where-Object { $_.name -like 'ffmpeg-n8.1-*-win64-lgpl-8.1.zip' } | Select-Object -First 1
if (-not $ffAsset) { throw "Could not find a current win64 LGPL static FFmpeg archive in release $($ffRelease.tag_name)." }
$ff = @{ Release = $ffRelease; Asset = $ffAsset }
$ffArchive = Join-Path $tempRoot 'ffmpeg-lgpl-static.zip'
$ffExtract = Join-Path $tempRoot 'ffmpeg-extracted'
Invoke-WebRequest -Uri $ff.Asset.browser_download_url -OutFile $ffArchive
if (Test-Path $ffExtract) { Remove-Item $ffExtract -Recurse -Force }
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::ExtractToDirectory($ffArchive, $ffExtract)
$bin = Get-ChildItem -Path $ffExtract -Directory -Recurse | Where-Object { (Test-Path (Join-Path $_.FullName 'ffmpeg.exe')) -and (Test-Path (Join-Path $_.FullName 'ffprobe.exe')) } | Select-Object -First 1
if (-not $bin) { throw 'FFmpeg archive did not contain ffmpeg.exe and ffprobe.exe.' }
Get-ChildItem $ffmpegRoot -Force | Remove-Item -Recurse -Force
Copy-Item -Path (Join-Path $bin.FullName '*') -Destination $ffmpegRoot -Recurse -Force

# Copy the Node runtime provisioned by actions/setup-node; yt-dlp uses it for supported JS extraction.
$nodeCommand = Get-Command node.exe -CommandType Application -ErrorAction Stop | Select-Object -First 1
Copy-Item $nodeCommand.Source (Join-Path $toolsRoot 'node.exe') -Force
$nodeLicense = Join-Path (Split-Path $nodeCommand.Source -Parent) 'LICENSE'
if (Test-Path $nodeLicense) { Copy-Item $nodeLicense (Join-Path $licensesRoot 'node-LICENSE.txt') -Force }
Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/FFmpeg/FFmpeg/master/COPYING.LGPLv2.1' -OutFile (Join-Path $licensesRoot 'FFmpeg-LGPL-2.1.txt')

# Keep the font license texts beside the distributed desktop application.
foreach ($fontPackage in @('cairo', 'manrope')) {
  $licenseSource = Join-Path $root "node_modules/@fontsource/$fontPackage/LICENSE"
  if (-not (Test-Path $licenseSource)) { throw "Font license file is missing: $licenseSource" }
  Copy-Item $licenseSource (Join-Path $fontLicensesRoot "$fontPackage-OFL-1.1.txt") -Force
}

# Save exact upstream build identifiers for reproducible reporting.
@{
  ytDlpRelease = $yt.Release.tag_name
  ytDlpSha256 = $actualHash
  ffmpegRelease = $ff.Release.tag_name
  ffmpegAsset = $ff.Asset.name
  nodeVersion = (& (Join-Path $toolsRoot 'node.exe') --version).Trim()
  ffmpegLicense = 'LGPL static build from FFmpeg-Builds/FFmpeg-Builds; see upstream source and licensing notes.'
} | ConvertTo-Json -Depth 4 | Set-Content (Join-Path $toolsRoot 'tool-versions.json') -Encoding UTF8

Write-Host 'BVD Windows tools prepared and yt-dlp checksum verified.' -ForegroundColor Green
 } | Select-Object -First 1
if (-not $ffAsset) { throw "Could not find a current win64 LGPL static FFmpeg archive in release $($ffRelease.tag_name)." }
$ff = @{ Release = $ffRelease; Asset = $ffAsset }
$ffArchive = Join-Path $tempRoot 'ffmpeg-lgpl-static.zip'
$ffExtract = Join-Path $tempRoot 'ffmpeg-extracted'
Invoke-WebRequest -Uri $ff.Asset.browser_download_url -OutFile $ffArchive
if (Test-Path $ffExtract) { Remove-Item $ffExtract -Recurse -Force }
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::ExtractToDirectory($ffArchive, $ffExtract)
$bin = Get-ChildItem -Path $ffExtract -Directory -Recurse | Where-Object { (Test-Path (Join-Path $_.FullName 'ffmpeg.exe')) -and (Test-Path (Join-Path $_.FullName 'ffprobe.exe')) } | Select-Object -First 1
if (-not $bin) { throw 'FFmpeg archive did not contain ffmpeg.exe and ffprobe.exe.' }
Get-ChildItem $ffmpegRoot -Force | Remove-Item -Recurse -Force
Copy-Item -Path (Join-Path $bin.FullName '*') -Destination $ffmpegRoot -Recurse -Force

# Copy the Node runtime provisioned by actions/setup-node; yt-dlp uses it for supported JS extraction.
$nodeCommand = Get-Command node.exe -CommandType Application -ErrorAction Stop | Select-Object -First 1
Copy-Item $nodeCommand.Source (Join-Path $toolsRoot 'node.exe') -Force
$nodeLicense = Join-Path (Split-Path $nodeCommand.Source -Parent) 'LICENSE'
if (Test-Path $nodeLicense) { Copy-Item $nodeLicense (Join-Path $licensesRoot 'node-LICENSE.txt') -Force }
Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/FFmpeg/FFmpeg/master/COPYING.LGPLv2.1' -OutFile (Join-Path $licensesRoot 'FFmpeg-LGPL-2.1.txt')

# Keep the font license texts beside the distributed desktop application.
foreach ($fontPackage in @('cairo', 'manrope')) {
  $licenseSource = Join-Path $root "node_modules/@fontsource/$fontPackage/LICENSE"
  if (-not (Test-Path $licenseSource)) { throw "Font license file is missing: $licenseSource" }
  Copy-Item $licenseSource (Join-Path $fontLicensesRoot "$fontPackage-OFL-1.1.txt") -Force
}

# Save exact upstream build identifiers for reproducible reporting.
@{
  ytDlpRelease = $yt.Release.tag_name
  ytDlpSha256 = $actualHash
  ffmpegRelease = $ff.Release.tag_name
  ffmpegAsset = $ff.Asset.name
  nodeVersion = (& (Join-Path $toolsRoot 'node.exe') --version).Trim()
  ffmpegLicense = 'LGPL static build from FFmpeg-Builds/FFmpeg-Builds; see upstream source and licensing notes.'
} | ConvertTo-Json -Depth 4 | Set-Content (Join-Path $toolsRoot 'tool-versions.json') -Encoding UTF8

Write-Host 'BVD Windows tools prepared and yt-dlp checksum verified.' -ForegroundColor Green
