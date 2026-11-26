import { dictionaries, type Dict } from '../i18n'
import { useSettingsStore } from '../store/settings-store'

export function useT(): Dict {
  const language = useSettingsStore((s) => s.settings.language)
  return dictionaries[language]
}
