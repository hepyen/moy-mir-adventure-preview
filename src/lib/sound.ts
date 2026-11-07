/** Original short UI sounds; only called following user gestures. */
export type SoundEvent = 'tap' | 'submit' | 'approve' | 'reward' | 'reject' | 'fanfare'
let context: AudioContext | undefined
export function playSound(event: SoundEvent, enabled: boolean): void {
  if (!enabled || typeof window === 'undefined') return
  try {
    context ??= new AudioContext()
    if (context.state === 'suspended') void context.resume()
    const notes: Record<SoundEvent, [number, number][]> = {
      tap: [[520, 0]],
      submit: [[440, 0], [660, 0.105]],
      approve: [[523, 0], [659, 0.11], [784, 0.22]],
      reward: [[523, 0], [659, 0.09], [784, 0.18], [1047, 0.3]],
      fanfare: [[392,0],[523,0.13],[659,0.26],[784,0.39],[1047,0.54]],
      reject: [[350, 0], [290, 0.11]],
    }
    const start = context.currentTime + 0.015
    for (const [frequency, offset] of notes[event]) {
      const oscillator = context.createOscillator()
      const volume = context.createGain()
      oscillator.type = event === 'reject' ? 'triangle' : 'sine'
      oscillator.frequency.value = frequency
      const t = start + offset
      volume.gain.setValueAtTime(0.0001, t)
      volume.gain.exponentialRampToValueAtTime(0.075, t + 0.015)
      volume.gain.exponentialRampToValueAtTime(0.0001, t + 0.19)
      oscillator.connect(volume)
      volume.connect(context.destination)
      oscillator.start(t)
      oscillator.stop(t + 0.2)
    }
  } catch { /* Unsupported audio environments should never break the app. */ }
}
