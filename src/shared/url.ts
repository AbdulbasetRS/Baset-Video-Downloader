export type UrlIssue = 'malformed' | 'unsupportedProtocol' | 'duplicate'

export interface ParsedUrls {
  valid: string[]
  issues: { line: string; issue: UrlIssue }[]
}

/** Query keys whose values must never be logged or shown in notifications. */
const SENSITIVE_KEYS = /^(token|access_token|auth|key|sig|signature|password|pass|secret|session|sid|cookie|code)$/i

/** Parse pasted text (one URL per line). Only http/https are accepted. */
export function parseSourceUrls(text: string): ParsedUrls {
  const valid: string[] = []
  const issues: ParsedUrls['issues'] = []
  const seen = new Set<string>()

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line) continue
    let url: URL
    try {
      url = new URL(line)
    } catch {
      issues.push({ line, issue: 'malformed' })
      continue
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      issues.push({ line, issue: 'unsupportedProtocol' })
      continue
    }
    if (url.username || url.password) {
      issues.push({ line: redactUrl(line), issue: 'malformed' })
      continue
    }
    const key = url.href
    if (seen.has(key)) {
      issues.push({ line, issue: 'duplicate' })
      continue
    }
    seen.add(key)
    valid.push(key)
  }
  return { valid, issues }
}

/** Replace sensitive query values and credentials so a URL can be logged/displayed safely. */
export function redactUrl(input: string): string {
  try {
    const url = new URL(input)
    url.username = ''
    url.password = ''
    for (const key of [...url.searchParams.keys()]) {
      if (SENSITIVE_KEYS.test(key)) url.searchParams.set(key, 'REDACTED')
    }
    return url.href
  } catch {
    return '[invalid-url]'
  }
}

/** Hostname only, for notification text. */
export function displayHost(input: string): string {
  try {
    return new URL(input).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}
