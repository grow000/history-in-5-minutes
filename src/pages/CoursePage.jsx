import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { chaptersOfCourse, coursesById, SOURCES, tasksFor, topicsOfCourse } from '../data/course.js'
import { plural } from '../data/index.js'
import { loadProgress } from '../progress.js'
import { TopicRow } from './Learn.jsx'
import NotFound from './NotFound.jsx'

export default function CoursePage({ id }) {
  const course = coursesById[id]
  if (!course) return <NotFound text="Такого курса нет." />
  return <CourseContent course={course} />
}

function CourseContent({ course }) {
  const [progress] = useState(loadProgress)
  const chapters = chaptersOfCourse(course.id)
  const all = topicsOfCourse(course.id)
  const examCount = tasksFor({ course: course.id }).length
  let counter = 0

  useEffect(() => {
    document.title = `${course.title} — История за 5 минут`
    return () => {
      document.title = 'История за 5 минут'
    }
  }, [course.title])

  return (
    <div className="container container--narrow simple-page">
      <header className="simple-head">
        <Link to="/learn" className="back-crumb">
          Курс истории
        </Link>
        <p className="eyebrow">
          {course.grade} · {course.period}
        </p>
        <h1>{course.title}</h1>
        <p className="lead-muted">{course.description}</p>
        <p className="lead-muted small">
          {all.length} {plural(all.length, ['тема', 'темы', 'тем'])} · учебник: {SOURCES[course.source]?.short}
        </p>
        {examCount > 0 && (
          <Link to={`/exam/practice?course=${course.id}&n=20&seed=${Date.now()}`} className="text-link">
            Задания ЕГЭ/ОГЭ по курсу <ChevronRight size={18} />
          </Link>
        )}
      </header>

      {chapters.map((ch) => (
        <section key={ch.n} className="simple-section">
          <p className="eyebrow">Глава {ch.n}</p>
          <h2>{ch.title}</h2>
          <ul className="plain-list">
            {ch.topics.map((t) => (
              <TopicRow key={t.id} topic={t} done={progress['topic:' + t.id]} index={++counter} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
