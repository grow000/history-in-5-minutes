import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, BookOpen, Check, RotateCcw, Trophy, X } from 'lucide-react'

const LETTERS = ['А', 'Б', 'В', 'Г', 'Д', 'Е']

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Перемешиваем варианты, чтобы правильный ответ нельзя было запомнить по позиции
function prepare(questions) {
  return questions.map((q) => {
    const order = shuffle(q.options.map((_, i) => i))
    return { ...q, options: order.map((i) => q.options[i]), answer: order.indexOf(q.answer) }
  })
}

function verdict(ratio) {
  if (ratio === 1) return { title: 'Блестяще!', text: 'Все ответы верные — ты отлично разобрался в теме.' }
  if (ratio >= 0.8) return { title: 'Отлично!', text: 'Почти идеально. Посмотри разбор ошибки ниже.' }
  if (ratio >= 0.6) return { title: 'Хороший результат', text: 'Основное понятно. Повтори материал по ошибкам — и будет максимум.' }
  return { title: 'Стоит повторить', text: 'Пройди дополнительный материал по вопросам с ошибками и попробуй ещё раз.' }
}

/**
 * Универсальная викторина.
 * questions: [{ question, options, answer, explanation, review?: { label, to } }]
 */
export default function QuizRunner({ questions: source, accent, badge, back, prevBest, onFinish, extraActions }) {
  const [questions, setQuestions] = useState(() => prepare(source))
  const [step, setStep] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answers, setAnswers] = useState([])
  const [finished, setFinished] = useState(false)
  const [best, setBest] = useState(prevBest)

  const total = questions.length
  const current = questions[step]
  const score = answers.filter((a) => a.correct).length

  const choose = useCallback(
    (i) => {
      if (selected !== null || finished) return
      setSelected(i)
      setAnswers((prev) => [...prev, { chosen: i, correct: i === current.answer }])
    },
    [selected, finished, current]
  )

  const next = useCallback(() => {
    if (selected === null) return
    if (step + 1 < total) {
      setStep(step + 1)
      setSelected(null)
    } else {
      setFinished(true)
      onFinish?.(answers.filter((a) => a.correct).length, total)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [selected, step, total, answers, onFinish])

  const restart = () => {
    setBest((b) => Math.max(b ?? 0, score))
    setQuestions(prepare(source))
    setStep(0)
    setSelected(null)
    setAnswers([])
    setFinished(false)
  }

  useEffect(() => {
    const onKey = (e) => {
      if (finished || e.target.tagName === 'INPUT') return
      const n = Number(e.key)
      if (n >= 1 && n <= current.options.length) choose(n - 1)
      if (e.key === 'Enter' && selected !== null) {
        e.preventDefault()
        next()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [choose, next, current, selected, finished])

  // Уникальные материалы для повторения по ошибкам
  const toReview = useMemo(() => {
    const seen = new Map()
    questions.forEach((q, i) => {
      if (answers[i] && !answers[i].correct && q.review && !seen.has(q.review.to)) seen.set(q.review.to, q.review)
    })
    return [...seen.values()]
  }, [answers, questions])

  if (finished) {
    const v = verdict(score / total)
    const R = 52
    const C = 2 * Math.PI * R
    return (
      <div className="quiz-page" style={{ '--era': accent }}>
        <div className="container container--narrow">
          <motion.div className="result" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
            <div className="result__icon" aria-hidden="true">
              <Trophy size={30} />
            </div>
            <div className="ring" role="img" aria-label={`Результат: ${score} из ${total}`}>
              <svg viewBox="0 0 120 120" width="150" height="150">
                <circle cx="60" cy="60" r={R} className="ring__bg" />
                <circle cx="60" cy="60" r={R} className="ring__fg" strokeDasharray={C} style={{ '--offset': C * (1 - score / total), '--full': C }} />
              </svg>
              <div className="ring__label">
                <b>{score}</b>
                <span>из {total}</span>
              </div>
            </div>
            <h1 className="result__title">{v.title}</h1>
            <p className="result__text">{v.text}</p>
            {best !== undefined && best !== null && score > best && <p className="result__record">Новый личный рекорд!</p>}
            <div className="result__actions">
              <button type="button" className="btn btn--primary" onClick={restart}>
                <RotateCcw size={18} /> Пройти ещё раз
              </button>
              {extraActions}
            </div>
          </motion.div>

          {toReview.length > 0 && (
            <section className="review-plan">
              <h2>
                <BookOpen size={22} /> Дополнительный материал по ошибкам
              </h2>
              <p className="muted">Повтори эти разделы — в них есть ответы на вопросы, где были ошибки.</p>
              <div className="review-plan__list">
                {toReview.map((r) => (
                  <Link key={r.to} to={r.to} className="review-plan__item">
                    <span>{r.label}</span>
                    <ArrowRight size={18} />
                  </Link>
                ))}
              </div>
            </section>
          )}

          <h2 className="review__title">Разбор ответов</h2>
          <ol className="review">
            {questions.map((q, i) => {
              const a = answers[i]
              return (
                <li key={i} className={'review__item ' + (a.correct ? 'is-correct' : 'is-wrong')} style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="review__q">
                    <span className="review__mark" aria-label={a.correct ? 'Верно' : 'Неверно'}>
                      {a.correct ? <Check size={14} /> : <X size={14} />}
                    </span>
                    {q.question}
                  </div>
                  {!a.correct && <div className="review__line review__line--wrong">Твой ответ: {q.options[a.chosen]}</div>}
                  <div className="review__line review__line--right">Правильно: {q.options[q.answer]}</div>
                  {q.explanation && (
                    <p className="review__exp">
                      <b>Почему: </b>
                      {q.explanation}
                    </p>
                  )}
                  {!a.correct && q.review && (
                    <Link to={q.review.to} className="review__more">
                      <BookOpen size={15} /> Повторить: {q.review.label}
                    </Link>
                  )}
                </li>
              )
            })}
          </ol>
        </div>
      </div>
    )
  }

  const isCorrect = selected !== null && selected === current.answer

  return (
    <div className="quiz-page" style={{ '--era': accent }}>
      <div className="container container--narrow">
        <div className="quiz-head">
          {back && (
            <Link to={back.to} className="back-link">
              <ArrowLeft size={16} /> {back.label}
            </Link>
          )}
          <div className="quiz-progress">
            <div className="quiz-progress__text">
              Вопрос {step + 1} из {total}
            </div>
            <div className="quiz-progress__dots">
              {questions.map((_, i) => (
                <span
                  key={i}
                  className={'dot' + (i < answers.length ? (answers[i].correct ? ' dot--ok' : ' dot--bad') : '') + (i === step ? ' dot--current' : '')}
                />
              ))}
            </div>
          </div>
          <div className="quiz-bar" aria-hidden="true">
            <motion.span initial={{ width: 0 }} animate={{ width: `${((step + (selected !== null ? 1 : 0)) / total) * 100}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
          </div>
        </div>

        <>
          <motion.div
            className="question"
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {badge && <div className="question__badge">{badge}</div>}
            <h1 className="question__text">{current.question}</h1>
            <div className="options" role="group" aria-label="Варианты ответа">
              {current.options.map((opt, i) => {
                let state = ''
                if (selected !== null) {
                  if (i === current.answer) state = ' is-correct'
                  else if (i === selected) state = ' is-wrong'
                  else state = ' is-dim'
                }
                return (
                  <button key={i} type="button" className={'option' + state} onClick={() => choose(i)} disabled={selected !== null} style={{ '--i': i }}>
                    <span className="option__letter">{LETTERS[i]}</span>
                    <span className="option__text">{opt}</span>
                    {selected !== null && i === current.answer && <Check className="option__icon" size={20} aria-hidden="true" />}
                    {selected === i && i !== current.answer && <X className="option__icon" size={20} aria-hidden="true" />}
                  </button>
                )
              })}
            </div>

            {selected !== null && (
              <motion.div
                className={'feedback ' + (isCorrect ? 'feedback--ok' : 'feedback--bad')}
                role="status"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="feedback__title">{isCorrect ? 'Верно!' : 'Не совсем'}</div>
                {!isCorrect && (
                  <p>
                    Правильный ответ: <b>{current.options[current.answer]}</b>
                  </p>
                )}
                {current.explanation && <p>{current.explanation}</p>}
                {!isCorrect && current.review && (
                  <Link to={current.review.to} className="feedback__more" target="_blank" rel="noopener">
                    <BookOpen size={15} /> Доп. материал: {current.review.label}
                  </Link>
                )}
                <button type="button" className="btn btn--primary" onClick={next} autoFocus>
                  {step + 1 < total ? 'Следующий вопрос' : 'Узнать результат'} <ArrowRight size={18} />
                </button>
              </motion.div>
            )}
          </motion.div>
        </>
        <p className="quiz-hint">Подсказка: можно отвечать клавишами 1–{current.options.length} и переходить дальше по Enter.</p>
      </div>
    </div>
  )
}
