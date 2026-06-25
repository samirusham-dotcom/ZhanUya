import { useState } from 'react'
import { joinFamily } from '../lib/realtime'
import { logEvent } from '../lib/metrics'

// Remember this browser's child identity per family code, so reopening/rejoining
// the same family reuses the same child instead of creating a ghost duplicate.
const childKey = (code) => `zhanuya:child:${code}`

export default function ChildLink({ name, onJoined, onBack }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function join() {
    setError('')
    setBusy(true)
    const c = code.trim()
    try {
      const existing = localStorage.getItem(childKey(c)) || undefined
      const { childId } = await joinFamily(c, name, existing)
      localStorage.setItem(childKey(c), childId)
      if (!existing) logEvent('child_linked')
      onJoined(c, childId)
    } catch (e) {
      setError(e.message || 'Не удалось подключиться')
      setBusy(false)
    }
  }

  return (
    <div className="screen">
      <div className="screen__hero">
        <div className="screen__brand">🧒 Привязка</div>
        <p className="screen__sub">Введи «Родительский код», который дали родители.</p>
      </div>

      <input
        className="field field--code"
        placeholder="000000"
        inputMode="numeric"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
      />
      {error && <div className="field-error">{error}</div>}

      <button className="btn-primary" onClick={join} disabled={code.length !== 6 || busy}>
        {busy ? 'Связываем…' : 'Связаться с семьёй'}
      </button>
      <button className="link-back" onClick={onBack}>← Назад</button>
    </div>
  )
}
