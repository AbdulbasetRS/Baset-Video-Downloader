/** Formatting helpers. They never invent values: unknown input yields null. */

export function formatBytes(bytes: number | null | undefined): string | null {
  if (bytes == null || !Number.isFinite(bytes) || bytes < 0) return null
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let value = bytes
  let i = 0
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024
    i++
  }
  const digits = i === 0 || value >= 100 ? 0 : value >= 10 ? 1 : 2
  return `${value.toFixed(digits)} ${units[i]}`
}

export function formatDuration(totalSeconds: number | null | undefined): string | null {
  if (totalSeconds == null || !Number.isFinite(totalSeconds) || totalSeconds < 0) return null
  const s = Math.floor(totalSeconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(sec).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`
}

export function formatSpeed(bytesPerSec: number | null | undefined): string | null {
  const b = formatBytes(bytesPerSec)
  return b ? `${b}/s` : null
}

export function formatPercent(progress: number | null | undefined): number | null {
  if (progress == null || !Number.isFinite(progress)) return null
  return Math.max(0, Math.min(100, Math.round(progress * 100)))
}
