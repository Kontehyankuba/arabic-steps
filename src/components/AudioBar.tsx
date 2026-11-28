import { useEffect, useRef } from 'react'
import { useArabicSpeech } from '../lib/tts'
import { useProgress } from '../lib/useProgress'

type Props = {
  /** Arabic text to read aloud. */
  text: string
  /** Stable id used to record a completed audio exercise. */
  exerciseId: string
  /** Human label, used in button names for screen readers. */
  label?: string
  compact?: boolean
  showVoiceNote?: boolean
}

/**
 * Play / Pause / Repeat plus slow–normal speed for any Arabic text.
 * Free: it uses the browser's built-in speechSynthesis, nothing is uploaded.
 */
export default function AudioBar({
  text,
  exerciseId,
  label = 'Arabic audio',
  compact = false,
  showVoiceNote = true,
}: Props) {
  const speech = useArabicSpeech()
  const { addAudioExercise } = useProgress()
  const counted = useRef(false)

  useEffect(() => {
    counted.current = false
  }, [text])

  const playing = speech.status === 'speaking'
  const paused = speech.status === 'paused'

  function primary() {
    if (playing) {
      speech.pause()
      return
    }
    if (paused) {
      speech.resume()
      return
    }
    speech.play(text, {
      onEnd: () => {
        if (counted.current) return
        counted.current = true
        addAudioExercise(exerciseId)
      },
    })
  }

  return (
    <div className={`audio-bar${compact ? ' compact' : ''}`} role="group" aria-label={`Audio controls for ${label}`}>
      <div className="audio-row">
        <button
          type="button"
          className="btn primary audio-main"
          onClick={primary}
          aria-label={playing ? `Pause ${label}` : paused ? `Resume ${label}` : `Play ${label}`}
        >
          {playing ? '⏸ Pause' : paused ? '▶ Resume' : '▶ Play'}
        </button>
        <button
          type="button"
          className="btn ghost"
          onClick={() => speech.repeat(text)}
          aria-label={`Repeat ${label}`}
        >
          ↻ Repeat
        </button>
        <div className="speed-toggle" role="group" aria-label="Playback speed">
          <button
            type="button"
            className={`speed${speech.speed === 'slow' ? ' active' : ''}`}
            aria-pressed={speech.speed === 'slow'}
            onClick={() => speech.setSpeed('slow')}
          >
            Slow
          </button>
          <button
            type="button"
            className={`speed${speech.speed === 'normal' ? ' active' : ''}`}
            aria-pressed={speech.speed === 'normal'}
            onClick={() => speech.setSpeed('normal')}
          >
            Normal
          </button>
        </div>
      </div>
      {playing && (
        <p className="audio-status" aria-live="polite">
          Playing {label}…
        </p>
      )}
      {showVoiceNote && speech.notice && <p className="voice-note">{speech.notice}</p>}
    </div>
  )
}
