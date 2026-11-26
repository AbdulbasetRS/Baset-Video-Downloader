import { en, type Dict } from './en'
import { ar } from './ar'
import type { AppSettings } from '../../shared/settings'

export type Language = AppSettings['language']
export const dictionaries: Record<Language, Dict> = { en, ar }
export const directionOf = (lang: Language): 'ltr' | 'rtl' => (lang === 'ar' ? 'rtl' : 'ltr')
export type { Dict }
