# BVD 0.2.0 — Release Candidate Status

This package contains the current BVD source tree, Windows packaging configuration, runtime-tool preparation scripts, GitHub Actions workflows, brand assets, WAV notification sounds, documentation and an owner publishing helper.

## What is ready in this handoff

- Application source for Electron/React/TypeScript.
- yt-dlp integration and FFmpeg/Node tool preparation workflow.
- Persistent download tasks, playlist review/selection and per-task options.
- Notification and sound settings.
- Custom GitHub Releases update client with SHA-256 validation.
- NSIS Installer and Portable x64 packaging definitions.
- GitHub Actions Windows CI and release workflows.
- Arabic steps in `START-HERE-WINDOWS-AR.md`.

## What is not yet a verified deliverable

- No Windows `.exe` has been built in this Linux environment.
- Full `npm ci`, TypeScript type-check, ESLint, Vitest, Electron packaging and Windows smoke tests did not run here. Node 22.16.0 is below the project requirement (22.22.2+), dependencies could not be installed due unavailable npm registry access, and this environment does not provide Windows or PowerShell.
- No GitHub Release has been published. The connected public repository was confirmed empty when this package was prepared.

## Required steps before distributing an EXE

1. Follow `START-HERE-WINDOWS-AR.md` on Windows.
2. Push the source and `v0.2.0` tag using `PUBLISH-TO-GITHUB.ps1` after reviewing the MIT license.
3. Wait for the Windows GitHub Actions release workflow to finish successfully.
4. Download and test both EXEs from the official GitHub Release on a clean Windows 10/11 x64 machine.
5. Only then distribute the setup/portable files to other users.

Do not represent this source ZIP as an already-built installer. Do not distribute artifacts from a failed workflow run.
