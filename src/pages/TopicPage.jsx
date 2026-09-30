import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, ArrowRight, BookOpen, CalendarDays, FileText, GraduationCap, Lightbulb, Map as MapIcon,
  Star, Table, Target, Users,
} from 'lucide-react'
import Tabs, { TabPanel } from '../components/Tabs.jsx'
import Reveal from '../components/Reveal.jsx'
import DataTable from '../components/DataTable.jsx'
import LazyMap from '../components/LazyMap.jsx'
import { coursesById, neighbours, SOURCES, tasksFor, topicsById } from '../data/course.js'
import { loadProgress } from '../progress.js'
import NotFound from './NotFound.jsx'

function initials(name) {
  return name
    .replace(/[«»"()]/g, '')
    .split(/\s+/)
    .filter((w) => /^[A-ZА-ЯЁ]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
}

export default function TopicPage({ id }) {
  const topic = topicsById[id]
  if (!topic) return <NotFound text="Такой темы пока нет в курсе." />
  return <TopicContent topic={topic} />
}

function TopicContent({ topic }) {
  const course = coursesById[topic.course]
  const chapter = course.chapters.find((c) => c.n === topic.chapter)
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const { prev, next } = neighbours(topic.id)
  const [result] = useState(() => loadProgress()['topic:' + topic.id])
  const examTasks = useMemo(() => tasksFor({ topic: topic.id }), [topic.id])
  const contentRef = useRef(null)

  const tabs = [
    { id: 'text', label: 'Конспект', icon: <FileText size={17} /> },
    topic.map && { id: 'map', label: 'Карта', icon: <MapIcon size={17} /> },
    topic.table && { id: 'table', label: 'Таблица', icon: <Table size={17} /> },
    { id: 'terms', label: 'Термины и даты', icon: <CalendarDays size={17} />, badge: topic.terms.length + topic.dates.length },
    { id: 'people', label: 'Личности', icon: <Users size={17} />, badge: topic.people.length },
  ].filter(Boolean)

  const tab = tabs.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'text'
  const setTab = (t) => {
    const p = new URLSearchParams(params)
    if (t === 'text') p.delete('tab')
    else p.set('tab', t)
    p.delete('s')
    setParams(p, { replace: true })
  }

  useEffect(() => {
    document.title = `${topic.title} — История за 5 минут`
    return () => {
      document.title = 'История за 5 минут'
    }
  }, [topic.title])

  // Переход из теста к нужному разделу: ?s=<id раздела>
  useEffect(() => {
    const target = params.get('s')
    if (!target) return
    const t = setTimeout(() => {
      const el = document.getElementById('sec-' + target)
      if (!el) return
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      el.classList.add('section--flash')
      setTimeout(() => el.classList.remove('section--flash'), 2600)
    }, 450)
    return () => clearTimeout(t)
  }, [params, tab])

  return (
    <article className="topic" style={{ '--era': course.color }}>
      <header className="event-hero topic-hero">
        <div className="event-hero__glow" aria-hidden="true" />
        <div className="container event-hero__inner">
          <nav className="breadcrumbs" aria-label="Навигационная цепочка">
            <Link to="/learn">Курс истории</Link>
            <span aria-hidden="true">/</span>
            <Link to={`/learn/${course.id}`}>{course.short}</Link>
          </nav>
          <div className="topic-hero__chapter">
            Глава {chapter?.n}. {chapter?.title}
            {topic.paragraphs && <span> · {topic.paragraphs}</span>}
          </div>
          <h1 className="event-hero__title">{topic.title}</h1>
          <div className="event-hero__meta">
            <span className="meta-item">
              <CalendarDays size={15} /> {topic.period}
            </span>
            <span className="meta-item">
              <BookOpen size={15} /> {topic.sections.length} разделов
            </span>
            {topic.exam?.ege && <span className="meta-item meta-item--exam">ЕГЭ</span>}
            {topic.exam?.oge && <span className="meta-item meta-item--exam">ОГЭ</span>}
          </div>
          <p className="event-hero__summary">{topic.summary}</p>
          <div className="event-hero__actions">
            <Link to={`/topic/${topic.id}/quiz`} className="btn btn--light">
              <Target size={18} /> {result ? `Тест по теме · лучший ${result.best}/${result.total}` : 'Тест по теме'}
            </Link>
            {examTasks.length > 0 && (
              <Link to={`/exam/practice?topic=${topic.id}`} className="btn btn--outline-light">
                <GraduationCap size={18} /> Задания ЕГЭ/ОГЭ · {examTasks.length}
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="topic-tabs-bar">
        <div className="container">
          <Tabs tabs={tabs} value={tab} onChange={setTab} layoutId="topic-tabs" label="Разделы темы" variant="underline" />
        </div>
      </div>

      <div className="container topic-body" ref={contentRef}>
        <>
          <TabPanel id={tab} layoutId="topic-tabs" key={tab}>
            {tab === 'text' && <TextTab topic={topic} />}
            {tab === 'map' && (
              <section className="topic-panel">
                <h2 className="panel-title">
                  <MapIcon size={22} /> {topic.map.title}
                </h2>
                <LazyMap map={topic.map} />
              </section>
            )}
            {tab === 'table' && (
              <section className="topic-panel">
                <h2 className="panel-title">
                  <Table size={22} /> Таблица
                </h2>
                <DataTable table={topic.table} />
              </section>
            )}
            {tab === 'terms' && <TermsTab topic={topic} />}
            {tab === 'people' && <PeopleTab topic={topic} />}
          </TabPanel>
        </>

        <Reveal className="quiz-cta">
          <div className="quiz-cta__icon" aria-hidden="true">
            <Target size={40} />
          </div>
          <div className="quiz-cta__text">
            <h2>Проверь себя</h2>
            <p>
              {topic.quiz.length} вопросов с объяснениями. По ошибкам подскажем, какой раздел повторить.
            </p>
          </div>
          <button type="button" onClick={() => navigate(`/topic/${topic.id}/quiz`)} className="btn btn--primary btn--lg">
            Начать тест
          </button>
        </Reveal>

        <p className="source-note">
          <BookOpen size={15} /> Материал составлен по учебнику: {SOURCES[course.source]?.short}
          {topic.paragraphs ? `, ${topic.paragraphs}` : ''}. Текст — авторский пересказ для повторения.{' '}
          <Link to="/sources">Все источники</Link>
        </p>

        <nav className="pager" aria-label="Соседние темы">
          {prev ? (
            <Link to={`/topic/${prev.id}`} className="pager__link">
              <small>
                <ArrowLeft size={14} /> Предыдущая тема
              </small>
              <span>{prev.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link to={`/topic/${next.id}`} className="pager__link pager__link--next">
              <small>
                Следующая тема <ArrowRight size={14} />
              </small>
              <span>{next.title}</span>
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </div>
    </article>
  )
}

function TextTab({ topic }) {
  return (
    <div className="topic-text">
      <Reveal>
        <p className="lead">{topic.intro}</p>
      </Reveal>

      {topic.sections.map((s, i) => (
        <Reveal key={s.id} as="section" className="tsection" id={`sec-${s.id}`}>
          <h2 className="tsection__title">
            <span className="tsection__num">{i + 1}</span>
            {s.title}
          </h2>
          {s.paragraphs?.map((p, j) => (
            <p key={j} className="tsection__p">
              {p}
            </p>
          ))}
          {s.list?.length > 0 && (
            <ul className="tsection__list">
              {s.list.map((item, j) => (
                <li key={j}>{item}</li>
              ))}
            </ul>
          )}
        </Reveal>
      ))}

      <Reveal as="section" className="tsection" id="sec-facts">
        <h2 className="tsection__title">
          <span className="tsection__num">
            <Lightbulb size={16} />
          </span>
          Интересные факты
        </h2>
        <div className="facts">
          {topic.facts.map((f, i) => (
            <motion.div
              key={i}
              className="fact"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.45 }}
            >
              <span className="fact__num">{String(i + 1).padStart(2, '0')}</span>
              <p>{f}</p>
            </motion.div>
          ))}
        </div>
      </Reveal>

      <Reveal as="section" className="tsection" id="sec-significance">
        <h2 className="tsection__title">
          <span className="tsection__num">
            <Star size={16} />
          </span>
          Итоги и значение
        </h2>
        <div className="meaning">
          <p>{topic.significance}</p>
        </div>
      </Reveal>
    </div>
  )
}

function TermsTab({ topic }) {
  return (
    <div className="topic-panel">
      <section id="sec-terms">
        <h2 className="panel-title">
          <BookOpen size={22} /> Термины и понятия
        </h2>
        <dl className="terms">
          {topic.terms.map((t, i) => (
            <motion.div
              key={t.term}
              className="term"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <dt>{t.term}</dt>
              <dd>{t.definition}</dd>
            </motion.div>
          ))}
        </dl>
      </section>
      <section id="sec-dates" className="topic-panel__block">
        <h2 className="panel-title">
          <CalendarDays size={22} /> Главные даты
        </h2>
        <ol className="timeline">
          {topic.dates.map((t, i) => (
            <motion.li
              key={i}
              className="timeline__item"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <span className="timeline__dot" aria-hidden="true" />
              <div className="timeline__date">{t.date}</div>
              <div className="timeline__text">{t.text}</div>
            </motion.li>
          ))}
        </ol>
      </section>
    </div>
  )
}

function PeopleTab({ topic }) {
  return (
    <section className="topic-panel" id="sec-people">
      <h2 className="panel-title">
        <Users size={22} /> Исторические личности
      </h2>
      <div className="people">
        {topic.people.map((p, i) => (
          <motion.div
            key={p.name}
            className="person"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
          >
            <div className="person__avatar" aria-hidden="true">
              {initials(p.name) || '•'}
            </div>
            <div>
              <div className="person__name">{p.name}</div>
              {p.years && <div className="person__years">{p.years}</div>}
              <div className="person__role">{p.role}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
