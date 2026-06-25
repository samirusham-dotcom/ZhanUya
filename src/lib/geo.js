// Geospatial helpers. Replaces v0's MKLocalSearch "nearest" logic with a
// deterministic haversine search over our curated safe-zone list.

const EARTH_RADIUS_M = 6371000
const toRad = (deg) => (deg * Math.PI) / 180

// Great-circle distance between two {lat, lng} points, in meters.
export function haversine(a, b) {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h))
}

// Returns { zone, distance } for the closest zone, or null if the list is empty.
export function nearestZone(point, zones) {
  let best = null
  let bestDist = Infinity
  for (const zone of zones) {
    const d = haversine(point, zone)
    if (d < bestDist) {
      bestDist = d
      best = zone
    }
  }
  return best ? { zone: best, distance: bestDist } : null
}

// Human-readable distance: "640 м" or "1.4 км".
export function formatDistance(meters) {
  return meters < 1000
    ? `${Math.round(meters)} м`
    : `${(meters / 1000).toFixed(1)} км`
}

// Human-readable walking time from seconds: "7 мин".
export function formatDuration(seconds) {
  const min = Math.max(1, Math.round(seconds / 60))
  return `${min} мин`
}
