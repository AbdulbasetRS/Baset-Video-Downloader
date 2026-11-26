import { secondsToTime, timeToSeconds } from '../../src/renderer/components/TimeRangeControl'

describe('video trim time helpers', () => {
  it('parses HH:MM:SS into seconds', () => {
    expect(timeToSeconds('00:00:00')).toBe(0)
    expect(timeToSeconds('01:02:03')).toBe(3723)
    expect(timeToSeconds('123:59:59')).toBe(446399)
  })

  it('rejects malformed or out-of-range time parts', () => {
    expect(timeToSeconds('1:2:3')).toBeNull()
    expect(timeToSeconds('00:60:00')).toBeNull()
    expect(timeToSeconds('00:00:60')).toBeNull()
    expect(timeToSeconds('')).toBeNull()
  })

  it('formats seconds as a zero-padded time value', () => {
    expect(secondsToTime(0)).toBe('00:00:00')
    expect(secondsToTime(3723)).toBe('01:02:03')
    expect(secondsToTime(95)).toBe('00:01:35')
  })
})
