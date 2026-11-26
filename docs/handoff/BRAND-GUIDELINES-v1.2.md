# BVD Brand Guidelines v1.2

## Brand identity
- Product: **Baset Video Downloader**
- Short name: **BVD**
- Product category: Windows desktop media download manager
- Personality: calm, dependable, modern, efficient, accessible
- Suggested tagline: **Download · Manage · Enjoy**
- Attribution: **by AbdulBaset R. Sayed**
- GitHub profile: `https://github.com/AbdulBasetRS`
- Proposed repository: `AbdulBasetRS/Baset-Video-Downloader` (verify the repository exists before enabling release publishing or updates)

## 1. Non-negotiable visual rules
1. No emojis anywhere in the application UI, UI copy, notification copy, placeholders, documentation screenshots, or sample data.
2. No platform logos, platform brand marks, platform screenshots, or decorative pictures representing YouTube, TikTok, Facebook, Instagram, X, or other services.
3. Use one icon family only: **Lucide** (`lucide-react`). Use generic symbols such as `Globe`, `Video`, `Link`, `ListVideo`, `Download`, `Folder`, and `Settings`. Platform names are plain text labels.
4. Real media thumbnails are allowed only when they are actual thumbnails belonging to a media item the user added. Missing thumbnails use a neutral Lucide `Video` or `FileVideo` placeholder.
5. All app backgrounds, pages, cards, sidebars, dialogs, splash screens, and empty states use solid color fills. No gradient backgrounds, wallpapers, decorative photos, mesh/aurora backgrounds, or platform artwork.
6. The BVD logo itself may retain its approved blue brand treatment. Place it over a flat solid background. Use a restrained soft shadow, not a large glow.
7. Do not add decorative imagery merely to fill space. Prefer whitespace, typography, simple borders, and consistent icons.

## 2. Logo files
- `brand/logo/bvd-mark.svg`: standalone mark for splash, empty state, and app identity.
- `brand/logo/bvd-logo-dark.svg`: wordmark for dark surfaces.
- `brand/logo/bvd-logo-light.svg`: wordmark for light surfaces.
- `brand/logo/bvd-logo-horizontal.svg`: compact horizontal lockup.
- `brand/icons/bvd-app-icon.ico`: static Windows application icon.
- PNG variants are raster exports for contexts that do not support SVG.

Preserve original proportions and clear space. Never recreate the mark using text glyphs, emoji, platform logos, or unrelated artwork. The Windows app icon must remain static.

## 3. Splash screen and centered logo
- Center the BVD mark horizontally and vertically.
- Dark background: `#0B1120`; light background: `#F5F7FB`.
- Logo display width: approximately 112–144px at a 1440×900 window; scale proportionally on smaller windows.
- Apply a soft blue-tinted shadow with low opacity and broad blur.
- Product name sits below the mark; show a small progress indicator only when real startup work is occurring.
- The main application background remains solid; the logo's shadow must not become a full-screen glow.

## 4. Logo animation
Use `brand/motion/bvd-logo-motion.css` as a reference:
- Gentle vertical float: maximum 4px.
- Scale variation: maximum approximately 1.2%.
- Motion cycle: about 4.8 seconds, ease-in-out.
- Soft shadow breath synchronized with the float.
- One short entrance transition around 520ms.
- No spin, bounce, flashing, rapid pulse, or continuous animation beside active forms.
- Restrict motion to splash/startup, genuine loading, or a quiet empty state.
- Respect `prefers-reduced-motion: reduce` and disable nonessential animation.

## 5. Color tokens
| Token | Value | Use |
|---|---|---|
| Primary | `#2563EB` | Primary actions, selected nav |
| Primary light | `#38BDF8` | Focus/secondary accent |
| Primary dark | `#1D4ED8` | Hover/pressed |
| Dark background | `#0B1120` | Dark app canvas |
| Dark surface | `#151F32` | Dark panels |
| Dark text | `#F1F5F9` | Primary text on dark |
| Light background | `#F5F7FB` | Light app canvas |
| Light surface | `#FFFFFF` | Light panels |
| Light text | `#0F172A` | Primary text on light |
| Success | `#22C55E` | Completed/success |
| Warning | `#F59E0B` | Paused/caution |
| Danger | `#EF4444` | Error/failure |
| Info | `#38BDF8` | Informational |
| Muted | `#64748B` | Secondary text |

Use CSS variables/design tokens. Do not scatter raw color values across components. Keep backgrounds flat and solid.

## 6. Typography
- English: Manrope.
- Arabic: Cairo.
- Fallback: Segoe UI, sans-serif.
- Bundle fonts locally so the interface works offline; verify font licenses and attribution requirements.
- Keep URLs, paths, timestamps, version strings, and technical identifiers LTR even inside RTL screens.

## 7. Iconography
Use Lucide icons exclusively. Keep icon size, stroke width, alignment, and optical weight consistent. Never mix emoji, platform logos, and unrelated icon packs. Platform names are text-only, optionally paired with a neutral generic icon.

## 8. Application shell
- Windows 10/11, x64 first.
- Initial window: 1440×900; minimum: 1100×720.
- Sidebar expanded about 232px; collapsed about 72px.
- Title bar about 56px; footer about 48px.
- Sidebar expanded/collapsed state persists.
- Download cards offer Compact and Expanded modes; preference persists.
- Theme defaults to System with explicit Light and Dark overrides.
- Language: Arabic/English with full RTL/LTR layout switching without restart.

## 9. Footer and attribution
Left: `by AbdulBaset R. Sayed` and `https://github.com/AbdulBasetRS`.
Right: installed app version and project repository link. Do not invent a repository URL if the repository has not been created. Keep repository owner/name in one central configuration file.

## 10. Notifications and sounds
- Notifications must be calm, concise, and localized.
- Use in-app toast notifications and optional native Windows notifications.
- Bundle original, subtle WAV sound cues. Sound is configurable independently of visual notifications.
- Provide a master sound switch, per-event switches, volume slider, Test buttons, Open Sounds Folder, and Restore Defaults.
- Never use loud alarms, sirens, or copyrighted sound effects.
- Do not play a sound for every progress update. Only meaningful state transitions trigger sounds.
