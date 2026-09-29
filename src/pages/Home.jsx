import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import EventCard from '../components/EventCard.jsx'
import { events, ERAS, ERA_LIST, CATEGORIES, filterEvents, plural } from '../data/index.js'
import { loadProgress } from '../progress.js'

export default function Home() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const searchRef = useRef(null)
  const [progress] = useState(loadProgress)

  const q = params.get('q') ?? ''
  const era = ERAS[params.get('era')] ? params.get('era') : 'all'
  const cat = CATEGORIES[params.get('cat')] ? params.get('cat') : 'all'
  const sort = params.get('sort') === 'desc' ? 'desc' : 'asc'

  // Локальное значение поля, чтобы ввод не «прыгал» при обновлении URL
  const [query, setQuery] = useState(q)
  useEffect(() => setQuery(q), [q])

  const update = (patch) => {
    const next = new URLSearchParams(params)
    Object.entries(patch).forEach(([key, value]) => {
      if (!value || value === 'all' || (key === 'sort' && value === 'asc')) next.delete(key)
      else next.set(key, value)
    })
    setParams(next, { replace: true })
  }

  const onQueryChange = (value) => {
    setQuery(value)
    update({ q: value })
  }

  // «/» — быстрый фокус на поиск
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'SELECT') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const results = useMemo(() => filterEvents({ q, era, cat, sort }), [q, era, cat, sort])

  // Счётчики по эпохам учитывают текущий поиск и категорию
  const eraCounts = useMemo(() => {
    const base = filterEvents({ q, cat })
    const counts = { all: base.length }
    base.forEach((ev) => (counts[ev.era] = (counts[ev.era] || 0) + 1))
    return counts
  }, [q, cat])

  const doneCount = events.filter((ev) => progress[ev.id]).length
  const hasFilters = q || era !== 'all' || cat !== 'all' || sort !== 'asc'

  const randomEvent = () => {
    const pool = results.length ? results : events
    const ev = pool[Math.floor(Math.random() * pool.length)]
    navigate(`/event/${ev.id}`)
  }

  return (
    <>
      <section className="hero">
        <div className="hero__bg" aria-hidden="true">
          <span className="blob blob--1" />
          <span className="blob blob--2" />
          <span className="blob blob--3" />
        </div>
        <div className="container hero__inner">
          <span className="pill hero__pill">📚 Учись быстро · проверяй себя</span>
          <h1 className="hero__title">
            История <span className="gradient-text">за 5 минут</span>
          </h1>
          <p className="hero__lead">
            Выбери событие, прочитай короткий и понятный конспект: причины, ход, участники и значение. А потом проверь
            себя в викторине из 5 вопросов.
          </p>

          <div className="search">
            <svg className="search__icon" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2.2" />
              <path d="M20 20l-4-4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
            <input
              ref={searchRef}
              type="search"
              className="search__input"
              placeholder="Поиск: событие, год, личность…"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              aria-label="Поиск по событиям"
              autoComplete="off"
            />
            {query ? (
              <button type="button" className="search__clear" onClick={() => onQueryChange('')} aria-label="Очистить поиск">
                ✕
              </button>
            ) : (
              <kbd className="search__kbd" aria-hidden="true">/</kbd>
            )}
          </div>

          <div className="hero__stats">
            <div className="stat">
              <b>{events.length}</b>
              <span>{plural(events.length, ['событие', 'события', 'событий'])}</span>
            </div>
            <div className="stat">
              <b>{ERA_LIST.length}</b>
              <span>эпох</span>
            </div>
            <div className="stat">
              <b>{events.length * 5}</b>
              <span>вопросов</span>
            </div>
            <div className="stat">
              <b>{doneCount}</b>
              <span>пройдено тобой</span>
            </div>
          </div>
        </div>
      </section>

      <section className="container catalog" aria-labelledby="catalog-title">
        <h2 id="catalog-title" className="visually-hidden">
          Каталог событий
        </h2>

        <div className="eras" role="group" aria-label="Фильтр по эпохам">
          <button
            type="button"
            className={'era-chip' + (era === 'all' ? ' is-active' : '')}
            onClick={() => update({ era: 'all' })}
            aria-pressed={era === 'all'}
          >
            <span className="era-chip__emoji" aria-hidden="true">🌍</span>
            <span className="era-chip__text">
              <b>Все эпохи</b>
              <small>{eraCounts.all ?? 0} {plural(eraCounts.all ?? 0, ['событие', 'события', 'событий'])}</small>
            </span>
          </button>
          {ERA_LIST.map((e) => (
            <button
              key={e.id}
              type="button"
              className={'era-chip' + (era === e.id ? ' is-active' : '')}
              style={{ '--era': e.color }}
              onClick={() => update({ era: era === e.id ? 'all' : e.id })}
              aria-pressed={era === e.id}
            >
              <span className="era-chip__emoji" aria-hidden="true">{e.emoji}</span>
              <span className="era-chip__text">
                <b>{e.title}</b>
                <small>
                  {e.range} · {eraCounts[e.id] ?? 0}
                </small>
              </span>
            </button>
          ))}
        </div>

        <div className="toolbar">
          <label className="select">
            <span className="visually-hidden">Тема</span>
            <select value={cat} onChange={(e) => update({ cat: e.target.value })}>
              <option value="all">Все темы</option>
              {Object.entries(CATEGORIES).map(([id, title]) => (
                <option key={id} value={id}>
                  {title}
                </option>
              ))}
            </select>
          </label>
          <label className="select">
            <span className="visually-hidden">Сортировка</span>
            <select value={sort} onChange={(e) => update({ sort: e.target.value })} disabled={Boolean(q)}>
              <option value="asc">Сначала древние</option>
              <option value="desc">Сначала новые</option>
            </select>
          </label>
          <div className="toolbar__spacer" />
          {hasFilters && (
            <button type="button" className="btn btn--ghost" onClick={() => { setQuery(''); setParams({}, { replace: true }) }}>
              Сбросить
            </button>
          )}
          <button type="button" className="btn btn--soft" onClick={randomEvent}>
            🎲 Случайное
          </button>
        </div>

        <p className="results-count" aria-live="polite">
          {results.length
            ? `Найдено ${results.length} ${plural(results.length, ['событие', 'события', 'событий'])}`
            : 'Ничего не найдено'}
        </p>

        {results.length ? (
          <div className="grid">
            {results.map((ev, i) => (
              <EventCard key={ev.id} event={ev} index={i} result={progress[ev.id]} />
            ))}
          </div>
        ) : (
          <div className="empty">
            <div className="empty__emoji" aria-hidden="true">🔎</div>
            <h3>По запросу ничего не нашлось</h3>
            <p>Попробуй другое слово, год или имя — или сбрось фильтры.</p>
            <button type="button" className="btn btn--primary" onClick={() => { setQuery(''); setParams({}, { replace: true }) }}>
              Показать все события
            </button>
          </div>
        )}
      </section>
    </>
  )
}
