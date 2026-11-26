# BVD Technical Architecture v1.0

## Recommended stack
- **Electron** for the Windows desktop shell and native integration.
- **React + TypeScript + Vite** for the renderer UI.
- **Lucide React** as the only icon family.
- **CSS variables / CSS Modules** for design tokens and component styling (avoid unnecessary UI kits and avoid Tailwind if it makes the UI inconsistent).
- **Zustand** for renderer state where appropriate.
- **electron-store** for small preferences.
- **SQLite** (for example `better-sqlite3`, with proper Electron native-module rebuilds) for history and task metadata.
- **yt-dlp** as the source-extraction/download engine, with **FFmpeg/ffprobe**, `yt-dlp-ejs`, and the supported JavaScript runtime required by the pinned yt-dlp release.
- **electron-builder** for Windows packaging (NSIS installer + portable distribution).
- **Custom GitHub Releases update service** for stable-version checks, SHA-256-verified EXE downloads, and Windows installer/portable handoff.
- **Vitest + React Testing Library** for UI/unit tests; Playwright or Electron's supported e2e tooling for critical desktop flows.

Use current stable compatible releases at implementation time. Do not blindly pin versions copied from this document. Consult official docs, commit the lockfile, and document chosen versions.

## Process boundaries
### Main process
Responsible for:
- OS/window lifecycle and app identity.
- Safe filesystem operations and file dialogs.
- SQLite and settings persistence.
- Starting/stopping child processes for yt-dlp and FFmpeg.
- Parsing structured progress events and managing concurrency.
- Notification delivery and sound asset paths.
- Update checks/download/install orchestration.
- Validating all renderer IPC requests.

### Preload
Expose a minimal typed API only. No generic `ipcRenderer` exposure. Validate/shape payloads and use an explicit allowlist of channels.

### Renderer
React UI only. No direct Node APIs, shell calls, filesystem access, raw process execution, or arbitrary IPC channel names.

### Download engine adapter
Wrap yt-dlp behind a typed `DownloaderService` interface so the UI is not coupled to CLI details. Do not build commands by concatenating untrusted strings. Use `spawn(executable, argsArray, { shell: false })`.

## Dependency distribution
End users should not need Python, Node.js, or a separately installed FFmpeg. Prepare a reproducible Windows build pipeline that includes or stages verified official runtime binaries:
- yt-dlp Windows executable or another officially supported standalone package.
- FFmpeg and ffprobe binaries.
- yt-dlp-ejs package/data required by the pinned yt-dlp release.
- A supported JS runtime if the selected yt-dlp release/source requires one.

Do not commit large third-party binaries to source unless there is a clear licensing and maintenance reason. Prefer a script that downloads pinned releases from official upstream sources during CI/build, verifies checksums/signatures where upstream provides them, and copies them into the app resources. Record exact versions, download URLs, licenses, and checksums in a dependency manifest. Review the license of every binary before redistribution. Never fetch executables from unknown mirrors.

## Download orchestration
- Each task gets an immutable task ID and an independent options object.
- The main process owns queue state and task lifecycle.
- Support configurable concurrency with a conservative default (for example 2 active downloads).
- Use one process per task unless a documented engine constraint requires another design.
- Parse progress using machine-readable yt-dlp output/progress templates; avoid fragile localized console scraping.
- Distinguish metadata resolution, waiting, transfer, post-processing, completion, and failure.
- On completion, verify final file existence and read actual size from the filesystem.
- Pause/resume/cancel behavior must match actual engine support; if an operation cannot safely resume, explain and offer restart.
- Keep source adapter failures isolated so one failed playlist item does not crash the queue.

## Metadata and formats
Use yt-dlp JSON output for metadata and format discovery. Treat all metadata as untrusted text. Sanitize text rendered in the UI. Only show formats, bitrates, subtitles, and trimming controls supported by the selected media and toolchain. An estimated size should be labelled approximate if not exact.

## Data model (minimum)
- `DownloadTask`: id, sourceUrl (stored cautiously), sourceName, title, description, thumbnailUrl, duration, createdAt, updatedAt, status, progress, downloadedBytes, totalBytes?, speed?, eta?, outputPath?, actualSize?, errorCode?, errorMessage?, options.
- `DownloadOptions`: formatId/container, quality selector, audioOnly, audioQuality?, startTime?, endTime?, subtitleEnabled, subtitleLanguages[], subtitleFormat?, outputDirectory, outputName, embedMetadata?, embedThumbnail?.
- `AppSettings`: theme, language, sidebarMode, cardMode, defaultDirectory, maxConcurrentDownloads, notifications, sounds, updatePolicy.

Do not persist credentials or browser cookies.

## Proposed repository structure
```text
Baset-Video-Downloader/
├── build/
│   ├── icons/
│   └── entitlements/
├── docs/
│   ├── BRAND-GUIDELINES.md
│   ├── UI-UX-SPECIFICATION.md
│   ├── ARCHITECTURE.md
│   ├── NOTIFICATIONS-AND-SOUNDS.md
│   ├── UPDATES-AND-RELEASES.md
│   └── USER-GUIDE.md
├── public/
│   ├── fonts/
│   ├── logo/
│   └── sounds/
├── scripts/
│   ├── prepare-tools.*
│   └── verify-toolchain.*
├── src/
│   ├── main/
│   ├── preload/
│   ├── renderer/
│   ├── shared/
│   └── services/
│       └── downloader/
├── tests/
├── .github/workflows/
├── electron-builder.yml
├── package.json
├── README.md
├── CHANGELOG.md
├── CONTRIBUTING.md
├── SECURITY.md
└── LICENSE (only after license selection is confirmed)
```

## Build targets
1. Windows x64 NSIS installer: primary recommended download and supports managed in-app update.
2. Windows x64 portable package: run without a traditional installation; update check offers a manual release download rather than attempting to overwrite a running executable.

## Important limitations
- Website support changes over time. Display a helpful unsupported-source error and keep the downloader adapter modular.
- Never bypass DRM, paywalls, privacy restrictions, or access controls.
- Windows unsigned builds may trigger SmartScreen warnings; explain code-signing requirements and never instruct users to disable Windows security.
