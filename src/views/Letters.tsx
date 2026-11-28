import { useState } from 'react'
import { JOIN_WORDS, LETTERS } from '../data/letters'
import { FORM_LABELS, explainWord, formsOf } from '../lib/arabic'
import AudioBar from '../components/AudioBar'
import { useProgress } from '../lib/useProgress'

export default function Letters() {
  const { state, markLesson, seeLetter } = useProgress()
  const [selectedId, setSelectedId] = useState(LETTERS[0].id)
  const [wordId, setWordId] = useState(JOIN_WORDS[0].id)

  const letter = LETTERS.find((item) => item.id === selectedId) ?? LETTERS[0]
  const word = JOIN_WORDS.find((item) => item.id === wordId) ?? JOIN_WORDS[0]
  const parts = explainWord(word.letters)
  const learned = Boolean(state.lessons.letters)

  function select(id: string) {
    setSelectedId(id)
    seeLetter(id)
  }

  return (
    <div className="stack">
      <section className="card">
        <div className="card-head">
          <div>
            <p className="eyebrow">Lesson 1</p>
            <h2>Connected letters</h2>
          </div>
          <span className={`pill ${learned ? 'pill-good' : ''}`}>
            {learned ? 'Completed ✓' : `${state.lettersSeen.length} / 28 opened`}
          </span>
        </div>
        <p className="muted">
          Arabic is read right to left. Most letters change shape depending on where they sit in a
          word: isolated, initial, medial or final. Tap a letter to see all four.
        </p>

        <div className="letter-grid" role="list">
          {LETTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="listitem"
              className={`letter-tile ${item.id === letter.id ? 'selected' : ''} ${
                state.lettersSeen.includes(item.id) ? 'seen' : ''
              }`}
              onClick={() => select(item.id)}
              aria-pressed={item.id === letter.id}
            >
              <span className="glyph" lang="ar" dir="rtl">
                {item.isolated}
              </span>
              <span className="tile-name">{item.name}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="detail-head">
          <div>
            <p className="eyebrow">{letter.name}</p>
            <p className="arabic-name" lang="ar" dir="rtl">
              {letter.arabicName}
            </p>
            <p className="muted small">Sound: {letter.sound}</p>
          </div>
        </div>

        <AudioBar
          text={letter.arabicName}
          exerciseId={`letter-${letter.id}`}
          label={`the letter ${letter.name}`}
        />

        <div className="form-table" role="table" aria-label={`Forms of ${letter.name}`}>
          {formsOf(letter).map(({ form, glyph }) => (
            <div className="form-cell" role="row" key={form}>
              <span className="form-glyph" lang="ar" dir="rtl">
                {glyph}
              </span>
              <span className="form-label">{FORM_LABELS[form]}</span>
            </div>
          ))}
        </div>

        <p className="tip">💡 {letter.tip}</p>

        <div className="example-box">
          <p className="arabic" lang="ar" dir="rtl">
            {letter.example.word}
          </p>
          <p className="translit">{letter.example.translit}</p>
          <p className="meaning">{letter.example.meaning}</p>
        </div>
        <AudioBar
          text={letter.example.word}
          exerciseId={`letter-example-${letter.id}`}
          label={`the example word for ${letter.name}`}
          compact
        />
      </section>

      <section className="card">
        <h3>Build a word</h3>
        <p className="muted">
          Choose a word to see how its letters join. Letters that never join the next letter (ا د ذ ر
          ز و) leave a small gap.
        </p>
        <div className="chips">
          {JOIN_WORDS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`chip ${item.id === word.id ? 'active' : ''}`}
              onClick={() => setWordId(item.id)}
            >
              {item.translit}
            </button>
          ))}
        </div>

        <div className="join-parts">
          {parts.map((part, index) => (
            <div className="join-part" key={`${part.letter.id}-${index}`}>
              <span className="join-glyph" lang="ar" dir="rtl">
                {part.glyph}
              </span>
              <span className="small muted">{FORM_LABELS[part.form]}</span>
              <span className="small">{part.letter.name}</span>
            </div>
          ))}
        </div>

        <p className="join-arrow" aria-hidden="true">
          ↓
        </p>
        <p className="arabic big" lang="ar" dir="rtl">
          {word.arabic}
        </p>
        <p className="translit">{word.translit}</p>
        <p className="meaning">{word.meaning}</p>

        <AudioBar text={word.arabic} exerciseId={`word-${word.id}`} label={`the word ${word.translit}`} />

        <div className="actions center">
          <button
            type="button"
            className="btn ghost"
            onClick={() => markLesson('letters')}
            disabled={learned}
          >
            {learned ? 'Lesson complete ✓' : 'Mark lesson complete'}
          </button>
        </div>
      </section>
    </div>
  )
}
