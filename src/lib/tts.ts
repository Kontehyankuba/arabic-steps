/**
 * Arabic text-to-speech on top of the browser's free Web Speech API
 * (`window.speechSynthesis`). Nothing is uploaded and no key or account is
 * needed: the voice runs on the device.
 *
 * One shared engine is used for the whole app so two buttons can never talk at
 * the same time, and so Play/Pause/Repeat/speed work the same everywhere.
 */
import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react'

export type SpeechSpeed = 'slow' | 'normal'
export type SpeechStatus = 'idle' | 'speaking' | 'paused'

/** Learners need slower than the default; 0.85 still sounds natural. */
export const SPEECH_RATES: Record<SpeechSpeed, number> = { slow: 0.55, normal: 0.85 }

export const ARABIC_LANG = 'ar-SA'

export type VoiceLike = { name: string; lang: string }

export function normalizeLang(lang: string): string {
  return (lang || '').replace(/_/g, '-').toLowerCase()
}

/**
 * Prefer a Saudi Arabic voice (ar-SA), then any Arabic voice, then anything
 * whose name looks Arabic. Returns null when the device has no Arabic voice.
 */
export function pickArabicVoice<T extends VoiceLike>(voices: readonly T[] | null | undefined): T | null {
  if (!voices || voices.length === 0) return null
  const arabic = voices.filter((voice) => normalizeLang(voice.lang).startsWith('ar'))
  const saudi = arabic.find((voice) => normalizeLang(voice.lang) === normalizeLang(ARABIC_LANG))
  if (saudi) return saudi
  if (arabic.length > 0) return arabic[0]
  return voices.find((voice) => /arab|عرب/i.test(voice.name)) ?? null
}

export function rateFor(speed: SpeechSpeed): number {
  return SPEECH_RATES[speed] ?? SPEECH_RATES.normal
}

export function nextSpeed(speed: SpeechSpeed): SpeechSpeed {
  return speed === 'slow' ? 'normal' : 'slow'
}

export function noVoiceNotice(): string {
  return (
    'No Arabic voice is installed on this device, so your default device voice will read the Arabic ' +
    'and may sound approximate. To add one: iPhone → Settings › Accessibility › Spoken Content › ' +
    'Voices › Arabic; Android → Settings › Text-to-speech › install Arabic; Chrome on desktop ' +
    'usually includes a Google العربية voice.'
  )
}

export function unsupportedNotice(): string {
  return 'This browser cannot read text aloud. On iPhone use Safari; on desktop use Chrome, Edge or Safari.'
}

export type SpeechSnapshot = {
  supported: boolean
  status: SpeechStatus
  speed: SpeechSpeed
  /** Name of the Arabic voice in use, or null when the device has none. */
  arabicVoice: string | null
  voicesLoaded: boolean
  /** The text currently (or last) being spoken — Repeat reuses it. */
  text: string
  /** Why nothing is playing / why the voice is not ideal. */
  notice: string
}

const INITIAL: SpeechSnapshot = {
  supported: false,
  status: 'idle',
  speed: 'normal',
  arabicVoice: null,
  voicesLoaded: false,
  text: '',
  notice: '',
}

type PlayOptions = { speed?: SpeechSpeed; onEnd?: () => void }

class ArabicSpeaker {
  private snapshot: SpeechSnapshot = INITIAL
  private listeners = new Set<() => void>()
  private utterance: SpeechSynthesisUtterance | null = null
  private onDone: (() => void) | null = null
  private attached = false
  private pollTimer: ReturnType<typeof setInterval> | null = null

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getSnapshot = (): SpeechSnapshot => this.snapshot

