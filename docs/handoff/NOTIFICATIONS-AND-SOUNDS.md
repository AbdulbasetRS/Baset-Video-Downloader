# BVD Notifications & Sounds

## UX behavior
BVD uses an in-app notification center/toast system plus optional native Windows desktop notifications. Notifications are event-driven, concise, localized, and never steal focus.

## Events
| Event key | User-facing meaning | Default visual | Default sound |
|---|---|---:|---:|
| `downloadQueued` | Added to queue | In-app toast | `download-queued.wav` |
| `downloadStarted` | Actual transfer started | In-app + desktop toast | `download-started.wav` |
| `downloadCompleted` | Output file exists and was verified | In-app + desktop toast | `download-completed.wav` |
| `downloadFailed` | Task failed | In-app + desktop toast | `download-failed.wav` |
| `downloadPaused` | User paused task | In-app toast | `download-paused.wav` |
| `downloadResumed` | Task resumed | In-app toast | `download-resumed.wav` |
| `downloadCanceled` | Task canceled | Optional, off by default | None by default |
| `updateAvailable` | New stable release found | In-app + desktop toast | `update-available.wav` |
| `updateDownloaded` | Update ready to install | In-app + desktop toast | `update-downloaded.wav` |

Do not emit `downloadCompleted` until post-processing is complete, final output file exists, and file size has been read. A 100% transfer bar alone is not completion.

## User settings
- In-app notifications on/off.
- Native Windows notifications on/off.
- Master sounds on/off.
- Per-event sound and visual toggles.
- Volume 0–100, initial default 40%.
- Test each sound.
- Open sounds folder.
- Restore default sounds.
- Coalesce bursts (e.g. playlist completion) into summary toasts.

## Sound files
All supplied sounds are original generated tones, short WAV PCM files. They are intentionally subtle placeholders and may be replaced by the maintainer later.

| File | Purpose |
|---|---|
| `download-queued.wav` | Gentle queue acknowledgment |
| `download-started.wav` | Soft short rising tone |
| `download-completed.wav` | Positive three-note resolved chime |
| `download-failed.wav` | Quiet low two-tone alert; not an alarm |
| `download-paused.wav` | Soft muted stop cue |
| `download-resumed.wav` | Gentle rising cue |
| `update-available.wav` | Neutral attention cue |

Copy defaults once into the user's writable BVD data directory, such as `%APPDATA%/Baset Video Downloader/sounds/`. Do not overwrite the user's replacements on subsequent launches. Settings may allow the user to select a WAV file for an event. Validate extension, decodeability, duration, and reasonable file size before accepting.

## Windows implementation note
Show native Windows notifications through Electron's Notification API when supported and correctly configured with application identity/shortcut. Play the customizable WAV locally in the app (for example via a controlled local audio asset and Web Audio/HTMLAudioElement). Do not claim that Windows native toasts accept the custom WAV in the same way that Electron documents custom sound support for macOS. Avoid playing both a native default sound and a custom in-app sound at the same time where possible.

Unlock audio playback after the first user gesture to satisfy autoplay restrictions. Missing/corrupt sound files must fail silently and never interrupt downloading.
