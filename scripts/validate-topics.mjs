// Проверка тем курса: структура, тесты, задания ЕГЭ/ОГЭ, карты.
// Запуск: node scripts/validate-topics.mjs [файл.js]  (без аргумента — все файлы)
import { readdirSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const dir = path.join(root, 'src', 'data', 'topics')
const { COURSES } = await import(pathToFileURL(path.join(root, 'src', 'data', 'courses-meta.js')).href)
const courses = Object.fromEntries(COURSES.map((c) => [c.id, c]))

const only = process.argv[2]
const files = readdirSync(dir)
  .filter((f) => f.endsWith('.js'))
  .filter((f) => !only || f === path.basename(only))
  .sort()

const errors = []
const all = []
for (const file of files) {
  const mod = await import(pathToFileURL(path.join(dir, file)).href)
  for (const t of mod.default) all.push({ file, t })
}

const str = (v) => typeof v === 'string' && v.trim().length > 0
const ids = new Set()
const SECTION_KEYS = ['terms', 'dates', 'people', 'map', 'table', 'facts', 'significance']

for (const { file, t } of all) {
  const err = (m) => errors.push(`${file} → ${t.id ?? '?'}: ${m}`)
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(t.id ?? '')) err('некорректный id')
  if (ids.has(t.id)) err('повторяющийся id')
  ids.add(t.id)

  const course = courses[t.course]
  if (!course) err(`неизвестный курс ${t.course}`)
  const chapter = course?.chapters.find((c) => c.n === t.chapter)
  if (course && !chapter) err(`в курсе нет главы ${t.chapter}`)
  if (chapter && t.paragraphs && !chapter.paragraphs.some((p) => p.startsWith(t.paragraphs.replace(/-/g, '–') + '.'))) {
    err(`параграфы «${t.paragraphs}» не найдены в главе ${t.chapter}`)
  }
  for (const k of ['title', 'period', 'summary', 'intro', 'significance']) if (!str(t[k])) err(`пустое поле ${k}`)
  if (!Number.isInteger(t.year)) err('year не целое число')

  const len = (k, min, max) => {
    if (!Array.isArray(t[k])) return err(`${k} не массив`)
    if (t[k].length < min || t[k].length > max) err(`${k}: ${t[k].length} (нужно ${min}–${max})`)
  }
  len('sections', 3, 8)
  len('people', 2, 8)
  len('terms', 3, 12)
  len('dates', 3, 14)
  len('facts', 5, 5)
  len('quiz', 5, 9)
  len('tasks', 3, 8)

  const sectionIds = new Set()
  t.sections?.forEach((s, i) => {
    if (!str(s.id) || !str(s.title)) err(`sections[${i}] без id/title`)
    if (sectionIds.has(s.id)) err(`повтор id раздела ${s.id}`)
    sectionIds.add(s.id)
    if (!(s.paragraphs?.length || s.list?.length)) err(`sections[${i}] пустой`)
    s.paragraphs?.forEach((p) => !str(p) && err(`sections[${i}] пустой абзац`))
  })
  t.people?.forEach((p, i) => (!str(p.name) || !str(p.role)) && err(`people[${i}] неполный`))
  t.terms?.forEach((p, i) => (!str(p.term) || !str(p.definition)) && err(`terms[${i}] неполный`))
  t.dates?.forEach((p, i) => (!str(p.date) || !str(p.text)) && err(`dates[${i}] неполный`))
  t.facts?.forEach((p, i) => !str(p) && err(`facts[${i}] пустой`))

  if (t.table) {
    if (!Array.isArray(t.table.columns) || !Array.isArray(t.table.rows) || !t.table.rows.length) err('table неполная')
    t.table.rows?.forEach((r, i) => r.length !== t.table.columns.length && err(`table.rows[${i}]: ${r.length} ячеек, а колонок ${t.table.columns.length}`))
  }

  const checkMap = (m, where) => {
    if (!m.points?.length && !m.routes?.length) err(`${where}: нет точек`)
    m.points?.forEach((p, i) => {
      if (!str(p.name)) err(`${where}.points[${i}] без name`)
      if (typeof p.lat !== 'number' || typeof p.lng !== 'number' || Math.abs(p.lat) > 85 || Math.abs(p.lng) > 180) err(`${where}.points[${i}] плохие координаты`)
    })
    m.routes?.forEach((r, i) => {
      if (!Array.isArray(r.path) || r.path.length < 2) err(`${where}.routes[${i}] короткий путь`)
      r.path?.forEach((pt) => (!Array.isArray(pt) || pt.length !== 2 || pt.some((x) => typeof x !== 'number')) && err(`${where}.routes[${i}] плохая точка`))
    })
  }
  if (t.map) {
    if (!str(t.map.title)) err('map без title')
    checkMap(t.map, 'map')
  }

  t.quiz?.forEach((q, i) => {
    if (!str(q.question)) err(`quiz[${i}] без вопроса`)
    if (!Array.isArray(q.options) || q.options.length !== 4) err(`quiz[${i}] нужно 4 варианта`)
    else if (new Set(q.options.map((o) => String(o).trim().toLowerCase())).size !== 4) err(`quiz[${i}] повтор вариантов`)
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) err(`quiz[${i}] answer`)
    if (!str(q.explanation)) err(`quiz[${i}] без explanation`)
    if (!(sectionIds.has(q.section) || SECTION_KEYS.includes(q.section))) err(`quiz[${i}] section «${q.section}» не существует`)
    if (q.section === 'map' && !t.map) err(`quiz[${i}] ссылается на карту, а карты нет`)
    if (q.section === 'table' && !t.table) err(`quiz[${i}] ссылается на таблицу, а таблицы нет`)
  })

  if (!t.exam || typeof t.exam.ege !== 'boolean' || typeof t.exam.oge !== 'boolean') err('exam {ege, oge} не заданы')

  t.tasks?.forEach((k, i) => {
    const e = (m) => err(`tasks[${i}] (${k.type}): ${m}`)
    if (!Array.isArray(k.exam) || !k.exam.length || k.exam.some((x) => !['ege', 'oge'].includes(x))) e('exam')
    if (k.exam?.includes('oge') && !courses[t.course]?.exams.includes('oge')) e('ОГЭ не охватывает этот период')
    if (!str(k.text)) e('нет text')
    if (!str(k.explanation)) e('нет explanation')
    const digits = String(k.answer ?? '')
    switch (k.type) {
      case 'match': {
        if (!k.left?.length || !k.right?.length) return e('нет left/right')
        if (k.right.length <= k.left.length) e('в правом столбце должны быть лишние варианты')
        if (!/^\d+$/.test(digits) || digits.length !== k.left.length) e(`answer «${digits}» не совпадает с числом позиций`)
        if ([...digits].some((d) => +d < 1 || +d > k.right.length)) e('answer вне диапазона')
        if (new Set(digits).size !== digits.length) e('в answer повторяются цифры')
        break
      }
      case 'sequence': {
        const n = k.items?.length ?? 0
        if (n < 3) e('мало items')
        if ([...digits].sort().join('') !== Array.from({ length: n }, (_, j) => j + 1).join('')) e(`answer «${digits}» не перестановка 1..${n}`)
        break
      }
      case 'multi': {
        const n = k.options?.length ?? 0
        if (n < 5) e('мало options')
        if (!/^\d+$/.test(digits) || [...digits].some((d) => +d < 1 || +d > n)) e('answer вне диапазона')
        if ([...digits].sort().join('') !== digits || new Set(digits).size !== digits.length) e('answer: цифры по возрастанию без повторов')
        break
      }
      case 'single': {
        const n = k.options?.length ?? 0
        if (n < 4) e('мало options')
        if (!/^\d$/.test(digits) || +digits < 1 || +digits > n) e('answer вне диапазона')
        break
      }
      case 'term': {
        if (!Array.isArray(k.answer) || !k.answer.length || k.answer.some((a) => !str(a))) e('answer должен быть массивом строк')
        break
      }
      case 'map': {
        if (!k.map) return e('нет map')
        checkMap(k.map, `tasks[${i}].map`)
        if (k.accept) {
          if (!Array.isArray(k.accept) || !k.accept.length) e('accept пустой')
        } else if (!k.options?.length || !/^\d$/.test(digits) || +digits > k.options.length) e('нужен accept или options+answer')
        break
      }
      default:
        e('неизвестный type')
    }
  })
}

