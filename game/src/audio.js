// Small synthesized soundscape: no assets, with an ambient lantern pulse and tactile cues.
export function createAudio() {
  let context = null;
  let muted = false;
  let ambientTimer = 0;
  function ensure() {
    if (!context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) context = new AudioContext();
    }
    if (context?.state === 'suspended') context.resume();
    return context;
  }
  function tone(frequency, duration, type = 'sine', volume = 0.035, slide = 0) {
    if (muted) return;
    const audio = ensure();
    if (!audio) return;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audio.currentTime);
    if (slide) oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, frequency + slide), audio.currentTime + duration);
    gain.gain.setValueAtTime(0.0001, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(volume, audio.currentTime + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + duration + 0.02);
  }
  return {
    toggle() { muted = !muted; if (!muted) ensure(); return muted; },
    muted() { return muted; },
    footstep(intensity = 0.6) { tone(72 + Math.random() * 18, 0.065, 'triangle', 0.018 * intensity, -18); },
    stone() { tone(680, 0.12, 'sine', 0.045, -360); setTimeout(() => tone(340, 0.16, 'triangle', 0.025, -110), 110); },
    key() { tone(560, 0.18, 'sine', 0.04, 220); setTimeout(() => tone(880, 0.28, 'sine', 0.03, 160), 95); },
    gate() { tone(330, 0.4, 'sine', 0.025, 280); setTimeout(() => tone(495, 0.55, 'sine', 0.03, 250), 140); },
    alarm() { tone(190, 0.5, 'sawtooth', 0.04, 280); },
    bark() { tone(260, 0.08, 'square', 0.03, -120); setTimeout(() => tone(200, 0.1, 'square', 0.026, -80), 105); },
    clank() { tone(310, 0.11, 'triangle', 0.018, -125); setTimeout(() => tone(205, 0.09, 'triangle', 0.012, -55), 45); },
    shutter() { tone(245, 0.075, 'triangle', 0.012, -90); },
    lantern(dt) {
      ambientTimer += dt;
      if (ambientTimer > 1.8) { ambientTimer = 0; tone(102 + Math.random() * 16, 0.42, 'sine', 0.004); }
    },
  };
}
