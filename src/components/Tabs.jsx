import { useRef } from 'react'
import { motion } from 'framer-motion'

// Вкладки с «перетекающим» индикатором. Стрелки ←/→ переключают вкладки.
export default function Tabs({ tabs, value, onChange, layoutId = 'tabs', variant = 'pill', className = '', label }) {
  const refs = useRef([])

  const onKeyDown = (e, i) => {
    let next = null
    if (e.key === 'ArrowRight') next = (i + 1) % tabs.length
    if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length
    if (e.key === 'Home') next = 0
    if (e.key === 'End') next = tabs.length - 1
    if (next === null) return
    e.preventDefault()
    onChange(tabs[next].id)
    refs.current[next]?.focus()
  }

  return (
    <div className={`tabs tabs--${variant} ${className}`} role="tablist" aria-label={label}>
      {tabs.map((t, i) => {
        const active = value === t.id
        return (
          <button
            key={t.id}
            ref={(el) => (refs.current[i] = el)}
            type="button"
            role="tab"
            id={`tab-${layoutId}-${t.id}`}
            aria-selected={active}
            aria-controls={`panel-${layoutId}-${t.id}`}
            tabIndex={active ? 0 : -1}
            className={'tabs__tab' + (active ? ' is-active' : '')}
            onClick={() => onChange(t.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="tabs__indicator"
                transition={{ type: 'spring', stiffness: 520, damping: 40 }}
              />
            )}
            <span className="tabs__label">
              {t.icon}
              <span>{t.label}</span>
              {t.badge != null && <span className="tabs__badge">{t.badge}</span>}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function TabPanel({ id, layoutId = 'tabs', children }) {
  return (
    <motion.div
      key={id}
      role="tabpanel"
      id={`panel-${layoutId}-${id}`}
      aria-labelledby={`tab-${layoutId}-${id}`}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
