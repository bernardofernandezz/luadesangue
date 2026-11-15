// Synthesized with WebAudio, no files. iOS only lets audio start from a user gesture, so the context is created on the first touch.
let ctx: AudioContext | null = null
let enabled = false
let ambience: { stop: () => void } | null = null

if (typeof window !== 'undefined')
  window.addEventListener('pointerdown', () => { ctx ??= new AudioContext(); if (ctx.state === 'suspended') ctx.resume() }, { capture: true })

export function setSoundEnabled(on: boolean) {
  enabled = on
  if (!on) setAmbience(false)
}

function out(volume: number) {
  if (!enabled || !ctx) return null
  const g = ctx.createGain()
  g.gain.value = volume
  g.connect(ctx.destination)
  return { c: ctx, g, t: ctx.currentTime }
}

function tone(type: OscillatorType, freq: number, from: number, dur: number, volume: number, glideTo?: number) {
  const o = out(0)
  if (!o) return
  const osc = o.c.createOscillator()
  osc.type = type
  osc.frequency.setValueAtTime(freq, o.t + from)
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, o.t + from + dur)
  o.g.gain.setValueAtTime(0, o.t + from)
  o.g.gain.linearRampToValueAtTime(volume, o.t + from + Math.min(0.05, dur / 4))
  o.g.gain.exponentialRampToValueAtTime(0.0001, o.t + from + dur)
  osc.connect(o.g)
  osc.start(o.t + from)
  osc.stop(o.t + from + dur + 0.05)
}

/** Nightfall: a rising-then-falling howl through a soft filter. */
export function howl() {
  const o = out(0)
  if (!o) return
  const osc = o.c.createOscillator()
  const lp = o.c.createBiquadFilter()
  osc.type = 'sawtooth'
  lp.type = 'lowpass'
  lp.frequency.value = 900
  osc.frequency.setValueAtTime(320, o.t)
  osc.frequency.exponentialRampToValueAtTime(620, o.t + 0.6)
  osc.frequency.exponentialRampToValueAtTime(380, o.t + 2)
  o.g.gain.setValueAtTime(0, o.t)
  o.g.gain.linearRampToValueAtTime(0.08, o.t + 0.4)
  o.g.gain.exponentialRampToValueAtTime(0.0001, o.t + 2.2)
  osc.connect(lp).connect(o.g)
  osc.start(o.t)
  osc.stop(o.t + 2.3)
}

/** Dawn: two bell partials. */
export function bell() {
  tone('sine', 880, 0, 2.2, 0.12)
  tone('sine', 1320, 0, 1.4, 0.05)
  tone('sine', 660, 0.35, 2, 0.08)
}

/** A death: low thud. */
export const thud = () => tone('sine', 110, 0, 0.9, 0.35, 45)

/** Last seconds of a timer. */
export const tick = () => tone('square', 1200, 0, 0.06, 0.04)

/** End of the game: rising major chord. */
export function fanfare() {
  ;[523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone('triangle', f, i * 0.12, 1.4 - i * 0.1, 0.1))
}

/** Very quiet filtered noise, like wind at night. */
export function setAmbience(on: boolean) {
  if (!on) { ambience?.stop(); ambience = null; return }
  if (ambience) return
  const o = out(0)
  if (!o) return
  const buf = o.c.createBuffer(1, o.c.sampleRate * 2, o.c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  const src = o.c.createBufferSource()
  const bp = o.c.createBiquadFilter()
  src.buffer = buf
  src.loop = true
  bp.type = 'bandpass'
  bp.frequency.value = 400
  bp.Q.value = 0.7
  o.g.gain.linearRampToValueAtTime(0.025, o.t + 2)
  src.connect(bp).connect(o.g)
  src.start()
  ambience = {
    stop: () => {
      const t = o.c.currentTime
      o.g.gain.cancelScheduledValues(t)
      o.g.gain.setValueAtTime(o.g.gain.value, t)
      o.g.gain.linearRampToValueAtTime(0, t + 1)
      src.stop(t + 1.1)
    },
  }
}
