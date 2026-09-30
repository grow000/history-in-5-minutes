// Прогресс пользователя хранится в его браузере (localStorage) и сохраняется между заходами на сайт.
// Формат обратно совместим с первой версией: результаты по ключам в 'h5m-progress-v1'.
const KEY = 'h5m-progress-v1'
const HISTORY_KEY = 'h5m-history-v1'
const HISTORY_LIMIT = 300

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false // хранилище недоступно (приватный режим и т. п.) — сайт работает и без сохранения
  }
}

export function loadProgress() {
  return read(KEY, {})
}

export function loadHistory() {
  const list = read(HISTORY_KEY, [])
  return Array.isArray(list) ? list : []
}

/**
 * Сохраняет результат теста или задания.
 * meta (необязательно): { kind: 'topic' | 'event' | 'exam-session', title, to } — для истории попыток.
 */
export function saveResult(id, score, total, meta) {
  const all = loadProgress()
  const prev = all[id]
  all[id] = {
    best: Math.max(prev?.best ?? 0, score),
    last: score,
    total,
    attempts: (prev?.attempts ?? 0) + 1,
    at: Date.now(),
  }
  write(KEY, all)
  if (meta) addHistory({ id, score, total, ...meta })
}

export function addHistory(entry) {
  const list = loadHistory()
  list.unshift({ ...entry, at: Date.now() })
  write(HISTORY_KEY, list.slice(0, HISTORY_LIMIT))
}

export function resetProgress() {
  try {
    localStorage.removeItem(KEY)
    localStorage.removeItem(HISTORY_KEY)
  } catch {
    /* ignore */
  }
}

// ---------- Перенос прогресса между устройствами ----------

export function exportProgress() {
  return JSON.stringify(
    { app: 'history-in-5-minutes', version: 1, exportedAt: new Date().toISOString(), progress: loadProgress(), history: loadHistory() },
    null,
    2
  )
}

// Объединяет загруженный файл с текущими данными: лучший результат сохраняется, история склеивается
export function importProgress(text) {
  const data = JSON.parse(text)
  if (data?.app !== 'history-in-5-minutes' || typeof data.progress !== 'object') {
    throw new Error('Это не файл прогресса «История за 5 минут»')
  }
  const current = loadProgress()
  for (const [id, r] of Object.entries(data.progress)) {
    const c = current[id]
    if (!r || typeof r.best !== 'number') continue
    current[id] = c
      ? { ...c, best: Math.max(c.best, r.best), attempts: (c.attempts ?? 0) + (r.attempts ?? 0), at: Math.max(c.at ?? 0, r.at ?? 0) }
      : r
  }
  write(KEY, current)
  const seen = new Set(loadHistory().map((h) => `${h.id}|${h.at}`))
  const merged = [...loadHistory(), ...(Array.isArray(data.history) ? data.history : []).filter((h) => !seen.has(`${h.id}|${h.at}`))]
  write(HISTORY_KEY, merged.sort((a, b) => b.at - a.at).slice(0, HISTORY_LIMIT))
  return Object.keys(data.progress).length
}
