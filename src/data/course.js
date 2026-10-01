import { normalize } from './index.js'
import { COURSES, SOURCES } from './courses-meta.js'
import { KIM_SPEC, GRID_LETTERS } from './kim-spec.js'

export { COURSES, SOURCES, KIM_SPEC, GRID_LETTERS }

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

// Поля для поиска с весами: совпадение в названии важнее, чем упоминание в тексте
const searchIndex = topics.map((t, order) => ({
  topic: t,
  order,
  fields: [
    { text: normalize(t.title), weight: 10 },
    { text: normalize(t.people.map((p) => p.name).join(' · ')), weight: 5 },
    { text: normalize(t.terms.map((x) => x.term).join(' · ')), weight: 4 },
    { text: normalize([t.period, ...t.dates.map((d) => d.date + ' ' + d.text)].join(' · ')), weight: 3 },
    { text: normalize([t.summary, ...t.sections.map((s) => s.title), coursesById[t.course]?.title].join(' · ')), weight: 2 },
    { text: normalize([t.intro, ...t.sections.flatMap((s) => [...(s.paragraphs ?? []), ...(s.list ?? [])])].join(' · ')), weight: 1 },
  ],
}))

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const ROMAN = { 1: 'i', 2: 'ii', 3: 'iii', 4: 'iv', 5: 'v', 6: 'vi', 7: 'vii', 8: 'viii', 9: 'ix' }

// Простая «основа» слова: отбрасываем окончание, чтобы «смута» находила «смуты», «перестройка» — «перестройки»
const stemOf = (tok) => (tok.length >= 5 ? tok.replace(/(ами|ями|ого|его|ому|ему|ой|ей|ий|ый|ая|яя|ое|ее|ые|ие|ов|ев|ам|ям|ах|ях|а|я|ы|и|у|ю|е|о|ь|й)$/, '') : tok)

// Целое слово (с учётом окончания) ценнее начала слова («ленин» ≠ «ленинград»), начало слова ценнее подстроки
function tokenScore(fields, token) {
  const t = escapeRe(token)
  const stem = escapeRe(stemOf(token))
  const B = '[^а-яa-z0-9]'
  const whole = new RegExp(`(^|${B})${t}($|${B})`)
  const wordForm = new RegExp(`(^|${B})${stem}[а-я]{0,3}($|${B})`)
  const start = new RegExp(`(^|${B})${t}`)
  const isYear = /^\d{3,4}$/.test(token)
  let best = 0
  for (const f of fields) {
    // для годов важнее всего хронология темы (поле дат)
    const weight = isYear && f.weight === 3 ? 9 : f.weight
    let s = 0
    if (whole.test(f.text)) s = weight + 3
    else if (wordForm.test(f.text)) s = weight + 2
    else if (start.test(f.text)) s = weight * 0.6
    else if (f.text.includes(token)) s = weight * 0.3
    if (isYear && s) s += Math.min(4, f.text.split(token).length - 1)
    best = Math.max(best, s)
  }
  // небольшой бонус за частоту упоминаний во всей теме
  const all = fields.map((f) => f.text).join(' ')
  const freq = (all.match(new RegExp(`(^|${B})${stem}`, 'g')) ?? []).length
  return best ? best + Math.min(4, freq) * 0.5 : 0
}

// Фраза целиком, по границам слов и с учётом окончаний: «пётр i», но не «александр iii» для «александр ii»
function phraseRe(tokens) {
  const B = '[^а-яa-z0-9]'
  const parts = tokens.map((t) => `${escapeRe(stemOf(t))}${t.length >= 5 ? '[а-я]{0,3}' : ''}`)
  return new RegExp(`(^|${B})${parts.join(`${B}+`)}($|${B})`)
}

