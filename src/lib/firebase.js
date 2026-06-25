import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

// Public web config (safe to ship in client code — access is controlled by
// Firestore security rules, not by hiding these keys).
const firebaseConfig = {
  apiKey: 'AIzaSyBuuImF7bsEgOQAB0_LFAjcGdmalDvsvPI',
  authDomain: 'zhanuya-2d029.firebaseapp.com',
  projectId: 'zhanuya-2d029',
  storageBucket: 'zhanuya-2d029.firebasestorage.app',
  messagingSenderId: '683589336187',
  appId: '1:683589336187:web:4036da75f6e2a8d3bbb6de',
  measurementId: 'G-5QSDQM93PS',
}

export const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
