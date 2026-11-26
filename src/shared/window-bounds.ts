export interface Rect { x: number; y: number; width: number; height: number }
export interface SavedWindowState extends Partial<Rect> { maximized?: boolean }

export const DEFAULT_WINDOW = { width: 1440, height: 900 } as const
export const MIN_WINDOW = { width: 1100, height: 720 } as const

function intersects(a: Rect, b: Rect): boolean {
  const w = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)
  const h = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y)
  return w > 0 && h > 0
}

/**
 * Validate saved bounds against currently visible displays.
 * Returns usable bounds, or only a size (so the OS centers the window) when the saved
 * position is no longer on any display or the saved values are invalid.
 */
export function resolveWindowBounds(
  saved: SavedWindowState | undefined,
  workAreas: Rect[]
): { x?: number; y?: number; width: number; height: number } {
  const primary = workAreas[0]
  const maxW = primary ? primary.width : DEFAULT_WINDOW.width
  const maxH = primary ? primary.height : DEFAULT_WINDOW.height
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(v, max))

  const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
  const width = clamp(num(saved?.width) ? saved.width : DEFAULT_WINDOW.width, MIN_WINDOW.width, Math.max(MIN_WINDOW.width, maxW))
  const height = clamp(num(saved?.height) ? saved.height : DEFAULT_WINDOW.height, MIN_WINDOW.height, Math.max(MIN_WINDOW.height, maxH))

  if (num(saved?.x) && num(saved?.y)) {
    const rect = { x: saved.x, y: saved.y, width, height }
    if (workAreas.some((area) => intersects(rect, area))) return rect
  }
  return { width, height }
}
