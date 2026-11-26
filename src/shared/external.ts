import { ALLOWED_EXTERNAL_PREFIXES } from './config'

/** Only https URLs under the configured GitHub profile/repository may be opened externally. */
export function isAllowedExternalUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password) return false
    // Compare against the normalized href so look-alike hosts and path tricks cannot pass.
    const href = parsed.href
    return ALLOWED_EXTERNAL_PREFIXES.some((prefix) => href === prefix || href.startsWith(prefix + '/'))
  } catch {
    return false
  }
}
