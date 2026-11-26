// Smoke test: launches the BUILT app under Xvfb and drives it through the DevTools protocol.
// Usage: npm run build && xvfb-run -a node scripts/smoke-electron.mjs [outDir]
import { spawn } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const electronPath = require('electron')
const outDir = process.argv[2] ?? join(tmpdir(), 'bvd-smoke')
mkdirSync(outDir, { recursive: true })
const userData = process.env.BVD_USER_DATA ?? mkdtempSync(join(tmpdir(), 'bvd-ud-'))
const persistOnly = process.env.PERSIST_CHECK === '1'
const port = 9333

const child = spawn(
  electronPath,
  ['.', `--remote-debugging-port=${port}`, `--user-data-dir=${userData}`, '--no-sandbox', '--disable-gpu'],
  { stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, ELECTRON_ENABLE_LOGGING: '1' } }
)
let log = ''
child.stdout.on('data', (d) => (log += d))
child.stderr.on('data', (d) => (log += d))

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
async function waitForTarget() {
  for (let i = 0; i < 60; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json()
      const page = list.find((t) => t.type === 'page')
      if (page) return page
    } catch { /* not up yet */ }
    await sleep(500)
  }
  throw new Error('Electron page target did not appear.\n' + log.slice(-2000))
}

class PersistDone extends Error {}
const results = []
const check = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  -> ' + detail : ''}`) }

let ws, id = 0
const pending = new Map()
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const myId = ++id
    pending.set(myId, { resolve, reject })
    ws.send(JSON.stringify({ id: myId, method, params }))
  })
}
const evalJs = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 400))
  return r.result.value
}
async function shot(name) {
  const r = await send('Page.captureScreenshot', { format: 'png' })
  writeFileSync(join(outDir, `${name}.png`), Buffer.from(r.data, 'base64'))
}
const click = (selector) => evalJs(`(() => { const e = document.querySelector(${JSON.stringify(selector)}); if (!e) return false; e.click(); return true })()`)

