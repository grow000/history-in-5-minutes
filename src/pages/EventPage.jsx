import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Reveal from '../components/Reveal.jsx'
import { events, eventsById, ERAS, CATEGORIES } from '../data/index.js'
import { loadProgress } from '../progress.js'
import NotFound from './NotFound.jsx'

export default function EventPage({ id }) {
  const event = eventsById[id]
  if (!event) return <NotFound text="Такого события пока нет в нашей коллекции." />
  return <EventContent event={event} />
}

function EventContent({ event }) {
  const era = ERAS[event.era]
  const [params] = useSearchParams()
  const [result] = useState(() => loadProgress()[event.id])
  const index = events.findIndex((e) => e.id === event.id)
  const prev = events[index - 1]
  const next = events[index + 1]

  useEffect(() => {
    document.title = `${event.title} — История за 5 минут`
    return () => {
      document.title = 'История за 5 минут'
    }
  }, [event.title])

  // Переход из викторины к конкретному разделу: ?s=causes
  useEffect(() => {
    const target = params.get('s')
    if (!target) return
    const t = setTimeout(() => {
      const el = document.getElementById(target)
      if (!el) return
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      el.classList.add('section--flash')
      setTimeout(() => el.classList.remove('section--flash'), 2600)
    }, 300)
    return () => clearTimeout(t)
  }, [params])

  return (
    <article className="container container--narrow simple-page topic-min">
      <header className="simple-head">
        <Link to={`/events?era=${era.id}`} className="back-crumb">
          {era.title}
        </Link>
        <p className="eyebrow">
          {event.date} · {event.region} · {CATEGORIES[event.category] ?? 'История'}
        </p>
        <h1>{event.title}</h1>
        <p className="topic-min__summary">{event.summary}</p>
        <div className="row-actions">
          <Link to={`/event/${event.id}/quiz`} className="btn btn--primary">
            {result ? `Викторина · лучший ${result.best}/${result.total}` : 'Пройти викторину'}
          </Link>
        </div>
      </header>

      <section id="what" className="tsection">
        <h2>Что произошло</h2>
        <p>{event.whatHappened}</p>
      </section>

      <Reveal as="section" id="causes" className="tsection">
        <h2>Причины</h2>
        <ul className="dot-list">
          {event.causes.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      </Reveal>

      <Reveal as="section" id="course" className="tsection">
        <h2>Ход событий</h2>
        {event.course.map((step, i) => (
          <p key={i}>{step}</p>
        ))}
      </Reveal>

      <Reveal as="section" id="people" className="tsection">
        <h2>Ключевые личности</h2>
        <dl className="defs">
          {event.people.map((p) => (
            <div key={p.name}>
              <dt>{p.name}</dt>
              <dd>{p.role}</dd>
            </div>
          ))}
        </dl>
      </Reveal>

      <Reveal as="section" id="timeline" className="tsection">
        <h2>Хронология</h2>
        <dl className="defs defs--dates">
          {event.timeline.map((t, i) => (
            <div key={i}>
              <dt>{t.date}</dt>
              <dd>{t.text}</dd>
            </div>
          ))}
        </dl>
      </Reveal>

      <Reveal as="section" id="facts" className="tsection">
        <h2>Важные факты</h2>
        <ul className="dot-list">
          {event.facts.map((f, i) => (
            <li key={i}>{f}</li>
          ))}
        </ul>
      </Reveal>

      <Reveal as="section" id="meaning" className="tsection">
        <h2>Значение</h2>
        <p>{event.significance}</p>
      </Reveal>

      <section className="cta-min">
        <h2>Проверь себя</h2>
        <p className="lead-muted">5 вопросов с объяснениями.</p>
        <Link to={`/event/${event.id}/quiz`} className="btn btn--primary">
          Пройти викторину
        </Link>
      </section>

      <nav className="pager-min" aria-label="Соседние события">
        {prev ? (
          <Link to={`/event/${prev.id}`}>
            <ChevronLeft size={18} /> {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link to={`/event/${next.id}`} className="pager-min__next">
            {next.title} <ChevronRight size={18} />
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </article>
  )
}
