import { collection, addDoc, getDocs } from 'firebase/firestore'
import { db } from './firebase'

// In-app pilot survey → `surveys` collection. Replaces an external Google Form so
// responses land in the same dashboard as the usage metrics.
//   { role, clarity(1-5), sosWorked(bool), wouldUse(1-5), improve(text), ts, demo? }
export function submitSurvey(data) {
  return addDoc(collection(db, 'surveys'), { ...data, ts: Date.now() })
}

export async function loadSurveyStats(includeDemo) {
  const snap = await getDocs(collection(db, 'surveys'))
  const rows = snap.docs.map((d) => d.data()).filter((r) => includeDemo || !r.demo)
  if (!rows.length) {
    return { count: 0, avgClarity: null, pctSosWorked: null, avgWouldUse: null, comments: [] }
  }
  const avg = (key) => {
    const nums = rows.map((r) => r[key]).filter((n) => typeof n === 'number')
    return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null
  }
  const sosRows = rows.filter((r) => typeof r.sosWorked === 'boolean')
  return {
    count: rows.length,
    avgClarity: avg('clarity'),
    avgWouldUse: avg('wouldUse'),
    pctSosWorked: sosRows.length
      ? Math.round((sosRows.filter((r) => r.sosWorked).length / sosRows.length) * 100)
      : null,
    comments: rows
      .filter((r) => r.improve && r.improve.trim())
      .map((r) => ({ role: r.role, text: r.improve.trim() }))
      .slice(-10),
  }
}
