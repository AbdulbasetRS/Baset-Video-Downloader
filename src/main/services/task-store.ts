import { app } from 'electron'
import Store from 'electron-store'
import type { DownloadTask } from '../../shared/tasks'

interface TaskStoreShape { tasks: DownloadTask[] }
let store: Store<TaskStoreShape> | undefined
function getStore(): Store<TaskStoreShape> {
  if (!app.isReady()) throw new Error('BVD task storage is not ready until Electron has finished starting.')
  store ??= new Store<TaskStoreShape>({ name: 'bvd-download-history', defaults: { tasks: [] } })
  return store
}

export function readTasks(): DownloadTask[] {
  return getStore().get('tasks', [])
}

export function writeTasks(tasks: DownloadTask[]): void {
  getStore().set('tasks', tasks)
}
