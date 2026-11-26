import { app } from 'electron'
import Store from 'electron-store'
import {
  DEFAULT_SETTINGS,
  applySettingsPatch,
  sanitizeSettings,
  type AppSettings,
  type SettingsPatch
} from '../shared/settings'
import type { SavedWindowState } from '../shared/window-bounds'

interface StoreShape {
  settings: AppSettings
  windowState: SavedWindowState
}

// electron-store resolves app.getPath('userData') in its constructor. Keep
// construction lazy so importing this module before app.whenReady() is safe.
let store: Store<StoreShape> | undefined
function getStore(): Store<StoreShape> {
  if (!app.isReady()) throw new Error('BVD storage is not ready until Electron has finished starting.')
  store ??= new Store<StoreShape>({
    name: 'bvd-preferences',
    defaults: { settings: DEFAULT_SETTINGS, windowState: {} }
  })
  return store
}

export function getSettings(): AppSettings {
  const clean = sanitizeSettings(getStore().get('settings'))
  return clean
}

export function updateSettings(patch: SettingsPatch): AppSettings {
  const next = applySettingsPatch(getSettings(), patch)
  getStore().set('settings', next)
  return next
}

export function getWindowState(): SavedWindowState {
  return getStore().get('windowState') ?? {}
}

export function saveWindowState(state: SavedWindowState): void {
  getStore().set('windowState', state)
}
