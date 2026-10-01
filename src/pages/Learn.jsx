import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Check, GraduationCap, Search, X, Zap } from 'lucide-react'
import { periodOf, periodsFor, searchTopics, tasksFor, topicsFor } from '../data/course.js'
import { plural } from '../data/index.js'
import { loadProgress, loadStory } from '../progress.js'

const EXAM_TABS = [
  { id: 'ege', label: 'ЕГЭ', hint: 'все темы кодификатора ЕГЭ — от Руси до наших дней' },
  { id: 'oge', label: 'ОГЭ', hint: 'история России до 1914 г. и всеобщая история' },
  { id: 'all', label: 'Все темы', hint: 'всё, что есть на сайте' },
]

export default function Learn() {
  const [params, setParams] = useSearchParams()
  const exam = ['ege', 'oge', 'all'].includes(params.get('exam')) ? params.get('exam') : 'ege'
  const examKey = exam === 'all' ? null : exam
  const periodId = params.get('p')
  const [q, setQ] = useState(params.get('q') ?? '')
  const dq = useDeferredValue(q)
  const [story] = useState(loadStory)
  const [progress] = useState(loadProgress)

  useEffect(() => {
    document.title = 'Темы и события — История за 5 минут'
    return () => {
      document.title = 'История за 5 минут'
    }
  }, [])

  const periods = useMemo(() => periodsFor(examKey), [examKey])
  const activePeriod = periods.find((p) => p.id === periodId) ? periodId : null
  const found = useMemo(() => {
    if (!dq.trim()) return null
    const list = searchTopics(dq)
    return examKey ? list.filter((t) => t.exam?.[examKey]) : list
  }, [dq, examKey])

  const update = (patch) => {
    const p = new URLSearchParams(params)
    Object.entries(patch).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)))
    setParams(p, { replace: true })
  }

  const shown = activePeriod ? periods.filter((p) => p.id === activePeriod) : periods
  const ctx = { story, progress, exam: examKey }

  return (
    <div className="topics-page">
      <section className="hero hero--compact topics-hero">
        <div className="hero__bg" aria-hidden="true">
          <span className="blob blob--1" />
          <span className="blob blob--2" />
        </div>
        <div className="container hero__inner">
          <h1 className="hero__title">
            Темы и <span className="gradient-text">события</span>
          </h1>
          <p className="hero__lead">Найди то, что интересно, или пройди все темы, которые бывают на ЕГЭ и ОГЭ.</p>
          <div className="search search--home">
            <Search className="search__icon" size={22} aria-hidden="true" />
            <input
              type="search"
              className="search__input"
              placeholder="Куликовская битва, Пётр I, 1812, Сталинград…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Поиск по темам и событиям"
              autoComplete="off"
            />
            {q && (
              <button type="button" className="search__clear" onClick={() => setQ('')} aria-label="Очистить поиск">
                <X size={16} />
              </button>
            )}
          </div>
          <div className="exam-switch" role="radiogroup" aria-label="Для какого экзамена">
            {EXAM_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={exam === t.id}
                className={'exam-switch__btn' + (exam === t.id ? ' is-active' : '')}
                onClick={() => update({ exam: t.id === 'ege' ? null : t.id, p: null })}
              >
                <b>{t.label}</b>
                <span>{t.hint}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="container topics-body">
        {found ? (
          <section aria-live="polite">
            <p className="results-count">
              {found.length ? `Найдено ${found.length} ${plural(found.length, ['тема', 'темы', 'тем'])}` : 'Ничего не найдено — попробуй другое слово или год'}
            </p>
            <div className="tcard-grid">
              {found.map((t) => (
                <TopicCard key={t.id} topic={t} ctx={ctx} showPeriod />
              ))}
            </div>
          </section>
        ) : (
          <>
            <nav className="period-chips" aria-label="Разделы">
              <button type="button" className={'period-chip' + (!activePeriod ? ' is-active' : '')} onClick={() => update({ p: null })}>
                Все разделы
              </button>
              {periods.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={'period-chip' + (activePeriod === p.id ? ' is-active' : '')}
                  style={{ '--era': p.color }}
                  onClick={() => update({ p: activePeriod === p.id ? null : p.id })}
                >
                  {p.title.replace('Всеобщая история: ', '')}
                </button>
              ))}
            </nav>

            {shown.map((p) => {
              const list = topicsFor(examKey, p.id)
              const done = list.filter((t) => story[t.id]?.done).length
              const examCount = examKey ? tasksFor({ exam: examKey, period: p.id }).length : 0
              return (
                <section key={p.id} className="tsection-block" style={{ '--era': p.color }}>
                  <header className="tsection-block__head">
                    <div>
                      {examKey && <span className="tsection-block__code">Раздел {p.code} кодификатора {examKey === 'ege' ? 'ЕГЭ' : 'ОГЭ'}</span>}
                      <h2>{p.title}</h2>
                      <p className="muted">
                        {p.range} · {list.length} {plural(list.length, ['тема', 'темы', 'тем'])}
                        {done > 0 && ` · пройдено ${done}`}
                      </p>
                    </div>
                    {examKey && examCount > 0 && (
                      <Link
                        to={`/exam/practice?exam=${examKey}&period=${p.id}&n=${Math.min(20, examCount)}&seed=${Date.now()}`}
                        className="btn btn--soft btn--sm"
                      >
                        <GraduationCap size={16} /> Задания по разделу
                      </Link>
                    )}
                  </header>
                  <div className="tcard-grid">
                    {list.map((t) => (
                      <TopicCard key={t.id} topic={t} ctx={ctx} />
                    ))}
                  </div>
                </section>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}

export function TopicCard({ topic, ctx, showPeriod }) {
  const st = ctx.story[topic.id]
  const test = ctx.progress['topic:' + topic.id]
  const period = periodOf(topic)
  const percent = st?.done ? 100 : st?.step > 0 ? Math.round(((st.step + 1) / (st.steps || 1)) * 100) : 0
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '0px 0px -20px 0px' }} transition={{ duration: 0.35 }}>
      <Link to={`/topic/${topic.id}`} className={'tcard' + (st?.done ? ' is-done' : '')} style={{ '--era': period?.color }}>
        <span className="tcard__years">{topic.period}</span>
        <span className="tcard__title">{topic.title}</span>
        <span className="tcard__summary">{topic.summary}</span>
        <span className="tcard__foot">
          {showPeriod && period && <span className="tcard__tag">{period.title.replace('Всеобщая история: ', '')}</span>}
          {topic.exam?.ege && <span className="tcard__tag tcard__tag--exam">ЕГЭ</span>}
          {topic.exam?.oge && <span className="tcard__tag tcard__tag--exam">ОГЭ</span>}
          {test && <span className="tcard__tag">тест {test.best}/{test.total}</span>}
          <span className="tcard__status">
            {st?.done ? (
              <>
                <Check size={14} /> пройдено
              </>
            ) : percent ? (
              `${percent}%`
            ) : (
              <ArrowRight size={16} />
            )}
          </span>
        </span>
        {percent > 0 && !st?.done && (
          <span className="tcard__bar" aria-hidden="true">
            <span style={{ width: `${percent}%` }} />
          </span>
        )}
        {st?.xp > 0 && (
          <span className="tcard__xp" aria-label={`${st.xp} XP`}>
            <Zap size={12} aria-hidden="true" /> {st.xp}
          </span>
        )}
      </Link>
    </motion.div>
  )
}
