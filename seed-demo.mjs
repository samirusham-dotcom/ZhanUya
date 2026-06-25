// Seeds demo families + events into Firestore for video/screenshot density.
// Everything is flagged demo:true so the metrics page can exclude it from the
// real pilot results. Run: node seed-demo.mjs   (delete later: node seed-demo.mjs --clear)
import { initializeApp } from 'firebase/app'
import {
  initializeFirestore, collection, doc, setDoc, addDoc, getDocs, deleteDoc, query, where,
} from 'firebase/firestore'
import { SAFE_ZONES } from './src/data/safeZones.js'

const cfg = {
  apiKey: 'AIzaSyBuuImF7bsEgOQAB0_LFAjcGdmalDvsvPI',
  authDomain: 'zhanuya-2d029.firebaseapp.com',
  projectId: 'zhanuya-2d029',
  storageBucket: 'zhanuya-2d029.firebasestorage.app',
  messagingSenderId: '683589336187',
  appId: '1:683589336187:web:4036da75f6e2a8d3bbb6de',
}
const app = initializeApp(cfg)
const db = initializeFirestore(app, { experimentalForceLongPolling: true })

const NAMES = ['Алия', 'Бекзат', 'Дамир', 'Аружан', 'Ерлан', 'Жанель', 'Санжар', 'Камила', 'Тимур', 'Аиша']
const ALMATY = { lat: 43.238949, lng: 76.889709 }
const jitter = (base, i) => base + ((i * 37) % 100) / 5000 - 0.01

const COMMENTS = [
  'Кнопка SOS очень большая и понятная',
  'Хочу, чтобы родителю приходило уведомление, даже когда телефон закрыт',
  'Удобно, что не надо ничего печатать',
  'Добавьте больше безопасных зон',
  'Маршрут построился быстро',
]

async function seedSurveys() {
  let n = 0
  for (let i = 0; i < 14; i++) {
    await addDoc(collection(db, 'surveys'), {
      role: i % 3 === 0 ? 'parent' : 'child',
      clarity: 4 + (i % 2),
      sosWorked: i % 7 !== 0,
      wouldUse: 4 + ((i + 1) % 2),
      improve: i % 3 === 0 ? COMMENTS[i % COMMENTS.length] : '',
      ts: Date.now(),
      demo: true,
    })
    n++
  }
  console.log(`seeded ${n} demo survey responses (demo:true)`)
}

async function clear() {
  for (const col of ['families', 'events', 'surveys']) {
    const snap = await getDocs(query(collection(db, col), where('demo', '==', true)))
    for (const d of snap.docs) await deleteDoc(d.ref)
    console.log(`cleared ${snap.size} demo docs from ${col}`)
  }
}

async function seed() {
  const FAMILIES = 18
  let kids = 0
  let sos = 0
  let statuses = 0
  for (let f = 0; f < FAMILIES; f++) {
    const code = String(900000 + f) // demo codes 9000xx — won't collide with real 1xxxxx–8xxxxx
    const nKids = 1 + (f % 3) // 1–3 children
    const children = {}
    for (let k = 0; k < nKids; k++) {
      const id = `demo_${f}_${k}`
      const name = NAMES[(f + k) % NAMES.length]
      children[id] = {
        id,
        name,
        joinedAt: Date.now(),
        location: { lat: jitter(ALMATY.lat, f + k), lng: jitter(ALMATY.lng, f * 2 + k), ts: Date.now() },
        sos: null,
        status: k === 0 ? { text: 'Я дома ✅', ts: Date.now() } : null,
      }
      kids++
      if (children[id].status) statuses++
    }
    await setDoc(doc(db, 'families', code), { code, parentName: 'Родитель', children, demo: true, updatedAt: Date.now() })
    await addDoc(collection(db, 'events'), { type: 'family_created', ts: Date.now(), demo: true })
    for (let k = 0; k < nKids; k++) await addDoc(collection(db, 'events'), { type: 'child_linked', ts: Date.now(), demo: true })
    // a couple of SOS events with realistic alert times
    if (f % 4 === 0) {
      await addDoc(collection(db, 'events'), { type: 'sos_sent', ts: Date.now(), alertMs: 700 + (f * 53) % 900, demo: true })
      sos++
    }
    await addDoc(collection(db, 'events'), { type: 'status_sent', ts: Date.now(), demo: true })
    statuses++
  }
  console.log(`seeded ${FAMILIES} families, ${kids} children, ${sos} SOS, ${statuses} statuses (all demo:true)`)
}

// Real safe zones (NOT demo-flagged — these are the actual data).
async function seedZones() {
  const snap = await getDocs(collection(db, 'zones'))
  if (snap.size > 0) {
    console.log(`zones already exist (${snap.size}), skipping`)
    return
  }
  for (const z of SAFE_ZONES) {
    const { id, ...rest } = z
    await addDoc(collection(db, 'zones'), rest)
  }
  console.log(`seeded ${SAFE_ZONES.length} safe zones`)
}

const mode = process.argv[2]
try {
  if (mode === '--clear') await clear()
  else if (mode === '--surveys') await seedSurveys()
  else if (mode === '--zones') await seedZones()
  else {
    await seed()
    await seedSurveys()
  }
  process.exit(0)
} catch (e) {
  console.log('SEED_ERROR:', e.code || '', e.message)
  process.exit(1)
}
