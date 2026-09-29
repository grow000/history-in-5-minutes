import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { events, ERA_LIST, plural } from '../data/index.js'
import { loadProgress, resetProgress } from '../progress.js'

const STEPS = [
  { icon: '🔎', title: 'Выбери событие', text: 'Найди его через поиск или отфильтруй по эпохе и теме.' },
  { icon: '📖', title: 'Прочитай конспект', text: 'Что произошло, причины, ход событий, личности, хронология, факты и значение — всё на одной странице.' },
  { icon: '🎯', title: 'Пройди викторину', text: '5 вопросов с пояснениями. Лучший результат сохраняется в браузере.' },
]

export default function About() {
  const [progress, setProgress] = useState(loadProgress)
  const done = Object.keys(progress).filter((id) => events.some((e) => e.id === id))
  const perfect = done.filter((id) => progress[id].best === progress[id].total).length

  useEffect(() => {
    document.title = 'О проекте — История за 5 минут'
    return () => {
      document.title = 'История за 5 минут'
    }
  }, [])

  const onReset = () => {
    if (window.confirm('Сбросить результаты всех викторин?')) {
      resetProgress()
      setProgress({})
    }
  }

  return (
    <div className="about">
      <section className="about-hero">
        <div className="container container--narrow">
          <span className="pill">О проекте</span>
          <h1 className="about-hero__title">
            Учить историю — <span className="gradient-text">быстро и интересно</span>
          </h1>
          <p className="about-hero__lead">
            «История за 5 минут» — учебный сайт, где ключевые события мировой истории объясняются коротко и понятно.
            Он помогает подготовиться к уроку, повторить тему перед контрольной или просто узнать что-то новое.
          </p>
        </div>
      </section>

      <div className="container container--narrow about-body">
        <section className="about-section">
          <h2>Как это работает</h2>
          <div className="how">
            {STEPS.map((s, i) => (
              <div key={s.title} className="how__item" style={{ '--i': i }}>
                <div className="how__icon" aria-hidden="true">{s.icon}</div>
                <div className="how__num">Шаг {i + 1}</div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="about-section">
          <h2>Эпохи</h2>
          <div className="era-list">
            {ERA_LIST.map((era) => {
              const count = events.filter((e) => e.era === era.id).length
              return (
                <Link key={era.id} to={`/?era=${era.id}`} className="era-row" style={{ '--era': era.color }}>
                  <span className="era-row__emoji" aria-hidden="true">{era.emoji}</span>
                  <span className="era-row__title">{era.title}</span>
                  <span className="era-row__range">{era.range}</span>
                  <span className="era-row__count">
                    {count} {plural(count, ['событие', 'события', 'событий'])}
                  </span>
                </Link>
              )
            })}
          </div>
        </section>

        <section className="about-section">
          <h2>Твой прогресс</h2>
          <div className="progress-card">
            <div className="progress-card__stats">
              <div className="stat stat--card">
                <b>{done.length}</b>
                <span>из {events.length} викторин пройдено</span>
              </div>
              <div className="stat stat--card">
                <b>{perfect}</b>
                <span>на 5 из 5</span>
              </div>
            </div>
            <div className="bar" aria-hidden="true">
              <span style={{ width: `${(done.length / events.length) * 100}%` }} />
            </div>
            {done.length > 0 && (
              <button type="button" className="btn btn--ghost btn--sm" onClick={onReset}>
                Сбросить прогресс
              </button>
            )}
          </div>
        </section>

        <section className="about-section">
          <h2>Принципы</h2>
          <ul className="principles">
            <li><b>Коротко.</b> Каждый конспект читается примерно за 5 минут.</li>
            <li><b>Понятно.</b> Тексты написаны простым языком для учеников 9–10 классов.</li>
            <li><b>Проверено.</b> Даты и факты сверены с общепринятыми данными учебников и энциклопедий. Спорные даты помечены как приблизительные.</li>
            <li><b>Без лишнего.</b> Нет регистрации, рекламы и сервера — сайт работает прямо в браузере.</li>
          </ul>
        </section>

        <section className="about-section">
          <h2>Технологии</h2>
          <div className="tech">
            {['React 18', 'Vite', 'React Router', 'CSS без фреймворков', 'localStorage'].map((t) => (
              <span key={t} className="tag tag--lg">{t}</span>
            ))}
          </div>
          <p className="muted">
            Контент хранится в JS-файлах в папке <code>src/data/events</code>. Чтобы добавить новое событие, достаточно
            дописать объект в любой из них — оно автоматически появится в поиске, фильтрах и викторинах.
          </p>
        </section>

        <div className="about-cta">
          <Link to="/" className="btn btn--primary btn--lg">
            Перейти к событиям
          </Link>
        </div>
      </div>
    </div>
  )
}
