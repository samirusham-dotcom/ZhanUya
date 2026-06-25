import { useEffect, useState } from 'react'
import { loadMetrics } from '../lib/metrics'
import { loadSurveyStats } from '../lib/survey'

function fmtAlert(ms) {
  if (ms == null) return '—'
  return ms < 1000 ? `${ms} мс` : `${(ms / 1000).toFixed(1)} с`
}
const fmt1 = (n) => (n == null ? '—' : n.toFixed(1))

export default function Metrics() {
  const [includeDemo, setIncludeDemo] = useState(false)
  const [data, setData] = useState(null)
  const [survey, setSurvey] = useState(null)
  const [loading, setLoading] = useState(true)

  async function refresh(demo) {
    setLoading(true)
    try {
      const [m, s] = await Promise.all([loadMetrics(demo), loadSurveyStats(demo)])
      setData(m)
      setSurvey(s)
    } catch (e) {
      setData({ error: e.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh(includeDemo)
  }, [includeDemo])

  const cards = data && !data.error
    ? [
        { label: 'Семей создано', value: data.families, icon: '👨‍👩‍👧' },
        { label: 'Детей подключено', value: data.childrenLinked, icon: '🧒' },
        { label: 'SOS-сигналов', value: data.sosSent, icon: '🆘' },
        { label: 'Медианное время оповещения', value: fmtAlert(data.medianAlertMs), icon: '⏱' },
        { label: 'Статусов отправлено', value: data.statusesSent, icon: '💬' },
      ]
    : []

  return (
    <div className="screen metrics">
      <div className="screen__hero">
        <div className="screen__brand">📊 Пилот ZhanUya</div>
        <p className="screen__sub">Подтверждённые результаты — обновляются в реальном времени</p>
      </div>

      <label className="metrics-toggle">
        <input type="checkbox" checked={includeDemo} onChange={(e) => setIncludeDemo(e.target.checked)} />
        Показывать демо-данные
      </label>

      {loading && <div className="spinner" />}

      {data?.error && <div className="field-error">Ошибка: {data.error}</div>}

      {data && !data.error && (
        <div className="metrics-grid">
          {cards.map((c) => (
            <div className="metric-card" key={c.label}>
              <div className="metric-card__icon">{c.icon}</div>
              <div className="metric-card__value">{c.value}</div>
              <div className="metric-card__label">{c.label}</div>
            </div>
          ))}
        </div>
      )}

      {survey && (
        <div className="survey-stats">
          <div className="survey-stats__title">📝 Опрос · {survey.count} ответов</div>
          {survey.count > 0 && (
            <div className="survey-stats__row">
              <span>Понятность: <b>{fmt1(survey.avgClarity)}/5</b></span>
              <span>SOS сработал: <b>{survey.pctSosWorked ?? '—'}%</b></span>
              <span>Будут пользоваться: <b>{fmt1(survey.avgWouldUse)}/5</b></span>
            </div>
          )}
          {survey.comments.slice(-3).map((c, i) => (
            <div className="survey-stats__quote" key={i}>«{c.text}»</div>
          ))}
        </div>
      )}

      <button className="btn-primary" onClick={() => refresh(includeDemo)}>Обновить</button>
      <a className="link-back" href={`${import.meta.env.BASE_URL}#survey`}>📝 Открыть опрос</a>
      <a className="link-back" href={`${import.meta.env.BASE_URL}`}>← В приложение</a>
    </div>
  )
}
