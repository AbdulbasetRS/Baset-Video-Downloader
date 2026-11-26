# BVD Implementation Roadmap — current source status

This roadmap describes the current `0.2.0` release candidate. “Implemented in source” is not the same as “tested on Windows”; see `docs/STATUS-AND-CONTINUATION.md` for the validation boundary.

## Phase 0 — Decisions and setup
- [x] Confirm repository owner/name: `AbdulbasetRS/Baset-Video-Downloader`.
- [x] Configure MIT as the candidate license; maintainer should review before public release.
- [x] Configure Windows x64 build and release workflows.

## Phase 1 — Project foundation
- [x] Electron + React + TypeScript + Vite scaffold.
- [x] Main/preload/renderer security boundary.
- [x] Design tokens, Manrope/Cairo, Lucide-only icons.
- [x] Window, title bar, collapsible sidebar, footer, themes, language and RTL.
- [x] Home, Downloads, History, Settings and About screens.

## Phase 2 — Task model and UX
- [x] Compact/Expanded task cards and download filters.
- [x] URL preview and playlist-entry review/selection.
- [x] Persistent task history and user preferences using electron-store JSON.
- [x] Per-task format, quality, audio, subtitle, trim, folder and filename options.
- [x] Queue controls, bulk actions, retry, rename, open file and open folder.

## Phase 3 — Notifications and sounds
- [x] In-app notifications and native Windows notifications.
- [x] Replaceable WAV sounds, event toggles, tests and restore defaults.
- [ ] Verify notifications and sound playback on clean Windows 10/11 machines.

## Phase 4 — Downloader engine
- [x] yt-dlp process adapter and metadata/format/subtitle discovery.
- [x] Windows tool preparation for yt-dlp, Node runtime and FFmpeg/ffprobe.
- [x] Single URL and playlist queue, per-item tasks, progress, pause/resume/cancel/retry.
- [x] Output verification, file size, history, open folder, rename.
- [ ] End-to-end tests against permitted public URLs for all options and source families.

## Phase 5 — Updates and packaging
- [x] GitHub Releases update check and SHA-256 validation.
- [x] NSIS installer and Portable x64 builder configuration.
- [x] GitHub Actions Windows CI and release workflows.
- [ ] Build and test the actual Windows EXEs; perform installer and update tests.

## Phase 6 — Release QA
- [ ] `npm ci`, typecheck, lint and tests on Windows.
- [ ] Test Arabic/English, RTL/LTR, Light/Dark/System, accessibility and reduced motion.
- [ ] Test download errors, network loss, disk-full, interrupted downloads and playlist edge cases.
- [ ] Test setup, uninstall, portable startup and both update paths.
- [ ] Confirm license and third-party notices before publishing.

Do not describe the candidate as production-ready until all release acceptance checks pass.
