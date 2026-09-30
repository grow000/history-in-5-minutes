import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronRight, ExternalLink, Minus, Plus } from 'lucide-react'
import { EXAM_LINES, EXAMS, PERIODS, tasksFor } from '../data/course.js'
import { EXAM_INFO } from '../data/courses-meta.js'
import { plural } from '../data/index.js'
import { loadProgress } from '../progress.js'

// Часть 1 по порядку номеров КИМ (из тех линий, что есть в тренажёре)
const KIM_PART1 = {
  ege: '1:1,2:1,3:1,5:1,6:2,7:1,9:3',
  oge: '1:1,2:1,3:1,4:1,5:1,8:3',
}

// Официальные и популярные источники реальных заданий
const REAL_TASKS = {
  ege: [
    { href: 'https://fipi.ru/ege/otkrytyy-bank-zadaniy-ege', title: 'Открытый банк заданий ЕГЭ — ФИПИ', text: 'Официальные задания, которые могут встретиться на экзамене.' },
    { href: 'https://fipi.ru/ege/demoversii-specifikacii-kodifikatory', title: 'Демоверсия ЕГЭ 2026 — ФИПИ', text: 'Образец настоящего варианта с ответами и критериями.' },
    { href: 'https://hist-ege.sdamgia.ru/', title: 'Решу ЕГЭ — история', text: 'Каталог заданий по номерам и тренировочные варианты.' },
  ],
  oge: [
    { href: 'https://fipi.ru/oge/otkrytyy-bank-zadaniy-oge', title: 'Открытый банк заданий ОГЭ — ФИПИ', text: 'Официальные задания, которые могут встретиться на экзамене.' },
    { href: 'https://fipi.ru/oge/demoversii-specifikacii-kodifikatory', title: 'Демоверсия ОГЭ 2026 — ФИПИ', text: 'Образец настоящего варианта с ответами и критериями.' },
    { href: 'https://hist-oge.sdamgia.ru/', title: 'Решу ОГЭ — история', text: 'Каталог заданий по номерам и тренировочные варианты.' },
  ],
}

