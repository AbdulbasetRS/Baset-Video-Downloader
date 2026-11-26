# Dependency inventory

Generated from the package-lock root manifest. Exact transitive package versions and licenses must be refreshed by running `npm ci` followed by `npm run licenses` on the Windows build runner. This inventory is engineering documentation, not legal advice.

The candidate application license is MIT; the maintainer should review it before the first public release.

## Runtime dependencies (npm)
| Package | Locked range |
|---|---|
| @fontsource/cairo | ^5.3.0 |
| @fontsource/manrope | ^5.3.0 |
| electron-store | ^12.0.0 |
| lucide-react | ^1.81.0 |
| react | ^19.3.1 |
| react-dom | ^19.3.1 |
| zod | ^4.6.7 |
| zustand | ^5.1.0 |
## Development dependencies (npm)
| Package | Locked range |
|---|---|
| @eslint/js | ^10.0.1 |
| @testing-library/jest-dom | ^8.0.0 |
| @testing-library/react | ^16.3.3 |
| @testing-library/user-event | ^14.6.13 |
| @types/node | ^26.6.11 |
| @types/react | ^19.3.3 |
| @types/react-dom | ^19.3.0 |
| @vitejs/plugin-react | ^6.3.0 |
| electron | ^45.5.0 |
| electron-builder | ^26.18.0 |
| electron-vite | ^6.0.0 |
| eslint | ^10.15.0 |
| eslint-plugin-react-hooks | ^7.1.1 |
| globals | ^17.14.0 |
| jsdom | ^31.0.1 |
| typescript | ^6.0.3 |
| typescript-eslint | ^8.74.0 |
| vite | ^8.4.0 |
| vitest | ^5.1.2 |

## Bundled fonts
Manrope and Cairo are included through Fontsource packages under SIL Open Font License 1.1. The Windows tool-preparation script copies the relevant license texts into the application resources.

## Windows runtime tools
The Windows workflow downloads yt-dlp, its SHA-256 checksum list and upstream license notices; an FFmpeg LGPL shared build; and the Node.js runtime. Exact release identifiers and the yt-dlp SHA-256 are recorded in `resources/tools/win32-x64/tool-versions.json` during each build. The release ships the relevant notices.

Run `npm run licenses` after a successful `npm ci` to generate the full transitive dependency/license inventory from installed package metadata.
