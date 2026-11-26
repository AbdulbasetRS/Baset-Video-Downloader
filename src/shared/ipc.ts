import type { AppSettings, SettingsPatch, NotificationEvent } from './settings'
import type { DownloadAddRequest, DownloadOptions, DownloadTask, MediaPreview } from './tasks'

export const IPC = {
  settingsGet: 'settings:get', settingsUpdate: 'settings:update', settingsChanged: 'settings:changed',
  appInfo: 'app:info', windowMinimize: 'window:minimize', windowToggleMaximize: 'window:toggle-maximize',
  windowClose: 'window:close', windowMaximizedChanged: 'window:maximized-changed',
  externalOpen: 'external:open', clipboardReadText: 'clipboard:read-text',
  downloadsList: 'downloads:list', downloadsPreview: 'downloads:preview', downloadsAdd: 'downloads:add',
  downloadsChanged: 'downloads:changed', downloadsPause: 'downloads:pause', downloadsResume: 'downloads:resume',
  downloadsCancel: 'downloads:cancel', downloadsRetry: 'downloads:retry', downloadsUpdateOptions: 'downloads:update-options', downloadsPauseAll: 'downloads:pause-all',
  downloadsResumeAll: 'downloads:resume-all', downloadsClearCompleted: 'downloads:clear-completed',
  downloadsChooseDirectory: 'downloads:choose-directory', downloadsOpenFolder: 'downloads:open-folder', downloadsOpenDefaultFolder: 'downloads:open-default-folder',
  downloadsOpenFile: 'downloads:open-file', downloadsRename: 'downloads:rename', downloadsRemoveHistory: 'downloads:remove-history', downloadsDefaults: 'downloads:defaults',
  notificationsEvent: 'notifications:event', notificationsSoundEvent: 'notifications:sound-event', notificationsSoundData: 'notifications:sound-data',
  notificationsOpenFolder: 'notifications:open-folder', notificationsPickSound: 'notifications:pick-sound',
  notificationsRestoreSounds: 'notifications:restore-sounds', notificationsTest: 'notifications:test',
  updatesCheck: 'updates:check', updatesDownload: 'updates:download', updatesApply: 'updates:apply', updatesProgress: 'updates:progress'
} as const

export interface AppInfo { version: string; platform: NodeJS.Platform; isPackaged: boolean; isMaximized: boolean; portable: boolean }
export interface NotificationPayload { id: string; event: NotificationEvent; title: string; body: string; createdAt: number }
export interface UpdateInfo {
  currentVersion: string; latestVersion: string | null; available: boolean; releaseUrl: string;
  setupAssetUrl: string | null; portableAssetUrl: string | null; checksumAssetUrl: string | null;
  releaseNotes: string; portable: boolean
}
export interface DownloadDefaults { outputDirectory: string; maxConcurrentDownloads: number }

export interface BvdApi {
  settings: { get(): Promise<AppSettings>; update(patch: SettingsPatch): Promise<AppSettings>; onChanged(listener: (settings: AppSettings) => void): () => void }
  app: { info(): Promise<AppInfo> }
  window: { minimize(): Promise<void>; toggleMaximize(): Promise<void>; close(): Promise<void>; onMaximizedChanged(listener: (maximized: boolean) => void): () => void }
  external: { open(url: string): Promise<boolean> }
  clipboard: { readText(): Promise<string> }
  downloads: {
    list(): Promise<DownloadTask[]>; preview(url: string): Promise<MediaPreview>; add(requests: DownloadAddRequest[]): Promise<DownloadTask[]>; updateOptions(id: string, patch: Partial<DownloadOptions>): Promise<void>;
    pause(id: string): Promise<void>; resume(id: string): Promise<void>; cancel(id: string): Promise<void>; retry(id: string): Promise<void>;
    pauseAll(): Promise<void>; resumeAll(): Promise<void>; clearCompleted(): Promise<void>; chooseDirectory(): Promise<string | null>; openDefaultFolder(): Promise<void>;
    openFolder(id: string): Promise<void>; openFile(id: string): Promise<void>; rename(id: string, name: string): Promise<void>;
    removeHistory(id: string): Promise<void>; getDefaults(): Promise<DownloadDefaults>;
    onChanged(listener: (event: { tasks: DownloadTask[] }) => void): () => void
  }
  notifications: {
    soundData(event: NotificationEvent): Promise<string | null>; openFolder(): Promise<void>;
    pickSound(event: NotificationEvent): Promise<boolean>; restoreSounds(): Promise<void>; test(event: NotificationEvent): Promise<void>;
    onEvent(listener: (payload: NotificationPayload) => void): () => void; onSoundEvent(listener: (event: NotificationEvent) => void): () => void
  }
  updates: { check(): Promise<UpdateInfo>; download(): Promise<void>; apply(): Promise<void>; onProgress(listener: (percent: number) => void): () => void }
}
