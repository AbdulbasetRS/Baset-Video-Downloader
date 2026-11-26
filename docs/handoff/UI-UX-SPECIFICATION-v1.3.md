# Baset Video Downloader (BVD) — UI/UX Specification v1.3

**Status:** Approved implementation baseline  
**Platform:** Windows 10/11, x64 first  
**Product:** Baset Video Downloader (BVD)  
**Theme default:** System  
**Languages:** English / Arabic  
**Fonts:** Manrope / Cairo  
**Navigation:** Expandable/collapsible sidebar  
**Download cards:** Compact/Expanded  

---

## 1. Product goals
BVD is a Windows desktop media download manager for media the user is authorized to access. It supports individual URLs and playlists when a source adapter can legitimately resolve them.

Core experience:
- Paste or enter one or more links.
- Preview metadata and available media options before download when supported.
- Configure each download independently.
- Manage a persistent queue with honest progress and clear states.
- View actual output details and open files/folders.
- Use Arabic RTL or English LTR.
- Provide secure update checks from official GitHub Releases.
- Notify the user about meaningful events with optional subtle sounds.

Do not promise every site, format, quality, subtitle, duration trim, or playlist will work. Availability depends on the source, extractor, media permissions, and source changes.

## 2. Mandatory visual restrictions
These rules override any earlier mockup or sample image:
- No emojis anywhere in UI, notifications, sample content, or generated illustrations.
- No platform logos, brand marks, platform screenshots, or platform artwork.
- Lucide icons only (`lucide-react`). Use generic icons such as `Globe`, `Video`, `Link`, `ListVideo`, `Download`, `Folder`, `Settings`, `Clock`, `CheckCircle`, `AlertCircle`, and `RefreshCw`.
- Platform/source names appear as plain text. A neutral generic icon may accompany them; never display a platform logo.
- Actual media thumbnails are allowed only as content previews for the user's actual media item. If unavailable, display a generic Lucide video/file icon inside a simple neutral placeholder.
- All backgrounds are solid flat colors. No gradients, photos, wallpaper, decorative illustrations, mesh/aurora effects, or platform images.
- The BVD logo may use its approved blue brand styling, centered on a flat background with a soft shadow.
- Do not add decorative artwork just to fill empty space.

## 3. Application shell
### Window
- Default: 1440×900.
- Minimum: 1100×720.
- Remember window size/position but validate it remains within visible displays.
- Standard minimize, maximize/restore, close, and keyboard behaviors.

### Title bar
- Height around 56px.
- Left: static BVD app mark and product name.
- Right: language selector, theme selector (System/Light/Dark), window controls.
- No platform graphics.

### Sidebar
- Expanded width around 232px; collapsed width around 72px.
- Both modes are user-selectable and persisted.
- Pages: Home, Downloads, History, Settings, About.
- Collapsed mode uses tooltips on hover/focus and accessible labels.
- Active state must be visually clear in both themes.
- RTL moves the sidebar to the right and reverses appropriate spacing/order.

### Footer
- Height around 48px.
- Left: `by AbdulBaset R. Sayed` and GitHub profile.
- Right: app version and repository link.
- Repository URL comes from a central config value. Never fabricate a live URL before the repository exists.

## 4. Themes, direction, and fonts
### Theme
- First launch default is System, following the Windows light/dark preference.
- Options: System, Light, Dark.
- Manual overrides persist across restarts.
- All UI colors use design tokens/CSS variables.

### Language
- English uses Manrope and LTR.
- Arabic uses Cairo and RTL.
- Language switching does not require restart.
- Localize labels, menus, dialogs, validation, errors, toasts, native notification title/body, update dialogs, tooltips, accessibility labels, and empty/loading states.
- Keep paths, URLs, timestamps, version strings, keyboard shortcuts, and technical identifiers LTR as appropriate.

## 5. Design tokens
### Dark
- Background `#0B1120`
- Surface `#151F32`
- Text `#F1F5F9`
- Muted `#94A3B8`
- Border `#26354D`

### Light
- Background `#F5F7FB`
- Surface `#FFFFFF`
- Text `#0F172A`
- Muted `#64748B`
- Border `#D9E2EF`

### Semantic
- Primary `#2563EB`
- Primary light `#38BDF8`
- Primary dark `#1D4ED8`
- Success `#22C55E`
- Warning `#F59E0B`
- Danger `#EF4444`
- Info `#38BDF8`

Use consistent spacing, radii, focus outlines, and modest shadows. Solid backgrounds only.

## 6. Logo, splash, and animation
- Startup/splash screen: BVD mark centered horizontally and vertically.
- Background: solid `#0B1120` or `#F5F7FB` according to effective theme.
- Soft blue-tinted drop shadow, low opacity, broad blur.
- Mark approximately 112–144px wide at 1440×900.
- Product name below it; loading indicator only during real startup work.
- Gentle vertical movement max 4px, scale variation max approximately 1.2%, 4.8-second ease-in-out cycle.
- One short entrance animation around 520ms.
- No spin, bounce, flashing, aggressive pulsing, or permanent movement beside active controls.
- Use supplied `brand/motion/bvd-logo-motion.css` as reference.
- Respect `prefers-reduced-motion: reduce`; disable nonessential animations.
- Windows app icon remains static.

