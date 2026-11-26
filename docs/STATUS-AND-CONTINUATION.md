# BVD build status — 0.2.0 release candidate

This document separates implemented source code from validation that still must happen on Windows. Do not interpret a source implementation as proof of a successful Windows release.

## Source implementation status

| Area | Source status | Validation status |
|---|---|---|
| Electron/React shell, security, themes, languages, RTL/LTR | Implemented in source | Existing Phase 1 tests were reported by the original handoff; must be rerun against this updated tree |
| Download queue and task persistence | Implemented using electron-store JSON; queued items resume on startup while interrupted active transfers are paused | Not yet runtime-tested here |
| Metadata preview and yt-dlp process runner | Implemented | Requires bundled Windows tools and live source URLs |
| Playlist expansion | Implemented, capped at 500 preview entries | Requires live playlist tests |
| Per-task format, quality, subtitles, range, folder and output name | Implemented in UI/IPC/service | Requires end-to-end tests |
| Pause/resume/cancel/retry and file actions | Implemented | Requires real downloads on Windows |
| In-app + Windows notifications and replaceable WAV sounds | Implemented | Requires Windows desktop test |
| GitHub update checks and SHA-256 verified update install | Implemented in source | Requires an actual published release and two-version upgrade test |
| NSIS + portable packaging | Configured in electron-builder and GitHub Actions | Not built or tested from this Linux environment |
| MIT license and third-party notices | Added | Maintainer should review before public release |

## Important environment limitation

This session environment is Linux and Node.js `22.16.0`. The project now requires Node `22.22.2` or later in the Node 22 line, and dependency installation was blocked by npm registry DNS/network errors. Therefore `npm ci`, TypeScript checks, lint, tests, Electron packaging and Windows runtime verification could not be completed in this environment. A Windows GitHub Actions runner is configured to perform those steps after the source is pushed.

## Build workflow

- `.github/workflows/ci.yml`: Windows quality checks and app bundle build on pushes and pull requests.
- `.github/workflows/release.yml`: on a version tag, fetches yt-dlp/FFmpeg/Node runtime binaries, verifies yt-dlp checksum, validates the binaries, builds NSIS and Portable x64 EXEs, generates SHA-256 checksums, and publishes a GitHub Release.
- `scripts/prepare-windows-tools.ps1`: downloads upstream tools and third-party license files.
- `scripts/verify-windows-tools.ps1`: launches the included runtime binaries for a simple smoke check.
- `PUBLISH-TO-GITHUB.ps1`: optional owner helper for pushing the source and tag `v0.2.0` to the configured repository.

## Known limitations

1. The first BVD release is unsigned; SmartScreen may warn. Do not ask users to disable security features.
2. Site support varies and can break after source-site changes. No claim is made that every site or format is supported.
3. The current playlist preview enumerates at most 500 entries.
4. Task history and preferences use electron-store JSON, not SQLite.
5. Progress, actual file size, update flow and installer behavior still need live tests. A task is only marked Completed after the output path can be found; no-output exits are marked Failed.
6. Portable self-update replaces the running portable executable after the app exits; this must be tested on a clean Windows user account before being advertised as stable.

## Release acceptance checklist

- [ ] `npm ci` succeeds on Windows 10/11 x64 with Node 22.22.2+.
- [ ] `npm run check` succeeds.
- [ ] `npm run prepare:tools:win` + `npm run verify:tools:win` succeed.
- [ ] `npm run build` succeeds.
- [ ] NSIS and Portable EXEs are generated with names matching the updater's asset patterns.
- [ ] Fresh install and uninstall tested on a clean Windows machine.
- [ ] Portable app starts and saves data outside its extraction temp directory.
- [ ] Public media download, playlist, pause/resume, trim, audio extraction and subtitles are tested against permitted URLs.
- [ ] Notification sounds and Windows notifications are tested.
- [ ] Update from one test version to the next passes with SHA-256 verification for both Installer and Portable builds.
- [ ] README, MIT license and third-party notices reviewed.

Only after this checklist is completed should the release be described as production-ready.
