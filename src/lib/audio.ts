/**
 * Audio helpers built only on free, built-in browser features plus one free,
 * key-less Quran recitation CDN. No paid API, no account, no tracking.
 */
import { recitationUrl } from '../data/quran'

export { recitationUrl }

export function speechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

let currentUtterance: SpeechSynthesisUtterance | null = null

function pickArabicVoice(): SpeechSynthesisVoice | null {
  if (!speechSupported()) return null
  const voices = window.speechSynthesis.getVoices()
  return (
    voices.find((voice) => voice.lang?.toLowerCase().startsWith('ar')) ??
    voices.find((voice) => /arab/i.test(voice.name)) ??
    null
  )
}

/** Speak Arabic text with the device voice. Resolves when playback finishes. */
export function speak(text: string, rate = 0.75): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!speechSupported()) {
      reject(new Error('Speech is not available in this browser'))
      return
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'ar-SA'
    utterance.rate = rate
    utterance.pitch = 1
    const voice = pickArabicVoice()
    if (voice) utterance.voice = voice
    utterance.onend = () => {
      currentUtterance = null
      resolve()
    }
    utterance.onerror = () => {
      currentUtterance = null
      reject(new Error('The device voice could not read this text'))
    }
    currentUtterance = utterance
    window.speechSynthesis.speak(utterance)
  })
}

export function stopSpeaking(): void {
  if (!speechSupported()) return
  if (currentUtterance) {
    currentUtterance.onend = null
    currentUtterance.onerror = null
    currentUtterance = null
  }
  window.speechSynthesis.cancel()
}

let currentAudio: HTMLAudioElement | null = null

/** Stream one ayah of recitation. Rejects so callers can fall back to the device voice. */
export function playRecitation(globalAyah: number): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof Audio === 'undefined') {
      reject(new Error('Audio is not available'))
      return
    }
    stopRecitation()
    stopSpeaking()
    const audio = new Audio(recitationUrl(globalAyah))
    audio.preload = 'auto'
    audio.onended = () => {
      currentAudio = null
      resolve()
    }
    audio.onerror = () => {
      currentAudio = null
      reject(new Error('The recitation could not be streamed'))
    }
    currentAudio = audio
    void audio.play().catch(() => {
      currentAudio = null
      reject(new Error('Playback was blocked'))
    })
  })
}

export function stopRecitation(): void {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio = null
  }
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

/**
 * Record one attempt with the browser's speech recognition (free, on-device or
 * browser-provided). Resolves with the transcript; rejects with a readable reason.
 */
export function listenOnce(lang = 'ar-SA'): Promise<string> {
  return new Promise((resolve, reject) => {
    const Ctor = recognitionCtor()
    if (!Ctor) {
      reject(new Error('unsupported'))
      return
    }
    const recognition = new Ctor()
    recognition.lang = lang
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.continuous = false
    let settled = false
    const finish = (transcript: string) => {
      if (settled) return
      settled = true
      resolve(transcript)
    }
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? ''
      finish(transcript)
    }
    recognition.onerror = (event) => {
      if (settled) return
      settled = true
      reject(new Error(event?.error === 'not-allowed' ? 'permission' : 'no-speech'))
    }
    recognition.onend = () => {
      if (!settled) {
        settled = true
        reject(new Error('no-speech'))
      }
    }
    try {
      recognition.start()
    } catch {
      settled = true
      reject(new Error('no-speech'))
    }
  })
}

/** Warm up the voice list on iOS, where voices load asynchronously. */
export function primeVoices(): void {
  if (!speechSupported()) return
  window.speechSynthesis.getVoices()
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices()
  }
}