export function searchTopics(q) {
  const query = normalize(q).trim()
  // «Пётр 1» → «пётр i»: номера правителей в темах записаны римскими цифрами
  const tokens = query
    .split(/\s+/)
    .filter(Boolean)
    .map((tok, i) => (i > 0 && /^[1-9]$/.test(tok) ? ROMAN[tok] : tok))
  if (!tokens.length) return []
  const phrase = phraseRe(tokens)
  const results = []
  for (const entry of searchIndex) {
    let score = 0
    let ok = true
    for (const tok of tokens) {
      const s = tokenScore(entry.fields, tok)
      if (!s) {
        ok = false
        break
      }
      score += s
    }
    if (!ok) continue
    // вся фраза подряд: в названии темы или среди личностей («пётр i»)
    if (phrase.test(entry.fields[0].text)) score += 15
    else if (tokens.length > 1 && phrase.test(entry.fields[1].text)) score += 10
    results.push({ topic: entry.topic, score, order: entry.order })
  }
  return results.sort((a, b) => b.score - a.score || a.order - b.order).map((r) => r.topic)
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
  grid: { title: 'Таблица', hint: 'Заполните пустые ячейки таблицы: запишите номера элементов для букв А–Е по порядку.' },
  thesis: { title: 'Тезисы и факты', hint: 'Запишите номера предложений: тезис, факт к нему, второй тезис, факт к нему.' },
  stats: { title: 'Статистика', hint: 'Дополните суждения данными таблицы: запишите номера для букв А, Б, В.' },
  scheme: { title: 'Схема', hint: 'Запишите слово (сочетание слов), которое пропущено в схеме.' },
  open: { title: 'Развёрнутый ответ', hint: 'Напишите ответ, затем сравните его с эталоном и оцените себя по критериям.' },
}

// Задания по номерам КИМ: src/data/kim/*.js (часть 1 особых форматов и часть 2)
const kimModules = import.meta.glob('./kim/*.js', { eager: true })
const kimByTopic = {}
Object.keys(kimModules)
  .sort()
  .forEach((path) =>
    kimModules[path].default.forEach((k) => {
      if (!topicsById[k.topic] || !KIM_SPEC[k.kim]) return
      ;(kimByTopic[k.topic] ??= []).push(k)
    })
  )

// Все задания банка с привязкой к теме
export const tasks = topics.flatMap((t) => [
  ...(t.tasks ?? []).map((task, i) => ({ ...task, id: `${t.id}-${i + 1}`, topic: t.id, topicTitle: t.title, course: t.course, chapter: t.chapter })),
  ...(kimByTopic[t.id] ?? []).map((task, i) => ({
    ...task,
    exam: [task.kim.split('-')[0]],
    id: `${t.id}-k${i + 1}`,
    topic: t.id,
    topicTitle: t.title,
    course: t.course,
    chapter: t.chapter,
  })),
])

export const tasksById = Object.fromEntries(tasks.map((t) => [t.id, t]))

// ---------- Линии заданий, как в КИМ ФИПИ ----------

const matchTitles = (t) => `${t.leftTitle ?? ''} ${t.rightTitle ?? ''}`.toLowerCase()
const isDateMatch = (t) => /год|дат/.test(matchTitles(t)) || (t.right ?? []).every((r) => /^\s*\d{3,4}/.test(r))
const isCultureMatch = (t) => /произвед|памятник|культур|автор|создател|учён|учен|достижен/.test(matchTitles(t))
const isPeopleMatch = (t) => /участник|деятел|правител|личност|военачальн|князь|князья/.test(matchTitles(t))

const isWorld = (t) => String(t.course ?? '').startsWith('world')

const matchKind = (t) =>
  t.type !== 'match' ? null : isDateMatch(t) ? 'date' : isCultureMatch(t) ? 'culture' : isPeopleMatch(t) ? 'people' : 'process'

const kimIs = (id) => (t) => t.kim === id
const plain = (t) => !t.kim
const worldSingleKind = (t) =>
  /прочтите|отрыв|источник|документ/i.test(t.text ?? '') ? '17' : /деятел|кто из|о ком|кого из|правител|автор/i.test(t.text ?? '') ? '15' : '16'

