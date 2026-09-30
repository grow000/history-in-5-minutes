import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ChevronRight, Search, X } from 'lucide-react'
import { ERA_LIST, ERAS, filterEvents, plural } from '../data/index.js'
import { loadProgress } from '../progress.js'

export default function Events() {
  const [params, setParams] = useSearchParams()
  const [progress] = useState(loadProgress)
  const era = ERAS[params.get('era')] ? params.get('era') : 'all'
  const [q, setQ] = useState(params.get('q') ?? '')
  const dq = useDeferredValue(q)

  useEffect(() => {
    document.title = 'События мировой истории — История за 5 минут'
    return () => {
      document.title = 'История за 5 минут'
    }
  }, [])

  const setEra = (id) => {
    const next = new URLSearchParams(params)
    if (id === 'all') next.delete('era')
    else next.set('era', id)
    setParams(next, { replace: true })
  }

  const results = useMemo(() => filterEvents({ q: dq, era }), [dq, era])

  return (
    <div className="container container--narrow simple-page">
      <header className="simple-head">
        <h1>События мировой истории</h1>
        <p className="lead-muted">Ключевые события от Древнего мира до XXI века — коротко, с тестом в конце.</p>
        <div className="search">
          <Search className="search__icon" size={20} aria-hidden="true" />
          <input
            type="search"
            className="search__input"
            placeholder="Событие, год или имя"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Поиск по событиям"
            autoComplete="off"
          />
          {q && (
            <button type="button" className="search__clear" onClick={() => setQ('')} aria-label="Очистить поиск">
              <X size={16} />
            </button>
          )}
        </div>
        <nav className="filter-links" aria-label="Эпохи">
          {[{ id: 'all', title: 'Все' }, ...ERA_LIST].map((e) => (
            <button key={e.id} type="button" className={era === e.id ? 'is-active' : ''} onClick={() => setEra(e.id)} aria-pressed={era === e.id}>
              {e.title}
            </button>
          ))}
        </nav>
      </header>

      <p className="lead-muted small" aria-live="polite">
        {results.length ? `${results.length} ${plural(results.length, ['событие', 'события', 'событий'])}` : 'Ничего не найдено'}
      </p>
      <ul className="plain-list">
        {results.map((ev) => {
          const done = progress[ev.id]
          return (
            <li key={ev.id}>
              <Link to={`/event/${ev.id}`} className="plain-row">
                <span>
                  {ev.title}
                  <small className="plain-row__sub">
                    {ev.date} · {ERAS[ev.era]?.title}
                  </small>
                </span>
                <span className="plain-row__meta">{done ? `${done.best}/${done.total}` : <ChevronRight size={18} />}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
