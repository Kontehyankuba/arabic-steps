import { useState } from 'react'
import { RECITER, SURAHS } from '../data/quran'
import { playRecitation, speak, stopRecitation } from '../lib/audio'
import { useProgress } from '../lib/useProgress'

export default function Quran() {
  const { state, markLesson } = useProgress()
  const [surahId, setSurahId] = useState(SURAHS[0].id)
  const [playingId, setPlayingId] = useState<number | null>(null)
  const [status, setStatus] = useState('')

  const surah = SURAHS.find((item) => item.id === surahId) ?? SURAHS[0]
  const lessonId = `quran-${surah.id}`
  const learned = Boolean(state.lessons[lessonId])

  async function play(global: number, arabic: string) {
    if (playingId === global) {
      stopRecitation()
      setPlayingId(null)
      return
    }
    setPlayingId(global)
    setStatus('Loading the recitation…')
    try {
      await playRecitation(global)
      setStatus('')
    } catch {
      // Offline or blocked network: fall back to the free device voice.
      setStatus('Recitation could not be streamed, so the device voice is reading it instead.')
      try {
        await speak(arabic, 0.65)
      } catch {
        setStatus('Audio is unavailable right now. Read the Arabic slowly, then try again.')
      }
    } finally {
      setPlayingId(null)
    }
  }

  return (
    <div className="stack">
      <section className="card">
        <div className="card-head">
          <div>
            <p className="eyebrow">Lesson 3</p>
            <h2>Quran reading</h2>
          </div>
          <span className={`pill ${learned ? 'pill-good' : ''}`}>{learned ? 'Read ✓' : 'Not yet'}</span>
        </div>
        <p className="muted">
          Read from right to left, one verse at a time. Listen once, then read aloud yourself. The
          transliteration is a helper — try to look at the Arabic first.
        </p>
        <div className="chips">
          {SURAHS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`chip ${item.id === surah.id ? 'active' : ''}`}
              onClick={() => {
                stopRecitation()
                setPlayingId(null)
                setSurahId(item.id)
                setStatus('')
              }}
            >
              {item.name}
            </button>
          ))}
        </div>
        <div className="surah-intro">
          <p className="arabic-name" lang="ar" dir="rtl">
            {surah.arabicName}
          </p>
          <p className="small muted">
            {surah.meaning} · {surah.intro}
          </p>
        </div>
        <p className="small muted" aria-live="polite">
          {status}
        </p>
      </section>

      {surah.ayat.map((ayah) => (
        <section className="card ayah" key={ayah.global}>
          <div className="ayah-head">
            <span className="ayah-number">{ayah.number}</span>
            <button
              type="button"
              className={`btn small ${playingId === ayah.global ? 'primary' : 'ghost'}`}
              onClick={() => void play(ayah.global, ayah.arabic)}
              aria-label={`Play recitation of verse ${ayah.number}`}
            >
              {playingId === ayah.global ? '⏹ Stop' : '▶ Recitation'}
            </button>
          </div>
          <p className="arabic quran-text" lang="ar" dir="rtl">
            {ayah.arabic}
          </p>
          <p className="translit">{ayah.translit}</p>
          <p className="meaning">{ayah.meaning}</p>
          <p className="tip">💡 {ayah.tip}</p>
        </section>
      ))}

      <section className="card">
        <div className="actions center">
          <button
            type="button"
            className="btn primary"
            onClick={() => markLesson(lessonId)}
            disabled={learned}
          >
            {learned ? 'Surah read ✓' : `Mark ${surah.name} read`}
          </button>
        </div>
        <p className="small muted">
          Recitation: {RECITER.name} · streamed from the free {RECITER.source}, no API key needed.
          This app is a reading aid: for correct tajwīd, learn from a qualified teacher.
        </p>
      </section>
    </div>
  )
}
