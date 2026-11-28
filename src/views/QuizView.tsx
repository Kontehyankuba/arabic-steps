import { useState } from 'react'
import { VOCAB } from '../data/vocab'
import { buildQuiz, quizMessage, scoreQuiz, type QuizQuestion } from '../lib/quiz'
import { useProgress } from '../lib/useProgress'
import { speak } from '../lib/audio'

export default function QuizView() {
  const { markLesson, saveQuiz, stats } = useProgress()
  const [questions, setQuestions] = useState<QuizQuestion[]>(() => buildQuiz(VOCAB, 5))
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<(string | null)[]>(() => Array(5).fill(null))
  const [finished, setFinished] = useState(false)
  const [saved, setSaved] = useState(false)

  const question = questions[index]
  const chosen = answers[index] ?? null
  const answered = chosen !== null
  const correctCount = scoreQuiz(questions, answers)

  function choose(option: string) {
    if (answered) return
    setAnswers((current) => {
      const next = [...current]
      next[index] = option
      return next
    })
  }

  function next() {
    if (index + 1 < questions.length) {
      setIndex(index + 1)
      return
    }
    if (!saved) {
      const score = scoreQuiz(questions, answers)
      saveQuiz(score, questions.length)
      markLesson('quiz')
      setSaved(true)
    }
    setFinished(true)
  }

  function restart() {
    setQuestions(buildQuiz(VOCAB, 5))
    setAnswers(Array(5).fill(null))
    setIndex(0)
    setFinished(false)
    setSaved(false)
  }

  async function hear(text: string) {
    try {
      await speak(text, 'slow')
    } catch {
      /* device voice unavailable — the text is still visible */
    }
  }

  if (finished) {
    return (
      <section className="card">
        <p className="eyebrow">Quiz result</p>
        <h2>
          {correctCount} / {questions.length} correct
        </h2>
        <div className="progress" aria-hidden="true">
          <div style={{ width: `${(correctCount / questions.length) * 100}%` }} />
        </div>
        <p>{quizMessage(correctCount, questions.length)}</p>
        <p className="small muted">
          Saved to your progress. Best score so far: {stats.bestQuiz}% · quizzes taken:{' '}
          {stats.quizCount}
        </p>
        <ul className="review-list">
          {questions.map((item, position) => {
            const ok = answers[position] === item.answer
            return (
              <li key={item.wordId}>
                <span className={ok ? 'mark-ok' : 'mark-bad'}>{ok ? '✓' : '✕'}</span>
                <span className="word-arabic small-arabic" lang="ar" dir="rtl">
                  {item.arabic}
                </span>
                <span className="small">
                  {item.answer}
                  {!ok && answers[position] ? ` (you chose ${answers[position]})` : ''}
                </span>
              </li>
            )
          })}
        </ul>
        <div className="actions center">
          <button type="button" className="btn primary" onClick={restart}>
            Try again
          </button>
        </div>
      </section>
    )
  }

  return (
    <div className="stack">
      <section className="card">
        <div className="card-head">
          <div>
            <p className="eyebrow">Lesson 4 · Quiz</p>
            <h2>What does this word mean?</h2>
          </div>
          <span className="pill">
            {index + 1} / {questions.length}
          </span>
        </div>
        <div className="progress" aria-hidden="true">
          <div style={{ width: `${(index / questions.length) * 100}%` }} />
        </div>

        <p className="arabic big center-text" lang="ar" dir="rtl">
          {question.arabic}
        </p>
        <p className="translit">{question.translit}</p>
        <div className="actions center">
          <button type="button" className="btn ghost" onClick={() => void hear(question.arabic)}>
            🔊 Hear the word
          </button>
        </div>

        <div className="options">
          {question.options.map((option) => {
            const isAnswer = option === question.answer
            const isChosen = option === chosen
            const state = !answered ? '' : isAnswer ? 'correct' : isChosen ? 'wrong' : ''
            return (
              <button
                key={option}
                type="button"
                className={`option ${state}`}
                onClick={() => choose(option)}
                disabled={answered}
              >
                {option}
                {answered && isAnswer ? ' ✓' : ''}
              </button>
            )
          })}
        </div>

        <p className="feedback" aria-live="polite">
          {answered
            ? chosen === question.answer
              ? 'Correct — أحسنت (aḥsanta).'
              : `Not quite. The answer is “${question.answer}”.`
            : ' '}
        </p>

        <button type="button" className="btn primary wide" onClick={next} disabled={!answered}>
          {index + 1 < questions.length ? 'Next question →' : 'See my score'}
        </button>
      </section>
    </div>
  )
}
