# BVD GitHub Releases & In-App Updates

## Current implementation
The source currently uses a small custom GitHub Releases client (not `electron-updater`). It reads the latest stable release through the GitHub API, checks the version tag, downloads the correct Installer or Portable EXE, validates its SHA-256 against `checksums.txt`, and then hands off replacement/installation to a detached PowerShell script after the current BVD process exits.

## Installed build
1. The user presses Check for Updates.
2. BVD queries the stable latest GitHub Release. Drafts and prereleases are excluded by GitHub's `/releases/latest` endpoint.
3. BVD compares the release version with the running app version.
4. If an update is available, it shows the version and release notes and waits for the user's explicit download action.
5. BVD downloads the checksum list and the versioned setup EXE, showing download progress, then verifies the package SHA-256.
6. After verification, BVD remains open and displays a separate **Restart and install** action. No application shutdown or relaunch occurs automatically after download.
7. Only after the user chooses **Restart and install** does a detached PowerShell helper wait for the running process to exit, run the NSIS installer silently, and relaunch BVD.
8. If any step fails before handoff, the current app remains installed and the error is shown.

## Portable build
The portable build follows the same release lookup and SHA-256 verification. It downloads and stages the new portable EXE while BVD remains open. Only after the user chooses **Restart and install** does a detached PowerShell helper wait for BVD to exit, replace the portable executable, and relaunch it. This path requires a writable folder and must be validated on Windows before it is advertised as stable.

## Publishing
- `.github/workflows/ci.yml` runs Windows quality checks and bundle build on pushes and pull requests.
- `.github/workflows/release.yml` runs on `v*` tags, prepares tools, checks them, packages Installer and Portable x64 files, generates `checksums.txt`, and publishes a GitHub Release.
- The repository must contain a release asset named `BVD-Setup-<version>-x64.exe`, `BVD-Portable-<version>-x64.exe`, and `checksums.txt` for in-app updates.
- Keep all publishing credentials in GitHub, never in the app or repository.

## Trust and limitations
The first builds are unsigned; Windows SmartScreen may warn. Do not instruct users to disable Defender or SmartScreen. The update process has source-level SHA-256 verification but still needs a full two-version end-to-end test on Windows.
