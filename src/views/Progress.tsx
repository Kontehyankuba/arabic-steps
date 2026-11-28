import { useRef, useState } from 'react'
import { LESSONS, TOTAL_LESSONS } from '../data/plan'
import { VOCAB } from '../data/vocab'
import { sanitizeState, type ProgressState } from '../lib/progress'
import { useProgress } from '../lib/useProgress'

const SCALES: { label: string; value: number }[] = [
  { label: 'A', value: 0.85 },
  { label: 'A', value: 1 },
  { label: 'A', value: 1.2 },
  { label: 'A', value: 1.4 },
]

export default function Progress() {
  const { state, stats, setScale, replaceState, reset, storageOk } = useProgress()
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState('')

  function exportBackup() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `arabic-journey-backup-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
    setMessage('Backup downloaded. Save it somewhere safe, or import it on your other device.')
  }

  function importBackup(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = sanitizeState(JSON.parse(String(reader.result)))
        if (!parsed) throw new Error('invalid')
        replaceState(parsed as ProgressState)
        setMessage('Backup imported. Your progress is now on this device.')
      } catch {
        setMessage('That file does not look like an Arabic Journey backup.')
      }
    }
    reader.readAsText(file)
  }

  const groups = Array.from(new Set(LESSONS.map((lesson) => lesson.group)))

  return (
    <div className="stack">
      <section className="card">
        <p className="eyebrow">Your progress</p>
        <h2>
          {stats.lessonsDone} of {TOTAL_LESSONS} lessons complete
        </h2>
        <div className="progress" aria-hidden="true">
          <div style={{ width: `${stats.lessonPercent}%` }} />
        </div>
        <div className="stat-grid">
          <div className="stat">
            <strong>{stats.streak} 🔥</strong>
            <span>Day streak</span>
          </div>
          <div className="stat">
            <strong>{stats.lessonsDone}</strong>
            <span>Lessons done</span>
          </div>
          <div className="stat">
            <strong>{stats.bestQuiz}%</strong>
            <span>Best quiz</span>
          </div>
          <div className="stat">
            <strong>{stats.wordsKnown}/5</strong>
            <span>Words known</span>
          </div>
          <div className="stat">
            <strong>{stats.lettersSeen}/28</strong>
            <span>Letters opened</span>
          </div>
          <div className="stat">
            <strong>{stats.minutes}</strong>
            <span>Minutes logged</span>
          </div>
          <div className="stat">
            <strong>{stats.audioExercises}</strong>
            <span>Audio exercises</span>
          </div>
          <div className="stat">
            <strong>{stats.speakAttempts}</strong>
            <span>Speaking tries</span>
          </div>
        </div>
        <p className="small muted">
          {stats.studiedToday
            ? 'You have already studied today — the streak is safe. ✓'
            : 'Nothing saved today yet. Finish any lesson to keep your streak alive.'}
        </p>
      </section>

      <section className="card">
        <h3>Lessons</h3>
        {groups.map((group) => (
          <div key={group} className="lesson-group">
            <p className="eyebrow">{group}</p>
            <ul className="lesson-list">
              {LESSONS.filter((lesson) => lesson.group === group).map((lesson) => {
                const done = Boolean(state.lessons[lesson.id])
                return (
                  <li key={lesson.id} className={done ? 'done' : ''}>
                    <span className="mark">{done ? '✓' : '○'}</span>
                    <span>{lesson.title}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </section>

      <section className="card">
        <h3>Quiz scores</h3>
        {state.quizResults.length === 0 ? (
          <p className="muted">No quiz taken yet. The quiz saves your score automatically.</p>
        ) : (
          <ul className="quiz-history">
            {[...state.quizResults].reverse().map((result, index) => (
              <li key={`${result.date}-${index}`}>
                <span>
                  {new Date(result.date).toLocaleDateString(undefined, {
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
                <strong>
                  {result.correct} / {result.total}
                </strong>
              </li>
            ))}
          </ul>
        )}
        <p className="small muted">
          Known words: {state.wordsKnown.length ? state.wordsKnown.map((id) => VOCAB.find((w) => w.id === id)?.meaning ?? id).join(', ') : 'none marked yet'}
        </p>
      </section>

      <section className="card">
        <h3>Audio &amp; speaking practice</h3>
        <div className="stat-grid">
          <div className="stat">
            <strong>{stats.audioPlays}</strong>
            <span>Listens completed</span>
          </div>
          <div className="stat">
            <strong>{stats.vocabReviews}</strong>
            <span>Cards reviewed</span>
          </div>
          <div className="stat">
            <strong>{stats.phrasesPracticed}</strong>
            <span>Phrases spoken</span>
          </div>
          <div className="stat">
            <strong>{stats.bestSimilarity}%</strong>
            <span>Best text match</span>
          </div>
          <div className="stat">
            <strong>{stats.manualChecks}</strong>
            <span>Self-checks</span>
          </div>
        </div>
        <p className="small muted">
          Speaking results compare the words the browser recognised with the target phrase. They
          measure text match only — not pronunciation or tajwīd.
        </p>
      </section>

      <section className="card">
        <h3>Reading comfort</h3>
        <p className="muted small">Make the Arabic bigger or smaller everywhere in the app.</p>
        <div className="actions">
          {SCALES.map((scale, position) => (
            <button
              key={scale.value}
              type="button"
              className={`btn ${state.settings.arabicScale === scale.value ? 'primary' : 'ghost'}`}
              onClick={() => setScale(scale.value)}
              aria-pressed={state.settings.arabicScale === scale.value}
            >
              <span style={{ fontSize: `${0.9 + position * 0.25}rem` }}>{scale.label}</span>
            </button>
          ))}
        </div>
        <p className="arabic" lang="ar" dir="rtl">
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </p>
      </section>

      <section className="card">
        <h3>Your data</h3>
        <p className="muted small">
          Progress is stored in this browser on this device — no account, no server, no tracking.
          {storageOk ? '' : ' Storage appears to be blocked, so saving may fail.'}
        </p>
        <div className="actions">
          <button type="button" className="btn ghost" onClick={exportBackup}>
            Export backup
          </button>
          <button type="button" className="btn ghost" onClick={() => fileRef.current?.click()}>
            Import backup
          </button>
          <button
            type="button"
            className="btn danger"
            onClick={() => {
              if (window.confirm('Reset all saved progress on this device? Export a backup first if you want to keep it.')) {
                reset()
                setMessage('Progress reset.')
              }
            }}
          >
            Reset progress
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) importBackup(file)
            event.target.value = ''
          }}
        />
        <p className="small muted" aria-live="polite">
          {message}
        </p>
      </section>
    </div>
  )
}
