import { useInstallPrompt } from '../hooks/useInstallPrompt'

const ICON = `${import.meta.env.BASE_URL}icon.svg`

export default function Onboarding({ onDone }) {
  const { canInstall, promptInstall } = useInstallPrompt()

  return (
    <div className="screen">
      <div className="screen__hero">
        <img className="onb-logo" src={ICON} alt="ZhanUya" width="84" height="84" />
        <div className="screen__brand">ZhanUya</div>
        <p className="screen__sub">Спокойствие родителей, безопасность детей</p>
      </div>

      <div className="onb-list">
        <div className="onb-item">
          <span className="onb-item__emoji">🆘</span>
          <div>
            <b>Одна кнопка SOS</b>
            <p>Маршрут до ближайшей безопасной зоны и мгновенный сигнал родителю.</p>
          </div>
        </div>
        <div className="onb-item">
          <span className="onb-item__emoji">👩‍👦</span>
          <div>
            <b>Родитель всегда рядом</b>
            <p>Видит геопозицию ребёнка и моментально получает тревогу.</p>
          </div>
        </div>
        <div className="onb-item">
          <span className="onb-item__emoji">💬</span>
          <div>
            <b>Без лишних слов</b>
            <p>Статусы в один тап: «в автобусе», «я дома».</p>
          </div>
        </div>
      </div>

      <button className="btn-primary" onClick={onDone}>Начать</button>
      {canInstall && (
        <button className="link-back" onClick={promptInstall}>⤓ Установить приложение</button>
      )}
      <div className="onb-admin-links">
        <a href={`${import.meta.env.BASE_URL}#metrics`}>📊 Статистика</a>
        <a href={`${import.meta.env.BASE_URL}#zones`}>🗺 Зоны</a>
      </div>
    </div>
  )
}
