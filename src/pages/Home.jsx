import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { animate, motion, useInView, useReducedMotion } from 'framer-motion'
import { ArrowRight, BookOpen, ChartNoAxesColumn, Compass, GraduationCap, Search, Sparkles, Target, X, Zap } from 'lucide-react'
import Reveal, { stagger, staggerItem } from '../components/Reveal.jsx'
import { periodsFor, searchTopics, tasks, topics, topicsById, topicsFor } from '../data/course.js'
import { plural } from '../data/index.js'
import { levelOf, loadHistory, loadStory, totalXp } from '../progress.js'

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
  const [story] = useState(loadStory)
  const xp = totalXp(story)
  const lvl = levelOf(xp)
  // незаконченная тема, которую проходили последней
  const resume = useMemo(() => {
    const list = Object.entries(story)
      .filter(([id, s]) => topicsById[id] && !s.done && (s.step ?? 0) > 0)
      .sort((a, b) => (b[1].at ?? 0) - (a[1].at ?? 0))
    if (!list.length) return null
    const [id, s] = list[0]
    return { topic: topicsById[id], percent: Math.round((((s.step ?? 0) + 1) / (s.steps || 1)) * 100) }
  }, [story])
  const doneCount = Object.values(story).filter((s) => s.done).length
  const inputRef = useRef(null)

  // поиск по всем текстам тяжёлый — считаем его с небольшой задержкой, чтобы ввод не тормозил
  const dq = useDeferredValue(q)
  const foundTopics = useMemo(() => (dq.trim() ? searchTopics(dq).slice(0, 6) : []), [dq])

  const daily = useMemo(() => topics[new Date().getDate() % Math.max(1, topics.length)], [])

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
      title: 'Темы и события',
      text: 'Найди любое событие или пройди все темы ЕГЭ и ОГЭ: короткие истории с вопросами, карточками и игрой с датами.',
      stat: `${topics.length} ${plural(topics.length, ['тема', 'темы', 'тем'])}`,
      color: '#4f46e5',
    },
    {
      to: '/exam',
      icon: GraduationCap,
      title: 'ЕГЭ и ОГЭ',
      text: 'Все номера КИМ: часть 1 с автопроверкой и часть 2 с эталоном и критериями. Свой вариант за минуту.',
      stat: `${tasks.length} ${plural(tasks.length, ['задание', 'задания', 'заданий'])}`,
      color: '#ea580c',
    },
    {
      to: '/progress',
      icon: ChartNoAxesColumn,
      title: 'Мой прогресс',
      text: 'Опыт, уровни, пройденные темы и слабые места — всё сохраняется в браузере.',
      stat: `${xp} XP · уровень ${lvl.level}`,
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
            Ищи интересные события или проходи по порядку все темы ЕГЭ и ОГЭ — коротко, интерактивно и с заданиями по всем
            номерам экзамена.
          </p>

          <div className="search search--home">
            <Search className="search__icon" size={22} aria-hidden="true" />
            <input
              ref={inputRef}
              type="search"
              className="search__input"
              placeholder="Найти тему: Пётр I, Смута, 1812, опричнина…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Поиск по темам"
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
                {foundTopics.length === 0 && <div className="search-drop__empty">Ничего не найдено</div>}
                {foundTopics.length > 0 && <div className="search-drop__group">Темы курса</div>}
                {foundTopics.map((t) => (
                  <button key={t.id} type="button" className="search-drop__item" onClick={() => navigate(`/topic/${t.id}`)}>
                    <BookOpen size={16} />
                    <span>{t.title}</span>
                    <small>{t.period}</small>
                  </button>
                ))}
              </motion.div>
            )}
          </div>

          {resume ? (
            <Link to={`/topic/${resume.topic.id}`} className="continue-line">
              Продолжить: <b>{resume.topic.title}</b> · {resume.percent}% <ArrowRight size={15} />
            </Link>
          ) : (
            last && (
              <Link to={last.to} className="continue-line">
                Продолжить: <b>{last.title}</b> <ArrowRight size={15} />
              </Link>
            )
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
              <Counter to={xp} />
              <span>
                <Zap size={13} aria-hidden="true" /> твой XP · {doneCount} {plural(doneCount, ['тема пройдена', 'темы пройдено', 'тем пройдено'])}
              </span>
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
            <Compass size={22} /> Темы ЕГЭ по разделам
          </h2>
          <div className="ribbon">
            {periodsFor('ege').map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(i, 8) * 0.05, duration: 0.5 }}
              >
                <Link to={`/learn?p=${p.id}`} className="ribbon__item" style={{ '--era': p.color }}>
                  <span className="ribbon__dot" />
                  <span className="ribbon__period">{p.range}</span>
                  <span className="ribbon__title">{p.title}</span>
                  <span className="ribbon__count">{topicsFor('ege', p.id).length} тем</span>
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
                Пройти историю
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
