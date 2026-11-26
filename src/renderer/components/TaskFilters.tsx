import type { DownloadTask } from '../../shared/tasks'
import { Segmented } from './Segmented'
import { useT } from '../hooks/useT'

export type StatusFilter = 'all' | 'downloading' | 'waiting' | 'paused' | 'completed' | 'failed'

export function matchesFilter(task: DownloadTask, filter: StatusFilter): boolean {
  switch (filter) {
    case 'all': return true
    case 'downloading': return task.status === 'Downloading' || task.status === 'PostProcessing'
    case 'waiting': return task.status === 'Waiting' || task.status === 'Resolving' || task.status === 'FetchingMetadata'
    case 'paused': return task.status === 'Paused'
    case 'completed': return task.status === 'Completed'
    case 'failed': return task.status === 'Failed'
  }
}

export function TaskFilters({ value, onChange }: { value: StatusFilter; onChange: (f: StatusFilter) => void }) {
  const t = useT()
  const keys: StatusFilter[] = ['all', 'downloading', 'waiting', 'paused', 'completed', 'failed']
  return <Segmented label={t.filter.label} value={value} onChange={onChange} options={keys.map((k) => ({ value: k, label: t.filter[k] }))} />
}
