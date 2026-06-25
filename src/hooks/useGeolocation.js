import { useEffect, useState } from 'react'

// Live device location. Replaces v0's CoreLocation LocationManager.
// status: 'locating' | 'active' | 'denied' | 'unavailable'
export function useGeolocation() {
  const [position, setPosition] = useState(null) // { lat, lng, accuracy }
  const [error, setError] = useState(null)
  const [status, setStatus] = useState('locating')

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setStatus('unavailable')
      setError('Геолокация не поддерживается этим устройством')
      return
    }

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        })
        setStatus('active')
        setError(null)
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setStatus('denied')
          setError('Доступ к геолокации запрещён')
        } else {
          setStatus('unavailable')
          setError(err.message)
        }
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    )

    return () => navigator.geolocation.clearWatch(id)
  }, [])

  return { position, error, status }
}
