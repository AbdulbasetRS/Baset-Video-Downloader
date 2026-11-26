import { useEffect, useState } from 'react'
import { Minus, Square, Copy, X, Sun, Moon, Monitor, Languages } from 'lucide-react'
import { useSettingsStore } from '../store/settings-store'
import { useT } from '../hooks/useT'
import { Segmented } from './Segmented'
import { Select } from './Select'
import { languageOptions } from '../i18n'
import { APP_CONFIG } from '../../shared/config'

export function TitleBar() {
  const t = useT()
  const { settings, appInfo, update } = useSettingsStore()
  const [maximized, setMaximized] = useState(appInfo?.isMaximized ?? false)

  useEffect(() => window.bvd.window.onMaximizedChanged(setMaximized), [])

  return (
    <header className="titlebar">
      <div className="titlebar__brand">
        <img src="./brand/bvd-mark.svg" alt="" />
        <span>{APP_CONFIG.productName}</span>
      </div>
      <div className="titlebar__spacer" />
      <div className="titlebar__tools">
        <Languages size={16} className="icon" aria-hidden="true" />
        <Select
          label={t.titlebar.language}
          value={settings.language}
          onChange={(language) => void update({ language })}
          options={languageOptions.map(({ code, label }) => ({ value: code, label }))}
        />
        <Segmented
          label={t.titlebar.theme}
          value={settings.theme}
          iconOnly
          onChange={(theme) => void update({ theme })}
          options={[
            { value: 'system', label: t.theme.system, icon: <Monitor size={16} aria-hidden="true" /> },
            { value: 'light', label: t.theme.light, icon: <Sun size={16} aria-hidden="true" /> },
            { value: 'dark', label: t.theme.dark, icon: <Moon size={16} aria-hidden="true" /> }
          ]}
        />
      </div>
      <div className="titlebar__controls">
        <button className="winbtn" aria-label={t.titlebar.minimize} onClick={() => void window.bvd.window.minimize()}>
          <Minus size={16} aria-hidden="true" />
        </button>
        <button
          className="winbtn"
          aria-label={maximized ? t.titlebar.restore : t.titlebar.maximize}
          onClick={() => void window.bvd.window.toggleMaximize()}
        >
          {maximized ? <Copy size={14} aria-hidden="true" /> : <Square size={14} aria-hidden="true" />}
        </button>
        <button className="winbtn winbtn--close" aria-label={t.titlebar.close} onClick={() => void window.bvd.window.close()}>
          <X size={16} aria-hidden="true" />
        </button>
      </div>
    </header>
  )
}
