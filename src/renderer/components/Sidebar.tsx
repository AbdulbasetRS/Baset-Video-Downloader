import { House, Download, History, Settings, Info, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide-react'
import type { ReactNode } from 'react'
import { useSettingsStore } from '../store/settings-store'
import { useUiStore, PAGES, type PageId } from '../store/ui-store'
import { useT } from '../hooks/useT'

const ICONS: Record<PageId, ReactNode> = {
  home: <House size={20} aria-hidden="true" className="icon" />,
  downloads: <Download size={20} aria-hidden="true" className="icon" />,
  history: <History size={20} aria-hidden="true" className="icon" />,
  settings: <Settings size={20} aria-hidden="true" className="icon" />,
  about: <Info size={20} aria-hidden="true" className="icon" />
}

export function Sidebar() {
  const t = useT()
  const { settings, update } = useSettingsStore()
  const { page, setPage } = useUiStore()
  const collapsed = settings.sidebarMode === 'collapsed'
  const rtl = settings.language === 'ar'

  const ToggleIcon = rtl
    ? collapsed ? PanelRightOpen : PanelRightClose
    : collapsed ? PanelLeftOpen : PanelLeftClose
  return (
    <aside className="sidebar" data-mode={settings.sidebarMode}>
      <nav className="sidebar__nav" aria-label={t.nav.primary}>
        {PAGES.map((id) => (
          <button
            key={id}
            className="navitem"
            aria-current={page === id ? 'page' : undefined}
            aria-label={collapsed ? t.nav[id] : undefined}
            onClick={() => setPage(id)}
          >
            {ICONS[id]}
            <span className="navitem__label">{t.nav[id]}</span>
            <span className="navitem__tip" aria-hidden="true">{t.nav[id]}</span>
          </button>
        ))}
      </nav>
      <button
        className="navitem sidebar__toggle"
        aria-label={collapsed ? t.nav.expand : t.nav.collapse}
        onClick={() => void update({ sidebarMode: collapsed ? 'expanded' : 'collapsed' })}
      >
        <ToggleIcon size={20} aria-hidden="true" className="icon" />
        <span className="navitem__label">{collapsed ? t.nav.expand : t.nav.collapse}</span>
        <span className="navitem__tip" aria-hidden="true">{collapsed ? t.nav.expand : t.nav.collapse}</span>
      </button>
    </aside>
  )
}
