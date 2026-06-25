import { useState } from 'react'
import { useSession } from './lib/session'
import Onboarding from './screens/Onboarding'
import RoleSelect from './screens/RoleSelect'
import ParentSetup from './screens/ParentSetup'
import ParentDashboard from './screens/ParentDashboard'
import ChildLink from './screens/ChildLink'
import ChildHome from './screens/ChildHome'
import './ZhanUya.css'

const ONBOARDED_KEY = 'zhanuya:onboarded'

export default function App() {
  const [session, update, reset] = useSession()
  const [onboarded, setOnboarded] = useState(() => localStorage.getItem(ONBOARDED_KEY) === '1')

  if (!onboarded) {
    return (
      <Onboarding
        onDone={() => {
          localStorage.setItem(ONBOARDED_KEY, '1')
          setOnboarded(true)
        }}
      />
    )
  }

  if (!session.role) {
    return <RoleSelect onPick={(role, name) => update({ role, name })} />
  }

  if (session.role === 'parent') {
    if (!session.code) {
      return <ParentSetup name={session.name} onCreated={(code) => update({ code })} onBack={reset} />
    }
    return <ParentDashboard session={session} onLeave={reset} />
  }

  // child
  if (!session.code) {
    return <ChildLink name={session.name} onJoined={(code, childId) => update({ code, childId })} onBack={reset} />
  }
  return <ChildHome session={session} onLeave={reset} />
}
