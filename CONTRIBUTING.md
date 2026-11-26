# Contributing

Thanks for helping. Please read this first:

1. Run `npm run check` before opening a PR; it must pass.
2. Hard design rules (CI-enforced): no emoji, no platform logos/names, Lucide icons only, solid backgrounds only.
3. Every user-facing string goes in `src/renderer/i18n/en.ts` **and** `ar.ts` (TypeScript enforces matching keys).
4. Never expose Node/Electron APIs to the renderer. New capabilities need: a channel in `src/shared/ipc.ts`, a zod-validated handler in `src/main/ipc.ts`, and a typed method in the preload bridge.
5. Do not add DRM/paywall/login/CAPTCHA circumvention. Such PRs will be closed.
6. Do not commit binaries, tokens, cookies, or personal URLs.
7. Do not claim a feature works unless it is wired to real code and tested.
