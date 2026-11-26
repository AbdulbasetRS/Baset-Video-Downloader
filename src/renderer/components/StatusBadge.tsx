import { CircleCheck, CircleAlert, Pause, Clock, Loader, Ban, Download } from 'lucide-react'
import type { ReactNode } from 'react'
import type { TaskStatus } from '../../shared/tasks'
import { useT } from '../hooks/useT'

const ICON: Record<TaskStatus, ReactNode> = {
  Resolving: <Loader size={14} aria-hidden="true" />,
  FetchingMetadata: <Loader size={14} aria-hidden="true" />,
  Waiting: <Clock size={14} aria-hidden="true" />,
  Downloading: <Download size={14} aria-hidden="true" />,
  Paused: <Pause size={14} aria-hidden="true" />,
  PostProcessing: <Loader size={14} aria-hidden="true" />,
  Completed: <CircleCheck size={14} aria-hidden="true" />,
  Failed: <CircleAlert size={14} aria-hidden="true" />,
  Canceled: <Ban size={14} aria-hidden="true" />
}

/** Status is always icon + text, never color alone. */
export function StatusBadge({ status }: { status: TaskStatus }) {
  const t = useT()
  return (
    <span className={`status status--${status}`}>
      {ICON[status]}
      {t.status[status]}
    </span>
  )
}