## 7. Pages
### 7.1 Home
- URL input with Paste and Clear.
- Add/Download action, URL validation, duplicate handling.
- Accept one URL, playlist URL, and multiple URL lines.
- Resolve metadata before starting when possible.
- Filters: All, Downloading, Waiting, Paused, Completed, Failed.
- Queue actions: Pause All, Resume All, Clear Completed; confirm destructive actions.
- Source name as text with neutral generic icon, never logo.

### 7.2 Metadata preview
Show only data actually provided by the source:
- Actual media thumbnail, otherwise a neutral video icon placeholder.
- Title, description/excerpt, source name, creator/uploader, duration, upload date where available.
- Available formats/resolutions and subtitle languages.
- Estimated size only when reliable.
- Missing information is marked unavailable, never invented.

### 7.3 Download cards
Both layouts are mandatory. Provide a global Compact/Expanded view preference; optionally allow one card to expand independently.

Compact:
- Thumbnail, title, source text, duration, status.
- Progress, percent when known, speed, ETA when known.
- Pause/Resume, Cancel, Expand.

Expanded:
- All compact fields.
- Independent per-task options.
- File information and output actions.
- Open Folder and Rename when applicable.
- Error detail and retry action when failed.

First-run default: Compact. Persist preference. Real thumbnail only; no platform artwork.

### 7.4 Per-task options
Each task owns its own options object. Changing one must never mutate another.
- Formats: MP4, MKV, WebM, MP3, M4A, WAV, and other formats only when truly supported.
- Video quality: Best Available, 2160p, 1440p, 1080p, 720p, 480p etc. only when source exposes it.
- Audio quality/bitrate only when available.
- Audio-only mode.
- Start/end trim in `HH:MM:SS`; optionally support `MM:SS` consistently.
- Validate start < end and end <= known media duration.
- Subtitles toggle, language, and supported formats such as SRT/VTT.
- Save path with Browse and Open Folder.
- Custom filename; sanitize invalid Windows characters and preserve proper extension.
- Any option unavailable for this source must be disabled with a short explanation, not silently ignored.

### 7.5 Progress and output details
During download:
- State, progress bar, percentage when determinable, bytes downloaded/total when known, speed, ETA when determinable.
- Pause, Resume, Cancel.
- Unknown total size uses indeterminate progress; never fabricate a percentage, ETA, or size.

After completion:
- Verify final output exists.
- Read actual file size from filesystem.
- Show final path, format, subtitles if generated.
- Open File, Open Folder, Rename.

### 7.6 Playlist review
- Preview entries before queueing.
- Display actual thumbnails, title, duration, order, and source where provided.
- Select All, Deselect All, per-entry checkboxes.
- Shared defaults can be applied; per-entry overrides remain independent.
- Queue selected / Queue all.
- Unavailable/private/deleted entries should be reported without crashing the entire list when possible.

### 7.7 Downloads
- Dedicated task management page.
- Filters: All, Downloading, Waiting, Paused, Completed, Failed.
- Search and sort by date/name/status/known size.
- Bulk pause/resume/cancel and clear completed with confirmation.
- Compact/Expanded option available.

### 7.8 History
Persist title, thumbnail, source text, date, duration, output format, actual file size, output path, and result state.
Actions: Open File, Open Folder, Download Again, Copy Source Link, Remove From History.
Removing history must not delete a file. File deletion, if ever offered, requires a separate explicit confirmation.

### 7.9 Settings
- General: launch behavior and app behavior.
- Appearance: System/Light/Dark; default card mode; sidebar preference.
- Language: Arabic/English.
- Downloads: default folder, concurrency limit, duplicate behavior.
- Video/Audio: default quality and format preferences.
- Subtitles: default language/format.
- Notifications & Sounds: master switches, event-level controls, volume, test sounds, Open Sounds Folder, Restore Defaults.
- Updates: check on startup, last check, stable channel in v1.0.
- Advanced: log folder, diagnostics, reset settings.

### 7.10 About and Updates
Show logo, name, installed version, developer, GitHub profile, repository, license status, release notes.
Buttons: Check for Updates, Open Repository, View Release Notes.

## 8. Notification system
Provide two channels:
1. In-app toast notifications.
2. Native Windows desktop notifications when enabled and supported.

Required events:
- Task queued.
- Download started (actual transfer begins, not merely when added to queue).
- Download completed (only after output file exists and final size is read).
- Download failed.
- Download paused.
- Download resumed.
- Download canceled (optional, off by default to reduce noise).
- Update available.
- Update downloaded / ready to install.

Behavior:
- Localize titles and messages in Arabic and English.
- A notification click brings BVD forward and selects/navigates to the related task when possible.
- Do not include full local paths, cookies, credentials, or sensitive URL query parameters in notification text.
- Do not show a notification for every progress tick.
- Coalesce rapid repeated notifications (for example several playlist items finishing at nearly the same time) into a summary to prevent spam.
- Notification preferences are separate from sound preferences.
- In-app notifications should not steal keyboard focus.
- Native notifications must be wired for Windows app identity and packaged shortcut requirements.

