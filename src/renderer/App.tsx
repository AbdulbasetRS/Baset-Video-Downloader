import { useCallback, useEffect, useState } from 'react'
import { useDocumentTheme } from './hooks/useDocumentTheme'
import { useSettingsStore } from './store/settings-store'
import { useDownloadStore } from './store/download-store'
import { useUiStore } from './store/ui-store'
import type { NotificationPayload } from '../shared/ipc'
import { Splash } from './components/Splash'
import { TitleBar } from './components/TitleBar'
import { Sidebar } from './components/Sidebar'
import { Footer } from './components/Footer'
import { ToastViewport } from './components/ToastViewport'
import { HomePage } from './pages/Home'
import { DownloadsPage } from './pages/Downloads'
import { HistoryPage } from './pages/History'
import { SettingsPage } from './pages/Settings'
import { AboutPage } from './pages/About'

const MIN_SPLASH_MS = 600
export function App() {
  useDocumentTheme()
  const ready = useSettingsStore((s) => s.ready)
  const init = useSettingsStore((s) => s.init)
  const setFromMain = useSettingsStore((s) => s.setSettingsFromMain)
  const page = useUiStore((s) => s.page)
  const [minElapsed, setMinElapsed] = useState(false)
  const [toasts, setToasts] = useState<NotificationPayload[]>([])
  const dismiss = useCallback((id: string) => setToasts((items) => items.filter((item) => item.id !== id)), [])

  useEffect(() => {
    void init()
    void useDownloadStore.getState().load()
    const timer = window.setTimeout(() => setMinElapsed(true), MIN_SPLASH_MS)
    const offSettings = window.bvd.settings.onChanged(setFromMain)
    const offDownloads = window.bvd.downloads.onChanged(({ tasks }) => useDownloadStore.getState().setTasks(tasks))
    const offNotifications = window.bvd.notifications.onEvent((payload) => {
      setToasts((items) => [...items.slice(-3), payload])
    })
    const offNotificationSounds = window.bvd.notifications.onSoundEvent((event) => {
      const settings = useSettingsStore.getState().settings
      if (!settings.notifications.soundsEnabled) return
      void window.bvd.notifications.soundData(event).then((data) => {
        if (!data) return
        const audio = new Audio(data)
        audio.volume = Math.max(0, Math.min(1, settings.notifications.volume / 100))
        void audio.play().catch(() => undefined)
      }).catch(() => undefined)
    })
    return () => { window.clearTimeout(timer); offSettings(); offDownloads(); offNotifications(); offNotificationSounds() }
  }, [init, setFromMain])

  if (!ready || !minElapsed) return <Splash loading={!ready} />
  return (
    <div className="shell">
      <TitleBar />
      <div className="shell__body">
        <Sidebar />
        <main className="shell__main">
          {page === 'home' && <HomePage />}
          {page === 'downloads' && <DownloadsPage />}
          {page === 'history' && <HistoryPage />}
          {page === 'settings' && <SettingsPage />}
          {page === 'about' && <AboutPage />}
        </main>
      </div>
      <Footer />
      <ToastViewport items={toasts} onDismiss={dismiss} />
    </div>
  )
}
