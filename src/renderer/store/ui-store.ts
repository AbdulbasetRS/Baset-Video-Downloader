import { create } from 'zustand'

export type PageId = 'home' | 'downloads' | 'history' | 'settings' | 'about'
export const PAGES: readonly PageId[] = ['home', 'downloads', 'history', 'settings', 'about']

interface UiState {
  page: PageId
  setPage: (page: PageId) => void
}

export const useUiStore = create<UiState>((set) => ({
  page: 'home',
  setPage: (page) => set({ page })
}))