try {
  const target = await waitForTarget()
  ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data)
    if (msg.id && pending.has(msg.id)) { const p = pending.get(msg.id); pending.delete(msg.id); if (msg.error) p.reject(new Error(JSON.stringify(msg.error)))
      else p.resolve(msg.result)
    }
  }
  await send('Runtime.enable'); await send('Page.enable')
  await sleep(300)
  if (persistOnly) {
    // Second launch against the same user-data dir: preferences must have survived the restart.
    await sleep(1800)
    const s = await evalJs(`window.bvd.settings.get()`)
    check('theme persisted across restart', s.theme === 'light', s.theme)
    check('language persisted across restart', s.language === 'en', s.language)
    check('card mode persisted across restart', s.cardMode === 'expanded', s.cardMode)
    check('sidebar mode persisted across restart', s.sidebarMode === 'expanded', s.sidebarMode)
    check('UI reflects persisted card mode', (await evalJs(`document.querySelectorAll('.task__details').length`)) > 1)
    throw new PersistDone()
  }
  await shot('01-splash')
  check('splash is shown at startup', await evalJs(`!!document.querySelector('.splash')`))
  check('splash logo uses motion class', await evalJs(`!!document.querySelector('.splash .bvd-logo-motion')`))

  await sleep(1800)
  check('shell renders after startup', await evalJs(`!!document.querySelector('.shell')`))

  // Security boundary
  check('renderer has no require()', (await evalJs(`typeof window.require`)) === 'undefined')
  check('renderer has no process', (await evalJs(`typeof window.process`)) === 'undefined')
  check('renderer has no ipcRenderer', (await evalJs(`typeof window.ipcRenderer`)) === 'undefined')
  const keys = await evalJs(`Object.keys(window.bvd).sort().join(',')`)
  check('bvd API exposes only the allowlist', keys === 'app,clipboard,external,settings,window', keys)
  check('external.open rejects non-allowlisted URL', (await evalJs(`window.bvd.external.open('https://example.com')`)) === false)
  check('external.open rejects non-https', (await evalJs(`window.bvd.external.open('file:///C:/Windows/System32/calc.exe')`)) === false)
  const bad = await evalJs(`window.bvd.settings.update({ theme: 'neon' }).then(() => 'accepted', () => 'rejected')`)
  check('settings.update rejects invalid payload', bad === 'rejected', bad)
  const extra = await evalJs(`window.bvd.settings.update({ hacked: true }).then(() => 'accepted', () => 'rejected')`)
  check('settings.update rejects unknown keys', extra === 'rejected', extra)
  const csp = await evalJs(`fetch(location.href).then(r => r.headers.get('content-security-policy'))`)
  check('CSP header present, no unsafe-inline for scripts', !!csp && /script-src 'self'(;|$)/.test(csp), String(csp).slice(0, 120))

  // Defaults
  check('default theme mode is system', (await evalJs(`document.documentElement.dataset.themeMode`)) === 'system')
  check('default direction is ltr / lang en', (await evalJs(`document.documentElement.dir + '/' + document.documentElement.lang`)) === 'ltr/en')
  check('English font stack starts with Manrope', (await evalJs(`getComputedStyle(document.body).fontFamily`)).startsWith('Manrope'))
  check('first-run card mode is compact', (await evalJs(`window.bvd.settings.get().then(s => s.cardMode)`)) === 'compact')
  check('sidebar width ~232px expanded', Math.abs((await evalJs(`document.querySelector('.sidebar').getBoundingClientRect().width`)) - 232) < 2)
  check('titlebar height 56px', Math.round(await evalJs(`document.querySelector('.titlebar').getBoundingClientRect().height`)) === 56)
  check('footer height 48px', Math.round(await evalJs(`document.querySelector('.footer').getBoundingClientRect().height`)) === 48)
  await shot('02-home-system')

  // Theme switching
  await evalJs(`window.bvd.settings.update({ theme: 'dark' })`); await sleep(300)
  check('dark theme applied', (await evalJs(`document.documentElement.dataset.theme`)) === 'dark')
  check('dark background token is #0B1120', (await evalJs(`getComputedStyle(document.body).backgroundColor`)) === 'rgb(11, 17, 32)')
  await shot('03-home-dark')
  await evalJs(`window.bvd.settings.update({ theme: 'light' })`); await sleep(300)
  check('light background token is #F5F7FB', (await evalJs(`getComputedStyle(document.body).backgroundColor`)) === 'rgb(245, 247, 251)')
  await shot('04-home-light')

  // Arabic / RTL without restart
  await evalJs(`window.bvd.settings.update({ language: 'ar', theme: 'dark' })`); await sleep(400)
  check('Arabic switches to rtl + Cairo', (await evalJs(`document.documentElement.dir + '|' + getComputedStyle(document.body).fontFamily.split(',')[0]`)) === 'rtl|Cairo')
  check('sidebar sits on the right in RTL', (await evalJs(`document.querySelector('.sidebar').getBoundingClientRect().left > window.innerWidth / 2`)))
  await shot('05-home-arabic-dark')

  // Sidebar collapse persists
  await click('.sidebar__toggle'); await sleep(300)
  check('sidebar collapses to ~72px', Math.abs((await evalJs(`document.querySelector('.sidebar').getBoundingClientRect().width`)) - 72) < 2)
  check('collapsed state persisted in main', (await evalJs(`window.bvd.settings.get().then(s => s.sidebarMode)`)) === 'collapsed')
  await shot('06-sidebar-collapsed-rtl')

  // Pages
  await evalJs(`window.bvd.settings.update({ language: 'en', theme: 'light', sidebarMode: 'expanded', cardMode: 'expanded' })`); await sleep(300)
  for (const [i, label] of ['Downloads', 'History', 'Settings', 'About'].entries()) {
    const ok = await evalJs(`(() => { const b = [...document.querySelectorAll('.sidebar .navitem')].find(x => x.textContent.includes(${JSON.stringify(label)})); if (!b) return false; b.click(); return true })()`)
    await sleep(250)
    check(`navigate to ${label}`, ok && !!(await evalJs(`document.querySelector('.page h1')?.textContent`)), await evalJs(`document.querySelector('.page h1')?.textContent`))
    await shot(`07-page-${i + 1}-${label.toLowerCase()}`)
  }

  // Emoji + gradient scan on the live DOM
  const emoji = await evalJs(`/\\p{Extended_Pictographic}/u.test(document.body.innerText)`)
  check('no emoji in rendered text', emoji === false)
  const gradients = await evalJs(`[...document.querySelectorAll('*')].filter(e => /gradient/i.test(getComputedStyle(e).backgroundImage)).length`)
  check('no CSS gradient backgrounds on any element', gradients === 0, String(gradients))

  // Persistence across restart: run again with BVD_USER_DATA=<same dir> PERSIST_CHECK=1 (see scripts/smoke.sh).
} catch (err) {
  if (!(err instanceof PersistDone)) check('smoke run completed without exception', false, String(err.message ?? err))
} finally {
  try { ws?.close() } catch { /* ignore */ }
  child.kill()
  writeFileSync(join(outDir, 'electron.log'), log)
}
const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} checks passed. Screenshots: ${outDir}`)
process.exit(failed.length ? 1 : 0)
