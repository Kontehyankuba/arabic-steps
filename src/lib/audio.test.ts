import { describe, expect, it } from 'vitest'
import {
  TEXT_MATCH_DISCLAIMER,
  isTextMatch,
  matchFeedback,
  matchScore,
  matchVerdict,
  normalizeSpoken,
  targetWordMatch,
} from './speech'
import { advanceQueue, clampRepeat, repeatLabel, startQueue } from './recitation'
import { pickArabicVoice, isSpeechSupported, nextSpeed, noVoiceNotice, rateFor } from './tts'
import {
  emptyState,
  recordAudioExercise,
  recordSpeakAttempt,
  recordVocabReview,
  sanitizeState,
  stats,
} from './progress'

const DAY = new Date('2026-05-04T09:00:00.000Z')

describe('speaking practice text match', () => {
  it('ignores vowel marks, punctuation and extra whitespace', () => {
    expect(isTextMatch('السلام عليكم', 'السَّلَامُ عَلَيْكُمْ')).toBe(true)
    expect(isTextMatch('  السَّلَامُ   عَلَيْكُمْ  ', 'السلام عليكم')).toBe(true)
    expect(isTextMatch('السلام، عليكم!', 'السلام عليكم')).toBe(true)
  })

  it('treats alef and ta-marbuta variants as the same words', () => {
    expect(isTextMatch('انا بخير', 'أَنَا بِخَيْرٍ')).toBe(true)
    expect(isTextMatch('مدرسه', 'مَدْرَسَة')).toBe(true)
  })

  it('does not call a different phrase a match', () => {
    expect(isTextMatch('كتاب', 'قلم')).toBe(false)
    expect(isTextMatch('', 'السلام عليكم')).toBe(false)
    expect(matchScore('', 'كتاب')).toBe(0)
  })

  it('gives a full score for an exact phrase and a partial score for a missed word', () => {
    expect(matchScore('السلام عليكم', 'السلام عليكم')).toBe(1)
    const partial = matchScore('السلام', 'السلام عليكم')
    expect(partial).toBeGreaterThan(0)
    expect(partial).toBeLessThan(1)
    expect(matchVerdict(partial)).toBe('partial')
    expect(matchVerdict(1)).toBe('exact')
    expect(matchFeedback(1)).toMatch(/matched/i)
  })

  it('normalises to single-spaced words and flags each target word', () => {
    expect(normalizeSpoken('  كِتَابٌ   جَدِيدٌ ')).toBe('كتاب جديد')
    expect(targetWordMatch('السلام', 'السلام عليكم')).toEqual([
      { word: 'السلام', matched: true },
      { word: 'عليكم', matched: false },
    ])
  })

  it('labels the exercise as a text match, not a pronunciation judgement', () => {
    expect(TEXT_MATCH_DISCLAIMER).toMatch(/text-match/i)
    expect(TEXT_MATCH_DISCLAIMER).toMatch(/tajweed/i)
  })
})

describe('verse-by-verse recitation queue', () => {
  const options = { repeat: 2, loop: false, autoAdvance: true }

  it('repeats a verse before moving on', () => {
    const first = startQueue(0, 2)
    expect(first).toEqual({ index: 0, repeatLeft: 2 })
    const second = advanceQueue(first, 7, options)
    expect(second).toEqual({ index: 0, repeatLeft: 1 })
    const third = advanceQueue(second!, 7, options)
    expect(third).toEqual({ index: 1, repeatLeft: 2 })
  })

  it('stops at the end unless the surah is looped', () => {
    const last = startQueue(6, 1)
    expect(advanceQueue(last, 7, options)).toBeNull()
    expect(advanceQueue(last, 7, { ...options, loop: true })).toEqual({ index: 0, repeatLeft: 2 })
  })

  it('stops after one verse when auto-advance is off, and clamps repeat values', () => {
    expect(advanceQueue(startQueue(2, 1), 7, { ...options, autoAdvance: false })).toBeNull()
    expect(clampRepeat(0)).toBe(1)
    expect(clampRepeat(9)).toBe(5)
    expect(clampRepeat(Number.NaN)).toBe(1)
    expect(repeatLabel(1)).toBe('Once')
    expect(repeatLabel(3)).toBe('3×')
  })
})

