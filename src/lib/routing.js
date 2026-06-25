// Walking-route provider. Replaces v0's MKDirections.
//
// Default (keyless): OSRM public demo server returns road-following geometry;
// we recompute the *walking* time from distance so the ETA is realistic.
// Preferred (when VITE_ORS_API_KEY is set): OpenRouteService true foot-walking.
//
// Both return: { coordinates: [[lat,lng], ...], distance: meters, duration: seconds }

const WALK_SPEED_MPS = 1.39 // ~5 km/h average walking pace
const ORS_KEY = import.meta.env.VITE_ORS_API_KEY

export async function getWalkingRoute(from, to) {
  if (ORS_KEY) {
    try {
      return await orsFootWalking(from, to)
    } catch (err) {
      console.warn('[routing] ORS failed, falling back to OSRM:', err.message)
    }
  }
  return await osrmRoute(from, to)
}

async function orsFootWalking(from, to) {
  const res = await fetch(
    'https://api.openrouteservice.org/v2/directions/foot-walking/geojson',
    {
      method: 'POST',
      headers: { Authorization: ORS_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coordinates: [
          [from.lng, from.lat],
          [to.lng, to.lat],
        ],
      }),
    },
  )
  if (!res.ok) throw new Error(`ORS ${res.status}`)
  const data = await res.json()
  const feature = data.features?.[0]
  if (!feature) throw new Error('ORS: no route')
  const coordinates = feature.geometry.coordinates.map(([lng, lat]) => [lat, lng])
  const { distance, duration } = feature.properties.summary
  return { coordinates, distance, duration }
}

async function osrmRoute(from, to) {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${from.lng},${from.lat};${to.lng},${to.lat}` +
    `?overview=full&geometries=geojson`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`OSRM ${res.status}`)
  const data = await res.json()
  const route = data.routes?.[0]
  if (!route) throw new Error('OSRM: no route')
  const coordinates = route.geometry.coordinates.map(([lng, lat]) => [lat, lng])
  // Use OSRM's road geometry + distance, but a walking-time estimate.
  return {
    coordinates,
    distance: route.distance,
    duration: route.distance / WALK_SPEED_MPS,
  }
}
