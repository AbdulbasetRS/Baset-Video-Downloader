import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from '../../src/renderer/App'
import { installFakeBridge } from './helpers'

beforeAll(() => {
  window.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener: () => undefined, removeEventListener: () => undefined, addListener: () => undefined, removeListener: () => undefined, onchange: null, dispatchEvent: () => false })) as unknown as typeof window.matchMedia
})

async function renderApp(initial = {}) {
  const bridge = installFakeBridge(initial)
  render(<App />)
  await screen.findByRole('navigation', { name: /navigation|التنقل/i }, { timeout: 3000 })
  return bridge
}

describe('BVD application shell', () => {
  it('shows the splash first, then the application shell', async () => {
    installFakeBridge()
    render(<App />)
    expect(screen.getByRole('status')).toHaveTextContent('Starting application')
    expect(await screen.findByRole('navigation', { name: 'Primary navigation' }, { timeout: 3000 })).toBeInTheDocument()
  })

  it('applies English, LTR and System theme by default', async () => {
    await renderApp()
    expect(document.documentElement.dir).toBe('ltr')
    expect(document.documentElement.lang).toBe('en')
    expect(document.documentElement.dataset.themeMode).toBe('system')
  })

  it('switches to Arabic and RTL immediately', async () => {
    const user = userEvent.setup()
    await renderApp()
    await user.click(screen.getByRole('button', { name: 'العربية' }))
    await waitFor(() => expect(document.documentElement.dir).toBe('rtl'))
    expect(document.documentElement.lang).toBe('ar')
    expect(screen.getByRole('navigation', { name: 'التنقل الرئيسي' })).toBeInTheDocument()
  })

  it('persists theme changes through the main-process bridge', async () => {
    const user = userEvent.setup()
    const { api } = await renderApp()
    await user.click(screen.getByRole('button', { name: 'Dark' }))
    expect(api.settings.update).toHaveBeenCalledWith({ theme: 'dark' })
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe('dark'))
  })

  it('collapses the sidebar and exposes accessible navigation labels', async () => {
    const user = userEvent.setup()
    const { api } = await renderApp()
    await user.click(screen.getByRole('button', { name: 'Collapse sidebar' }))
    expect(api.settings.update).toHaveBeenCalledWith({ sidebarMode: 'collapsed' })
    const nav = screen.getByRole('navigation', { name: 'Primary navigation' })
    expect(within(nav).getByRole('button', { name: 'Downloads' })).toBeInTheDocument()
    expect(document.querySelector('.sidebar')).toHaveAttribute('data-mode', 'collapsed')
  })

  it('navigates between all five pages', async () => {
    const user = userEvent.setup()
    await renderApp()
    const nav = screen.getByRole('navigation', { name: 'Primary navigation' })
    for (const name of ['Downloads', 'History', 'Settings', 'About', 'Home']) {
      await user.click(within(nav).getByRole('button', { name }))
      expect(screen.getByRole('heading', { level: 1, name })).toBeInTheDocument()
    }
  })

  it('shows the real empty state instead of demo/sample download records', async () => {
    await renderApp()
    expect(screen.getByText('The queue is empty')).toBeInTheDocument()
    expect(screen.queryByText('Sample data')).not.toBeInTheDocument()
    expect(screen.queryByText('Sample tutorial video')).not.toBeInTheDocument()
  })

  it('shows developer attribution, version and repository in the footer', async () => {
    await renderApp()
    const footer = screen.getByRole('contentinfo')
    expect(footer).toHaveTextContent('AbdulBaset R. Sayed')
    expect(footer).toHaveTextContent('0.2.0')
    expect(footer).toHaveTextContent('AbdulbasetRS/Baset-Video-Downloader')
  })
})

describe('media preview and queue', () => {
  it('previews a link before it is added to the queue', async () => {
    const user = userEvent.setup()
    const { api } = await renderApp()
    await user.type(screen.getByLabelText('Media links'), 'https://media.example/video')
    await user.click(screen.getByRole('button', { name: 'Preview links' }))
    expect(await screen.findByText('Test video')).toBeInTheDocument()
    expect(api.downloads.preview).toHaveBeenCalledWith('https://media.example/video')
    await user.click(screen.getByRole('button', { name: /Add selected/ }))
    expect(api.downloads.add).toHaveBeenCalledTimes(1)
    expect(api.downloads.add).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ url: 'https://media.example/video' })
    ]))
  })
})
