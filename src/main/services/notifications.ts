import { app, BrowserWindow, dialog, Notification, shell } from 'electron'
import { copyFile, mkdir, readFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
import type { NotificationEvent } from '../../shared/settings'
import { getSettings } from '../settings-store'
import { IPC, type NotificationPayload } from '../../shared/ipc'

const SOUND_EVENTS: NotificationEvent[] = [
  'downloadQueued', 'downloadStarted', 'downloadCompleted', 'downloadFailed',
  'downloadPaused', 'downloadResumed', 'downloadCanceled', 'updateAvailable', 'updateDownloaded'
]

const EN: Record<NotificationEvent, { title: string; body: string }> = {
  downloadQueued: { title: 'Added to queue', body: 'The download has been added to your queue.' },
  downloadStarted: { title: 'Download started', body: 'Your download has started.' },
  downloadCompleted: { title: 'Download completed', body: 'Your file is ready.' },
  downloadFailed: { title: 'Download failed', body: 'The download could not be completed.' },
  downloadPaused: { title: 'Download paused', body: 'The download was paused.' },
  downloadResumed: { title: 'Download resumed', body: 'The download has resumed.' },
  downloadCanceled: { title: 'Download canceled', body: 'The download was canceled.' },
  updateAvailable: { title: 'Update available', body: 'A newer version of BVD is available.' },
  updateDownloaded: { title: 'Update ready', body: 'The update has been downloaded and is ready to install.' }
}
const AR: Record<NotificationEvent, { title: string; body: string }> = {
  downloadQueued: { title: 'تمت الإضافة للقائمة', body: 'تمت إضافة التحميل إلى قائمة الانتظار.' },
  downloadStarted: { title: 'بدأ التحميل', body: 'بدأ تحميل الملف.' },
  downloadCompleted: { title: 'اكتمل التحميل', body: 'أصبح الملف جاهزا.' },
  downloadFailed: { title: 'فشل التحميل', body: 'تعذر إكمال عملية التحميل.' },
  downloadPaused: { title: 'تم إيقاف التحميل مؤقتا', body: 'تم إيقاف التحميل مؤقتا.' },
  downloadResumed: { title: 'تم استكمال التحميل', body: 'استكمل البرنامج تحميل الملف.' },
  downloadCanceled: { title: 'تم إلغاء التحميل', body: 'تم إلغاء عملية التحميل.' },
  updateAvailable: { title: 'يتوفر تحديث جديد', body: 'يتوفر إصدار أحدث من BVD.' },
  updateDownloaded: { title: 'التحديث جاهز', body: 'تم تنزيل التحديث وأصبح جاهزا للتثبيت.' }
}

export function soundsDirectory(): string {
  return join(app.getPath('userData'), 'sounds')
}

export async function initializeSounds(): Promise<void> {
  const target = soundsDirectory()
  await mkdir(target, { recursive: true })
  const source = app.isPackaged
    ? join(process.resourcesPath, 'sounds')
    : join(app.getAppPath(), 'resources', 'sounds')
  await Promise.all(SOUND_EVENTS.map(async (event) => {
    const file = `${event.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}.wav`
    const destination = join(target, file)
    try { await readFile(destination) }
    catch {
      try { await copyFile(join(source, file), destination) }
      catch { /* Missing optional sound must never prevent application startup. */ }
    }
  }))
}

export function notify(event: NotificationEvent, detail?: string): void {
  const settings = getSettings()
  const toggle = settings.notifications.events[event]
  if (!toggle) return
  const fallback = settings.language === 'ar' ? AR[event] : EN[event]
  const payload: NotificationPayload = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    event,
    title: fallback.title,
    body: detail ? `${fallback.body} ${detail.slice(0, 120)}` : fallback.body,
    createdAt: Date.now()
  }
  if (settings.notifications.inAppEnabled && toggle.inApp) {
    for (const win of BrowserWindow.getAllWindows()) win.webContents.send(IPC.notificationsEvent, payload)
  }
  if (settings.notifications.soundsEnabled && toggle.sound) {
    for (const win of BrowserWindow.getAllWindows()) win.webContents.send(IPC.notificationsSoundEvent, event)
  }
  if (settings.notifications.desktopEnabled && toggle.desktop && Notification.isSupported()) {
    const notification = new Notification({ title: payload.title, body: payload.body, silent: true })
    notification.show()
  }
}

export async function soundData(event: NotificationEvent): Promise<string | null> {
  if (!SOUND_EVENTS.includes(event)) return null
  const file = `${event.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}.wav`
  try {
    const data = await readFile(join(soundsDirectory(), file))
    return `data:audio/wav;base64,${data.toString('base64')}`
  } catch { return null }
}

export async function pickSound(event: NotificationEvent): Promise<boolean> {
  if (!SOUND_EVENTS.includes(event)) return false
  const result = await dialog.showOpenDialog({
    title: 'Choose notification sound', properties: ['openFile'],
    filters: [{ name: 'WAV audio', extensions: ['wav'] }]
  })
  if (result.canceled || !result.filePaths[0]) return false
  const source = result.filePaths[0]
  if (extname(source).toLowerCase() !== '.wav') return false
  const data = await readFile(source)
  if (data.length < 44 || data.length > 10 * 1024 * 1024 || data.toString('ascii', 0, 4) !== 'RIFF' || data.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error('The selected file is not a valid WAV audio file.')
  }
  const file = `${event.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}.wav`
  await mkdir(soundsDirectory(), { recursive: true })
  await copyFile(source, join(soundsDirectory(), file))
  return true
}

export async function restoreSounds(): Promise<void> {
  const target = soundsDirectory()
  const source = app.isPackaged
    ? join(process.resourcesPath, 'sounds')
    : join(app.getAppPath(), 'resources', 'sounds')
  await mkdir(target, { recursive: true })
  await Promise.all(SOUND_EVENTS.map(async (event) => {
    const file = `${event.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}.wav`
    await copyFile(join(source, file), join(target, file))
  }))
}

export async function openSoundsFolder(): Promise<void> {
  await mkdir(soundsDirectory(), { recursive: true })
  const error = await shell.openPath(soundsDirectory())
  if (error) throw new Error(error)
}

