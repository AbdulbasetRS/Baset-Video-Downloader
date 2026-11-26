# BVD Architecture — 0.2.0 release candidate

## Runtime layers

- **Electron main process** owns app startup, persistent state, download processes, OS dialogs, notifications, file operations and update installation.
- **Preload** exposes a narrow typed API. Renderer does not receive Node integration or direct filesystem access.
- **React renderer** owns the bilingual interface, task cards, preferences and notification presentation.
- **Shared contracts** define IPC names, task/settings shapes, URL validation and application configuration.

## Main services

- `settings-store.ts`: lazy `electron-store` initialization after Electron is ready; stores preferences and window bounds.
- `services/task-store.ts`: persistent download tasks and history using `electron-store` JSON.
- `services/downloader.ts`: metadata preview, yt-dlp process orchestration, playlist expansion, per-task options, progress/state persistence, and file actions.
- `services/notifications.ts`: localized in-app and Windows notifications, sound files and user-overridable WAV files.
- `services/updates.ts`: custom GitHub Releases lookup, version comparison, binary download progress, SHA-256 verification, and Windows installer/portable update handoff.

## Download runtime

Windows x64 packages include separate executables for yt-dlp, Node.js (used by yt-dlp JavaScript extraction), FFmpeg and ffprobe, plus their required FFmpeg shared DLLs. BVD launches yt-dlp as a child process with shell execution disabled. It does not embed platform logos, browser credentials, or bypass DRM/access controls.

## Storage and trust boundaries

Preferences and download tasks are stored as JSON through electron-store in the Electron user-data directory. IPC payloads are validated with Zod. Sender origin is checked before privileged handlers run. External URLs pass through an allowlist. Renderer context isolation, disabled Node integration, sandboxing, and a restrictive Content Security Policy are enabled.

## Release caveat

The source is a Windows x64 release candidate. A complete TypeScript/lint/test/build run and clean Windows runtime tests remain required before production-ready status.
