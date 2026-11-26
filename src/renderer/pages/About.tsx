import { useState } from 'react'
import { RefreshCw, ExternalLink, FileText, Download, CheckCircle2, AlertCircle } from 'lucide-react'
import { useT } from '../hooks/useT'
import { useSettingsStore } from '../store/settings-store'
import { APP_CONFIG } from '../../shared/config'
import { ExternalLinkButton } from '../components/ExternalLinkButton'
import type { UpdateInfo } from '../../shared/ipc'

export function AboutPage() {
  const t = useT()
  const appInfo = useSettingsStore((s) => s.appInfo)
  const [checking, setChecking] = useState(false)
  const [installing, setInstalling] = useState(false)
  const [applying, setApplying] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const [progress, setProgress] = useState(0)
  const [update, setUpdate] = useState<UpdateInfo | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function checkUpdates() {
    setChecking(true); setError(null); setUpdate(null); setDownloaded(false)
    try { setUpdate(await window.bvd.updates.check()) }
    catch (err) { setError(err instanceof Error ? err.message : t.about.updateError) }
    finally { setChecking(false) }
  }
  async function downloadUpdate() {
    setInstalling(true); setError(null); setProgress(0)
    const off = window.bvd.updates.onProgress(setProgress)
    try {
      await window.bvd.updates.download()
      setDownloaded(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : t.about.updateError)
    } finally {
      setInstalling(false)
      off()
    }
  }
  async function applyUpdate() {
    setApplying(true); setError(null)
    try { await window.bvd.updates.apply() }
    catch (err) { setError(err instanceof Error ? err.message : t.about.updateError); setApplying(false) }
  }

  return (
    <div className="page">
      <div className="page__head"><h1>{t.about.title}</h1></div>
      <section className="panel"><div className="about__hero"><img src="./brand/bvd-mark.svg" alt="BVD" /><div><div style={{ fontSize: 22, fontWeight: 800 }}>{APP_CONFIG.productName}</div><div className="setting__hint">{APP_CONFIG.tagline}</div></div></div></section>
      <section className="panel"><dl className="about__grid">
        <dt>{t.about.version}</dt><dd className="ltr">{appInfo?.version ?? '-'}</dd>
        <dt>{t.about.buildType}</dt><dd>{appInfo?.isPackaged ? (appInfo.portable ? 'Portable' : t.about.buildPackaged) : t.about.buildDev}</dd>
        <dt>{t.about.developer}</dt><dd><ExternalLinkButton url={APP_CONFIG.developer.profileUrl} label={t.about.profile}>{APP_CONFIG.developer.name}</ExternalLinkButton></dd>
        <dt>{t.about.repository}</dt><dd><ExternalLinkButton url={APP_CONFIG.github.repositoryUrl} label={t.about.repository}><span className="ltr">{APP_CONFIG.github.owner}/{APP_CONFIG.github.repo}</span></ExternalLinkButton></dd>
        <dt>{t.about.license}</dt><dd>{t.about.licenseStatus}</dd>
      </dl></section>
      <section className="panel about__links">
        <h2>{t.about.connect}</h2>
        <div className="about__link-grid">
          {APP_CONFIG.links.map((item) => <div className="about__link" key={item.label}>
            <span>{item.label}</span>
            <ExternalLinkButton url={item.url} label={item.label}>{item.action ?? item.label}</ExternalLinkButton>
          </div>)}
        </div>
      </section>
      <section className="panel">
        <h2>{t.about.updates}</h2>
        <div className="row">
          <button className="btn btn--primary" onClick={() => void checkUpdates()} disabled={checking || !appInfo?.isPackaged}><RefreshCw size={16} aria-hidden="true" />{checking ? t.settings.updates.checking : t.about.checkUpdates}</button>
          <button className="btn" onClick={() => void window.bvd.external.open(APP_CONFIG.github.releasesUrl)}><ExternalLink size={16} aria-hidden="true" />{t.about.releaseNotes}</button>
          <button className="btn" onClick={() => void window.bvd.external.open(APP_CONFIG.github.repositoryUrl)}><FileText size={16} aria-hidden="true" />{t.about.openRepository}</button>
        </div>
        {update && <div className="notice" style={{ marginTop: 14 }} role="status">
          {update.available ? <Download size={18} aria-hidden="true" /> : <CheckCircle2 size={18} aria-hidden="true" />}
          <div style={{ flex: 1 }}>
            <strong>{update.available ? t.about.updateAvailable : t.about.updateCurrent}</strong>
            <div className="setting__hint">{t.about.version}: <span className="ltr">{update.currentVersion}</span>{update.latestVersion ? ` → ${update.latestVersion}` : ''}</div>
            {update.releaseNotes && <p className="setting__hint">{update.releaseNotes}</p>}
            {update.available && <div className="row" style={{ marginTop: 8 }}>
              {!downloaded
                ? <button className="btn btn--primary" onClick={() => void downloadUpdate()} disabled={installing}>{installing ? t.settings.updates.checking : t.about.installUpdate}</button>
                : <button className="btn btn--primary" onClick={() => void applyUpdate()} disabled={applying}>{t.about.applyUpdate}</button>}
              {downloaded && <span className="setting__hint">{t.settings.updates.downloaded}</span>}
              {update.portable && <span className="setting__hint">{t.about.portableUpdate}</span>}
            </div>}
          </div>
        </div>}
        {installing && <div className="setting" style={{ marginTop: 10 }}><span>{t.common.working}</span><span className="ltr">{progress}%</span></div>}
        {applying && <div className="setting" style={{ marginTop: 10 }}><span>{t.common.working}</span></div>}
        {error && <div className="notice notice--warning" role="alert" style={{ marginTop: 12 }}><AlertCircle size={18} aria-hidden="true" />{error}</div>}
        {!appInfo?.isPackaged && <p className="setting__hint">{t.about.updatesDisabled}</p>}
        <p className="setting__hint">{t.about.releaseNotesNone}</p>
      </section>
    </div>
  )
}
