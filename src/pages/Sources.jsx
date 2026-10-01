import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookMarked, ExternalLink, GraduationCap, Info, Library } from 'lucide-react'
import Reveal, { stagger, staggerItem } from '../components/Reveal.jsx'
import { COURSES, SOURCES } from '../data/course.js'
import { SOURCE_GROUPS } from '../data/courses-meta.js'

export default function Sources() {
  useEffect(() => {
    document.title = 'Источники — История за 5 минут'
    return () => {
      document.title = 'История за 5 минут'
    }
  }, [])

  return (
    <div className="sources">
      <section className="about-hero">
        <div className="container container--narrow">
          <span className="pill">
            <Library size={15} /> Источники
          </span>
          <h1 className="about-hero__title">
            На чём основан <span className="gradient-text">материал сайта</span>
          </h1>
          <p className="about-hero__lead">
            Структура курса и темы соответствуют школьным учебникам истории под редакцией В. Р. Мединского. Задания для
            подготовки к ЕГЭ и ОГЭ составлены в формате ФИПИ с опорой на пособия И. А. Артасова и учебники Мединского.
          </p>
        </div>
      </section>

      <div className="container container--narrow about-body">
        {SOURCE_GROUPS.map((g) => (
          <Reveal as="section" key={g.id} className="about-section">
            <h2>
              {g.id === 'exam' ? <GraduationCap size={24} /> : <BookMarked size={24} />} {g.title}
            </h2>
            {g.note && <p className="muted">{g.note}</p>}
            <motion.ul className="source-list" variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
              {g.items.map((key) => {
                const s = SOURCES[key]
                if (!s) return null
                const courses = COURSES.filter((c) => c.source === key)
                return (
                  <motion.li key={key} variants={staggerItem} className="source-item">
                    <div className="source-item__main">
                      <div className="source-item__title">{s.full}</div>
                      {s.details && <div className="source-item__details">{s.details}</div>}
                      {courses.length > 0 && (
                        <div className="source-item__used">
                          Используется в темах: {courses.map((c) => c.period).join('; ')}
                        </div>
                      )}
                    </div>
                    {s.url && (
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="icon-btn" aria-label="Открыть страницу издания">
                        <ExternalLink size={18} />
                      </a>
                    )}
                  </motion.li>
                )
              })}
            </motion.ul>
          </Reveal>
        ))}

        <Reveal as="section" className="about-section notice">
          <h2>
            <Info size={24} /> Важно знать
          </h2>
          <ul className="principles">
            <li>
              Конспекты — это <b>авторский краткий пересказ</b> для повторения, а не копия учебника. Для полной подготовки
              читай сам учебник.
            </li>
            <li>
              Задания составлены <b>по образцу</b> заданий ЕГЭ и ОГЭ (формат ФИПИ) и не являются заданиями из официального
              открытого банка или пособий. Структура экзамена может меняться — сверяйся с демоверсией на fipi.ru.
            </li>
            <li>Даты по истории России до 1918 года указаны по старому стилю, в скобках — по новому, где это важно.</li>
            <li>Схемы в заданиях ЕГЭ и ОГЭ показывают места событий на современной подложке; границы того времени отличались.</li>
            <li>
              Нашёл неточность? Напиши учителю или автору проекта — материал регулярно проверяется. Подробнее —{' '}
              <Link to="/about">о проекте</Link>.
            </li>
          </ul>
        </Reveal>
      </div>
    </div>
  )
}
