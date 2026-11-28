import { useState } from 'react'
import { PHRASES } from '../data/vocab'
import AudioBar from '../components/AudioBar'
import { listenOnce, listeningSupported, stopListening } from '../lib/audio'
import {
  TEXT_MATCH_DISCLAIMER,
  isTextMatch,
  matchFeedback,
  matchScore,
  targetWordMatch,
} from '../lib/speech'
import { useProgress } from '../lib/useProgress'

type Failure = 'unsupported' | 'permission' | 'no-speech' | 'cancelled'

const FAILURE_TEXT: Record<Failure, string> = {
  permission:
    'Microphone permission was blocked. Allow the microphone in your browser settings and tap Retry — or use the self-check below.',
  unsupported:
    'This browser cannot record speech. Use Play to listen, then check yourself below.',
  cancelled: 'The recording was stopped before anything was heard. Tap Retry when you are ready.',
  'no-speech': 'Nothing was heard. Move somewhere quieter, speak clearly, then tap Retry.',
}

export default function Speak() {
  const { state, addSpeakAttempt, markLesson } = useProgress()
  const [index, setIndex] = useState(0)
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [score, setScore] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [manualNote, setManualNote] = useState('')

  const phrase = PHRASES[index]
  const supported = listeningSupported()
  const learned = Boolean(state.lessons.speaking)
  const words = transcript ? targetWordMatch(transcript, phrase.arabic) : []

  function reset() {
    setTranscript('')
    setScore(null)
    setMessage('')
    setManualNote('')
  }

  async function record() {
    reset()
    if (!supported) {
      setMessage(FAILURE_TEXT.unsupported)
      return
    }
    setListening(true)
    try {
      const heard = await listenOnce('ar-SA')
      if (!heard.trim()) {
        setMessage(FAILURE_TEXT['no-speech'])
        return
      }
      const value = matchScore(heard, phrase.arabic)
      setTranscript(heard)
      setScore(value)
      setMessage(
        isTextMatch(heard, phrase.arabic)
          ? 'Text match: the words matched exactly. ' + matchFeedback(value)
          : 'Text match: ' + matchFeedback(value),
      )
      addSpeakAttempt(value, phrase.id, false)
      markLesson('speaking')
    } catch (error) {
      const reason = (error instanceof Error ? error.message : 'no-speech') as Failure
      setMessage(FAILURE_TEXT[reason] ?? FAILURE_TEXT['no-speech'])
    } finally {
      setListening(false)
    }
  }

  function stopAttempt() {
    stopListening()
    setListening(false)
    setMessage(FAILURE_TEXT.cancelled)
  }

  function selfCheck(passed: boolean) {
    reset()
    const value = passed ? 1 : 0.5
    setScore(value)
    setManualNote(
      passed
        ? 'Self-check saved: you judged that you said it correctly.'
        : 'Self-check saved: keep practising this one.',
    )
    addSpeakAttempt(value, phrase.id, true)
    markLesson('speaking')
  }

  function change(delta: number) {
    setIndex((index + delta + PHRASES.length) % PHRASES.length)
    reset()
    stopListening()
  }

  return (
    <div className="stack">
      <section className="card">
        <div className="card-head">
          <div>
            <p className="eyebrow">Lesson 5</p>
            <h2>Listen &amp; speak</h2>
          </div>
          <span className={`pill ${learned ? 'pill-good' : ''}`}>{state.speakAttempts} attempts</span>
        </div>
        <p className="muted">
          Listen to the phrase, repeat it out loud, then tap the microphone and say it once. The
          result compares the words the browser heard with the target phrase.
        </p>

        <div className="speak-card">
          <p className="eyebrow">Say this</p>
          <p className="arabic big" lang="ar" dir="rtl">
            {phrase.arabic}
          </p>
          <p className="translit">{phrase.translit}</p>
          <p className="meaning">{phrase.meaning}</p>
          <p className="small muted">{phrase.note}</p>
        </div>

        <AudioBar
          text={phrase.arabic}
          exerciseId={`phrase-${phrase.id}`}
          label="the model phrase"
        />

        <div className="mic-row">
          <button
            type="button"
            className={`btn primary mic-button${listening ? ' listening' : ''}`}
            onClick={() => (listening ? stopAttempt() : void record())}
            aria-label={listening ? 'Stop listening' : 'Start speaking practice'}
          >
            {listening ? (
              <>
                <span className="mic-dot" aria-hidden="true" />
                Listening… tap to stop
              </>
            ) : (
              <>🎙️ {score === null ? 'Speak now' : 'Retry with microphone'}</>
            )}
          </button>
          {score !== null && !listening && (
            <button type="button" className="btn ghost" onClick={() => void record()}>
              ↻ Retry
            </button>
          )}
        </div>

        <div className="speak-nav">
          <button type="button" className="btn ghost" onClick={() => change(-1)}>
            ← Previous
          </button>
          <span className="small muted">
            Phrase {index + 1} of {PHRASES.length}
          </span>
          <button type="button" className="btn ghost" onClick={() => change(1)}>
            Next →
          </button>
        </div>

        {listening && (
          <p className="listening-hint" aria-live="polite">
            Listening… say the phrase now.
          </p>
        )}

        {transcript && (
          <div className="result-box">
            <p className="small muted">The browser heard:</p>
            <p className="arabic" lang="ar" dir="rtl">
              {transcript}
            </p>
            <ul className="word-match" aria-label="Word by word match">
              {words.map((item, position) => (
                <li key={`${item.word}-${position}`} className={item.matched ? 'hit' : 'miss'}>
                  <span lang="ar" dir="rtl">
                    {item.word}
                  </span>
                  <span className="small">{item.matched ? '✓' : '✗'}</span>
                </li>
              ))}
            </ul>
            {score !== null && (
              <>
                <div className="progress" aria-hidden="true">
                  <div style={{ width: `${Math.round(score * 100)}%` }} />
                </div>
                <p className="small">
                  Text match: {Math.round(score * 100)}% · best so far {state.bestSimilarity}%
                </p>
              </>
            )}
          </div>
        )}

        <p className="feedback" aria-live="polite">
          {message || manualNote}
        </p>

        <p className="disclaimer">{TEXT_MATCH_DISCLAIMER}</p>
      </section>

      <section className="card">
        <h3>No microphone? Check yourself</h3>
        <p className="muted small">
          {supported
            ? 'Speech recognition is available here, but you can also judge yourself by ear.'
            : 'Speech recognition is not available in this browser, so use this self-check instead. On iPhone it works in Safari; Chrome and Edge support it on desktop.'}
        </p>
        <div className="actions center">
          <button type="button" className="btn primary" onClick={() => selfCheck(true)}>
            ✓ I said it correctly
          </button>
          <button type="button" className="btn ghost" onClick={() => selfCheck(false)}>
            ↻ Needs more practice
          </button>
        </div>
      </section>

      <section className="card">
        <h3>Practice tips</h3>
        <ul className="steps">
          <li>Listen once without speaking, and look at the Arabic shapes.</li>
          <li>Repeat slowly with the Slow speed, syllable by syllable.</li>
          <li>Then say the whole phrase at Normal speed and record it.</li>
          <li>Recording yourself once a day is enough — clarity first, speed later.</li>
        </ul>
      </section>
    </div>
  )
}
