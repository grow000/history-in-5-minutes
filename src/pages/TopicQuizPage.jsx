import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, GraduationCap } from 'lucide-react'
import QuizRunner from '../components/QuizRunner.jsx'
import { coursesById, neighbours, tasksFor, topicsById } from '../data/course.js'
import { loadProgress, saveResult } from '../progress.js'
import NotFound from './NotFound.jsx'

// Куда отправить повторять материал по вопросу теста
export function reviewLink(topic, sectionKey) {
  const base = `/topic/${topic.id}`
  if (sectionKey === 'terms') return { to: `${base}?s=terms`, label: `Термины — ${topic.title}` }
  if (sectionKey === 'dates') return { to: `${base}?s=dates`, label: `Главные даты — ${topic.title}` }
  if (sectionKey === 'people') return { to: `${base}?s=people`, label: `Личности — ${topic.title}` }
  if (sectionKey === 'map' && topic.map) return { to: `${base}?s=map`, label: `Карта — ${topic.title}` }
  if (sectionKey === 'table' && topic.table) return { to: `${base}?s=table`, label: `Таблица — ${topic.title}` }
  if (sectionKey === 'facts') return { to: `${base}?s=facts`, label: `Интересные факты — ${topic.title}` }
  if (sectionKey === 'significance') return { to: `${base}?s=significance`, label: `Итоги и значение — ${topic.title}` }
  const s = topic.sections.find((x) => x.id === sectionKey)
  if (s) return { to: `${base}?s=${s.id}`, label: `«${s.title}» — ${topic.title}` }
  return { to: base, label: `Конспект — ${topic.title}` }
}

export default function TopicQuizPage({ id }) {
  const topic = topicsById[id]
  if (!topic) return <NotFound text="Тест для этой темы не найден." />
  return <TopicQuiz topic={topic} />
}

function TopicQuiz({ topic }) {
  const course = coursesById[topic.course]
  const key = 'topic:' + topic.id
  const [prevBest] = useState(() => loadProgress()[key]?.best)
  const { next } = neighbours(topic.id)
  const examCount = tasksFor({ topic: topic.id }).length

  useEffect(() => {
    document.title = `Тест: ${topic.title} — История за 5 минут`
    return () => {
      document.title = 'История за 5 минут'
    }
  }, [topic.title])

  const questions = useMemo(() => topic.quiz.map((q) => ({ ...q, review: reviewLink(topic, q.section) })), [topic])

  return (
    <QuizRunner
      questions={questions}
      accent={course.color}
      badge={`${course.short} · Тест по теме`}
      back={{ to: `/topic/${topic.id}`, label: topic.title }}
      prevBest={prevBest}
      onFinish={(score, total) => saveResult(key, score, total, { kind: 'topic', title: topic.title, to: `/topic/${topic.id}`, course: topic.course })}
      extraActions={
        <>
          <Link to={`/topic/${topic.id}`} className="btn btn--soft">
            <BookOpen size={18} /> К конспекту
          </Link>
          {examCount > 0 && (
            <Link to={`/exam/practice?topic=${topic.id}`} className="btn btn--soft">
              <GraduationCap size={18} /> Задания ЕГЭ/ОГЭ
            </Link>
          )}
          {next && (
            <Link to={`/topic/${next.id}`} className="btn btn--ghost">
              Следующая тема <ArrowRight size={18} />
            </Link>
          )}
        </>
      }
    />
  )
}
