import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { COURSES, tasks, topics, topicsOfCourse } from '../data/course.js'
import { plural } from '../data/index.js'

const STEPS = [
  { icon: '🧭', title: 'Выбери тему', text: 'История России или всеобщая история, 5–11 класс — через поиск или по пути курса.' },
  { icon: '📖', title: 'Пройди историю', text: 'Тема разбита на короткие шаги: рассказ, вопросы на понимание, карточки, игра с датами.' },
  { icon: '🎯', title: 'Проверь себя', text: 'Тест с объяснениями и задания всех номеров ЕГЭ/ОГЭ. Прогресс сохраняется в браузере.' },
]

export default function About() {
  useEffect(() => {
    document.title = 'О проекте — История за 5 минут'
    return () => {
      document.title = 'История за 5 минут'
    }
  }, [])

  return (
    <div className="about">
      <section className="about-hero">
        <div className="container container--narrow">
          <span className="pill">О проекте</span>
          <h1 className="about-hero__title">
            Учить историю — <span className="gradient-text">быстро и интересно</span>
          </h1>
          <p className="about-hero__lead">
            «История за 5 минут» — учебный сайт, где темы истории России и всеобщей истории по учебникам Мединского
            объясняются коротко, понятно и в игровой форме. Он помогает подготовиться к уроку, контрольной, ОГЭ и ЕГЭ.
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
          <h2>Курсы</h2>
          <div className="era-list">
            {COURSES.map((c) => {
              const count = topicsOfCourse(c.id).length
              return (
                <Link key={c.id} to={`/learn/${c.id}`} className="era-row" style={{ '--era': c.color }}>
                  <span className="era-row__title">{c.short}</span>
                  <span className="era-row__range">{c.period}</span>
                  <span className="era-row__count">
                    {count} {plural(count, ['тема', 'темы', 'тем'])}
                  </span>
                </Link>
              )
            })}
          </div>
          <p className="muted">
            Всего {topics.length} {plural(topics.length, ['тема', 'темы', 'тем'])} и {tasks.length}{' '}
            {plural(tasks.length, ['задание', 'задания', 'заданий'])} в формате ЕГЭ и ОГЭ.
          </p>
        </section>

        <section className="about-section">
          <h2>Принципы</h2>
          <ul className="principles">
            <li><b>Коротко.</b> Каждая тема проходится примерно за 5–10 минут.</li>
            <li><b>Интересно.</b> Не сплошной текст, а шаги, вопросы, карточки и мини-игры.</li>
            <li><b>Проверено.</b> Даты и факты сверены с учебниками и энциклопедиями. Спорные даты помечены как приблизительные.</li>
            <li><b>Без лишнего.</b> Нет регистрации, рекламы и сервера — сайт работает прямо в браузере.</li>
          </ul>
        </section>

        <div className="about-cta">
          <Link to="/learn" className="btn btn--primary btn--lg">
            Начать учиться
          </Link>
        </div>
      </div>
    </div>
  )
}
