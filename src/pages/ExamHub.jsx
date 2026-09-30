import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, BookOpen, Dices, GraduationCap, ListChecks, Minus, Play, Plus, SlidersHorizontal, Timer } from 'lucide-react'
import Tabs, { TabPanel } from '../components/Tabs.jsx'
import { stagger, staggerItem } from '../components/Reveal.jsx'
import { EXAM_LINES, EXAMS, PERIODS, TASK_TYPES, tasksFor } from '../data/course.js'
import { EXAM_INFO } from '../data/courses-meta.js'
import { plural } from '../data/index.js'
import { loadProgress } from '../progress.js'

const VARIANT_SIZES = [10, 20, 30]

// Часть 1 по порядку номеров КИМ (из тех линий, что есть в тренажёре): ЕГЭ — № 1, 2, 3, 5, 6, 7, 9–12; ОГЭ — № 1–5, 8–10
const KIM_PART1 = {
  ege: '1:1,2:1,3:1,5:1,6:2,7:1,9:3',
  oge: '1:1,2:1,3:1,4:1,5:1,8:3',
}

export default function ExamHub() {
  const [params, setParams] = useSearchParams()
  const exam = EXAMS[params.get('e')] ? params.get('e') : 'ege'
  const navigate = useNavigate()
  const [size, setSize] = useState(20)
  const [progress] = useState(loadProgress)

  useEffect(() => {
    document.title = 'Подготовка к ЕГЭ и ОГЭ — История за 5 минут'
    return () => {
      document.title = 'История за 5 минут'
    }
  }, [])

  const all = useMemo(() => tasksFor({ exam }), [exam])
  const solved = all.filter((t) => progress['exam:' + t.id])
  const correct = solved.filter((t) => progress['exam:' + t.id].best === progress['exam:' + t.id].total).length
  const info = EXAM_INFO[exam]
  const color = EXAMS[exam].color

  const byType = Object.entries(TASK_TYPES)
    .map(([id, t]) => ({ id, ...t, count: all.filter((x) => x.type === id).length }))
    .filter((t) => t.count > 0)

  const periods = PERIODS.map((p) => {
    const inP = tasksFor({ exam, period: p.id })
    const topicIds = [...new Set(inP.map((t) => t.topic))]
    return {
      ...p,
      count: inP.length,
      topics: topicIds.map((id) => ({ id, title: inP.find((t) => t.topic === id).topicTitle, count: inP.filter((t) => t.topic === id).length })),
    }
  }).filter((p) => p.count > 0)

  return (
    <div className="exam" style={{ '--era': color }}>
      <section className="hero hero--compact">
        <div className="hero__bg" aria-hidden="true">
          <span className="blob blob--1" />
          <span className="blob blob--2" />
        </div>
        <div className="container hero__inner">
          <span className="pill hero__pill">
            <GraduationCap size={15} /> Задания в формате ФИПИ
          </span>
          <h1 className="hero__title">
            Подготовка к <span className="gradient-text">ЕГЭ и ОГЭ</span>
          </h1>
          <p className="hero__lead">
            Тренируйся по типам заданий и темам, собирай варианты и получай разбор каждой ошибки со ссылкой на нужный
            конспект.
          </p>
          <Tabs
            tabs={Object.values(EXAMS).map((e) => ({ id: e.id, label: e.title }))}
            value={exam}
            onChange={(e) => setParams({ e }, { replace: true })}
            layoutId="exam-switch"
            label="Экзамен"
            className="tabs--big"
          />
        </div>
      </section>

      <div className="container exam__body">
        <>
          <TabPanel id={exam} layoutId="exam-switch" key={exam}>
            <div className="exam-top">
              <motion.div className="exam-card exam-card--main" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                <div className="exam-card__icon">
                  <Dices size={26} />
                </div>
                <h2>Составить вариант</h2>
                <p className="muted">Случайные задания из банка по всем темам — как на экзамене, с проверкой в конце.</p>
                <div className="segmented" role="radiogroup" aria-label="Количество заданий">
                  {VARIANT_SIZES.map((n) => (
                    <button key={n} type="button" role="radio" aria-checked={size === n} className={size === n ? 'is-active' : ''} onClick={() => setSize(n)}>
                      {n}
                    </button>
                  ))}
                </div>
                <button type="button" className="btn btn--primary btn--lg" onClick={() => navigate(`/exam/practice?exam=${exam}&n=${size}&seed=${Date.now()}`)} disabled={!all.length}>
                  Начать вариант <ArrowRight size={18} />
                </button>
                <button type="button" className="btn btn--ghost exam-kim-btn" onClick={() => navigate(`/exam/practice?exam=${exam}&pick=${KIM_PART1[exam]}&mode=exam&seed=${Date.now()}`)}>
                  <Timer size={17} /> Как на экзамене: часть 1 по номерам КИМ
                </button>
              </motion.div>

              <motion.div className="exam-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
                <div className="exam-card__icon">
                  <ListChecks size={26} />
                </div>
                <h2>Твоя статистика</h2>
                <div className="exam-stats">
                  <div className="stat stat--card">
                    <b>{all.length}</b>
                    <span>{plural(all.length, ['задание', 'задания', 'заданий'])} в банке</span>
                  </div>
                  <div className="stat stat--card">
                    <b>{solved.length}</b>
                    <span>решено</span>
                  </div>
                  <div className="stat stat--card">
                    <b>{solved.length ? Math.round((correct / solved.length) * 100) : 0}%</b>
                    <span>без ошибок</span>
                  </div>
                </div>
                <div className="bar">
                  <span style={{ width: `${all.length ? (solved.length / all.length) * 100 : 0}%` }} />
                </div>
              </motion.div>
            </div>

            <KimConstructor exam={exam} progress={progress} />

            {info && (
              <section className="exam-info">
                <h2 className="section-heading">
                  <Timer size={22} /> Как устроен {EXAMS[exam].title} по истории
                </h2>
                <div className="exam-info__facts">
                  {info.facts.map((f) => (
                    <div key={f.label} className="exam-fact">
                      <b>{f.value}</b>
                      <span>{f.label}</span>
                    </div>
                  ))}
                </div>
                {info.note && <p className="muted exam-info__note">{info.note}</p>}
                {info.tasks?.length > 0 && (
                  <details className="exam-structure">
                    <summary>Структура экзамена по заданиям</summary>
                    <div className="dtable__scroll">
                      <table className="exam-structure__table">
                        <thead>
                          <tr>
                            <th>№</th>
                            <th>Что проверяется</th>
                            <th>Балл</th>
                          </tr>
                        </thead>
                        <tbody>
                          {info.tasks.map((t) => (
                            <tr key={t.n}>
                              <td>{t.n}</td>
                              <td>{t.text}</td>
                              <td>{t.points}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                )}
              </section>
            )}

            <section>
              <h2 className="section-heading">
                <ListChecks size={22} /> Каталог по типам заданий
              </h2>
              <motion.div className="type-grid" variants={stagger} initial="hidden" animate="show">
                {byType.map((t) => (
                  <motion.div key={t.id} variants={staggerItem}>
                    <Link to={`/exam/practice?exam=${exam}&type=${t.id}&n=10&seed=${Date.now()}`} className="type-card">
                      <div className="type-card__title">{t.title}</div>
                      <p>{t.hint}</p>
                      <span className="type-card__count">
                        {t.count} {plural(t.count, ['задание', 'задания', 'заданий'])} <ArrowRight size={16} />
                      </span>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </section>

            <section>
              <h2 className="section-heading">
                <BookOpen size={22} /> Каталог по периодам и темам
              </h2>
              <p className="muted catalog-note">
                Темы сгруппированы по историческим периодам, как разделы кодификатора ФИПИ.
                {exam === 'oge' ? ' ОГЭ охватывает историю России до 1914 г.' : ' ЕГЭ охватывает весь курс — от Руси до наших дней.'}
              </p>
              <div className="exam-courses">
                {periods.map((p) => (
                  <details key={p.id} className="exam-course" style={{ '--era': p.color }}>
                    <summary>
                      <span className="exam-course__title">
                        {p.title}
                        <small>{p.range}</small>
                      </span>
                      <span className="exam-course__count">
                        {p.count} {plural(p.count, ['задание', 'задания', 'заданий'])}
                      </span>
                    </summary>
                    <div className="exam-course__body">
                      <Link to={`/exam/practice?exam=${exam}&period=${p.id}&n=${Math.min(20, p.count)}&seed=${Date.now()}`} className="btn btn--soft btn--sm">
                        Вариант по периоду · {Math.min(20, p.count)}
                      </Link>
                      <div className="exam-topics__list">
                        {p.topics.map((t) => (
                          <Link key={t.id} to={`/exam/practice?exam=${exam}&topic=${t.id}`} className="exam-topic">
                            <span>{t.title}</span>
                            <span className="exam-topic__count">{t.count}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            </section>
          </TabPanel>
        </>
      </div>
    </div>
  )
}

// Конструктор: выбираешь номера заданий КИМ и сколько штук каждого решать
function KimConstructor({ exam, progress }) {
  const navigate = useNavigate()
  const [counts, setCounts] = useState({})
  const lines = useMemo(
    () =>
      EXAM_LINES[exam]
        .map((l) => {
          const list = tasksFor({ exam, line: l.id })
          const solved = list.filter((t) => progress['exam:' + t.id]).length
          return { ...l, total: list.length, solved }
        })
        .filter((l) => l.total > 0),
    [exam, progress]
  )

  const setCount = (id, value, max) => setCounts((c) => ({ ...c, [id]: Math.max(0, Math.min(max, Math.min(30, value))) }))
  const selected = lines.filter((l) => counts[l.id] > 0)
  const totalSelected = selected.reduce((s, l) => s + counts[l.id], 0)
  const start = (pickList) =>
    navigate(`/exam/practice?exam=${exam}&pick=${pickList.map((p) => `${p.id}:${p.k}`).join(',')}&seed=${Date.now()}`)
  const preset = (k) => setCounts(Object.fromEntries(lines.filter((l) => l.n !== '+').map((l) => [l.id, Math.min(k, l.total)])))

  return (
    <section className="kim" aria-labelledby="kim-title">
      <div className="kim__head">
        <div>
          <h2 id="kim-title" className="section-heading">
            <SlidersHorizontal size={22} /> Задания по номерам КИМ
          </h2>
          <p className="muted">
            Выбери номер задания и сколько штук решать — например, 3 задания № 1. Можно собрать свой вариант из
            нескольких номеров.
          </p>
        </div>
        <div className="kim__presets">
          <button type="button" className="chip-btn" onClick={() => preset(1)}>
            По 1 каждого
          </button>
          <button type="button" className="chip-btn" onClick={() => preset(3)}>
            По 3 каждого
          </button>
          {totalSelected > 0 && (
            <button type="button" className="chip-btn chip-btn--ghost" onClick={() => setCounts({})}>
              Сбросить
            </button>
          )}
        </div>
      </div>

      <motion.ul className="kim__list" variants={stagger} initial="hidden" animate="show">
        {lines.map((l) => {
          const value = counts[l.id] ?? 0
          const max = Math.min(30, l.total)
          return (
            <motion.li key={l.id} variants={staggerItem} className={'kim-row' + (value > 0 ? ' is-selected' : '')}>
              <span className={'kim-row__n' + (l.n === '+' ? ' kim-row__n--extra' : '')}>{l.n === '+' ? 'доп.' : `№ ${l.n}`}</span>
              <div className="kim-row__main">
                <div className="kim-row__title">{l.title}</div>
                <div className="kim-row__meta">
                  в банке {l.total} · решено {l.solved}
                </div>
              </div>
              <div className="stepper" role="group" aria-label={`Количество заданий: ${l.title}`}>
                <button type="button" onClick={() => setCount(l.id, value - 1, max)} disabled={value === 0} aria-label="Меньше">
                  <Minus size={16} />
                </button>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={max}
                  value={value}
                  onChange={(e) => setCount(l.id, Number(e.target.value) || 0, max)}
                  aria-label="Количество"
                />
                <button type="button" onClick={() => setCount(l.id, value + 1, max)} disabled={value >= max} aria-label="Больше">
                  <Plus size={16} />
                </button>
              </div>
              <button
                type="button"
                className="btn btn--soft btn--sm kim-row__go"
                onClick={() => start([{ id: l.id, k: value || Math.min(5, l.total) }])}
                title={value ? `Решать ${value}` : 'Решать 5 заданий этого номера'}
              >
                <Play size={15} /> {value ? `Решать ${value}` : 'Решать 5'}
              </button>
            </motion.li>
          )
        })}
      </motion.ul>

      <div className={'kim__bar' + (totalSelected ? ' is-active' : '')}>
        <span>
          {totalSelected
            ? `Выбрано ${totalSelected} ${plural(totalSelected, ['задание', 'задания', 'заданий'])}: ${selected
                .map((l) => `${l.n === '+' ? 'доп.' : '№ ' + l.n} × ${counts[l.id]}`)
                .join(', ')}`
            : 'Выбери количество заданий в нужных строках'}
        </span>
        <button
          type="button"
          className="btn btn--primary"
          disabled={!totalSelected}
          onClick={() => start(selected.map((l) => ({ id: l.id, k: counts[l.id] })))}
        >
          Решать выбранные <ArrowRight size={18} />
        </button>
      </div>
    </section>
  )
}
