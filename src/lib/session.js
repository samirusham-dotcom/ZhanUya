import { useCallback, useEffect, useState } from 'react'

// Per-tab session (role + name + linked family code). Stored in sessionStorage
// (NOT localStorage) so you can be a parent in one tab and a child in another —
// which is exactly how M2a is demoed on a single machine. Family data lives in
// localStorage (shared across tabs) so the two roles see each other.
const KEY = 'zhanuya:session'

function load() {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || '{}')
  } catch {
    return {}
  }
}

export function useSession() {
  const [session, setSession] = useState(load)

  useEffect(() => {
    sessionStorage.setItem(KEY, JSON.stringify(session))
  }, [session])

  const update = useCallback((patch) => setSession((s) => ({ ...s, ...patch })), [])
  const reset = useCallback(() => setSession({}), [])

  return [session, update, reset]
}
