import type { BvdApi } from '../shared/ipc'

declare global {
  interface Window {
    bvd: BvdApi
  }
}
export {}
