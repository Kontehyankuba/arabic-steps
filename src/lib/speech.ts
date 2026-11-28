/**
 * Comparing what the browser heard with the phrase we asked for.
 *
 * This is deliberately a TEXT comparison: browser speech recognition returns
 * words, not an audio judgement. Harmless differences are ignored — spacing,
 * punctuation, vowel marks (ḥarakāt), tatweel and the common alef/yāʾ/ta-marbūṭa
 * variants — so a correct reading is not marked wrong for typing reasons.
 *
 * It does NOT judge pronunciation, accent or tajweed, and the UI says so.
 */
import { normalizeArabic, similarity } from './arabic'

const PUNCTUATION = /[.,!?؟،؛:"'«»()[\]{}<>_\-–—…]/g

/** Fold a transcript to comparable Arabic words. */
export function normalizeSpoken(input: string): string {
  if (!input) return ''
  return normalizeArabic(input.replace(PUNCTUATION, ' '))
    .replace(/\s+/g, ' ')
    .trim()
}

export type MatchVerdict = 'exact' | 'close' | 'partial' | 'none'

/** True when the two phrases differ only in spacing, marks or punctuation. */
export function isTextMatch(spoken: string, target: string): boolean {
  const heard = normalizeSpoken(spoken)
  return Boolean(heard) && heard === normalizeSpoken(target)
}

/**
 * 0–1 text similarity: word overlap plus letter similarity, so a missed word
 * lowers the score without zeroing it.
 */
export function matchScore(spoken: string, target: string): number {
  const heard = normalizeSpoken(spoken)
  const wanted = normalizeSpoken(target)
  if (!heard || !wanted) return 0
  if (heard === wanted) return 1
  const heardWords = heard.split(' ')
  const wantedWords = wanted.split(' ')
  const matched = wantedWords.filter((word) => heardWords.includes(word)).length
  const wordScore = matched / wantedWords.length
  const letterScore = similarity(heard, wanted)
  return Math.round((wordScore * 0.6 + letterScore * 0.4) * 100) / 100
}

export function matchVerdict(score: number): MatchVerdict {
  if (score >= 0.999) return 'exact'
  if (score >= 0.6) return 'close'
  if (score > 0) return 'partial'
  return 'none'
}

export function matchFeedback(score: number): string {
  switch (matchVerdict(score)) {
    case 'exact':
      return 'Every word matched. Say it once more at normal speed to finish.'
    case 'close':
      return 'Most of the phrase matched — check the words marked below and retry.'
    case 'partial':
      return 'Only part of the phrase matched. Listen again, then repeat it word by word.'
    default:
      return 'No words matched this time. Move closer to the microphone and try again.'
  }
}

export const TEXT_MATCH_DISCLAIMER =
  'Text-match exercise only: the browser turned your speech into text and this compares the words. ' +
  'It does not judge pronunciation, accent or tajweed — a human teacher is still the best guide.'

/** Which target words were heard, for a simple word-by-word display. */
export function targetWordMatch(spoken: string, target: string): { word: string; matched: boolean }[] {
  const heard = new Set(normalizeSpoken(spoken).split(' ').filter(Boolean))
  return target
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => ({ word, matched: heard.has(normalizeSpoken(word)) }))
}

export function manualCheckLabel(passed: boolean): string {
  return passed ? 'Marked as said correctly (self-check)' : 'Marked as needs more practice (self-check)'
}
