import { createFamily } from '../lib/realtime'

export default function ParentSetup({ name, onCreated, onBack }) {
  function create() {
    const family = createFamily(name)
    onCreated(family.code)
  }

  return (
    <div className="screen">
      <div className="screen__hero">
        <div className="screen__brand">👩‍👦 Семья</div>
        <p className="screen__sub">
          Создайте семью и передайте ребёнку «Родительский код». Аккаунты свяжутся мгновенно — без сложных настроек.
        </p>
      </div>

      <button className="btn-primary" onClick={create}>
        Создать семью
      </button>
      <button className="link-back" onClick={onBack}>
        ← Назад
      </button>
    </div>
  )
}
