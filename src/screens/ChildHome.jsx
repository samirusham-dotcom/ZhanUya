import { useEffect, useRef, useState } from 'react'
import { useGeolocation } from '../hooks/useGeolocation'
import { nearestZone, formatDistance, formatDuration } from '../lib/geo'
import { getWalkingRoute } from '../lib/routing'
import { SAFE_ZONES } from '../data/safeZones'
import SafeMap, { ALMATY } from '../components/SafeMap'
import { shareLocation, raiseSOS, clearSOS } from '../lib/realtime'

// Demo start point so SOS is always demoable away from Almaty / when GPS is off.
const DEMO_LOCATION = { ...ALMATY, accuracy: 15 }

export default function ChildHome({ session, onLeave }) {
  const code = session.code
  const { position, status } = useGeolocation()
  const [useDemo, setUseDemo] = useState(false)
  const [destination, setDestination] = useState(null)
  const [route, setRoute] = useState(null)
  const [isSearching, setIsSearching] = useState(false)
  const [message, setMessage] = useState('')
  const [sosActive, setSosActive] = useState(false)
  const lastShare = useRef(0)

  const user = useDemo ? DEMO_LOCATION : position
  const locating = status === 'locating' && !useDemo
  const blocked = (status === 'denied' || status === 'unavailable') && !useDemo

  // Continuously (throttled ~8s) share live location with the parent.
  useEffect(() => {
    if (!user || !code) return
    const now = Date.now()
    if (now - lastShare.current > 8000) {
      lastShare.current = now
      shareLocation(code, { lat: user.lat, lng: user.lng, accuracy: user.accuracy })
    }
  }, [user, code])

  async function triggerSOS() {
    if (!user) {
      setMessage('❌ Нет геопозиции')
      return
    }
    setIsSearching(true)
    setRoute(null)
    setDestination(null)
    setMessage('🔍 Ищем ближайшую безопасную зону…')

    const near = nearestZone(user, SAFE_ZONES)
    if (!near) {
      setIsSearching(false)
      setMessage('❌ Безопасная зона не найдена поблизости')
      return
    }
    setDestination(near.zone)
    setMessage('🛣 Строим маршрут…')

    try {
      const built = await getWalkingRoute(user, near.zone)
      setRoute(built)
      setSosActive(true)
      // Notify the parent in real time.
      raiseSOS(code, {
        lat: user.lat,
        lng: user.lng,
        zoneId: near.zone.id,
        zoneName: near.zone.name,
        zonePhone: near.zone.phone,
        route: built.coordinates,
        distance: built.distance,
        duration: built.duration,
      })
      setMessage('✅ Родитель уведомлён! Иди к безопасной зоне')
    } catch {
      setMessage('❌ Не удалось построить маршрут. Попробуй ещё раз')
    } finally {
      setIsSearching(false)
    }
  }

  function cancelSOS() {
    setSosActive(false)
    setRoute(null)
    setDestination(null)
    setMessage('')
    clearSOS(code)
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar__brand">🛡 ZhanUya</div>
        <div className="topbar__status">
          {user ? <>Режим защиты активен</> : 'Определяем местоположение…'}
        </div>
        <button className="topbar__role" onClick={onLeave}>сменить</button>
      </header>

      <div className="link-banner">🔗 Связано с семьёй · код {code}</div>

      <main className="map-wrap">
        {locating && (
          <div className="overlay-center">
            <div className="spinner" />
            <p>Получаем геопозицию…</p>
          </div>
        )}
        {blocked && (
          <div className="overlay-center">
            <p className="overlay-center__title">📍 Нет доступа к геолокации</p>
            <p className="overlay-center__sub">Разреши доступ — или используй демо-режим.</p>
            <button className="btn-secondary" onClick={() => setUseDemo(true)}>
              Включить демо-локацию (Алматы)
            </button>
          </div>
        )}
        {!locating && !blocked && (
          <SafeMap user={user} zones={SAFE_ZONES} destination={destination} route={route} />
        )}
      </main>

      <section className="panel">
        {message && <div className="status-pill">{message}</div>}

        {route && destination && (
          <div className="route-card">
            <div className="route-card__title">📍 {destination.name}</div>
            <div className="route-card__meta">
              📏 {formatDistance(route.distance)} · ⏱ {formatDuration(route.duration)} пешком
            </div>
            {destination.phone !== '—' && (
              <a className="route-card__call" href={`tel:${destination.phone}`}>☎ Позвонить</a>
            )}
          </div>
        )}

        {!sosActive ? (
          <button className="sos-btn" onClick={triggerSOS} disabled={isSearching || !user}>
            {isSearching ? (
              <><span className="spinner spinner--sm" /> Поиск…</>
            ) : (
              <>⚠️ SOS — оповестить родителя</>
            )}
          </button>
        ) : (
          <button className="ok-btn" onClick={cancelSOS}>✅ Я в порядке — отменить SOS</button>
        )}

        {user && !useDemo && (
          <button className="demo-toggle" onClick={() => setUseDemo(true)}>Тест из центра Алматы</button>
        )}
        {useDemo && (
          <button className="demo-toggle" onClick={() => setUseDemo(false)}>← Вернуться к моей геопозиции</button>
        )}
      </section>
    </div>
  )
}
