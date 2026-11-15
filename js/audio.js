/**
 * ===================================================================
 *  PROCEDURAL ARCADE AUDIO ENGINE (Web Audio API)
 * ===================================================================
 *  Generates all fighting game sound effects dynamically in browser.
 *  Zero external MP3 dependencies - works 100% offline and instantly.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.bgmPlaying = false;
    this.bgmTimer = null;
    this.beatStep = 0;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted && this.bgmPlaying) {
      this.stopBGM();
    }
    return this.isMuted;
  }

  // --- SOUND EFFECTS ---

  playPunchLight() {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx.currentTime;
    
    // Quick white noise burst + frequency pitch drop
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.1);
    
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.1);
  }

  playPunchHeavy() {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.18);
    
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.2);
  }

  playKick() {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.16);

    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  playBlock() {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx.currentTime;

    // High metallic ping
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(750, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.12);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  playWhoosh() {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.linearRampToValueAtTime(280, now + 0.06);
    osc.frequency.linearRampToValueAtTime(90, now + 0.12);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  playJump() {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.15);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  playSuperCharge() {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx.currentTime;

    // Dramatic rising energy hum
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.7);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.75);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.75);
  }

  playSuperHit() {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx.currentTime;

    // Deep sub-bass boom + distortion
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(28, now + 0.6);

    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.65);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.65);
  }

  playKOBell() {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx.currentTime;

    // Triple arcade bell chime
    [0, 0.14, 0.28].forEach((delay) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now + delay);
      
      gain.gain.setValueAtTime(0.4, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + 0.5);
    });
  }

  // --- RETRO BACKGROUND BEAT (SYNTHESIS) ---
  startBGM() {
    if (this.isMuted || this.bgmPlaying) return;
    this.init();
    this.bgmPlaying = true;
    this.beatStep = 0;

    const bassNotes = [110, 110, 130, 110, 146, 130, 110, 98];
    const tempoMs = 150; // ~100 BPM 16th notes

    this.bgmTimer = setInterval(() => {
      if (!this.bgmPlaying || this.isMuted) return;
      const now = this.ctx.currentTime;
      const note = bassNotes[this.beatStep % bassNotes.length];

      // Bass note
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(note / 2, now);
      
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.13);

      // Hi-hat rhythm every alternate step
      if (this.beatStep % 2 === 0) {
        const hOsc = this.ctx.createOscillator();
        const hGain = this.ctx.createGain();
        hOsc.type = 'square';
        hOsc.frequency.setValueAtTime(1400, now);
        hGain.gain.setValueAtTime(0.03, now);
        hGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        hOsc.connect(hGain);
        hGain.connect(this.ctx.destination);
        hOsc.start(now);
        hOsc.stop(now + 0.04);
      }

      this.beatStep++;
    }, tempoMs);
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

window.soundEngine = new SoundEngine();
