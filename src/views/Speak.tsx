import { useState } from 'react'
import { PHRASES } from '../data/vocab'
import { listenOnce, listeningSupported, speak, stopSpeaking } from '../lib/audio'
import { similarity, similarityFeedback } from '../lib/arabic'
import { useProgress } from '../lib/useProgress'

export default function Speak() {
  const { state, addSpeakAttempt, markLesson } = useProgress()
  const [index, setIndex] = useState(0)
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [score, setScore] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [note, setNote] = useState('')

  const phrase = PHRASES[index]
  const supported = listeningSupported()
  const learned = Boolean(state.lessons.speaking)

  async function listen() {
    try {
      setNote('')
      stopSpeaking()
      await speak(phrase.arabic, 0.65)
    } catch {
      setNote('Your browser could not play the model pronunciation. Read the transliteration instead.')
    }
  }

  async function record() {
    setMessage('')
    setTranscript('')
    setScore(null)
    setListening(true)
    try {
      const heard = await listenOnce('ar-SA')
      const value = similarity(heard, phrase.arabic)
      setTranscript(heard)
      setScore(value)
      setMessage(similarityFeedback(value))
      addSpeakAttempt(value)
      markLesson('speaking')
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'no-speech'
      setMessage(
        reason === 'permission'
          ? 'Microphone permission was blocked. Allow it in your browser settings, or just listen and repeat aloud.'
          : reason === 'unsupported'
            ? 'This browser cannot record speech. Use Listen, then repeat the phrase out loud.'
            : 'I did not catch that. Move somewhere quieter and try once more.',
      )
    } finally {
      setListening(false)
    }
  }

  function change(delta: number) {
    const next = (index + delta + PHRASES.length) % PHRASES.length
    setIndex(next)
    setTranscript('')
    setScore(null)
    setMessage('')
    setNote('')
    stopSpeaking()
  }

  return (
    <div className="stack">
      <section className="card">
        <div className="card-head">
          <div>
            <p className="eyebrow">Lesson 5</p>
            <h2>Listen &amp; speak</h2>
          </div>
          <span className={`pill ${learned ? 'pill-good' : ''}`}>
            {state.speakAttempts} attempts
          </span>
        </div>
        <p className="muted">
          Listen to the phrase, repeat it out loud three times, then record yourself if your browser
          allows it. Scoring is a rough guide, not a teacher.
        </p>

        <div className="speak-card">
          <p className="arabic big" lang="ar" dir="rtl">
            {phrase.arabic}
          </p>
          <p className="translit">{phrase.translit}</p>
          <p className="meaning">{phrase.meaning}</p>
          <p className="small muted">{phrase.note}</p>
        </div>

        <div className="actions center">
          <button type="button" className="btn ghost" onClick={() => change(-1)}>
            ← Previous
          </button>
          <button type="button" className="btn primary" onClick={() => void listen()}>
            🔊 Listen
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={() => void record()}
            disabled={listening || !supported}
          >
            {listening ? 'Listening…' : '🎙️ Try saying it'}
          </button>
          <button type="button" className="btn ghost" onClick={() => change(1)}>
            Next →
          </button>
        </div>

        {!supported && (
          <p className="small muted center">
            Speech recognition is not available in this browser. On iPhone it works in Safari; you can
            always listen and repeat aloud.
          </p>
        )}

        {transcript && (
          <div className="result-box">
            <p className="small muted">I heard:</p>
            <p className="arabic" lang="ar" dir="rtl">
              {transcript}
            </p>
            {score !== null && (
              <>
                <div className="progress" aria-hidden="true">
                  <div style={{ width: `${Math.round(score * 100)}%` }} />
                </div>
                <p className="small">
                  Match: {Math.round(score * 100)}% · best so far {state.bestSimilarity}%
                </p>
              </>
            )}
          </div>
        )}
        <p className="feedback" aria-live="polite">
          {message}
        </p>
        <p className="small muted center">{note}</p>
      </section>

      <section className="card">
        <h3>Practice tips</h3>
        <ul className="steps">
          <li>Listen once without speaking, and look at the Arabic shapes.</li>
          <li>Repeat slowly, syllable by syllable.</li>
          <li>Then say the whole phrase at normal speed.</li>
          <li>Recording yourself once a day is enough — clarity first, speed later.</li>
        </ul>
      </section>
    </div>
  )
}