### 8.1 Notification settings
- Master In-app Notifications switch.
- Master Windows Notifications switch.
- Master Notification Sounds switch.
- Per-event enable switches.
- Volume slider 0–100 (default around 35–45%).
- Test button per sound.
- Open Notification Sounds Folder.
- Restore Default Sounds.
- Sound events should be rate-limited/coalesced when many tasks change together.

### 8.2 Sound mapping
Ship original short, quiet WAV files:
| Event | File |
|---|---|
| Download queued | `download-queued.wav` |
| Download started | `download-started.wav` |
| Download completed | `download-completed.wav` |
| Download failed | `download-failed.wav` |
| Download paused | `download-paused.wav` |
| Download resumed | `download-resumed.wav` |
| Update available | `update-available.wav` |

Copy packaged defaults into a user-writable BVD sounds folder on first launch, without overwriting user customizations on later launches. The user may replace a file while retaining the exact filename, or choose a custom WAV from Settings. Include a Restore Defaults action.

For Windows, play the custom WAV through the app's local audio playback mechanism and show the native toast separately. Do not promise that the native Windows toast itself will play an arbitrary custom WAV: the app-controlled sound is the customizable part. Avoid double sound by suppressing/defaulting native toast audio where feasible.

Use Web Audio / HTML audio with safe local asset access, handle autoplay restrictions by unlocking audio after first user interaction, and fail silently if a sound file is missing or invalid. Sound playback must never crash or block downloads.

## 9. Update flow
### Installed NSIS build
1. User selects Check for Updates, or optional background check is enabled.
2. Query the configured public GitHub Releases provider/repository.
3. Ignore drafts and prereleases for the stable channel.
4. If current, show a localized up-to-date message.
5. If newer, show version, release date, and concise release notes.
6. Ask permission before downloading.
7. Show update download progress and allow cancel before installation is scheduled.
8. Verify using the updater's published metadata/integrity mechanism (including generated SHA-512 metadata); never execute an arbitrary URL.
9. If BVD downloads are active, defer restart/install and explain why; never interrupt without explicit approval.
10. When ready, ask Restart Now or Later. Install only after the user confirms a safe restart.
11. On any error, keep the current app intact and offer the official Releases page.

The current implementation uses a custom GitHub Releases client. Publish versioned NSIS and Portable EXEs plus `checksums.txt`; BVD verifies SHA-256 before handing the update to a detached Windows helper. The update process must be tested on Windows before being advertised as stable.

### Portable build
- A portable ZIP/EXE can check the latest GitHub version and notify the user.
- Do not pretend portable builds support the same silent in-place auto-install as NSIS.
- Provide Open Latest Release / Download Portable Update and a clear manual replacement guide.
- Never overwrite the currently running portable executable.

## 10. Core task states
Use explicit typed states:
`Resolving`, `FetchingMetadata`, `Waiting`, `Downloading`, `Paused`, `PostProcessing`, `Completed`, `Failed`, `Canceled`.

All transitions must be explicit, validated, persisted, and tested. Progress updates must be throttled to avoid excess rendering.

## 11. Privacy, safety, and security
- Only process public or otherwise authorized content, and content the user has rights/permission to download.
- Do not implement DRM circumvention, paywall bypass, private-content access, login-wall bypass, CAPTCHA bypass, or access-control evasion.
- Do not store browser cookies or passwords. Do not ask users to paste credentials.
- Do not send URLs, filenames, history, or telemetry to analytics by default.
- Redact sensitive query parameters from logs.
- Do not use shell-concatenated command strings. Spawn download tools with argument arrays and strict validation.
- Electron security: `contextIsolation: true`, `nodeIntegration: false`, sandbox where compatible, strict Content Security Policy, narrow typed preload bridge, IPC allowlist and validation.
- Renderer must not have direct Node, filesystem, process, or shell access.

## 12. Accessibility and reliability
- Keyboard navigation and visible focus.
- Accessible names for icon-only controls.
- Screen reader labels for status and progress.
- Do not communicate state by color alone.
- Reduced-motion support.
- Correct contrast in both themes.
- Confirm destructive operations.
- Notifications never steal focus.
- Continue to provide History and Settings offline.

## 13. Acceptance criteria
- System/Light/Dark work and persist.
- Arabic/English fully work with RTL/LTR parity.
- Sidebar expanded/collapsed and Compact/Expanded cards persist.
- Zero emoji and zero platform logos/images in shipped UI assets.
- All app backgrounds are solid fills.
- Logo is centered with subtle shadow and restrained accessible motion only in relevant states.
- Per-task settings are isolated.
- Progress, file sizes, and ETA are never fabricated.
- WAV sounds can be tested and replaced from the user-writable sounds folder.
- Start/completion/failure notifications are verified, with no false completion event.
- Native notification actions bring the app to the correct task when supported.
- Installed NSIS updater is tested against a staging GitHub release before production use.
- Portable updater behavior is honest and manual.
- Tests cover state transitions, failure handling, sound preferences, notification throttling, update states, and core RTL/LTR UI.
