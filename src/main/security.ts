import type { Session, WebContents, IpcMainInvokeEvent } from 'electron'

export function buildCsp(isDev: boolean): string {
  const scriptSrc = isDev ? "'self' 'unsafe-inline'" : "'self'"
  const connectSrc = isDev ? "'self' ws://localhost:* http://localhost:*" : "'self'"
  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    // React sets inline style attributes; scripts remain strictly 'self'.
    "style-src 'self' 'unsafe-inline'",
    // Real media thumbnails are fetched over https from the user's selected media only.
    "img-src 'self' data: https:",
    "font-src 'self'",
    "media-src 'self' blob: data:",
    `connect-src ${connectSrc}`,
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'"
  ].join('; ')
}

export function installSessionSecurity(session: Session, isDev: boolean): void {
  const csp = buildCsp(isDev)
  session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: { ...details.responseHeaders, 'Content-Security-Policy': [csp] }
    })
  })
  // The app needs no web permissions (camera, geolocation, notifications via web API, ...).
  session.setPermissionRequestHandler((_wc, _permission, callback) => callback(false))
  session.setPermissionCheckHandler(() => false)
}

export function lockDownWebContents(contents: WebContents, isAppUrl: (url: string) => boolean): void {
  contents.setWindowOpenHandler(() => ({ action: 'deny' }))
  contents.on('will-navigate', (event, url) => {
    if (!isAppUrl(url)) event.preventDefault()
  })
  contents.on('will-attach-webview', (event) => event.preventDefault())
}

/** IPC is accepted only from the app's own top-level frame. */
export function isTrustedSender(event: IpcMainInvokeEvent, isAppUrl: (url: string) => boolean): boolean {
  const frame = event.senderFrame
  return !!frame && frame.parent === null && isAppUrl(frame.url)
}
