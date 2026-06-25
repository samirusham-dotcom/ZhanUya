import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore'
import { db } from './firebase'
import { SAFE_ZONES } from '../data/safeZones'

// Safe zones live in Firestore so the team can edit them without touching code
// (via the #zones admin screen). The bundled SAFE_ZONES are the fallback/default.
const COL = 'zones'

export function subscribeZones(cb) {
  return onSnapshot(
    collection(db, COL),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (e) => console.warn('[zones] subscribe', e.code || e.message),
  )
}

export function addZone(zone) {
  return addDoc(collection(db, COL), zone)
}
export function updateZone(id, patch) {
  return updateDoc(doc(db, COL, id), patch)
}
export function deleteZone(id) {
  return deleteDoc(doc(db, COL, id))
}

// One-tap: push the bundled 25 zones into Firestore as a starting point.
export async function seedDefaultZones() {
  for (const z of SAFE_ZONES) {
    const { id, ...rest } = z // drop the bundled id; Firestore assigns one
    await addZone(rest)
  }
}
