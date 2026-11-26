import type { ReactNode } from 'react'

export interface SegmentedOption<T extends string> { value: T; label: string; icon?: ReactNode }

interface Props<T extends string> {
  value: T
  options: SegmentedOption<T>[]
  onChange: (value: T) => void
  label: string
  iconOnly?: boolean
}

export function Segmented<T extends string>({ value, options, onChange, label, iconOnly }: Props<T>) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className="segmented__btn"
          aria-pressed={o.value === value}
          aria-label={iconOnly ? o.label : undefined}
          title={iconOnly ? o.label : undefined}
          onClick={() => onChange(o.value)}
        >
          {o.icon}
          {!iconOnly && <span>{o.label}</span>}
        </button>
      ))}
    </div>
  )
}
