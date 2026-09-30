import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, BookOpen, Dices, GraduationCap, ListChecks, Timer } from 'lucide-react'
import Tabs, { TabPanel } from '../components/Tabs.jsx'
import { stagger, staggerItem } from '../components/Reveal.jsx'
import { COURSES, EXAMS, TASK_TYPES, tasksFor } from '../data/course.js'
import { EXAM_INFO } from '../data/courses-meta.js'
import { plural } from '../data/index.js'
import { loadProgress } from '../progress.js'

const VARIANT_SIZES = [10, 20, 30]

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

  const courses = COURSES.filter((c) => c.exams?.includes(exam)).map((c) => ({ ...c, count: all.filter((t) => t.course === c.id).length }))

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
            tabs={Object.values(EXAMS).map((e) => ({ id: e.id, label: `${e.title} · ${e.grade}` }))}
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
                <BookOpen size={22} /> Каталог по темам
              </h2>
              <div className="exam-courses">
                {courses.map((c) => (
                  <details key={c.id} className="exam-course" style={{ '--era': c.color }}>
                    <summary>
                      <span className="exam-course__grade">{c.grade}</span>
                      <span className="exam-course__title">{c.title}</span>
                      <span className="exam-course__count">{c.count}</span>
                    </summary>
                    <div className="exam-course__body">
                      <Link to={`/exam/practice?exam=${exam}&course=${c.id}&seed=${Date.now()}`} className="btn btn--soft btn--sm">
                        Все задания раздела
                      </Link>
                      <ChapterList course={c} exam={exam} />
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

function ChapterList({ course, exam }) {
  const list = tasksFor({ exam, course: course.id })
  return (
    <ul className="exam-topics">
      {course.chapters.map((ch) => (
        <ChapterTopics key={ch.n} chapter={ch} exam={exam} list={list} />
      ))}
    </ul>
  )
}

function ChapterTopics({ chapter, exam, list }) {
  const inChapter = list.filter((t) => t.chapter === chapter.n)
  const topics = [...new Map(inChapter.map((t) => [t.topic, t])).values()]
  if (!topics.length) return null
  return (
    <li>
      <div className="exam-topics__chapter">
        Глава {chapter.n}. {chapter.title}
      </div>
      <div className="exam-topics__list">
        {topics.map((t) => (
          <Link key={t.topic} to={`/exam/practice?exam=${exam}&topic=${t.topic}`} className="exam-topic">
            <span>{t.topicTitle}</span>
            <span className="exam-topic__count">{inChapter.filter((x) => x.topic === t.topic).length}</span>
          </Link>
        ))}
      </div>
    </li>
  )
}
