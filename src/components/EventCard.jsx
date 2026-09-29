import { Link } from 'react-router-dom'
import { ERAS, CATEGORIES } from '../data/index.js'

export default function EventCard({ event, index = 0, result }) {
  const era = ERAS[event.era]
  return (
    <Link
      to={`/event/${event.id}`}
      className="card"
      style={{ '--era': era.color, '--i': Math.min(index, 12) }}
    >
      <div className="card__top">
        <span className="card__emoji" aria-hidden="true">
          {event.emoji}
        </span>
        <span className="card__era">{era.title}</span>
        {result && (
          <span
            className={'card__done' + (result.best === result.total ? ' card__done--perfect' : '')}
            title="Лучший результат в викторине"
          >
            ✓ {result.best}/{result.total}
          </span>
        )}
      </div>
      <div className="card__body">
        <div className="card__date">{event.date}</div>
        <h3 className="card__title">{event.title}</h3>
        <p className="card__summary">{event.summary}</p>
      </div>
      <div className="card__footer">
        <span className="tag">{CATEGORIES[event.category] ?? 'История'}</span>
        <span className="card__meta">
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M12 7v5l3 2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          {event.readTime} мин
        </span>
      </div>
    </Link>
  )
}
