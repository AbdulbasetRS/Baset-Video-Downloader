> **Historical handoff prompt.** This document describes the original build plan and is retained for design history only. It is not the current implementation specification. The current implementation and test boundary are documented in `README.md`, `docs/ARCHITECTURE.md`, and `docs/STATUS-AND-CONTINUATION.md`. In particular, the updater is a custom GitHub Releases/checksum implementation rather than `electron-updater`.

# MASTER PROMPT — Build Baset Video Downloader (BVD) from Scratch

You are acting as a senior cross-functional desktop product team: Product Designer, Windows Desktop Engineer, React/TypeScript Engineer, Download Engine Engineer, QA Engineer, Security Reviewer, and Open-Source Maintainer.

Your assignment is to **create a working Windows desktop application from scratch in the current workspace**, not merely describe how to build it. Read every supplied BVD handoff file before coding. Treat `docs/UI-UX-SPECIFICATION-v1.3.md` and `docs/BRAND-GUIDELINES-v1.2.md` as mandatory product requirements. The brand files in `brand/` are the approved assets. `docs/TECHNICAL-ARCHITECTURE.md`, `docs/NOTIFICATIONS-AND-SOUNDS.md`, `docs/UPDATES-AND-RELEASES.md`, and `docs/IMPLEMENTATION-ROADMAP.md` define the implementation baseline.

If a requirement conflicts with an earlier mockup or generic template, the latest v1.3 written specification wins.

---

## 1. Product identity

- Product name: **Baset Video Downloader**
- Short name: **BVD**
- Windows application, Windows 10/11 x64 first.
- Developer attribution: **by AbdulBaset R. Sayed**
- GitHub profile: `https://github.com/AbdulBasetRS`
- Proposed GitHub repository: `AbdulBasetRS/Baset-Video-Downloader`
- App ID suggestion: `com.abdulbasetrs.bvd`
- Initial version: `0.1.0` during development; do not claim a stable `1.0.0` until release criteria pass.

Keep owner/repository/version in one central configuration module. Verify that the GitHub repository exists and is controlled by the owner before enabling live update checks or release publishing. Never put a GitHub token in frontend code or commit one.

## 2. Mandatory design rules — do not violate

1. **No emojis** anywhere in the shipped application, notifications, dialogs, UI sample data, screenshots, empty states, or documentation examples.
2. **No platform logos or platform brand images** anywhere. Do not use YouTube/TikTok/Facebook/Instagram/X logos, icon packs, screenshots, or promotional platform imagery. Show platform names as text only, optionally accompanied by neutral Lucide icons (`Globe`, `Video`, `Link`, `ListVideo`).
3. **Lucide icons only** (`lucide-react`) for all interface icons. Do not mix icon libraries.
4. Real video thumbnails are allowed only when fetched as the actual thumbnail belonging to a user-selected media item. If no thumbnail exists, show a neutral generic video icon inside a solid placeholder. Never replace a missing thumbnail with a platform logo.
5. All app page, panel, card, sidebar, splash, modal, and empty-state backgrounds must be solid flat colors. No gradients, wallpaper, decorative photo, mesh/aurora, or unrelated illustration backgrounds.
6. The BVD logo may retain the approved blue identity design. Place it centered on a solid background on the splash/loading screen with a restrained soft shadow.
7. The logo animation must be subtle: vertical float up to 4px, scale variation no more than about 1.2%, around 4.8 seconds ease-in-out, one short 520ms entrance. No spins, bouncing, flashes, or fast pulse. Disable nonessential motion for `prefers-reduced-motion: reduce`. Keep the Windows app icon static.
8. Use Manrope for English and Cairo for Arabic. Bundle fonts locally and respect their licenses. English LTR; Arabic RTL. Switching language must not require restart.
9. The selected default theme is **System**; support explicit Light and Dark overrides.
10. Sidebar supports Expanded and Collapsed, both user-selectable and persisted. Download cards support Compact and Expanded, both user-selectable and persisted. First-run card mode is Compact.

## 3. Technology stack — implement this baseline

Use current compatible stable versions at the time of implementation, checking official documentation before choosing exact version numbers:

