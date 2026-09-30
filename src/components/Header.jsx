import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, Moon, Sun, X } from 'lucide-react'

export const NAV = [
  { to: '/learn', label: 'Курс', match: (p) => p.startsWith('/learn') || p.startsWith('/topic') },
  { to: '/exam', label: 'ЕГЭ и ОГЭ', match: (p) => p.startsWith('/exam') },
  { to: '/events', label: 'События', match: (p) => p.startsWith('/events') || p.startsWith('/event/') },
  { to: '/progress', label: 'Прогресс', match: (p) => p.startsWith('/progress') },
]

function getInitialTheme() {
  const attr = document.documentElement.getAttribute('data-theme')
  if (attr) return attr
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export default function Header() {
  const [theme, setTheme] = useState(getInitialTheme)
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => setOpen(false), [pathname])

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
    <header className={'gnav' + (open ? ' is-open' : '')}>
      <div className="gnav__inner">
        <Link to="/" className="gnav__brand" aria-label="История за 5 минут — на главную">
          История за 5 минут
        </Link>
        <nav className="gnav__links" aria-label="Основная навигация">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={'gnav__link' + (item.match(pathname) ? ' is-active' : '')}
              aria-current={item.match(pathname) ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="gnav__actions">
          <button
            type="button"
            className="gnav__icon"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
            title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button
            type="button"
            className="gnav__icon gnav__menu"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={open}
          >
            {open ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="gnav__sheet" aria-label="Меню">
          {NAV.map((item) => (
            <Link key={item.to} to={item.to} className={'gnav__sheet-link' + (item.match(pathname) ? ' is-active' : '')}>
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}
