import { useState } from 'react'

export default function RoleSelect({ onPick }) {
  const [name, setName] = useState('')

  return (
    <div className="screen">
      <div className="screen__hero">
        <div className="screen__brand">🛡 ZhanUya</div>
        <p className="screen__sub">Спокойствие родителей, безопасность детей</p>
      </div>

      <input
        className="field"
        placeholder="Как тебя зовут?"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <div className="role-grid">
        <button className="role-card" onClick={() => onPick('child', name)}>
          <div className="role-card__emoji">🧒</div>
          <div className="role-card__title">Я ребёнок</div>
          <div className="role-card__desc">Карта, безопасные зоны и кнопка SOS</div>
        </button>
        <button className="role-card" onClick={() => onPick('parent', name)}>
          <div className="role-card__emoji">👩‍👦</div>
          <div className="role-card__title">Я родитель</div>
          <div className="role-card__desc">Геопозиция ребёнка и мгновенные SOS-уведомления</div>
        </button>
      </div>
    </div>
  )
}