- Electron (desktop shell/main process)
- React + TypeScript + Vite (renderer)
- Lucide React (single icon family)
- CSS variables / CSS Modules (solid design tokens; avoid unnecessary UI frameworks)
- Zustand only where shared renderer state is useful
- electron-store for simple preferences
- SQLite for task/history persistence; if using `better-sqlite3`, configure/rebuild its native module for Electron and document the build process
- yt-dlp as the download/metadata engine
- FFmpeg + ffprobe for merging and post-processing
- `yt-dlp-ejs` and a currently supported JavaScript runtime required by the pinned yt-dlp release/source
- electron-builder for Windows NSIS installer and portable build
- electron-updater for the installed NSIS build's GitHub Releases updates
- Vitest + React Testing Library for unit/UI tests; add desktop e2e tests for critical flows

Do not silently substitute a web-only app, browser extension, or command-line-only tool. The result must be a Windows desktop application.

## 4. Security architecture

Use strict Electron process separation:
- Main process: OS integration, windows, native notifications, filesystem, dialogs, SQLite, downloader child processes, update manager.
- Preload: minimal typed API only. Expose an explicit allowlist; never expose raw `ipcRenderer`.
- Renderer: React only; no Node APIs, filesystem, shell, process spawning, or arbitrary IPC.

Required settings:
- `contextIsolation: true`
- `nodeIntegration: false`
- sandbox enabled where compatible
- strict Content Security Policy
- validate every IPC payload in the main process
- validate and normalize paths
- accept only expected protocols for user source URLs
- never concatenate untrusted strings into shell commands
- use `spawn(executable, argsArray, { shell: false })`
- do not collect URLs, filenames, history, or activity telemetry by default
- redact sensitive URL query parameters from logs
- do not store passwords or browser cookies

## 5. Downloader engine

Implement an adapter/service boundary so the UI never calls yt-dlp directly.

Use yt-dlp for source metadata, format discovery, single-media downloads, and playlists when supported by its current extractors. Use FFmpeg/ffprobe for separate audio/video merging, conversion, trim operations, and output inspection where supported.

### Toolchain distribution
The end user must not need to install Python, Node.js, or FFmpeg manually. Build scripts and CI must stage the required official binaries into the packaged resources. Keep a dependency manifest containing exact tool versions, official download URLs, checksums/signatures where available, and license information. Download only from official upstream release sources; verify checksums. Do not use random mirrors. Review redistribution terms for every bundled binary before publishing.

Do not commit large binaries to source unless justified. A reproducible `scripts/prepare-tools` step should fetch pinned approved versions and verify them. Package yt-dlp, FFmpeg/ffprobe, yt-dlp-ejs, and its required JS runtime as applicable to the pinned tool version.

### Supported use and legal boundaries
The app is for media the user owns, created, or is authorized to download. Do not implement DRM circumvention, paywall bypass, private content access, login-wall bypass, CAPTCHA bypass, or other access-control evasion. Do not instruct users to bypass a platform's terms or protections. Website extractors change; never promise universal compatibility. Show a clear unsupported-source message and keep source adapters modular.

### Required task behavior
- Single URL and playlist URL.
- Multiple URLs pasted line-by-line.
- Metadata preview before queueing where possible.
- Per-task independent options: format, quality, audio-only, subtitle language/format, time range, save path, filename, metadata/thumbnail embedding when supported.
- Do not show unavailable formats/qualities/subtitles as selectable.
- Playlist review: list entries, select/deselect, choose all/selected, apply defaults, then allow per-entry overrides.
- Queue with configurable concurrency; first-run default may be 2 simultaneous transfers.
- Explicit states: Resolving, FetchingMetadata, Waiting, Downloading, Paused, PostProcessing, Completed, Failed, Canceled.
- Progress must be honest: use percentage only when total is known; otherwise show indeterminate state and downloaded bytes/speed if available.
- Parse machine-readable progress output; do not scrape localized terminal text if structured output is possible.
- On completion, wait for post-processing, verify the output exists, and query its actual size before marking Completed.
- Pause/resume/cancel must reflect actual engine capability. If safe resume is not supported for a source, explain and offer restart.
- Keep failed playlist items isolated where possible.
- Open File, Open Folder, Rename, Retry, Copy Source Link.
- History removal must never delete the actual media file.

## 6. Screens and interaction requirements

Implement these pages with consistent shared shell:
1. Home
2. Downloads
3. History
4. Settings
5. About

Home contains URL input, paste/clear, Download/Add, metadata preview, filters, queue cards, bulk actions, and playlist review.

