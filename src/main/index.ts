import { app, BrowserWindow, nativeTheme, screen, session } from 'electron'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { IPC } from '../shared/ipc'
import { APP_CONFIG } from '../shared/config'
import { MIN_WINDOW, resolveWindowBounds } from '../shared/window-bounds'
import { installSessionSecurity, lockDownWebContents } from './security'
import { applyNativeTheme, registerIpc } from './ipc'
import { getSettings, getWindowState, saveWindowState } from './settings-store'

const devServerUrl = process.env['ELECTRON_RENDERER_URL']
const isDev = !app.isPackaged && !!devServerUrl
const rendererDir = join(import.meta.dirname, '../renderer')

function isAppUrl(url: string): boolean {
  if (isDev && devServerUrl) return url.startsWith(devServerUrl)
  return url.startsWith(pathToFileURL(rendererDir).href)
}

// Windows app identity (needed for native notifications and shortcuts in later phases).
app.setAppUserModelId(APP_CONFIG.appId)

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) app.quit()

let mainWindow: BrowserWindow | null = null

function createWindow(): BrowserWindow {
  const settings = getSettings()
  applyNativeTheme(settings.theme)

  const saved = getWindowState()
  const bounds = resolveWindowBounds(
    saved,
    screen.getAllDisplays().map((d) => d.workArea)
  )

  const win = new BrowserWindow({
    ...bounds,
    minWidth: MIN_WINDOW.width,
    minHeight: MIN_WINDOW.height,
    frame: false,
    show: false,
    // Solid flat color matching the splash background (no white flash).
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#0B1120' : '#F5F7FB',
    title: APP_CONFIG.productName,
    icon: app.isPackaged ? join(process.resourcesPath, 'bvd-app-icon.png') : join(app.getAppPath(), 'build/icons/bvd-app-icon.png'),
    webPreferences: {
      preload: join(import.meta.dirname, '../preload/index.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      spellcheck: false
    }
  })

  lockDownWebContents(win.webContents, isAppUrl)
  if (saved.maximized) win.maximize()
  win.once('ready-to-show', () => win.show())

  win.on('close', () => {
    const maximized = win.isMaximized()
    saveWindowState({ ...(maximized ? getWindowState() : win.getNormalBounds()), maximized })
  })
  win.on('maximize', () => win.webContents.send(IPC.windowMaximizedChanged, true))
  win.on('unmaximize', () => win.webContents.send(IPC.windowMaximizedChanged, false))

  if (isDev && devServerUrl) void win.loadURL(devServerUrl)
  else void win.loadFile(join(rendererDir, 'index.html'))
  return win
}

void app.whenReady().then(() => {
  installSessionSecurity(session.defaultSession, isDev)
  registerIpc(isAppUrl)
  mainWindow = createWindow()

  app.on('second-instance', () => {
    if (!mainWindow) return
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  })
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) mainWindow = createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
