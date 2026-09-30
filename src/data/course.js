import { normalize } from './index.js'
import { COURSES, SOURCES } from './courses-meta.js'

export { COURSES, SOURCES }

// Темы курса: src/data/topics/*.js — каждый файл экспортирует массив тем
const modules = import.meta.glob('./topics/*.js', { eager: true })

const courseOrder = COURSES.map((c) => c.id)

export const topics = Object.keys(modules)
  .sort()
  .flatMap((path) => modules[path].default)
  .sort(
    (a, b) =>
      courseOrder.indexOf(a.course) - courseOrder.indexOf(b.course) ||
      a.chapter - b.chapter ||
      (a.order ?? 0) - (b.order ?? 0)
  )

export const topicsById = Object.fromEntries(topics.map((t) => [t.id, t]))
export const coursesById = Object.fromEntries(COURSES.map((c) => [c.id, c]))

export function topicsOfCourse(courseId) {
  return topics.filter((t) => t.course === courseId)
}

export function chaptersOfCourse(courseId) {
  const course = coursesById[courseId]
  return (course?.chapters ?? []).map((ch) => ({
    ...ch,
    topics: topics.filter((t) => t.course === courseId && t.chapter === ch.n),
  }))
}

export function neighbours(topicId) {
  const i = topics.findIndex((t) => t.id === topicId)
  return { prev: topics[i - 1], next: topics[i + 1] }
}

const haystacks = new Map(
  topics.map((t) => [
    t.id,
    normalize(
      [t.title, t.summary, t.period, coursesById[t.course]?.title, ...t.people.map((p) => p.name), ...t.terms.map((x) => x.term)].join(' ')
    ),
  ])
)

export function searchTopics(q) {
  const tokens = normalize(q).trim().split(/\s+/).filter(Boolean)
  if (!tokens.length) return []
  return topics.filter((t) => tokens.every((tok) => haystacks.get(t.id).includes(tok)))
}

// ---------- ЕГЭ / ОГЭ ----------

export const EXAMS = {
  ege: { id: 'ege', title: 'ЕГЭ', full: 'Единый государственный экзамен', grade: '11 класс', color: '#4f46e5' },
  oge: { id: 'oge', title: 'ОГЭ', full: 'Основной государственный экзамен', grade: '9 класс', color: '#0d9488' },
}

export const TASK_TYPES = {
  single: { title: 'Выбор ответа', hint: 'Выберите один верный вариант и запишите его номер.' },
  multi: { title: 'Несколько верных', hint: 'Выберите верные утверждения и запишите их номера в порядке возрастания.' },
  sequence: { title: 'Хронология', hint: 'Расположите события в хронологической последовательности и запишите цифры.' },
  match: { title: 'Соответствие', hint: 'Установите соответствие: к каждой позиции первого столбца подберите позицию из второго.' },
  term: { title: 'Термин / понятие', hint: 'Запишите ответ словом (сочетанием слов).' },
  map: { title: 'Работа с картой', hint: 'Рассмотрите карту и ответьте на вопрос.' },
}

// Все задания банка с привязкой к теме
export const tasks = topics.flatMap((t) =>
  (t.tasks ?? []).map((task, i) => ({ ...task, id: `${t.id}-${i + 1}`, topic: t.id, topicTitle: t.title, course: t.course, chapter: t.chapter }))
)

export const tasksById = Object.fromEntries(tasks.map((t) => [t.id, t]))

export function tasksFor({ exam, course, topic, type }) {
  return tasks.filter(
    (t) =>
      (!exam || t.exam.includes(exam)) &&
      (!course || t.course === course) &&
      (!topic || t.topic === topic) &&
      (!type || t.type === type)
  )
}

// Максимальный балл задания
export function maxPoints(task) {
  return task.type === 'match' || task.type === 'multi' ? 2 : 1
}

function digits(s) {
  return String(s).replace(/[^0-9]/g, '')
}

// Проверка ответа как на экзамене: для соответствия и множественного выбора одна ошибка = 1 балл
export function checkTask(task, raw) {
  const max = maxPoints(task)
  if (task.type === 'term' || (task.type === 'map' && task.accept)) {
    const variants = task.type === 'term' ? task.answer : task.accept
    const norm = (s) => normalize(s).replace(/[^a-zа-я0-9]/g, '')
    const ok = variants.some((v) => norm(v) === norm(raw))
    return { points: ok ? 1 : 0, max }
  }
  const given = digits(raw)
  const right = digits(task.answer)
  if (!given) return { points: 0, max }
  if (task.type === 'multi') {
    const g = [...new Set(given)].sort().join('')
    const r = [...right].sort().join('')
    if (g === r) return { points: 2, max }
    // одна ошибка: один лишний или один недостающий/неверный номер
    const missing = [...r].filter((c) => !g.includes(c)).length
    const extra = [...g].filter((c) => !r.includes(c)).length
    if (g.length <= r.length + 1 && missing + extra === 1) return { points: 1, max }
    if (g.length === r.length && missing === 1 && extra === 1) return { points: 1, max }
    return { points: 0, max }
  }
  if (task.type === 'match') {
    if (given.length !== right.length) return { points: 0, max }
    const errors = [...right].filter((c, i) => given[i] !== c).length
    return { points: errors === 0 ? 2 : errors === 1 ? 1 : 0, max }
  }
  // sequence, single, map (цифрой)
  return { points: given === right ? 1 : 0, max }
}

export function formatAnswer(task) {
  if (task.type === 'term') return task.answer[0]
  if (task.type === 'map' && task.accept) return task.accept[0]
  return String(task.answer)
}
