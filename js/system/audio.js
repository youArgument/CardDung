export class AudioSystem {
  constructor() {
    this.ctx = null;
    this.volume = 0.8;
  }

  init() {
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch { this.enabled = false; }
  }

  playTone(freq, duration, type = 'square', vol = 0.1) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = vol * this.volume;
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playReveal() { this.playTone(600, 0.08, 'sine', 0.08); }
  playAttack() { this.playTone(200, 0.12, 'sawtooth', 0.1); }
  playHit() { this.playTone(150, 0.15, 'square', 0.12); }
  playVictory() {
    this.playTone(523, 0.12, 'square', 0.08);
    setTimeout(() => this.playTone(659, 0.12, 'square', 0.08), 120);
    setTimeout(() => this.playTone(784, 0.25, 'square', 0.08), 240);
  }
  playDefeat() {
    this.playTone(300, 0.25, 'sawtooth', 0.08);
    setTimeout(() => this.playTone(200, 0.4, 'sawtooth', 0.08), 250);
  }
  playSelect() { this.playTone(800, 0.06, 'sine', 0.06); }
}
