import { useState } from 'react'
import { Wrench, Palette, Languages, Download, Film, AudioLines, Subtitles, Bell, RefreshCw, SlidersHorizontal, FolderOpen, Volume2, Info } from 'lucide-react'
import type { ReactNode } from 'react'
import type { NotificationEvent } from '../../shared/settings'
import { useT } from '../hooks/useT'
import { useSettingsStore } from '../store/settings-store'
import { Segmented } from '../components/Segmented'

 type SectionId = 'general' | 'appearance' | 'language' | 'downloads' | 'video' | 'audio' | 'subtitles' | 'notifications' | 'updates' | 'advanced'
const SECTIONS: { id: SectionId; icon: ReactNode }[] = [
  { id: 'general', icon: <SlidersHorizontal size={18} aria-hidden="true" /> },
  { id: 'appearance', icon: <Palette size={18} aria-hidden="true" /> },
  { id: 'language', icon: <Languages size={18} aria-hidden="true" /> },
  { id: 'downloads', icon: <Download size={18} aria-hidden="true" /> },
  { id: 'video', icon: <Film size={18} aria-hidden="true" /> },
  { id: 'audio', icon: <AudioLines size={18} aria-hidden="true" /> },
  { id: 'subtitles', icon: <Subtitles size={18} aria-hidden="true" /> },
  { id: 'notifications', icon: <Bell size={18} aria-hidden="true" /> },
  { id: 'updates', icon: <RefreshCw size={18} aria-hidden="true" /> },
  { id: 'advanced', icon: <Wrench size={18} aria-hidden="true" /> }
]
const EVENT_ROWS: { key: NotificationEvent; label: 'queued' | 'started' | 'completed' | 'failed' | 'paused' | 'resumed' | 'canceled' | 'update' | 'updateDownloaded' }[] = [
  { key: 'downloadQueued', label: 'queued' }, { key: 'downloadStarted', label: 'started' },
  { key: 'downloadCompleted', label: 'completed' }, { key: 'downloadFailed', label: 'failed' },
  { key: 'downloadPaused', label: 'paused' }, { key: 'downloadResumed', label: 'resumed' }, { key: 'downloadCanceled', label: 'canceled' },
  { key: 'updateAvailable', label: 'update' }, { key: 'updateDownloaded', label: 'updateDownloaded' }
]

