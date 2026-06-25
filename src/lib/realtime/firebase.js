// Firestore real-time transport (M2b) — same interface as local.js, but backed
// by a shared cloud document so two *different devices* sync live, and the parent
// alert works phone-to-phone. One doc per family in the `families` collection,
// keyed by the 6-digit code.
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

const COL = 'families'
const ref = (code) => doc(db, COL, code)

function genCode() {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return String(100000 + (buf[0] % 900000))
}

export async function createFamily(parentName) {
  let code = genCode()
  while ((await getDoc(ref(code))).exists()) code = genCode()
  const family = {
    code,
    parentName: parentName || 'Родитель',
    child: null,
    location: null,
    sos: null,
    updatedAt: Date.now(),
  }
  await setDoc(ref(code), family)
  return family
}

export async function joinFamily(code, childName) {
  const snap = await getDoc(ref(code))
  if (!snap.exists()) throw new Error('Семья с таким кодом не найдена')
  const childId = 'c_' + crypto.getRandomValues(new Uint32Array(1))[0].toString(36)
  const child = { id: childId, name: childName || 'Ребёнок' }
  await updateDoc(ref(code), { child, updatedAt: Date.now() })
  return { family: { ...snap.data(), child }, childId }
}

export async function getFamily(code) {
  const snap = await getDoc(ref(code))
  return snap.exists() ? snap.data() : null
}

// Fire-and-forget writes (callers don't await these).
export function shareLocation(code, loc) {
  updateDoc(ref(code), { location: { ...loc, ts: Date.now() }, updatedAt: Date.now() })
    .catch((e) => console.warn('[firestore] shareLocation', e.code || e.message))
}

export function raiseSOS(code, sos) {
  updateDoc(ref(code), { sos: { active: true, ...sos, ts: Date.now() }, updatedAt: Date.now() })
    .catch((e) => console.warn('[firestore] raiseSOS', e.code || e.message))
}

export function clearSOS(code) {
  updateDoc(ref(code), { 'sos.active': false, updatedAt: Date.now() })
    .catch((e) => console.warn('[firestore] clearSOS', e.code || e.message))
}

export function subscribe(code, cb) {
  return onSnapshot(
    ref(code),
    (snap) => { if (snap.exists()) cb(snap.data()) },
    (e) => console.warn('[firestore] subscribe', e.code || e.message),
  )
}

export const ADAPTER = 'firebase'
