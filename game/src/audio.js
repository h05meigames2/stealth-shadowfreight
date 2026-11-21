// SHADOW FREIGHT — audio.js
// One job: every sound in the game, synthesized with WebAudio.
// No audio files, no network — oscillators and filtered noise only.

export class SoundBank {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.ambientNodes = null;
  }

  // Must be called from a user gesture at least once; browsers block
  // audio before that. Safe to call repeatedly — it builds once.
  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.5;
    this.master.connect(this.ctx.destination);
    this.startAmbient();
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : 0.5;
  }

  // A low, slow night-yard drone: two detuned sines through a low-pass.
  startAmbient() {
    const ctx = this.ctx;
    const gain = ctx.createGain();
    gain.gain.value = 0.05;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 220;
    const o1 = ctx.createOscillator();
    o1.type = 'sine';
    o1.frequency.value = 55;
    const o2 = ctx.createOscillator();
    o2.type = 'sine';
    o2.frequency.value = 55.7;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.02;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    o1.connect(filter);
    o2.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    o1.start();
    o2.start();
    lfo.start();
    this.ambientNodes = { o1, o2, lfo, gain };
  }

  tone(freq, dur, type, vol, slideTo) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  noiseBurst(dur, vol, freq) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.value = vol;
    src.connect(filter);
    filter.connect(g);
    g.connect(this.master);
    src.start();
  }

  footstep(running) {
    this.noiseBurst(0.06, running ? 0.16 : 0.07, running ? 700 : 420);
  }

  chimeToss() {
    this.tone(880, 0.12, 'sine', 0.14, 660);
  }

  chimeRing() {
    this.tone(1320, 0.5, 'sine', 0.2, 1180);
    this.tone(1760, 0.4, 'sine', 0.1, 1760);
  }

  pickup() {
    this.tone(660, 0.09, 'triangle', 0.22, 660);
    setTimeout(() => this.tone(990, 0.14, 'triangle', 0.22, 990), 70);
  }

  suspicious() {
    this.tone(440, 0.18, 'square', 0.08, 520);
  }

  alert() {
    this.tone(220, 0.25, 'sawtooth', 0.18, 440);
    setTimeout(() => this.tone(330, 0.3, 'sawtooth', 0.16, 660), 120);
  }

  caught() {
    this.tone(180, 0.5, 'sawtooth', 0.2, 60);
    this.noiseBurst(0.3, 0.15, 300);
  }

  levelClear() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => setTimeout(() => this.tone(f, 0.22, 'triangle', 0.2, f), i * 110));
  }

  win() {
    const notes = [523, 659, 784, 1047, 1319];
    notes.forEach((f, i) => setTimeout(() => this.tone(f, 0.3, 'triangle', 0.2, f), i * 130));
  }

  click() {
    this.tone(700, 0.05, 'square', 0.1, 700);
  }
}
