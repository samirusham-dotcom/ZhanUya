import { useState } from 'react'
import { joinFamily } from '../lib/realtime'

export default function ChildLink({ name, onJoined, onBack }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  function join() {
    setError('')
    try {
      const { childId } = joinFamily(code.trim(), name)
      onJoined(code.trim(), childId)
    } catch (e) {
      setError(e.message)
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

      <button className="btn-primary" onClick={join} disabled={code.length !== 6}>
        Связаться с семьёй
      </button>
      <button className="link-back" onClick={onBack}>
        ← Назад
      </button>
    </div>
  )
}
