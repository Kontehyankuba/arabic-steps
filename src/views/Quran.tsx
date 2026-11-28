import { useEffect, useMemo, useRef, useState } from 'react'
import { RECITER, SURAHS, recitationUrl, type Ayah } from '../data/quran'
import { playAudioUrl, stopRecitation } from '../lib/audio'
import { advanceQueue, clampRepeat, startQueue, type QueueState } from '../lib/recitation'
import { useProgress } from '../lib/useProgress'

type ApiInfo = {
  configured: boolean
  source: string
  reciter: { name: string; provider: string }
  audio: { ayah: number; url: string }[]
  note?: string
}

export default function Quran() {
  const { state, markLesson } = useProgress()
  const [surahId, setSurahId] = useState(SURAHS[0].id)
  const [queue, setQueue] = useState<QueueState | null>(null)
  const [repeat, setRepeat] = useState(1)
  const [loop, setLoop] = useState(false)
  const [status, setStatus] = useState('')
  const [info, setInfo] = useState<ApiInfo | null>(null)
  const runRef = useRef(0)

  const surah = SURAHS.find((item) => item.id === surahId) ?? SURAHS[0]
  const lessonId = `quran-${surah.id}`
  const learned = Boolean(state.lessons[lessonId])

  // Ask our own server for official Quran Foundation audio (if configured).
  // Credentials live only on the server, never in this bundle.
  useEffect(() => {
    let cancelled = false
    setInfo(null)
    fetch(`/api/quran/surah/${surah.chapter}`)
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error('bad status'))))
      .then((data: ApiInfo) => {
        if (!cancelled) setInfo(data)
      })
      .catch(() => {
        if (!cancelled) setInfo(null)
      })
    return () => {
      cancelled = true
    }
  }, [surah.chapter])

  const apiAudio = useMemo(() => {
    const map = new Map<number, string>()
    for (const item of info?.audio ?? []) {
      if (typeof item.url === 'string' && item.url.startsWith('http')) map.set(item.ayah, item.url)
    }
    return map
  }, [info])

  const reciter = info?.reciter ?? { name: RECITER.name, provider: RECITER.source }

  function audioUrlFor(ayah: Ayah): string {
    return apiAudio.get(ayah.number) ?? recitationUrl(ayah.global)
  }

  function stop() {
    runRef.current += 1
    stopRecitation()
    setQueue(null)
    setStatus('')
  }

  async function playFrom(startIndex: number) {
    if (surah.ayat.length === 0) return
    stopRecitation()
    const token = (runRef.current += 1)
    let current: QueueState | null = startQueue(startIndex, repeat)
    while (current && token === runRef.current) {
      setQueue(current)
      const ayah = surah.ayat[current.index]
      setStatus('')
      try {
        await playAudioUrl(audioUrlFor(ayah))
      } catch {
        if (token !== runRef.current) return
        setQueue(null)
        // Never fake it: the app says the recitation is unavailable.
        setStatus(
          'The recitation audio could not be streamed right now. Check your connection and try again — this app will not substitute a synthesised voice for Quran recitation.',
        )
        return
      }
      if (token !== runRef.current) return
      current = advanceQueue(current, surah.ayat.length, { repeat, loop, autoAdvance: true })
    }
    if (token === runRef.current) {
      setQueue(null)
      setStatus(loop ? '' : 'Finished. Choose a verse to play again.')
    }
  }

  function selectSurah(id: string) {
    stop()
    setSurahId(id)
  }

  const playingIndex = queue?.index ?? null

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
          Read from right to left, one verse at a time. Listen to the recitation, then read aloud
          yourself. The transliteration is a helper — try to look at the Arabic first.
        </p>
        <div className="chips">
          {SURAHS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`chip ${item.id === surah.id ? 'active' : ''}`}
              onClick={() => selectSurah(item.id)}
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

        <div className="recite-controls">
          <button
            type="button"
            className="btn primary"
            onClick={() => (playingIndex === null ? void playFrom(0) : stop())}
          >
            {playingIndex === null ? '▶ Play all verses' : '⏹ Stop'}
          </button>
          <div className="speed-toggle" role="group" aria-label="Repeat each verse">
            <span className="small muted">Repeat</span>
            {[1, 2, 3].map((value) => (
              <button
                key={value}
                type="button"
                className={`speed${repeat === value ? ' active' : ''}`}
                aria-pressed={repeat === value}
                onClick={() => setRepeat(clampRepeat(value))}
              >
                {value === 1 ? 'Once' : `${value}×`}
              </button>
            ))}
          </div>
          <label className="toggle">
            <input type="checkbox" checked={loop} onChange={(event) => setLoop(event.target.checked)} />
            <span>Loop surah</span>
          </label>
        </div>

        <p className="small muted" aria-live="polite">
          {playingIndex !== null
            ? `Playing verse ${surah.ayat[playingIndex]?.number ?? ''} — highlighted below.`
            : status}
        </p>
      </section>

      {surah.ayat.map((ayah, position) => {
        const isPlaying = playingIndex === position
        return (
          <section
            className={`card ayah${isPlaying ? ' ayah-playing' : ''}`}
            key={ayah.global}
            aria-current={isPlaying ? 'true' : undefined}
          >
            <div className="ayah-head">
              <span className="ayah-number">{ayah.number}</span>
              <button
                type="button"
                className={`btn small ${isPlaying ? 'primary' : 'ghost'}`}
                onClick={() => (isPlaying ? stop() : void playFrom(position))}
                aria-label={isPlaying ? `Stop verse ${ayah.number}` : `Play recitation of verse ${ayah.number}`}
              >
                {isPlaying ? '⏹ Stop' : '▶ Recitation'}
              </button>
            </div>
            <p className="arabic quran-text" lang="ar" dir="rtl">
              {ayah.arabic}
            </p>
            <p className="translit">{ayah.translit}</p>
            <p className="meaning">{ayah.meaning}</p>
            <p className="tip">💡 {ayah.tip}</p>
          </section>
        )
      })}

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
          Recitation: {reciter.name} · {reciter.provider}.
          {info?.configured
            ? ' Verse audio is served through the Quran Foundation Content API with the client credentials held on the server.'
            : ' Free and key-less: audio streams from the Islamic Network CDN. Add free Quran Foundation credentials in the server environment to switch to the official API.'}
        </p>
        {info?.note && <p className="small muted">{info.note}</p>}
        <p className="small muted">
          This app is a reading aid: for correct tajwīd, learn from a qualified teacher. Quran text is
          stored in the app; recitation is always real recorded audio, never synthesised.
        </p>
      </section>
    </div>
  )
}
