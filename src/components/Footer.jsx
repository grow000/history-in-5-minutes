import { Link } from 'react-router-dom'
import { topics } from '../data/course.js'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div>
          <div className="footer__title">История за 5 минут</div>
          <p className="footer__text">
            {topics.length} тем курса по учебникам В. Р. Мединского, подготовка к ЕГЭ и ОГЭ и ключевые события мировой
            истории.
          </p>
        </div>
        <nav className="footer__nav" aria-label="Нижняя навигация">
          <Link to="/progress">Мой прогресс</Link>
          <Link to="/sources">Источники</Link>
          <Link to="/about">О проекте</Link>
        </nav>
      </div>
      <div className="container footer__bottom">Учебный проект · {new Date().getFullYear()}</div>
    </footer>
  )
}
