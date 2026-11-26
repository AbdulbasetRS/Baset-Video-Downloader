import { z } from 'zod'

export const THEME_MODES = ['system', 'light', 'dark'] as const
export const LANGUAGES = ['en', 'ar'] as const
export const SIDEBAR_MODES = ['expanded', 'collapsed'] as const
export const CARD_MODES = ['compact', 'expanded'] as const

export const NOTIFICATION_EVENTS = [
  'downloadQueued',
  'downloadStarted',
  'downloadCompleted',
  'downloadFailed',
  'downloadPaused',
  'downloadResumed',
  'downloadCanceled',
  'updateAvailable',
  'updateDownloaded'
] as const
export type NotificationEvent = (typeof NOTIFICATION_EVENTS)[number]

const eventToggle = z.object({ inApp: z.boolean(), desktop: z.boolean(), sound: z.boolean() })

export const settingsSchema = z.object({
  schemaVersion: z.literal(2),
  defaultOutputDirectory: z.string().max(2048),
  maxConcurrentDownloads: z.number().int().min(1).max(5),
  theme: z.enum(THEME_MODES),
  language: z.string().regex(/^[a-z]{2}(?:-[A-Z]{2})?$/).max(16),
  sidebarMode: z.enum(SIDEBAR_MODES),
  cardMode: z.enum(CARD_MODES),
  notifications: z.object({
    inAppEnabled: z.boolean(),
    desktopEnabled: z.boolean(),
    soundsEnabled: z.boolean(),
    volume: z.number().int().min(0).max(100),
    events: z.record(z.enum(NOTIFICATION_EVENTS), eventToggle)
  }),
  updates: z.object({ checkOnStartup: z.boolean() })
})

export type AppSettings = z.infer<typeof settingsSchema>

export const DEFAULT_SETTINGS: AppSettings = {
  schemaVersion: 2,
  defaultOutputDirectory: '',
  maxConcurrentDownloads: 2,
  theme: 'system',
  language: 'en',
  sidebarMode: 'expanded',
  cardMode: 'compact',
  notifications: {
    inAppEnabled: true,
    desktopEnabled: true,
    soundsEnabled: true,
    volume: 40,
    events: {
      downloadQueued: { inApp: true, desktop: false, sound: true },
      downloadStarted: { inApp: true, desktop: true, sound: true },
      downloadCompleted: { inApp: true, desktop: true, sound: true },
      downloadFailed: { inApp: true, desktop: true, sound: true },
      downloadPaused: { inApp: true, desktop: false, sound: true },
      downloadResumed: { inApp: true, desktop: false, sound: true },
      downloadCanceled: { inApp: false, desktop: false, sound: false },
      updateAvailable: { inApp: true, desktop: true, sound: true },
      updateDownloaded: { inApp: true, desktop: true, sound: true }
    }
  },
  updates: { checkOnStartup: false }
}

/** A patch may change any top-level key (notifications/updates are replaced as a whole). */
export const settingsPatchSchema = settingsSchema.omit({ schemaVersion: true }).partial().strict()
export type SettingsPatch = z.infer<typeof settingsPatchSchema>

/** Merge an unknown stored value over the defaults, dropping anything invalid. */
export function sanitizeSettings(raw: unknown): AppSettings {
  const parsed = settingsSchema.safeParse(raw)
  if (parsed.success) return parsed.data
  const base: Record<string, unknown> =
    raw && typeof raw === 'object' ? { ...(raw as Record<string, unknown>) } : {}
  const merged: Record<string, unknown> = { ...DEFAULT_SETTINGS }
  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof AppSettings)[]) {
    const candidate = { ...merged, [key]: base[key] }
    if (key in base && settingsSchema.safeParse(candidate).success) merged[key] = base[key]
  }
  return settingsSchema.parse({ ...merged, schemaVersion: 2 })
}

export function applySettingsPatch(current: AppSettings, patch: SettingsPatch): AppSettings {
  return settingsSchema.parse({ ...current, ...patch, schemaVersion: 2 })
}