// n — номер задания в КИМ; part — часть работы (1 — краткий ответ, 2 — развёрнутый); «+» — доп. тренировка
export const EXAM_LINES = {
  ege: [
    { id: '1', n: '1', part: 1, title: 'Даты: соответствие событий и годов', test: (t) => plain(t) && !isWorld(t) && matchKind(t) === 'date' },
    { id: '2', n: '2', part: 1, title: 'Хронологическая последовательность (Россия и мир)', test: (t) => plain(t) && t.type === 'sequence' },
    { id: '3', n: '3', part: 1, title: 'Соответствие: процессы, явления и факты', test: (t) => plain(t) && !isWorld(t) && matchKind(t) === 'process' },
    { id: '4', n: '4', part: 1, title: 'Систематизация: заполнение таблицы', test: kimIs('ege-4') },
    { id: '5', n: '5', part: 1, title: 'Соответствие: события и участники', test: (t) => plain(t) && !isWorld(t) && matchKind(t) === 'people' },
    { id: '6', n: '6', part: 1, title: 'Письменный источник: верные суждения', test: kimIs('ege-6') },
    { id: '7', n: '7', part: 1, title: 'Культура: памятники и их характеристики', test: (t) => plain(t) && !isWorld(t) && matchKind(t) === 'culture' },
    { id: '8', n: '8', part: 1, title: 'Великая Отечественная война: изображение', test: kimIs('ege-8') },
    { id: '9', n: '9–11', part: 1, title: 'Историческая карта (схема): названия и имена', test: (t) => plain(t) && !isWorld(t) && t.type === 'map' },
    { id: '12', n: '12', part: 1, title: 'Карта (схема): верные суждения', test: kimIs('ege-12') },
    { id: '13', n: '13', part: 2, title: 'Источник: атрибуция', test: kimIs('ege-13') },
    { id: '14', n: '14', part: 2, title: 'Источник: поиск информации', test: kimIs('ege-14') },
    { id: '15', n: '15', part: 2, title: 'Анализ изображения', test: kimIs('ege-15') },
    { id: '16', n: '16', part: 2, title: 'Культура: изображения и факты', test: kimIs('ege-16') },
    { id: '17', n: '17', part: 2, title: 'ВОВ: анализ двух источников', test: kimIs('ege-17') },
    { id: '18', n: '18', part: 2, title: 'Причины и следствия', test: kimIs('ege-18') },
    { id: '19', n: '19', part: 2, title: 'Историческое понятие', test: kimIs('ege-19') },
    { id: '20', n: '20', part: 2, title: 'Сравнение', test: kimIs('ege-20') },
    { id: '21', n: '21', part: 2, title: 'Аргументация точки зрения', test: kimIs('ege-21') },
    { id: 'multi', n: '+', title: 'Верные суждения по теме', test: (t) => plain(t) && t.type === 'multi' },
    { id: 'term', n: '+', title: 'Термины и понятия (к № 19)', test: (t) => plain(t) && t.type === 'term' },
    { id: 'odd', n: '+', title: 'Лишний элемент в ряду', test: (t) => plain(t) && !isWorld(t) && t.type === 'single' },
    { id: 'world', n: '+', title: 'Всеобщая история (к № 2 и 21)', test: (t) => plain(t) && isWorld(t) && t.type !== 'sequence' },
  ],
  oge: [
    { id: '1', n: '1', part: 1, title: 'Даты: соответствие событий и годов', test: (t) => plain(t) && matchKind(t) === 'date' },
    { id: '2', n: '2', part: 1, title: 'Хронологическая последовательность', test: (t) => plain(t) && !isWorld(t) && t.type === 'sequence' },
    { id: '3', n: '3', part: 1, title: 'Термин по определению', test: (t) => plain(t) && t.type === 'term' && !isWorld(t) },
    { id: '4', n: '4', part: 1, title: 'Выбор верных фактов', test: (t) => plain(t) && !isWorld(t) && t.type === 'multi' },
    { id: '5', n: '5', part: 1, title: 'Лишний термин в ряду', test: (t) => plain(t) && t.type === 'single' && !isWorld(t) },
    { id: '6', n: '6', part: 1, title: 'Тезисы и факты для аргументации', test: kimIs('oge-6') },
    { id: '7', n: '7', part: 1, title: 'Статистическая таблица', test: kimIs('oge-7') },
    { id: '8', n: '8–10', part: 1, title: 'Работа с исторической картой', test: (t) => plain(t) && t.type === 'map' && !isWorld(t) },
    { id: '11', n: '11', part: 1, title: 'Работа с изображением', test: kimIs('oge-11') },
    { id: '12', n: '12', part: 1, title: 'Логическая схема', test: kimIs('oge-12') },
    { id: '13', n: '13', part: 1, title: 'Культура: выбор памятников', test: kimIs('oge-13') },
    { id: '14', n: '14', part: 1, title: 'Культура: памятник', test: kimIs('oge-14') },
    { id: '15', n: '15', part: 1, title: 'Всеобщая история: исторические деятели', test: (t) => plain(t) && isWorld(t) && t.type === 'single' && worldSingleKind(t) === '15' },
    { id: '16', n: '16', part: 1, title: 'Всеобщая история: факты', test: (t) => plain(t) && isWorld(t) && (['map', 'term'].includes(t.type) || (t.type === 'single' && worldSingleKind(t) === '16')) },
    { id: '17', n: '17', part: 1, title: 'Всеобщая история: исторический источник', test: (t) => plain(t) && isWorld(t) && t.type === 'single' && worldSingleKind(t) === '17' },
    { id: '18', n: '18', part: 2, title: 'Источник: атрибуция', test: kimIs('oge-18') },
    { id: '19', n: '19', part: 2, title: 'Источник: поиск информации', test: kimIs('oge-19') },
    { id: '20', n: '20', part: 2, title: 'Источник: контекст', test: kimIs('oge-20') },
    { id: '21', n: '21', part: 2, title: 'Причины и следствия', test: kimIs('oge-21') },
    { id: '22', n: '22', part: 2, title: 'Исправление фактических ошибок', test: kimIs('oge-22') },
    { id: '23', n: '23', part: 2, title: 'Сравнение', test: kimIs('oge-23') },
    { id: '24', n: '24', part: 2, title: 'Анализ исторической ситуации', test: kimIs('oge-24') },
    { id: 'culture', n: '+', title: 'Культура: памятники и деятели (к № 13–14)', test: (t) => plain(t) && matchKind(t) === 'culture' },
    { id: 'match', n: '+', title: 'Соответствие: участники, процессы, факты', test: (t) => plain(t) && ['people', 'process'].includes(matchKind(t)) },
    { id: 'world', n: '+', title: 'Всеобщая история: соответствие и суждения', test: (t) => plain(t) && isWorld(t) && ['match', 'multi', 'sequence'].includes(t.type) && matchKind(t) !== 'date' },
  ],
}

