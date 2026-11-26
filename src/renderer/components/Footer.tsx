import { useSettingsStore } from '../store/settings-store'
import { useT } from '../hooks/useT'
import { APP_CONFIG } from '../../shared/config'
import { ExternalLinkButton } from './ExternalLinkButton'

export function Footer() {
  const t = useT()
  const version = useSettingsStore((s) => s.appInfo?.version)
  return (
    <footer className="footer">
      <div className="footer__group">
        <span>{t.footer.by}</span>
        <ExternalLinkButton url={APP_CONFIG.developer.profileUrl} label={t.footer.profile}>{APP_CONFIG.developer.name}</ExternalLinkButton>
      </div>
      <div className="footer__group">
        <span>{t.footer.version} <span className="ltr">{version ?? '-'}</span></span>
        <ExternalLinkButton url={APP_CONFIG.github.repositoryUrl} label={t.footer.repository}>
          Repository
        </ExternalLinkButton>
      </div>
    </footer>
  )
}
