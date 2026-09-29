// Прогресс викторин хранится только в браузере пользователя.
const KEY = 'h5m-progress-v1'

export function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {}
  } catch {
    return {}
  }
}

export function saveResult(id, score, total) {
  try {
    const all = loadProgress()
    const prev = all[id]
    all[id] = {
      best: Math.max(prev?.best ?? 0, score),
      last: score,
      total,
      attempts: (prev?.attempts ?? 0) + 1,
      at: Date.now(),
    }
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    /* хранилище недоступно — просто не сохраняем */
  }
}

export function resetProgress() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}
