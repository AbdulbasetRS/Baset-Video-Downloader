import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { ChevronDown } from 'lucide-react'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps {
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  label: string
  disabled?: boolean
  className?: string
  id?: string
}

export function Select({ value, options, onChange, label, disabled = false, className = '', id }: SelectProps) {
  const generatedId = useId()
  const listId = id || generatedId
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value))
  const [activeIndex, setActiveIndex] = useState(selectedIndex)
  const selected = options.find((option) => option.value === value) ?? options[0]

  useEffect(() => {
    if (!open) return
    const closeOnOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutside)
    return () => document.removeEventListener('pointerdown', closeOnOutside)
  }, [open])

  function choose(option: SelectOption) {
    if (option.disabled) return
    onChange(option.value)
    setOpen(false)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return
    if (event.key === 'Escape') { setOpen(false); return }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const direction = event.key === 'ArrowDown' ? 1 : -1
      const next = options.findIndex((option, index) => {
        const candidate = open ? (activeIndex + direction + options.length) % options.length : selectedIndex
        return index === candidate && !option.disabled
      })
      if (!open) setOpen(true)
      if (next >= 0) setActiveIndex(next)
      return
    }
    if ((event.key === 'Enter' || event.key === ' ') && open) {
      event.preventDefault()
      const option = options[activeIndex]
      if (option) choose(option)
      return
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      const indexes = options.map((option, index) => option.disabled ? -1 : index).filter((index) => index >= 0)
      const next = event.key === 'Home' ? indexes[0] : indexes[indexes.length - 1]
      if (next !== undefined) { setActiveIndex(next); setOpen(true) }
    }
  }

  return (
    <div className={`custom-select ${className}`} ref={rootRef}>
      <button
        id={id}
        type="button"
        role="combobox"
        className="custom-select__trigger"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-option-${activeIndex}` : undefined}
        disabled={disabled || options.length === 0}
        onClick={() => { setActiveIndex(selectedIndex); setOpen((current) => !current) }}
        onKeyDown={handleKeyDown}
      >
        <span>{selected?.label ?? ''}</span>
        <ChevronDown size={16} aria-hidden="true" className="custom-select__arrow" />
      </button>
      {open && (
        <div className="custom-select__menu" id={listId} role="listbox" aria-label={label}>
          {options.map((option, index) => (
            <button
              key={option.value}
              id={`${listId}-option-${index}`}
              type="button"
              role="option"
              aria-selected={option.value === value}
              disabled={option.disabled}
              className="custom-select__option"
              data-active={index === activeIndex}
              onPointerEnter={() => setActiveIndex(index)}
              onClick={() => choose(option)}
            >
              <span>{option.label}</span>
              {option.value === value && <span className="custom-select__check" aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
