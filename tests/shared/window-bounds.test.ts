import { resolveWindowBounds, DEFAULT_WINDOW, MIN_WINDOW } from '../../src/shared/window-bounds'

const display = { x: 0, y: 0, width: 1920, height: 1040 }

describe('resolveWindowBounds', () => {
  it('uses 1440x900 by default', () => {
    expect(resolveWindowBounds(undefined, [display])).toEqual({ width: DEFAULT_WINDOW.width, height: DEFAULT_WINDOW.height })
  })
  it('restores a saved position that is still on screen', () => {
    expect(resolveWindowBounds({ x: 100, y: 80, width: 1300, height: 800 }, [display])).toEqual({ x: 100, y: 80, width: 1300, height: 800 })
  })
  it('drops the position when the display is gone (so the OS centers it)', () => {
    const r = resolveWindowBounds({ x: 4000, y: 100, width: 1300, height: 800 }, [display])
    expect(r.x).toBeUndefined()
    expect(r.width).toBe(1300)
  })
  it('enforces the 1100x720 minimum', () => {
    const r = resolveWindowBounds({ width: 400, height: 300 }, [display])
    expect(r.width).toBe(MIN_WINDOW.width)
    expect(r.height).toBe(MIN_WINDOW.height)
  })
  it('ignores NaN / non-numeric saved values', () => {
    const r = resolveWindowBounds({ x: Number.NaN, y: 'a' as unknown as number, width: Number.NaN }, [display])
    expect(r.width).toBe(DEFAULT_WINDOW.width)
    expect(r.x).toBeUndefined()
  })
})
