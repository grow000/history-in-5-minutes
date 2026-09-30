import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Search, X } from 'lucide-react'
import { COURSES, coursesById, searchTopics, topicsOfCourse } from '../data/course.js'
import { plural } from '../data/index.js'
import { loadProgress } from '../progress.js'

export default function Learn() {
  const [q, setQ] = useState('')
  const [progress] = useState(loadProgress)
  const dq = useDeferredValue(q)
  const found = useMemo(() => searchTopics(dq), [dq])

  useEffect(() => {
    document.title = 'Курс истории — История за 5 минут'
    return () => {
      document.title = 'История за 5 минут'
    }
  }, [])

  return (
    <div className="container container--narrow simple-page">
      <header className="simple-head">
        <h1>Курс истории</h1>
        <p className="lead-muted">Все темы учебников «История России» В. Р. Мединского и А. В. Торкунова, 6–11 классы.</p>
        <div className="search">
          <Search className="search__icon" size={20} aria-hidden="true" />
          <input
            type="search"
            className="search__input"
            placeholder="Найти тему"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Поиск по темам курса"
            autoComplete="off"
          />
          {q && (
            <button type="button" className="search__clear" onClick={() => setQ('')} aria-label="Очистить поиск">
              <X size={16} />
            </button>
          )}
        </div>
      </header>

      {q.trim() ? (
        <section aria-live="polite" className="simple-section">
          <p className="lead-muted small">{found.length ? `Найдено: ${found.length}` : 'Ничего не найдено'}</p>
          <ul className="plain-list">
            {found.map((t) => (
              <TopicRow key={t.id} topic={t} done={progress['topic:' + t.id]} showCourse />
            ))}
          </ul>
        </section>
      ) : (
        <ul className="course-list">
          {COURSES.map((c) => {
            const list = topicsOfCourse(c.id)
            const done = list.filter((t) => progress['topic:' + t.id]).length
            return (
              <li key={c.id}>
                <Link to={`/learn/${c.id}`} className="course-line">
                  <span className="course-line__grade">{c.grade}</span>
                  <span className="course-line__main">
                    <span className="course-line__title">{c.title}</span>
                    <span className="course-line__meta">
                      {c.period} · {list.length} {plural(list.length, ['тема', 'темы', 'тем'])}
                      {done > 0 && ` · пройдено ${done}`}
                    </span>
                  </span>
                  <ChevronRight className="course-line__arrow" size={20} aria-hidden="true" />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export function TopicRow({ topic, done, showCourse, index }) {
  return (
    <li>
      <Link to={`/topic/${topic.id}`} className="plain-row">
        <span>
          {index != null && <span className="plain-row__num">{index}</span>}
          {topic.title}
          <small className="plain-row__sub">
            {topic.period}
            {showCourse && ` · ${coursesById[topic.course]?.short ?? ''}`}
          </small>
        </span>
        <span className="plain-row__meta">{done ? `${done.best}/${done.total}` : <ChevronRight size={18} />}</span>
      </Link>
    </li>
  )
}
