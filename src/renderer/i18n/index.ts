import { en, type Dict } from './en'
import { ar } from './ar'
import type { AppSettings } from '../../shared/settings'

export type Language = AppSettings['language']
export interface LanguageOption { code: Language; label: string; direction: 'ltr' | 'rtl' }

// Add a dictionary and one entry here when introducing another interface language.
export const languageOptions: LanguageOption[] = [
  { code: 'en', label: 'English', direction: 'ltr' },
  { code: 'ar', label: 'العربية', direction: 'rtl' }
]
export const dictionaries: Record<string, Dict> = { en, ar }
export const directionOf = (lang: Language): 'ltr' | 'rtl' =>
  languageOptions.find((option) => option.code === lang)?.direction ?? 'ltr'
export type { Dict }
