import { create } from 'zustand'
import type { DownloadTask, DownloadAddRequest } from '../../shared/tasks'

interface DownloadState {
  tasks: DownloadTask[]
  ready: boolean
  error: string | null
  setTasks: (tasks: DownloadTask[]) => void
  load: () => Promise<void>
  add: (requests: DownloadAddRequest[]) => Promise<DownloadTask[]>
  pause: (id: string) => Promise<void>
  resume: (id: string) => Promise<void>
  cancel: (id: string) => Promise<void>
  retry: (id: string) => Promise<void>
  pauseAll: () => Promise<void>
  resumeAll: () => Promise<void>
  clearCompleted: () => Promise<void>
  removeHistory: (id: string) => Promise<void>
}

async function safely(action: () => Promise<unknown>): Promise<void> {
  await action()
}

export const useDownloadStore = create<DownloadState>((set) => ({
  tasks: [], ready: false, error: null,
  setTasks: (tasks) => set({ tasks, ready: true }),
  async load() {
    try { set({ tasks: await window.bvd.downloads.list(), ready: true, error: null }) }
    catch (error) { set({ ready: true, error: error instanceof Error ? error.message : String(error) }) }
  },
  async add(requests) {
    // The main process broadcasts the canonical persisted list after each task is saved.
    // Do not optimistically prepend the same items here or the renderer can duplicate them.
    return await window.bvd.downloads.add(requests)
  },
  async pause(id) { await safely(() => window.bvd.downloads.pause(id)) },
  async resume(id) { await safely(() => window.bvd.downloads.resume(id)) },
  async cancel(id) { await safely(() => window.bvd.downloads.cancel(id)) },
  async retry(id) { await safely(() => window.bvd.downloads.retry(id)) },
  async pauseAll() { await safely(() => window.bvd.downloads.pauseAll()) },
  async resumeAll() { await safely(() => window.bvd.downloads.resumeAll()) },
  async clearCompleted() { await safely(() => window.bvd.downloads.clearCompleted()) },
  async removeHistory(id) { await safely(() => window.bvd.downloads.removeHistory(id)) }
}))
