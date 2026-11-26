# Changelog

## [0.2.0] — Windows release candidate

### Added
- Real yt-dlp-based metadata preview and download task execution.
- Playlist review with per-entry selection and independent queued tasks (up to 500 preview entries).
- Per-task format, quality, audio extraction, subtitle, time-range, output-directory and output-name options.
- Persistent download queue/history and preferences using electron-store.
- Pause, resume, cancel, retry, bulk actions, rename, open file and open folder.
- In-app and native Windows notifications with replaceable WAV sounds.
- GitHub Releases update check, SHA-256 verification, and installer/portable update handoff.
- Windows x64 NSIS and Portable packaging configuration and GitHub Actions workflows.
- Upstream tool preparation for yt-dlp, FFmpeg/ffprobe and Node.js.

### Fixed
- Prevented a waiting task that was paused during tool resolution from starting.
- Prevented a successful downloader exit without an existing output file from being marked completed.
- Added name-collision protection when renaming downloaded files.
- Added visible update download progress and safe process-exit handoff before replacing/installing the application.

### Validation status
- Source-level UI policy scan and TypeScript/TSX syntax parsing pass in the current environment.
- Full npm typecheck, lint, Vitest suite, Electron package build, and Windows runtime validation remain pending because dependencies could not be installed and this environment is Linux.
- GitHub Actions is configured to perform the Windows build after the source is pushed.
