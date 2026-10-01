import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, BookOpen, Check, GraduationCap, Play, Star, Zap } from 'lucide-react'
import { chaptersOfCourse, coursesById, SOURCES, tasksFor, topicsOfCourse } from '../data/course.js'
import { plural } from '../data/index.js'
import { loadProgress, loadStory } from '../progress.js'
import Reveal from '../components/Reveal.jsx'
import NotFound from './NotFound.jsx'

export default function CoursePage({ id }) {
  const course = coursesById[id]
  if (!course) return <NotFound text="Такого курса нет." />
  return <CourseContent course={course} />
}

// состояние темы на пути: пройдена / в процессе / не начата
function statusOf(topic, story, progress) {
  const s = story[topic.id]
  const test = progress['topic:' + topic.id]
  if (s?.done) return { kind: 'done', percent: 100, test }
  if (s?.step > 0) return { kind: 'started', percent: Math.round(((s.step + 1) / (s.steps || 1)) * 100), test }
  if (test) return { kind: 'done', percent: 100, test }
  return { kind: 'new', percent: 0, test }
}

function CourseContent({ course }) {
  const [progress] = useState(loadProgress)
  const [story] = useState(loadStory)
  const chapters = chaptersOfCourse(course.id)
  const all = topicsOfCourse(course.id)
  const statuses = useMemo(() => Object.fromEntries(all.map((t) => [t.id, statusOf(t, story, progress)])), [all, story, progress])
  const done = all.filter((t) => statuses[t.id].kind === 'done').length
  const xp = all.reduce((s, t) => s + (story[t.id]?.xp ?? 0), 0)
  const nextTopic = all.find((t) => statuses[t.id].kind === 'started') ?? all.find((t) => statuses[t.id].kind === 'new')
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
          <div className="course-progress">
            <div className="course-progress__bar" aria-label={`Пройдено ${done} из ${all.length}`}>
              <span style={{ width: `${all.length ? (done / all.length) * 100 : 0}%` }} />
            </div>
            <span>
              Пройдено {done} из {all.length} {plural(all.length, ['темы', 'тем', 'тем'])} · <Zap size={14} aria-hidden="true" /> {xp} XP
            </span>
          </div>
          <div className="event-hero__actions">
            {nextTopic && (
              <Link to={`/topic/${nextTopic.id}`} className="btn btn--light">
                <Play size={18} /> {statuses[nextTopic.id].kind === 'started' ? 'Продолжить' : done ? 'Следующая тема' : 'Начать путь'}
              </Link>
            )}
            {examCount > 0 && (
              <Link to={`/exam/practice?course=${course.id}&n=20&seed=${Date.now()}`} className="btn btn--outline-light">
                <GraduationCap size={18} /> ЕГЭ/ОГЭ по курсу · {examCount}
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="container course__body course-path">
        {source && (
          <p className="source-note">
            <BookOpen size={15} /> Учебник: {source.full}
          </p>
        )}
        {chapters.map((ch) => (
          <Reveal as="section" key={ch.n} className="path-chapter">
            <h2 className="path-chapter__title">
              <span className="path-chapter__n">Глава {ch.n}</span>
              {ch.title}
            </h2>
            {ch.topics.length ? (
              <ol className="path">
                {ch.topics.map((t) => {
                  const st = statuses[t.id]
                  const i = ++counter
                  const isNext = nextTopic?.id === t.id
                  return (
                    <motion.li
                      key={t.id}
                      className={`path-node path-node--${st.kind}` + (isNext ? ' is-next' : '') + (i % 2 ? ' is-left' : ' is-right')}
                      initial={{ opacity: 0, y: 14 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '0px 0px -30px 0px' }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <Link to={`/topic/${t.id}`} className="path-node__link">
                        <span className="path-node__dot" style={{ '--p': st.percent }} aria-hidden="true">
                          {st.kind === 'done' ? <Check size={20} /> : <span>{i}</span>}
                        </span>
                        <span className="path-node__body">
                          {isNext && <span className="path-node__next">{st.kind === 'started' ? 'Ты здесь' : 'Дальше по пути'}</span>}
                          <span className="path-node__title">{t.title}</span>
                          <span className="path-node__meta">
                            {t.period}
                            {t.paragraphs && ` · ${t.paragraphs}`}
                            {st.kind === 'started' && ` · пройдено ${st.percent}%`}
                          </span>
                          {st.test && (
                            <span className={'path-node__test' + (st.test.best === st.test.total ? ' is-perfect' : '')}>
                              <Star size={12} aria-hidden="true" /> тест {st.test.best}/{st.test.total}
                            </span>
                          )}
                        </span>
                        <ArrowRight className="path-node__arrow" size={18} aria-hidden="true" />
                      </Link>
                    </motion.li>
                  )
                })}
              </ol>
            ) : (
              <p className="muted">Темы этой главы скоро появятся.</p>
            )}
          </Reveal>
        ))}
      </div>
    </div>
  )
}
