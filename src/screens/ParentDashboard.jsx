import { useEffect, useRef, useState } from 'react'
import { subscribe } from '../lib/realtime'
import { SAFE_ZONES } from '../data/safeZones'
import { formatDistance, formatDuration } from '../lib/geo'
import SafeMap from '../components/SafeMap'

export default function ParentDashboard({ session, onLeave }) {
  const code = session.code
  const [family, setFamily] = useState(null)
  const [alertOpen, setAlertOpen] = useState(false)
  const wasActive = useRef(false)

  useEffect(() => subscribe(code, setFamily), [code])

  const sos = family?.sos?.active ? family.sos : null
  const child = family?.child
  const childLoc = family?.location ? { lat: family.location.lat, lng: family.location.lng } : null
  const zone = sos ? SAFE_ZONES.find((z) => z.id === sos.zoneId) : null
  const route = sos ? { coordinates: sos.route, distance: sos.distance, duration: sos.duration } : null

  // Buzz + open the alert the moment an SOS fires.
  useEffect(() => {
    if (sos && !wasActive.current) {
      wasActive.current = true
      setAlertOpen(true)
      navigator.vibrate?.([300, 120, 300, 120, 600])
    }
    if (!sos) {
      wasActive.current = false
      setAlertOpen(false)
    }
  }, [sos])

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar__brand">👩‍👦 ZhanUya</div>
        <div className="topbar__status">
          {child ? (
            sos ? <span className="status-danger">🆘 SOS · {child.name}</span> : <>{child.name} · в безопасности</>
          ) : (
            'Ожидание ребёнка…'
          )}
        </div>
        <button className="topbar__role" onClick={onLeave}>сменить</button>
      </header>

      {!child && (
        <div className="code-banner">
          Передайте ребёнку родительский код:
          <span className="code-banner__code">{code}</span>
        </div>
      )}
      {child && !sos && (
        <div className="link-banner">🔗 {child.name} · код {code}{childLoc ? '' : ' · ждём геопозицию'}</div>
      )}

      <main className="map-wrap">
        <SafeMap user={childLoc} zones={SAFE_ZONES} destination={zone} route={route} />
        {sos && !alertOpen && (
          <button className="sos-reopen" onClick={() => setAlertOpen(true)}>🆘 Открыть оповещение</button>
        )}
      </main>

      {sos && (
        <section className="panel">
          <div className="route-card route-card--alert">
            <div className="route-card__title">🆘 {child?.name} нажал SOS</div>
            {zone && (
              <div className="route-card__meta">
                Идёт к: {zone.name} · 📏 {formatDistance(sos.distance)} · ⏱ {formatDuration(sos.duration)}
              </div>
            )}
            <div className="alert-actions">
              {zone && zone.phone !== '—' && (
                <a className="route-card__call" href={`tel:${zone.phone}`}>☎ Позвонить в зону</a>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Full-screen SOS alert */}
      {alertOpen && sos && (
        <div className="alert-overlay">
          <div className="alert-overlay__pulse">🆘</div>
          <h1 className="alert-overlay__title">SOS от {child?.name}</h1>
          {zone && (
            <p className="alert-overlay__sub">
              Идёт к безопасной зоне «{zone.name}»<br />
              📏 {formatDistance(sos.distance)} · ⏱ {formatDuration(sos.duration)} пешком
            </p>
          )}
          <p className="alert-overlay__coords">📍 {sos.lat.toFixed(5)}, {sos.lng.toFixed(5)}</p>
          <button className="btn-primary" onClick={() => setAlertOpen(false)}>Показать на карте</button>
          {zone && zone.phone !== '—' && (
            <a className="alert-overlay__call" href={`tel:${zone.phone}`}>☎ Позвонить в «{zone.name}»</a>
          )}
        </div>
      )}
    </div>
  )
}
