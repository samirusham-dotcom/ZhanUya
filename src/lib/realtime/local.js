// Local real-time transport for M2a — works across browser tabs/windows on one
// device via BroadcastChannel + localStorage. M2b swaps this for a Firestore
// adapter with the SAME interface, adding true cross-device sync + FCM push.
//
// Data model (one doc per family, keyed by its 6-digit code):
//   { code, parentName, child: {id,name}|null, location: {lat,lng,accuracy,ts}|null,
//     sos: { active, lat, lng, zoneId, zoneName, zonePhone, route, distance, duration, ts }|null }

const CHANNEL = 'zhanuya'
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL) : null
const keyFor = (code) => `zhanuya:family:${code}`

function read(code) {
  try {
    return JSON.parse(localStorage.getItem(keyFor(code)) || 'null')
  } catch {
    return null
  }
}

function write(family) {
  family.updatedAt = Date.now()
  localStorage.setItem(keyFor(family.code), JSON.stringify(family))
  channel?.postMessage({ code: family.code, family })
}

function genCode() {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return String(100000 + (buf[0] % 900000)) // 6 digits, no leading zero
}

export function createFamily(parentName) {
  let code = genCode()
  while (read(code)) code = genCode()
  const family = {
    code,
    parentName: parentName || 'Родитель',
    child: null,
    location: null,
    sos: null,
  }
  write(family)
  return family
}

export function joinFamily(code, childName) {
  const family = read(code)
  if (!family) throw new Error('Семья с таким кодом не найдена')
  const childId = 'c_' + crypto.getRandomValues(new Uint32Array(1))[0].toString(36)
  family.child = { id: childId, name: childName || 'Ребёнок' }
  write(family)
  return { family, childId }
}

export function getFamily(code) {
  return read(code)
}

export function shareLocation(code, loc) {
  const family = read(code)
  if (!family) return
  family.location = { ...loc, ts: Date.now() }
  write(family)
}

export function raiseSOS(code, sos) {
  const family = read(code)
  if (!family) return
  family.sos = { active: true, ...sos, ts: Date.now() }
  write(family)
}

export function clearSOS(code) {
  const family = read(code)
  if (!family || !family.sos) return
  family.sos = { ...family.sos, active: false }
  write(family)
}

// cb(family) on every update. Returns an unsubscribe fn.
export function subscribe(code, cb) {
  const onMessage = (e) => {
    if (e.data?.code === code) cb(e.data.family)
  }
  const onStorage = (e) => {
    if (e.key === keyFor(code) && e.newValue) cb(JSON.parse(e.newValue))
  }
  channel?.addEventListener('message', onMessage)
  window.addEventListener('storage', onStorage)

  const current = read(code)
  if (current) Promise.resolve().then(() => cb(current))

  return () => {
    channel?.removeEventListener('message', onMessage)
    window.removeEventListener('storage', onStorage)
  }
}

export const ADAPTER = 'local'
