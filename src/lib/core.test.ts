import { describe, expect, it } from 'vitest'
import { LETTERS, JOIN_WORDS } from '../data/letters'
import { HARAKAT } from '../data/harakat'
import { SURAHS } from '../data/quran'
import { VOCAB, PHRASES } from '../data/vocab'
import { DAILY_PLAN, LESSONS, TOTAL_PLAN_MINUTES, TOTAL_LESSONS } from '../data/plan'
import {
  explainWord,
  formFor,
  normalizeArabic,
  similarity,
  similarityFeedback,
  stripDiacritics,
} from './arabic'
import { buildQuiz, quizMessage, scoreQuiz } from './quiz'
import {
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
  streakOf,
} from './progress'

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
    expect(nonJoining.sort()).toEqual(
      ['Alif', 'Dāl', 'Dhāl', 'Rāʾ', 'Wāw', 'Zāy'].sort(),
    )
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
      })
      expect(surah.ayat[0].global).toBe(surah.startGlobal)
    }
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
    const beh = LETTERS.find((letter) => letter.id === 'beh')!
    expect(formFor(beh, true, true)).toBe('medial')
    expect(formFor(beh, true, false)).toBe('final')
    expect(formFor(beh, false, true)).toBe('initial')
    expect(formFor(beh, false, false)).toBe('isolated')
    const alif = LETTERS.find((letter) => letter.id === 'alif')!
    expect(formFor(alif, true, false)).toBe('final')
    expect(formFor(alif, false, true)).toBe('isolated')
  })

  it('explains how a word joins letter by letter', () => {
    const word = JOIN_WORDS[0]
    const steps = explainWord(word)
    expect(steps.length).toBeGreaterThan(1)
    expect(steps.map((step) => step.glyph).join('')).toBe(word.arabic)
    expect(steps.every((step) => step.form !== undefined)).toBe(true)
  })

  it('normalises and compares Arabic for speaking practice', () => {
    expect(stripDiacritics('كِتَابٌ')).toBe('كتاب')
    expect(normalizeArabic('أَهْلًا')).toBe('اهلا')
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
    expect(quizMessage(5, 5)).toMatch(/full marks/i)
    expect(quizMessage(2, 5)).toMatch(/again/i)
  })
})

describe('progress persistence model', () => {
  it('starts empty and tracks study days as a streak', () => {
    let state = emptyState('2026-11-01')
    expect(state.days).toEqual([])
    expect(streakOf(state, '2026-11-01')).toBe(0)

    state = recordStudyDay(state, '2026-11-01')
    state = recordStudyDay(state, '2026-11-02')
    state = recordStudyDay(state, '2026-11-02')
    expect(state.days).toEqual(['2026-11-01', '2026-11-02'])
    expect(streakOf(state, '2026-11-02')).toBe(2)
    // A missed day breaks the streak.
    expect(streakOf(state, '2026-11-05')).toBe(0)
    // Yesterday still counts as an active streak today.
    expect(streakOf(state, '2026-11-03')).toBe(2)
  })

  it('records lessons, words, letters, quizzes and speaking attempts', () => {
    let state = emptyState('2026-11-01')
    state = markLessonDone(state, 'letters')
    state = markLessonDone(state, 'letters')
    expect(state.lessons.letters).toBe(true)

    state = markWordKnown(state, 'kitab', true)
    state = markWordKnown(state, 'qalam', true)
    state = markWordKnown(state, 'qalam', false)
    expect(state.wordsKnown).toEqual(['kitab'])

    state = markLetterSeen(state, 'beh')
    state = markLetterSeen(state, 'beh')
    expect(state.lettersSeen).toEqual(['beh'])

    state = recordQuiz(state, 4, 5, '2026-11-01T10:00:00.000Z')
    state = recordQuiz(state, 5, 5, '2026-11-01T11:00:00.000Z')
    expect(state.quizResults).toHaveLength(2)

    state = recordSpeakAttempt(state, 0.8)
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

  it('keeps a readable Arabic text size preference', () => {
    const state = setArabicScale(emptyState('2026-11-01'), 1.4)
    expect(state.settings.arabicScale).toBe(1.4)
    expect(setArabicScale(state, 99).settings.arabicScale).toBe(1.4)
  })

  it('rejects corrupt or foreign saved data but accepts real backups', () => {
    expect(sanitizeState(null)).toBeNull()
    expect(sanitizeState('nope')).toBeNull()
    expect(sanitizeState({ version: 9 })).toBeNull()
    expect(sanitizeState({ lessons: { letters: true } })).toBeNull()

    const real = recordStudyDay(markLessonDone(emptyState('2026-11-01'), 'letters'), '2026-11-01')
    const restored = sanitizeState(JSON.parse(JSON.stringify(real)))
    expect(restored).not.toBeNull()
    expect(restored?.lessons.letters).toBe(true)
    expect(restored?.days).toEqual(['2026-11-01'])
  })

  it('drops unknown keys when sanitising', () => {
    const real = emptyState('2026-11-01')
    const restored = sanitizeState({ ...real, hacker: 'x', lessons: { letters: true, bogus: true } })
    expect(restored).not.toBeNull()
    expect(restored).not.toHaveProperty('hacker')
    expect(restored?.lessons.bogus).toBeUndefined()
  })
})
