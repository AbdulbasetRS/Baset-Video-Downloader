import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Select } from '../../src/renderer/components/Select'

describe('custom Select', () => {
  it('opens, supports keyboard navigation and selects an option', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Select label="Quality" value="best" onChange={onChange} options={[
      { value: 'best', label: 'Best available' },
      { value: '720', label: '720p' },
      { value: '480', label: '480p' }
    ]} />)

    const trigger = screen.getByRole('combobox', { name: 'Quality' })
    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await user.keyboard('{ArrowDown}{Enter}')
    expect(onChange).toHaveBeenCalledWith('720')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })
})
