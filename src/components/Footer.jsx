import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="footer-min">
      <div className="container footer-min__inner">
        <nav className="footer-min__links" aria-label="Дополнительно">
          <Link to="/learn">Курс</Link>
          <Link to="/exam">ЕГЭ и ОГЭ</Link>
          <Link to="/events">События</Link>
          <Link to="/progress">Прогресс</Link>
          <Link to="/sources">Источники</Link>
          <Link to="/about">О проекте</Link>
        </nav>
        <p>История за 5 минут · учебный проект · материалы по учебникам В. Р. Мединского и А. В. Торкунова</p>
      </div>
    </footer>
  )
}
