import { useState } from 'react'
import { createFamily } from '../lib/realtime'

export default function ParentSetup({ name, onCreated, onBack }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function create() {
    setBusy(true)
    setError('')
    try {
      const family = await createFamily(name)
      onCreated(family.code)
    } catch {
      setError('Не удалось создать семью. Проверь интернет и попробуй снова.')
      setBusy(false)
    }
  }

  return (
    <div className="screen">
      <div className="screen__hero">
        <div className="screen__brand">👩‍👦 Семья</div>
        <p className="screen__sub">
          Создайте семью и передайте ребёнку «Родительский код». Аккаунты свяжутся мгновенно — без сложных настроек.
        </p>
      </div>

      <button className="btn-primary" onClick={create} disabled={busy}>
        {busy ? 'Создаём…' : 'Создать семью'}
      </button>
      {error && <div className="field-error">{error}</div>}
      <button className="link-back" onClick={onBack}>← Назад</button>
    </div>
  )
}
