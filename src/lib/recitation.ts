/**
 * Queue maths for verse-by-verse recitation: repeat each verse N times, then
 * advance (optionally looping the whole surah). Kept pure so it can be tested
 * without audio hardware.
 */
export type QueueState = { index: number; repeatLeft: number }

export type PlaybackOptions = {
  /** How many times each verse is played, 1–5. */
  repeat: number
  loop: boolean
  autoAdvance: boolean
}

export const REPEAT_CHOICES = [1, 2, 3] as const

export function clampRepeat(repeat: number): number {
  if (!Number.isFinite(repeat)) return 1
  return Math.min(5, Math.max(1, Math.round(repeat)))
}

export function startQueue(index: number, repeat: number): QueueState {
  return { index: Math.max(0, Math.round(index)), repeatLeft: clampRepeat(repeat) }
}

/** What plays after the current verse ends — or null when playback stops. */
export function advanceQueue(
  state: QueueState,
  total: number,
  options: PlaybackOptions,
): QueueState | null {
  if (total <= 0) return null
  if (state.repeatLeft > 1) return { index: state.index, repeatLeft: state.repeatLeft - 1 }
  if (!options.autoAdvance) return null
  const next = state.index + 1
  if (next < total) return { index: next, repeatLeft: clampRepeat(options.repeat) }
  if (options.loop) return { index: 0, repeatLeft: clampRepeat(options.repeat) }
  return null
}

export function repeatLabel(repeat: number): string {
  const safe = clampRepeat(repeat)
  return safe === 1 ? 'Once' : `${safe}×`
}
