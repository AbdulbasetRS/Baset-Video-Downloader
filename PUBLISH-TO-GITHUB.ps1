$ErrorActionPreference = 'Stop'
$repoUrl = 'https://github.com/AbdulbasetRS/Baset-Video-Downloader.git'
$branch = 'main'
$tag = 'v0.2.0'

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  throw 'Git is required. Install Git for Windows, then run this script again.'
}
if (-not (Test-Path '.git')) { git init }
git branch -M $branch
$remote = git remote get-url origin 2>$null
if ($LASTEXITCODE -ne 0 -or -not $remote) {
  git remote add origin $repoUrl
} elseif ($remote -notmatch 'AbdulbasetRS/Baset-Video-Downloader') {
  throw "The current origin is '$remote'. This script will not push to an unexpected repository."
}
git add -A
$staged = git diff --cached --name-only
if (-not $staged) { Write-Host 'No changes to commit.' } else {
  Write-Host ''
  Write-Host 'The following files are staged for the public GitHub repository:' -ForegroundColor Cyan
  git diff --cached --stat
  $confirmation = Read-Host 'Type PUBLISH to commit and push this complete source tree'
  if ($confirmation -cne 'PUBLISH') { throw 'Publishing canceled. No push was performed.' }
  git commit -m 'Prepare BVD Windows release candidate'
  if ($LASTEXITCODE -ne 0) { throw 'Git commit failed. Configure your Git identity and try again.' }
}
if (-not $staged) {
  $confirmation = Read-Host 'No source changes are staged. Type PUBLISH to push the current branch and tag'
  if ($confirmation -cne 'PUBLISH') { throw 'Publishing canceled. No push was performed.' }
}
git push -u origin $branch
if ($LASTEXITCODE -ne 0) { throw 'Push to GitHub failed. Authenticate with Git Credential Manager or GitHub CLI, then retry.' }
if (-not (git tag --list $tag)) { git tag -a $tag -m 'Baset Video Downloader 0.2.0' }
git push origin $tag
if ($LASTEXITCODE -ne 0) { throw 'Tag push failed.' }
Write-Host 'Source pushed. Open the Actions tab and follow the Windows release workflow.' -ForegroundColor Green
