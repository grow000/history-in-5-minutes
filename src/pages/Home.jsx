import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { animate, motion, useInView, useReducedMotion } from 'framer-motion'
import { ArrowRight, BookOpen, GraduationCap, Landmark, Map as MapIcon, Search, Sparkles, Target, X } from 'lucide-react'
import Reveal, { stagger, staggerItem } from '../components/Reveal.jsx'
import { COURSES, searchTopics, tasks, topics, topicsOfCourse } from '../data/course.js'
import { events, filterEvents, plural } from '../data/index.js'
import { loadHistory } from '../progress.js'

function Counter({ to }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const reduce = useReducedMotion()
  const [value, setValue] = useState(reduce ? to : 0)
  useEffect(() => {
    if (!inView || reduce) return
    const c = animate(0, to, { duration: 1.4, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => setValue(Math.round(v)) })
    return () => c.stop()
  }, [inView, to, reduce])
  return <b ref={ref}>{value}</b>
}

const TITLE_WORDS = ['История', 'за', '5', 'минут']

export default function Home() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [last] = useState(() => loadHistory().find((h) => h.to))
  const inputRef = useRef(null)

  // поиск по всем текстам тяжёлый — считаем его с небольшой задержкой, чтобы ввод не тормозил
  const dq = useDeferredValue(q)
  const foundTopics = useMemo(() => (dq.trim() ? searchTopics(dq).slice(0, 6) : []), [dq])
  const foundEvents = useMemo(() => (dq.trim() ? filterEvents({ q: dq }).slice(0, 4) : []), [dq])

  const daily = useMemo(() => topics[new Date().getDate() % Math.max(1, topics.length)], [])
  const mapsCount = topics.filter((t) => t.map).length

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

  const sections = [
    {
      to: '/learn',
      icon: BookOpen,
      title: 'Курс истории',
      text: 'Все темы учебников истории России по классам: подробные конспекты, карты, таблицы, термины и тесты.',
      stat: `${topics.length} ${plural(topics.length, ['тема', 'темы', 'тем'])}`,
      color: '#4f46e5',
    },
    {
      to: '/exam',
      icon: GraduationCap,
      title: 'ЕГЭ и ОГЭ',
      text: 'Задания в формате ФИПИ: хронология, соответствие, термины, карты. Варианты и разбор ошибок.',
      stat: `${tasks.length} ${plural(tasks.length, ['задание', 'задания', 'заданий'])}`,
      color: '#ea580c',
    },
    {
      to: '/events',
      icon: Landmark,
      title: 'События мира',
      text: 'Ключевые события мировой истории от Древнего мира до XXI века — за 5 минут каждое.',
      stat: `${events.length} ${plural(events.length, ['событие', 'события', 'событий'])}`,
      color: '#0d9488',
    },
  ]

  return (
    <>
      <section className="hero hero--home">
        <div className="hero__bg" aria-hidden="true">
          <span className="blob blob--1" />
          <span className="blob blob--2" />
          <span className="blob blob--3" />
          <div className="hero__grid" />
        </div>
        <div className="container hero__inner">
          <span className="pill hero__pill">
            <Sparkles size={15} /> Учись быстро · готовься к экзаменам
          </span>
          <h1 className="hero__title hero__title--words">
            {TITLE_WORDS.map((w, i) => (
              <motion.span
                key={i}
                className={i >= 1 ? 'gradient-text' : ''}
                initial={{ opacity: 0, y: 30, rotateX: -60 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ delay: 0.1 + i * 0.09, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                {w}
              </motion.span>
            ))}
          </h1>
          <p className="hero__lead">
            История России по учебникам Мединского, ключевые события мировой истории и подготовка к ЕГЭ и ОГЭ — коротко,
            наглядно и с проверкой знаний.
          </p>

          <div className="search search--home">
            <Search className="search__icon" size={22} aria-hidden="true" />
            <input
              ref={inputRef}
              type="search"
              className="search__input"
              placeholder="Поиск: Пётр I, Смута, 1812, опричнина…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Поиск по темам и событиям"
              autoComplete="off"
            />
            {q ? (
              <button type="button" className="search__clear" onClick={() => setQ('')} aria-label="Очистить поиск">
                <X size={16} />
              </button>
            ) : (
              <kbd className="search__kbd" aria-hidden="true">
                /
              </kbd>
            )}
            {q.trim() && (
              <motion.div className="search-drop" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
                {foundTopics.length + foundEvents.length === 0 && <div className="search-drop__empty">Ничего не найдено</div>}
                {foundTopics.length > 0 && <div className="search-drop__group">Темы курса</div>}
                {foundTopics.map((t) => (
                  <button key={t.id} type="button" className="search-drop__item" onClick={() => navigate(`/topic/${t.id}`)}>
                    <BookOpen size={16} />
                    <span>{t.title}</span>
                    <small>{t.period}</small>
                  </button>
                ))}
                {foundEvents.length > 0 && <div className="search-drop__group">События</div>}
                {foundEvents.map((e) => (
                  <button key={e.id} type="button" className="search-drop__item" onClick={() => navigate(`/event/${e.id}`)}>
                    <Landmark size={16} />
                    <span>{e.title}</span>
                    <small>{e.date}</small>
                  </button>
                ))}
              </motion.div>
            )}
          </div>

          {last && (
            <Link to={last.to} className="continue-line">
              Продолжить: <b>{last.title}</b> <ArrowRight size={15} />
            </Link>
          )}

          <div className="hero__stats">
            <div className="stat">
              <Counter to={topics.length} />
              <span>тем курса</span>
            </div>
            <div className="stat">
              <Counter to={tasks.length} />
              <span>заданий ЕГЭ/ОГЭ</span>
            </div>
            <div className="stat">
              <Counter to={mapsCount} />
              <span>карт</span>
            </div>
          </div>
        </div>
      </section>

      <div className="container home">
        <motion.div className="feature-grid" variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
          {sections.map((s) => {
            const Icon = s.icon
            return (
              <motion.div key={s.to} variants={staggerItem}>
                <Link to={s.to} className="feature-card" style={{ '--era': s.color }}>
                  <span className="feature-card__icon">
                    <Icon size={28} />
                  </span>
                  <h2>{s.title}</h2>
                  <p>{s.text}</p>
                  <span className="feature-card__foot">
                    <span className="feature-card__stat">{s.stat}</span>
                    <span className="feature-card__go">
                      Перейти <ArrowRight size={17} />
                    </span>
                  </span>
                </Link>
              </motion.div>
            )
          })}
        </motion.div>

        <Reveal as="section" className="home-section">
          <h2 className="section-heading">
            <MapIcon size={22} /> Лента истории России
          </h2>
          <div className="ribbon">
            {COURSES.filter((c) => c.group === 'russia').map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.5 }}
              >
                <Link to={`/learn/${c.id}`} className="ribbon__item" style={{ '--era': c.color }}>
                  <span className="ribbon__dot" />
                  <span className="ribbon__period">{c.period}</span>
                  <span className="ribbon__title">{c.title}</span>
                  <span className="ribbon__count">
                    {c.grade} · {topicsOfCourse(c.id).length} тем
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </Reveal>

        {daily && (
          <Reveal as="section" className="daily">
            <div className="daily__label">
              <Target size={18} /> Тема дня
            </div>
            <h2 className="daily__title">{daily.title}</h2>
            <p className="daily__text">{daily.summary}</p>
            <div className="daily__actions">
              <Link to={`/topic/${daily.id}`} className="btn btn--light">
                Читать конспект
              </Link>
              <Link to={`/topic/${daily.id}/quiz`} className="btn btn--outline-light">
                Пройти тест
              </Link>
            </div>
          </Reveal>
        )}
      </div>
    </>
  )
}
