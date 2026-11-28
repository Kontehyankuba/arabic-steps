import { LETTERS_BY_ID, type Letter } from '../data/letters'

export type LetterForm = 'isolated' | 'initial' | 'medial' | 'final'

export const FORM_LABELS: Record<LetterForm, string> = {
  isolated: 'Isolated',
  initial: 'Initial',
  medial: 'Medial',
  final: 'Final',
}

export function formsOf(letter: Letter): { form: LetterForm; glyph: string }[] {
  return [
    { form: 'isolated', glyph: letter.isolated },
    { form: 'initial', glyph: letter.initial },
    { form: 'medial', glyph: letter.medial },
    { form: 'final', glyph: letter.final },
  ]
}

/**
 * Pick the shape a letter takes inside a word.
 * - a letter after a joining letter and before another letter → medial
 * - after a joining letter, at the end → final
 * - at the start, with a following letter, and it joins forward → initial
 * - otherwise → isolated
 */
export function shapeFor(
  letter: Letter,
  options: { previous?: Letter | null; next?: Letter | null },
): LetterForm {
  const previousJoins = Boolean(options.previous?.connects)
  const hasNext = Boolean(options.next)
  if (previousJoins && hasNext) return 'medial'
  if (previousJoins) return 'final'
  if (hasNext && letter.connects) return 'initial'
  return 'isolated'
}

export function glyphFor(letter: Letter, form: LetterForm): string {
  return letter[form]
}

/**
 * Join letter ids into one connected word, e.g. ['ba','ya','ta'] → بـيـت.
 * Used by the connected-letters practice so learners can see why a word looks
 * the way it does.
 */
export function connect(letterIds: string[]): string {
  const letters = letterIds.map((id) => {
    const letter = LETTERS_BY_ID[id]
    if (!letter) throw new Error(`Unknown letter id: ${id}`)
    return letter
  })
  return letters
    .map((letter, index) => {
      const form = shapeFor(letter, {
        previous: letters[index - 1] ?? null,
        next: letters[index + 1] ?? null,
      })
      return glyphFor(letter, form)
    })
    .join('')
}

/** Breakdown of one word into per-letter shapes, for the practice view. */
export function explainWord(letterIds: string[]): { letter: Letter; form: LetterForm; glyph: string }[] {
  const letters = letterIds.map((id) => {
    const letter = LETTERS_BY_ID[id]
    if (!letter) throw new Error(`Unknown letter id: ${id}`)
    return letter
  })
  return letters.map((letter, index) => {
    const form = shapeFor(letter, {
      previous: letters[index - 1] ?? null,
      next: letters[index + 1] ?? null,
    })
    return { letter, form, glyph: glyphFor(letter, form) }
  })
}

/** Remove diacritics, tatweel and unify alef/yāʾ forms before comparing text. */
export function normalizeArabic(input: string): string {
  return input
    .replace(/[\u064B-\u0652\u0670\u0640\u06D6-\u06ED]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^\u0621-\u064A\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function stripTashkeel(input: string): string {
  return input.replace(/[\u064B-\u0652\u0670]/g, '')
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index)
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i]
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + cost)
    }
    previous = current
  }
  return previous[b.length]
}

/** 0–1 similarity of two Arabic phrases, ignoring vowel marks. */
export function similarity(spoken: string, target: string): number {
  const a = normalizeArabic(spoken)
  const b = normalizeArabic(target)
  if (!a || !b) return 0
  const distance = levenshtein(a, b)
  return Math.max(0, 1 - distance / Math.max(a.length, b.length))
}

export function similarityFeedback(score: number): string {
  if (score >= 0.9) return 'Excellent — that sounded very close.'
  if (score >= 0.7) return 'Good. Repeat it once more, a little slower.'
  if (score >= 0.4) return 'Getting there. Listen again and copy each sound.'
  return 'Keep going — listen once more, then say it word by word.'
}
