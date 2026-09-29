import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import Logo from './Logo.jsx'

function getInitialTheme() {
  const attr = document.documentElement.getAttribute('data-theme')
  if (attr) return attr
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export default function Header() {
  const [theme, setTheme] = useState(getInitialTheme)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    try {
      localStorage.setItem('h5m-theme', next)
    } catch {
      /* ignore */
    }
  }

  return (
    <header className={'header' + (scrolled ? ' header--scrolled' : '')}>
      <div className="container header__inner">
        <Link to="/" className="brand" aria-label="История за 5 минут — на главную">
          <Logo />
          <span className="brand__text">
            История <span className="brand__accent">за 5 минут</span>
          </span>
        </Link>
        <nav className="nav" aria-label="Основная навигация">
          <NavLink to="/" end className="nav__link">
            События
          </NavLink>
          <NavLink to="/about" className="nav__link">
            О проекте
          </NavLink>
          <button
            type="button"
            className="icon-btn"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
            title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
          >
            {theme === 'dark' ? (
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <circle cx="12" cy="12" r="4.5" fill="currentColor" />
                <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                </g>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z" fill="currentColor" />
              </svg>
            )}
          </button>
        </nav>
      </div>
    </header>
  )
}
