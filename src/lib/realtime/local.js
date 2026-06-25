// Local real-time transport (offline/demo) — multi-child capable, mirrors the
// Firestore adapter's interface. Works across tabs via BroadcastChannel + localStorage.
//
// Family doc: { code, parentName, children: { [childId]: {id,name,joinedAt,location,sos} }, updatedAt }

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
function rid(prefix) {
  return prefix + crypto.getRandomValues(new Uint32Array(1))[0].toString(36)
}
function genCode() {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return String(100000 + (buf[0] % 900000))
}

export function createFamily(parentName) {
  let code = genCode()
  while (read(code)) code = genCode()
  const family = { code, parentName: parentName || 'Родитель', children: {} }
  write(family)
  return family
}

export function joinFamily(code, childName, existingChildId) {
  const family = read(code)
  if (!family) throw new Error('Семья с таким кодом не найдена')
  family.children = family.children || {}
  const childId = existingChildId && family.children[existingChildId] ? existingChildId : rid('c_')
  const existing = family.children[childId]
  family.children[childId] = {
    id: childId,
    name: childName || 'Ребёнок',
    joinedAt: existing?.joinedAt || Date.now(),
    location: existing?.location || null,
    sos: existing?.sos || null,
  }
  write(family)
  return { family, childId }
}

export function getFamily(code) {
  return read(code)
}

export function shareLocation(code, childId, loc) {
  const family = read(code)
  if (!family?.children?.[childId]) return
  family.children[childId].location = { ...loc, ts: Date.now() }
  write(family)
}

export function raiseSOS(code, childId, sos) {
  const family = read(code)
  if (!family?.children?.[childId]) return Promise.resolve()
  family.children[childId].sos = { active: true, ...sos, ts: Date.now() }
  write(family)
  return Promise.resolve()
}

export function clearSOS(code, childId) {
  const family = read(code)
  const child = family?.children?.[childId]
  if (!child?.sos) return
  child.sos = { ...child.sos, active: false }
  write(family)
}

export function setStatus(code, childId, text) {
  const family = read(code)
  if (!family?.children?.[childId]) return
  family.children[childId].status = { text, ts: Date.now() }
  write(family)
}

export function subscribe(code, cb) {
  const onMessage = (e) => { if (e.data?.code === code) cb(e.data.family) }
  const onStorage = (e) => { if (e.key === keyFor(code) && e.newValue) cb(JSON.parse(e.newValue)) }
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
