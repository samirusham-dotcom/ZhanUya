import { useCallback, useEffect, useState } from 'react'

// Persistent session (role + name + linked family code + childId), stored in
// localStorage so the INSTALLED app remembers the user across restarts — a child
// in an emergency must not have to re-select a role and re-type a code.
//
// Note for same-machine testing: because this persists per-browser, test the two
// roles in a normal window + an incognito window (or two devices/browsers). On
// two real phones it "just works".
const KEY = 'zhanuya:session'

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}')
  } catch {
    return {}
  }
}

export function useSession() {
  const [session, setSession] = useState(load)

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(session))
  }, [session])

  const update = useCallback((patch) => setSession((s) => ({ ...s, ...patch })), [])
  const reset = useCallback(() => setSession({}), [])

  return [session, update, reset]
}
