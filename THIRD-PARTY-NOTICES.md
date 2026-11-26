# Third-party notices

BVD bundles or downloads the following tools and libraries. Their licenses remain applicable to those components; the MIT license for BVD does not replace them.

## Runtime tools included in Windows packages

- **yt-dlp** — standalone Windows executable from https://github.com/yt-dlp/yt-dlp/releases. Its license and bundled dependency notices are included in `resources/tools/win32-x64/licenses/` and copied beside the installed application.
- **FFmpeg / ffprobe** — LGPL shared Windows build from https://github.com/FFmpeg-Builds/FFmpeg-Builds/releases. The LGPL 2.1 license text is included with the tool bundle. FFmpeg is a separate executable; BVD invokes it as a subprocess and does not link it into BVD.
- **Node.js runtime** — Node executable distributed by the Node.js project. The upstream license is included with the tool bundle.

## JavaScript dependencies

The exact dependency and license versions are recorded by `package-lock.json`. Run `npm run licenses` after `npm ci` to regenerate `docs/DEPENDENCY-INVENTORY.md` from installed package metadata.

## Fonts

Manrope and Cairo are bundled through Fontsource packages under the SIL Open Font License 1.1. The Windows packaging script copies their license texts to `resources/licenses/`, and electron-builder includes those files in the generated application package.

## User responsibility

Users are responsible for ensuring that their downloads comply with applicable law, copyright, privacy, and the source platform's terms. BVD does not bypass DRM or access controls.
