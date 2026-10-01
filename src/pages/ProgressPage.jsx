import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, Upload } from 'lucide-react'
import { COURSES, EXAM_LINES, EXAMS, tasks, topics } from '../data/course.js'
import { plural } from '../data/index.js'
import { exportProgress, importProgress, levelOf, loadHistory, loadProgress, loadStory, resetProgress, totalXp } from '../progress.js'

const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0)

function formatDate(ts) {
  return new Date(ts).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
}

export default function ProgressPage() {
  const [progress, setProgress] = useState(loadProgress)
  const [history, setHistory] = useState(loadHistory)
  const [story, setStory] = useState(loadStory)
  const xp = totalXp(story)
  const lvl = levelOf(xp)
  const storiesDone = Object.values(story).filter((x) => x?.done).length
  const [message, setMessage] = useState('')
  const fileRef = useRef(null)

  useEffect(() => {
    document.title = 'Мой прогресс — История за 5 минут'
    return () => {
      document.title = 'История за 5 минут'
    }
  }, [])

  const refresh = () => {
    setProgress(loadProgress())
    setHistory(loadHistory())
    setStory(loadStory())
  }

  // Тесты по темам
  const topicStats = useMemo(() => {
    const done = topics.filter((t) => progress['topic:' + t.id])
    const avg = done.length ? Math.round(done.reduce((s, t) => s + pct(progress['topic:' + t.id].best, progress['topic:' + t.id].total), 0) / done.length) : 0
    const weak = done
      .map((t) => ({ t, p: pct(progress['topic:' + t.id].best, progress['topic:' + t.id].total) }))
      .filter((x) => x.p < 70)
      .sort((a, b) => a.p - b.p)
      .slice(0, 6)
    return { done: done.length, avg, weak }
  }, [progress])

  // Задания ЕГЭ/ОГЭ по номерам КИМ
  const examStats = useMemo(
    () =>
      Object.keys(EXAMS).map((exam) => ({
        exam,
        lines: EXAM_LINES[exam]
          .map((l) => {
            const list = tasks.filter((t) => t.exam.includes(exam) && l.test(t))
            const solved = list.filter((t) => progress['exam:' + t.id])
            const pts = solved.reduce((s, t) => s + progress['exam:' + t.id].last, 0)
            const max = solved.reduce((s, t) => s + progress['exam:' + t.id].total, 0)
            return { ...l, total: list.length, solved: solved.length, accuracy: pct(pts, max) }
          })
          .filter((l) => l.total > 0),
      })),
    [progress]
  )

  const sessions = history.filter((h) => h.kind === 'exam-session')
  const examSolved = Object.keys(progress).filter((k) => k.startsWith('exam:')).length
  const hasAny = Object.keys(progress).length > 0 || Object.keys(story).length > 0

  const download = () => {
    const blob = new Blob([exportProgress()], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `progress-history-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const upload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const n = importProgress(await file.text())
      refresh()
      setMessage(`Готово: загружено результатов — ${n}.`)
    } catch (err) {
      setMessage(err.message || 'Не удалось прочитать файл.')
    }
    e.target.value = ''
  }

  const reset = () => {
    if (window.confirm('Удалить все результаты на этом устройстве?')) {
      resetProgress()
      refresh()
      setMessage('Прогресс очищен.')
    }
  }

  return (
    <div className="container container--narrow simple-page">
      <header className="simple-head">
        <h1>Мой прогресс</h1>
        <p className="lead-muted">Результаты сохраняются в этом браузере и остаются при следующем заходе на сайт.</p>
      </header>

      {!hasAny && (
        <div className="empty-block">
          <p>Здесь появятся результаты, когда ты пройдёшь первый тест или решишь задания.</p>
          <div className="row-actions">
            <Link to="/learn" className="btn btn--primary">
              Открыть курс
            </Link>
            <Link to="/exam" className="btn btn--ghost">
              Задания ЕГЭ и ОГЭ
            </Link>
          </div>
        </div>
      )}

      {hasAny && (
        <>
          <section className="simple-section">
            <div className="xp-card">
              <div className="xp-card__level">
                <b>{lvl.level}</b>
                <span>уровень</span>
              </div>
              <div className="xp-card__main">
                <div className="xp-card__title">
                  {xp} XP · {storiesDone} {plural(storiesDone, ['тема пройдена', 'темы пройдено', 'тем пройдено'])} целиком
                </div>
                <div className="xp-card__bar" aria-label={`До следующего уровня ${lvl.need - lvl.into} XP`}>
                  <span style={{ width: `${(lvl.into / lvl.need) * 100}%` }} />
                </div>
                <div className="xp-card__hint">До уровня {lvl.level + 1} осталось {lvl.need - lvl.into} XP. Опыт дают шаги темы, ответы по ходу, карточки и игра с датами.</div>
              </div>
            </div>
            <div className="stat-row">
              <div className="stat-tile">
                <b>{topicStats.done}</b>
                <span>из {topics.length} тестов по темам</span>
              </div>
              <div className="stat-tile">
                <b>{topicStats.avg}%</b>
                <span>средний результат</span>
              </div>
              <div className="stat-tile">
                <b>{examSolved}</b>
                <span>{plural(examSolved, ['задание', 'задания', 'заданий'])} ЕГЭ/ОГЭ решено</span>
              </div>
            </div>
          </section>

          <section className="simple-section">
            <h2>Курс по классам</h2>
            <ul className="plain-list">
              {COURSES.map((c) => {
                const list = topics.filter((t) => t.course === c.id)
                const done = list.filter((t) => progress['topic:' + t.id]).length
                return (
                  <li key={c.id}>
                    <Link to={`/learn/${c.id}`} className="plain-row">
                      <span>
                        {c.grade} · {c.title}
                      </span>
                      <span className="plain-row__meta">
                        {done} / {list.length}
                      </span>
                    </Link>
                    <div className="thin-bar">
                      <span style={{ width: `${pct(done, list.length)}%` }} />
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>

          {topicStats.weak.length > 0 && (
            <section className="simple-section">
              <h2>Стоит повторить</h2>
              <ul className="plain-list">
                {topicStats.weak.map(({ t, p }) => (
                  <li key={t.id}>
                    <Link to={`/topic/${t.id}`} className="plain-row">
                      <span>{t.title}</span>
                      <span className="plain-row__meta">{p}%</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {examStats.map(({ exam, lines }) =>
            lines.some((l) => l.solved) ? (
              <section key={exam} className="simple-section">
                <h2>{EXAMS[exam].title}: точность по номерам</h2>
                <ul className="plain-list">
                  {lines.map((l) => (
                    <li key={l.id}>
                      <div className="plain-row plain-row--static">
                        <span>
                          {l.n === '+' ? '' : `№ ${l.n} · `}
                          {l.title}
                        </span>
                        <span className="plain-row__meta">
                          {l.solved ? `${l.accuracy}% · решено ${l.solved}` : 'не решались'}
                          {l.solved > 0 && l.accuracy < 70 && (
                            <Link to={`/exam/practice?exam=${exam}&pick=${l.id}:5&seed=${Date.now()}`} className="link-btn">
                              Потренировать
                            </Link>
                          )}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null
          )}

          {history.length > 0 && (
            <section className="simple-section">
              <h2>Последние попытки</h2>
              <ul className="plain-list">
                {history.slice(0, 12).map((h, i) => (
                  <li key={h.at + '-' + i}>
                    <Link to={h.to ?? '/'} className="plain-row">
                      <span>
                        {h.kind === 'exam-session' ? `${EXAMS[h.exam]?.title ?? 'Экзамен'}: ${h.title}` : h.title}
                        <small className="plain-row__sub">{formatDate(h.at)}</small>
                      </span>
                      <span className="plain-row__meta">
                        {h.score} / {h.total}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              {sessions.length > 0 && (
                <p className="lead-muted small">
                  Решено вариантов и наборов заданий: {sessions.length}.
                </p>
              )}
            </section>
          )}
        </>
      )}

      <section className="simple-section">
        <h2>Перенос на другое устройство</h2>
        <p className="lead-muted">
          Сохрани файл с прогрессом и загрузи его на телефоне или другом компьютере — результаты объединятся.
        </p>
        <div className="row-actions">
          <button type="button" className="btn btn--ghost" onClick={download} disabled={!hasAny}>
            <Download size={17} /> Сохранить файл
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => fileRef.current?.click()}>
            <Upload size={17} /> Загрузить файл
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={upload} />
          {hasAny && (
            <button type="button" className="btn btn--text-danger" onClick={reset}>
              Очистить
            </button>
          )}
        </div>
        {message && (
          <p className="notice-line" role="status">
            {message}
          </p>
        )}
      </section>
    </div>
  )
}
