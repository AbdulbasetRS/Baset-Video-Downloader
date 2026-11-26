import { contextBridge, ipcRenderer } from 'electron'
import { IPC, type BvdApi } from '../shared/ipc'
import type { NotificationEvent } from '../shared/settings'
import type { DownloadAddRequest } from '../shared/tasks'

const api: BvdApi = {
  settings: {
    get: () => ipcRenderer.invoke(IPC.settingsGet),
    update: (patch) => ipcRenderer.invoke(IPC.settingsUpdate, patch),
    onChanged: (listener) => {
      const handler = (_event: Electron.IpcRendererEvent, settings: Parameters<typeof listener>[0]) => listener(settings)
      ipcRenderer.on(IPC.settingsChanged, handler)
      return () => ipcRenderer.removeListener(IPC.settingsChanged, handler)
    }
  },
  app: { info: () => ipcRenderer.invoke(IPC.appInfo) },
  window: {
    minimize: () => ipcRenderer.invoke(IPC.windowMinimize),
    toggleMaximize: () => ipcRenderer.invoke(IPC.windowToggleMaximize),
    close: () => ipcRenderer.invoke(IPC.windowClose),
    onMaximizedChanged: (listener) => {
      const handler = (_event: Electron.IpcRendererEvent, value: boolean) => listener(value)
      ipcRenderer.on(IPC.windowMaximizedChanged, handler)
      return () => ipcRenderer.removeListener(IPC.windowMaximizedChanged, handler)
    }
  },
  external: { open: (url) => ipcRenderer.invoke(IPC.externalOpen, url) },
  clipboard: { readText: () => ipcRenderer.invoke(IPC.clipboardReadText) },
  downloads: {
    list: () => ipcRenderer.invoke(IPC.downloadsList),
    preview: (url) => ipcRenderer.invoke(IPC.downloadsPreview, url),
    add: (requests: DownloadAddRequest[]) => ipcRenderer.invoke(IPC.downloadsAdd, requests),
    updateOptions: (id, patch) => ipcRenderer.invoke(IPC.downloadsUpdateOptions, { id, patch }),
    pause: (id) => ipcRenderer.invoke(IPC.downloadsPause, id),
    resume: (id) => ipcRenderer.invoke(IPC.downloadsResume, id),
    cancel: (id) => ipcRenderer.invoke(IPC.downloadsCancel, id),
    retry: (id) => ipcRenderer.invoke(IPC.downloadsRetry, id),
    pauseAll: () => ipcRenderer.invoke(IPC.downloadsPauseAll),
    resumeAll: () => ipcRenderer.invoke(IPC.downloadsResumeAll),
    clearCompleted: () => ipcRenderer.invoke(IPC.downloadsClearCompleted),
    chooseDirectory: () => ipcRenderer.invoke(IPC.downloadsChooseDirectory),
    openDefaultFolder: () => ipcRenderer.invoke(IPC.downloadsOpenDefaultFolder),
    openFolder: (id) => ipcRenderer.invoke(IPC.downloadsOpenFolder, id),
    openFile: (id) => ipcRenderer.invoke(IPC.downloadsOpenFile, id),
    rename: (id, name) => ipcRenderer.invoke(IPC.downloadsRename, { id, name }),
    removeHistory: (id) => ipcRenderer.invoke(IPC.downloadsRemoveHistory, id),
    getDefaults: () => ipcRenderer.invoke(IPC.downloadsDefaults),
    onChanged: (listener) => {
      const handler = (_event: Electron.IpcRendererEvent, payload: { tasks: import('../shared/tasks').DownloadTask[] }) => listener(payload)
      ipcRenderer.on(IPC.downloadsChanged, handler)
      return () => ipcRenderer.removeListener(IPC.downloadsChanged, handler)
    }
  },
  notifications: {
    soundData: (event: NotificationEvent) => ipcRenderer.invoke(IPC.notificationsSoundData, event),
    openFolder: () => ipcRenderer.invoke(IPC.notificationsOpenFolder),
    pickSound: (event: NotificationEvent) => ipcRenderer.invoke(IPC.notificationsPickSound, event),
    restoreSounds: () => ipcRenderer.invoke(IPC.notificationsRestoreSounds),
    test: (event: NotificationEvent) => ipcRenderer.invoke(IPC.notificationsTest, event),
    onEvent: (listener) => {
      const handler = (_event: Electron.IpcRendererEvent, payload: import('../shared/ipc').NotificationPayload) => listener(payload)
      ipcRenderer.on(IPC.notificationsEvent, handler)
      return () => ipcRenderer.removeListener(IPC.notificationsEvent, handler)
    },
    onSoundEvent: (listener) => {
      const handler = (_event: Electron.IpcRendererEvent, event: NotificationEvent) => listener(event)
      ipcRenderer.on(IPC.notificationsSoundEvent, handler)
      return () => ipcRenderer.removeListener(IPC.notificationsSoundEvent, handler)
    }
  },
  updates: {
    check: () => ipcRenderer.invoke(IPC.updatesCheck),
    install: () => ipcRenderer.invoke(IPC.updatesInstall),
    onProgress: (listener) => {
      const handler = (_event: Electron.IpcRendererEvent, percent: number) => listener(percent)
      ipcRenderer.on(IPC.updatesProgress, handler)
      return () => ipcRenderer.removeListener(IPC.updatesProgress, handler)
    }
  }
}

contextBridge.exposeInMainWorld('bvd', api)
