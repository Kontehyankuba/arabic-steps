import { VOCAB, type VocabWord } from '../data/vocab'

export type QuizQuestion = {
  wordId: string
  arabic: string
  translit: string
  options: string[]
  answer: string
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/**
 * Build a multiple-choice quiz from the vocabulary deck.
 * Every question offers four meanings: the right one plus three other words.
 */
export function buildQuiz(
  words: VocabWord[] = VOCAB,
  count = 5,
  rng: () => number = Math.random,
): QuizQuestion[] {
  if (words.length < 4) throw new Error('A quiz needs at least four words to build options')
  const picked = shuffle(words, rng).slice(0, Math.min(count, words.length))
  return picked.map((word) => {
    const distractors = shuffle(
      words.filter((item) => item.id !== word.id).map((item) => item.meaning),
      rng,
    ).slice(0, 3)
    return {
      wordId: word.id,
      arabic: word.arabic,
      translit: word.translit,
      options: shuffle([word.meaning, ...distractors], rng),
      answer: word.meaning,
    }
  })
}

export function scoreQuiz(questions: QuizQuestion[], answers: (string | null)[]): number {
  return questions.reduce(
    (score, question, index) => (answers[index] === question.answer ? score + 1 : score),
    0,
  )
}

export function quizMessage(correct: number, total: number): string {
  const ratio = total ? correct / total : 0
  if (ratio === 1) return 'Perfect score — أحسنت! (aḥsanta — well done)'
  if (ratio >= 0.8) return 'Very good. Review the one you missed, then try again tomorrow.'
  if (ratio >= 0.5) return 'Good start. Say each word out loud before choosing next time.'
  return 'Keep going — slow and steady. Review the flashcards, then try again.'
}
