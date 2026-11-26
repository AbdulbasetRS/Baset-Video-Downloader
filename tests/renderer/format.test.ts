import { formatBytes, formatDuration, formatPercent, formatSpeed } from '../../src/renderer/format'

describe('format helpers never fabricate values', () => {
  it('returns null for unknown or invalid input', () => {
    expect(formatBytes(null)).toBeNull()
    expect(formatBytes(-1)).toBeNull()
    expect(formatBytes(Number.NaN)).toBeNull()
    expect(formatDuration(undefined)).toBeNull()
    expect(formatSpeed(null)).toBeNull()
    expect(formatPercent(null)).toBeNull()
  })
  it('formats real values', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(1536)).toBe('1.50 KB')
    expect(formatBytes(310_552_104)).toBe('296 MB')
    expect(formatDuration(75)).toBe('1:15')
    expect(formatDuration(3725)).toBe('1:02:05')
    expect(formatSpeed(2_097_152)).toBe('2.00 MB/s')
  })
  it('clamps percentages', () => {
    expect(formatPercent(1.4)).toBe(100)
    expect(formatPercent(-0.2)).toBe(0)
    expect(formatPercent(0.425)).toBe(43)
  })
})
