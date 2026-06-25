// Firestore real-time transport (M2b) — multi-child capable.
//
// One doc per family in `families`, keyed by the 6-digit code:
//   { code, parentName, updatedAt,
//     children: { [childId]: { id, name, joinedAt, location|null, sos|null } } }
//
// Each child owns its own location + sos, so several kids can share one family
// without clobbering each other.
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

const COL = 'families'
const ref = (code) => doc(db, COL, code)

function rid(prefix) {
  return prefix + crypto.getRandomValues(new Uint32Array(1))[0].toString(36)
}
function genCode() {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return String(100000 + (buf[0] % 900000))
}

export async function createFamily(parentName) {
  let code = genCode()
  while ((await getDoc(ref(code))).exists()) code = genCode()
  const family = { code, parentName: parentName || 'Родитель', children: {}, updatedAt: Date.now() }
  await setDoc(ref(code), family)
  return family
}

// Pass existingChildId to re-attach the same child (prevents ghost duplicates on rejoin).
export async function joinFamily(code, childName, existingChildId) {
  const snap = await getDoc(ref(code))
  if (!snap.exists()) throw new Error('Семья с таким кодом не найдена')
  const data = snap.data()
  const childId = existingChildId && data.children?.[existingChildId] ? existingChildId : rid('c_')
  const existing = data.children?.[childId]
  const child = {
    id: childId,
    name: childName || 'Ребёнок',
    joinedAt: existing?.joinedAt || Date.now(),
    location: existing?.location || null,
    sos: existing?.sos || null,
  }
  await updateDoc(ref(code), { [`children.${childId}`]: child, updatedAt: Date.now() })
  return { family: data, childId }
}

export async function getFamily(code) {
  const snap = await getDoc(ref(code))
  return snap.exists() ? snap.data() : null
}

// Fire-and-forget; safe if it loses the race with the network.
export function shareLocation(code, childId, loc) {
  return updateDoc(ref(code), {
    [`children.${childId}.location`]: { ...loc, ts: Date.now() },
    updatedAt: Date.now(),
  }).catch((e) => console.warn('[firestore] shareLocation', e.code || e.message))
}

// Returns the write promise so the child can CONFIRM the alert was delivered.
export function raiseSOS(code, childId, sos) {
  return updateDoc(ref(code), {
    [`children.${childId}.sos`]: { active: true, ...sos, ts: Date.now() },
    updatedAt: Date.now(),
  })
}

export function clearSOS(code, childId) {
  return updateDoc(ref(code), {
    [`children.${childId}.sos.active`]: false,
    updatedAt: Date.now(),
  }).catch((e) => console.warn('[firestore] clearSOS', e.code || e.message))
}

// One-tap status update ("в автобусе", "я дома") — the everyday reassurance flow.
export function setStatus(code, childId, text) {
  return updateDoc(ref(code), {
    [`children.${childId}.status`]: { text, ts: Date.now() },
    updatedAt: Date.now(),
  }).catch((e) => console.warn('[firestore] setStatus', e.code || e.message))
}

export function subscribe(code, cb) {
  return onSnapshot(
    ref(code),
    (snap) => { if (snap.exists()) cb(snap.data()) },
    (e) => console.warn('[firestore] subscribe', e.code || e.message),
  )
}

export const ADAPTER = 'firebase'
