import { LESSONS, TOTAL_LESSONS } from '../data/plan'
import { VOCAB } from '../data/vocab'

export const STORAGE_KEY = 'arabicJourney.progress.v1'

export type QuizResult = { date: string; correct: number; total: number }

export type Settings = { arabicScale: number }

export type ProgressState = {
  version: 1
  createdAt: string
  updatedAt: string
  /** Local dates (YYYY-MM-DD) with any learning activity — drives the streak. */
  studyDates: string[]
  minutes: number
  /** lessonId → ISO timestamp of completion. */
  lessons: Record<string, string>
  lettersSeen: string[]
  wordsKnown: string[]
  quizResults: QuizResult[]
  speakAttempts: number
  bestSimilarity: number
  planDays: string[]
  settings: Settings
}

export function dateKey(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function shiftDay(key: string, days: number): string {
  const [year, month, day] = key.split('-').map(Number)
  const date = new Date(year, month - 1, day, 12, 0, 0)
  date.setDate(date.getDate() + days)
  return dateKey(date)
}

export function emptyState(now: Date = new Date()): ProgressState {
  const stamp = now.toISOString()
  return {
    version: 1,
    createdAt: stamp,
    updatedAt: stamp,
    studyDates: [],
    minutes: 0,
    lessons: {},
    lettersSeen: [],
    wordsKnown: [],
    quizResults: [],
    speakAttempts: 0,
    bestSimilarity: 0,
    planDays: [],
    settings: { arabicScale: 1 },
  }
}

function uniq(values: string[]): string[] {
  return Array.from(new Set(values)).sort()
}

/** Consecutive study days ending today (or yesterday, so a streak survives until midnight). */
export function computeStreak(dates: string[], today: string = dateKey()): number {
  const studied = new Set(dates)
  let cursor = studied.has(today) ? today : shiftDay(today, -1)
  if (!studied.has(cursor)) return 0
  let streak = 0
  while (studied.has(cursor)) {
    streak += 1
    cursor = shiftDay(cursor, -1)
  }
  return streak
}

function touch(state: ProgressState, now: Date): ProgressState {
  return {
    ...state,
    updatedAt: now.toISOString(),
    studyDates: uniq([...state.studyDates, dateKey(now)]),
  }
}

export function markLessonDone(
  state: ProgressState,
  lessonId: string,
  now: Date = new Date(),
): ProgressState {
  const next = touch(state, now)
  if (next.lessons[lessonId]) return next
  return { ...next, lessons: { ...next.lessons, [lessonId]: now.toISOString() } }
}

export function recordStudyDay(
  state: ProgressState,
  minutes: number,
  now: Date = new Date(),
): ProgressState {
  const next = touch(state, now)
  const day = dateKey(now)
  return {
    ...next,
    minutes: next.minutes + Math.max(0, Math.round(minutes)),
    planDays: next.planDays.includes(day) ? next.planDays : [...next.planDays, day],
  }
}

export function recordQuiz(
  state: ProgressState,
  correct: number,
  total: number,
  now: Date = new Date(),
): ProgressState {
  const next = touch(state, now)
  return {
    ...next,
    quizResults: [
      ...next.quizResults.slice(-19),
      { date: now.toISOString(), correct, total },
    ],
  }
}

export function markWordKnown(
  state: ProgressState,
  wordId: string,
  known: boolean,
  now: Date = new Date(),
): ProgressState {
  const next = touch(state, now)
  const words = new Set(next.wordsKnown)
  if (known) words.add(wordId)
  else words.delete(wordId)
  return { ...next, wordsKnown: uniq(Array.from(words)) }
}

export function markLetterSeen(
  state: ProgressState,
  letterId: string,
  now: Date = new Date(),
): ProgressState {
  const next = touch(state, now)
  if (next.lettersSeen.includes(letterId)) return next
  return { ...next, lettersSeen: uniq([...next.lettersSeen, letterId]) }
}

export function recordSpeakAttempt(
  state: ProgressState,
  score: number,
  now: Date = new Date(),
): ProgressState {
  const next = touch(state, now)
  return {
    ...next,
    speakAttempts: next.speakAttempts + 1,
    bestSimilarity: Math.max(next.bestSimilarity, Math.round(score * 100)),
  }
}

export function setArabicScale(state: ProgressState, scale: number): ProgressState {
  return { ...state, settings: { ...state.settings, arabicScale: scale } }
}

export type Stats = {
  streak: number
  studiedToday: boolean
  lessonsDone: number
  totalLessons: number
  lessonPercent: number
  lettersSeen: number
  wordsKnown: number
  bestQuiz: number
  lastQuiz: QuizResult | null
  quizCount: number
  minutes: number
  planDays: number
  speakAttempts: number
  bestSimilarity: number
}

export function stats(state: ProgressState, today: string = dateKey()): Stats {
  const lessonsDone = Object.keys(state.lessons).filter((id) =>
    LESSONS.some((lesson) => lesson.id === id),
  ).length
  const bestQuiz = state.quizResults.reduce(
    (best, result) => Math.max(best, result.total ? Math.round((result.correct / result.total) * 100) : 0),
    0,
  )
  return {
    streak: computeStreak(state.studyDates, today),
    studiedToday: state.studyDates.includes(today),
    lessonsDone,
    totalLessons: TOTAL_LESSONS,
    lessonPercent: Math.round((lessonsDone / TOTAL_LESSONS) * 100),
    lettersSeen: state.lettersSeen.length,
    wordsKnown: state.wordsKnown.length,
    bestQuiz,
    lastQuiz: state.quizResults[state.quizResults.length - 1] ?? null,
    quizCount: state.quizResults.length,
    minutes: state.minutes,
    planDays: state.planDays.length,
    speakAttempts: state.speakAttempts,
    bestSimilarity: state.bestSimilarity,
  }
}

/** Validate untrusted data (a backup file or old localStorage) before using it. */
export function sanitizeState(raw: unknown, now: Date = new Date()): ProgressState | null {
  if (!raw || typeof raw !== 'object') return null
  const value = raw as Record<string, unknown>
  const base = emptyState(now)
  const strings = (input: unknown): string[] =>
    Array.isArray(input) ? uniq(input.filter((item): item is string => typeof item === 'string')) : []
  const lessonsInput = value.lessons
  const lessons: Record<string, string> = {}
  if (lessonsInput && typeof lessonsInput === 'object') {
    for (const [key, stamp] of Object.entries(lessonsInput as Record<string, unknown>)) {
      if (typeof stamp === 'string') lessons[key] = stamp
    }
  }
  const quizResults: QuizResult[] = Array.isArray(value.quizResults)
    ? value.quizResults
        .filter((item): item is QuizResult => {
          if (!item || typeof item !== 'object') return false
          const result = item as Record<string, unknown>
          return typeof result.correct === 'number' && typeof result.total === 'number'
        })
        .map((item) => ({ date: String(item.date ?? now.toISOString()), correct: item.correct, total: item.total }))
    : []
  const scaleInput = (value.settings as Record<string, unknown> | undefined)?.arabicScale
  const scale = typeof scaleInput === 'number' && scaleInput >= 0.8 && scaleInput <= 1.6 ? scaleInput : 1
  return {
    ...base,
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : base.createdAt,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : base.updatedAt,
    studyDates: strings(value.studyDates),
    minutes: typeof value.minutes === 'number' && value.minutes >= 0 ? Math.round(value.minutes) : 0,
    lessons,
    lettersSeen: strings(value.lettersSeen),
    wordsKnown: strings(value.wordsKnown).filter((id) => VOCAB.some((word) => word.id === id)),
    quizResults: quizResults.slice(-20),
    speakAttempts: typeof value.speakAttempts === 'number' ? Math.max(0, Math.round(value.speakAttempts)) : 0,
    bestSimilarity:
      typeof value.bestSimilarity === 'number' ? Math.min(100, Math.max(0, Math.round(value.bestSimilarity))) : 0,
    planDays: strings(value.planDays),
    settings: { arabicScale: scale },
  }
}

function storage(): Storage | null {
  try {
    const test = '__arabicJourney__'
    window.localStorage.setItem(test, '1')
    window.localStorage.removeItem(test)
    return window.localStorage
  } catch {
    return null
  }
}

export function loadState(now: Date = new Date()): ProgressState {
  const store = storage()
  if (!store) return emptyState(now)
  try {
    const raw = store.getItem(STORAGE_KEY)
    if (!raw) return emptyState(now)
    return sanitizeState(JSON.parse(raw), now) ?? emptyState(now)
  } catch {
    return emptyState(now)
  }
}

/** Returns false when the browser blocks storage (private mode, quota). */
export function saveState(state: ProgressState): boolean {
  const store = storage()
  if (!store) return false
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

export function clearState(): void {
  storage()?.removeItem(STORAGE_KEY)
}