// ---------- Исторические периоды (как разделы кодификатора ФИПИ, без деления на классы) ----------
export const PERIODS = [
  { id: 'rus-ancient', code: '1', section: 'От Руси к Российскому государству', title: 'Русь и русские земли', range: 'IX — начало XVI в.', color: '#b45309', parts: [{ course: 'rus-6' }] },
  { id: 'rus-16-17', code: '2', section: 'Россия в XVI–XVII вв.: от великого княжества к царству', title: 'Россия в XVI–XVII вв.', range: 'от великого княжества к царству', color: '#be123c', parts: [{ course: 'rus-7' }] },
  { id: 'rus-18', code: '3', section: 'Россия в конце XVII — XVIII в.: от царства к империи', title: 'Россия в конце XVII — XVIII в.', range: 'от царства к империи', color: '#7c3aed', parts: [{ course: 'rus-8', chapters: [1, 2, 3, 4] }] },
  { id: 'rus-19a', code: '4', section: 'Российская империя в XIX — начале XX в.', title: 'Россия в первой половине XIX в.', range: '1801–1855 гг.', color: '#0891b2', parts: [{ course: 'rus-8', chapters: [5] }, { course: 'rus-9', chapters: [1, 2] }] },
  { id: 'rus-19b', code: '4', section: 'Российская империя в XIX — начале XX в.', title: 'Россия во второй половине XIX — начале XX в.', range: '1855–1914 гг.', color: '#0d9488', parts: [{ course: 'rus-9', chapters: [3, 4, 5, 6, 7, 8] }] },
  { id: 'rus-1914', code: '7', section: 'История России. 1914–1945 гг.', title: 'Россия в 1914–1922 гг.', range: 'Первая мировая война, революция, Гражданская война', color: '#2563eb', parts: [{ course: 'rus-10', chapters: [1] }] },
  { id: 'ussr-20-30', code: '7', section: 'История России. 1914–1945 гг.', title: 'СССР в 1920–1930-е гг.', range: 'нэп, индустриализация, коллективизация', color: '#4f46e5', parts: [{ course: 'rus-10', chapters: [2] }] },
  { id: 'ww2', code: '8', section: 'Великая Отечественная война 1941–1945 гг.', title: 'Великая Отечественная война', range: '1941–1945 гг.', color: '#b91c1c', parts: [{ course: 'rus-10', chapters: [3] }] },
  { id: 'ussr-45-91', code: '9', section: 'СССР в 1945–1991 гг.', title: 'СССР в 1945–1991 гг.', range: 'от восстановления до распада СССР', color: '#c026d3', parts: [{ course: 'rus-11', chapters: [1] }] },
  { id: 'rf', code: '10', section: 'Российская Федерация в 1992–2022 гг.', title: 'Российская Федерация', range: '1992 — начало XXI в.', color: '#db2777', parts: [{ course: 'rus-11', chapters: [2] }] },
  { id: 'w-ancient', code: '5', section: 'Всеобщая история', title: 'Всеобщая история: Древний мир', range: 'от первобытности до V в.', color: '#d97706', world: true, parts: [{ course: 'world-5' }] },
  { id: 'w-medieval', code: '5', section: 'Всеобщая история', title: 'Всеобщая история: Средние века', range: 'V — XV вв.', color: '#7c3aed', world: true, parts: [{ course: 'world-6' }] },
  { id: 'w-new-1', code: '5', section: 'Всеобщая история', title: 'Всеобщая история: Новое время (XVI–XVII вв.)', range: 'конец XV — XVII в.', color: '#0d9488', world: true, parts: [{ course: 'world-7' }] },
  { id: 'w-new-2', code: '5', section: 'Всеобщая история', title: 'Всеобщая история: XVIII век', range: 'эпоха Просвещения и революций', color: '#0891b2', world: true, parts: [{ course: 'world-8' }] },
  { id: 'w-19', code: '5', section: 'Всеобщая история', title: 'Всеобщая история: XIX — начало XX в.', range: '1800–1914 гг.', color: '#2563eb', world: true, parts: [{ course: 'world-9' }] },
  { id: 'w-1914', code: '11', section: 'Всеобщая история. 1914–1945 гг.', title: 'Всеобщая история: 1914–1945 гг.', range: 'мировые войны и межвоенный период', color: '#b91c1c', world: true, parts: [{ course: 'world-10' }] },
  { id: 'w-1945', code: '12', section: 'Всеобщая история. 1945–2022 гг.', title: 'Всеобщая история: 1945 — начало XXI в.', range: 'холодная война и современный мир', color: '#db2777', world: true, parts: [{ course: 'world-11' }] },
]

