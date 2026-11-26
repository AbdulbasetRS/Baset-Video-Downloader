import { useT } from '../hooks/useT'

/** Centered mark on a solid background. Motion comes from the approved brand CSS. */
export function Splash({ loading }: { loading: boolean }) {
  const t = useT()
  return (
    <main className="splash" aria-label="Baset Video Downloader">
      <div className="splash__inner">
        <div className="splash__mark bvd-logo-motion bvd-logo-motion--enter">
          <img src="./brand/bvd-mark.svg" alt="" width={136} height={136} />
        </div>
        <div className="splash__name">Baset Video Downloader</div>
        <div className="splash__caption" role="status">{t.app.starting}</div>
        {loading && <div className="splash__bar" aria-hidden="true" />}
      </div>
    </main>
  )
}