Downloads page has search, filtering, sort, bulk selection/actions, and Compact/Expanded display.

History displays actual file details, completed/failed status, date, format, output size/path and file actions.

Settings sections:
- General
- Appearance (System/Light/Dark; sidebar mode; default card mode)
- Language (English/Arabic)
- Downloads (folder, concurrency, duplicate policy)
- Video
- Audio
- Subtitles
- Notifications & Sounds
- Updates
- Advanced (logs, diagnostics, reset)

About shows BVD logo, name, current version, developer attribution, GitHub profile/repository, license status, changelog/release notes, and **Check for Updates**.

All pages must work in Light, Dark, System, Arabic RTL, and English LTR.

## 7. Notification system — required feature

Create both:
- In-app toasts/notification center.
- Native Windows desktop notifications (Electron Notification API) when enabled and supported.

Provide localized notifications for:
- Task queued.
- Download started (only after transfer really begins).
- Download completed (only after final output exists and actual file size is read).
- Download failed.
- Paused.
- Resumed.
- Optional canceled event (off by default).
- Update available.
- Update downloaded/ready to install.

Clicking a notification should bring BVD forward and navigate to/highlight the related task where possible. Do not show full file paths or secret URL parameters in notifications. Avoid focus stealing.

### Sound effects
Use the provided original WAV files in `assets/notification-sounds/` as initial placeholders:
- `download-queued.wav`
- `download-started.wav`
- `download-completed.wav`
- `download-failed.wav`
- `download-paused.wav`
- `download-resumed.wav`
- `update-available.wav`

Copy defaults once into a user-writable directory under BVD user data (for example `%APPDATA%/Baset Video Downloader/sounds/`) on first launch. Never overwrite customized user files on later launches. The settings screen must provide:
- In-app notification master switch
- Windows desktop notification master switch
- Sound master switch
- Per-event enable toggles
- Volume slider 0–100 (initial default about 40)
- Play/Test button for each sound
- Open Sounds Folder button
- Restore Default Sounds button
- Optional custom WAV picker per event

Validate audio files, handle missing files gracefully, and never block a download because audio playback failed. Coalesce repeated playlist notifications so a batch of completions does not play a noisy sequence. Never play a sound on each progress tick.

On Windows, implement customizable sound playback inside the app with a safe local audio player (Web Audio/HTML audio after the first user gesture unlocks audio). Display native Windows toast separately. Do not claim that Electron's native Windows toast accepts the custom WAV sound in the same manner documented for macOS. Avoid duplicate default toast audio plus app sound where possible.

## 8. GitHub update system — required feature

Primary public repository is intended to be `AbdulBasetRS/Baset-Video-Downloader`; verify it exists before enabling live update publishing. Keep owner/repo in a central config.

### Installed app
Use `electron-builder` + `electron-updater` with GitHub Releases provider and Windows **NSIS** target. The release must publish installer assets and updater metadata (for example `latest.yml`).

Update UX:
1. User clicks **Check for Updates**.
2. Query latest stable public GitHub Release. Ignore drafts and prereleases for stable channel.
3. Compare semantic versions.
4. Show “You are up to date” or a localized update-available dialog with version, release date, and notes.
5. Ask before downloading.
6. Show download progress; permit cancellation before install is scheduled.
7. Use updater metadata integrity/checksum validation. Never download/execute an arbitrary executable URL.
8. If downloads are active, defer restart/install and explain. Never interrupt active downloads without explicit user approval.
9. After successful download, let user choose Restart Now or Later.
10. On failure, keep the existing app functional and provide the official GitHub Releases page.

Auto-check on startup is optional and disabled or conservative by default; make it a user preference. No forced updates for ordinary releases.

### Portable app
Portable builds may check the latest release and notify the user, but must provide a manual release-page download/update guide. Never attempt to overwrite a running portable executable or promise silent self-update for the portable package.

### GitHub Actions
Create a Windows x64 release workflow triggered by a version tag such as `v1.0.0`. Build NSIS + portable artifacts, generate updater metadata and checksums, create a GitHub Release, attach the artifacts, and upload release notes. Use `GITHUB_TOKEN`/GitHub Actions secrets only in CI. No tokens in repo or app. Test with a staging/prerelease before stable release.

Explain that Windows SmartScreen warnings may occur for a new unsigned app. Do not claim the app is code-signed unless a valid certificate is configured. Never tell users to disable Defender or SmartScreen.

