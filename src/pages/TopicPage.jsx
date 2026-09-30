import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Reveal from '../components/Reveal.jsx'
import DataTable from '../components/DataTable.jsx'
import LazyMap from '../components/LazyMap.jsx'
import { coursesById, neighbours, SOURCES, tasksFor, topicsById } from '../data/course.js'
import { loadProgress } from '../progress.js'
import NotFound from './NotFound.jsx'

export default function TopicPage({ id }) {
  const topic = topicsById[id]
  if (!topic) return <NotFound text="Такой темы пока нет в курсе." />
  return <TopicContent topic={topic} />
}

// Карта подгружается, только когда до неё доскроллили
function MapWhenVisible({ map }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { rootMargin: '400px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return <div ref={ref}>{visible ? <LazyMap map={map} /> : <div className="mapview__skeleton">Карта</div>}</div>
}

function TopicContent({ topic }) {
  const course = coursesById[topic.course]
  const chapter = course.chapters.find((c) => c.n === topic.chapter)
  const [params] = useSearchParams()
  const { prev, next } = neighbours(topic.id)
  const [result] = useState(() => loadProgress()['topic:' + topic.id])
  const examCount = tasksFor({ topic: topic.id }).length

  useEffect(() => {
    document.title = `${topic.title} — История за 5 минут`
    return () => {
      document.title = 'История за 5 минут'
    }
  }, [topic.title])

  // Переход из теста к нужному разделу: ?s=<раздел>
  useEffect(() => {
    const target = params.get('s') ?? params.get('tab')
    if (!target) return
    const t = setTimeout(() => {
      const el = document.getElementById('sec-' + target)
      if (!el) return
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      el.classList.add('section--flash')
      setTimeout(() => el.classList.remove('section--flash'), 2600)
    }, 300)
    return () => clearTimeout(t)
  }, [params])

  const jump = [
    { id: 'text', label: 'Конспект' },
    topic.map && { id: 'map', label: 'Карта' },
    topic.table && { id: 'table', label: 'Таблица' },
    { id: 'terms', label: 'Термины и даты' },
    { id: 'people', label: 'Личности' },
  ].filter(Boolean)

  return (
    <article className="container container--narrow simple-page topic-min">
      <header className="simple-head">
        <Link to={`/learn/${course.id}`} className="back-crumb">
          {course.grade} · {course.title}
        </Link>
        <p className="eyebrow">
          Глава {chapter?.n}. {chapter?.title}
          {topic.paragraphs && ` · ${topic.paragraphs}`}
        </p>
        <h1>{topic.title}</h1>
        <p className="lead-muted">{topic.period}</p>
        <p className="topic-min__summary">{topic.summary}</p>
        <div className="row-actions">
          <Link to={`/topic/${topic.id}/quiz`} className="btn btn--primary">
            {result ? `Тест · лучший ${result.best}/${result.total}` : 'Пройти тест'}
          </Link>
          {examCount > 0 && (
            <Link to={`/exam/practice?topic=${topic.id}`} className="text-link">
              Задания ЕГЭ/ОГЭ <ChevronRight size={18} />
            </Link>
          )}
        </div>
        <nav className="jump-links" aria-label="На странице">
          {jump.map((j) => (
            <a
              key={j.id}
              href={`#sec-${j.id}`}
              onClick={(e) => {
                e.preventDefault()
                document.getElementById('sec-' + j.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
            >
              {j.label}
            </a>
          ))}
        </nav>
      </header>

      <section id="sec-text" className="tsection">
        <p className="lead">{topic.intro}</p>
      </section>

      {topic.sections.map((s) => (
        <Reveal as="section" key={s.id} className="tsection" id={`sec-${s.id}`}>
          <h2>{s.title}</h2>
          {s.paragraphs?.map((p, j) => (
            <p key={j}>{p}</p>
          ))}
          {s.list?.length > 0 && (
            <ul className="dot-list">
              {s.list.map((item, j) => (
                <li key={j}>{item}</li>
              ))}
            </ul>
          )}
        </Reveal>
      ))}

      {topic.map && (
        <section className="tsection" id="sec-map">
          <h2>{topic.map.title}</h2>
          <MapWhenVisible map={topic.map} />
        </section>
      )}

      {topic.table && (
        <section className="tsection" id="sec-table">
          <h2>{topic.table.title || 'Таблица'}</h2>
          <DataTable table={{ ...topic.table, title: null }} />
        </section>
      )}

      <section className="tsection" id="sec-terms">
        <h2>Термины</h2>
        <dl className="defs">
          {topic.terms.map((t) => (
            <div key={t.term}>
              <dt>{t.term}</dt>
              <dd>{t.definition}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="tsection" id="sec-dates">
        <h2>Даты</h2>
        <dl className="defs defs--dates">
          {topic.dates.map((d, i) => (
            <div key={i}>
              <dt>{d.date}</dt>
              <dd>{d.text}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="tsection" id="sec-people">
        <h2>Личности</h2>
        <dl className="defs">
          {topic.people.map((p) => (
            <div key={p.name}>
              <dt>
                {p.name}
                {p.years && <span className="defs__years"> {p.years}</span>}
              </dt>
              <dd>{p.role}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="tsection" id="sec-facts">
        <h2>Интересные факты</h2>
        <ul className="dot-list">
          {topic.facts.map((f, i) => (
            <li key={i}>{f}</li>
          ))}
        </ul>
      </section>

      <section className="tsection" id="sec-significance">
        <h2>Итоги и значение</h2>
        <p>{topic.significance}</p>
      </section>

      <section className="cta-min">
        <h2>Проверь себя</h2>
        <p className="lead-muted">
          {topic.quiz.length} вопросов. После каждого ответа — объяснение, а по ошибкам подскажем, что повторить.
        </p>
        <Link to={`/topic/${topic.id}/quiz`} className="btn btn--primary">
          Пройти тест
        </Link>
      </section>

      <p className="source-line">
        Материал составлен по учебнику: {SOURCES[course.source]?.short}
        {topic.paragraphs ? `, ${topic.paragraphs}` : ''}. Текст — краткий пересказ для повторения.{' '}
        <Link to="/sources">Источники</Link>
      </p>

      <nav className="pager-min" aria-label="Соседние темы">
        {prev ? (
          <Link to={`/topic/${prev.id}`}>
            <ChevronLeft size={18} /> {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link to={`/topic/${next.id}`} className="pager-min__next">
            {next.title} <ChevronRight size={18} />
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </article>
  )
}
