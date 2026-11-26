import { app, BrowserWindow } from 'electron'
import { createHash } from 'node:crypto'
import { createWriteStream } from 'node:fs'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { Readable, Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawn } from 'node:child_process'
import { APP_CONFIG } from '../../shared/config'
import { IPC, type UpdateInfo } from '../../shared/ipc'
import { notify } from './notifications'
import { readTasks } from './task-store'

interface GitHubAsset { name: string; browser_download_url: string; size: number }
interface GitHubRelease { tag_name: string; html_url: string; body?: string; assets: GitHubAsset[]; prerelease: boolean; draft: boolean }
let cachedUpdate: UpdateInfo | null = null

function normalizeVersion(value: string): number[] {
  return value.replace(/^v/i, '').split(/[.+-]/).slice(0, 3).map((part) => Number.parseInt(part, 10) || 0)
}
function isNewer(candidate: string, current: string): boolean {
  const a = normalizeVersion(candidate)
  const b = normalizeVersion(current)
  for (let i = 0; i < 3; i++) { if (a[i] !== b[i]) return a[i] > b[i] }
  return false
}
function releaseAsset(assets: GitHubAsset[], expression: RegExp): GitHubAsset | null {
  return assets.find((asset) => expression.test(asset.name)) ?? null
}
async function latestRelease(): Promise<GitHubRelease> {
  const response = await fetch(`https://api.github.com/repos/${APP_CONFIG.github.owner}/${APP_CONFIG.github.repo}/releases/latest`, {
    headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'Baset-Video-Downloader' },
    signal: AbortSignal.timeout(30_000)
  })
  if (!response.ok) throw new Error(response.status === 404 ? 'No published release was found.' : `GitHub returned HTTP ${response.status}.`)
  return await response.json() as GitHubRelease
}
export async function checkForUpdates(): Promise<UpdateInfo> {
  if (!app.isPackaged) throw new Error('Update checks are available in the installed application only.')
  const release = await latestRelease()
  const setup = releaseAsset(release.assets, /^BVD-Setup-.*-x64\.exe$/i)
  const portable = releaseAsset(release.assets, /^BVD-Portable-.*-x64\.exe$/i)
  const checksums = releaseAsset(release.assets, /^checksums\.txt$/i)
  const latestVersion = release.tag_name.replace(/^v/i, '')
  const portableBuild = !!process.env.PORTABLE_EXECUTABLE_FILE
  const result: UpdateInfo = {
    currentVersion: app.getVersion(), latestVersion,
    available: isNewer(latestVersion, app.getVersion()), releaseUrl: release.html_url,
    setupAssetUrl: setup?.browser_download_url ?? null, portableAssetUrl: portable?.browser_download_url ?? null,
    checksumAssetUrl: checksums?.browser_download_url ?? null,
    releaseNotes: String(release.body || '').slice(0, 8000), portable: portableBuild
  }
  cachedUpdate = result
  if (result.available) notify('updateAvailable', `v${latestVersion}`)
  return result
}
async function downloadAsset(url: string, destination: string, minimumBytes = 1024, reportProgress = true): Promise<void> {
  const response = await fetch(url, { headers: { 'User-Agent': 'Baset-Video-Downloader' }, signal: AbortSignal.timeout(180_000) })
  if (!response.ok) throw new Error(`Update download failed with HTTP ${response.status}.`)
  if (!response.body) throw new Error('GitHub returned an empty update download.')

  const total = Number(response.headers.get('content-length')) || 0
  let received = 0
  let lastSent = 0
  if (reportProgress) for (const win of BrowserWindow.getAllWindows()) win.webContents.send(IPC.updatesProgress, 0)
  const meter = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      received += chunk.length
      const now = Date.now()
      if (reportProgress && total > 0 && now - lastSent >= 120) {
        const percent = Math.min(99, Math.floor((received / total) * 100))
        for (const win of BrowserWindow.getAllWindows()) win.webContents.send(IPC.updatesProgress, percent)
        lastSent = now
      }
      callback(null, chunk)
    }
  })
  await pipeline(Readable.fromWeb(response.body), meter, createWriteStream(destination))
  if (received < minimumBytes) {
    await rm(destination, { force: true })
    throw new Error('The update download is incomplete.')
  }
  if (reportProgress) for (const win of BrowserWindow.getAllWindows()) win.webContents.send(IPC.updatesProgress, 100)
}
export async function installLatestUpdate(): Promise<void> {
  const activeTasks = readTasks().filter((task) => ['Waiting', 'Resolving', 'FetchingMetadata', 'Downloading', 'PostProcessing'].includes(task.status))
  if (activeTasks.length) throw new Error('Pause or finish active downloads before installing a BVD update.')
  const info = cachedUpdate ?? await checkForUpdates()
  if (!info.available) throw new Error('BVD is already up to date.')
  if (process.platform !== 'win32') throw new Error('BVD auto-update is currently available on Windows only.')
  const release = await latestRelease()
  const asset = info.portable
    ? releaseAsset(release.assets, /^BVD-Portable-.*-x64\.exe$/i)
    : releaseAsset(release.assets, /^BVD-Setup-.*-x64\.exe$/i)
  const checksums = releaseAsset(release.assets, /^checksums\.txt$/i)
  if (!asset || !checksums) throw new Error('The release does not contain the required application package and checksum file.')
  const directory = join(tmpdir(), 'BVD-Updates')
  await mkdir(directory, { recursive: true })
  const packagePath = join(directory, asset.name)
  const checksumPath = join(directory, 'checksums.txt')
  // A checksum file containing only two executable hashes is intentionally small.
  await downloadAsset(checksums.browser_download_url, checksumPath, 32, false)
  await downloadAsset(asset.browser_download_url, packagePath, 1024, true)
  const sums = await readFile(checksumPath, 'utf8')
  const match = sums.split(/\r?\n/).map((line) => line.trim()).find((line) => line.endsWith(`  ${asset.name}`) || line.endsWith(` *${asset.name}`))
  if (!match) throw new Error('No SHA-256 checksum was provided for the downloaded package.')
  const expected = match.split(/\s+/)[0].toLowerCase()
  const actual = createHash('sha256').update(await readFile(packagePath)).digest('hex')
  if (actual !== expected) { await rm(packagePath, { force: true }); throw new Error('The downloaded package failed its SHA-256 verification.') }

  notify('updateDownloaded', `v${info.latestVersion}`)

  const scriptPath = join(directory, info.portable ? 'replace-portable.ps1' : 'install-update.ps1')
  const psQuote = (value: string) => `'${value.replace(/'/g, "''")}'`
  const waitForCurrentProcess = [
    `$bvdProcessId = ${process.pid}`,
    'while (Get-Process -Id $bvdProcessId -ErrorAction SilentlyContinue) { Start-Sleep -Milliseconds 400 }'
  ]
  const script = info.portable
    ? (() => {
        const currentPortable = process.env.PORTABLE_EXECUTABLE_FILE
        if (!currentPortable) throw new Error('Could not locate the running portable executable. Open the Releases page to update manually.')
        return [
          "$ErrorActionPreference = 'Stop'",
          `$source = ${psQuote(packagePath)}`,
          `$destination = ${psQuote(currentPortable)}`,
          ...waitForCurrentProcess,
          'Move-Item -LiteralPath $source -Destination $destination -Force',
          'Start-Process -FilePath $destination'
        ].join('\r\n')
      })()
    : [
        "$ErrorActionPreference = 'Stop'",
        `$installer = ${psQuote(packagePath)}`,
        `$application = ${psQuote(app.getPath('exe'))}`,
        ...waitForCurrentProcess,
        "$install = Start-Process -FilePath $installer -ArgumentList '/S' -Wait -PassThru",
        "if ($install.ExitCode -ne 0) { throw \"BVD installer exited with code $($install.ExitCode).\" }",
        'Start-Process -FilePath $application'
      ].join('\r\n')
  await writeFile(scriptPath, script, 'utf8')
  const updater = spawn('powershell.exe', ['-NoProfile', '-WindowStyle', 'Hidden', '-ExecutionPolicy', 'Bypass', '-File', scriptPath], { detached: true, stdio: 'ignore', windowsHide: true })
  updater.unref()
  app.quit()
}
