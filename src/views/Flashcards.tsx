import { useState } from 'react'
import { VOCAB } from '../data/vocab'
import type { TabId } from '../data/plan'
import AudioBar from '../components/AudioBar'
import { speak } from '../lib/audio'
import { useProgress } from '../lib/useProgress'

export default function Flashcards({ onNavigate }: { onNavigate: (tab: TabId) => void }) {
  const { state, markLesson, setWordKnown, addVocabReview } = useProgress()
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [note, setNote] = useState('')

  const word = VOCAB[index]
  const known = state.wordsKnown.length
  const allReviewed = index >= VOCAB.length

  function goNext(knownAnswer: boolean) {
    setWordKnown(word.id, knownAnswer)
    addVocabReview(word.id, knownAnswer)
    setFlipped(false)
    if (index + 1 >= VOCAB.length) {
      markLesson('vocab')
      setIndex(VOCAB.length)
      return
    }
    setIndex(index + 1)
  }

  async function play(text: string) {
    try {
      setNote('')
      await speak(text, 'slow')
    } catch {
      setNote('Your browser could not play audio. Try Safari on iPhone or Chrome on desktop.')
    }
  }

  return (
    <div className="stack">
      <section className="card">
        <div className="card-head">
          <div>
            <p className="eyebrow">Lesson 4</p>
            <h2>Five starter words</h2>
          </div>
          <span className="pill">{known} / {VOCAB.length} known</span>
        </div>
        <p className="muted">
          Tap the card to see the meaning. Say the Arabic out loud before you flip it — that is what
          makes it stick.
        </p>

        {!allReviewed ? (
          <>
            <div className="progress" aria-hidden="true">
              <div style={{ width: `${(index / VOCAB.length) * 100}%` }} />
            </div>
            <p className="small muted center">
              Card {index + 1} of {VOCAB.length}
            </p>

            <button
              type="button"
              className={`flashcard ${flipped ? 'flipped' : ''}`}
              onClick={() => setFlipped((value) => !value)}
              aria-label="Flip the flashcard"
            >
              <span className="flash-emoji" aria-hidden="true">
                {word.emoji}
              </span>
              <span className="arabic huge" lang="ar" dir="rtl">
                {word.arabic}
              </span>
              {flipped ? (
                <>
                  <span className="translit">{word.translit}</span>
                  <span className="flash-answer">{word.meaning}</span>
                  <span className="small muted">{word.hint}</span>
                </>
              ) : (
                <span className="small muted">Tap to reveal the meaning</span>
              )}
            </button>

            <AudioBar
              text={word.arabic}
              exerciseId={`vocab-${word.id}`}
              label="the word"
              compact
            />

            <div className="actions center">
              <button type="button" className="btn ghost" onClick={() => void play(word.arabic)}>
                🔊 Hear it
              </button>
              <button type="button" className="btn ghost" onClick={() => setFlipped((v) => !v)}>
                {flipped ? 'Hide meaning' : 'Show meaning'}
              </button>
            </div>

            <div className="actions center">
              <button type="button" className="btn ghost" onClick={() => goNext(false)}>
                Still learning
              </button>
              <button type="button" className="btn primary" onClick={() => goNext(true)}>
                I know it ✓
              </button>
            </div>
            <p className="small muted center">{note}</p>
          </>
        ) : (
          <div className="done-box">
            <p className="big-emoji" aria-hidden="true">
              🌟
            </p>
            <h3>All five cards reviewed</h3>
            <p className="muted">
              You know {known} of {VOCAB.length} by heart. Reviewing once a day is enough at the
              start.
            </p>
            <div className="actions center">
              <button
                type="button"
                className="btn ghost"
                onClick={() => {
                  setIndex(0)
                  setFlipped(false)
                }}
              >
                Review again
              </button>
              <button type="button" className="btn primary" onClick={() => onNavigate('quiz')}>
                Take the quiz →
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="card">
        <h3>The deck</h3>
        <ul className="word-list">
          {VOCAB.map((item) => (
            <li key={item.id}>
              <div className="word-arabic" lang="ar" dir="rtl">
                {item.arabic}
              </div>
              <div className="word-info">
                <strong>{item.meaning}</strong>
                <span className="small muted">{item.translit}</span>
                <span className="small muted">
                  {item.example.arabic} — {item.example.meaning}
                </span>
              </div>
              <div className="word-actions">
                <button
                  type="button"
                  className="btn tiny"
                  onClick={() => void play(item.arabic)}
                  aria-label={`Hear ${item.meaning}`}
                >
                  🔊
                </button>
                <span className={`dot ${state.wordsKnown.includes(item.id) ? 'dot-on' : ''}`} />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
