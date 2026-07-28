/** Short three-note ascending chime for new paid orders (web only). */
export function playKitchenChime(): void {
  playToneSequence([880, 1108.73, 1318.51], { noteGap: 0.12, noteDuration: 0.5 })
}

/** Lower two-pulse tone for buffet refill requests — distinct from order chime. */
export function playBuffetRefillChime(): void {
  playToneSequence([440, 523.25, 440, 523.25], { noteGap: 0.18, noteDuration: 0.35 })
}

function playToneSequence(
  notes: number[],
  opts: { noteGap: number; noteDuration: number },
): void {
  if (typeof window === 'undefined') return

  try {
    const AudioContextCtor =
      window.AudioContext ??
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextCtor) return

    const ctx = new AudioContextCtor()
    const start = ctx.currentTime

    notes.forEach((frequency, index) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = frequency
      osc.connect(gain)
      gain.connect(ctx.destination)

      const noteStart = start + index * opts.noteGap
      gain.gain.setValueAtTime(0, noteStart)
      gain.gain.linearRampToValueAtTime(0.22, noteStart + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, noteStart + opts.noteDuration)
      osc.start(noteStart)
      osc.stop(noteStart + opts.noteDuration + 0.05)
    })

    window.setTimeout(() => {
      void ctx.close()
    }, notes.length * opts.noteGap * 1000 + 600)
  } catch {
    // Audio blocked until user gesture — chime is best-effort.
  }
}
