import { useEffect, useState } from 'react'
import { subscribeZones } from '../lib/zones'
import { SAFE_ZONES } from '../data/safeZones'

// Live safe zones from Firestore, with the bundled list as fallback so the app
// always has zones (during load, offline, or before any are added in #zones).
export function useZones() {
  const [zones, setZones] = useState(null)

  useEffect(() => subscribeZones(setZones), [])

  return zones && zones.length > 0 ? zones : SAFE_ZONES
}