  private set(patch: Partial<SpeechSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...patch }
    for (const listener of this.listeners) listener()
  }

  private synth(): SpeechSynthesis | null {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null
    return window.speechSynthesis
  }

  private refresh(): void {
    const synth = this.synth()
    if (!synth) {
      this.set({ supported: false, voicesLoaded: false, arabicVoice: null })
      return
    }
    const voices = synth.getVoices()
    const voice = pickArabicVoice(voices)
    this.set({
      supported: true,
      voicesLoaded: voices.length > 0,
      arabicVoice: voice?.name ?? null,
    })
  }

  /** iOS and some Android browsers fill the voice list late. */
  attach(): void {
    if (this.attached) return
    this.attached = true
    const synth = this.synth()
    if (!synth) {
      this.set({ supported: false, notice: unsupportedNotice() })
      return
    }
    this.set({ supported: true })
    this.refresh()
    const onChange = () => this.refresh()
    if (typeof synth.addEventListener === 'function') {
      synth.addEventListener('voiceschanged', onChange)
    } else {
      synth.onvoiceschanged = onChange
    }
    let tries = 0
    this.pollTimer = setInterval(() => {
      tries += 1
      this.refresh()
      if (tries >= 8 && this.pollTimer) {
        clearInterval(this.pollTimer)
        this.pollTimer = null
      }
    }, 400)
  }

  private clearUtterance(): void {
    if (!this.utterance) return
    this.utterance.onend = null
    this.utterance.onerror = null
    this.utterance = null
  }

  private cancel(): void {
    const synth = this.synth()
    this.clearUtterance()
    this.onDone = null
    if (synth) {
      synth.cancel()
      // Chrome can stay stuck in a paused state after cancel().
      if (synth.paused) synth.resume()
    }
  }

  play(text: string, options: PlayOptions = {}): void {
    const synth = this.synth()
    const value = (text || '').trim()
    if (!synth) {
      this.set({ supported: false, status: 'idle', notice: unsupportedNotice() })
      return
    }
    if (!value) return

    this.cancel()
    const speed = options.speed ?? this.snapshot.speed
    const utterance = new SpeechSynthesisUtterance(value)
    utterance.lang = ARABIC_LANG
    utterance.rate = rateFor(speed)
    utterance.pitch = 1
    const voice = pickArabicVoice(synth.getVoices())
    if (voice) utterance.voice = voice

    utterance.onend = () => {
      if (this.utterance !== utterance) return
      this.utterance = null
      const done = this.onDone
      this.onDone = null
      this.set({ status: 'idle', text: value })
      done?.()
    }
    utterance.onerror = () => {
      if (this.utterance !== utterance) return
      this.utterance = null
      this.onDone = null
      this.set({
        status: 'idle',
        text: value,
        notice: 'The device voice could not read this text. Try the other speed, or another browser.',
      })
    }

    this.utterance = utterance
    this.onDone = options.onEnd ?? null
    this.set({ status: 'speaking', text: value, speed, notice: '' })
    synth.speak(utterance)
  }

  pause(): void {
    const synth = this.synth()
    if (!synth || this.snapshot.status !== 'speaking') return
    synth.pause()
    this.set({ status: 'paused' })
  }

  resume(): void {
    const synth = this.synth()
    if (!synth || this.snapshot.status !== 'paused') return
    if (synth.paused) {
      synth.resume()
      this.set({ status: 'speaking' })
      return
    }
    // This browser does not really support pause: restart the same line.
    const done = this.onDone
    this.play(this.snapshot.text, { onEnd: done ?? undefined })
  }

  toggle(text: string, options: PlayOptions = {}): void {
    if (this.snapshot.status === 'speaking') this.pause()
    else if (this.snapshot.status === 'paused') this.resume()
    else this.play(text, options)
  }

  repeat(text?: string): void {
    const value = (text ?? this.snapshot.text).trim()
    if (!value) return
    const done = this.onDone
    this.play(value, { onEnd: done ?? undefined })
  }

  stop(): void {
    this.cancel()
    if (this.snapshot.status !== 'idle') this.set({ status: 'idle' })
  }

  setSpeed(speed: SpeechSpeed): void {
    if (speed === this.snapshot.speed) return
    if (this.snapshot.status === 'speaking') {
      const done = this.onDone
      this.play(this.snapshot.text, { speed, onEnd: done ?? undefined })
      return
    }
    this.set({ speed })
  }

  /** Stop audio when the page is hidden — iOS keeps speaking otherwise. */
  handleVisibility(): void {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') this.stop()
  }
}

const speaker = new ArabicSpeaker()

export type ArabicSpeech = SpeechSnapshot & {
  /** Helpful message when speech is unsupported or no Arabic voice exists. */
  notice: string
  play: (text: string, options?: PlayOptions) => void
  pause: () => void
  resume: () => void
  toggle: (text: string, options?: PlayOptions) => void
  repeat: (text?: string) => void
  stop: () => void
  setSpeed: (speed: SpeechSpeed) => void
}

export function useArabicSpeech(): ArabicSpeech {
  const snapshot = useSyncExternalStore(speaker.subscribe, speaker.getSnapshot, speaker.getSnapshot)

  useEffect(() => {
    speaker.attach()
    const onVisibility = () => speaker.handleVisibility()
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVisibility)
    return () => {
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  const play = useCallback((text: string, options?: PlayOptions) => speaker.play(text, options), [])
  const pause = useCallback(() => speaker.pause(), [])
  const resume = useCallback(() => speaker.resume(), [])
  const toggle = useCallback((text: string, options?: PlayOptions) => speaker.toggle(text, options), [])
  const repeat = useCallback((text?: string) => speaker.repeat(text), [])
  const stop = useCallback(() => speaker.stop(), [])
  const setSpeed = useCallback((speed: SpeechSpeed) => speaker.setSpeed(speed), [])

  const notice = useMemo(() => {
    if (!snapshot.supported) return unsupportedNotice()
    if (!snapshot.arabicVoice) return noVoiceNotice()
    return ''
  }, [snapshot.supported, snapshot.arabicVoice])

  return {
    ...snapshot,
    notice,
    play,
    pause,
    resume,
    toggle,
    repeat,
    stop,
    setSpeed,
  }
}

/** Non-hook access for one-off callers (e.g. stopping audio on tab change). */
export function stopAllSpeech(): void {
  speaker.stop()
}

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}
