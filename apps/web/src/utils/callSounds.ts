/**
 * Synthetic call sound effects via Web Audio API.
 * No audio files needed — tones are generated programmatically.
 */

function playTones(freqs: number[], gap = 0.13, vol = 0.25) {
  try {
    const Ctx = window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    freqs.forEach((freq, i) => {
      const t = ctx.currentTime + i * gap
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      osc.connect(gain)
      gain.connect(ctx.destination)
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(vol, t + 0.012)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2)
      osc.start(t)
      osc.stop(t + 0.21)
    })
    setTimeout(() => ctx.close().catch(() => {}), (freqs.length * gap + 0.4) * 1000)
  } catch { /* AudioContext unavailable */ }
}

/** Ascending chime — call connected / you joined */
export const playJoinSound        = () => playTones([660, 880], 0.13, 0.28)
/** Descending chime — call ended / you left */
export const playLeaveSound       = () => playTones([880, 660], 0.13, 0.24)
/** Soft ascending — another participant joined */
export const playMemberJoinSound  = () => playTones([660, 880], 0.13, 0.15)
/** Soft descending — another participant left */
export const playMemberLeaveSound = () => playTones([880, 660], 0.13, 0.13)
