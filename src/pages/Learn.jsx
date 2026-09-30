import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, BookOpen, Search, X } from 'lucide-react'
import Tabs from '../components/Tabs.jsx'
import { COURSES, coursesById, searchTopics, SOURCES, topicsOfCourse } from '../data/course.js'
import { plural } from '../data/index.js'
import { loadProgress } from '../progress.js'
import { stagger, staggerItem } from '../components/Reveal.jsx'

const GROUPS = [
  { id: 'all', label: 'Все классы' },
  { id: 'basic', label: '6–9 классы · ОГЭ' },
  { id: 'senior', label: '10–11 классы · ЕГЭ' },
]

const inGroup = (c, g) => g === 'all' || (g === 'basic' ? c.exams.includes('oge') : !c.exams.includes('oge'))

export default function Learn() {
  const [group, setGroup] = useState('all')
  const [q, setQ] = useState('')
  const [progress] = useState(loadProgress)

  useEffect(() => {
    document.title = 'Курс истории — История за 5 минут'
    return () => {
      document.title = 'История за 5 минут'
    }
  }, [])

  const courses = COURSES.filter((c) => inGroup(c, group))
  const found = useMemo(() => searchTopics(q), [q])

  return (
    <div className="learn">
      <section className="hero hero--compact">
        <div className="hero__bg" aria-hidden="true">
          <span className="blob blob--1" />
          <span className="blob blob--2" />
        </div>
        <div className="container hero__inner">
          <span className="pill hero__pill">
            <BookOpen size={15} /> По учебникам под ред. В. Р. Мединского
          </span>
          <h1 className="hero__title">
            Курс <span className="gradient-text">истории</span>
          </h1>
          <p className="hero__lead">
            Все темы школьного курса — от Древней Руси до наших дней. Подробные конспекты, карты, таблицы, термины и
            тесты с разбором ошибок.
          </p>
          <div className="search">
            <Search className="search__icon" size={22} aria-hidden="true" />
            <input
              type="search"
              className="search__input"
              placeholder="Найти тему: Пётр I, опричнина, 1812…"
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
        </div>
      </section>

      <div className="container learn__body">
        {q ? (
          <section aria-live="polite">
            <p className="results-count">
              {found.length ? `Найдено ${found.length} ${plural(found.length, ['тема', 'темы', 'тем'])}` : 'Ничего не найдено'}
            </p>
            <motion.div className="topic-list" variants={stagger} initial="hidden" animate="show" key={q}>
              {found.map((t) => (
                <TopicRow key={t.id} topic={t} done={progress['topic:' + t.id]} showCourse />
              ))}
            </motion.div>
          </section>
        ) : (
          <>
            <Tabs tabs={GROUPS} value={group} onChange={setGroup} layoutId="learn-groups" label="Разделы курса" className="tabs--center" />
            <motion.div className="course-grid" variants={stagger} initial="hidden" animate="show" key={group}>
              {courses.map((c) => {
                const list = topicsOfCourse(c.id)
                const done = list.filter((t) => progress['topic:' + t.id]).length
                return (
                  <motion.div key={c.id} variants={staggerItem}>
                    <Link to={`/learn/${c.id}`} className="course-card" style={{ '--era': c.color }}>
                      <div className="course-card__top">
                        <span className="course-card__grade">{c.grade}</span>
                        <span className="course-card__period">{c.period}</span>
                      </div>
                      <h2 className="course-card__title">{c.title}</h2>
                      <p className="course-card__book">{SOURCES[c.source]?.short}</p>
                      <div className="course-card__stats">
                        <span>
                          {c.chapters.length} {plural(c.chapters.length, ['глава', 'главы', 'глав'])}
                        </span>
                        <span>
                          {list.length} {plural(list.length, ['тема', 'темы', 'тем'])}
                        </span>
                      </div>
                      <div className="bar" aria-label={`Пройдено ${done} из ${list.length}`}>
                        <span style={{ width: `${list.length ? (done / list.length) * 100 : 0}%` }} />
                      </div>
                      <span className="course-card__go">
                        Открыть курс <ArrowRight size={17} />
                      </span>
                    </Link>
                  </motion.div>
                )
              })}
            </motion.div>
          </>
        )}
      </div>
    </div>
  )
}

export function TopicRow({ topic, done, showCourse, index }) {
  return (
    <motion.div variants={staggerItem}>
      <Link to={`/topic/${topic.id}`} className="topic-row">
        {index != null && <span className="topic-row__num">{index}</span>}
        <div className="topic-row__main">
          <div className="topic-row__title">{topic.title}</div>
          <div className="topic-row__meta">
            {topic.period}
            {topic.paragraphs && ` · ${topic.paragraphs}`}
            {showCourse && ` · ${coursesById[topic.course]?.short ?? ''}`}
          </div>
        </div>
        <div className="topic-row__badges">
          {topic.map && <span className="mini-badge">Карта</span>}
          {topic.table && <span className="mini-badge">Таблица</span>}
          {done && (
            <span className={'mini-badge mini-badge--done' + (done.best === done.total ? ' is-perfect' : '')}>
              {done.best}/{done.total}
            </span>
          )}
        </div>
        <ArrowRight className="topic-row__arrow" size={18} aria-hidden="true" />
      </Link>
    </motion.div>
  )
}
