// Проверка всех событий: структура, обязательные поля, викторины.
// Запуск: npm run check
import { readdirSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'events')
const ERAS = ['ancient', 'medieval', 'early-modern', 'modern', 'contemporary']
const CATEGORIES = ['war', 'politics', 'culture', 'science', 'religion', 'discovery', 'economy', 'society']

const errors = []
const all = []

for (const file of readdirSync(dir).filter((f) => f.endsWith('.js')).sort()) {
  const mod = await import(pathToFileURL(path.join(dir, file)).href)
  for (const ev of mod.default) all.push({ file, ev })
}

const ids = new Set()
const str = (v) => typeof v === 'string' && v.trim().length > 0

for (const { file, ev } of all) {
  const where = `${file} → ${ev.id ?? '(без id)'}`
  const err = (msg) => errors.push(`${where}: ${msg}`)

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(ev.id ?? '')) err('некорректный id')
  if (ids.has(ev.id)) err('повторяющийся id')
  ids.add(ev.id)

  for (const key of ['title', 'region', 'date', 'emoji', 'summary', 'whatHappened', 'significance']) {
    if (!str(ev[key])) err(`пустое поле ${key}`)
  }
  if (!ERAS.includes(ev.era)) err(`неизвестная эпоха ${ev.era}`)
  if (!CATEGORIES.includes(ev.category)) err(`неизвестная категория ${ev.category}`)
  if (!Number.isInteger(ev.year)) err('year должен быть целым числом')

  const list = (key, min, max) => {
    const v = ev[key]
    if (!Array.isArray(v)) return err(`${key} не массив`)
    if (v.length < min || v.length > max) err(`${key}: ${v.length} (нужно ${min}–${max})`)
  }
  list('causes', 3, 6)
  list('course', 3, 7)
  list('people', 2, 6)
  list('timeline', 3, 8)
  list('facts', 5, 5)
  list('quiz', 5, 5)

  ev.causes?.forEach((c, i) => !str(c) && err(`causes[${i}] пусто`))
  ev.course?.forEach((c, i) => !str(c) && err(`course[${i}] пусто`))
  ev.facts?.forEach((c, i) => !str(c) && err(`facts[${i}] пусто`))
  ev.people?.forEach((p, i) => (!str(p.name) || !str(p.role)) && err(`people[${i}] неполный`))
  ev.timeline?.forEach((t, i) => (!str(t.date) || !str(t.text)) && err(`timeline[${i}] неполный`))

  ev.quiz?.forEach((q, i) => {
    if (!str(q.question)) err(`quiz[${i}] без вопроса`)
    if (!Array.isArray(q.options) || q.options.length !== 4) err(`quiz[${i}] должно быть 4 варианта`)
    else {
      if (new Set(q.options.map((o) => o.trim().toLowerCase())).size !== 4) err(`quiz[${i}] повторяющиеся варианты`)
      q.options.forEach((o, j) => !str(o) && err(`quiz[${i}].options[${j}] пусто`))
    }
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) err(`quiz[${i}] некорректный answer`)
    if (!str(q.explanation)) err(`quiz[${i}] нет пояснения`)
  })
}

const byEra = Object.fromEntries(ERAS.map((e) => [e, all.filter((x) => x.ev.era === e).length]))
console.log(`Событий: ${all.length}`, byEra)
if (errors.length) {
  console.error(`\nОшибок: ${errors.length}`)
  errors.forEach((e) => console.error(' - ' + e))
  process.exit(1)
}
console.log('Все события прошли проверку ✓')
