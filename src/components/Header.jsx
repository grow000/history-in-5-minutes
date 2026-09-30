import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, GraduationCap, Home, Landmark, Library, Moon, Sun } from 'lucide-react'
import Logo from './Logo.jsx'

export const NAV = [
  { to: '/', label: 'Главная', icon: Home, match: (p) => p === '/' },
  { to: '/learn', label: 'Курс истории', short: 'Курс', icon: BookOpen, match: (p) => p.startsWith('/learn') || p.startsWith('/topic') },
  { to: '/exam', label: 'ЕГЭ и ОГЭ', short: 'ЕГЭ·ОГЭ', icon: GraduationCap, match: (p) => p.startsWith('/exam') },
  { to: '/events', label: 'События', icon: Landmark, match: (p) => p.startsWith('/events') || p.startsWith('/event/') },
  { to: '/sources', label: 'Источники', icon: Library, match: (p) => p.startsWith('/sources') || p.startsWith('/about') },
]

function getInitialTheme() {
  const attr = document.documentElement.getAttribute('data-theme')
  if (attr) return attr
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export default function Header() {
  const [theme, setTheme] = useState(getInitialTheme)
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()

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
    <>
      <header className={'header' + (scrolled ? ' header--scrolled' : '')}>
        <div className="container header__inner">
          <Link to="/" className="brand" aria-label="История за 5 минут — на главную">
            <Logo />
            <span className="brand__text">
              История <span className="brand__accent">за 5 минут</span>
            </span>
          </Link>
          <nav className="topnav" aria-label="Основная навигация">
            {NAV.map((item) => {
              const active = item.match(pathname)
              const Icon = item.icon
              return (
                <Link key={item.to} to={item.to} className={'topnav__link' + (active ? ' is-active' : '')} aria-current={active ? 'page' : undefined} title={item.label}>
                  {active && <motion.span layoutId="topnav-pill" className="topnav__pill" transition={{ type: 'spring', stiffness: 500, damping: 40 }} />}
                  <Icon size={17} aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
          <button
            type="button"
            className="icon-btn"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
            title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
          >
            <motion.span key={theme} initial={{ rotate: -90, scale: 0.4, opacity: 0 }} animate={{ rotate: 0, scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }} style={{ display: 'grid' }}>
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </motion.span>
          </button>
        </div>
      </header>

      <nav className="bottomnav" aria-label="Навигация">
        {NAV.map((item) => {
          const active = item.match(pathname)
          const Icon = item.icon
          return (
            <Link key={item.to} to={item.to} className={'bottomnav__link' + (active ? ' is-active' : '')} aria-current={active ? 'page' : undefined}>
              {active && <motion.span layoutId="bottomnav-pill" className="bottomnav__pill" transition={{ type: 'spring', stiffness: 500, damping: 40 }} />}
              <Icon size={21} aria-hidden="true" />
              <span>{item.short ?? item.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
