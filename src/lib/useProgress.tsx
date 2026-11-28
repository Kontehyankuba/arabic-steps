import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  clearState,
  emptyState,
  loadState,
  markLessonDone,
  markLetterSeen,
  markWordKnown,
  recordQuiz,
  recordSpeakAttempt,
  recordStudyDay,
  saveState,
  setArabicScale,
  stats,
  type ProgressState,
  type Stats,
} from './progress'

type ProgressContextValue = {
  state: ProgressState
  stats: Stats
  storageOk: boolean
  markLesson: (lessonId: string) => void
  completeDay: (minutes: number) => void
  saveQuiz: (correct: number, total: number) => void
  setWordKnown: (wordId: string, known: boolean) => void
  seeLetter: (letterId: string) => void
  addSpeakAttempt: (score: number) => void
  setScale: (scale: number) => void
  replaceState: (next: ProgressState) => void
  reset: () => void
}

const ProgressContext = createContext<ProgressContextValue | null>(null)

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProgressState>(() => loadState())
  const [storageOk, setStorageOk] = useState(true)

  useEffect(() => {
    setStorageOk(saveState(state))
  }, [state])

  useEffect(() => {
    document.documentElement.style.setProperty('--arabic-scale', String(state.settings.arabicScale))
  }, [state.settings.arabicScale])

  const update = useCallback((change: (current: ProgressState) => ProgressState) => {
    setState((current) => change(current))
  }, [])

  const value = useMemo<ProgressContextValue>(
    () => ({
      state,
      stats: stats(state),
      storageOk,
      markLesson: (lessonId) => update((current) => markLessonDone(current, lessonId)),
      completeDay: (minutes) => update((current) => recordStudyDay(current, minutes)),
      saveQuiz: (correct, total) => update((current) => recordQuiz(current, correct, total)),
      setWordKnown: (wordId, known) => update((current) => markWordKnown(current, wordId, known)),
      seeLetter: (letterId) => update((current) => markLetterSeen(current, letterId)),
      addSpeakAttempt: (score) => update((current) => recordSpeakAttempt(current, score)),
      setScale: (scale) => update((current) => setArabicScale(current, scale)),
      replaceState: (next) => setState(next),
      reset: () => {
        clearState()
        setState(emptyState())
      },
    }),
    [state, storageOk, update],
  )

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}

export function useProgress(): ProgressContextValue {
  const context = useContext(ProgressContext)
  if (!context) throw new Error('useProgress must be used inside ProgressProvider')
  return context
}
