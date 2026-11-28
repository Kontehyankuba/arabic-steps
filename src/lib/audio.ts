/**
 * Audio helpers built only on free, built-in browser features plus one free,
 * key-less Quran recitation CDN. No paid API, no account, no tracking.
 *
 * Speech synthesis is delegated to the shared engine in ./tts so every screen
 * shares one voice, one speed setting and one playback state.
 */
import { recitationUrl } from '../data/quran'
import { isSpeechSupported, speakOnce, stopAllSpeech, type SpeechSpeed } from './tts'

export { recitationUrl }

export function speechSupported(): boolean {
  return isSpeechSupported()
}

/**
 * Read Arabic text with the device voice. Resolves when playback finishes (or
 * fails) so callers never hang.
 */
export function speak(text: string, speed: SpeechSpeed = 'normal'): Promise<void> {
  if (!isSpeechSupported()) return Promise.reject(new Error('Speech is not available in this browser'))
  return speakOnce(text, { speed })
}

export function stopSpeaking(): void {
  stopAllSpeech()
}

let currentAudio: HTMLAudioElement | null = null
let settleCurrent: (() => void) | null = null

/**
 * Stream one audio file (a real recitation). Rejects so the caller can tell the
 * learner honestly that the recitation could not be played.
 */
export function playAudioUrl(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof Audio === 'undefined') {
      reject(new Error('Audio is not available'))
      return
    }
    stopRecitation()
    stopAllSpeech()
    const audio = new Audio(url)
    audio.preload = 'auto'
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      currentAudio = null
      settleCurrent = null
      resolve()
    }
    audio.onended = finish
    audio.onerror = () => {
      if (settled) return
      settled = true
      currentAudio = null
      settleCurrent = null
      reject(new Error('The recitation could not be streamed'))
    }
    currentAudio = audio
    settleCurrent = finish
    void audio.play().catch(() => {
      if (settled) return
      settled = true
      currentAudio = null
      settleCurrent = null
      reject(new Error('Playback was blocked — tap play again'))
    })
  })
}

/** Stream one ayah from the free Alafasy CDN. */
export function playRecitation(globalAyah: number): Promise<void> {
  return playAudioUrl(recitationUrl(globalAyah))
}

export function stopRecitation(): void {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.onended = null
    currentAudio.onerror = null
    currentAudio = null
  }
  const settle = settleCurrent
  settleCurrent = null
  settle?.()
}

type RecognitionLike = {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  continuous: boolean
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: ((event: { error?: string }) => void) | null
  onend: (() => void) | null
}

type RecognitionCtor = new () => RecognitionLike

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const scope = window as unknown as {
    SpeechRecognition?: RecognitionCtor
    webkitSpeechRecognition?: RecognitionCtor
  }
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null
}

export function listeningSupported(): boolean {
  return recognitionCtor() !== null
}

let activeRecognition: RecognitionLike | null = null

/** Abort an in-flight attempt (used by Stop / Retry and on unmount). */
export function stopListening(): void {
  const recognition = activeRecognition
  activeRecognition = null
  if (!recognition) return
  try {
    recognition.abort()
  } catch {
    /* already stopped */
  }
}

export type ListenFailure = 'unsupported' | 'permission' | 'no-speech' | 'cancelled'

/**
 * Record one attempt with the browser's own speech recognition (free: Chrome,
 * Edge and Safari provide it; nothing is sent to a paid service).
 * Resolves with the transcript, rejects with a readable reason.
 */
export function listenOnce(lang = 'ar-SA'): Promise<string> {
  return new Promise((resolve, reject) => {
    const Ctor = recognitionCtor()
    if (!Ctor) {
      reject(new Error('unsupported'))
      return
    }
    stopListening()
    const recognition = new Ctor()
    activeRecognition = recognition
    recognition.lang = lang
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.continuous = false
    let settled = false
    const cleanup = () => {
      if (activeRecognition === recognition) activeRecognition = null
    }
    const finish = (transcript: string) => {
      if (settled) return
      settled = true
      cleanup()
      resolve(transcript)
    }
    const fail = (reason: ListenFailure) => {
      if (settled) return
      settled = true
      cleanup()
      reject(new Error(reason))
    }
    recognition.onresult = (event) => {
      finish(event.results?.[0]?.[0]?.transcript ?? '')
    }
    recognition.onerror = (event) => {
      const code = event?.error
      if (code === 'not-allowed' || code === 'service-not-allowed') fail('permission')
      else if (code === 'aborted') fail('cancelled')
      else fail('no-speech')
    }
    recognition.onend = () => {
      fail('no-speech')
    }
    try {
      recognition.start()
    } catch {
      fail('no-speech')
    }
  })
}

/** Warm up the voice list on iOS, where voices load asynchronously. */
export function primeVoices(): void {
  if (!isSpeechSupported()) return
  window.speechSynthesis.getVoices()
}
