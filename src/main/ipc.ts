import { app, BrowserWindow, clipboard, ipcMain, shell, nativeTheme, type IpcMainInvokeEvent } from 'electron'
import { z } from 'zod'
import { IPC, type AppInfo } from '../shared/ipc'
import { isAllowedExternalUrl } from '../shared/external'
import { settingsPatchSchema, NOTIFICATION_EVENTS } from '../shared/settings'
import { getSettings, updateSettings } from './settings-store'
import { isTrustedSender } from './security'
import {
  addDownloads, cancelDownload, chooseDownloadDirectory, clearCompleted, getDownloadDefaults, openDefaultDownloadFolder,
  initializeDownloader, listDownloads, openTaskFile, openTaskFolder, pauseAll, pauseDownload,
  previewMedia, removeHistory, renameTaskFile, resumeAll, resumeDownload, retryDownload, updateTaskOptions
} from './services/downloader'
import { initializeSounds, notify, openSoundsFolder, pickSound, restoreSounds, soundData } from './services/notifications'
import { checkForUpdates, installLatestUpdate } from './services/updates'

type Guard = (url: string) => boolean
function windowFor(event: IpcMainInvokeEvent): BrowserWindow | null { return BrowserWindow.fromWebContents(event.sender) }
function handle<S extends z.ZodType>(channel: string, isAppUrl: Guard, schema: S | null, fn: (payload: z.infer<S>, event: IpcMainInvokeEvent) => unknown): void {
  ipcMain.handle(channel, (event, raw: unknown) => {
    if (!isTrustedSender(event, isAppUrl)) throw new Error('Untrusted IPC sender')
    const payload = schema ? schema.parse(raw) : (undefined as z.infer<S>)
    return fn(payload, event)
  })
}
const idSchema = z.string().uuid()
const optionsSchema = z.object({ container: z.enum(['mp4', 'mkv', 'webm', 'mp3', 'm4a', 'wav']).optional(), quality: z.enum(['best', '2160', '1440', '1080', '720', '480', '360']).optional(), audioOnly: z.boolean().optional(), audioQuality: z.enum(['best', '320', '256', '192', '128']).optional(), startTime: z.string().max(20).nullable().optional(), endTime: z.string().max(20).nullable().optional(), subtitleEnabled: z.boolean().optional(), subtitleLanguages: z.array(z.string().max(16)).max(10).optional(), subtitleFormat: z.enum(['srt', 'vtt', 'ass']).optional(), outputDirectory: z.string().max(2048).optional(), outputName: z.string().max(180).optional() }).strict()
const addSchema = z.array(z.object({
  url: z.string().min(1).max(4096),
  options: optionsSchema.optional(),
  selectedEntryUrls: z.array(z.string().min(1).max(4096)).max(500).optional()
}).strict()).min(1).max(100)
const renameSchema = z.object({ id: idSchema, name: z.string().min(1).max(180) }).strict()
const updateOptionsSchema = z.object({ id: idSchema, patch: optionsSchema }).strict()
const eventSchema = z.enum(NOTIFICATION_EVENTS)

export function applyNativeTheme(theme: 'system' | 'light' | 'dark'): void { nativeTheme.themeSource = theme }

export function registerIpc(isAppUrl: Guard): void {
  initializeDownloader()
  void initializeSounds()
  handle(IPC.settingsGet, isAppUrl, null, () => getSettings())
  handle(IPC.settingsUpdate, isAppUrl, settingsPatchSchema, (patch) => {
    const next = updateSettings(patch)
    if (patch.theme) applyNativeTheme(next.theme)
    for (const win of BrowserWindow.getAllWindows()) win.webContents.send(IPC.settingsChanged, next)
    return next
  })
  handle(IPC.appInfo, isAppUrl, null, (_p, event): AppInfo => ({
    version: app.getVersion(), platform: process.platform, isPackaged: app.isPackaged,
    isMaximized: windowFor(event)?.isMaximized() ?? false, portable: !!process.env.PORTABLE_EXECUTABLE_FILE
  }))
  handle(IPC.windowMinimize, isAppUrl, null, (_p, e) => windowFor(e)?.minimize())
  handle(IPC.windowToggleMaximize, isAppUrl, null, (_p, e) => { const win = windowFor(e); if (!win) return; if (win.isMaximized()) win.unmaximize(); else win.maximize() })
  handle(IPC.windowClose, isAppUrl, null, (_p, e) => windowFor(e)?.close())
  handle(IPC.clipboardReadText, isAppUrl, null, async () => (await clipboard.readText()).slice(0, 100_000))
  handle(IPC.externalOpen, isAppUrl, z.string().max(2048), async (url) => { if (!isAllowedExternalUrl(url)) return false; await shell.openExternal(url); return true })

  handle(IPC.downloadsList, isAppUrl, null, () => listDownloads())
  handle(IPC.downloadsPreview, isAppUrl, z.string().min(1).max(4096), (url) => previewMedia(url))
  handle(IPC.downloadsAdd, isAppUrl, addSchema, (requests) => addDownloads(requests))
  handle(IPC.downloadsPause, isAppUrl, idSchema, (id) => pauseDownload(id))
  handle(IPC.downloadsResume, isAppUrl, idSchema, (id) => resumeDownload(id))
  handle(IPC.downloadsCancel, isAppUrl, idSchema, (id) => cancelDownload(id))
  handle(IPC.downloadsRetry, isAppUrl, idSchema, (id) => retryDownload(id))
  handle(IPC.downloadsUpdateOptions, isAppUrl, updateOptionsSchema, ({ id, patch }) => updateTaskOptions(id, patch))
  handle(IPC.downloadsPauseAll, isAppUrl, null, () => pauseAll())
  handle(IPC.downloadsResumeAll, isAppUrl, null, () => resumeAll())
  handle(IPC.downloadsClearCompleted, isAppUrl, null, () => clearCompleted())
  handle(IPC.downloadsChooseDirectory, isAppUrl, null, () => chooseDownloadDirectory())
  handle(IPC.downloadsOpenDefaultFolder, isAppUrl, null, () => openDefaultDownloadFolder())
  handle(IPC.downloadsOpenFolder, isAppUrl, idSchema, (id) => openTaskFolder(id))
  handle(IPC.downloadsOpenFile, isAppUrl, idSchema, (id) => openTaskFile(id))
  handle(IPC.downloadsRename, isAppUrl, renameSchema, ({ id, name }) => renameTaskFile(id, name))
  handle(IPC.downloadsRemoveHistory, isAppUrl, idSchema, (id) => removeHistory(id))
  handle(IPC.downloadsDefaults, isAppUrl, null, () => getDownloadDefaults())

  handle(IPC.notificationsSoundData, isAppUrl, eventSchema, (event) => soundData(event))
  handle(IPC.notificationsOpenFolder, isAppUrl, null, () => openSoundsFolder())
  handle(IPC.notificationsPickSound, isAppUrl, eventSchema, (event) => pickSound(event))
  handle(IPC.notificationsRestoreSounds, isAppUrl, null, () => restoreSounds())
  handle(IPC.notificationsTest, isAppUrl, eventSchema, (event) => notify(event, getSettings().language === 'ar' ? 'اختبار الصوت والإشعار.' : 'This is a notification test.'))

  handle(IPC.updatesCheck, isAppUrl, null, () => checkForUpdates())
  handle(IPC.updatesInstall, isAppUrl, null, () => installLatestUpdate())
}
