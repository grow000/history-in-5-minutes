import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, GraduationCap } from 'lucide-react'
import { chaptersOfCourse, coursesById, SOURCES, tasksFor, topicsOfCourse } from '../data/course.js'
import { plural } from '../data/index.js'
import { loadProgress } from '../progress.js'
import { stagger } from '../components/Reveal.jsx'
import Reveal from '../components/Reveal.jsx'
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
  const done = all.filter((t) => progress['topic:' + t.id]).length
  const examCount = tasksFor({ course: course.id }).length
  const source = SOURCES[course.source]
  let counter = 0

  useEffect(() => {
    document.title = `${course.title} — История за 5 минут`
    return () => {
      document.title = 'История за 5 минут'
    }
  }, [course.title])

  return (
    <div className="course" style={{ '--era': course.color }}>
      <header className="event-hero">
        <div className="event-hero__glow" aria-hidden="true" />
        <div className="container event-hero__inner">
          <nav className="breadcrumbs" aria-label="Навигационная цепочка">
            <Link to="/learn">Курс истории</Link>
          </nav>
          <div className="topic-hero__chapter">
            {course.grade} · {course.period}
          </div>
          <h1 className="event-hero__title">{course.title}</h1>
          <p className="event-hero__summary">{course.description}</p>
          <div className="event-hero__meta">
            <span className="meta-item">
              <BookOpen size={15} /> {all.length} {plural(all.length, ['тема', 'темы', 'тем'])}
            </span>
            <span className="meta-item">Пройдено тестов: {done}</span>
            {examCount > 0 && <span className="meta-item">Заданий ЕГЭ/ОГЭ: {examCount}</span>}
          </div>
          {examCount > 0 && (
            <div className="event-hero__actions">
              <Link to={`/exam/practice?course=${course.id}`} className="btn btn--light">
                <GraduationCap size={18} /> Тренировка ЕГЭ/ОГЭ по курсу
              </Link>
            </div>
          )}
        </div>
      </header>

      <div className="container course__body">
        {source && (
          <p className="source-note">
            <BookOpen size={15} /> Учебник: {source.full}
          </p>
        )}
        {chapters.map((ch) => (
          <Reveal as="section" key={ch.n} className="chapter">
            <h2 className="chapter__title">
              <span className="chapter__n">Глава {ch.n}</span>
              {ch.title}
            </h2>
            {ch.topics.length ? (
              <motion.div className="topic-list" variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
                {ch.topics.map((t) => (
                  <TopicRow key={t.id} topic={t} done={progress['topic:' + t.id]} index={++counter} />
                ))}
              </motion.div>
            ) : (
              <p className="muted">Темы этой главы скоро появятся.</p>
            )}
          </Reveal>
        ))}
      </div>
    </div>
  )
}