const inPeriod = (item, period) =>
  period.parts.some((p) => p.course === item.course && (!p.chapters || p.chapters.includes(item.chapter)))

export function periodOf(item) {
  return PERIODS.find((p) => inPeriod(item, p)) ?? null
}

// Разделы для экзамена: ОГЭ — история России до 1914 г. и всеобщая история до начала XX в., ЕГЭ — весь курс
export function periodsFor(exam) {
  return PERIODS.filter((p) => topicsOfPeriod(p.id).some((t) => !exam || t.exam?.[exam]))
}

export function topicsFor(exam, periodId) {
  const list = periodId ? topicsOfPeriod(periodId) : topics
  return exam ? list.filter((t) => t.exam?.[exam]) : list
}

export function topicsOfPeriod(periodId) {
  const period = PERIODS.find((p) => p.id === periodId)
  return period ? topics.filter((t) => inPeriod(t, period)) : []
}

export function lineOf(task, exam) {
  return EXAM_LINES[exam]?.find((l) => l.test(task)) ?? null
}

export function tasksFor({ exam, course, topic, type, line, period }) {
  const lineDef = exam && line ? EXAM_LINES[exam]?.find((l) => l.id === line) : null
  const periodDef = period ? PERIODS.find((p) => p.id === period) : null
  return tasks.filter(
    (t) =>
      (!exam || t.exam.includes(exam)) &&
      (!course || t.course === course) &&
      (!periodDef || inPeriod(t, periodDef)) &&
      (!topic || t.topic === topic) &&
      (!type || t.type === type) &&
      (!lineDef || lineDef.test(t))
  )
}

