import type { ReactNode } from 'react'

/** Icon + text only. No decorative artwork. */
export function EmptyState({ icon, title, hint }: { icon: ReactNode; title: string; hint?: string }) {
  return (
    <div className="empty">
      {icon}
      <strong>{title}</strong>
      {hint && <span>{hint}</span>}
    </div>
  )
}
