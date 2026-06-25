import { useEffect, useRef, useState } from 'react'
import { useGeolocation } from '../hooks/useGeolocation'
import { nearestZone, formatDistance, formatDuration } from '../lib/geo'
import { getWalkingRoute } from '../lib/routing'
import { SAFE_ZONES } from '../data/safeZones'
import SafeMap, { ALMATY } from '../components/SafeMap'
import { shareLocation, raiseSOS, clearSOS, setStatus } from '../lib/realtime'
import { logEvent } from '../lib/metrics'

const DEMO_LOCATION = { ...ALMATY, accuracy: 15 }
const QUICK_STATUSES = ['Вышел из школы', 'Сел в автобус', 'Почти дома', 'Я дома ✅']

export default function ChildHome({ session, onLeave }) {
  const code = session.code
  const childId = session.childId
  const { position, status } = useGeolocation()
  const [useDemo, setUseDemo] = useState(false)
  const [destination, setDestination] = useState(null)
  const [route, setRoute] = useState(null)
  const [isSearching, setIsSearching] = useState(false)
  const [message, setMessage] = useState('')
  const [sosActive, setSosActive] = useState(false)
  const [sentStatus, setSentStatus] = useState(null)
  const lastShare = useRef(0)

  function sendStatus(text) {
    setStatus(code, childId, text)
    setSentStatus(text)
    setMessage(`✅ Отправлено родителю: ${text}`)
    logEvent('status_sent')
  }

  const user = useDemo ? DEMO_LOCATION : position
  const locating = status === 'locating' && !useDemo
  const blocked = (status === 'denied' || status === 'unavailable') && !useDemo

  // Stream live location to the parent. Faster cadence while an SOS is active.
  useEffect(() => {
    if (!user || !code || !childId) return
    const interval = sosActive ? 4000 : 8000
    const now = Date.now()
    if (now - lastShare.current > interval) {
      lastShare.current = now
      shareLocation(code, childId, { lat: user.lat, lng: user.lng, accuracy: user.accuracy })
    }
  }, [user, code, childId, sosActive])

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

    const base = {
      lat: user.lat,
      lng: user.lng,
      zoneId: near.zone.id,
      zoneName: near.zone.name,
      zonePhone: near.zone.phone,
    }

    // Refresh location right now so the parent sees the latest position with the alert.
    lastShare.current = Date.now()
    shareLocation(code, childId, { lat: user.lat, lng: user.lng, accuracy: user.accuracy })

    // 1) Alert the parent and CONFIRM it was delivered (don't gate on routing).
    setMessage('🚨 Отправляем сигнал родителю…')
    const t0 = Date.now()
    try {
      await raiseSOS(code, childId, base)
      logEvent('sos_sent', { alertMs: Date.now() - t0 })
      setSosActive(true)
      setMessage('✅ Родитель уведомлён! Строим маршрут…')
    } catch {
      setIsSearching(false)
      setMessage('⚠️ Не удалось отправить сигнал. Проверь интернет и попробуй снова')
      return
    }

    // 2) Build the route (best-effort) and enrich the alert.
    try {
      const built = await getWalkingRoute(user, near.zone)
      setRoute(built)
      raiseSOS(code, childId, {
        ...base,
        route: built.coordinates,
        distance: built.distance,
        duration: built.duration,
      }).catch(() => {})
      setMessage(`✅ Родитель уведомлён! Иди к: ${near.zone.name}`)
    } catch {
      setMessage(`✅ Родитель уведомлён. Иди к: ${near.zone.name}`)
    } finally {
      setIsSearching(false)
    }
  }

  function cancelSOS() {
    setSosActive(false)
    setRoute(null)
    setDestination(null)
    setMessage('')
    clearSOS(code, childId)
  }

  const people = user ? [{ id: 'me', name: '', lat: user.lat, lng: user.lng, danger: sosActive }] : []
  const routes = route ? [route.coordinates] : []

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar__brand">🛡 ZhanUya</div>
        <div className="topbar__status">
          {user ? <>Режим защиты активен</> : 'Определяем местоположение…'}
        </div>
        <button className="topbar__role" onClick={onLeave}>сменить</button>
      </header>

      <div className="link-banner">🔗 {session.name || 'Ребёнок'} · код {code}</div>

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
          <SafeMap zones={SAFE_ZONES} people={people} routes={routes} destinationId={destination?.id} />
        )}
      </main>

      <section className="panel">
        {message && <div className="status-pill">{message}</div>}

        {route && destination && (
          <div className="route-card">
            <div className="route-card__title">📍 {destination.name}</div>
            <div className="route-card__meta">
              📏 {formatDistance(route.distance)} · ⏱ {formatDuration(route.duration)} пешком
              {route.approximate && ' · примерно'}
            </div>
            {destination.phone !== '—' && (
              <a className="route-card__call" href={`tel:${destination.phone}`}>☎ Позвонить</a>
            )}
          </div>
        )}

        {!sosActive && (
          <div className="quick-replies">
            {QUICK_STATUSES.map((s) => (
              <button
                key={s}
                className={`chip${sentStatus === s ? ' chip--sent' : ''}`}
                onClick={() => sendStatus(s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="sos-wrap">
          {!sosActive ? (
            <>
              <button className="sos-btn" onClick={triggerSOS} disabled={isSearching || !user}>
                {isSearching ? (
                  <span className="spinner spinner--lg" />
                ) : (
                  <span className="sos-btn__label">SOS</span>
                )}
              </button>
              <div className="sos-hint">Нажми при опасности — родитель получит сигнал и маршрут</div>
            </>
          ) : (
            <button className="ok-btn" onClick={cancelSOS}>✅ Я в порядке — отменить SOS</button>
          )}
        </div>

        {user && !useDemo && (
          <button className="demo-toggle" onClick={() => setUseDemo(true)}>Тест из центра Алматы</button>
        )}
        {useDemo && (
          <button className="demo-toggle" onClick={() => setUseDemo(false)}>← Вернуться к моей геопозиции</button>
        )}
        <a className="survey-link" href={`${import.meta.env.BASE_URL}#survey`}>📝 Оставить отзыв о приложении</a>
      </section>
    </div>
  )
}
