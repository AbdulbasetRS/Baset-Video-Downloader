import { useEffect, useState } from 'react'
import { directionOf } from '../i18n'
import { useSettingsStore } from '../store/settings-store'

export type EffectiveTheme = 'light' | 'dark'

function systemPrefersDark(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches
}

/** Applies theme, language and direction to <html>. Switching never needs a restart. */
export function useDocumentTheme(): EffectiveTheme {
  const theme = useSettingsStore((s) => s.settings.theme)
  const language = useSettingsStore((s) => s.settings.language)
  const [systemDark, setSystemDark] = useState(systemPrefersDark)

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  const effective: EffectiveTheme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = effective
    root.dataset.themeMode = theme
    root.lang = language
    root.dir = directionOf(language)
  }, [effective, theme, language])

  return effective
}
