// Walking-route provider. Replaces v0's MKDirections.
//
// Default (keyless): OSRM public demo for road geometry; walking time recomputed
// from distance. Preferred (VITE_ORS_API_KEY): OpenRouteService foot-walking.
// Last resort: a straight line via haversine — so a route ALWAYS renders, even
// when the router is unreachable or the start point is off-grid.
//
// Returns: { coordinates: [[lat,lng], ...], distance: meters, duration: seconds, approximate?: bool }
import { haversine } from './geo'

const WALK_SPEED_MPS = 1.39 // ~5 km/h
const ORS_KEY = import.meta.env.VITE_ORS_API_KEY

export async function getWalkingRoute(from, to) {
  if (ORS_KEY) {
    try {
      return await orsFootWalking(from, to)
    } catch (err) {
      console.warn('[routing] ORS failed, trying OSRM:', err.message)
    }
  }
  try {
    return await osrmRoute(from, to)
  } catch (err) {
    console.warn('[routing] OSRM failed, using straight line:', err.message)
    return straightLine(from, to)
  }
}

// Always succeeds — geodesic line + haversine distance.
function straightLine(from, to) {
  const distance = haversine(from, to)
  return {
    coordinates: [
      [from.lat, from.lng],
      [to.lat, to.lng],
    ],
    distance,
    duration: distance / WALK_SPEED_MPS,
    approximate: true,
  }
}

// Abortable fetch so a hung router fails fast to the fallback.
async function fetchWithTimeout(url, opts = {}, ms = 8000) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal })
  } finally {
    clearTimeout(t)
  }
}

async function orsFootWalking(from, to) {
  const res = await fetchWithTimeout(
    'https://api.openrouteservice.org/v2/directions/foot-walking/geojson',
    {
      method: 'POST',
      headers: { Authorization: ORS_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ coordinates: [[from.lng, from.lat], [to.lng, to.lat]] }),
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
  const res = await fetchWithTimeout(url)
  if (!res.ok) throw new Error(`OSRM ${res.status}`)
  const data = await res.json()
  const route = data.routes?.[0]
  if (!route) throw new Error('OSRM: no route')
  const coordinates = route.geometry.coordinates.map(([lng, lat]) => [lat, lng])
  return {
    coordinates,
    distance: route.distance,
    duration: route.distance / WALK_SPEED_MPS,
  }
}
