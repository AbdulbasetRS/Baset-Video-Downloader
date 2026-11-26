import { useEffect, useMemo, useState } from 'react'
import { ClipboardPaste, Eraser, Pause, Play, Trash2, Download, FolderOpen, Info, Video, CheckSquare, Square, Eye, ListChecks } from 'lucide-react'
import { useT } from '../hooks/useT'
import { useSettingsStore } from '../store/settings-store'
import { useDownloadStore } from '../store/download-store'
import { parseSourceUrls } from '../../shared/url'
import { DEFAULT_DOWNLOAD_OPTIONS } from '../../shared/tasks'
import type { MediaContainer, MediaPreview } from '../../shared/tasks'
import { TaskCard } from '../components/TaskCard'
import { TaskFilters, matchesFilter, type StatusFilter } from '../components/TaskFilters'
import { EmptyState } from '../components/EmptyState'
import { Select } from '../components/Select'
import { TimeRangeControl, timeToSeconds } from '../components/TimeRangeControl'

interface PreviewItem {
  url: string
  title: string
  durationSeconds: number | null
  thumbnailUrl: string | null
}
interface PreviewBundle {
  sourceUrl: string
  preview: MediaPreview
  items: PreviewItem[]
  selectedUrls: string[]
}

export function HomePage() {
  const t = useT()
  const settings = useSettingsStore((s) => s.settings)
  const tasks = useDownloadStore((s) => s.tasks)
  const add = useDownloadStore((s) => s.add)
  const pause = useDownloadStore((s) => s.pause)
  const resume = useDownloadStore((s) => s.resume)
  const cancel = useDownloadStore((s) => s.cancel)
  const retry = useDownloadStore((s) => s.retry)
  const pauseAll = useDownloadStore((s) => s.pauseAll)
  const resumeAll = useDownloadStore((s) => s.resumeAll)
  const clearCompleted = useDownloadStore((s) => s.clearCompleted)
  const [text, setText] = useState('')
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [isAdding, setIsAdding] = useState(false)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [previewResults, setPreviewResults] = useState<PreviewBundle[]>([])
  const [error, setError] = useState<string | null>(null)
  const [format, setFormat] = useState<MediaContainer>(DEFAULT_DOWNLOAD_OPTIONS.container)
  const [quality, setQuality] = useState(DEFAULT_DOWNLOAD_OPTIONS.quality)
  const [audioOnly, setAudioOnly] = useState(false)
  const [audioQuality, setAudioQuality] = useState(DEFAULT_DOWNLOAD_OPTIONS.audioQuality)
  const [subtitleEnabled, setSubtitleEnabled] = useState(false)
  const [subtitleLanguages, setSubtitleLanguages] = useState('en,ar')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [outputDirectory, setOutputDirectory] = useState(settings.defaultOutputDirectory)
  const [outputName, setOutputName] = useState('')
  const [showOptions, setShowOptions] = useState(true)

  useEffect(() => {
    void window.bvd.downloads.getDefaults().then((value) => setOutputDirectory(settings.defaultOutputDirectory || value.outputDirectory)).catch(() => undefined)
  }, [settings.defaultOutputDirectory])

  const parsed = useMemo(() => parseSourceUrls(text), [text])
  const visibleTasks = tasks.filter((task) => matchesFilter(task, filter)).slice(0, 8)
  const trimDurationSeconds = previewResults.length === 1 && !previewResults[0].preview.isPlaylist
    ? previewResults[0].preview.durationSeconds
    : null
  const trimError = (() => {
    if (!startTime.trim() && !endTime.trim()) return null
    if (!startTime.trim() || !endTime.trim()) return t.home.timeRangeRequired
    const start = timeToSeconds(startTime)
    const end = timeToSeconds(endTime)
    if (start === null || end === null) return t.home.timeRangeInvalid
    if (end <= start) return t.home.timeRangeOrder
    if (trimDurationSeconds !== null && end > trimDurationSeconds) return t.home.timeRangeBeyondDuration
    return null
  })()

  async function paste() {
    const clip = await window.bvd.clipboard.readText()
    if (clip) {
      setText((prev) => (prev ? `${prev.replace(/\s+$/, '')}\n${clip}` : clip))
      setPreviewResults([])
    }
  }
  async function chooseFolder() {
    const folder = await window.bvd.downloads.chooseDirectory()
    if (folder) setOutputDirectory(folder)
  }
  async function previewLinks() {
    setError(null)
    if (!parsed.valid.length) { setError(t.home.noValidLinks); return }
    setIsPreviewing(true)
    try {
      const results = await Promise.all(parsed.valid.map(async (url): Promise<PreviewBundle> => {
        const preview = await window.bvd.downloads.preview(url)
        const items: PreviewItem[] = preview.isPlaylist && preview.entries.length
          ? preview.entries.map((entry) => ({ url: entry.url, title: entry.title, durationSeconds: entry.durationSeconds, thumbnailUrl: entry.thumbnailUrl }))
          : [{ url: preview.sourceUrl, title: preview.title, durationSeconds: preview.durationSeconds, thumbnailUrl: preview.thumbnailUrl }]
        return { sourceUrl: url, preview, items, selectedUrls: items.map((item) => item.url) }
      }))
      setPreviewResults(results)
    } catch (err) { setError(err instanceof Error ? err.message : String(err)) }
    finally { setIsPreviewing(false) }
  }
  async function startDownloads() {
    setError(null)
    if (trimError) { setError(trimError); return }
    const requests = previewResults.map((bundle) => ({
      url: bundle.sourceUrl,
      ...(bundle.preview.isPlaylist ? { selectedEntryUrls: bundle.selectedUrls } : {}),
      options: {
        ...DEFAULT_DOWNLOAD_OPTIONS, container: format, quality, audioOnly,
        audioQuality, subtitleEnabled, subtitleLanguages: subtitleLanguages.split(',').map((x) => x.trim()).filter(Boolean).slice(0, 10),
        startTime: startTime.trim() || null, endTime: endTime.trim() || null,
        outputDirectory, outputName
      }
    }))
    if (!requests.length || !previewResults.some((bundle) => bundle.selectedUrls.length > 0)) {
      setError(t.home.selectAtLeastOne)
      return
    }
    setIsAdding(true)
    try {
      await add(requests)
      setText('')
      setOutputName('')
      setPreviewResults([])
    } catch (err) { setError(err instanceof Error ? err.message : String(err)) }
    finally { setIsAdding(false) }
  }
  function selectAll(bundleIndex: number, selected: boolean) {
    setPreviewResults((current) => current.map((bundle, index) => index === bundleIndex
      ? { ...bundle, selectedUrls: selected ? bundle.items.map((item) => item.url) : [] }
      : bundle))
  }
  function toggleItem(bundleIndex: number, url: string, selected: boolean) {
    setPreviewResults((current) => current.map((bundle, index) => {
      if (index !== bundleIndex) return bundle
      const urls = new Set(bundle.selectedUrls)
      if (selected) urls.add(url)
      else urls.delete(url)
      return { ...bundle, selectedUrls: [...urls] }
    }))
  }
  const selectedCount = previewResults.reduce((count, bundle) => count + bundle.selectedUrls.length, 0)
  const actionProps = { onPause: (id: string) => void pause(id), onResume: (id: string) => void resume(id), onCancel: (id: string) => void cancel(id), onRetry: (id: string) => void retry(id), onOpenFolder: (id: string) => void window.bvd.downloads.openFolder(id), onOpenFile: (id: string) => void window.bvd.downloads.openFile(id) }

  return (
    <div className="page">
      <div className="page__head"><h1>{t.home.title}</h1><p>{t.home.subtitle}</p></div>
      <div className="notice" role="note"><Info size={18} aria-hidden="true" className="icon" /><span>{t.home.engineBanner}</span></div>

      <section className="panel urlbox">
        <label htmlFor="urls" className="sr-only">{t.home.inputLabel}</label>
        <textarea id="urls" value={text} placeholder={t.home.placeholder} spellCheck={false} onChange={(e) => { setText(e.target.value); setPreviewResults([]); setError(null) }} />
        <div className="row">
          <button className="btn" onClick={() => void paste()}><ClipboardPaste size={16} aria-hidden="true" />{t.common.paste}</button>
          <button className="btn" onClick={() => { setText(''); setError(null); setPreviewResults([]) }} disabled={!text}><Eraser size={16} aria-hidden="true" />{t.common.clear}</button>
          <button className="btn" onClick={() => setShowOptions((value) => !value)}>{showOptions ? t.home.hideOptions : t.home.options}</button>
          <div style={{ flex: 1 }} />
          {previewResults.length > 0
            ? <button className="btn btn--primary" onClick={() => void startDownloads()} disabled={isAdding || selectedCount === 0}><Download size={16} aria-hidden="true" />{isAdding ? t.home.adding : `${t.home.addSelected} (${selectedCount})`}</button>
            : <button className="btn btn--primary" onClick={() => void previewLinks()} disabled={!text.trim() || isPreviewing}><Eye size={16} aria-hidden="true" />{isPreviewing ? t.home.previewing : t.home.previewLinks}</button>}
        </div>
        {(parsed.issues.length > 0 || error) && <div className="notice notice--warning" role="alert">{error || `${parsed.issues.length} ${t.home.invalidLinks}`}</div>}
        {parsed.valid.length > 0 && <span className="chip">{t.home.lines}: <span className="ltr">{parsed.valid.length}</span></span>}
        {showOptions && (
          <>
            <h2 style={{ margin: '8px 0 0', fontSize: 16 }}>{t.home.options}</h2>
            <div className="form-grid">
              <div className="form-field"><label>{t.home.format}</label><Select label={t.home.format} value={format} onChange={(value) => { const next = value as MediaContainer; setFormat(next); setAudioOnly(['mp3', 'm4a', 'wav'].includes(next)) }} options={[{ value: 'mp4', label: 'MP4' }, { value: 'mkv', label: 'MKV' }, { value: 'webm', label: 'WEBM' }, { value: 'mp3', label: 'MP3' }, { value: 'm4a', label: 'M4A' }, { value: 'wav', label: 'WAV' }]} /></div>
              <div className="form-field"><label>{t.home.quality}</label><Select label={t.home.quality} value={quality} onChange={(value) => setQuality(value as typeof quality)} disabled={audioOnly} options={[{ value: 'best', label: t.card.bestAvailable }, ...['2160', '1440', '1080', '720', '480', '360'].map((value) => ({ value, label: value + 'p' }))]} /></div>
              <div className="form-field"><label>{t.home.audioQuality}</label><Select label={t.home.audioQuality} value={audioQuality} onChange={(value) => setAudioQuality(value as typeof audioQuality)} options={[{ value: 'best', label: t.card.bestAvailable }, ...['320', '256', '192', '128'].map((value) => ({ value, label: value + ' kbps' }))]} /></div>
              <div className="time-range-field"><TimeRangeControl startTime={startTime} endTime={endTime} durationSeconds={trimDurationSeconds} startLabel={t.home.startTime} endLabel={t.home.endTime} durationLabel={t.card.duration} previewHint={t.home.timeRangePreviewHint} onChange={(start, end) => { setStartTime(start); setEndTime(end) }} />{trimError && <p className="time-range__error" role="alert">{trimError}</p>}</div>
              <div className="form-field"><label htmlFor="subtitle-languages">{t.home.subtitleLanguages}</label><input id="subtitle-languages" value={subtitleLanguages} onChange={(e) => setSubtitleLanguages(e.target.value)} placeholder="en,ar" disabled={!subtitleEnabled || audioOnly} /></div>
              <div className="form-field"><label htmlFor="output-name">{t.home.outputName}</label><input id="output-name" value={outputName} onChange={(e) => setOutputName(e.target.value)} placeholder="" /></div>
            </div>
            <div className="row">
              <label className="row"><input type="checkbox" checked={audioOnly} onChange={(e) => { setAudioOnly(e.target.checked); if (e.target.checked && !['mp3', 'm4a', 'wav'].includes(format)) setFormat('mp3'); else if (!e.target.checked && ['mp3', 'm4a', 'wav'].includes(format)) setFormat('mp4') }} />{t.home.audioOnly}</label>
              <label className="row"><input type="checkbox" checked={subtitleEnabled} onChange={(e) => setSubtitleEnabled(e.target.checked)} disabled={audioOnly} />{t.home.subtitles}</label>
            </div>
            <div className="row">
              <div className="field" style={{ flex: 1, minWidth: 200, direction: 'ltr', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{outputDirectory || t.common.unknown}</div>
              <button className="btn" onClick={() => void chooseFolder()}><FolderOpen size={16} aria-hidden="true" />{t.home.browse}</button>
            </div>
          </>
        )}
      </section>

      {previewResults.length > 0 && <section className="panel preview-review" aria-label={t.home.reviewTitle}>
        <div className="toolbar preview-review__head">
          <div><h2>{t.home.reviewTitle}</h2><p className="setting__hint">{t.home.reviewHint}</p></div>
          <span className="chip"><span className="ltr">{selectedCount}</span> / <span className="ltr">{previewResults.reduce((count, bundle) => count + bundle.items.length, 0)}</span> {t.home.selectedVideos}</span>
        </div>
        {previewResults.map((bundle, bundleIndex) => <div className="preview-bundle" key={bundle.sourceUrl}>
          <div className="preview-bundle__heading">
            <div>{bundle.preview.isPlaylist && <strong>{bundle.preview.title}</strong>}<div className="setting__hint ltr">{bundle.preview.sourceName}</div></div>
            <div className="row">
              <button className="btn btn--sm" onClick={() => selectAll(bundleIndex, bundle.selectedUrls.length !== bundle.items.length)}>
                {bundle.selectedUrls.length === bundle.items.length ? <CheckSquare size={14} aria-hidden="true" /> : <Square size={14} aria-hidden="true" />}
                {bundle.selectedUrls.length === bundle.items.length ? t.home.deselectAll : t.home.selectAll}
              </button>
            </div>
          </div>
          {bundle.preview.description && !bundle.preview.isPlaylist && <p className="preview-bundle__description">{bundle.preview.description}</p>}
          <div className="preview-items">
            {bundle.items.map((item) => <label className="preview-item" key={item.url}>
              <input type="checkbox" checked={bundle.selectedUrls.includes(item.url)} onChange={(event) => toggleItem(bundleIndex, item.url, event.target.checked)} />
              <span className="preview-item__thumb">{item.thumbnailUrl ? <img src={item.thumbnailUrl} alt="" loading="lazy" /> : <Video size={22} aria-hidden="true" />}</span>
              <span className="preview-item__copy"><strong>{item.title}</strong>{item.durationSeconds !== null && <small className="ltr">{Math.floor(item.durationSeconds / 60)}:{String(Math.floor(item.durationSeconds % 60)).padStart(2, '0')}</small>}</span>
            </label>)}
          </div>
          {bundle.preview.isPlaylist && bundle.preview.playlistCount !== null && bundle.preview.playlistCount > bundle.items.length && <p className="setting__hint">{t.home.playlistLimit} {bundle.items.length} / {bundle.preview.playlistCount}</p>}
        </div>)}
      </section>}

      <section aria-label={t.home.queue}>
        <div className="toolbar" style={{ marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: 16 }}>{t.home.queue}</h2>
          <span className="chip"><span className="ltr">{tasks.length}</span></span>
          <div style={{ flex: 1 }} />
          <button className="btn btn--sm" onClick={() => void pauseAll()}><Pause size={14} aria-hidden="true" />{t.home.pauseAll}</button>
          <button className="btn btn--sm" onClick={() => void resumeAll()}><Play size={14} aria-hidden="true" />{t.home.resumeAll}</button>
          <button className="btn btn--sm" onClick={() => void clearCompleted()}><Trash2 size={14} aria-hidden="true" />{t.home.clearCompleted}</button>
        </div>
        <div className="toolbar" style={{ marginBottom: 12 }}><TaskFilters value={filter} onChange={setFilter} /></div>
        {visibleTasks.length === 0 ? <EmptyState icon={<ListChecks size={28} aria-hidden="true" />} title={t.home.empty} hint={t.home.emptyHint} /> : (
          <div className="tasklist">{visibleTasks.map((task) => <TaskCard key={task.id} task={task} mode={settings.cardMode} {...actionProps} />)}</div>
        )}
      </section>
      <p className="setting__hint">{t.home.legal}</p>
    </div>
  )
}
