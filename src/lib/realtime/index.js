// Active real-time transport. M2a uses the local (BroadcastChannel) adapter.
// M2b: when VITE_FIREBASE_* is configured, re-export from './firebase' instead —
// the interface (createFamily/joinFamily/shareLocation/raiseSOS/clearSOS/subscribe)
// is identical, so no screen code changes.
export * from './local'
