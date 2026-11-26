import { create } from 'zustand'
import { DEFAULT_SETTINGS, type AppSettings, type SettingsPatch } from '../../shared/settings'
import type { AppInfo } from '../../shared/ipc'

interface SettingsState {
  settings: AppSettings
  appInfo: AppInfo | null
  ready: boolean
  error: string | null
  init: () => Promise<void>
  update: (patch: SettingsPatch) => Promise<void>
  setSettingsFromMain: (settings: AppSettings) => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: DEFAULT_SETTINGS,
  appInfo: null,
  ready: false,
  error: null,
  async init() {
    try {
      const [settings, appInfo] = await Promise.all([window.bvd.settings.get(), window.bvd.app.info()])
      set({ settings, appInfo, ready: true, error: null })
    } catch (err) {
      // Fall back to defaults so the app stays usable even if persistence fails.
      set({ ready: true, error: err instanceof Error ? err.message : String(err) })
    }
  },
  async update(patch) {
    // Optimistic update keeps theme/language switching instant; main confirms and broadcasts.
    set((s) => ({ settings: { ...s.settings, ...patch } }))
    try {
      const next = await window.bvd.settings.update(patch)
      set({ settings: next })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) })
    }
  },
  setSettingsFromMain: (settings) => set({ settings })
}))
