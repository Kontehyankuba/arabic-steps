/** The daily 15-minute plan and the list of trackable lessons. */
export type PlanBlock = {
  id: string
  title: string
  minutes: number
  tab: TabId
  description: string
  emoji: string
}

export type TabId =
  | 'today'
  | 'letters'
  | 'harakat'
  | 'quran'
  | 'words'
  | 'quiz'
  | 'speak'
  | 'progress'

export const DAILY_PLAN: PlanBlock[] = [
  {
    id: 'plan-letters',
    title: 'Connected letters',
    minutes: 4,
    tab: 'letters',
    description: 'Read the four shapes of a few letters and build one word.',
    emoji: '🔤',
  },
  {
    id: 'plan-harakat',
    title: 'Vowel marks',
    minutes: 3,
    tab: 'harakat',
    description: 'Practise fatḥah, kasrah and ḍammah out loud.',
    emoji: 'ـَ',
  },
  {
    id: 'plan-quran',
    title: 'Quran reading',
    minutes: 4,
    tab: 'quran',
    description: 'One or two verses, slowly, with the recitation.',
    emoji: '📖',
  },
  {
    id: 'plan-words',
    title: 'Words & quiz',
    minutes: 4,
    tab: 'words',
    description: 'Review the five flashcards, then take the short quiz.',
    emoji: '🃏',
  },
]

export const TOTAL_PLAN_MINUTES = DAILY_PLAN.reduce((sum, block) => sum + block.minutes, 0)

/** Lessons shown in the progress view. `id` is what gets stored. */
export type LessonMeta = { id: string; title: string; group: string }

export const LESSONS: LessonMeta[] = [
  { id: 'letters', title: 'Letter shapes & joining', group: 'Reading' },
  { id: 'harakat', title: 'Vowel marks (ḥarakāt)', group: 'Reading' },
  { id: 'quran-fatihah', title: 'Surah Al-Fātiḥah', group: 'Quran' },
  { id: 'quran-ikhlas', title: 'Surah Al-Ikhlāṣ', group: 'Quran' },
  { id: 'quran-falaq', title: 'Surah Al-Falaq', group: 'Quran' },
  { id: 'quran-nas', title: 'Surah An-Nās', group: 'Quran' },
  { id: 'vocab', title: 'Five starter words', group: 'Vocabulary' },
  { id: 'quiz', title: 'Vocabulary quiz', group: 'Vocabulary' },
  { id: 'speaking', title: 'Listen & speak practice', group: 'Speaking' },
]

export const TOTAL_LESSONS = LESSONS.length
