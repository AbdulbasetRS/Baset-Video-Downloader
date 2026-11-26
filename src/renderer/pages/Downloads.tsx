import { useMemo, useState } from 'react'
import { Search, Inbox, Pause, Play, X } from 'lucide-react'
import { useT } from '../hooks/useT'
import { useSettingsStore } from '../store/settings-store'
import { useDownloadStore } from '../store/download-store'
import { TaskCard } from '../components/TaskCard'
import { TaskFilters, matchesFilter, type StatusFilter } from '../components/TaskFilters'
import { Segmented } from '../components/Segmented'
import { EmptyState } from '../components/EmptyState'

 type SortKey = 'date' | 'name' | 'status' | 'size'
export function DownloadsPage() {
  const t = useT()
  const { settings, update } = useSettingsStore()
  const tasks = useDownloadStore((s) => s.tasks)
  const pause = useDownloadStore((s) => s.pause)
  const resume = useDownloadStore((s) => s.resume)
  const cancel = useDownloadStore((s) => s.cancel)
  const retry = useDownloadStore((s) => s.retry)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [sort, setSort] = useState<SortKey>('date')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const visibleTasks = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = tasks.filter((task) => matchesFilter(task, filter) && (!q || task.title.toLowerCase().includes(q) || task.sourceName.toLowerCase().includes(q)))
    const size = (task: typeof tasks[number]) => task.actualSizeBytes ?? task.totalBytes ?? -1
    return [...list].sort((a, b) => {
      switch (sort) {
        case 'name': return a.title.localeCompare(b.title)
        case 'status': return a.status.localeCompare(b.status)
        case 'size': return size(b) - size(a)
        default: return b.createdAt - a.createdAt
      }
    })
  }, [tasks, query, filter, sort])
  const toggle = (id: string) => setSelected((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next })
  const allSelected = visibleTasks.length > 0 && visibleTasks.every((x) => selected.has(x.id))
  const selectedTasks = visibleTasks.filter((task) => selected.has(task.id))
  async function bulk(action: 'pause' | 'resume' | 'cancel') {
    await Promise.all(selectedTasks.map((task) => action === 'pause' ? pause(task.id) : action === 'resume' ? resume(task.id) : cancel(task.id)))
    setSelected(new Set())
  }
  const actionProps = { onPause: (id: string) => void pause(id), onResume: (id: string) => void resume(id), onCancel: (id: string) => void cancel(id), onRetry: (id: string) => void retry(id), onOpenFolder: (id: string) => void window.bvd.downloads.openFolder(id), onOpenFile: (id: string) => void window.bvd.downloads.openFile(id) }

  return (
    <div className="page">
      <div className="page__head"><h1>{t.downloads.title}</h1><p>{t.downloads.subtitle}</p></div>
      <div className="toolbar">
        <div className="field field--search row" style={{ gap: 8 }}><Search size={16} aria-hidden="true" className="icon" /><input type="search" aria-label={t.common.search} placeholder={t.downloads.searchPlaceholder} value={query} onChange={(e) => setQuery(e.target.value)} style={{ border: 0, background: 'transparent', outline: 'none', flex: 1, minWidth: 0 }} /></div>
        <label className="row" style={{ gap: 8 }}><span className="setting__hint">{t.downloads.sortBy}</span><select className="field" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}><option value="date">{t.downloads.sortDate}</option><option value="name">{t.downloads.sortName}</option><option value="status">{t.downloads.sortStatus}</option><option value="size">{t.downloads.sortSize}</option></select></label>
        <Segmented label={t.settings.appearance.cards} value={settings.cardMode} onChange={(cardMode) => void update({ cardMode })} options={[{ value: 'compact', label: t.card.compact }, { value: 'expanded', label: t.card.expanded }]} />
      </div>
      <div className="toolbar">
        <TaskFilters value={filter} onChange={setFilter} />
        <div style={{ flex: 1 }} />
        <label className="row" style={{ gap: 6 }}><input type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(visibleTasks.map((x) => x.id)))} />{t.downloads.selectAll}</label>
        {selected.size > 0 && <span className="chip"><span className="ltr">{selected.size}</span> {t.downloads.selected}</span>}
        <button className="btn btn--sm" onClick={() => void bulk('pause')} disabled={!selectedTasks.some((x) => x.status === 'Downloading' || x.status === 'Waiting')}><Pause size={14} aria-hidden="true" />{t.downloads.bulkPause}</button>
        <button className="btn btn--sm" onClick={() => void bulk('resume')} disabled={!selectedTasks.some((x) => x.status === 'Paused')}><Play size={14} aria-hidden="true" />{t.downloads.bulkResume}</button>
        <button className="btn btn--sm" onClick={() => void bulk('cancel')} disabled={!selectedTasks.some((x) => !['Completed', 'Failed', 'Canceled'].includes(x.status))}><X size={14} aria-hidden="true" />{t.downloads.bulkCancel}</button>
      </div>
      {visibleTasks.length === 0 ? <EmptyState icon={<Inbox size={28} aria-hidden="true" />} title={t.downloads.noResults} /> : (
        <div className="tasklist">{visibleTasks.map((task) => <TaskCard key={task.id} task={task} mode={settings.cardMode} selected={selected.has(task.id)} onToggleSelect={toggle} {...actionProps} />)}</div>
      )}
    </div>
  )
}
