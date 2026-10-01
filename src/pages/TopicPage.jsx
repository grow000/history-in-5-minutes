import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowLeft, ArrowRight, BookOpen, Castle, Check, Clock, Flag, GraduationCap, Landmark, Layers, Lightbulb, MapPin,
  RotateCcw, Sparkles, Star, Swords, Table, Target, Trophy, Users, X, Zap,
} from 'lucide-react'
import DataTable from '../components/DataTable.jsx'
import { coursesById, neighbours, periodOf, tasksFor, topicsById } from '../data/course.js'
import { plural } from '../data/index.js'
import { loadProgress, loadStory, saveStory } from '../progress.js'
import NotFound from './NotFound.jsx'

// Сколько опыта даёт каждое действие
const XP = { step: 10, check: 15, flip: 2, fact: 2, timeline: 25, finish: 30 }

export default function TopicPage({ id }) {
  const topic = topicsById[id]
  if (!topic) return <NotFound text="Такой темы пока нет в курсе." />
  return <TopicStory topic={topic} />
}

function initials(name) {
  return name
    .replace(/[«»"()]/g, '')
    .split(/\s+/)
    .filter((w) => /^[A-ZА-ЯЁ]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
}

function minutesToRead(topic) {
  const text = [topic.intro, ...topic.sections.flatMap((s) => [...(s.paragraphs ?? []), ...(s.list ?? [])]), topic.significance].join(' ')
  return Math.max(3, Math.round(text.split(/\s+/).length / 170))
}

// Шаги истории: вступление → части рассказа (с вопросом по ходу) → места → люди → слова → даты → таблица → факты → итог
function buildSteps(topic) {
  const steps = [{ id: 'intro', kind: 'intro', label: 'Начало' }]
  topic.sections.forEach((s, i) => {
    steps.push({ id: s.id, kind: 'section', label: s.title, section: s, n: i + 1, check: topic.quiz.find((q) => q.section === s.id) })
  })
  if (topic.map?.points?.length >= 2) steps.push({ id: 'places', kind: 'places', label: 'Где это было' })
  if (topic.people?.length) steps.push({ id: 'people', kind: 'people', label: 'Лица эпохи' })
  if (topic.terms?.length) steps.push({ id: 'terms', kind: 'terms', label: 'Словарь' })
  if (topic.dates?.length >= 3) steps.push({ id: 'dates', kind: 'timeline', label: 'Лента времени' })
  if (topic.table) steps.push({ id: 'table', kind: 'table', label: topic.table.title || 'Таблица' })
  if (topic.facts?.length) steps.push({ id: 'facts', kind: 'facts', label: 'Знаешь ли ты?' })
  steps.push({ id: 'significance', kind: 'finale', label: 'Итог' })
  return steps
}

// куда вести по ссылке «доп. материал» из теста (?s=…)
const SECTION_ALIASES = { map: 'places' }

function TopicStory({ topic }) {
  const course = coursesById[topic.course]
  const period = periodOf(topic)
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const { prev, next } = neighbours(topic.id)
  const steps = useMemo(() => buildSteps(topic), [topic])
  const examCount = useMemo(() => tasksFor({ topic: topic.id }).length, [topic.id])
  const [best] = useState(() => loadProgress()['topic:' + topic.id])
  const reduce = useReducedMotion()
  const topRef = useRef(null)

  const saved = useMemo(() => loadStory()[topic.id] ?? {}, [topic.id])
  const [got, setGot] = useState(() => new Set(saved.got ?? []))
  const [mode, setMode] = useState(() => (params.get('view') === 'all' ? 'all' : 'steps'))
  const [xpPop, setXpPop] = useState(null)

  // начальный шаг: ?s= (из теста), ?step=, иначе с места, где остановился
  const initialStep = () => {
    const s = params.get('s')
    if (s) {
      const target = SECTION_ALIASES[s] ?? s
      const i = steps.findIndex((x) => x.id === target)
      if (i >= 0) return i
    }
    const st = Number(params.get('step'))
    if (st > 0 && st <= steps.length) return st - 1
    return saved.done ? 0 : Math.min(saved.step ?? 0, steps.length - 1)
  }
  const [step, setStep] = useState(initialStep)

  const xp = useMemo(() => {
    let sum = 0
    got.forEach((k) => (sum += XP[k.split(':')[0]] ?? 0))
    return sum
  }, [got])

  const earn = useCallback((key) => {
    setGot((g) => {
      if (g.has(key)) return g
      const n = new Set(g)
      n.add(key)
      const amount = XP[key.split(':')[0]] ?? 0
      if (amount) setXpPop({ amount, at: Date.now() })
      return n
    })
  }, [])

  // сохраняем прохождение
  useEffect(() => {
    saveStory(topic.id, {
      got: [...got],
      xp,
      step,
      steps: steps.length,
      done: got.has('finish:' + topic.id),
      title: topic.title,
      course: topic.course,
    })
  }, [got, xp, step, steps.length, topic])

  useEffect(() => {
    document.title = `${topic.title} — История за 5 минут`
    return () => {
      document.title = 'История за 5 минут'
    }
  }, [topic.title])

  useEffect(() => {
    if (!xpPop) return
    const t = setTimeout(() => setXpPop(null), 1400)
    return () => clearTimeout(t)
  }, [xpPop])

  const go = useCallback(
    (i) => {
      const target = Math.max(0, Math.min(steps.length - 1, i))
      if (target > step) earn('step:' + steps[target].id)
      setStep(target)
      const p = new URLSearchParams(params)
      p.delete('s')
      p.set('step', String(target + 1))
      setParams(p, { replace: true })
      topRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
    },
    [steps, step, earn, params, setParams, reduce]
  )

  // стрелки ← → листают шаги
  useEffect(() => {
    if (mode !== 'steps') return
    const onKey = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return
      if (e.key === 'ArrowRight') go(step + 1)
      if (e.key === 'ArrowLeft') go(step - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mode, step, go])

  // при переходе из теста в режиме «всё сразу» — прокрутка к разделу
  useEffect(() => {
    if (mode !== 'all') return
    const s = params.get('s')
    if (!s) return
    const el = document.getElementById('st-' + (SECTION_ALIASES[s] ?? s))
    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300)
  }, [mode, params])

  const setView = (m) => {
    setMode(m)
    const p = new URLSearchParams(params)
    if (m === 'all') p.set('view', 'all')
    else p.delete('view')
    setParams(p, { replace: true })
  }

  const ctx = { topic, course, period, earn, got, go, steps, examCount, best, next, xp, navigate }
  const current = steps[step]
  const percent = Math.round(((step + 1) / steps.length) * 100)

  return (
    <article className="story" style={{ '--era': period?.color ?? course.color }}>
      <div className="story-bar" ref={topRef}>
        <div className="container story-bar__inner">
          <Link to={period ? `/learn?p=${period.id}` : '/learn'} className="story-bar__back" aria-label="Ко всем темам">
            <ArrowLeft size={18} />
          </Link>
          <div className="story-bar__main">
            <div className="story-bar__title">{topic.title}</div>
            {mode === 'steps' && (
              <div className="story-progress" role="progressbar" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={step + 1} aria-label="Шаг темы">
                <span style={{ width: `${percent}%` }} />
              </div>
            )}
          </div>
          <div className="story-bar__xp" aria-live="polite">
            <Zap size={16} aria-hidden="true" /> {xp} XP
            {xpPop && (
              <motion.span key={xpPop.at} className="xp-pop" initial={{ opacity: 0, y: 6 }} animate={{ opacity: [0, 1, 1, 0], y: -18 }} transition={{ duration: 1.3 }}>
                +{xpPop.amount}
              </motion.span>
            )}
          </div>
          <div className="segmented segmented--sm story-bar__mode" role="radiogroup" aria-label="Режим чтения">
            <button type="button" role="radio" aria-checked={mode === 'steps'} className={mode === 'steps' ? 'is-active' : ''} onClick={() => setView('steps')}>
              По шагам
            </button>
            <button type="button" role="radio" aria-checked={mode === 'all'} className={mode === 'all' ? 'is-active' : ''} onClick={() => setView('all')}>
              Всё сразу
            </button>
          </div>
        </div>
      </div>

      <div className="container story-body">
        {mode === 'steps' ? (
          <>
            <nav className="story-dots" aria-label="Шаги темы">
              {steps.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  className={'story-dot' + (i === step ? ' is-current' : '') + (got.has('step:' + s.id) || i < step ? ' is-seen' : '')}
                  onClick={() => go(i)}
                  aria-label={`Шаг ${i + 1}: ${s.label}`}
                  aria-current={i === step ? 'step' : undefined}
                  title={s.label}
                />
              ))}
            </nav>
            <motion.div
              key={current.id}
              className="story-stage"
              initial={reduce ? false : { opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="story-step-label">
                Шаг {step + 1} из {steps.length} · {current.label}
              </div>
              <StepView step={current} ctx={ctx} />
            </motion.div>
            <div className="story-nav">
              <button type="button" className="btn btn--soft" onClick={() => go(step - 1)} disabled={step === 0}>
                <ArrowLeft size={18} /> Назад
              </button>
              {step < steps.length - 1 ? (
                <button type="button" className="btn btn--primary btn--lg" onClick={() => go(step + 1)}>
                  {step === 0 ? 'Начать' : 'Дальше'} <ArrowRight size={18} />
                </button>
              ) : (
                <button type="button" className="btn btn--primary btn--lg" onClick={() => navigate(`/topic/${topic.id}/quiz`)}>
                  <Target size={18} /> Пройти тест
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="story-all">
            {steps.map((s) => (
              <section key={s.id} id={'st-' + s.id} className="story-stage story-stage--flat">
                {s.kind !== 'intro' && <div className="story-step-label">{s.label}</div>}
                <StepView step={s} ctx={ctx} />
              </section>
            ))}
          </div>
        )}

        <p className="source-note">
          <BookOpen size={15} /> По материалам учебников {course.group === 'world' ? 'В. Р. Мединского и А. О. Чубарьяна' : 'В. Р. Мединского и А. В. Торкунова'}. Текст — авторский пересказ.{' '}
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

function StepView({ step, ctx }) {
  switch (step.kind) {
    case 'intro':
      return <IntroStep ctx={ctx} />
    case 'section':
      return <SectionStep step={step} ctx={ctx} />
    case 'places':
      return <PlacesStep topic={ctx.topic} />
    case 'people':
      return <FlipDeck kind="people" topic={ctx.topic} earn={ctx.earn} got={ctx.got} />
    case 'terms':
      return <FlipDeck kind="terms" topic={ctx.topic} earn={ctx.earn} got={ctx.got} />
    case 'timeline':
      return <TimelineGame topic={ctx.topic} earn={ctx.earn} got={ctx.got} />
    case 'table':
      return (
        <div className="story-card">
          <h2 className="story-h">
            <Table size={22} /> {ctx.topic.table.title || 'Таблица'}
          </h2>
          <p className="muted">Короткая шпаргалка по теме — удобно повторять перед контрольной.</p>
          <DataTable table={{ ...ctx.topic.table, title: null }} />
        </div>
      )
    case 'facts':
      return <FactsStep topic={ctx.topic} earn={ctx.earn} got={ctx.got} />
    case 'finale':
      return <FinaleStep ctx={ctx} />
    default:
      return null
  }
}

function IntroStep({ ctx }) {
  const { topic, period, steps } = ctx
  const checks = steps.filter((s) => s.check).length
  return (
    <div className="story-card story-card--hero">
      <div className="story-hero__meta">
        {period && <span className="story-chip">{period.title.replace('Всеобщая история: ', 'Всеобщая · ')}</span>}
        <span className="story-chip">{topic.period}</span>
        {topic.exam?.ege && <span className="story-chip story-chip--exam">ЕГЭ</span>}
        {topic.exam?.oge && <span className="story-chip story-chip--exam">ОГЭ</span>}
      </div>
      <h1 className="story-hero__title">{topic.title}</h1>
      <p className="story-hero__summary">{topic.summary}</p>
      <div className="story-hero__stats">
        <span>
          <Clock size={16} /> ≈ {minutesToRead(topic)} мин
        </span>
        <span>
          <Layers size={16} /> {steps.length} {plural(steps.length, ['шаг', 'шага', 'шагов'])}
        </span>
        <span>
          <Target size={16} /> {checks} {plural(checks, ['вопрос', 'вопроса', 'вопросов'])} по ходу
        </span>
        <span>
          <Users size={16} /> {topic.people.length} {plural(topic.people.length, ['герой', 'героя', 'героев'])}
        </span>
      </div>
      <div className="story-lead">
        <Sparkles size={20} aria-hidden="true" />
        <p>{topic.intro}</p>
      </div>
    </div>
  )
}

function SectionStep({ step, ctx }) {
  const s = step.section
  return (
    <div className="story-card">
      <div className="story-section__n" aria-hidden="true">
        {String(step.n).padStart(2, '0')}
      </div>
      <h2 className="story-h">{s.title}</h2>
      <div className="story-text">
        {s.paragraphs?.map((p, j) => (
          <p key={j}>{p}</p>
        ))}
        {s.list?.length > 0 && (
          <ul className="story-list">
            {s.list.map((item, j) => (
              <li key={j}>{item}</li>
            ))}
          </ul>
        )}
      </div>
      {step.check && <Checkpoint q={step.check} id={s.id} earn={ctx.earn} got={ctx.got} />}
    </div>
  )
}

// Вопрос «на понимание» прямо в рассказе
function Checkpoint({ q, id, earn, got }) {
  const order = useMemo(() => q.options.map((_, i) => i).sort(() => Math.random() - 0.5), [q])
  const [chosen, setChosen] = useState(null)
  const done = chosen !== null
  const ok = chosen === q.answer
  const already = got.has('check:' + id)
  const choose = (i) => {
    if (done) return
    setChosen(i)
    if (i === q.answer) earn('check:' + id)
  }
  return (
    <div className={'checkpoint' + (done ? (ok ? ' is-ok' : ' is-bad') : '')}>
      <div className="checkpoint__label">
        <Lightbulb size={16} /> Проверь себя {already && !done && <span className="checkpoint__done">уже решено</span>}
      </div>
      <p className="checkpoint__q">{q.question}</p>
      <div className="checkpoint__options">
        {order.map((i) => (
          <button
            key={i}
            type="button"
            className={'checkpoint__opt' + (done && i === q.answer ? ' is-right' : '') + (done && i === chosen && !ok ? ' is-wrong' : '')}
            onClick={() => choose(i)}
            disabled={done}
          >
            {q.options[i]}
            {done && i === q.answer && <Check size={18} aria-hidden="true" />}
            {done && i === chosen && !ok && <X size={18} aria-hidden="true" />}
          </button>
        ))}
      </div>
      {done && (
        <motion.div className="checkpoint__fb" role="status" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          <b>{ok ? `Верно! +${XP.check} XP` : 'Не совсем.'}</b> {q.explanation}
          {!ok && (
            <button type="button" className="link-btn" onClick={() => setChosen(null)}>
              <RotateCcw size={14} /> Попробовать ещё
            </button>
          )}
        </motion.div>
      )}
    </div>
  )
}

const PLACE_ICONS = { battle: Swords, capital: Castle, city: Landmark, event: Flag, place: MapPin }

function PlacesStep({ topic }) {
  return (
    <div className="story-card">
      <h2 className="story-h">
        <MapPin size={22} /> Где это было
      </h2>
      <p className="muted">Главные места темы — города, сражения и события.</p>
      <ol className="places">
        {topic.map.points.map((p, i) => {
          const Icon = PLACE_ICONS[p.type] ?? MapPin
          return (
            <motion.li
              key={i}
              className={'place place--' + (p.type ?? 'place')}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: Math.min(i, 8) * 0.04 }}
            >
              <span className="place__icon" aria-hidden="true">
                <Icon size={18} />
              </span>
              <div>
                <div className="place__name">
                  {p.name}
                  {p.date && <span className="place__date">{p.date}</span>}
                </div>
                {p.text && <div className="place__text">{p.text}</div>}
              </div>
            </motion.li>
          )
        })}
      </ol>
    </div>
  )
}

// Карточки-перевёртыши: люди («Кто это?») и термины («Что это значит?»)
function FlipDeck({ kind, topic, earn, got }) {
  const isPeople = kind === 'people'
  const items = isPeople ? topic.people : topic.terms
  const [open, setOpen] = useState(() => new Set())
  const flip = (i) => {
    setOpen((o) => {
      const n = new Set(o)
      n.has(i) ? n.delete(i) : n.add(i)
      return n
    })
    earn(`flip:${kind}-${i}`)
  }
  const opened = items.filter((_, i) => got.has(`flip:${kind}-${i}`)).length
  return (
    <div className="story-card">
      <h2 className="story-h">
        {isPeople ? <Users size={22} /> : <BookOpen size={22} />} {isPeople ? 'Лица эпохи: кто это?' : 'Словарь темы'}
      </h2>
      <p className="muted">
        {isPeople
          ? 'Прочитай подсказку и попробуй вспомнить, о ком речь. Нажми на карточку, чтобы проверить.'
          : 'На карточке — слово. Вспомни, что оно значит, и переверни карточку.'}{' '}
        Открыто {opened} из {items.length}.
      </p>
      <div className="flip-grid">
        {items.map((it, i) => {
          const isOpen = open.has(i)
          return (
            <button
              key={i}
              type="button"
              className={'flip' + (isOpen ? ' is-open' : '') + (isPeople ? ' flip--person' : '')}
              onClick={() => flip(i)}
              aria-pressed={isOpen}
              aria-label={isPeople ? (isOpen ? `${it.name}, ${it.role}` : `Подсказка: ${it.role}. Нажми, чтобы увидеть ответ`) : isOpen ? `${it.term}: ${it.definition}` : `${it.term}. Нажми, чтобы увидеть значение`}
            >
              <span className="flip__inner">
                <span className="flip__face flip__front">
                  {isPeople ? (
                    <>
                      <span className="flip__q">Кто это?</span>
                      <span className="flip__hint">{it.role}</span>
                    </>
                  ) : (
                    <>
                      <span className="flip__term">{it.term}</span>
                      <span className="flip__tap">нажми, чтобы узнать</span>
                    </>
                  )}
                </span>
                <span className="flip__face flip__back">
                  {isPeople ? (
                    <>
                      <span className="flip__avatar" aria-hidden="true">
                        {initials(it.name) || '•'}
                      </span>
                      <span className="flip__name">{it.name}</span>
                      {it.years && <span className="flip__years">{it.years}</span>}
                    </>
                  ) : (
                    <span className="flip__def">{it.definition}</span>
                  )}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function shuffle(list) {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Игра: расставь события в хронологическом порядке (даты в теме идут по порядку)
function TimelineGame({ topic, earn, got }) {
  const pickItems = () => {
    const all = topic.dates.map((d, i) => ({ ...d, i }))
    const k = Math.min(5, all.length)
    const stepSize = all.length / k
    return shuffle(Array.from({ length: k }, (_, j) => all[Math.floor(j * stepSize)]))
  }
  const [items, setItems] = useState(pickItems)
  const [placed, setPlaced] = useState([])
  const [wrong, setWrong] = useState(null)
  const [mistakes, setMistakes] = useState(0)
  const order = useMemo(() => [...items].sort((a, b) => a.i - b.i), [items])
  const solved = placed.length === items.length

  const tap = (it) => {
    if (solved || placed.includes(it.i)) return
    if (order[placed.length].i === it.i) {
      const n = [...placed, it.i]
      setPlaced(n)
      if (n.length === items.length) earn('timeline:' + topic.id)
    } else {
      setWrong(it.i)
      setMistakes((m) => m + 1)
      setTimeout(() => setWrong(null), 500)
    }
  }
  const restart = () => {
    setItems(pickItems())
    setPlaced([])
    setMistakes(0)
  }

  return (
    <div className="story-card">
      <h2 className="story-h">
        <Clock size={22} /> Лента времени
      </h2>
      {!solved ? (
        <>
          <p className="muted">
            Мини-игра: нажимай на события по порядку — от самого раннего к самому позднему.
            {got.has('timeline:' + topic.id) ? ' (Ты уже проходил эту игру.)' : ` За победу +${XP.timeline} XP.`}
          </p>
          <div className="tl-game">
            {items.map((it) => {
              const pos = placed.indexOf(it.i)
              return (
                <button
                  key={it.i}
                  type="button"
                  className={'tl-card' + (pos >= 0 ? ' is-placed' : '') + (wrong === it.i ? ' is-wrong' : '')}
                  onClick={() => tap(it)}
                  disabled={pos >= 0}
                >
                  <span className="tl-card__n" aria-hidden="true">
                    {pos >= 0 ? pos + 1 : '?'}
                  </span>
                  <span className="tl-card__text">{it.text}</span>
                  {pos >= 0 && <span className="tl-card__date">{it.date}</span>}
                </button>
              )
            })}
          </div>
          <p className="tl-game__status" aria-live="polite">
            Поставлено {placed.length} из {items.length}
            {mistakes > 0 && ` · ошибок: ${mistakes}`}
          </p>
        </>
      ) : (
        <motion.div className="tl-win" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
          <Trophy size={28} aria-hidden="true" />
          <div>
            <b>{mistakes === 0 ? 'Идеально — без единой ошибки!' : `Готово! Ошибок: ${mistakes}.`}</b>
            <button type="button" className="link-btn" onClick={restart}>
              <RotateCcw size={14} /> Сыграть ещё
            </button>
          </div>
        </motion.div>
      )}

      <ol className="timeline story-timeline" aria-label="Все даты темы">
        {topic.dates.map((d, i) => (
          <li key={i} className={'timeline__item' + (!solved ? ' is-dim' : '')}>
            <span className="timeline__dot" aria-hidden="true" />
            <div className="timeline__date">{solved ? d.date : '• • •'}</div>
            <div className="timeline__text">{d.text}</div>
          </li>
        ))}
      </ol>
      {!solved && <p className="muted tl-hint">Все даты темы откроются после игры.</p>}
    </div>
  )
}

function FactsStep({ topic, earn, got }) {
  const [open, setOpen] = useState(() => new Set(topic.facts.map((_, i) => i).filter((i) => got.has(`fact:${topic.id}-${i}`))))
  const reveal = (i) => {
    setOpen((o) => new Set(o).add(i))
    earn(`fact:${topic.id}-${i}`)
  }
  return (
    <div className="story-card">
      <h2 className="story-h">
        <Lightbulb size={22} /> Знаешь ли ты?
      </h2>
      <p className="muted">Пять интересных фактов. Открывай по одному.</p>
      <div className="facts-reveal">
        {topic.facts.map((f, i) =>
          open.has(i) ? (
            <motion.div key={i} className="fact fact--open" initial={{ opacity: 0, rotateX: -40 }} animate={{ opacity: 1, rotateX: 0 }}>
              <span className="fact__num">{String(i + 1).padStart(2, '0')}</span>
              <p>{f}</p>
            </motion.div>
          ) : (
            <button key={i} type="button" className="fact fact--closed" onClick={() => reveal(i)}>
              <span className="fact__num">{String(i + 1).padStart(2, '0')}</span>
              <span>Открыть факт</span>
              <Sparkles size={18} aria-hidden="true" />
            </button>
          )
        )}
      </div>
    </div>
  )
}

function FinaleStep({ ctx }) {
  const { topic, earn, xp, examCount, best, next, navigate } = ctx
  // тема засчитывается, когда ученик действительно дошёл до итога
  return (
    <motion.div className="story-card story-card--finale" onViewportEnter={() => earn('finish:' + topic.id)} viewport={{ once: true, amount: 0.4 }}>
      <div className="finale__badge" aria-hidden="true">
        <Star size={30} />
      </div>
      <h2 className="story-h">Итоги и значение</h2>
      <p className="story-finale__text">{topic.significance}</p>
      <div className="finale__xp">
        <Zap size={18} aria-hidden="true" /> За тему набрано <b>{xp} XP</b>
      </div>
      <div className="finale__actions">
        <button type="button" className="btn btn--primary btn--lg" onClick={() => navigate(`/topic/${topic.id}/quiz`)}>
          <Target size={18} /> {best ? `Тест · лучший ${best.best}/${best.total}` : 'Пройти тест'}
        </button>
        {examCount > 0 && (
          <Link to={`/exam/practice?topic=${topic.id}`} className="btn btn--soft btn--lg">
            <GraduationCap size={18} /> Задания ЕГЭ/ОГЭ · {examCount}
          </Link>
        )}
        {next && (
          <Link to={`/topic/${next.id}`} className="btn btn--ghost btn--lg">
            Следующая тема <ArrowRight size={18} />
          </Link>
        )}
      </div>
    </motion.div>
  )
}
