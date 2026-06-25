import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { ALMATY } from '../components/SafeMap'
import { subscribeZones, addZone, updateZone, deleteZone, seedDefaultZones } from '../lib/zones'

const TYPES = [
  ['pharmacy', '💊 Аптека'],
  ['school', '🎓 Школа'],
  ['mall', '🏬 ТРЦ'],
  ['clinic', '🏥 Клиника'],
  ['police', '🚓 Полиция'],
  ['public', '🏛 Публичное место'],
]
const GLYPH = { pharmacy: '💊', school: '🎓', mall: '🏬', clinic: '🏥', police: '🚓', public: '🏛' }

const pinIcon = (g) =>
  L.divIcon({ className: 'zone-marker', html: `<div class="zone-pin">${g}</div>`, iconSize: [30, 30], iconAnchor: [15, 15] })
const newIcon = L.divIcon({
  className: 'zone-marker',
  html: '<div class="zone-pin zone-pin--active">📍</div>',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
})

function ClickCapture({ onPick }) {
  useMapEvents({ click: (e) => onPick(e.latlng) })
  return null
}

const EMPTY = { name: '', type: 'pharmacy', address: '', phone: '', lat: null, lng: null }

export default function ZonesAdmin() {
  const [zones, setZones] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => subscribeZones(setZones), [])

  const pick = (latlng) =>
    setForm((f) => ({ ...f, lat: +latlng.lat.toFixed(6), lng: +latlng.lng.toFixed(6) }))

  async function save() {
    if (!form.name || form.lat == null) return
    setBusy(true)
    const data = {
      name: form.name.trim(),
      type: form.type,
      address: form.address.trim(),
      phone: form.phone.trim() || '—',
      lat: form.lat,
      lng: form.lng,
    }
    try {
      if (editingId) await updateZone(editingId, data)
      else await addZone(data)
      setForm(EMPTY)
      setEditingId(null)
    } finally {
      setBusy(false)
    }
  }

  function edit(z) {
    setForm({ name: z.name, type: z.type, address: z.address || '', phone: z.phone || '', lat: z.lat, lng: z.lng })
    setEditingId(z.id)
  }
  function cancel() {
    setForm(EMPTY)
    setEditingId(null)
  }
  async function remove(id) {
    if (window.confirm('Удалить зону?')) await deleteZone(id)
  }

  return (
    <div className="screen zones-admin">
      <div className="screen__hero">
        <div className="screen__brand">🗺 Безопасные зоны</div>
        <p className="screen__sub">Нажми на карту, чтобы поставить точку, заполни данные и сохрани.</p>
      </div>

      <div className="zones-map">
        <MapContainer center={[ALMATY.lat, ALMATY.lng]} zoom={12} className="map" zoomControl={false} attributionControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ClickCapture onPick={pick} />
          {zones.map((z) => (
            <Marker key={z.id} position={[z.lat, z.lng]} icon={pinIcon(GLYPH[z.type] || '📍')} />
          ))}
          {form.lat != null && <Marker position={[form.lat, form.lng]} icon={newIcon} />}
        </MapContainer>
      </div>

      <div className="zones-form">
        <input className="field" placeholder="Название" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <select className="field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          {TYPES.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <input className="field" placeholder="Адрес" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <input className="field" placeholder="Телефон" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <div className="zones-coords">
          {form.lat != null ? `📍 ${form.lat}, ${form.lng}` : '👆 Нажми на карту, чтобы выбрать точку'}
        </div>
        <button className="btn-primary" onClick={save} disabled={busy || !form.name || form.lat == null}>
          {editingId ? 'Сохранить изменения' : 'Добавить зону'}
        </button>
        {editingId && <button className="link-back" onClick={cancel}>Отмена</button>}
      </div>

      <div className="zones-list">
        <div className="zones-list__head">Зоны: {zones.length}</div>
        {zones.length === 0 && (
          <button className="btn-secondary" onClick={seedDefaultZones}>Загрузить 25 зон по умолчанию</button>
        )}
        {zones.map((z) => (
          <div className="zone-item" key={z.id}>
            <span className="zone-item__name">{GLYPH[z.type] || '📍'} {z.name}</span>
            <span className="zone-item__actions">
              <button onClick={() => edit(z)}>✏️</button>
              <button onClick={() => remove(z.id)}>🗑</button>
            </span>
          </div>
        ))}
      </div>

      <a className="link-back" href={import.meta.env.BASE_URL}>← В приложение</a>
    </div>
  )
}
