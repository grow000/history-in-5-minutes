// Проверка заданий по номерам КИМ (src/data/kim/*.js)
// Запуск: node scripts/validate-kim.mjs [файл.js]  (без аргумента — все файлы)
import { existsSync, readdirSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const dir = path.join(root, 'src', 'data', 'kim')
const topicsDir = path.join(root, 'src', 'data', 'topics')
const { KIM_SPEC } = await import(pathToFileURL(path.join(root, 'src', 'data', 'kim-spec.js')).href)
const { COURSES } = await import(pathToFileURL(path.join(root, 'src', 'data', 'courses-meta.js')).href)
const courses = Object.fromEntries(COURSES.map((c) => [c.id, c]))

const topics = {}
for (const f of readdirSync(topicsDir).filter((f) => f.endsWith('.js'))) {
  for (const t of (await import(pathToFileURL(path.join(topicsDir, f)).href)).default) topics[t.id] = t
}

const only = process.argv[2]
const files = existsSync(dir)
  ? readdirSync(dir).filter((f) => f.endsWith('.js')).filter((f) => !only || f === path.basename(only)).sort()
  : []

const str = (v) => typeof v === 'string' && v.trim().length > 0
const errors = []
const perKim = {}
let total = 0

for (const file of files) {
  const list = (await import(pathToFileURL(path.join(dir, file)).href)).default
  if (!Array.isArray(list)) {
    errors.push(`${file}: export default должен быть массивом`)
    continue
  }
  list.forEach((k, i) => {
    total++
    const e = (m) => errors.push(`${file} [${i}] ${k.kim ?? '?'} ${k.topic ?? '?'}: ${m}`)
    const topic = topics[k.topic]
    if (!topic) return e('тема не найдена')
    const spec = KIM_SPEC[k.kim]
    if (!spec) return e('неизвестный kim')
    perKim[k.kim] = (perKim[k.kim] ?? 0) + 1
    const exam = k.kim.split('-')[0]
    if (!courses[topic.course]?.exams.includes(exam)) e(`${exam.toUpperCase()} не охватывает курс ${topic.course}`)
    if (exam === 'oge' && !topic.course.startsWith('rus')) e('ОГЭ-номера этого набора — только история России')
    if (k.type !== spec.type) e(`тип должен быть ${spec.type}`)
    for (const need of spec.needs ?? []) if (!k[need]) e(`нужно поле ${need}`)
    if (!str(k.text)) e('нет text')
    if (k.type !== 'open' && !str(k.explanation)) e('нет explanation')
    if (k.source && (!str(k.source.text) || !str(k.source.title))) e('source без title/text')
    if (k.sources && (!Array.isArray(k.sources) || k.sources.length !== 2 || k.sources.some((s) => !str(s?.text) || !str(s?.title)))) e('sources: нужно 2 источника с title/text')
    if (k.image !== undefined && !str(k.image)) e('image пустой')
    if (/'/.test(JSON.stringify(k))) e('апостроф в тексте')
    const digits = String(k.answer ?? '')
    const inRange = (n) => /^\d+$/.test(digits) && [...digits].every((d) => +d >= 1 && +d <= n)
    switch (k.type) {
      case 'grid': {
        if (!Array.isArray(k.columns) || k.columns.length !== 3) e('columns: нужно 3 заголовка')
        if (!Array.isArray(k.rows) || k.rows.length < 3 || k.rows.length > 4) e('rows: 3–4 строки')
        k.rows?.forEach((r, j) => {
          if (!Array.isArray(r) || r.length !== 3) e(`rows[${j}]: нужно 3 ячейки`)
          else if (r.every((c) => c === '?')) e(`rows[${j}]: нет ни одного заполненного элемента`)
          r?.forEach?.((c) => !str(c) && e(`rows[${j}]: пустая ячейка`))
        })
        const gaps = (k.rows ?? []).flat().filter((c) => c === '?').length
        if (gaps !== 6) e(`пропусков ${gaps}, нужно 6`)
        if (!Array.isArray(k.options) || k.options.length < 8 || k.options.length > 9) e('options: 8–9 вариантов')
        if (digits.length !== 6 || !inRange(k.options?.length ?? 0)) e(`answer «${digits}»: 6 цифр в диапазоне`)
        if (new Set(digits).size !== digits.length) e('в answer повторяются цифры')
        break
      }
      case 'multi': {
        const n = k.options?.length ?? 0
        if (n < 5 || n > 6) e('options: 5–6')
        if (!inRange(n) || [...digits].sort().join('') !== digits || new Set(digits).size !== digits.length) e('answer: цифры по возрастанию без повторов')
        if (digits.length !== 2) e('верных должно быть 2')
        if (k.map) {
          if (!k.map.points?.length && !k.map.routes?.length) e('map: нет точек')
          k.map.points?.forEach((p, j) => (!str(p.name) || typeof p.lat !== 'number' || typeof p.lng !== 'number') && e(`map.points[${j}]`))
          k.map.routes?.forEach((r, j) => (!Array.isArray(r.path) || r.path.length < 2) && e(`map.routes[${j}]`))
        }
        break
      }
      case 'single': {
        const n = k.options?.length ?? 0
        if (n !== 4) e('options: 4')
        if (!/^\d$/.test(digits) || !inRange(n)) e('answer вне диапазона')
        break
      }
      case 'term':
      case 'scheme': {
        if (!Array.isArray(k.answer) || !k.answer.length || k.answer.some((a) => !str(a))) e('answer — массив строк')
        if (k.type === 'scheme') {
          if (!str(k.scheme?.top) || !Array.isArray(k.scheme?.items)) e('scheme: нужны top и items')
          else {
            if (k.scheme.items.length < 2 || k.scheme.items.length > 5) e('scheme.items: 2–5')
            if (k.scheme.items.filter((x) => String(x).includes('___')).length !== 1) e('scheme.items: ровно один элемент с ___')
          }
        }
        break
      }
      case 'thesis': {
        if (!Array.isArray(k.sentences) || k.sentences.length !== 4 || k.sentences.some((s) => !str(s))) e('sentences: 4')
        if ([...digits].sort().join('') !== '1234') e('answer — перестановка 1234')
        break
      }
      case 'stats': {
        if (!str(k.data?.title) || !Array.isArray(k.data?.columns) || !k.data?.rows?.length) e('data: title/columns/rows')
        k.data?.rows?.forEach((r, j) => r.length !== k.data.columns.length && e(`data.rows[${j}]: число ячеек`))
        if (!Array.isArray(k.statements) || k.statements.length !== 3) e('statements: 3')
        k.statements?.forEach((s, j) => (s.split('___').length !== 2) && e(`statements[${j}]: ровно один ___`))
        const n = k.options?.length ?? 0
        if (n < 5 || n > 6) e('options: 5–6')
        if (digits.length !== 3 || !inRange(n) || new Set(digits).size !== 3) e('answer: 3 разные цифры')
        break
      }
      case 'open': {
        if (k.points !== spec.points) e(`points должно быть ${spec.points}`)
        if (!Array.isArray(k.criteria) || k.criteria.length < 2 || k.criteria.some((c) => !str(c))) e('criteria: минимум 2 строки')
        if (!Array.isArray(k.sample) || !k.sample.length || k.sample.some((c) => !str(c))) e('sample: элементы ответа')
        break
      }
      default:
        e('неизвестный type')
    }
  })
}

console.log(`Заданий КИМ: ${total}`, Object.fromEntries(Object.entries(perKim).sort(([a], [b]) => a.localeCompare(b, 'ru', { numeric: true }))))
if (!only) {
  const missing = Object.keys(KIM_SPEC).filter((k) => !perKim[k])
  if (missing.length) console.log('Нет заданий для номеров:', missing.join(', '))
}
if (errors.length) {
  console.error(`\nОшибок: ${errors.length}`)
  errors.slice(0, 80).forEach((m) => console.error(' - ' + m))
  process.exit(1)
}
console.log('Все задания КИМ прошли проверку ✓')
