export const TASK_STATUSES = [
  'Resolving',
  'FetchingMetadata',
  'Waiting',
  'Downloading',
  'Paused',
  'PostProcessing',
  'Completed',
  'Failed',
  'Canceled'
] as const
export type TaskStatus = (typeof TASK_STATUSES)[number]

const TRANSITIONS: Record<TaskStatus, readonly TaskStatus[]> = {
  Resolving: ['FetchingMetadata', 'Failed', 'Canceled'],
  FetchingMetadata: ['Waiting', 'Failed', 'Canceled'],
  Waiting: ['Downloading', 'Paused', 'Failed', 'Canceled'],
  Downloading: ['Paused', 'PostProcessing', 'Completed', 'Failed', 'Canceled'],
  Paused: ['Waiting', 'Downloading', 'Failed', 'Canceled'],
  PostProcessing: ['Completed', 'Failed', 'Canceled'],
  Completed: [],
  Failed: ['Resolving', 'Waiting'],
  Canceled: ['Resolving', 'Waiting']
}

export function canTransition(from: TaskStatus, to: TaskStatus): boolean {
  return TRANSITIONS[from].includes(to)
}

export class InvalidTransitionError extends Error {
  constructor(public readonly from: TaskStatus, public readonly to: TaskStatus) {
    super(`Invalid task transition: ${from} -> ${to}`)
    this.name = 'InvalidTransitionError'
  }
}

export function assertTransition(from: TaskStatus, to: TaskStatus): TaskStatus {
  if (!canTransition(from, to)) throw new InvalidTransitionError(from, to)
  return to
}

export function isTerminal(status: TaskStatus): boolean {
  return status === 'Completed' || status === 'Canceled' || status === 'Failed'
}

export type MediaContainer = 'mp4' | 'mkv' | 'webm' | 'mp3' | 'm4a' | 'wav'
export type SubtitleFormat = 'srt' | 'vtt' | 'ass'

export interface DownloadOptions {
  container: MediaContainer
  quality: 'best' | '2160' | '1440' | '1080' | '720' | '480' | '360'
  audioOnly: boolean
  audioQuality: 'best' | '320' | '256' | '192' | '128'
  startTime: string | null
  endTime: string | null
  subtitleEnabled: boolean
  subtitleLanguages: string[]
  subtitleFormat: SubtitleFormat
  outputDirectory: string
  outputName: string
}

export const DEFAULT_DOWNLOAD_OPTIONS: DownloadOptions = {
  container: 'mp4',
  quality: 'best',
  audioOnly: false,
  audioQuality: 'best',
  startTime: null,
  endTime: null,
  subtitleEnabled: false,
  subtitleLanguages: ['en', 'ar'],
  subtitleFormat: 'srt',
  outputDirectory: '',
  outputName: ''
}

export interface DownloadTask {
  id: string
  sourceUrl: string
  sourceName: string
  title: string
  description?: string | null
  durationSeconds: number | null
  thumbnailUrl: string | null
  status: TaskStatus
  progress: number | null
  downloadedBytes: number | null
  totalBytes: number | null
  speedBytesPerSec: number | null
  etaSeconds: number | null
  actualSizeBytes: number | null
  errorMessage: string | null
  options: DownloadOptions
  createdAt: number
  updatedAt: number
  outputPath?: string | null
  playlistCount?: number | null
  playlistIndex?: number | null
  playlistTitle?: string | null
  extractorKey?: string | null
}

export interface MediaPreview {
  sourceUrl: string
  sourceName: string
  title: string
  description: string | null
  durationSeconds: number | null
  thumbnailUrl: string | null
  extractorKey: string | null
  isPlaylist: boolean
  playlistCount: number | null
  entries: Array<{
    url: string
    title: string
    durationSeconds: number | null
    thumbnailUrl: string | null
    extractorKey: string | null
  }>
  formats: Array<{ id: string; ext: string; quality: string; height: number | null; filesize: number | null; note: string | null }>
  subtitles: string[]
  automaticSubtitles: string[]
}

export interface DownloadAddRequest {
  url: string
  options?: Partial<DownloadOptions>
  /** Selected playlist entry URLs. Omit to queue every entry returned by the preview. */
  selectedEntryUrls?: string[]
}

export interface DownloadEvent {
  task: DownloadTask
  reason: 'created' | 'updated' | 'removed'
}
