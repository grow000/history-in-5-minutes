// Собираем все события из src/data/events/*.js — чтобы добавить новые,
// достаточно создать ещё один файл в этой папке.
const modules = import.meta.glob('./events/*.js', { eager: true })

export const ERAS = {
  ancient: { id: 'ancient', title: 'Древний мир', range: 'до V века', color: '#d97706', emoji: '🏛️' },
  medieval: { id: 'medieval', title: 'Средние века', range: 'V–XV века', color: '#7c3aed', emoji: '🏰' },
  'early-modern': { id: 'early-modern', title: 'Новое время', range: 'XVI–XIX века', color: '#0d9488', emoji: '⛵' },
  modern: { id: 'modern', title: 'Новейшее время', range: 'XX век', color: '#2563eb', emoji: '🚀' },
  contemporary: { id: 'contemporary', title: 'XXI век', range: 'с 2001 года', color: '#db2777', emoji: '📱' },
}

export const ERA_LIST = Object.values(ERAS)

export const CATEGORIES = {
  war: 'Войны и битвы',
  politics: 'Политика',
  culture: 'Культура',
  science: 'Наука и техника',
  religion: 'Религия',
  discovery: 'Открытия',
  economy: 'Экономика',
  society: 'Общество',
}

const eraOrder = Object.keys(ERAS)

export const events = Object.keys(modules)
  .sort()
  .flatMap((path) => modules[path].default)
  .map((ev, i) => ({ ...ev, _order: i, readTime: readTime(ev) }))
  .sort((a, b) => a.year - b.year || eraOrder.indexOf(a.era) - eraOrder.indexOf(b.era) || a._order - b._order)

export const eventsById = Object.fromEntries(events.map((e) => [e.id, e]))

function readTime(ev) {
  const text = [
    ev.whatHappened,
    ...ev.causes,
    ...ev.course,
    ...ev.people.map((p) => p.name + ' ' + p.role),
    ...ev.timeline.map((t) => t.text),
    ...ev.facts,
    ev.significance,
  ].join(' ')
  const words = text.split(/\s+/).length
  return Math.max(2, Math.min(5, Math.round(words / 160)))
}

export function normalize(str) {
  return String(str).toLowerCase().replace(/ё/g, 'е')
}

const haystacks = new Map(
  events.map((ev) => [
    ev.id,
    normalize(
      [
        ev.title,
        ev.summary,
        ev.date,
        ev.region,
        ERAS[ev.era]?.title,
        CATEGORIES[ev.category],
        ...ev.people.map((p) => p.name),
        ev.whatHappened,
      ].join(' ')
    ),
  ])
)

export function filterEvents({ q = '', era = 'all', cat = 'all', sort = 'asc' }) {
  const tokens = normalize(q).trim().split(/\s+/).filter(Boolean)
  const list = events.filter((ev) => {
    if (era !== 'all' && ev.era !== era) return false
    if (cat !== 'all' && ev.category !== cat) return false
    if (!tokens.length) return true
    const hay = haystacks.get(ev.id)
    return tokens.every((t) => hay.includes(t))
  })
  // Сначала — совпадения в названии
  if (tokens.length) {
    const inTitle = (ev) => tokens.every((t) => normalize(ev.title).includes(t))
    list.sort((a, b) => Number(inTitle(b)) - Number(inTitle(a)))
  }
  if (sort === 'desc' && !tokens.length) list.reverse()
  return list
}

export function plural(n, forms) {
  const n10 = n % 10
  const n100 = n % 100
  if (n10 === 1 && n100 !== 11) return forms[0]
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return forms[1]
  return forms[2]
}
