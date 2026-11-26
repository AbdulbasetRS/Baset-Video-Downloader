import { DEFAULT_SETTINGS, applySettingsPatch, sanitizeSettings, settingsPatchSchema } from '../../src/shared/settings'

describe('settings', () => {
  it('defaults match the approved spec', () => {
    expect(DEFAULT_SETTINGS.theme).toBe('system')
    expect(DEFAULT_SETTINGS.cardMode).toBe('compact')
    expect(DEFAULT_SETTINGS.notifications.volume).toBe(40)
    expect(DEFAULT_SETTINGS.notifications.events.downloadCanceled).toEqual({ inApp: false, desktop: false, sound: false })
  })
  it('recovers from corrupt stored data without throwing', () => {
    expect(sanitizeSettings(null)).toEqual(DEFAULT_SETTINGS)
    expect(sanitizeSettings('garbage')).toEqual(DEFAULT_SETTINGS)
    expect(sanitizeSettings({ theme: 'neon', language: 'ar' }).language).toBe('ar')
    expect(sanitizeSettings({ theme: 'neon', language: 'ar' }).theme).toBe('system')
  })
  it('applies a valid patch and leaves other fields alone', () => {
    const next = applySettingsPatch(DEFAULT_SETTINGS, { language: 'ar' })
    expect(next.language).toBe('ar')
    expect(next.theme).toBe('system')
  })
  it('rejects unknown keys and bad values in patches', () => {
    expect(settingsPatchSchema.safeParse({ hacked: true }).success).toBe(false)
    expect(settingsPatchSchema.safeParse({ theme: 'neon' }).success).toBe(false)
    expect(settingsPatchSchema.safeParse({ schemaVersion: 2 }).success).toBe(false)
  })
  it('keeps volume within 0-100', () => {
    const n = { ...DEFAULT_SETTINGS.notifications }
    expect(settingsPatchSchema.safeParse({ notifications: { ...n, volume: 101 } }).success).toBe(false)
    expect(settingsPatchSchema.safeParse({ notifications: { ...n, volume: -1 } }).success).toBe(false)
  })
})
