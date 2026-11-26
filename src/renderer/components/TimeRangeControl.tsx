import type { CSSProperties } from 'react'

interface TimeRangeControlProps {
  startTime: string
  endTime: string
  durationSeconds: number | null
  startLabel: string
  endLabel: string
  durationLabel: string
  previewHint: string
  onChange: (start: string, end: string) => void
}

export function timeToSeconds(value: string): number | null {
  const match = /^(\d{1,3}):([0-5]\d):([0-5]\d)$/.exec(value.trim())
  if (!match) return null
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3])
}

export function secondsToTime(value: number): string {
  const seconds = Math.max(0, Math.floor(value))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainder = seconds % 60
  return [hours, minutes, remainder].map((part) => String(part).padStart(2, '0')).join(':')
}

export function TimeRangeControl({ startTime, endTime, durationSeconds, startLabel, endLabel, durationLabel, previewHint, onChange }: TimeRangeControlProps) {
  const duration = durationSeconds && Number.isFinite(durationSeconds) ? Math.max(1, Math.floor(durationSeconds)) : null
  const parsedStart = startTime ? timeToSeconds(startTime) : 0
  const parsedEnd = endTime ? timeToSeconds(endTime) : duration
  const start = Math.min(Math.max(parsedStart ?? 0, 0), Math.max(0, (duration ?? 1) - 1))
  const end = Math.min(Math.max(parsedEnd ?? duration ?? 1, start + 1), duration ?? Number.MAX_SAFE_INTEGER)
  const rangeStyle = {
    '--range-start': duration ? `${(start / duration) * 100}%` : '0%',
    '--range-end': duration ? `${(end / duration) * 100}%` : '100%'
  } as CSSProperties & { '--range-start': string; '--range-end': string }

  return (
    <div className="time-range">
      <div className="time-range__inputs">
        <div className="form-field">
          <label htmlFor="start-time">{startLabel}</label>
          <input id="start-time" type="text" inputMode="numeric" dir="ltr" value={startTime} placeholder="00:00:00" maxLength={10} onChange={(event) => onChange(event.target.value, endTime)} />
        </div>
        <div className="form-field">
          <label htmlFor="end-time">{endLabel}</label>
          <input id="end-time" type="text" inputMode="numeric" dir="ltr" value={endTime} placeholder={duration ? secondsToTime(duration) : '00:00:00'} maxLength={10} onChange={(event) => onChange(startTime, event.target.value)} />
        </div>
      </div>
      <div className="time-range__visual">
        <div className={`time-range__slider${duration ? '' : ' is-disabled'}`} style={rangeStyle}>
          <div className="time-range__track" />
          <div className="time-range__selected" />
          <input
            type="range"
            aria-label={startLabel}
            min={0}
            max={Math.max(1, (duration ?? 1) - 1)}
            step={1}
            value={start}
            disabled={!duration}
            onChange={(event) => onChange(secondsToTime(Number(event.target.value)), secondsToTime(end))}
          />
          <input
            type="range"
            aria-label={endLabel}
            min={Math.min(start + 1, duration ?? 1)}
            max={duration ?? 1}
            step={1}
            value={duration ? Math.min(end, duration) : 1}
            disabled={!duration}
            onChange={(event) => onChange(secondsToTime(start), secondsToTime(Number(event.target.value)))}
          />
        </div>
        <div className="time-range__meta">
          <span className="ltr">{secondsToTime(start)}</span>
          <span>{duration ? `${durationLabel}: ${secondsToTime(duration)}` : previewHint}</span>
          <span className="ltr">{duration ? secondsToTime(end) : '--:--:--'}</span>
        </div>
      </div>
    </div>
  )
}