## 9. Branding and UI rules

Use the supplied assets:
- `brand/logo/bvd-mark.svg`
- `brand/logo/bvd-logo-dark.svg`
- `brand/logo/bvd-logo-light.svg`
- `brand/logo/bvd-logo-horizontal.svg`
- `brand/icons/bvd-app-icon.ico`
- supplied PNG variants
- `brand/motion/bvd-logo-motion.css`

Do not invent a replacement logo without asking. Use the BVD mark for centered splash/empty-state use and static app icon. Use Manrope/Cairo locally. Use the approved color values from the brand guideline and UI spec.

Footer:
- Left: `by AbdulBaset R. Sayed` + GitHub profile link.
- Right: app version + GitHub repository link.
- Never show a made-up repository URL if not configured.

## 10. Open-source project and packaging

Prepare the repository with:
- README.md with product overview, screenshots (no platform logos), features, installation, usage, limitations, development instructions, release downloads, credits/licenses.
- CHANGELOG.md
- CONTRIBUTING.md
- SECURITY.md
- dependency/license inventory
- GitHub issue/PR templates if practical
- GitHub Actions workflow
- build scripts for toolchain preparation
- NSIS installer and portable x64 output

Do not create a final LICENSE file until the maintainer confirms the license choice. MIT is a suggested option, not a confirmed decision. Clearly mark license as “To be selected” in development documentation and ask the maintainer before publishing a public release.

A normal user must not need Node, Python, or FFmpeg installed separately. They should download the installer and run it, or download/unzip the portable build and launch BVD.exe. Explain all actual prerequisites honestly.

## 11. Quality gates

Before declaring the application complete:
- `npm install` / lockfile reproducibility.
- TypeScript typecheck.
- ESLint.
- Unit/UI tests.
- Build renderer and Electron main/preload.
- Build Windows x64 NSIS and portable artifacts on Windows CI.
- Run app smoke tests on a clean Windows 10/11 x64 environment.
- Test all theme/language/direction combinations.
- Test card modes/sidebar modes persistence.
- Test notification and WAV playback preferences.
- Test failed/missing/corrupt sounds.
- Test downloads via local fixture/mock sources and authorized public test material; do not depend on a specific live third-party site for the unit test suite.
- Test unsupported/private/removed source error handling.
- Test interrupted transfer, disk full, invalid path, malformed URL, unknown size, and post-processing failure.
- Test installer and portable builds.
- Test update from one staging version to a newer staging release, including no-update/offline/failure cases.
- Verify that the update flow never interrupts an active download without confirmation.
- Scan UI strings/assets for emojis and platform logos; scan backgrounds for gradients or decorative artwork.
- Confirm no tokens, cookies, personal links, or secrets are committed.

## 12. Working method

Do not answer with a plan only. Inspect the current workspace and supplied handoff files, then create the real source code and configuration files.

Work in these ordered phases and keep the project buildable after each phase:
1. Workspace audit and architecture notes.
2. Project scaffold, Electron security boundary, scripts, and app window.
3. Complete UI shell and all screens with realistic mock data.
4. Theme, Arabic/English localization, RTL/LTR, typography, and logo motion.
5. Notification service, Windows notifications, WAV assets, settings, test buttons, and replacement folder.
6. Downloader toolchain scripts and yt-dlp/FFmpeg adapter.
7. Queue, metadata, per-task options, playlists, progress, history, file operations.
8. GitHub updater, installer/portable packaging, and GitHub Actions release workflow.
9. Tests, security review, documentation, and release checklist.

At the end of each phase:
- Run relevant tests/build/typecheck/lint.
- Fix errors before advancing.
- Report changed files, completed behavior, test results, known blockers, and the exact next phase.
- Do not claim functionality that is only mocked. Clearly label mock UI until the real engine is integrated.
- If context/time limits prevent the whole project in one session, leave a coherent working checkpoint and a precise continuation prompt for the next phase. Never create huge placeholder files or claim success without evidence.

Start now by reading the supplied handoff documents and auditing the workspace. Then implement Phase 1 and continue sequentially while keeping the project runnable. Make reasonable engineering choices without repeatedly asking basic questions already answered above. Only ask the maintainer when a genuinely blocking decision remains (for example final LICENSE selection or repository credentials that cannot be inferred).
