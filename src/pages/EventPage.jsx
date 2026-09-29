import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { events, eventsById, ERAS, CATEGORIES } from '../data/index.js'
import { loadProgress } from '../progress.js'
import NotFound from './NotFound.jsx'

const SECTIONS = [
  { id: 'what', title: 'Что произошло', icon: '📖' },
  { id: 'causes', title: 'Причины', icon: '🧩' },
  { id: 'course', title: 'Ход событий', icon: '🧭' },
  { id: 'people', title: 'Ключевые личности', icon: '👤' },
  { id: 'timeline', title: 'Хронология', icon: '🗓️' },
  { id: 'facts', title: 'Важные факты', icon: '💡' },
  { id: 'meaning', title: 'Значение', icon: '⭐' },
]

function initials(name) {
  return name
    .replace(/[«»"()]/g, '')
    .split(/\s+/)
    .filter((w) => /^[A-ZА-ЯЁ]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
}

function useReadingProgress() {
  const [value, setValue] = useState(0)
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      setValue(max > 0 ? Math.min(1, window.scrollY / max) : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])
  return value
}

function useActiveSection() {
  const [active, setActive] = useState(SECTIONS[0].id)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-20% 0px -65% 0px' }
    )
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])
  return active
}

export default function EventPage({ id }) {
  const event = eventsById[id]
  if (!event) return <NotFound text="Такого события пока нет в нашей коллекции." />
  return <EventContent event={event} />
}

function EventContent({ event }) {
  const era = ERAS[event.era]
  const progress = useReadingProgress()
  const active = useActiveSection()
  const tocTrack = useRef(null)
  const [result] = useState(() => loadProgress()[event.id])

  const index = events.findIndex((e) => e.id === event.id)
  const prev = events[index - 1]
  const next = events[index + 1]

  // Держим активный пункт мобильного меню в зоне видимости
  useEffect(() => {
    const track = tocTrack.current
    const item = track?.querySelector('.is-active')
    if (!track || !item) return
    track.scrollTo({ left: item.offsetLeft - track.clientWidth / 2 + item.clientWidth / 2, behavior: 'smooth' })
  }, [active])

  useEffect(() => {
    document.title = `${event.title} — История за 5 минут`
    return () => {
      document.title = 'История за 5 минут'
    }
  }, [event.title])

  const scrollTo = (sectionId) => (e) => {
    e.preventDefault()
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <article className="event" style={{ '--era': era.color }}>
      <div className="read-progress" style={{ transform: `scaleX(${progress})` }} aria-hidden="true" />

      <header className="event-hero">
        <div className="event-hero__glow" aria-hidden="true" />
        <div className="container event-hero__inner">
          <nav className="breadcrumbs" aria-label="Навигационная цепочка">
            <Link to="/">События</Link>
            <span aria-hidden="true">/</span>
            <Link to={`/?era=${era.id}`}>{era.title}</Link>
          </nav>
          <div className="event-hero__emoji" aria-hidden="true">
            {event.emoji}
          </div>
          <h1 className="event-hero__title">{event.title}</h1>
          <div className="event-hero__meta">
            <span className="meta-item">🗓️ {event.date}</span>
            <span className="meta-item">📍 {event.region}</span>
            <span className="meta-item">🏷️ {CATEGORIES[event.category] ?? 'История'}</span>
            <span className="meta-item">⏱️ {event.readTime} мин чтения</span>
          </div>
          <p className="event-hero__summary">{event.summary}</p>
          <div className="event-hero__actions">
            <a href="#what" className="btn btn--light" onClick={scrollTo('what')}>
              Начать читать
            </a>
            <Link to={`/event/${event.id}/quiz`} className="btn btn--outline-light">
              {result ? `Викторина · лучший ${result.best}/${result.total}` : 'Сразу к викторине'}
            </Link>
          </div>
        </div>
      </header>

      <nav className="toc-mobile" aria-label="Разделы">
        <div className="toc-mobile__track" ref={tocTrack}>
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              onClick={scrollTo(s.id)}
              className={'toc-mobile__item' + (active === s.id ? ' is-active' : '')}
            >
              {s.title}
            </a>
          ))}
        </div>
      </nav>

      <div className="container event-layout">
        <aside className="toc" aria-label="Содержание">
          <div className="toc__title">Содержание</div>
          <ol className="toc__list">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} onClick={scrollTo(s.id)} className={active === s.id ? 'is-active' : ''}>
                  <span aria-hidden="true">{s.icon}</span> {s.title}
                </a>
              </li>
            ))}
          </ol>
          <Link to={`/event/${event.id}/quiz`} className="btn btn--primary btn--block">
            Пройти викторину
          </Link>
        </aside>

        <div className="event-content">
          <Section id="what">
            <p className="lead">{event.whatHappened}</p>
          </Section>

          <Section id="causes">
            <ul className="causes">
              {event.causes.map((c, i) => (
                <li key={i} className="reveal" style={{ '--i': i }}>
                  <span className="causes__num">{i + 1}</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section id="course">
            <ol className="steps">
              {event.course.map((step, i) => (
                <li key={i} className="steps__item">
                  <span className="steps__label">Этап {i + 1}</span>
                  <p>{step}</p>
                </li>
              ))}
            </ol>
          </Section>

          <Section id="people">
            <div className="people">
              {event.people.map((p) => (
                <div key={p.name} className="person">
                  <div className="person__avatar" aria-hidden="true">
                    {initials(p.name) || '•'}
                  </div>
                  <div>
                    <div className="person__name">{p.name}</div>
                    <div className="person__role">{p.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section id="timeline">
            <ol className="timeline">
              {event.timeline.map((t, i) => (
                <li key={i} className="timeline__item">
                  <span className="timeline__dot" aria-hidden="true" />
                  <div className="timeline__date">{t.date}</div>
                  <div className="timeline__text">{t.text}</div>
                </li>
              ))}
            </ol>
          </Section>

          <Section id="facts">
            <div className="facts">
              {event.facts.map((f, i) => (
                <div key={i} className="fact">
                  <span className="fact__num">{String(i + 1).padStart(2, '0')}</span>
                  <p>{f}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="meaning">
            <div className="meaning">
              <p>{event.significance}</p>
            </div>
          </Section>

          <div className="quiz-cta">
            <div className="quiz-cta__icon" aria-hidden="true">🎯</div>
            <div className="quiz-cta__text">
              <h2>Проверь себя</h2>
              <p>5 вопросов по материалу — займёт около минуты.</p>
            </div>
            <Link to={`/event/${event.id}/quiz`} className="btn btn--primary btn--lg">
              Начать викторину
            </Link>
          </div>

          <nav className="pager" aria-label="Соседние события">
            {prev ? (
              <Link to={`/event/${prev.id}`} className="pager__link">
                <small>← Раньше</small>
                <span>{prev.title}</span>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link to={`/event/${next.id}`} className="pager__link pager__link--next">
                <small>Позже →</small>
                <span>{next.title}</span>
              </Link>
            ) : (
              <span />
            )}
          </nav>
        </div>
      </div>
    </article>
  )
}

function Section({ id, children }) {
  const meta = SECTIONS.find((s) => s.id === id)
  return (
    <section id={id} className="section" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="section__title">
        <span className="section__icon" aria-hidden="true">
          {meta.icon}
        </span>
        {meta.title}
      </h2>
      {children}
    </section>
  )
}
