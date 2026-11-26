import { useState } from 'react'
import { Video, Pause, Play, X, ChevronDown, ChevronUp, RotateCcw, FolderOpen, Pencil, Clock, CircleAlert, FileVideo, Settings2 } from 'lucide-react'
import type { DownloadOptions, DownloadTask, MediaContainer } from '../../shared/tasks'
import { useT } from '../hooks/useT'
import { formatBytes, formatDuration, formatPercent, formatSpeed } from '../format'
import { StatusBadge } from './StatusBadge'
import { Select } from './Select'
import { TimeRangeControl, timeToSeconds } from './TimeRangeControl'

interface Props {
  task: DownloadTask
  mode: 'compact' | 'expanded'
  selected?: boolean
  onToggleSelect?: (id: string) => void
  onPause?: (id: string) => void
  onResume?: (id: string) => void
  onCancel?: (id: string) => void
  onRetry?: (id: string) => void
  onOpenFolder?: (id: string) => void
  onOpenFile?: (id: string) => void
  onRename?: (id: string, name: string) => void
  onRemoveHistory?: (id: string) => void
}

const AUDIO_FORMATS: MediaContainer[] = ['mp3', 'm4a', 'wav']

export function TaskCard({ task, mode, selected, onToggleSelect, onPause, onResume, onCancel, onRetry, onOpenFolder, onOpenFile, onRename, onRemoveHistory }: Props) {
  const t = useT()
  const [override, setOverride] = useState<boolean | null>(null)
  const expanded = override ?? mode === 'expanded'
  const [renaming, setRenaming] = useState(false)
  const [newName, setNewName] = useState(task.title)
  const [renameError, setRenameError] = useState<string | null>(null)
  const [editingOptions, setEditingOptions] = useState(false)
  const [savingOptions, setSavingOptions] = useState(false)
  const [optionsError, setOptionsError] = useState<string | null>(null)
  const [draft, setDraft] = useState<DownloadOptions>({ ...task.options })
  const percent = formatPercent(task.progress)
  const active = task.status === 'Downloading' || task.status === 'PostProcessing'
  const canPause = active || task.status === 'Waiting'
  const showProgress = active || task.status === 'Paused'
  const duration = formatDuration(task.durationSeconds)
  const speed = formatSpeed(task.speedBytesPerSec)
  const eta = formatDuration(task.etaSeconds)
  const canStop = ['Resolving', 'FetchingMetadata', 'Waiting', 'Downloading', 'PostProcessing', 'Paused'].includes(task.status)
  const canEditOptions = ['Waiting', 'Paused', 'Failed', 'Canceled'].includes(task.status)

  async function rename() {
    const value = newName.trim()
    if (!value) return
    setRenameError(null)
    try {
      if (onRename) onRename(task.id, value)
      else await window.bvd.downloads.rename(task.id, value)
      setRenaming(false)
    } catch (error) { setRenameError(error instanceof Error ? error.message : String(error)) }
  }

  function updateDraft(patch: Partial<DownloadOptions>) {
    setDraft((current) => ({ ...current, ...patch }))
  }

  async function chooseOutputFolder() {
    const folder = await window.bvd.downloads.chooseDirectory()
    if (folder) updateDraft({ outputDirectory: folder })
  }

  async function saveOptions() {
    if (draft.startTime || draft.endTime) {
      const start = draft.startTime ? timeToSeconds(draft.startTime) : null
      const end = draft.endTime ? timeToSeconds(draft.endTime) : null
      if (start === null || end === null) { setOptionsError(t.home.timeRangeRequired); return }
      if (end <= start) { setOptionsError(t.home.timeRangeOrder); return }
      if (task.durationSeconds !== null && end > task.durationSeconds) { setOptionsError(t.home.timeRangeBeyondDuration); return }
    }
    setSavingOptions(true)
    setOptionsError(null)
    try {
      await window.bvd.downloads.updateOptions(task.id, draft)
      setEditingOptions(false)
    } catch (error) {
      setOptionsError(error instanceof Error ? error.message : String(error))
    } finally {
      setSavingOptions(false)
    }
  }

  return (
    <article className={`task${selected ? ' task--selected' : ''}`} aria-label={task.title}>
      <div className="task__thumb">
        {task.thumbnailUrl ? <img src={task.thumbnailUrl} alt="" /> : <Video size={28} aria-hidden="true" />}
      </div>
      <div className="task__main">
        <div className="row">
          {onToggleSelect && <input type="checkbox" checked={!!selected} onChange={() => onToggleSelect(task.id)} aria-label={task.title} />}
          <div className="task__title" title={task.title}>{task.title}</div>
        </div>
        <div className="task__meta">
          <StatusBadge status={task.status} />
          {duration && <span><Clock size={13} aria-hidden="true" /><span className="ltr">{duration}</span></span>}
          {task.playlistCount && task.playlistCount > 1 && <span>{t.card.playlist}: <span className="ltr">{task.playlistIndex ? `${task.playlistIndex}/` : ''}{task.playlistCount}</span></span>}
          {percent !== null && showProgress && <span className="ltr">{percent}%</span>}
          {speed && active && <span className="ltr">{speed}</span>}
          {eta && active && <span className="ltr">{eta}</span>}
          {formatBytes(task.actualSizeBytes) && task.status === 'Completed' && <span className="ltr">{formatBytes(task.actualSizeBytes)}</span>}
        </div>
        {task.description && <div className="task__description">{task.description}</div>}
        {showProgress && (
          <div className={`progress${percent === null ? ' progress--indeterminate' : ''}`} role="progressbar" aria-label={t.card.progress}
            aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent ?? undefined}
            aria-valuetext={percent === null ? t.card.indeterminate : `${percent}%`}>
            <div className="progress__fill" style={percent === null ? undefined : { width: `${percent}%` }} />
          </div>
        )}
      </div>
      <div className="task__actions">
        {canPause && <button className="btn btn--icon btn--sm" onClick={() => onPause?.(task.id)} disabled={!onPause} title={t.card.pause} aria-label={t.card.pause}><Pause size={16} aria-hidden="true" /></button>}
        {task.status === 'Paused' && <button className="btn btn--icon btn--sm" onClick={() => onResume?.(task.id)} disabled={!onResume} title={t.card.resume} aria-label={t.card.resume}><Play size={16} aria-hidden="true" /></button>}
        {(task.status === 'Failed' || task.status === 'Canceled') && <button className="btn btn--icon btn--sm" onClick={() => onRetry?.(task.id)} disabled={!onRetry} title={t.card.retry} aria-label={t.card.retry}><RotateCcw size={16} aria-hidden="true" /></button>}
        {canStop && <button className="btn btn--icon btn--sm" onClick={() => onCancel?.(task.id)} disabled={!onCancel} title={t.card.cancel} aria-label={t.card.cancel}><X size={16} aria-hidden="true" /></button>}
        <button className="btn btn--icon btn--sm" aria-expanded={expanded} aria-label={expanded ? t.card.collapse : t.card.expand} onClick={() => setOverride(!expanded)}>
          {expanded ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
        </button>
      </div>
      {expanded && (
        <>
          <dl className="task__details kv">
            <div><dt>{t.card.format}</dt><dd className="ltr">{task.options.container.toUpperCase()}</dd></div>
            <div><dt>{t.card.quality}</dt><dd>{task.options.audioOnly ? t.card.audioOnly : task.options.quality === 'best' ? t.card.bestAvailable : `${task.options.quality}p`}</dd></div>
            <div><dt>{t.card.size}</dt><dd className="ltr">{formatBytes(task.actualSizeBytes ?? task.totalBytes) ?? t.common.unknown}</dd></div>
            <div><dt>{t.card.savePath}</dt><dd className="ltr">{task.outputPath || task.options.outputDirectory}</dd></div>
            {task.options.subtitleEnabled && <div><dt>{t.home.subtitles}</dt><dd className="ltr">{task.options.subtitleLanguages.join(', ')} · {task.options.subtitleFormat.toUpperCase()}</dd></div>}
            {(task.options.startTime || task.options.endTime) && <div><dt>{t.home.startTime} / {t.home.endTime}</dt><dd className="ltr">{task.options.startTime || '00:00:00'} – {task.options.endTime || 'End'}</dd></div>}
            {task.status === 'Failed' && task.errorMessage && <div><dt>{t.card.error}</dt><dd>{task.errorMessage}</dd></div>}
          </dl>
          <div className="task__detail-actions">
            {canEditOptions && <button className="btn btn--sm" onClick={() => { setDraft({ ...task.options, subtitleLanguages: [...task.options.subtitleLanguages] }); setEditingOptions((value) => !value); setOptionsError(null) }}><Settings2 size={14} aria-hidden="true" />{t.card.editOptions}</button>}
            {task.status === 'Completed' && task.outputPath && <button className="btn btn--sm" onClick={() => onOpenFile?.(task.id)}><FileVideo size={14} aria-hidden="true" />{t.card.openFile}</button>}
            <button className="btn btn--sm" onClick={() => onOpenFolder?.(task.id)}><FolderOpen size={14} aria-hidden="true" />{t.card.openFolder}</button>
            {task.status === 'Completed' && <button className="btn btn--sm" onClick={() => { setNewName(task.title); setRenaming((v) => !v) }}><Pencil size={14} aria-hidden="true" />{t.card.rename}</button>}
            {onRemoveHistory && <button className="btn btn--sm" onClick={() => onRemoveHistory(task.id)}><X size={14} aria-hidden="true" />{t.history.remove}</button>}
          </div>
          {editingOptions && (
            <div className="task__editor" style={{ gridColumn: '1 / -1' }}>
              <div className="form-grid">
                <div className="form-field"><label>{t.home.format}</label><Select label={t.home.format} value={draft.container} onChange={(value) => { const container = value as MediaContainer; updateDraft({ container, audioOnly: AUDIO_FORMATS.includes(container) }) }} options={['mp4', 'mkv', 'webm', 'mp3', 'm4a', 'wav'].map((value) => ({ value, label: value.toUpperCase() }))} /></div>
                <div className="form-field"><label>{t.home.quality}</label><Select label={t.home.quality} value={draft.quality} disabled={draft.audioOnly} onChange={(value) => updateDraft({ quality: value as DownloadOptions['quality'] })} options={[{ value: 'best', label: t.card.bestAvailable }, ...['2160', '1440', '1080', '720', '480', '360'].map((value) => ({ value, label: value + 'p' }))]} /></div>
                {draft.audioOnly && <div className="form-field"><label>{t.home.audioQuality}</label><Select label={t.home.audioQuality} value={draft.audioQuality} onChange={(value) => updateDraft({ audioQuality: value as DownloadOptions['audioQuality'] })} options={[{ value: 'best', label: t.card.bestAvailable }, ...['320', '256', '192', '128'].map((value) => ({ value, label: value + ' kbps' }))]} /></div>}
                <div className="time-range-field"><TimeRangeControl startTime={draft.startTime || ''} endTime={draft.endTime || ''} durationSeconds={task.durationSeconds} startLabel={t.home.startTime} endLabel={t.home.endTime} durationLabel={t.card.duration} previewHint={t.home.timeRangePreviewHint} onChange={(start, end) => updateDraft({ startTime: start || null, endTime: end || null })} /></div>
                <div className="form-field"><label>{t.home.outputName}</label><input value={draft.outputName} onChange={(event) => updateDraft({ outputName: event.target.value })} /></div>
                <div className="form-field"><label>{t.home.subtitleLanguages}</label><input value={draft.subtitleLanguages.join(',')} disabled={!draft.subtitleEnabled || draft.audioOnly} onChange={(event) => updateDraft({ subtitleLanguages: event.target.value.split(',').map((value) => value.trim()).filter(Boolean).slice(0, 10) })} /></div>
              </div>
              <div className="switch-row"><span>{t.home.subtitles}</span><input type="checkbox" checked={draft.subtitleEnabled} disabled={draft.audioOnly} onChange={(event) => updateDraft({ subtitleEnabled: event.target.checked })} /></div>
              <div className="setting"><div><div className="setting__label">{t.home.outputDirectory}</div><div className="setting__hint ltr">{draft.outputDirectory}</div></div><button className="btn" onClick={() => void chooseOutputFolder()}><FolderOpen size={15} aria-hidden="true" />{t.home.browse}</button></div>
              {optionsError && <div className="notice notice--warning" role="alert">{optionsError}</div>}
              <div className="row"><button className="btn btn--primary btn--sm" onClick={() => void saveOptions()} disabled={savingOptions}>{savingOptions ? t.common.working : t.card.saveOptions}</button><button className="btn btn--sm" onClick={() => setEditingOptions(false)}>{t.common.cancel}</button></div>
            </div>
          )}
          {renaming && (
            <div className="row" style={{ gridColumn: '1 / -1', flexWrap: 'wrap' }}>
              <input className="field" value={newName} onChange={(event) => setNewName(event.target.value)} aria-label={t.card.rename} />
              <button className="btn btn--primary btn--sm" onClick={rename}>{t.common.save}</button>
              <button className="btn btn--sm" onClick={() => setRenaming(false)}>{t.common.cancel}</button>
              {renameError && <div className="notice notice--warning" role="alert">{renameError}</div>}
            </div>
          )}
        </>
      )}
      {task.status === 'Failed' && task.errorMessage && !expanded && (
        <div className="task__error" role="alert"><CircleAlert size={16} aria-hidden="true" />{task.errorMessage}</div>
      )}
    </article>
  )
}
