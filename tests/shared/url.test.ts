import { parseSourceUrls, redactUrl, displayHost } from '../../src/shared/url'

describe('parseSourceUrls', () => {
  it('accepts multiple http/https lines and ignores blank lines', () => {
    const r = parseSourceUrls('https://example.com/a\n\n  http://example.org/b  \r\n')
    expect(r.valid).toEqual(['https://example.com/a', 'http://example.org/b'])
    expect(r.issues).toEqual([])
  })
  it('rejects malformed input', () => {
    expect(parseSourceUrls('not a url').issues[0].issue).toBe('malformed')
  })
  it('rejects non-web protocols (file, javascript, ftp)', () => {
    for (const bad of ['file:///C:/x.mp4', 'javascript:alert(1)', 'ftp://example.com/x']) {
      expect(parseSourceUrls(bad).issues[0].issue).toBe('unsupportedProtocol')
    }
  })
  it('flags duplicates but keeps the first', () => {
    const r = parseSourceUrls('https://example.com/a\nhttps://example.com/a')
    expect(r.valid).toHaveLength(1)
    expect(r.issues[0].issue).toBe('duplicate')
  })
  it('rejects URLs embedding credentials and never echoes the password back', () => {
    const r = parseSourceUrls('https://user:hunter2@example.com/x')
    expect(r.valid).toEqual([])
    expect(JSON.stringify(r.issues)).not.toContain('hunter2')
  })
})

describe('redaction helpers', () => {
  it('redacts sensitive query values', () => {
    const out = redactUrl('https://example.com/v?id=1&token=abc123&sig=zzz')
    expect(out).not.toContain('abc123')
    expect(out).not.toContain('zzz')
    expect(out).toContain('id=1')
  })
  it('returns only the host for notification text', () => {
    expect(displayHost('https://www.example.com/path?token=secret')).toBe('example.com')
  })
})
