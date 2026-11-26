import { useMemo, useState } from 'react'
import { History as HistoryIcon, Search } from 'lucide-react'
import { useT } from '../hooks/useT'
import { useSettingsStore } from '../store/settings-store'
import { useDownloadStore } from '../store/download-store'
import { EmptyState } from '../components/EmptyState'
import { TaskCard } from '../components/TaskCard'

export function HistoryPage() {
  const t = useT()
  const cardMode = useSettingsStore((s) => s.settings.cardMode)
  const tasks = useDownloadStore((s) => s.tasks)
  const retry = useDownloadStore((s) => s.retry)
  const removeHistory = useDownloadStore((s) => s.removeHistory)
  const [query, setQuery] = useState('')
  const items = useMemo(() => tasks.filter((x) => ['Completed', 'Failed', 'Canceled'].includes(x.status) && (!query.trim() || x.title.toLowerCase().includes(query.trim().toLowerCase()))), [tasks, query])
  return (
    <div className="page">
      <div className="page__head"><h1>{t.history.title}</h1><p>{t.history.subtitle}</p></div>
      <div className="row"><div className="field field--search row" style={{ gap: 8 }}><Search size={16} aria-hidden="true" /><input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.downloads.searchPlaceholder} aria-label={t.common.search} style={{ border: 0, background: 'transparent', outline: 'none', flex: 1, minWidth: 0 }} /></div><span className="setting__hint">{t.history.removeNote}</span></div>
      {items.length === 0 ? <EmptyState icon={<HistoryIcon size={28} aria-hidden="true" />} title={t.history.empty} hint={t.history.emptyHint} /> : (
        <div className="tasklist">{items.map((item) => <TaskCard key={item.id} task={item} mode={cardMode} onRetry={(id) => void retry(id)} onOpenFile={(id) => void window.bvd.downloads.openFile(id)} onOpenFolder={(id) => void window.bvd.downloads.openFolder(id)} onRemoveHistory={(id) => void removeHistory(id)} />)}</div>
      )}
    </div>
  )
}
