import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCheck, RotateCcw, X } from 'lucide-react'
import LazyMap from '../components/LazyMap.jsx'
import { checkTask, coursesById, EXAMS, formatAnswer, maxPoints, TASK_TYPES, tasksFor, topicsById } from '../data/course.js'
import { plural } from '../data/index.js'
import { saveResult } from '../progress.js'

const LETTERS = ['А', 'Б', 'В', 'Г', 'Д']

function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pick(list, n, seed) {
  const rand = rng(seed)
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return n ? a.slice(0, n) : a
}

export default function ExamPractice() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const exam = EXAMS[params.get('exam')] ? params.get('exam') : null
  const course = params.get('course')
  const topic = params.get('topic')
  const type = params.get('type')
  const n = Number(params.get('n')) || 0
  const seed = Number(params.get('seed')) || 1
  const only = params.get('ids')

  const list = useMemo(() => {
    if (only) return only.split(',').map((id) => tasksFor({}).find((t) => t.id === id)).filter(Boolean)
    const pool = tasksFor({ exam, course, topic, type })
    const picked = pick(pool, n, seed)
    // вариант: упорядочиваем по типу, как в КИМ
    const order = Object.keys(TASK_TYPES)
    return n ? picked.sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type)) : picked
  }, [exam, course, topic, type, n, seed, only])

  const [answers, setAnswers] = useState({})
  const [checked, setChecked] = useState(false)
  const topRef = useRef(null)

  useEffect(() => {
    setAnswers({})
    setChecked(false)
  }, [list])

  const title = topic
    ? topicsById[topic]?.title
    : course
      ? coursesById[course]?.title
      : type
        ? TASK_TYPES[type]?.title
        : n
          ? `Вариант из ${n} заданий`
          : 'Тренировка'

  useEffect(() => {
    document.title = `${title} — ЕГЭ и ОГЭ — История за 5 минут`
    return () => {
      document.title = 'История за 5 минут'
    }
  }, [title])

  const results = useMemo(() => (checked ? list.map((t) => checkTask(t, answers[t.id] ?? '')) : []), [checked, list, answers])
  const score = results.reduce((s, r) => s + r.points, 0)
  const max = list.reduce((s, t) => s + maxPoints(t), 0)
  const answered = list.filter((t) => (answers[t.id] ?? '').trim()).length

  const check = () => {
    setChecked(true)
    list.forEach((t) => {
      const r = checkTask(t, answers[t.id] ?? '')
      saveResult('exam:' + t.id, r.points, r.max)
    })
    setTimeout(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  const wrong = checked ? list.filter((t, i) => results[i].points < results[i].max) : []
  const reviewTopics = [...new Map(wrong.map((t) => [t.topic, topicsById[t.topic]])).values()].filter(Boolean)

  const backTo = exam ? `/exam?e=${exam}` : topic ? `/topic/${topic}` : '/exam'

  if (!list.length) {
    return (
      <div className="container not-found">
        <h1>Заданий не найдено</h1>
        <p>Для выбранных условий в банке пока нет заданий.</p>
        <Link to="/exam" className="btn btn--primary">
          К разделу ЕГЭ и ОГЭ
        </Link>
      </div>
    )
  }

  return (
    <div className="practice" style={{ '--era': exam ? EXAMS[exam].color : '#4f46e5' }}>
      <div className="container container--narrow">
        <Link to={backTo} className="back-link">
          <ArrowLeft size={16} /> Назад
        </Link>
        <div className="practice__head" ref={topRef}>
          <span className="pill">{exam ? EXAMS[exam].title : 'ЕГЭ и ОГЭ'} · тренировка</span>
          <h1 className="practice__title">{title}</h1>
          <p className="muted">
            {list.length} {plural(list.length, ['задание', 'задания', 'заданий'])} · максимум {max}{' '}
            {plural(max, ['балл', 'балла', 'баллов'])}. Ответы проверяются по правилам ЕГЭ: в заданиях на соответствие и
            выбор нескольких верных одна ошибка — 1 балл из 2.
          </p>
        </div>

        <AnimatePresence>
          {checked && (
            <motion.section className="practice-result" initial={{ opacity: 0, y: -12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}>
              <div className="practice-result__score">
                <b>{score}</b>
                <span>из {max}</span>
              </div>
              <div className="practice-result__text">
                <h2>{score === max ? 'Всё верно!' : score / max >= 0.7 ? 'Хороший результат' : 'Есть над чем поработать'}</h2>
                <p>
                  Верно решено {results.filter((r) => r.points === r.max).length} из {list.length}. Ниже — разбор каждого
                  задания.
                </p>
                <div className="practice-result__actions">
                  {wrong.length > 0 && (
                    <button type="button" className="btn btn--primary" onClick={() => navigate(`/exam/practice?ids=${wrong.map((t) => t.id).join(',')}`)}>
                      <RotateCcw size={17} /> Прорешать ошибки
                    </button>
                  )}
                  <button type="button" className="btn btn--soft" onClick={() => navigate(`/exam/practice?${new URLSearchParams({ ...Object.fromEntries(params), seed: String(Date.now()) })}`)}>
                    Новый набор
                  </button>
                </div>
              </div>
              {reviewTopics.length > 0 && (
                <div className="review-plan review-plan--inline">
                  <h3>
                    <BookOpen size={18} /> Повтори темы
                  </h3>
                  <div className="review-plan__list">
                    {reviewTopics.map((t) => (
                      <Link key={t.id} to={`/topic/${t.id}`} className="review-plan__item">
                        <span>{t.title}</span>
                        <ArrowRight size={17} />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>

        <ol className="tasks">
          {list.map((t, i) => (
            <TaskCard
              key={t.id}
              task={t}
              index={i + 1}
              value={answers[t.id] ?? ''}
              onChange={(v) => setAnswers((a) => ({ ...a, [t.id]: v }))}
              result={checked ? results[i] : null}
            />
          ))}
        </ol>

        {!checked && (
          <div className="practice-bar">
            <span>
              Ответов: {answered} из {list.length}
            </span>
            <button type="button" className="btn btn--primary" onClick={check}>
              <CheckCheck size={18} /> Проверить
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function TaskCard({ task, index, value, onChange, result }) {
  const status = result ? (result.points === result.max ? 'ok' : result.points > 0 ? 'part' : 'bad') : null
  const topic = topicsById[task.topic]

  return (
    <motion.li
      data-task={task.id}
      className={'task' + (status ? ` task--${status}` : '')}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -40px 0px' }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="task__head">
        <span className="task__num">{index}</span>
        <span className="task__type">{TASK_TYPES[task.type]?.title}</span>
        <span className="task__exam">{task.exam.map((e) => EXAMS[e].title).join(' · ')}</span>
        {result && (
          <span className={`task__points task__points--${status}`}>
            {status === 'ok' ? <Check size={14} /> : status === 'bad' ? <X size={14} /> : null}
            {result.points}/{result.max}
          </span>
        )}
      </div>

      <p className="task__text">{task.text}</p>

      {task.map && (
        <div className="task__map">
          <LazyMap map={{ ...task.map, quiz: true }} />
        </div>
      )}

      {(task.type === 'single' || task.type === 'multi' || (task.type === 'map' && task.options)) && (
        <ol className="task__options">
          {task.options.map((o, i) => (
            <li key={i}>
              <span className="task__opt-n">{i + 1}</span>
              {o}
            </li>
          ))}
        </ol>
      )}

      {task.type === 'sequence' && (
        <ol className="task__options">
          {task.items.map((o, i) => (
            <li key={i}>
              <span className="task__opt-n">{i + 1}</span>
              {o}
            </li>
          ))}
        </ol>
      )}

      {task.type === 'match' && (
        <div className="task__match">
          <div>
            <div className="task__match-h">{task.leftTitle ?? 'Позиции'}</div>
            <ul>
              {task.left.map((o, i) => (
                <li key={i}>
                  <span className="task__opt-n">{LETTERS[i]}</span>
                  {o}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="task__match-h">{task.rightTitle ?? 'Варианты'}</div>
            <ul>
              {task.right.map((o, i) => (
                <li key={i}>
                  <span className="task__opt-n">{i + 1}</span>
                  {o}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="task__answer">
        {task.type === 'match' ? (
          <MatchInput count={task.left.length} value={value} onChange={onChange} disabled={!!result} />
        ) : (
          <label className="task__field">
            <span>Ответ:</span>
            <input
              type="text"
              inputMode={task.type === 'term' || (task.type === 'map' && task.accept) ? 'text' : 'numeric'}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              disabled={!!result}
              placeholder={task.type === 'term' || (task.type === 'map' && task.accept) ? 'слово или словосочетание' : 'цифры без пробелов'}
              autoComplete="off"
            />
          </label>
        )}
      </div>

      {result && (
        <motion.div className="task__solution" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
          <div>
            <b>Правильный ответ:</b> {formatAnswer(task)}
          </div>
          {task.explanation && <p>{task.explanation}</p>}
          {topic && (
            <Link to={`/topic/${topic.id}`} className="review__more">
              <BookOpen size={15} /> Материал: {topic.title}
            </Link>
          )}
        </motion.div>
      )}
    </motion.li>
  )
}

function MatchInput({ count, value, onChange, disabled }) {
  const cells = Array.from({ length: count }, (_, i) => value[i] ?? '')
  const refs = useRef([])
  const set = (i, v) => {
    const d = v.replace(/[^0-9]/g, '').slice(-1)
    const next = cells.map((c, j) => (j === i ? d : c || ' ')).join('').replace(/\s+$/, '')
    onChange(next)
    if (d && i < count - 1) refs.current[i + 1]?.focus()
  }
  return (
    <div className="match-input" role="group" aria-label="Ответ: цифры для каждой буквы">
      <span>Ответ:</span>
      {cells.map((c, i) => (
        <label key={i} className="match-input__cell">
          <span>{LETTERS[i]}</span>
          <input
            ref={(el) => (refs.current[i] = el)}
            inputMode="numeric"
            maxLength={1}
            value={c.trim()}
            onChange={(e) => set(i, e.target.value)}
            disabled={disabled}
            aria-label={`Цифра для ${LETTERS[i]}`}
          />
        </label>
      ))}
    </div>
  )
}