// Максимальный балл задания
export function maxPoints(task) {
  if (task.kim && KIM_SPEC[task.kim]) return KIM_SPEC[task.kim].points
  return task.type === 'match' || task.type === 'multi' || task.type === 'stats' ? 2 : task.type === 'grid' ? 3 : 1
}

function digits(s) {
  return String(s).replace(/[^0-9]/g, '')
}

// Проверка ответа как на экзамене: для соответствия и множественного выбора одна ошибка = 1 балл
export function checkTask(task, raw) {
  const max = maxPoints(task)
  // развёрнутый ответ: ученик сам ставит балл по критериям (raw — число баллов)
  if (task.type === 'open') {
    const p = Number.parseInt(raw, 10)
    return { points: Number.isFinite(p) ? Math.max(0, Math.min(max, p)) : 0, max }
  }
  if (task.type === 'term' || task.type === 'scheme' || (task.type === 'map' && task.accept)) {
    const variants = task.type === 'map' ? task.accept : task.answer
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
  if (task.type === 'grid') {
    if (given.length !== right.length) return { points: 0, max }
    const errors = [...right].filter((c, i) => given[i] !== c).length
    return { points: errors === 0 ? 3 : errors === 1 ? 2 : errors <= 3 ? 1 : 0, max }
  }
  if (task.type === 'thesis') {
    // пары «тезис — факт» можно записать в любом порядке
    const swapped = right.slice(2) + right.slice(0, 2)
    return { points: given === right || given === swapped ? 1 : 0, max }
  }
  if (task.type === 'match' || task.type === 'stats') {
    if (given.length !== right.length) return { points: 0, max }
    const errors = [...right].filter((c, i) => given[i] !== c).length
    return { points: errors === 0 ? 2 : errors === 1 ? 1 : 0, max }
  }
  // sequence, single, map (цифрой)
  return { points: given === right ? 1 : 0, max }
}

export function formatAnswer(task) {
  if (task.type === 'open') return (task.sample ?? []).join('; ')
  if (task.type === 'term' || task.type === 'scheme') return task.answer[0]
  if (task.type === 'map' && task.accept) return task.accept[0]
  return String(task.answer)
}
