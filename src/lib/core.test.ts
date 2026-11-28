import { describe, expect, it } from 'vitest'
import { LETTERS, JOIN_WORDS } from '../data/letters'
import { HARAKAT } from '../data/harakat'
import { SURAHS } from '../data/quran'
import { VOCAB, PHRASES } from '../data/vocab'
import { DAILY_PLAN, LESSONS, TOTAL_PLAN_MINUTES, TOTAL_LESSONS } from '../data/plan'
import {
  connect,
  explainWord,
  normalizeArabic,
  shapeFor,
  similarity,
  similarityFeedback,
  stripTashkeel,
} from './arabic'
import { buildQuiz, quizMessage, scoreQuiz } from './quiz'
import {
  computeStreak,
  emptyState,
  markLessonDone,
  markLetterSeen,
  markWordKnown,
  recordQuiz,
  recordSpeakAttempt,
  recordStudyDay,
  sanitizeState,
  setArabicScale,
  stats,
} from './progress'

const day = (iso: string) => new Date(`${iso}T09:00:00.000Z`)

describe('arabic content', () => {
  it('has 28 letters with four distinct forms and a sound', () => {
    expect(LETTERS).toHaveLength(28)
    for (const letter of LETTERS) {
      expect(letter.isolated).toBeTruthy()
      expect(letter.initial).toBeTruthy()
      expect(letter.medial).toBeTruthy()
      expect(letter.final).toBeTruthy()
      expect(letter.sound).toBeTruthy()
      expect(letter.name).toBeTruthy()
    }
    expect(new Set(LETTERS.map((l) => l.id)).size).toBe(28)
  })

  it('marks the six non-joining letters correctly', () => {
    const nonJoining = LETTERS.filter((letter) => !letter.connects).map((letter) => letter.name)
    expect(nonJoining.sort()).toEqual(['Alif', 'Dāl', 'Dhāl', 'Rāʾ', 'Wāw', 'Zāy'].sort())
  })

  it('keeps medial and final shapes distinct for joining letters', () => {
    const joining = LETTERS.filter((letter) => letter.connects)
    expect(joining.length).toBe(22)
    for (const letter of joining) {
      expect(letter.medial).not.toBe(letter.initial)
    }
  })

  it('has harakat with pronunciation examples', () => {
    expect(HARAKAT.length).toBeGreaterThanOrEqual(8)
    for (const mark of HARAKAT) {
      expect(mark.demo).toContain('ب')
      expect(mark.example.word).toBeTruthy()
      expect(mark.example.meaning).toBeTruthy()
      expect(mark.sound).toBeTruthy()
    }
  })

  it('has five vocabulary cards and speaking phrases', () => {
    expect(VOCAB).toHaveLength(5)
    for (const word of VOCAB) {
      expect(word.arabic).toBeTruthy()
      expect(word.meaning).toBeTruthy()
      expect(word.translit).toBeTruthy()
    }
    expect(PHRASES.length).toBeGreaterThanOrEqual(4)
  })

  it('has Quran surahs with ayah numbers and explanation for every ayah', () => {
    expect(SURAHS.length).toBeGreaterThanOrEqual(3)
    const fatihah = SURAHS.find((surah) => surah.id === 'fatihah')
    expect(fatihah?.ayat).toHaveLength(7)
    for (const surah of SURAHS) {
      surah.ayat.forEach((ayah, index) => {
        expect(ayah.number).toBe(index + 1)
        expect(ayah.arabic.length).toBeGreaterThan(3)
        expect(ayah.translit).toBeTruthy()
        expect(ayah.meaning).toBeTruthy()
        expect(ayah.tip).toBeTruthy()
        expect(ayah.global).toBeGreaterThan(0)
        if (index > 0) {
          // Running Quran ayah numbers must increase by one inside a surah.
          expect(ayah.global).toBe(surah.ayat[index - 1].global + 1)
        }
      })
    }
    expect(fatihah?.ayat[0].global).toBe(1)
    expect(SURAHS.find((surah) => surah.id === 'ikhlas')?.ayat[0].global).toBe(6222)
  })

  it('plans exactly fifteen minutes a day and lists every lesson', () => {
    expect(TOTAL_PLAN_MINUTES).toBe(15)
    expect(TOTAL_LESSONS).toBe(LESSONS.length)
    const ids = LESSONS.map((lesson) => lesson.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toContain('letters')
    expect(ids).toContain('vocab')
    expect(ids).toContain('quiz')
    expect(ids).toContain('quran-fatihah')
    expect(DAILY_PLAN.every((block) => block.minutes > 0)).toBe(true)
  })
})

describe('arabic helpers', () => {
  it('picks the right positional form', () => {
    const beh = LETTERS.find((letter) => letter.id === 'ba')!
    expect(shapeFor(beh, { previous: beh, next: beh })).toBe('medial')
    expect(shapeFor(beh, { previous: beh, next: null })).toBe('final')
    expect(shapeFor(beh, { previous: null, next: beh })).toBe('initial')
    expect(shapeFor(beh, { previous: null, next: null })).toBe('isolated')

    const alif = LETTERS.find((letter) => letter.id === 'alif')!
    expect(shapeFor(alif, { previous: beh, next: null })).toBe('final')
    // Alif never joins forward, so it stays isolated before another letter.
    expect(shapeFor(alif, { previous: null, next: beh })).toBe('isolated')
  })

  it('explains how a word joins letter by letter', () => {
    for (const word of JOIN_WORDS) {
      const steps = explainWord(word.letters)
      expect(steps).toHaveLength(word.letters.length)
      expect(steps.map((step) => step.glyph).join('')).toBe(connect(word.letters))
      expect(normalizeArabic(steps.map((step) => step.glyph).join(''))).toBe(
        normalizeArabic(word.arabic),
      )
    }
    expect(JOIN_WORDS[0].letters[0]).toBe('ba')
    expect(() => explainWord(['nope'])).toThrow()
  })

  it('normalises and compares Arabic for speaking practice', () => {
    expect(stripTashkeel('كِتَابٌ')).toBe('كتاب')
    expect(normalizeArabic('أَهْلًا')).toBe('اهلا')
    expect(normalizeArabic('بـيـت')).toBe('بيت')
    expect(similarity('مرحبا', 'مَرْحَبًا')).toBe(1)
    expect(similarity('', 'مرحبا')).toBe(0)
    expect(similarity('كتاب', 'قلم')).toBeLessThan(0.6)
    expect(similarityFeedback(0.95)).toMatch(/excellent/i)
    expect(similarityFeedback(0.2)).toMatch(/listen/i)
  })
})

describe('quiz', () => {
  it('builds five questions with four options and the correct answer', () => {
    const quiz = buildQuiz(VOCAB, 5, () => 0.42)
    expect(quiz).toHaveLength(5)
    for (const question of quiz) {
      expect(question.options).toHaveLength(4)
      expect(question.options).toContain(question.answer)
      expect(new Set(question.options).size).toBe(4)
    }
  })

  it('scores answers and writes an encouraging message', () => {
    const quiz = buildQuiz(VOCAB, 5, () => 0.1)
    const allRight = quiz.map((question) => question.answer)
    expect(scoreQuiz(quiz, allRight)).toBe(5)
    expect(scoreQuiz(quiz, [null, null, null, null, null])).toBe(0)
    expect(quizMessage(5, 5)).toMatch(/perfect score/i)
    expect(quizMessage(2, 5)).toMatch(/keep going/i)
  })
})

describe('progress persistence model', () => {
  it('starts empty and tracks study days as a streak', () => {
    let state = emptyState(day('2026-11-01'))
    expect(state.studyDates).toEqual([])
    expect(computeStreak(state.studyDates, '2026-11-01')).toBe(0)

    state = recordStudyDay(state, 15, day('2026-11-01'))
    state = recordStudyDay(state, 15, day('2026-11-02'))
    state = recordStudyDay(state, 15, day('2026-11-02'))
    expect(state.studyDates).toEqual(['2026-11-01', '2026-11-02'])
    expect(state.minutes).toBe(45)
    expect(computeStreak(state.studyDates, '2026-11-02')).toBe(2)
    // A missed day breaks the streak.
    expect(computeStreak(state.studyDates, '2026-11-05')).toBe(0)
    // Yesterday still counts as an active streak today.
    expect(computeStreak(state.studyDates, '2026-11-03')).toBe(2)
  })

  it('records lessons, words, letters, quizzes and speaking attempts', () => {
    const now = day('2026-11-01')
    let state = emptyState(now)
    state = markLessonDone(state, 'letters', now)
    state = markLessonDone(state, 'letters', now)
    expect(state.lessons.letters).toBeTruthy()

    state = markWordKnown(state, 'kitab', true, now)
    state = markWordKnown(state, 'qalam', true, now)
    state = markWordKnown(state, 'qalam', false, now)
    expect(state.wordsKnown).toEqual(['kitab'])

    state = markLetterSeen(state, 'ba', now)
    state = markLetterSeen(state, 'ba', now)
    expect(state.lettersSeen).toEqual(['ba'])

    state = recordQuiz(state, 4, 5, now)
    state = recordQuiz(state, 5, 5, now)
    expect(state.quizResults).toHaveLength(2)

    state = recordSpeakAttempt(state, 0.8, now)
    expect(state.speakAttempts).toBe(1)
    expect(state.bestSimilarity).toBe(80)

    const summary = stats(state, '2026-11-01')
    expect(summary.lessonsDone).toBe(1)
    expect(summary.bestQuiz).toBe(100)
    expect(summary.wordsKnown).toBe(1)
    expect(summary.studiedToday).toBe(true)
    expect(summary.streak).toBe(1)
    expect(summary.lessonPercent).toBe(Math.round((1 / TOTAL_LESSONS) * 100))
  })

  it('keeps a readable Arabic text size preference inside safe limits', () => {
    const state = setArabicScale(emptyState(day('2026-11-01')), 1.4)
    expect(state.settings.arabicScale).toBe(1.4)
    expect(setArabicScale(state, 99).settings.arabicScale).toBe(1.6)
    expect(setArabicScale(state, Number.NaN).settings.arabicScale).toBe(1)
  })

  it('rejects corrupt or foreign saved data but accepts real backups', () => {
    expect(sanitizeState(null)).toBeNull()
    expect(sanitizeState('nope')).toBeNull()
    expect(sanitizeState({ version: 9 })).toBeNull()
    expect(sanitizeState({ lessons: { letters: true } })).toBeNull()

    const real = recordStudyDay(
      markLessonDone(emptyState(day('2026-11-01')), 'letters', day('2026-11-01')),
      15,
      day('2026-11-01'),
    )
    const restored = sanitizeState(JSON.parse(JSON.stringify(real)))
    expect(restored).not.toBeNull()
    expect(restored?.lessons.letters).toBeTruthy()
    expect(restored?.studyDates).toEqual(['2026-11-01'])
    expect(restored?.minutes).toBe(15)
  })

  it('drops unknown keys and unknown word ids when sanitising', () => {
    const real = emptyState(day('2026-11-01'))
    const restored = sanitizeState({
      ...real,
      hacker: 'x',
      lessons: { letters: '2026-11-01T09:00:00.000Z', bogus: true },
      wordsKnown: ['kitab', 'not-a-word'],
    })
    expect(restored).not.toBeNull()
    expect(restored).not.toHaveProperty('hacker')
    expect(restored?.lessons.bogus).toBeUndefined()
    expect(restored?.wordsKnown).toEqual(['kitab'])
  })
})
