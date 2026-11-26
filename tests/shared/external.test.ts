import { isAllowedExternalUrl } from '../../src/shared/external'

describe('isAllowedExternalUrl', () => {
  it('allows the configured profile and repository', () => {
    expect(isAllowedExternalUrl('https://github.com/AbdulBasetRS')).toBe(true)
    expect(isAllowedExternalUrl('https://github.com/AbdulBasetRS/Baset-Video-Downloader')).toBe(true)
    expect(isAllowedExternalUrl('https://github.com/AbdulBasetRS/Baset-Video-Downloader/releases')).toBe(true)
  })
  it('blocks other sites, look-alikes, and non-https schemes', () => {
    for (const bad of [
      'https://example.com',
      'http://github.com/AbdulBasetRS',
      'https://github.com.evil.test/AbdulBasetRS',
      'https://github.com/AbdulBasetRSevil',
      'https://evil@github.com/AbdulBasetRS',
      'file:///C:/Windows/System32/calc.exe',
      'javascript:alert(1)',
      'not a url'
    ]) expect(isAllowedExternalUrl(bad)).toBe(false)
  })
})
