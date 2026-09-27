// Synthetisierte Sounds über WebAudio – keine externen Dateien nötig
const Sfx = (() => {
  let ctx = null;
  let muted = false;
  try { muted = localStorage.getItem('ps_muted') === '1'; } catch (e) {}

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function noiseBuffer(c, seconds) {
    const len = Math.floor(c.sampleRate * seconds);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  function slice() {
    const c = ensure(); if (!c || muted) return;
    const t = c.currentTime;
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(c, 0.25);
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass'; bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(900, t);
    bp.frequency.exponentialRampToValueAtTime(4500, t + 0.12);
    bp.frequency.exponentialRampToValueAtTime(600, t + 0.25);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    src.connect(bp).connect(g).connect(c.destination);
    src.start(t); src.stop(t + 0.3);
  }

  function tone(freq, start, dur, type = 'triangle', vol = 0.18) {
    const c = ensure(); if (!c || muted) return;
    const t = c.currentTime + start;
    const o = c.createOscillator();
    o.type = type; o.frequency.value = freq;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t); o.stop(t + dur + 0.05);
  }

  function success(stars) {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    const count = Math.max(2, stars + 1);
    for (let i = 0; i < count; i++) tone(notes[i], i * 0.09, 0.35);
    if (stars === 3) tone(1318.5, 0.4, 0.5, 'sine', 0.15);
  }

  function fail() {
    tone(220, 0, 0.35, 'sawtooth', 0.12);
    tone(164.8, 0.18, 0.5, 'sawtooth', 0.12);
  }

  function tick() { tone(1200, 0, 0.05, 'square', 0.05); }
  function tap() { tone(700, 0, 0.06, 'sine', 0.08); }
  function bad() { tone(140, 0, 0.15, 'square', 0.06); }

  function toggleMute() {
    muted = !muted;
    try { localStorage.setItem('ps_muted', muted ? '1' : '0'); } catch (e) {}
    return muted;
  }
  function isMuted() { return muted; }

  return { ensure, slice, success, fail, tick, tap, bad, toggleMute, isMuted };
})();
