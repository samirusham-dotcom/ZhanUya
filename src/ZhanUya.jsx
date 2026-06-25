import { useState } from 'react'
import { useGeolocation } from './hooks/useGeolocation'
import { nearestZone, formatDistance, formatDuration } from './lib/geo'
import { getWalkingRoute } from './lib/routing'
import { SAFE_ZONES } from './data/safeZones'
import SafeMap, { ALMATY } from './components/SafeMap'
import './ZhanUya.css'

// Demo start point (used when real geolocation is unavailable / far from Almaty),
// so the SOS flow is always demoable in a video or away from the city.
const DEMO_LOCATION = { ...ALMATY, accuracy: 15 }

export default function ZhanUya() {
  const { position, status } = useGeolocation()
  const [useDemo, setUseDemo] = useState(false)
  const [destination, setDestination] = useState(null)
  const [route, setRoute] = useState(null)
  const [isSearching, setIsSearching] = useState(false)
  const [message, setMessage] = useState('')

  const user = useDemo ? DEMO_LOCATION : position
  const locating = status === 'locating' && !useDemo
  const blocked = (status === 'denied' || status === 'unavailable') && !useDemo

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
      setMessage('✅ Маршрут построен — иди к безопасной зоне')
    } catch {
      setMessage('❌ Не удалось построить маршрут. Попробуй ещё раз')
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="app">
      {/* Top status bar — protection mode + auto-detected position */}
      <header className="topbar">
        <div className="topbar__brand">🛡 ZhanUya</div>
        <div className="topbar__status">
          {user ? (
            <>Режим защиты активен · {user.lat.toFixed(4)}, {user.lng.toFixed(4)}</>
          ) : (
            'Определяем местоположение…'
          )}
        </div>
      </header>

      {/* Map */}
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
            <p className="overlay-center__sub">Разреши доступ в настройках браузера — или используй демо-режим.</p>
            <button className="btn-secondary" onClick={() => setUseDemo(true)}>
              Включить демо-локацию (Алматы)
            </button>
          </div>
        )}

        {!locating && !blocked && (
          <SafeMap user={user} zones={SAFE_ZONES} destination={destination} route={route} />
        )}
      </main>

      {/* Bottom control panel */}
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

        <button className="sos-btn" onClick={triggerSOS} disabled={isSearching || !user}>
          {isSearching ? (
            <><span className="spinner spinner--sm" /> Поиск…</>
          ) : (
            <>⚠️ SOS — маршрут до безопасной зоны</>
          )}
        </button>

        {!useDemo && user && (
          <button className="demo-toggle" onClick={() => setUseDemo(true)}>
            Тест из центра Алматы
          </button>
        )}
        {useDemo && (
          <button className="demo-toggle" onClick={() => setUseDemo(false)}>
            ← Вернуться к моей геопозиции
          </button>
        )}
      </section>
    </div>
  )
}
