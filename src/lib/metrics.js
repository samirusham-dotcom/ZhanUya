import { collection, addDoc, getDocs } from 'firebase/firestore'
import { db } from './firebase'

// Anonymous pilot telemetry. Each event = one row in `events`:
//   { type, ts, demo?, ...data }
// Real usage logs without `demo`; the seed script sets demo:true so the metrics
// page can separate "real pilot results" from demo density.
export function logEvent(type, data = {}) {
  addDoc(collection(db, 'events'), { type, ts: Date.now(), ...data }).catch((e) =>
    console.warn('[metrics] logEvent', e.code || e.message),
  )
}

// Reads everything and computes the pilot's headline numbers.
// includeDemo=false → the honest "real results" view.
export async function loadMetrics(includeDemo) {
  const [evSnap, famSnap] = await Promise.all([
    getDocs(collection(db, 'events')),
    getDocs(collection(db, 'families')),
  ])

  const events = evSnap.docs.map((d) => d.data()).filter((e) => includeDemo || !e.demo)
  const families = famSnap.docs.map((d) => d.data()).filter((f) => includeDemo || !f.demo)

  const byType = (t) => events.filter((e) => e.type === t)
  const childrenLinked = families.reduce((n, f) => n + Object.keys(f.children || {}).length, 0)

  const alertTimes = byType('sos_sent')
    .map((e) => e.alertMs)
    .filter((n) => typeof n === 'number' && n > 0)
    .sort((a, b) => a - b)
  const medianAlertMs = alertTimes.length
    ? alertTimes[Math.floor(alertTimes.length / 2)]
    : null

  return {
    families: families.length,
    childrenLinked,
    sosSent: byType('sos_sent').length,
    statusesSent: byType('status_sent').length,
    medianAlertMs,
    totalEvents: events.length,
  }
}
