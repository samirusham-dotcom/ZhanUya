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

// Emoji pin via divIcon (avoids Leaflet's broken default-marker paths under bundlers).
function zoneIcon(type, active) {
  return L.divIcon({
    className: 'zone-marker',
    html: `<div class="zone-pin${active ? ' zone-pin--active' : ''}">${ZONE_GLYPH[type] || '📍'}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  })
}

const userIcon = L.divIcon({
  className: 'user-marker',
  html: '<div class="user-dot"><span class="user-pulse"></span></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
})

// Pans/zooms the map to follow the route or the user.
function MapFocus({ route, user }) {
  const map = useMap()
  useEffect(() => {
    if (route?.coordinates?.length) {
      map.fitBounds(route.coordinates, { padding: [60, 80] })
    } else if (user) {
      map.setView([user.lat, user.lng], 15)
    }
  }, [route, user, map])
  return null
}

export default function SafeMap({ user, zones, destination, route }) {
  const center = user ? [user.lat, user.lng] : [ALMATY.lat, ALMATY.lng]

  return (
    <MapContainer center={center} zoom={14} zoomControl={false} className="map" attributionControl={false}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {zones.map((z) => (
        <Marker key={z.id} position={[z.lat, z.lng]} icon={zoneIcon(z.type, destination?.id === z.id)}>
          <Popup>
            <strong>{z.name}</strong>
            <br />
            {z.address}
            <br />
            ☎ {z.phone}
          </Popup>
        </Marker>
      ))}

      {user && <Marker position={[user.lat, user.lng]} icon={userIcon} />}

      {route && (
        <Polyline
          positions={route.coordinates}
          pathOptions={{ color: '#2563eb', weight: 6, opacity: 0.9 }}
        />
      )}

      <MapFocus route={route} user={user} />
    </MapContainer>
  )
}
