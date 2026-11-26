import { fireEvent, render, screen } from '@testing-library/react'
import { TimeRangeControl } from '../../src/renderer/components/TimeRangeControl'

describe('TimeRangeControl', () => {
  it('updates both time values when either timeline handle is dragged', () => {
    const onChange = vi.fn()
    render(<TimeRangeControl
      startTime=""
      endTime=""
      durationSeconds={120}
      startLabel="Start time"
      endLabel="End time"
      durationLabel="Duration"
      previewHint="Preview one video first"
      onChange={onChange}
    />)

    const [start, end] = screen.getAllByRole('slider')
    fireEvent.change(start, { target: { value: '10' } })
    expect(onChange).toHaveBeenLastCalledWith('00:00:10', '00:02:00')
    fireEvent.change(end, { target: { value: '90' } })
    expect(onChange).toHaveBeenLastCalledWith('00:00:00', '00:01:30')
  })

  it('keeps the timeline disabled until a video duration is known', () => {
    render(<TimeRangeControl
      startTime=""
      endTime=""
      durationSeconds={null}
      startLabel="Start time"
      endLabel="End time"
      durationLabel="Duration"
      previewHint="Preview one video first"
      onChange={() => undefined}
    />)
    expect(screen.getAllByRole('slider').every((slider) => slider).toBeTruthy())
    expect(screen.getAllByRole('slider')[0]).toBeDisabled()
    expect(screen.getByText('Preview one video first')).toBeInTheDocument()
  })
})
