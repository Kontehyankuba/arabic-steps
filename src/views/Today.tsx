import { useEffect, useState } from 'react'
import { DAILY_PLAN, TOTAL_PLAN_MINUTES, type TabId } from '../data/plan'
import { useProgress } from '../lib/useProgress'
import { dateKey } from '../lib/progress'

const PLAN_SECONDS = TOTAL_PLAN_MINUTES * 60

function format(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${minutes}:${String(rest).padStart(2, '0')}`
}

export default function Today({ onNavigate }: { onNavigate: (tab: TabId) => void }) {
  const { stats, completeDay } = useProgress()
  const [secondsLeft, setSecondsLeft] = useState(PLAN_SECONDS)
  const [running, setRunning] = useState(false)
  const [dayDone, setDayDone] = useState(stats.studiedToday)

  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(() => {
      setSecondsLeft((value) => Math.max(0, value - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [running])

  useEffect(() => {
    if (secondsLeft === 0 && running) setRunning(false)
  }, [secondsLeft, running])

  function finishDay() {
    completeDay(TOTAL_PLAN_MINUTES)
    setDayDone(true)
  }

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="stack">
      <section className="card">
        <div className="card-head">
          <div>
            <p className="eyebrow">{today}</p>
            <h2>Today’s 15-minute plan</h2>
          </div>
          <span className={`pill ${dayDone ? 'pill-good' : ''}`}>
            {dayDone ? 'Done today ✓' : 'Not started'}
          </span>
        </div>
        <p className="muted">
          Read slowly and say everything out loud. It is fine to repeat the same day twice — that is
          how reading sticks.
        </p>

        <div className="plan-list">
          {DAILY_PLAN.map((block, index) => (
            <div className="plan-item" key={block.id}>
              <span className="plan-emoji" aria-hidden="true">
                {block.emoji}
              </span>
              <div className="plan-text">
                <strong>
                  {index + 1}. {block.title} <span className="muted">· {block.minutes} min</span>
                </strong>
                <span className="muted small">{block.description}</span>
              </div>
              <button type="button" className="btn ghost" onClick={() => onNavigate(block.tab)}>
                Start
              </button>
            </div>
          ))}
        </div>

        <div className="timer-row">
          <div className="timer" aria-live="off">
            {format(secondsLeft)}
          </div>
          <div className="timer-actions">
            <button
              type="button"
              className="btn primary"
              onClick={() => setRunning((value) => !value)}
              disabled={secondsLeft === 0}
            >
              {running ? 'Pause' : secondsLeft === 0 ? 'Finished' : 'Start timer'}
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={() => {
                setRunning(false)
                setSecondsLeft(PLAN_SECONDS)
              }}
            >
              Reset
            </button>
          </div>
        </div>

        <button type="button" className="btn primary wide" onClick={finishDay} disabled={dayDone}>
          {dayDone ? 'Today’s study is saved ✓' : 'Mark today’s 15 minutes complete'}
        </button>
        <p className="small muted center">
          Saving a day adds to your streak. Current streak: {stats.streak}{' '}
          {stats.streak === 1 ? 'day' : 'days'} · {stats.planDays} study{' '}
          {stats.planDays === 1 ? 'day' : 'days'} saved · last update {dateKey()}
        </p>
      </section>

      <section className="grid two">
        <div className="card compact">
          <p className="eyebrow">Where you are</p>
          <h3>
            {stats.lessonsDone} of {stats.totalLessons} lessons
          </h3>
          <div className="progress" aria-hidden="true">
            <div style={{ width: `${stats.lessonPercent}%` }} />
          </div>
          <p className="small muted">
            {stats.lettersSeen} letters opened · {stats.wordsKnown} of 5 words known ·{' '}
            {stats.bestQuiz}% best quiz
          </p>
        </div>
        <div className="card compact">
          <p className="eyebrow">Beginner tip</p>
          <p className="arabic small-arabic" lang="ar" dir="rtl">
            اِقْرَأْ بِبُطْءٍ
          </p>
          <p className="small muted">
            Read slowly. Speed comes later — accuracy first. Say the letter names aloud as you look
            at their shapes.
          </p>
        </div>
      </section>

      <section className="card">
        <h3>New here? Do this first</h3>
        <ol className="steps">
          <li>
            Open <strong>Letters</strong> and tap three letters. Look at all four shapes.
          </li>
          <li>
            Open <strong>Vowels</strong> and listen to fatḥah, kasrah and ḍammah.
          </li>
          <li>
            Open <strong>Words</strong> and flip the five flashcards.
          </li>
          <li>
            Take the <strong>Quiz</strong>. Your score is saved automatically.
          </li>
        </ol>
      </section>
    </div>
  )
}
