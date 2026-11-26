import type { ReactNode } from 'react'

/** Opens an allowlisted https URL via the main process; never navigates the app window. */
export function ExternalLinkButton({ url, label, children }: { url: string; label: string; children: ReactNode }) {
  return (
    <button type="button" className="linkbtn" aria-label={label} onClick={() => void window.bvd.external.open(url)}>
      {children}
    </button>
  )
}
