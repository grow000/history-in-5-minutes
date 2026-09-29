import { Link } from 'react-router-dom'
import { events, plural } from '../data/index.js'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div>
          <div className="footer__title">История за 5 минут</div>
          <p className="footer__text">
            {events.length} {plural(events.length, ['событие', 'события', 'событий'])} мировой истории — коротко,
            понятно и с проверкой знаний.
          </p>
        </div>
        <nav className="footer__nav" aria-label="Нижняя навигация">
          <Link to="/">Все события</Link>
          <Link to="/about">О проекте</Link>
        </nav>
      </div>
      <div className="container footer__bottom">Учебный проект · {new Date().getFullYear()}</div>
    </footer>
  )
}
