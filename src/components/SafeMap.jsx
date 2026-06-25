import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Almaty city center — map default + demo fallback location.
export const ALMATY = { lat: 43.238949, lng: 76.889709 }

const ZONE_GLYPH = {
  pharmacy: '💊',
  school: '🎓',
  mall: '🏬',
  clinic: '🏥',
  police: '🚓',
  public: '🏛',
}

function zoneIcon(type, active) {
  return L.divIcon({
    className: 'zone-marker',
    html: `<div class="zone-pin${active ? ' zone-pin--active' : ''}">${ZONE_GLYPH[type] || '📍'}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  })
}

function personIcon(name, danger) {
  const label = (name || '').slice(0, 12)
  return L.divIcon({
    className: 'user-marker',
    html: `<div class="user-dot${danger ? ' user-dot--danger' : ''}"><span class="user-pulse"></span></div>
           ${label ? `<span class="user-label">${label}</span>` : ''}`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

// Fits the map to all routes, else all people, else Almaty. `focusKey` lets the
// caller force a refit when the meaningful set changes.
function MapFocus({ routes, people, focusKey }) {
  const map = useMap()
  useEffect(() => {
    const routePts = routes.flat()
    if (routePts.length) {
      map.fitBounds(routePts, { padding: [60, 80] })
    } else if (people.length === 1) {
      map.setView([people[0].lat, people[0].lng], 15)
    } else if (people.length > 1) {
      map.fitBounds(people.map((p) => [p.lat, p.lng]), { padding: [60, 80] })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey, map])
  return null
}

export default function SafeMap({ zones = [], people = [], routes = [], destinationId }) {
  const first = people[0]
  const center = first ? [first.lat, first.lng] : [ALMATY.lat, ALMATY.lng]
  const focusKey = `${routes.map((r) => r.length).join('-')}|${people.map((p) => p.id).join('-')}|${destinationId || ''}`

  return (
    <MapContainer center={center} zoom={14} zoomControl={false} className="map" attributionControl={false}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {zones.map((z) => (
        <Marker key={z.id} position={[z.lat, z.lng]} icon={zoneIcon(z.type, destinationId === z.id)}>
          <Popup>
            <strong>{z.name}</strong>
            <br />
            {z.address}
            <br />
            ☎ {z.phone}
          </Popup>
        </Marker>
      ))}

      {routes.map((coords, i) =>
        coords && coords.length ? (
          <Polyline key={`route-${i}`} positions={coords} pathOptions={{ color: '#2563eb', weight: 6, opacity: 0.9 }} />
        ) : null,
      )}

      {people.map((p) => (
        <Marker key={p.id} position={[p.lat, p.lng]} icon={personIcon(p.name, p.danger)}>
          {p.name && <Popup>{p.name}</Popup>}
        </Marker>
      ))}

      <MapFocus routes={routes} people={people} focusKey={focusKey} />
    </MapContainer>
  )
}