const byCourse = {}
all.forEach(({ t }) => (byCourse[t.course] = (byCourse[t.course] ?? 0) + 1))
const tasks = all.reduce((s, { t }) => s + (t.tasks?.length ?? 0), 0)
console.log(`Тем: ${all.length}, заданий ЕГЭ/ОГЭ: ${tasks}, карт: ${all.filter(({ t }) => t.map).length}`, byCourse)

// Покрытие параграфов учебников (только при полной проверке)
if (!only) {
  const missing = []
  for (const c of COURSES) {
    for (const ch of c.chapters) {
      for (const p of ch.paragraphs) {
        const num = p.split('.')[0]
        const covered = all.some(({ t }) => t.course === c.id && t.chapter === ch.n && t.paragraphs?.replace(/-/g, '–') === num)
        if (!covered) missing.push(`${c.short}, гл. ${ch.n}: ${p}`)
      }
    }
  }
  if (missing.length) {
    console.log(`\nНе покрыто параграфов: ${missing.length}`)
    missing.slice(0, 40).forEach((m) => console.log('  · ' + m))
  } else console.log('Все параграфы учебников покрыты темами ✓')
}

if (errors.length) {
  console.error(`\nОшибок: ${errors.length}`)
  errors.slice(0, 80).forEach((e) => console.error(' - ' + e))
  process.exit(1)
}
console.log('Все темы прошли проверку ✓')
