import { vi } from 'vitest'
import { DEFAULT_SETTINGS, type AppSettings } from '../../src/shared/settings'
import { useSettingsStore } from '../../src/renderer/store/settings-store'
import { useUiStore } from '../../src/renderer/store/ui-store'
import { useDownloadStore } from '../../src/renderer/store/download-store'
import type { BvdApi, UpdateInfo } from '../../src/shared/ipc'
import type { DownloadTask, MediaPreview } from '../../src/shared/tasks'

export interface FakeBridge {
  api: BvdApi
  state: { settings: AppSettings; tasks: DownloadTask[] }
  opened: string[]
}

const preview: MediaPreview = {
  sourceUrl: 'https://media.example/video',
  sourceName: 'media.example',
  title: 'Test video',
  description: 'A test description',
  durationSeconds: 95,
  thumbnailUrl: null,
  extractorKey: 'Generic',
  isPlaylist: false,
  playlistCount: null,
  entries: [],
  formats: [],
  subtitles: ['en'],
  automaticSubtitles: []
}

const updateInfo: UpdateInfo = {
  currentVersion: '1.0.0', latestVersion: '1.0.0', available: false,
  releaseUrl: 'https://github.com/AbdulbasetRS/Baset-Video-Downloader/releases',
  setupAssetUrl: null, portableAssetUrl: null, checksumAssetUrl: null,
  releaseNotes: '', portable: false
}

/** In-memory stand-in for the complete, typed preload bridge. */
export function installFakeBridge(initial: Partial<AppSettings> = {}): FakeBridge {
  const state = { settings: { ...DEFAULT_SETTINGS, ...initial } as AppSettings, tasks: [] as DownloadTask[] }
  const opened: string[] = []
  const api: BvdApi = {
    settings: {
      get: vi.fn(async () => state.settings),
      update: vi.fn(async (patch) => { state.settings = { ...state.settings, ...patch } as AppSettings; return state.settings }),
      onChanged: vi.fn(() => () => undefined)
    },
    app: { info: vi.fn(async () => ({ version: '1.0.0', platform: 'win32' as const, isPackaged: false, isMaximized: false, portable: false })) },
    window: {
      minimize: vi.fn(async () => undefined), toggleMaximize: vi.fn(async () => undefined), close: vi.fn(async () => undefined),
      onMaximizedChanged: vi.fn(() => () => undefined)
    },
    external: { open: vi.fn(async (url: string) => { opened.push(url); return true }) },
    clipboard: { readText: vi.fn(async () => '') },
    downloads: {
      list: vi.fn(async () => state.tasks),
      preview: vi.fn(async (url: string) => ({ ...preview, sourceUrl: url })),
      add: vi.fn(async () => []), updateOptions: vi.fn(async () => undefined),
      pause: vi.fn(async () => undefined), resume: vi.fn(async () => undefined), cancel: vi.fn(async () => undefined), retry: vi.fn(async () => undefined),
      pauseAll: vi.fn(async () => undefined), resumeAll: vi.fn(async () => undefined), clearCompleted: vi.fn(async () => undefined),
      chooseDirectory: vi.fn(async () => null), openDefaultFolder: vi.fn(async () => undefined), openFolder: vi.fn(async () => undefined),
      openFile: vi.fn(async () => undefined), rename: vi.fn(async () => undefined), removeHistory: vi.fn(async () => undefined),
      getDefaults: vi.fn(async () => ({ outputDirectory: 'C:\\Users\\Test\\Downloads', maxConcurrentDownloads: 2 })),
      onChanged: vi.fn(() => () => undefined)
    },
    notifications: {
      soundData: vi.fn(async () => null), openFolder: vi.fn(async () => undefined), pickSound: vi.fn(async () => true),
      restoreSounds: vi.fn(async () => undefined), test: vi.fn(async () => undefined),
      onEvent: vi.fn(() => () => undefined), onSoundEvent: vi.fn(() => () => undefined)
    },
    updates: {
      check: vi.fn(async () => updateInfo), download: vi.fn(async () => undefined), apply: vi.fn(async () => undefined), onProgress: vi.fn(() => () => undefined)
    }
  }
  window.bvd = api
  useSettingsStore.setState({ settings: state.settings, appInfo: null, ready: false, error: null })
  useDownloadStore.setState({ tasks: [], ready: false, error: null })
  useUiStore.setState({ page: 'home' })
  return { api, state, opened }
}
