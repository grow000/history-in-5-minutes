import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen } from 'lucide-react'
import QuizRunner from '../components/QuizRunner.jsx'
import { events, eventsById, ERAS, normalize } from '../data/index.js'
import { loadProgress, saveResult } from '../progress.js'
import NotFound from './NotFound.jsx'

export const EVENT_SECTIONS = {
  what: 'Что произошло',
  causes: 'Причины',
  course: 'Ход событий',
  people: 'Ключевые личности',
  timeline: 'Хронология',
  facts: 'Важные факты',
  meaning: 'Значение',
}

// Ищем раздел конспекта, где упоминается правильный ответ, — туда и отправляем повторять
function findSection(event, answer) {
  const needle = normalize(answer).replace(/[«»"().,]/g, '').trim()
  const words = needle.split(/\s+/).filter((w) => w.length > 3)
  const sources = {
    people: event.people.map((p) => p.name + ' ' + p.role).join(' '),
    timeline: event.timeline.map((t) => t.date + ' ' + t.text).join(' '),
    causes: event.causes.join(' '),
    course: event.course.join(' '),
    facts: event.facts.join(' '),
    what: event.whatHappened,
    meaning: event.significance,
  }
  let best = 'what'
  let bestScore = 0
  for (const [key, text] of Object.entries(sources)) {
    const hay = normalize(text)
    if (needle && hay.includes(needle)) return key
    const score = words.filter((w) => hay.includes(w.slice(0, Math.max(4, w.length - 2)))).length
    if (score > bestScore) {
      bestScore = score
      best = key
    }
  }
  return best
}

export default function QuizPage({ id }) {
  const event = eventsById[id]
  if (!event) return <NotFound text="Викторина для этого события не найдена." />
  return <EventQuiz event={event} />
}

function EventQuiz({ event }) {
  const era = ERAS[event.era]
  const [prevBest] = useState(() => loadProgress()[event.id]?.best)

  useEffect(() => {
    document.title = `Викторина: ${event.title} — История за 5 минут`
    return () => {
      document.title = 'История за 5 минут'
    }
  }, [event.title])

  const questions = useMemo(
    () =>
      event.quiz.map((q) => {
        const section = findSection(event, q.options[q.answer])
        return { ...q, review: { label: `«${EVENT_SECTIONS[section]}» — ${event.title}`, to: `/event/${event.id}?s=${section}` } }
      }),
    [event]
  )

  const idx = events.findIndex((e) => e.id === event.id)
  const nextEvent = events[idx + 1] ?? events[0]

  return (
    <QuizRunner
      questions={questions}
      accent={era.color}
      badge={`${event.emoji} Викторина`}
      back={{ to: `/event/${event.id}`, label: event.title }}
      prevBest={prevBest}
      onFinish={(score, total) => saveResult(event.id, score, total)}
      extraActions={
        <>
          <Link to={`/event/${event.id}`} className="btn btn--soft">
            <BookOpen size={18} /> Перечитать конспект
          </Link>
          <Link to={`/event/${nextEvent.id}`} className="btn btn--ghost">
            Следующее событие <ArrowRight size={18} />
          </Link>
        </>
      }
    />
  )
}
