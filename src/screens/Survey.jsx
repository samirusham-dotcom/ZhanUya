import { useState } from 'react'
import { submitSurvey } from '../lib/survey'

function Rating({ value, onChange }) {
  return (
    <div className="rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={`rating__dot${value >= n ? ' rating__dot--on' : ''}`}
          onClick={() => onChange(n)}
        >
          {n}
        </button>
      ))}
    </div>
  )
}

export default function Survey() {
  const [role, setRole] = useState(null)
  const [clarity, setClarity] = useState(0)
  const [sosWorked, setSosWorked] = useState(null)
  const [wouldUse, setWouldUse] = useState(0)
  const [improve, setImprove] = useState('')
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  const valid = role && clarity && sosWorked !== null && wouldUse

  async function submit() {
    setBusy(true)
    try {
      await submitSurvey({ role, clarity, sosWorked, wouldUse, improve: improve.trim() })
      setDone(true)
    } catch {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div className="screen">
        <div className="screen__hero">
          <div className="screen__brand">🙏 Спасибо!</div>
          <p className="screen__sub">Ваш ответ записан. Это помогает сделать ZhanUya безопаснее.</p>
        </div>
        <a className="btn-primary" href={import.meta.env.BASE_URL}>В приложение</a>
      </div>
    )
  }

  return (
    <div className="screen survey">
      <div className="screen__hero">
        <div className="screen__brand">📝 Опрос</div>
        <p className="screen__sub">30 секунд — помогите нам стать лучше</p>
      </div>

      <div className="q">
        <div className="q__label">Ваша роль</div>
        <div className="q__row">
          <button className={`pill${role === 'child' ? ' pill--on' : ''}`} onClick={() => setRole('child')}>🧒 Ребёнок</button>
          <button className={`pill${role === 'parent' ? ' pill--on' : ''}`} onClick={() => setRole('parent')}>👩‍👦 Родитель</button>
        </div>
      </div>

      <div className="q">
        <div className="q__label">Насколько понятно приложение?</div>
        <Rating value={clarity} onChange={setClarity} />
      </div>

      <div className="q">
        <div className="q__label">Кнопка SOS сработала, как вы ожидали?</div>
        <div className="q__row">
          <button className={`pill${sosWorked === true ? ' pill--on' : ''}`} onClick={() => setSosWorked(true)}>Да</button>
          <button className={`pill${sosWorked === false ? ' pill--on' : ''}`} onClick={() => setSosWorked(false)}>Нет</button>
        </div>
      </div>

      <div className="q">
        <div className="q__label">Пользовались бы по дороге домой?</div>
        <Rating value={wouldUse} onChange={setWouldUse} />
      </div>

      <div className="q">
        <div className="q__label">Что бы вы улучшили? (необязательно)</div>
        <textarea className="field" rows={3} value={improve} onChange={(e) => setImprove(e.target.value)} placeholder="Ваш ответ…" />
      </div>

      <button className="btn-primary" onClick={submit} disabled={!valid || busy}>
        {busy ? 'Отправляем…' : 'Отправить'}
      </button>
      <a className="link-back" href={import.meta.env.BASE_URL}>← В приложение</a>
    </div>
  )
}
