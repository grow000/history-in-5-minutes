import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { events, eventsById, ERAS } from '../data/index.js'
import { loadProgress, saveResult } from '../progress.js'
import NotFound from './NotFound.jsx'

const LETTERS = ['А', 'Б', 'В', 'Г']

// Перемешиваем варианты, чтобы правильный ответ нельзя было запомнить по позиции
function prepare(quiz) {
  return quiz.map((q) => {
    const order = q.options.map((_, i) => i)
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[order[i], order[j]] = [order[j], order[i]]
    }
    return {
      ...q,
      options: order.map((i) => q.options[i]),
      answer: order.indexOf(q.answer),
    }
  })
}

function verdict(score, total) {
  const ratio = score / total
  if (ratio === 1) return { title: 'Блестяще!', text: 'Все ответы верные — ты отлично разобрался в теме.', emoji: '🏆' }
  if (ratio >= 0.8) return { title: 'Отлично!', text: 'Почти идеально. Загляни в разбор ошибки ниже.', emoji: '🎉' }
  if (ratio >= 0.6) return { title: 'Хороший результат', text: 'Основное понятно. Перечитай пару разделов — и будет 5 из 5.', emoji: '👍' }
  return { title: 'Стоит повторить', text: 'Перечитай конспект ещё раз — это займёт всего пару минут.', emoji: '📚' }
}

export default function QuizPage({ id }) {
  const event = eventsById[id]
  if (!event) return <NotFound text="Викторина для этого события не найдена." />
  return <Quiz event={event} />
}

function Quiz({ event }) {
  const era = ERAS[event.era]
  const [questions, setQuestions] = useState(() => prepare(event.quiz))
  const [step, setStep] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answers, setAnswers] = useState([])
  const [finished, setFinished] = useState(false)
  const [prevBest, setPrevBest] = useState(() => loadProgress()[event.id]?.best)

  const total = questions.length
  const current = questions[step]
  const score = answers.filter((a) => a.correct).length

  useEffect(() => {
    document.title = `Викторина: ${event.title} — История за 5 минут`
    return () => {
      document.title = 'История за 5 минут'
    }
  }, [event.title])

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
      saveResult(event.id, answers.filter((a) => a.correct).length, total)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [selected, step, total, answers, event.id])

  const restart = () => {
    setPrevBest(loadProgress()[event.id]?.best)
    setQuestions(prepare(event.quiz))
    setStep(0)
    setSelected(null)
    setAnswers([])
    setFinished(false)
  }

  // Клавиатура: 1–4 — выбор ответа, Enter — дальше
  useEffect(() => {
    const onKey = (e) => {
      if (finished) return
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

  const idx = events.findIndex((e) => e.id === event.id)
  const nextEvent = events[idx + 1] ?? events[0]

  if (finished) {
    const v = verdict(score, total)
    const R = 52
    const C = 2 * Math.PI * R
    return (
      <div className="quiz-page" style={{ '--era': era.color }}>
        <div className="container container--narrow">
          <div className="result">
            <div className="result__emoji" aria-hidden="true">{v.emoji}</div>
            <div className="ring" role="img" aria-label={`Результат: ${score} из ${total}`}>
              <svg viewBox="0 0 120 120" width="150" height="150">
                <circle cx="60" cy="60" r={R} className="ring__bg" />
                <circle
                  cx="60"
                  cy="60"
                  r={R}
                  className="ring__fg"
                  strokeDasharray={C}
                  style={{ '--offset': C * (1 - score / total), '--full': C }}
                />
              </svg>
              <div className="ring__label">
                <b>{score}</b>
                <span>из {total}</span>
              </div>
            </div>
            <h1 className="result__title">{v.title}</h1>
            <p className="result__text">{v.text}</p>
            {prevBest !== undefined && score > prevBest && <p className="result__record">🔥 Новый личный рекорд!</p>}
            <div className="result__actions">
              <button type="button" className="btn btn--primary" onClick={restart}>
                Пройти ещё раз
              </button>
              <Link to={`/event/${event.id}`} className="btn btn--soft">
                Перечитать конспект
              </Link>
              <Link to={`/event/${nextEvent.id}`} className="btn btn--ghost">
                Следующее событие →
              </Link>
            </div>
          </div>

          <h2 className="review__title">Разбор ответов</h2>
          <ol className="review">
            {questions.map((q, i) => {
              const a = answers[i]
              return (
                <li key={i} className={'review__item ' + (a.correct ? 'is-correct' : 'is-wrong')}>
                  <div className="review__q">
                    <span className="review__mark" aria-label={a.correct ? 'Верно' : 'Неверно'}>
                      {a.correct ? '✓' : '✕'}
                    </span>
                    {q.question}
                  </div>
                  {!a.correct && (
                    <div className="review__line review__line--wrong">Твой ответ: {q.options[a.chosen]}</div>
                  )}
                  <div className="review__line review__line--right">Правильно: {q.options[q.answer]}</div>
                  {q.explanation && <p className="review__exp">{q.explanation}</p>}
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
    <div className="quiz-page" style={{ '--era': era.color }}>
      <div className="container container--narrow">
        <div className="quiz-head">
          <Link to={`/event/${event.id}`} className="back-link">
            ← {event.title}
          </Link>
          <div className="quiz-progress">
            <div className="quiz-progress__text">
              Вопрос {step + 1} из {total}
            </div>
            <div className="quiz-progress__dots">
              {questions.map((_, i) => (
                <span
                  key={i}
                  className={
                    'dot' +
                    (i < answers.length ? (answers[i].correct ? ' dot--ok' : ' dot--bad') : '') +
                    (i === step ? ' dot--current' : '')
                  }
                />
              ))}
            </div>
          </div>
        </div>

        <div className="question" key={step}>
          <div className="question__badge">
            {event.emoji} Викторина
          </div>
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
                <button
                  key={i}
                  type="button"
                  className={'option' + state}
                  onClick={() => choose(i)}
                  disabled={selected !== null}
                  style={{ '--i': i }}
                >
                  <span className="option__letter">{LETTERS[i]}</span>
                  <span className="option__text">{opt}</span>
                  {selected !== null && i === current.answer && <span className="option__icon" aria-hidden="true">✓</span>}
                  {selected === i && i !== current.answer && <span className="option__icon" aria-hidden="true">✕</span>}
                </button>
              )
            })}
          </div>

          {selected !== null && (
            <div className={'feedback ' + (isCorrect ? 'feedback--ok' : 'feedback--bad')} role="status">
              <div className="feedback__title">{isCorrect ? 'Верно!' : 'Не совсем'}</div>
              {current.explanation && <p>{current.explanation}</p>}
              <button type="button" className="btn btn--primary" onClick={next} autoFocus>
                {step + 1 < total ? 'Следующий вопрос →' : 'Узнать результат'}
              </button>
            </div>
          )}
        </div>
        <p className="quiz-hint">Подсказка: можно отвечать клавишами 1–4 и переходить дальше по Enter.</p>
      </div>
    </div>
  )
}
