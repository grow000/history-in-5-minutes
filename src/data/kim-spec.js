// Номера КИМ ЕГЭ/ОГЭ 2026, которые закрываются заданиями из src/data/kim/*.js
// type — допустимый тип задания, points — максимальный балл, needs — обязательные поля
export const KIM_SPEC = {
  'ege-4': { type: 'grid', points: 3, title: 'Систематизация: таблица' },
  'ege-6': { type: 'multi', points: 2, needs: ['source'], title: 'Письменный источник: верные суждения' },
  'ege-8': { type: 'term', points: 1, needs: ['image'], title: 'Великая Отечественная война: изображение' },
  'ege-12': { type: 'multi', points: 2, needs: ['map'], title: 'Карта (схема): верные суждения' },
  'ege-13': { type: 'open', points: 2, needs: ['source'], title: 'Источник: атрибуция' },
  'ege-14': { type: 'open', points: 2, needs: ['source'], title: 'Источник: поиск информации' },
  'ege-15': { type: 'open', points: 2, needs: ['image'], title: 'Анализ изображения' },
  'ege-16': { type: 'open', points: 2, needs: ['image'], title: 'Культура: изображения и факты' },
  'ege-17': { type: 'open', points: 3, needs: ['sources'], title: 'ВОВ: анализ двух источников' },
  'ege-18': { type: 'open', points: 3, title: 'Причины и следствия' },
  'ege-19': { type: 'open', points: 2, title: 'Историческое понятие' },
  'ege-20': { type: 'open', points: 3, title: 'Сравнение' },
  'ege-21': { type: 'open', points: 3, title: 'Аргументация точки зрения' },
  'oge-6': { type: 'thesis', points: 1, title: 'Тезисы и факты' },
  'oge-7': { type: 'stats', points: 2, title: 'Статистическая таблица' },
  'oge-11': { type: 'single', points: 1, needs: ['image'], title: 'Работа с изображением' },
  'oge-12': { type: 'scheme', points: 1, title: 'Логическая схема' },
  'oge-13': { type: 'multi', points: 2, title: 'Культура: выбор памятников' },
  'oge-14': { type: 'single', points: 1, title: 'Культура: памятник' },
  'oge-18': { type: 'open', points: 2, needs: ['source'], title: 'Источник: атрибуция' },
  'oge-19': { type: 'open', points: 2, needs: ['source'], title: 'Источник: поиск информации' },
  'oge-20': { type: 'open', points: 2, needs: ['source'], title: 'Источник: контекст' },
  'oge-21': { type: 'open', points: 2, title: 'Причины и следствия' },
  'oge-22': { type: 'open', points: 3, needs: ['source'], title: 'Исправление фактических ошибок' },
  'oge-23': { type: 'open', points: 2, title: 'Сравнение' },
  'oge-24': { type: 'open', points: 3, title: 'Анализ исторической ситуации' },
}

export const GRID_LETTERS = ['А', 'Б', 'В', 'Г', 'Д', 'Е']
