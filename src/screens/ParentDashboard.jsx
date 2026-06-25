import { useEffect, useRef, useState } from 'react'
import { subscribe } from '../lib/realtime'
import { SAFE_ZONES } from '../data/safeZones'
import { formatDistance, formatDuration } from '../lib/geo'
import SafeMap from '../components/SafeMap'

const STALE_MS = 30000

function timeAgo(ts) {
  if (!ts) return '—'
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000))
  if (s < 60) return `${s} с назад`
  return `${Math.round(s / 60)} мин назад`
}

function childWord(n) {
  const d = n % 10
  const dd = n % 100
  if (d === 1 && dd !== 11) return 'ребёнок'
  if (d >= 2 && d <= 4 && (dd < 12 || dd > 14)) return 'ребёнка'
  return 'детей'
}

export default function ParentDashboard({ session, onLeave }) {
  const code = session.code
  const [family, setFamily] = useState(null)
  const [, setTick] = useState(0) // forces freshness timers to re-render
  const [alertOpen, setAlertOpen] = useState(true)
  const prevSOS = useRef(new Set())

  useEffect(() => subscribe(code, setFamily), [code])
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 5000)
    return () => clearInterval(id)
  }, [])

  const children = family?.children ? Object.values(family.children) : []
  const sosChildren = children.filter((c) => c.sos?.active)
  const sosKey = sosChildren.map((c) => c.id + (c.sos?.ts || '')).join(',')

  // Buzz + open when a NEW child raises SOS (not on every snapshot).
  useEffect(() => {
    const ids = new Set(sosChildren.map((c) => c.id))
    let isNew = false
    ids.forEach((id) => { if (!prevSOS.current.has(id)) isNew = true })
    if (isNew) {
      setAlertOpen(true)
      navigator.vibrate?.([300, 120, 300, 120, 600])
    }
    prevSOS.current = ids
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sosKey])

  const people = children
    .filter((c) => c.location)
    .map((c) => ({ id: c.id, name: c.name, lat: c.location.lat, lng: c.location.lng, danger: !!c.sos?.active }))
  const routes = sosChildren.filter((c) => c.sos?.route).map((c) => c.sos.route)

  const primary = sosChildren[0]
  const primaryZone = primary ? SAFE_ZONES.find((z) => z.id === primary.sos.zoneId) : null

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar__brand">👩‍👦 ZhanUya</div>
        <div className="topbar__status">
          {sosChildren.length > 0 ? (
            <span className="status-danger">🆘 SOS · {sosChildren.map((c) => c.name).join(', ')}</span>
          ) : children.length ? (
            `${children.length} ${childWord(children.length)} · в безопасности`
          ) : (
            'Ожидание ребёнка…'
          )}
        </div>
        <button className="topbar__role" onClick={onLeave}>сменить</button>
      </header>

      {children.length === 0 && (
        <div className="code-banner">
          Передайте детям родительский код:
          <span className="code-banner__code">{code}</span>
        </div>
      )}

      <main className="map-wrap">
        <SafeMap zones={SAFE_ZONES} people={people} routes={routes} destinationId={primaryZone?.id} />
        {sosChildren.length > 0 && !alertOpen && (
          <button className="sos-reopen" onClick={() => setAlertOpen(true)}>🆘 Открыть оповещение</button>
        )}
      </main>

      {children.length > 0 && (
        <section className="panel">
          <div className="kid-list">
            {children.map((c) => {
              const stale = c.location?.ts && Date.now() - c.location.ts > STALE_MS
              return (
                <div key={c.id} className={`kid-row${c.sos?.active ? ' kid-row--sos' : ''}`}>
                  <div className="kid-row__name">{c.sos?.active ? '🆘' : '🟢'} {c.name}</div>
                  <div className="kid-row__meta">
                    {c.location ? (
                      <>📍 {timeAgo(c.location.ts)}{stale ? ' · связь?' : ''}</>
                    ) : (
                      'ждём геопозицию…'
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {primary && primaryZone && (
            <div className="route-card route-card--alert">
              <div className="route-card__title">🆘 {primary.name} → {primaryZone.name}</div>
              {primary.sos.distance != null && (
                <div className="route-card__meta">
                  📏 {formatDistance(primary.sos.distance)} · ⏱ {formatDuration(primary.sos.duration)}
                </div>
              )}
              {primaryZone.phone !== '—' && (
                <a className="route-card__call" href={`tel:${primaryZone.phone}`}>☎ Позвонить в зону</a>
              )}
            </div>
          )}
        </section>
      )}

      {alertOpen && primary && (
        <div className="alert-overlay">
          <div className="alert-overlay__pulse">🆘</div>
          <h1 className="alert-overlay__title">SOS от {primary.name}</h1>
          {sosChildren.length > 1 && (
            <p className="alert-overlay__sub">+ ещё {sosChildren.length - 1} в тревоге</p>
          )}
          {primaryZone && (
            <p className="alert-overlay__sub">
              Идёт к безопасной зоне «{primaryZone.name}»
              {primary.sos.distance != null && (
                <><br />📏 {formatDistance(primary.sos.distance)} · ⏱ {formatDuration(primary.sos.duration)} пешком</>
              )}
            </p>
          )}
          <p className="alert-overlay__coords">📍 {primary.sos.lat.toFixed(5)}, {primary.sos.lng.toFixed(5)}</p>
          <button className="btn-primary" onClick={() => setAlertOpen(false)}>Показать на карте</button>
          {primaryZone && primaryZone.phone !== '—' && (
            <a className="alert-overlay__call" href={`tel:${primaryZone.phone}`}>☎ Позвонить в «{primaryZone.name}»</a>
          )}
        </div>
      )}
    </div>
  )
}
