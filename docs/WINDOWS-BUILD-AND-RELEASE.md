# Build BVD Windows packages

## Developer workstation

Use Windows 10/11 x64 and Node.js 22.22.2 or newer in the Node 22 line.

```powershell
npm ci
npm run prepare:tools:win
npm run verify:tools:win
npm run check
npm run build
npx electron-builder --win nsis portable --x64 --publish never
```

Artifacts are written to `release/`:

- `BVD-Setup-0.2.0-x64.exe`
- `BVD-Portable-0.2.0-x64.exe`

The setup EXE installs the app. The portable EXE starts it without a conventional installation. Both include the Electron app, sound files, yt-dlp, Node runtime, FFmpeg/ffprobe and third-party notices.

## Publish through Actions

Push a tag matching `package.json` version, for example `v0.2.0`. The `release.yml` workflow builds on Windows and attaches the two EXEs, `checksums.txt`, the BVD license and third-party notices to the GitHub Release.

The update service expects these patterns:

- `BVD-Setup-<version>-x64.exe`
- `BVD-Portable-<version>-x64.exe`
- `checksums.txt`

Do not publish a tag until the CI workflow passes. Test the first update against a staging release before advertising automatic updates.