export default function ExamHub() {
  const [params, setParams] = useSearchParams()
  const exam = EXAMS[params.get('e')] ? params.get('e') : 'ege'
  const navigate = useNavigate()
  const [progress] = useState(loadProgress)
  const [size, setSize] = useState(20)
  const info = EXAM_INFO[exam]

  useEffect(() => {
    document.title = 'Подготовка к ЕГЭ и ОГЭ — История за 5 минут'
    return () => {
      document.title = 'История за 5 минут'
    }
  }, [])

  const periods = useMemo(
    () =>
      PERIODS.map((p) => {
        const inP = tasksFor({ exam, period: p.id })
        const topicIds = [...new Set(inP.map((t) => t.topic))]
        return {
          ...p,
          count: inP.length,
          topics: topicIds.map((id) => ({ id, title: inP.find((t) => t.topic === id).topicTitle, count: inP.filter((t) => t.topic === id).length })),
        }
      }).filter((p) => p.count > 0),
    [exam]
  )

  return (
    <div className="container container--narrow simple-page">
      <header className="simple-head">
        <h1>ЕГЭ и ОГЭ</h1>
        <p className="lead-muted">Тренируйся по номерам заданий, решай варианты и смотри разбор каждой ошибки.</p>
        <div className="seg" role="tablist" aria-label="Экзамен">
          {Object.values(EXAMS).map((e) => (
            <button
              key={e.id}
              type="button"
              role="tab"
              aria-selected={exam === e.id}
              className={exam === e.id ? 'is-active' : ''}
              onClick={() => setParams({ e: e.id }, { replace: true })}
            >
              {e.title}
            </button>
          ))}
        </div>
        <p className="lead-muted small">
          {exam === 'oge' ? 'ОГЭ — 9 класс, история России до 1914 г.' : 'ЕГЭ — 11 класс, весь курс истории России.'}
        </p>
      </header>

      <KimConstructor key={exam} exam={exam} progress={progress} />

      <section className="simple-section">
        <h2>Варианты</h2>
        <ul className="plain-list">
          <li>
            <button
              type="button"
              className="plain-row"
              onClick={() => navigate(`/exam/practice?exam=${exam}&pick=${KIM_PART1[exam]}&mode=exam&seed=${Date.now()}`)}
            >
              <span>
                Как на экзамене
                <small className="plain-row__sub">Часть 1 по порядку номеров КИМ, с таймером</small>
              </span>
              <ChevronRight size={18} />
            </button>
          </li>
          <li>
            <div className="plain-row plain-row--static">
              <span>
                Случайный набор
                <small className="plain-row__sub">Задания из всех тем вперемешку</small>
              </span>
              <span className="plain-row__meta">
                <select value={size} onChange={(e) => setSize(Number(e.target.value))} aria-label="Количество заданий" className="mini-select">
                  {[10, 20, 30].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <button type="button" className="btn btn--primary btn--sm" onClick={() => navigate(`/exam/practice?exam=${exam}&n=${size}&seed=${Date.now()}`)}>
                  Начать
                </button>
              </span>
            </div>
          </li>
        </ul>
      </section>

      <section className="simple-section">
        <h2>По темам</h2>
        <p className="lead-muted small">Разделы как в кодификаторе ФИПИ — по историческим периодам.</p>
        <div className="acc">
          {periods.map((p) => (
            <details key={p.id} className="acc__item">
              <summary>
                <span>
                  {p.title}
                  <small className="plain-row__sub">{p.range}</small>
                </span>
                <span className="plain-row__meta">{p.count}</span>
              </summary>
              <div className="acc__body">
                <Link to={`/exam/practice?exam=${exam}&period=${p.id}&n=${Math.min(20, p.count)}&seed=${Date.now()}`} className="text-link">
                  Вариант по периоду · {Math.min(20, p.count)} заданий <ChevronRight size={16} />
                </Link>
                <ul className="plain-list plain-list--compact">
                  {p.topics.map((t) => (
                    <li key={t.id}>
                      <Link to={`/exam/practice?exam=${exam}&topic=${t.id}`} className="plain-row">
                        <span>{t.title}</span>
                        <span className="plain-row__meta">{t.count}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="simple-section">
        <h2>Реальные задания</h2>
        <p className="lead-muted small">
          Задания на этом сайте составлены по образцу ФИПИ и по материалу курса. Настоящие экзаменационные задания — в
          открытом банке ФИПИ и на «Решу ЕГЭ / ОГЭ».
        </p>
        <ul className="plain-list">
          {REAL_TASKS[exam].map((r) => (
            <li key={r.href}>
              <a href={r.href} target="_blank" rel="noopener noreferrer" className="plain-row">
                <span>
                  {r.title}
                  <small className="plain-row__sub">{r.text}</small>
                </span>
                <ExternalLink size={17} />
              </a>
            </li>
          ))}
        </ul>
      </section>

      {info && (
        <details className="acc__item acc__item--solo">
          <summary>
            <span>Как устроен {EXAMS[exam].title} по истории</span>
          </summary>
          <div className="acc__body">
            <p className="lead-muted small">{info.facts.map((f) => `${f.value} — ${f.label}`).join(' · ')}</p>
            <p className="lead-muted small">{info.note}</p>
            <ul className="plain-list plain-list--compact">
              {info.tasks.map((t) => (
                <li key={t.n}>
                  <div className="plain-row plain-row--static">
                    <span>
                      № {t.n}. {t.text}
                    </span>
                    <span className="plain-row__meta">{t.points} б.</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </details>
      )}
    </div>
  )
}

// Выбор номеров КИМ и количества заданий каждого
function KimConstructor({ exam, progress }) {
  const navigate = useNavigate()
  const [counts, setCounts] = useState({})
  const lines = useMemo(
    () =>
      EXAM_LINES[exam]
        .map((l) => {
          const list = tasksFor({ exam, line: l.id })
          return { ...l, total: list.length, solved: list.filter((t) => progress['exam:' + t.id]).length }
        })
        .filter((l) => l.total > 0),
    [exam, progress]
  )

  const setCount = (id, value, max) => setCounts((c) => ({ ...c, [id]: Math.max(0, Math.min(max, value)) }))
  const selected = lines.filter((l) => counts[l.id] > 0)
  const totalSelected = selected.reduce((s, l) => s + counts[l.id], 0)
  const start = (pickList) =>
    navigate(`/exam/practice?exam=${exam}&pick=${pickList.map((p) => `${p.id}:${p.k}`).join(',')}&seed=${Date.now()}`)

  return (
    <section className="simple-section">
      <h2>Задания по номерам</h2>
      <p className="lead-muted small">Выбери номер задания и сколько штук решать — например, 3 задания № 1.</p>
      <ul className="plain-list">
        {lines.map((l) => {
          const value = counts[l.id] ?? 0
          const max = Math.min(30, l.total)
          return (
            <li key={l.id}>
              <div className={'plain-row plain-row--static kim-line' + (value > 0 ? ' is-selected' : '')}>
                <span>
                  <span className="kim-line__n">{l.n === '+' ? 'Доп.' : `№ ${l.n}`}</span>
                  {l.title}
                  <small className="plain-row__sub">
                    в банке {l.total}
                    {l.solved > 0 && ` · решено ${l.solved}`}
                  </small>
                </span>
                <span className="plain-row__meta">
                  <span className="stepper" role="group" aria-label={`Количество: ${l.title}`}>
                    <button type="button" onClick={() => setCount(l.id, value - 1, max)} disabled={value === 0} aria-label="Меньше">
                      <Minus size={15} />
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
                      <Plus size={15} />
                    </button>
                  </span>
                </span>
              </div>
            </li>
          )
        })}
      </ul>
      <div className="kim-bottom">
        <span className="lead-muted small">
          {totalSelected ? `Выбрано ${totalSelected} ${plural(totalSelected, ['задание', 'задания', 'заданий'])}` : 'Ничего не выбрано'}
        </span>
        <button type="button" className="btn btn--primary" disabled={!totalSelected} onClick={() => start(selected.map((l) => ({ id: l.id, k: counts[l.id] })))}>
          Решать
        </button>
      </div>
    </section>
  )
}
