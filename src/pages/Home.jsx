import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight, Search, X } from 'lucide-react'
import Reveal from '../components/Reveal.jsx'
import { searchTopics, topics } from '../data/course.js'
import { events, filterEvents } from '../data/index.js'
import { loadHistory } from '../progress.js'

export default function Home() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [last] = useState(() => loadHistory().find((h) => h.to))
  const inputRef = useRef(null)

  // поиск по всем текстам тяжёлый — считаем его с небольшой задержкой, чтобы ввод не тормозил
  const dq = useDeferredValue(q)
  const foundTopics = useMemo(() => (dq.trim() ? searchTopics(dq).slice(0, 6) : []), [dq])
  const foundEvents = useMemo(() => (dq.trim() ? filterEvents({ q: dq }).slice(0, 3) : []), [dq])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '/' && !['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const tiles = [
    { to: '/learn', title: 'Курс истории', text: `${topics.length} тем по учебникам Мединского и Торкунова, 6–11 классы.` },
    { to: '/exam', title: 'ЕГЭ и ОГЭ', text: 'Задания по номерам экзамена, варианты и разбор ошибок.' },
    { to: '/events', title: 'События мира', text: `${events.length} ключевых событий мировой истории.` },
  ]

  return (
    <div className="home-min">
      <section className="hero-min">
        <h1 className="hero-min__title">
          История.
          <br />
          Коротко и понятно.
        </h1>
        <p className="hero-min__lead">Курс истории России, подготовка к экзаменам и тесты — в одном месте.</p>
        <div className="hero-min__links">
          <Link to="/learn" className="btn btn--primary">
            Начать учиться
          </Link>
          <Link to="/exam" className="text-link">
            Подготовка к ЕГЭ и ОГЭ <ChevronRight size={18} />
          </Link>
        </div>

        <div className="search search--home">
          <Search className="search__icon" size={20} aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            className="search__input"
            placeholder="Поиск: Пётр I, Смута, 1812…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Поиск по темам и событиям"
            autoComplete="off"
          />
          {q && (
            <button type="button" className="search__clear" onClick={() => setQ('')} aria-label="Очистить поиск">
              <X size={16} />
            </button>
          )}
          {q.trim() && (
            <div className="search-drop">
              {foundTopics.length + foundEvents.length === 0 && <div className="search-drop__empty">Ничего не найдено</div>}
              {foundTopics.map((t) => (
                <button key={t.id} type="button" className="search-drop__item" onClick={() => navigate(`/topic/${t.id}`)}>
                  <span>{t.title}</span>
                  <small>{t.period}</small>
                </button>
              ))}
              {foundEvents.map((e) => (
                <button key={e.id} type="button" className="search-drop__item" onClick={() => navigate(`/event/${e.id}`)}>
                  <span>{e.title}</span>
                  <small>{e.date}</small>
                </button>
              ))}
            </div>
          )}
        </div>

        {last && (
          <Link to={last.to} className="continue-line">
            Продолжить: <b>{last.title}</b> <ChevronRight size={16} />
          </Link>
        )}
      </section>

      <div className="container tiles-min">
        {tiles.map((t, i) => (
          <Reveal key={t.to} delay={i * 0.06}>
            <Link to={t.to} className="tile-min">
              <h2>{t.title}</h2>
              <p>{t.text}</p>
              <span className="text-link">
                Открыть <ChevronRight size={18} />
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  )
}
