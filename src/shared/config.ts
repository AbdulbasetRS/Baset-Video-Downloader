/**
 * Central, typed application configuration.
 * Owner/repository live ONLY here. Nothing in this file is a secret.
 */
export const APP_CONFIG = {
  productName: 'Baset Video Downloader',
  shortName: 'BVD',
  appId: 'com.abdulbasetrs.bvd',
  tagline: 'Download \u00B7 Manage \u00B7 Enjoy',
  developer: {
    name: 'AbdulBaset R. Sayed',
    profileUrl: 'https://github.com/AbdulBasetRS'
  },
  github: {
    owner: 'AbdulBasetRS',
    repo: 'Baset-Video-Downloader',
    repositoryUrl: 'https://github.com/AbdulBasetRS/Baset-Video-Downloader',
    releasesUrl: 'https://github.com/AbdulBasetRS/Baset-Video-Downloader/releases',
    // Repository owner and write access were confirmed through the connected GitHub account.
    ownershipConfirmed: true
  },
  updates: {
    liveChecksEnabled: true
  },
  license: {
    status: 'selected' as 'to-be-selected' | 'selected',
    spdx: 'MIT' as string | null
  }
} as const

/** Only these origins may be opened through the external-link IPC. */
export const ALLOWED_EXTERNAL_PREFIXES: readonly string[] = [
  APP_CONFIG.developer.profileUrl,
  APP_CONFIG.github.repositoryUrl,
  APP_CONFIG.github.releasesUrl
]
