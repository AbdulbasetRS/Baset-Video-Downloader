import { app, BrowserWindow, dialog, shell } from 'electron'
import { spawn, type ChildProcess } from 'node:child_process'
import { access, mkdir, readdir, rename, stat } from 'node:fs/promises'
import { constants } from 'node:fs'
import { homedir } from 'node:os'
import { basename, extname, join, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import { URL } from 'node:url'
import { IPC, type DownloadDefaults } from '../../shared/ipc'
import { DEFAULT_DOWNLOAD_OPTIONS, type DownloadAddRequest, type DownloadOptions, type DownloadTask, type MediaPreview } from '../../shared/tasks'
import { getSettings } from '../settings-store'
import { notify } from './notifications'
import { readTasks, writeTasks } from './task-store'

interface ProcessRecord { child: ChildProcess; stopReason: 'pause' | 'cancel' | null; stderr: string; stdoutBuffer: string; lastPersist: number; startedAt: number; outputPath: string | null }
const children = new Map<string, ProcessRecord>()
const starting = new Set<string>()
let pumping = false
let initialized = false

function broadcast(): void {
  const tasks = readTasks()
  for (const win of BrowserWindow.getAllWindows()) win.webContents.send(IPC.downloadsChanged, { tasks })
}
function saveTask(task: DownloadTask, notifyChange = true): void {
  const tasks = readTasks()
  const index = tasks.findIndex((item) => item.id === task.id)
  if (index >= 0) tasks[index] = task
  else tasks.unshift(task)
  writeTasks(tasks.slice(0, 1000))
  if (notifyChange) broadcast()
}
function updateTask(id: string, patch: Partial<DownloadTask>): DownloadTask | undefined {
  const task = readTasks().find((item) => item.id === id)
  if (!task) return undefined
  const next = { ...task, ...patch, updatedAt: Date.now() }
  saveTask(next)
  return next
}
function outputDirectory(): string {
  const configured = getSettings().defaultOutputDirectory.trim()
  return configured || app.getPath('downloads') || join(homedir(), 'Downloads')
}
function isSafeUrl(raw: string): URL {
  if (raw.length > 4096) throw new Error('The link is too long.')
  let url: URL
  try { url = new URL(raw) } catch { throw new Error('Enter a valid video or playlist link.') }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Only public HTTP and HTTPS links are supported.')
  return url
}
function sourceLabel(raw: string): string {
  try { return new URL(raw).hostname.replace(/^www\./, '') } catch { return 'Web' }
}
function toolPaths(): { ytDlp: string; ffmpegDir: string; node: string } {
  const base = app.isPackaged ? join(process.resourcesPath, 'tools', 'win32-x64') : join(app.getAppPath(), 'resources', 'tools', 'win32-x64')
  const suffix = process.platform === 'win32' ? '.exe' : ''
  return { ytDlp: join(base, `yt-dlp${suffix}`), ffmpegDir: join(base, 'ffmpeg'), node: join(base, `node${suffix}`) }
}
async function executablePath(candidate: string, fallback: string): Promise<string> {
  try { await access(candidate, constants.X_OK); return candidate } catch { return fallback }
}
async function binaries(): Promise<{ ytDlp: string; ffmpegDir: string; node: string }> {
  const paths = toolPaths()
  const fallback = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp'
  return {
    ytDlp: await executablePath(paths.ytDlp, process.env.BVD_YTDLP_PATH || fallback),
    ffmpegDir: paths.ffmpegDir,
    node: await executablePath(paths.node, process.env.BVD_NODE_PATH || 'node')
  }
}
function commonArgs(url: string, tools: { ffmpegDir: string; node: string }): string[] {
  const args = ['--ignore-config', '--no-warnings', '--no-call-home', '--no-colors', '--newline', '--progress', '--progress-template', 'download:__BVD_PROGRESS__%(progress)j', '--print', 'after_move:__BVD_FILE__%(filepath)s', '--windows-filenames', '--continue']
  args.push('--ffmpeg-location', tools.ffmpegDir)
  args.push('--js-runtimes', `node:${tools.node}`)
  args.push('--remote-components', 'ejs:github', url)
  return args
}
function safeOutputName(value: string): string {
  // eslint-disable-next-line no-control-regex -- Intentionally remove filesystem control characters from user-provided filenames.
  const normalized = value.normalize('NFKC').replace(/[\\/:*?"<>|\u0000-\u001F]/g, '_').replace(/[. ]+$/g, '').trim()
  return normalized.slice(0, 120)
}
function validateTime(value: string | null): string | null {
  if (!value) return null
  if (!/^\d{1,3}:[0-5]\d:[0-5]\d(?:\.\d{1,3})?$/.test(value)) throw new Error('Time must use HH:MM:SS format.')
  return value
}
function timeToMilliseconds(value: string): number {
  const [hours, minutes, secondsPart] = value.split(':')
  const [seconds, fraction = '0'] = secondsPart.split('.')
  return (((Number(hours) * 60) + Number(minutes)) * 60 + Number(seconds)) * 1000 + Number(fraction.padEnd(3, '0').slice(0, 3))
}
async function findRecentOutput(task: DownloadTask, startedAt: number): Promise<string | null> {
  try {
    const allowedExtensions = task.options.audioOnly
      ? new Set(['.mp3', '.m4a', '.wav'])
      : new Set(['.mp4', '.mkv', '.webm', '.mov', '.m4v', '.avi', '.flv'])
    const expectedPrefix = safeOutputName(task.options.outputName || task.title).toLocaleLowerCase()
    const entries = await readdir(task.options.outputDirectory, { withFileTypes: true })
    const candidates: Array<{ path: string; modifiedAt: number }> = []
    for (const entry of entries) {
      if (!entry.isFile() || !allowedExtensions.has(extname(entry.name).toLowerCase())) continue
      const path = join(task.options.outputDirectory, entry.name)
      try {
        const info = await stat(path)
        if (!info.isFile() || info.size <= 0 || info.mtimeMs < startedAt - 5000) continue
        candidates.push({ path, modifiedAt: info.mtimeMs })
      } catch { /* The file may have been moved by the media post-processor. */ }
    }
    const matching = expectedPrefix
      ? candidates.filter((candidate) => basename(candidate.path).toLocaleLowerCase().startsWith(expectedPrefix))
      : candidates
    const pool = matching.length ? matching : candidates.length === 1 ? candidates : []
    return pool.sort((a, b) => b.modifiedAt - a.modifiedAt)[0]?.path ?? null
  } catch {
    return null
  }
}

function outputTemplate(task: DownloadTask): string {
  const requested = safeOutputName(task.options.outputName)
  const playlistSuffix = task.playlistCount && task.playlistIndex ? ` [${String(task.playlistIndex).padStart(3, '0')}]` : ''
  const name = requested ? `${requested}${playlistSuffix}` : `%(title).180B${playlistSuffix} [%(id)s]`
  return join(task.options.outputDirectory, `${name}.%(ext)s`)
}
function downloadArgs(task: DownloadTask, tools: { ffmpegDir: string; node: string }): string[] {
  const o = task.options
  const args = commonArgs(task.sourceUrl, tools)
  args.push('--output', outputTemplate(task))
  if (o.audioOnly) {
    const audioFormat = o.container === 'mp3' || o.container === 'm4a' || o.container === 'wav' ? o.container : 'mp3'
    args.push('--extract-audio', '--audio-format', audioFormat)
    if (o.audioQuality !== 'best') args.push('--audio-quality', `${o.audioQuality}K`)
  } else {
    if (o.quality !== 'best') {
      args.push('--format', `bv*[height<=${o.quality}]+ba/b[height<=${o.quality}]`)
      args.push('--format-sort', `res:${o.quality},fps,codec:h264`)
    } else {
      args.push('--format', 'bv*+ba/b')
      args.push('--format-sort', 'res,fps,codec:h264')
    }
    if (['mp4', 'mkv', 'webm'].includes(o.container)) args.push('--merge-output-format', o.container)
  }
  const start = validateTime(o.startTime)
  const end = validateTime(o.endTime)
  if (start && end) {
    if (timeToMilliseconds(start) >= timeToMilliseconds(end)) throw new Error('End time must be later than start time.')
    args.push('--download-sections', `*${start}-${end}`, '--force-keyframes-at-cuts')
  } else if (start || end) {
    throw new Error('Enter both start and end times, or leave both empty.')
  }
  if (o.subtitleEnabled && !o.audioOnly) {
    args.push('--write-subs', '--write-auto-subs', '--sub-langs', o.subtitleLanguages.join(','), '--sub-format', 'best', '--convert-subs', o.subtitleFormat)
  }
  args.push('--embed-metadata')
  return args
}

function cleanError(input: string): string {
  return input.split(/\r?\n/).map((x) => x.trim()).filter(Boolean).slice(-3).join(' ').replace(/https?:\/\/\S+/gi, '[link]').slice(0, 500)
}
function safeThumb(value: unknown): string | null {
  if (typeof value !== 'string') return null
  try { const u = new URL(value); return u.protocol === 'https:' ? u.toString() : null } catch { return null }
}
function formatBytes(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null
}
function simplifyEntry(entry: Record<string, unknown>, baseUrl: string) {
  const rawUrl = typeof entry.webpage_url === 'string' ? entry.webpage_url : typeof entry.url === 'string' ? entry.url : ''
  let url = rawUrl
  if (url && !/^https?:/i.test(url)) {
    try { url = new URL(url, baseUrl).toString() } catch { url = '' }
  }
  return { url, title: String(entry.title || entry.id || 'Untitled media'), durationSeconds: formatBytes(entry.duration), thumbnailUrl: safeThumb(entry.thumbnail), extractorKey: typeof entry.extractor_key === 'string' ? entry.extractor_key : null }
}
export async function previewMedia(rawUrl: string): Promise<MediaPreview> {
  const url = isSafeUrl(rawUrl).toString()
  const parsedUrl = new URL(url)
  const isPlaylist = parsedUrl.searchParams.has('list') || /playlist/i.test(parsedUrl.pathname)
  const tools = await binaries()
  const args = ['--ignore-config', '--no-warnings', '--no-call-home', '--dump-single-json', '--skip-download']
  if (isPlaylist) args.push('--flat-playlist', '--playlist-end', '500')
  else args.push('--no-playlist')
  args.push('--js-runtimes', `node:${tools.node}`)
  args.push('--remote-components', 'ejs:github', url)
  const raw = await captureWithBinary(tools.ytDlp, args)
  const data = JSON.parse(raw.trim()) as Record<string, unknown>
  const entriesRaw = Array.isArray(data.entries) ? data.entries : []
  const entries = entriesRaw.slice(0, 500).filter((x): x is Record<string, unknown> => !!x && typeof x === 'object').map((x) => simplifyEntry(x, url)).filter((x) => x.url)
  const formats = Array.isArray(data.formats) ? data.formats : []
  const subtitles = data.subtitles && typeof data.subtitles === 'object' ? Object.keys(data.subtitles as object) : []
  const automatic = data.automatic_captions && typeof data.automatic_captions === 'object' ? Object.keys(data.automatic_captions as object) : []
  const firstEntry = entries[0]
  return {
    sourceUrl: url,
    sourceName: sourceLabel(url),
    title: String(data.title || data.playlist_title || firstEntry?.title || parsedUrl.hostname),
    description: typeof data.description === 'string' ? data.description.slice(0, 4000) : null,
    durationSeconds: formatBytes(data.duration),
    thumbnailUrl: safeThumb(data.thumbnail) || firstEntry?.thumbnailUrl || null,
    extractorKey: typeof data.extractor_key === 'string' ? data.extractor_key : null,
    isPlaylist: isPlaylist || entries.length > 1,
    playlistCount: typeof data.playlist_count === 'number' ? data.playlist_count : entries.length || null,
    entries,
    formats: formats.slice(0, 150).filter((x): x is Record<string, unknown> => !!x && typeof x === 'object').map((x) => ({
      id: String(x.format_id || ''), ext: String(x.ext || ''), quality: String(x.format_note || x.resolution || ''),
      height: formatBytes(x.height), filesize: formatBytes(x.filesize || x.filesize_approx), note: typeof x.format === 'string' ? x.format.slice(0, 120) : null
    })).filter((x) => x.id),
    subtitles, automaticSubtitles: automatic
  }
}
async function captureWithBinary(binary: string, args: string[], timeoutMs = 90_000): Promise<string> {
  return await new Promise((resolvePromise, reject) => {
    const child = spawn(binary, args, { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], shell: false })
    let stdout = ''
    let stderr = ''
    const timer = setTimeout(() => { child.kill(); reject(new Error('The media information request timed out.')) }, timeoutMs)
    child.stdout?.on('data', (chunk: Buffer) => { stdout += chunk.toString('utf8'); if (Buffer.byteLength(stdout) > 15 * 1024 * 1024) child.kill() })
    child.stderr?.on('data', (chunk: Buffer) => { stderr = (stderr + chunk.toString('utf8')).slice(-5000) })
    child.once('error', (error) => { clearTimeout(timer); reject(new Error(`Downloader could not start: ${error.message}`)) })
    child.once('close', (code) => { clearTimeout(timer); if (code === 0) resolvePromise(stdout); else reject(new Error(cleanError(stderr) || 'Could not read media details.')) })
  })
}

function normalizeOptions(input: Partial<DownloadOptions> | undefined): DownloadOptions {
  const merged = { ...DEFAULT_DOWNLOAD_OPTIONS, ...input }
  merged.outputDirectory = resolve(merged.outputDirectory || outputDirectory())
  if (!['mp4', 'mkv', 'webm', 'mp3', 'm4a', 'wav'].includes(merged.container)) merged.container = 'mp4'
  if (!['best', '2160', '1440', '1080', '720', '480', '360'].includes(merged.quality)) merged.quality = 'best'
  if (!['best', '320', '256', '192', '128'].includes(merged.audioQuality)) merged.audioQuality = 'best'
  if (!['srt', 'vtt', 'ass'].includes(merged.subtitleFormat)) merged.subtitleFormat = 'srt'
  const languages = (Array.isArray(merged.subtitleLanguages) ? merged.subtitleLanguages : ['en', 'ar']).slice(0, 10).map(String).filter(Boolean)
  merged.subtitleLanguages = languages.length ? languages : ['en', 'ar']
  return merged
}

export function initializeDownloader(): void {
  if (initialized) return
  initialized = true
  const tasks = readTasks().map((task) => {
    if (['Downloading', 'Resolving', 'FetchingMetadata', 'PostProcessing'].includes(task.status)) return { ...task, status: 'Paused' as const, updatedAt: Date.now(), errorMessage: 'The application closed before this download finished. Resume it to continue.' }
    return task
  })
  writeTasks(tasks)
  // Resume tasks that were queued but not yet started before the previous app exit.
  // Active transfers are deliberately converted to Paused above and require user action.
  void pumpQueue()
}
export function listDownloads(): DownloadTask[] { return readTasks().sort((a, b) => b.createdAt - a.createdAt) }
export async function getDownloadDefaults(): Promise<DownloadDefaults> {
  return { outputDirectory: outputDirectory(), maxConcurrentDownloads: getSettings().maxConcurrentDownloads }
}
export async function addDownloads(requests: DownloadAddRequest[]): Promise<DownloadTask[]> {
  const created: DownloadTask[] = []
  for (const req of requests.slice(0, 100)) {
    try {
      const url = isSafeUrl(req.url).toString()
      const options = normalizeOptions(req.options)
      await mkdir(options.outputDirectory, { recursive: true })
      const preview = await previewMedia(url)
      const playlistEntries = preview.isPlaylist ? preview.entries : []
      const selected = req.selectedEntryUrls ? new Set(req.selectedEntryUrls) : null
      const selectedEntries = selected ? playlistEntries.filter((entry) => selected.has(entry.url)) : playlistEntries
      if (selected && selectedEntries.length === 0 && playlistEntries.length > 0) continue
      const items = playlistEntries.length
        ? selectedEntries.map((entry) => ({
            url: entry.url, title: entry.title, description: null as string | null,
            durationSeconds: entry.durationSeconds, thumbnailUrl: entry.thumbnailUrl,
            extractorKey: entry.extractorKey,
            playlistIndex: preview.entries.findIndex((candidate) => candidate.url === entry.url) + 1
          }))
        : [{
            url, title: preview.title, description: preview.description,
            durationSeconds: preview.durationSeconds, thumbnailUrl: preview.thumbnailUrl,
            extractorKey: preview.extractorKey, playlistIndex: null as number | null
          }]
      for (const item of items) {
        const task: DownloadTask = {
          id: randomUUID(), sourceUrl: item.url, sourceName: preview.sourceName, title: item.title,
          description: item.description, durationSeconds: item.durationSeconds, thumbnailUrl: item.thumbnailUrl,
          status: 'Waiting', progress: null, downloadedBytes: null, totalBytes: null, speedBytesPerSec: null,
          etaSeconds: null, actualSizeBytes: null, errorMessage: null, options: { ...options, subtitleLanguages: [...options.subtitleLanguages] },
          createdAt: Date.now(), updatedAt: Date.now(), playlistCount: playlistEntries.length ? preview.playlistCount : null,
          playlistIndex: item.playlistIndex, playlistTitle: playlistEntries.length ? preview.title : null,
          extractorKey: item.extractorKey
        }
        saveTask(task)
        created.push(task)
      }
      if (items.length) notify('downloadQueued', playlistEntries.length ? `${preview.title} · ${items.length} videos` : preview.title)
    } catch (error) {
      const fallback: DownloadTask = {
        id: randomUUID(), sourceUrl: req.url.slice(0, 4096), sourceName: sourceLabel(req.url), title: 'Unable to read media details',
        description: null, durationSeconds: null, thumbnailUrl: null, status: 'Failed', progress: null, downloadedBytes: null,
        totalBytes: null, speedBytesPerSec: null, etaSeconds: null, actualSizeBytes: null,
        errorMessage: error instanceof Error ? error.message : String(error), options: normalizeOptions(req.options),
        createdAt: Date.now(), updatedAt: Date.now()
      }
      saveTask(fallback)
      created.push(fallback)
      notify('downloadFailed', fallback.errorMessage || undefined)
    }
  }
  void pumpQueue()
  return created
}

function parseProgressLine(line: string, task: DownloadTask): DownloadTask {
  const marker = '__BVD_PROGRESS__'
  const index = line.indexOf(marker)
  if (index < 0) return task
  try {
    const data = JSON.parse(line.slice(index + marker.length)) as Record<string, unknown>
    const downloaded = formatBytes(data.downloaded_bytes)
    const total = formatBytes(data.total_bytes) ?? formatBytes(data.total_bytes_estimate)
    const percent = typeof data.percent === 'number' ? Math.max(0, Math.min(100, data.percent)) : total && downloaded !== null ? downloaded / total * 100 : null
    return { ...task, status: 'Downloading', downloadedBytes: downloaded, totalBytes: total, progress: percent === null ? null : percent / 100,
      speedBytesPerSec: formatBytes(data.speed), etaSeconds: formatBytes(data.eta), updatedAt: Date.now() }
  } catch { return task }
}
function killTree(child: ChildProcess): void {
  if (!child.pid) return
  if (process.platform === 'win32') {
    const killer = spawn('taskkill.exe', ['/pid', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' })
    killer.unref()
  } else {
    try { child.kill('SIGTERM') } catch { /* Already stopped. */ }
  }
}
async function pumpQueue(): Promise<void> {
  if (pumping) return
  pumping = true
  try {
    while (children.size + starting.size < getSettings().maxConcurrentDownloads) {
      const next = readTasks().find((task) => task.status === 'Waiting' && !children.has(task.id) && !starting.has(task.id))
      if (!next) break
      startTask(next)
    }
  } finally { pumping = false }
}
function startTask(task: DownloadTask): void {
  if (starting.has(task.id) || children.has(task.id)) return
  starting.add(task.id)
  void (async () => {
    try {
      // A user may pause/cancel a queued task while tool resolution is running.
      if (readTasks().find((item) => item.id === task.id)?.status !== 'Waiting') return
      const tools = await binaries()
      const currentBeforeSpawn = readTasks().find((item) => item.id === task.id)
      if (!currentBeforeSpawn || currentBeforeSpawn.status !== 'Waiting') return
      const args = downloadArgs(currentBeforeSpawn, tools)
      const child = spawn(tools.ytDlp, args, { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], shell: false, detached: process.platform !== 'win32' })
      const record: ProcessRecord = { child, stopReason: null, stderr: '', stdoutBuffer: '', lastPersist: 0, startedAt: Date.now(), outputPath: null }
      children.set(task.id, record)
      const initial = updateTask(task.id, { status: 'Downloading', errorMessage: null, outputPath: null })
      if (initial) notify('downloadStarted', initial.title)
      const processStdoutLine = (line: string) => {
        // yt-dlp may emit the final after_move marker without a trailing newline.
        // Search within the line instead of requiring the marker at character zero.
        const cleanLine = line.replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, '')
        const markerIndex = cleanLine.indexOf('__BVD_FILE__')
        if (markerIndex >= 0) {
          const file = cleanLine.slice(markerIndex + '__BVD_FILE__'.length).trim().replace(/^["']|["']$/g, '')
          if (file) {
            record.outputPath = file
            updateTask(task.id, { outputPath: file })
          }
        }
        const current = readTasks().find((x) => x.id === task.id)
        if (current) {
          const next = parseProgressLine(cleanLine, current)
          if (next !== current && Date.now() - record.lastPersist > 350) { record.lastPersist = Date.now(); saveTask(next) }
        }
      }
      const stdoutHandler = (chunk: Buffer) => {
        record.stdoutBuffer += chunk.toString('utf8')
        const lines = record.stdoutBuffer.split(/[\r\n]+/)
        record.stdoutBuffer = lines.pop() || ''
        for (const line of lines) processStdoutLine(line)
      }
      child.stdout?.on('data', stdoutHandler)
      child.stderr?.on('data', (chunk: Buffer) => { record.stderr = (record.stderr + chunk.toString('utf8')).slice(-6000) })
      child.once('error', (error) => {
        const wasStopped = record.stopReason !== null
        record.stopReason = record.stopReason || 'cancel'
        children.delete(task.id)
        if (!wasStopped) {
          const failed = updateTask(task.id, { status: 'Failed', errorMessage: `Could not start downloader: ${error.message}` })
          if (failed) notify('downloadFailed', failed.title)
        }
        void pumpQueue()
      })
      child.once('close', async (code) => {
        // The print marker can be emitted on either stream depending on the
        // extractor and post-processing path. Inspect both final stream buffers.
        for (const line of record.stderr.split(/[\r\n]+/)) {
          if (line.includes('__BVD_FILE__')) processStdoutLine(line)
        }
        if (record.stdoutBuffer.trim()) processStdoutLine(record.stdoutBuffer)
        record.stdoutBuffer = ''
        children.delete(task.id)
        if (record.stopReason) { void pumpQueue(); return }
        const current = readTasks().find((x) => x.id === task.id)
        if (!current) { void pumpQueue(); return }
        if (code === 0) {
          let file = record.outputPath || current.outputPath || null
          if (file) {
            try {
              const outputStat = await stat(file)
              if (!outputStat.isFile() || outputStat.size <= 0) file = null
            } catch { file = null }
          }
          // Some extractors/post-processors do not emit the after_move marker
          // consistently. Recover the newly-created media file by its title and
          // modification time before marking a successful process as failed.
          if (!file) file = await findRecentOutput(current, record.startedAt)
          if (!file) {
            const failed = updateTask(task.id, { status: 'Failed', speedBytesPerSec: null, etaSeconds: null, errorMessage: 'The downloader finished without producing a verifiable output file.' })
            if (failed) notify('downloadFailed', failed.title)
          } else {
            const completed = updateTask(task.id, { status: 'Completed', progress: 1, speedBytesPerSec: null, etaSeconds: null, outputPath: file, actualSizeBytes: await stat(file).then((s) => s.size).catch(() => null), errorMessage: null })
            if (completed) notify('downloadCompleted', completed.title)
          }
        } else {
          const failed = updateTask(task.id, { status: 'Failed', speedBytesPerSec: null, etaSeconds: null, errorMessage: cleanError(record.stderr) || `Downloader exited with code ${code ?? 'unknown'}.` })
          if (failed) notify('downloadFailed', failed.title)
        }
        void pumpQueue()
      })
    } catch (error) {
      const current = readTasks().find((item) => item.id === task.id)
      if (current?.status === 'Waiting') {
        const failed = updateTask(task.id, { status: 'Failed', errorMessage: error instanceof Error ? error.message : String(error) })
        if (failed) notify('downloadFailed', failed.title)
      }
    } finally {
      starting.delete(task.id)
      void pumpQueue()
    }
  })().catch((error) => {
    starting.delete(task.id)
    const failed = updateTask(task.id, { status: 'Failed', errorMessage: error instanceof Error ? error.message : String(error) })
    if (failed) notify('downloadFailed', failed.title)
    void pumpQueue()
  })
}
async function stopTask(id: string, reason: 'pause' | 'cancel'): Promise<void> {
  const record = children.get(id)
  if (record) { record.stopReason = reason; killTree(record.child) }
  const current = readTasks().find((task) => task.id === id)
  if (!current) return
  const status = reason === 'pause' ? 'Paused' : 'Canceled'
  const updated = updateTask(id, { status, speedBytesPerSec: null, etaSeconds: null })
  if (updated) notify(reason === 'pause' ? 'downloadPaused' : 'downloadCanceled', updated.title)
  if (!record) void pumpQueue()
}
export async function pauseDownload(id: string): Promise<void> { await stopTask(id, 'pause') }
export async function cancelDownload(id: string): Promise<void> { await stopTask(id, 'cancel') }
export async function resumeDownload(id: string): Promise<void> {
  const task = readTasks().find((item) => item.id === id)
  if (!task || task.status !== 'Paused') return
  const updated = updateTask(id, { status: 'Waiting', errorMessage: null })
  if (updated) notify('downloadResumed', updated.title)
  void pumpQueue()
}
export async function updateTaskOptions(id: string, patch: Partial<DownloadOptions>): Promise<void> {
  const task = readTasks().find((item) => item.id === id)
  if (!task) throw new Error('Download task not found.')
  if (!['Waiting', 'Paused', 'Failed', 'Canceled'].includes(task.status)) throw new Error('Options can only be changed before a download is running.')
  const options = normalizeOptions({ ...task.options, ...patch })
  updateTask(id, { options })
}
export async function retryDownload(id: string): Promise<void> {
  const task = readTasks().find((item) => item.id === id)
  if (!task || !['Failed', 'Canceled'].includes(task.status)) return
  const updated = updateTask(id, { status: 'Waiting', progress: null, downloadedBytes: null, speedBytesPerSec: null, etaSeconds: null, errorMessage: null, outputPath: null, actualSizeBytes: null })
  if (updated) notify('downloadQueued', updated.title)
  void pumpQueue()
}
export async function pauseAll(): Promise<void> { await Promise.all(readTasks().filter((x) => x.status === 'Downloading' || x.status === 'Waiting').map((x) => pauseDownload(x.id))) }
export async function resumeAll(): Promise<void> { await Promise.all(readTasks().filter((x) => x.status === 'Paused').map((x) => resumeDownload(x.id))) }
export async function clearCompleted(): Promise<void> {
  writeTasks(readTasks().filter((x) => x.status !== 'Completed'))
  broadcast()
}
export async function chooseDownloadDirectory(): Promise<string | null> {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory', 'createDirectory'], defaultPath: outputDirectory() })
  return result.canceled ? null : result.filePaths[0] || null
}
export async function openDefaultDownloadFolder(): Promise<void> {
  await mkdir(outputDirectory(), { recursive: true })
  const error = await shell.openPath(outputDirectory())
  if (error) throw new Error(error)
}
async function taskFile(id: string): Promise<DownloadTask> {
  const task = readTasks().find((x) => x.id === id)
  if (!task) throw new Error('Download task not found.')
  return task
}
export async function openTaskFolder(id: string): Promise<void> {
  const task = await taskFile(id)
  const folder = task.outputPath ? resolve(task.outputPath, '..') : task.options.outputDirectory
  await mkdir(folder, { recursive: true })
  const error = await shell.openPath(folder)
  if (error) throw new Error(error)
}
export async function openTaskFile(id: string): Promise<void> {
  const task = await taskFile(id)
  if (!task.outputPath) throw new Error('The file is not available yet.')
  await access(task.outputPath)
  const error = await shell.openPath(task.outputPath)
  if (error) throw new Error(error)
}
export async function renameTaskFile(id: string, rawName: string): Promise<void> {
  const task = await taskFile(id)
  if (task.status !== 'Completed' || !task.outputPath) throw new Error('Only completed files can be renamed.')
  const clean = safeOutputName(rawName)
  if (!clean) throw new Error('Enter a valid file name.')
  const extension = extname(task.outputPath)
  const nextPath = join(task.options.outputDirectory, `${clean}${extension}`)
  const samePath = process.platform === 'win32'
    ? resolve(nextPath).toLowerCase() === resolve(task.outputPath).toLowerCase()
    : resolve(nextPath) === resolve(task.outputPath)
  if (!samePath) {
    try {
      await access(nextPath)
      throw new Error('A file with that name already exists in the selected folder.')
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) throw error
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    }
  }
  await rename(task.outputPath, nextPath)
  const size = await stat(nextPath).then((x) => x.size)
  updateTask(id, { outputPath: nextPath, actualSizeBytes: size, title: basename(nextPath, extension) })
}
export async function removeHistory(id: string): Promise<void> {
  const task = await taskFile(id)
  if (!['Completed', 'Failed', 'Canceled'].includes(task.status)) throw new Error('Only finished tasks can be removed from history.')
  writeTasks(readTasks().filter((x) => x.id !== id))
  broadcast()
}
