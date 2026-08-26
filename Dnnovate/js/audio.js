/**
 * SHIFT: COSMIC RUN - Procedural Web Audio API Engine
 * Generates dynamic synthwave music and futuristic sci-fi sound effects completely procedurally.
 */
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.masterVolume = 0.8;
    this.musicVolume = 0.6;
    this.sfxVolume = 0.9;
    
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.dimensionFilter = null; // Dynamically changes between Void and Rift
    
    this.isPlayingMusic = false;
    this.currentDimension = 'void'; // 'void' or 'rift'
    this.tempo = 132;
    this.step = 0;
    this.musicTimer = null;
    this.warpSpeedMultiplier = 1.0;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master Chain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Dimension Filter (Music Route)
      this.dimensionFilter = this.ctx.createBiquadFilter();
      this.dimensionFilter.type = 'lowpass';
      this.dimensionFilter.frequency.setValueAtTime(18000, this.ctx.currentTime);
      this.dimensionFilter.Q.setValueAtTime(2.0, this.ctx.currentTime);
      this.dimensionFilter.connect(this.masterGain);

      // Music Gain
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
      this.musicGain.connect(this.dimensionFilter);

      // SFX Gain
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Engine Rumble Node
      this.initEngineSound();
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setDimension(dim) {
    this.currentDimension = dim;
    if (!this.dimensionFilter || !this.ctx) return;
    const now = this.ctx.currentTime;
    if (dim === 'rift') {
      // Singularity Rift: Resonant, muffled, mysterious sub-space vibe
      this.dimensionFilter.frequency.cancelScheduledValues(now);
      this.dimensionFilter.frequency.setTargetAtTime(1200, now, 0.15);
      this.dimensionFilter.Q.setTargetAtTime(5.0, now, 0.15);
    } else {
      // Deep Void: Bright, crisp, full-spectrum neon sci-fi
      this.dimensionFilter.frequency.cancelScheduledValues(now);
      this.dimensionFilter.frequency.setTargetAtTime(18000, now, 0.15);
      this.dimensionFilter.Q.setTargetAtTime(1.5, now, 0.15);
    }
  }

  initEngineSound() {
    // Ambient starfighter thruster drone
    if (!this.ctx) return;
    try {
      this.engineOsc = this.ctx.createOscillator();
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.setValueAtTime(55, this.ctx.currentTime); // Low A

      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(180, this.ctx.currentTime);

      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

      this.engineOsc.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.sfxGain);
      this.engineOsc.start();
    } catch (e) {}
  }

  updateEngine(thrustPercent, speedRatio) {
    if (!this.engineOsc || !this.ctx) return;
    const now = this.ctx.currentTime;
    const targetFreq = 50 + (thrustPercent * 70) + (speedRatio * 50);
    const targetVol = 0.03 + (thrustPercent * 0.08);
    this.engineOsc.frequency.setTargetAtTime(targetFreq, now, 0.05);
    this.engineGain.gain.setTargetAtTime(targetVol, now, 0.05);
  }

  // --- Dynamic Procedural Synthwave Music Engine ---
  startMusic() {
    this.init();
    this.resume();
    if (this.isPlayingMusic) return;
    this.isPlayingMusic = true;
    this.step = 0;
    this.scheduleNextBeat();
  }

  stopMusic() {
    this.isPlayingMusic = false;
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  scheduleNextBeat() {
    if (!this.isPlayingMusic || !this.ctx) return;

    const secondsPerBeat = 60.0 / (this.tempo * this.warpSpeedMultiplier);
    const stepDuration = secondsPerBeat / 4; // 16th note steps
    const time = this.ctx.currentTime + 0.05;

    this.playMusicStep(this.step, time, stepDuration);
    this.step = (this.step + 1) % 64;

    this.musicTimer = setTimeout(() => {
      this.scheduleNextBeat();
    }, stepDuration * 1000 * 0.95);
  }

  playMusicStep(step, time, duration) {
    // Chord Progression: Dm -> Bb -> C -> Am (8 beats / 32 steps each cycle)
    const chords = [
      { bass: 73.42, chord: [220, 261.63, 329.63] }, // Dm (D2, A3, C4, E4)
      { bass: 58.27, chord: [233.08, 293.66, 349.23] }, // Bb (Bb1, Bb3, D4, F4)
      { bass: 65.41, chord: [261.63, 329.63, 392.00] }, // C (C2, C4, E4, G4)
      { bass: 55.00, chord: [220.00, 261.63, 329.63] }  // Am (A1, A3, C4, E4)
    ];

    const chordIndex = Math.floor((step % 32) / 8);
    const currentChord = chords[chordIndex];

    // 1. Synthwave Driving Kick (on beats 0, 4, 8, 12 in each 16-step bar)
    if (step % 4 === 0) {
      this.synthKick(time);
    }

    // 2. Snare / Clap (on beats 4, 12 in each 16-step bar)
    if (step % 8 === 4) {
      this.synthSnare(time);
    }

    // 3. Hi-Hat (16th notes with accent on offbeats)
    this.synthHiHat(time, step % 2 === 1 ? 0.08 : 0.03);

    // 4. Rolling Synthwave Bassline (Pulsing 16th notes with octave jumps)
    const isOctave = step % 4 === 2 || step % 4 === 3;
    const bassFreq = isOctave ? currentChord.bass * 2 : currentChord.bass;
    this.synthBass(time, bassFreq, duration * 0.9);

    // 5. Arpeggiated Cyber Lead Melodies
    const arpHook = [0, 2, 1, 2, 0, 1, 2, 1];
    const noteIdx = arpHook[step % 8];
    const leadFreq = currentChord.chord[noteIdx] * (this.currentDimension === 'rift' ? 1.5 : 2.0);
    if (step % 2 === 0) {
      this.synthLead(time, leadFreq, duration * 0.7);
    }
  }

  synthKick(time) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(35, time + 0.12);

    gain.gain.setValueAtTime(0.7, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.15);
  }

  synthSnare(time) {
    if (!this.ctx) return;
    // Noise buffer
    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(900, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    noise.start(time);
    noise.stop(time + 0.13);
  }

  synthHiHat(time, volume = 0.05) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(8500, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.05);
  }

  synthBass(time, freq, dur) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, time);
    filter.frequency.exponentialRampToValueAtTime(200, time + dur);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + dur + 0.02);
  }

  synthLead(time, freq, dur) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + dur + 0.02);
  }

  // --- Sound Effects (SFX) ---
  playLaser(isSpecial = false) {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const time = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = isSpecial ? 'square' : 'sawtooth';

    const startFreq = isSpecial ? 1200 : 880;
    const endFreq = isSpecial ? 200 : 150;

    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(endFreq, time + 0.09);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(time);
    osc.stop(time + 0.11);
  }

  playShift(toRift) {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const time = this.ctx.currentTime;

    // Sub-bass Drop
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(toRift ? 280 : 120, time);
    osc.frequency.exponentialRampToValueAtTime(toRift ? 40 : 320, time + 0.35);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.6, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.38);

    // Filtered noise swoosh
    const bufferSize = this.ctx.sampleRate * 0.35;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(toRift ? 3000 : 400, time);
    filter.frequency.exponentialRampToValueAtTime(toRift ? 500 : 2800, time + 0.35);
    filter.Q.setValueAtTime(4.0, time);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    osc.start(time);
    noise.start(time);
    osc.stop(time + 0.4);
    noise.stop(time + 0.4);
  }

  playExplosion(isBoss = false) {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const time = this.ctx.currentTime;
    const duration = isBoss ? 0.9 : 0.45;

    // Noise rumble
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, time);
    filter.frequency.exponentialRampToValueAtTime(60, time + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(isBoss ? 0.7 : 0.45, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    // Punch sub-oscillator
    const sub = this.ctx.createOscillator();
    sub.type = 'triangle';
    sub.frequency.setValueAtTime(110, time);
    sub.frequency.exponentialRampToValueAtTime(25, time + 0.25);

    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.5, time);
    subGain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    sub.connect(subGain);
    subGain.connect(this.sfxGain);

    noise.start(time);
    sub.start(time);
    noise.stop(time + duration + 0.05);
    sub.stop(time + 0.3);
  }

  playShieldDeflect() {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const time = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(950, time);
    osc.frequency.exponentialRampToValueAtTime(1400, time + 0.12);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(time);
    osc.stop(time + 0.16);
  }

  playPickup(type = 'shard') {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const time = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';

    const f1 = type === 'shield' ? 523.25 : (type === 'emp' ? 392.00 : 659.25);
    const f2 = type === 'shield' ? 1046.50 : (type === 'emp' ? 783.99 : 1318.51);

    osc.frequency.setValueAtTime(f1, time);
    osc.frequency.exponentialRampToValueAtTime(f2, time + 0.08);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(time);
    osc.stop(time + 0.13);
  }

  playEmp() {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const time = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(2400, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.5);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3000, time);
    filter.frequency.exponentialRampToValueAtTime(150, time + 0.5);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.55);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(time);
    osc.stop(time + 0.6);
  }

  playUIClick() {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const time = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1800, time);
    osc.frequency.exponentialRampToValueAtTime(800, time + 0.03);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.15, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(time);
    osc.stop(time + 0.05);
  }

  playWarning() {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const time = this.ctx.currentTime;

    for (let i = 0; i < 2; i++) {
      const osc = this.ctx.createOscillator();
      osc.type = 'square';
      const offset = i * 0.12;
      osc.frequency.setValueAtTime(740, time + offset);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.25, time + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, time + offset + 0.08);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(time + offset);
      osc.stop(time + offset + 0.09);
    }
  }

  playGameOver() {
    if (!this.ctx || this.isMuted) return;
    this.stopMusic();
    const time = this.ctx.currentTime;
    const notes = [440, 392, 349.23, 293.66, 220]; // A4 -> D3
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      const t = time + idx * 0.16;
      osc.frequency.setValueAtTime(freq, t);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.35);
    });
  }

  playVictory() {
    if (!this.ctx || this.isMuted) return;
    this.stopMusic();
    const time = this.ctx.currentTime;
    const notes = [293.66, 369.99, 440, 587.33, 739.99, 880]; // D Major cyber fanfare
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      const t = time + idx * 0.12;
      osc.frequency.setValueAtTime(freq, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + (idx === notes.length - 1 ? 0.9 : 0.25));

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + (idx === notes.length - 1 ? 1.0 : 0.3));
    });
  }
}

window.soundEngine = new SoundEngine();
