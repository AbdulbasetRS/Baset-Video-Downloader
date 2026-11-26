import { useEffect } from 'react'
import { CircleCheck, CircleAlert, Info, X } from 'lucide-react'
import type { NotificationPayload } from '../../shared/ipc'

export function ToastViewport({ items, onDismiss }: { items: NotificationPayload[]; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timers = items.map((item) => window.setTimeout(() => onDismiss(item.id), 6500))
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [items, onDismiss])

  if (!items.length) return null
  return (
    <div className="toast-viewport" aria-live="polite" aria-relevant="additions text">
      {items.map((item) => {
        const success = item.event === 'downloadCompleted' || item.event === 'updateDownloaded'
        const failed = item.event === 'downloadFailed'
        const Icon = success ? CircleCheck : failed ? CircleAlert : Info
        return (
          <div className={`toast${success ? ' toast--success' : ''}${failed ? ' toast--danger' : ''}`} key={item.id} role="status">
            <Icon size={19} aria-hidden="true" />
            <div className="toast__content"><strong>{item.title}</strong><span>{item.body}</span></div>
            <button className="btn btn--icon btn--sm" onClick={() => onDismiss(item.id)} aria-label="Dismiss notification"><X size={15} /></button>
          </div>
        )
      })}
    </div>
  )
}