export function SettingsPage() {
  const t = useT()
  const { settings, update } = useSettingsStore()
  const [section, setSection] = useState<SectionId>('appearance')
  const [message, setMessage] = useState<string | null>(null)

  async function chooseFolder() {
    const folder = await window.bvd.downloads.chooseDirectory()
    if (folder) await update({ defaultOutputDirectory: folder })
  }
  async function updateEvent(event: NotificationEvent, field: 'inApp' | 'desktop' | 'sound', value: boolean) {
    const notifications = {
      ...settings.notifications,
      events: { ...settings.notifications.events, [event]: { ...settings.notifications.events[event], [field]: value } }
    }
    await update({ notifications })
  }
  async function runAction(action: () => Promise<unknown>, success: string) {
    setMessage(null)
    try { await action(); setMessage(success) }
    catch (error) { setMessage(error instanceof Error ? error.message : String(error)) }
  }

  return (
    <div className="page">
      <div className="page__head"><h1>{t.settings.title}</h1><p>{t.settings.subtitle}</p></div>
      <div className="settings">
        <nav className="settings__nav" aria-label={t.settings.title}>
          {SECTIONS.map((item) => <button key={item.id} className="navitem" aria-current={item.id === section ? 'page' : undefined} onClick={() => { setSection(item.id); setMessage(null) }}>{item.icon}<span className="navitem__label">{t.settings.sections[item.id]}</span></button>)}
        </nav>
        <section className="panel" aria-label={t.settings.sections[section]}>
          <h2>{t.settings.sections[section]}</h2>

          {section === 'appearance' && <>
            <div className="setting"><div><div className="setting__label">{t.settings.appearance.theme}</div><div className="setting__hint">{t.settings.appearance.themeHint}</div></div><Segmented label={t.settings.appearance.theme} value={settings.theme} onChange={(theme) => void update({ theme })} options={[{ value: 'system', label: t.theme.system }, { value: 'light', label: t.theme.light }, { value: 'dark', label: t.theme.dark }]} /></div>
            <div className="setting"><div><div className="setting__label">{t.settings.appearance.sidebar}</div><div className="setting__hint">{t.settings.appearance.sidebarHint}</div></div><Segmented label={t.settings.appearance.sidebar} value={settings.sidebarMode} onChange={(sidebarMode) => void update({ sidebarMode })} options={[{ value: 'expanded', label: t.settings.appearance.expandedSidebar }, { value: 'collapsed', label: t.settings.appearance.collapsedSidebar }]} /></div>
            <div className="setting"><div><div className="setting__label">{t.settings.appearance.cards}</div><div className="setting__hint">{t.settings.appearance.cardsHint}</div></div><Segmented label={t.settings.appearance.cards} value={settings.cardMode} onChange={(cardMode) => void update({ cardMode })} options={[{ value: 'compact', label: t.card.compact }, { value: 'expanded', label: t.card.expanded }]} /></div>
          </>}

          {section === 'language' && <div className="setting"><div><div className="setting__label">{t.settings.language.label}</div><div className="setting__hint">{t.settings.language.hint}</div></div><Segmented label={t.settings.language.label} value={settings.language} onChange={(language) => void update({ language })} options={[{ value: 'en', label: 'English' }, { value: 'ar', label: 'العربية' }]} /></div>}

          {section === 'downloads' && <>
            <div className="setting"><div><div className="setting__label">{t.settings.downloads.folder}</div><div className="setting__hint">{settings.defaultOutputDirectory || t.common.unknown}</div></div><button className="btn" onClick={() => void chooseFolder()}><FolderOpen size={16} aria-hidden="true" />{t.settings.downloads.chooseFolder}</button></div>
            <div className="setting"><div><div className="setting__label">{t.settings.downloads.concurrency}</div><div className="setting__hint">{t.settings.downloads.concurrencyHint}</div></div><select className="field" value={settings.maxConcurrentDownloads} onChange={(e) => void update({ maxConcurrentDownloads: Number(e.target.value) })}><option value={1}>1</option><option value={2}>2</option><option value={3}>3</option><option value={4}>4</option><option value={5}>5</option></select></div>
            <div className="row settings__actions"><button className="btn" onClick={() => void window.bvd.downloads.openDefaultFolder()}><FolderOpen size={16} aria-hidden="true" />{t.settings.downloads.openFolder}</button></div>
          </>}

          {section === 'notifications' && <>
            <div className="switch-row"><span>{t.settings.notifications.inApp}</span><input type="checkbox" checked={settings.notifications.inAppEnabled} onChange={(e) => void update({ notifications: { ...settings.notifications, inAppEnabled: e.target.checked } })} /></div>
            <div className="switch-row"><span>{t.settings.notifications.desktop}</span><input type="checkbox" checked={settings.notifications.desktopEnabled} onChange={(e) => void update({ notifications: { ...settings.notifications, desktopEnabled: e.target.checked } })} /></div>
            <div className="switch-row"><span>{t.settings.notifications.sounds}</span><input type="checkbox" checked={settings.notifications.soundsEnabled} onChange={(e) => void update({ notifications: { ...settings.notifications, soundsEnabled: e.target.checked } })} /></div>
            <div className="setting"><div className="setting__label row"><Volume2 size={16} aria-hidden="true" />{t.settings.notifications.volume}</div><div className="row"><input type="range" min={0} max={100} step={5} value={settings.notifications.volume} onChange={(e) => void update({ notifications: { ...settings.notifications, volume: Number(e.target.value) } })} /><span className="ltr">{settings.notifications.volume}%</span></div></div>
            <h3>{t.settings.notifications.event}</h3>
            <div className="notification-table">
              <div className="notification-table__head"><span>{t.settings.notifications.event}</span><span>{t.settings.notifications.inAppCol}</span><span>{t.settings.notifications.desktopCol}</span><span>{t.settings.notifications.soundCol}</span><span></span></div>
              {EVENT_ROWS.map((row) => <div className="notification-table__row" key={row.key}>
                <strong>{t.settings.notifications[row.label]}</strong>
                <label className="notification-cell"><span>{t.settings.notifications.inAppCol}</span><input type="checkbox" checked={settings.notifications.events[row.key]?.inApp ?? false} onChange={(e) => void updateEvent(row.key, 'inApp', e.target.checked)} /></label>
                <label className="notification-cell"><span>{t.settings.notifications.desktopCol}</span><input type="checkbox" checked={settings.notifications.events[row.key]?.desktop ?? false} onChange={(e) => void updateEvent(row.key, 'desktop', e.target.checked)} /></label>
                <label className="notification-cell"><span>{t.settings.notifications.soundCol}</span><input type="checkbox" checked={settings.notifications.events[row.key]?.sound ?? false} onChange={(e) => void updateEvent(row.key, 'sound', e.target.checked)} /></label>
                <button className="btn btn--sm notification-table__choose" onClick={() => void runAction(() => window.bvd.notifications.pickSound(row.key), t.settings.notifications.choose)}>{t.settings.notifications.choose}</button>
              </div>)}
            </div>
            <div className="row" style={{ marginTop: 14 }}>
              <button className="btn" onClick={() => void runAction(() => window.bvd.notifications.test('downloadCompleted'), t.settings.notifications.test)}>{t.settings.notifications.test}</button>
              <button className="btn" onClick={() => void runAction(() => window.bvd.notifications.openFolder(), t.settings.notifications.openFolder)}><FolderOpen size={15} />{t.settings.notifications.openFolder}</button>
              <button className="btn" onClick={() => void runAction(() => window.bvd.notifications.restoreSounds(), t.settings.notifications.restore)}>{t.settings.notifications.restore}</button>
            </div>
          </>}

          {section === 'updates' && <>
            <div className="notice"><Info size={18} aria-hidden="true" /><span>{t.settings.updates.portable}</span></div>
            <button className="btn btn--primary" onClick={() => void (async () => {
              setMessage(null)
              try {
                const result = await window.bvd.updates.check()
                setMessage(result.available ? `${t.about.updateAvailable} · ${result.latestVersion}` : t.settings.updates.current)
              } catch (error) { setMessage(error instanceof Error ? error.message : t.settings.updates.failed) }
            })()}><RefreshCw size={16} aria-hidden="true" />{t.about.checkUpdates}</button>
          </>}
          {(section === 'general' || section === 'video' || section === 'audio' || section === 'subtitles') && <div className="notice"><Info size={18} aria-hidden="true" /><span>{section === 'video' || section === 'audio' || section === 'subtitles' ? t.settings.optionsInHome : t.settings.generalHint}</span></div>}
          {section === 'advanced' && <div className="setting"><div><div className="setting__label">{t.settings.advanced.title}</div><div className="setting__hint">{t.settings.advanced.description}</div></div><button className="btn" onClick={() => void window.bvd.notifications.openFolder()}><FolderOpen size={15}/>{t.settings.notifications.openFolder}</button></div>}
          {message && <div className="notice" role="status" style={{ marginTop: 14 }}>{message}</div>}
        </section>
      </div>
    </div>
  )
}