describe('Arabic voice selection', () => {
  it('prefers ar-SA, then any Arabic voice, then nothing', () => {
    const voices = [
      { name: 'English UK', lang: 'en-GB' },
      { name: 'Arabic Egypt', lang: 'ar-EG' },
      { name: 'Arabic Saudi', lang: 'ar_SA' },
    ]
    expect(pickArabicVoice(voices)?.name).toBe('Arabic Saudi')
    expect(pickArabicVoice([{ name: 'English', lang: 'en-US' }, { name: 'Arabic', lang: 'ar-EG' }])?.lang).toBe('ar-EG')
    expect(pickArabicVoice([{ name: 'English UK', lang: 'en-GB' }])).toBeNull()
    expect(pickArabicVoice([])).toBeNull()
    expect(pickArabicVoice(null)).toBeNull()
  })

  it('uses slower than default rates for learners', () => {
    expect(rateFor('slow')).toBeLessThan(rateFor('normal'))
    expect(rateFor('normal')).toBeLessThan(1)
    expect(nextSpeed('slow')).toBe('normal')
    expect(nextSpeed('normal')).toBe('slow')
  })

  it('explains how to install an Arabic voice when none is found', () => {
    expect(noVoiceNotice()).toMatch(/Arabic voice/i)
    expect(noVoiceNotice()).toMatch(/Settings/)
  })

  it('reports no speech support outside a browser', () => {
    expect(isSpeechSupported()).toBe(false)
  })
})

describe('audio and speaking progress', () => {
  it('counts each completed audio exercise but lists it once', () => {
    let state = emptyState(DAY)
    state = recordAudioExercise(state, 'letter-ba', DAY)
    state = recordAudioExercise(state, 'letter-ba', DAY)
    state = recordAudioExercise(state, 'haraka-fatha', DAY)
    expect(state.audioExercises).toEqual(['haraka-fatha', 'letter-ba'])
    expect(state.audioPlays).toBe(3)
    expect(state.studyDates).toContain('2026-05-04')
  })

  it('counts flashcard reviews and keeps the known list in sync', () => {
    let state = emptyState(DAY)
    state = recordVocabReview(state, 'kitab', true, DAY)
    state = recordVocabReview(state, 'kitab', false, DAY)
    expect(state.vocabReviews).toBe(2)
    expect(state.wordsKnown).toEqual([])
  })

  it('records speaking attempts with phrase id and manual self-checks', () => {
    let state = emptyState(DAY)
    state = recordSpeakAttempt(state, 0.8, DAY, 'salam', false)
    state = recordSpeakAttempt(state, 1, DAY, 'salam', true)
    state = recordSpeakAttempt(state, 0.5, DAY, 'shukran', false)
    expect(state.speakAttempts).toBe(3)
    expect(state.bestSimilarity).toBe(100)
    expect(state.speakingResults[0]).toMatchObject({ phraseId: 'salam', score: 80, manual: false })
    expect(state.speakingResults[1].manual).toBe(true)
    const summary = stats(state, '2026-05-04')
    expect(summary.phrasesPracticed).toBe(2)
    expect(summary.manualChecks).toBe(1)
    expect(summary.audioExercises).toBe(0)
    expect(summary.streak).toBe(1)
  })

  it('keeps the new fields when a backup is imported, and rejects other versions', () => {
    const saved = recordSpeakAttempt(
      recordAudioExercise(recordVocabReview(emptyState(DAY), 'kitab', true, DAY), 'letter-ba', DAY),
      0.9,
      DAY,
      'salam',
      false,
    )
    const restored = sanitizeState(JSON.parse(JSON.stringify(saved)))
    expect(restored).not.toBeNull()
    expect(restored?.audioExercises).toEqual(['letter-ba'])
    expect(restored?.audioPlays).toBe(1)
    expect(restored?.vocabReviews).toBe(1)
    expect(restored?.speakingResults[0]).toMatchObject({ phraseId: 'salam', score: 90 })
    expect(sanitizeState({ ...saved, version: 2 })).toBeNull()
  })
})
