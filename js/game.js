// Pizza Slizer – Spiel-Engine
// Schneide die Pizza in gleich große Stücke – so exakt wie möglich, bevor die Zeit abläuft.

(() => {
  'use strict';

  // ---------- Hilfsfunktionen ----------
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const TAU = Math.PI * 2;

  // ---------- Fortschritt ----------
  const Progress = {
    key: 'ps_progress_v1',
    data: { levels: {} },
    load() {
      try { const raw = localStorage.getItem(this.key); if (raw) this.data = JSON.parse(raw); } catch (e) {}
      if (!this.data.levels) this.data.levels = {};
    },
    save() { try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch (e) {} },
    get(i) { return this.data.levels[i] || { stars: 0, score: 0, accuracy: 0 }; },
    set(i, res) {
      const prev = this.get(i);
      this.data.levels[i] = {
        stars: Math.max(prev.stars, res.stars),
        score: Math.max(prev.score, res.score),
        accuracy: Math.max(prev.accuracy, res.accuracy),
      };
      this.save();
    },
    unlocked(i) { return i === 0 || this.get(i - 1).stars > 0; },
    totalStars() { return LEVELS.reduce((s, _, i) => s + this.get(i).stars, 0); },
    reset() { this.data = { levels: {} }; this.save(); },
  };

  // ---------- Assets ----------
  const images = {};
  function loadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }
  async function loadAssets(onProgress) {
    const list = [
      ['bg', 'assets/ui/background.jpg'],
      ['cutter', 'assets/ui/cutter.webp'],
      ['logo', 'assets/ui/logo.webp'],
      ...Object.entries(PIZZAS).map(([k, p]) => [k, p.file]),
    ];
    let done = 0;
    await Promise.all(list.map(async ([k, src]) => {
      images[k] = await loadImage(src);
      done++; onProgress(done / list.length);
    }));
  }

  // ---------- Bildschirme ----------
  function showScreen(id) {
    $$('.screen').forEach((s) => s.classList.toggle('active', s.id === id));
  }

  // ---------- Canvas ----------
  const canvas = $('#game');
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, DPR = 1;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2.5);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (Game.state) Game.layout();
  }
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => setTimeout(resize, 100));

  // ---------- Geometrie der Schnitte ----------
  // Ein Schnitt ist eine Gerade im lokalen Pizza-Koordinatensystem:
  //   { a: Normalenwinkel in [0, PI), d: vorzeichenbehafteter Abstand vom Mittelpunkt }
  // Punkte x auf der Geraden erfüllen  x · n = d  mit n = (cos a, sin a).
  function lineFromPoints(p, q) {
    const dx = q.x - p.x, dy = q.y - p.y;
    let a = Math.atan2(dy, dx) + Math.PI / 2; // Normale
    let n = { x: Math.cos(a), y: Math.sin(a) };
    let d = p.x * n.x + p.y * n.y;
    a = ((a % Math.PI) + Math.PI) % Math.PI;
    n = { x: Math.cos(a), y: Math.sin(a) };
    // Vorzeichen des Abstandes an die normalisierte Normale anpassen
    d = p.x * n.x + p.y * n.y;
    return { a, d };
  }

  // Flächen der entstehenden Stücke per Rasterabtastung berechnen.
  // Liefert Regionen mit relativer Fläche und Schwerpunkt sowie eine Genauigkeit 0..1.
  function evaluateCuts(cuts, R, wantedSlices) {
    const N = 180;
    const step = (2 * R) / N;
    const regions = new Map();
    let total = 0;
    const normals = cuts.map((c) => ({ x: Math.cos(c.a), y: Math.sin(c.a), d: c.d }));
    for (let iy = 0; iy < N; iy++) {
      const y = -R + (iy + 0.5) * step;
      for (let ix = 0; ix < N; ix++) {
        const x = -R + (ix + 0.5) * step;
        if (x * x + y * y > R * R) continue;
        let key = 0;
        for (let k = 0; k < normals.length; k++) {
          const n = normals[k];
          if (x * n.x + y * n.y > n.d) key |= (1 << k);
        }
        let r = regions.get(key);
        if (!r) { r = { key, count: 0, sx: 0, sy: 0 }; regions.set(key, r); }
        r.count++; r.sx += x; r.sy += y; total++;
      }
    }
    const list = Array.from(regions.values()).map((r) => ({
      key: r.key,
      area: r.count / total,
      cx: r.sx / r.count,
      cy: r.sy / r.count,
    })).sort((p, q) => q.area - p.area);

    const ideal = 1 / wantedSlices;
    let dev = 0;
    for (let i = 0; i < wantedSlices; i++) {
      const area = list[i] ? list[i].area : 0;
      dev += Math.abs(area - ideal);
    }
    for (let i = wantedSlices; i < list.length; i++) dev += list[i].area;
    // Maximale Abweichung ist ~2 (alles in einem Stück) – normieren
    const accuracy = clamp(1 - dev / (2 - 2 * ideal), 0, 1);
    return { regions: list, accuracy };
  }

  // ---------- Spielzustand ----------
  const Game = {
    state: null,      // 'play' | 'result' | 'paused'
    levelIndex: 0,
    level: null,
    pizza: null,      // { cx, cy, R, rot, baseX, baseY }
    cuts: [],
    trail: [],
    pointerDown: false,
    pointerId: null,
    timeLeft: 0,
    elapsed: 0,
    lastT: 0,
    result: null,
    explode: 0,
    flash: 0,
    message: null,
    lastTick: -1,
    cutsNeeded: 0,
    shake: 0,

    layout() {
      const base = Math.min(W, H * 0.62) * 0.42;
      const scale = this.level && this.level.scale ? this.level.scale : 1;
      this.pizza.R = base * scale;
      this.pizza.baseX = W / 2;
      this.pizza.baseY = H * 0.46;
    },

    start(index) {
      this.levelIndex = index;
      this.level = LEVELS[index];
      this.cutsNeeded = this.level.slices / 2;
      this.cuts = [];
      this.trail = [];
      this.result = null;
      this.explode = 0;
      this.flash = 0;
      this.shake = 0;
      this.message = null;
      this.lastTick = -1;
      this.timeLeft = this.level.time;
      this.elapsed = 0;
      this.pizza = { cx: W / 2, cy: H / 2, R: 100, rot: 0, baseX: W / 2, baseY: H / 2 };
      this.layout();
      this.state = 'play';
      this.lastT = performance.now();
      updateHud();
      showScreen('screen-game');
      $('#result').classList.remove('show');
      if (index === 0 && Progress.get(0).stars === 0) {
        this.toast('Wische quer über die Pizza – genau durch die Mitte!', 3200);
      } else if (this.level.rotate && !this.seenRotate) {
        this.seenRotate = true;
        this.toast('Achtung, die Pizza dreht sich!', 2200);
      } else if (this.level.drift && !this.seenDrift) {
        this.seenDrift = true;
        this.toast('Die Pizza schwebt – bleib dran!', 2200);
      }
    },

    toast(text, ms) {
      const el = $('#toast');
      el.textContent = text;
      el.classList.add('show');
      clearTimeout(this._toastT);
      this._toastT = setTimeout(() => el.classList.remove('show'), ms);
    },

    // Weltkoordinate -> lokale Pizza-Koordinate (Drehung und Verschiebung herausrechnen)
    toLocal(p) {
      const dx = p.x - this.pizza.cx, dy = p.y - this.pizza.cy;
      const c = Math.cos(-this.pizza.rot), s = Math.sin(-this.pizza.rot);
      return { x: dx * c - dy * s, y: dx * s + dy * c };
    },

    tryCut(p0, p1) {
      if (this.state !== 'play') return;
      const R = this.pizza.R;
      const a = this.toLocal(p0), b = this.toLocal(p1);
      const dx = b.x - a.x, dy = b.y - a.y;
      const len = Math.hypot(dx, dy);
      if (len < 12) return;
      // Schnittpunkte der Geraden mit dem Kreis (Parameter t entlang a->b)
      const fa = a.x * dx + a.y * dy;
      const A = dx * dx + dy * dy;
      const C = a.x * a.x + a.y * a.y - R * R;
      const disc = fa * fa - A * C;
      if (disc <= 0) { this.reject('Daneben!'); return; }
      const sq = Math.sqrt(disc);
      const t1 = (-fa - sq) / A, t2 = (-fa + sq) / A;
      const covered = clamp(Math.min(1, t2) - Math.max(0, t1), 0, t2 - t1) / (t2 - t1);
      if (covered < 0.72) { this.reject('Ganz durchziehen!'); return; }
      const line = lineFromPoints(a, b);
      if (Math.abs(line.d) > R * 0.9) { this.reject('Zu weit am Rand!'); return; }
      // Nahezu identische Schnitte nicht doppelt zählen
      for (const c of this.cuts) {
        const da = Math.abs(((c.a - line.a) + Math.PI / 2 + Math.PI) % Math.PI - Math.PI / 2);
        if (da < 0.04 && Math.abs(Math.abs(c.d) - Math.abs(line.d)) < R * 0.04) { this.reject('Da ist schon ein Schnitt!'); return; }
      }
      this.cuts.push(line);
      this.flash = 1;
      Sfx.slice();
      if (navigator.vibrate) navigator.vibrate(12);
      updateHud();
      if (this.cuts.length >= this.cutsNeeded) this.finish(false);
    },

    reject(msg) {
      this.shake = 1;
      Sfx.bad();
      this.toast(msg, 900);
    },

    finish(timeout) {
      if (this.state !== 'play') return;
      this.state = 'result';
      const ev = evaluateCuts(this.cuts, this.pizza.R, this.level.slices);
      const complete = this.cuts.length >= this.cutsNeeded;
      let accuracy = complete ? ev.accuracy : ev.accuracy * (this.cuts.length / this.cutsNeeded) * 0.6;
      let stars = 0;
      if (complete) {
        if (accuracy >= STAR_THRESHOLDS.three) stars = 3;
        else if (accuracy >= STAR_THRESHOLDS.two) stars = 2;
        else if (accuracy >= STAR_THRESHOLDS.one) stars = 1;
      }
      const timeBonus = complete ? Math.round(this.timeLeft * 25) : 0;
      const score = Math.round(accuracy * 1000) + timeBonus * (stars > 0 ? 1 : 0);
      this.result = { regions: ev.regions, accuracy, stars, score, timeBonus, timeout, complete };
      if (stars > 0) Progress.set(this.levelIndex, this.result);
      this.explode = 0;
      setTimeout(() => showResult(this.result), 900);
      if (stars > 0) Sfx.success(stars); else Sfx.fail();
    },

    update(dt) {
      const lv = this.level;
      const t = this.elapsed;
      if (this.state === 'play') {
        this.elapsed += dt;
        this.timeLeft -= dt;
        if (this.timeLeft <= 3 && this.timeLeft > 0) {
          const sec = Math.ceil(this.timeLeft);
          if (sec !== this.lastTick) { this.lastTick = sec; Sfx.tick(); }
        }
        if (this.timeLeft <= 0) { this.timeLeft = 0; this.finish(true); }
        if (lv.rotate) this.pizza.rot += lv.rotate * dt;
      }
      if (lv.drift) {
        const amp = lv.drift * 18;
        this.pizza.cx = this.pizza.baseX + Math.sin(t * 1.3) * amp;
        this.pizza.cy = this.pizza.baseY + Math.cos(t * 0.9) * amp * 0.6;
      } else {
        this.pizza.cx = this.pizza.baseX;
        this.pizza.cy = this.pizza.baseY;
      }
      if (this.state === 'result') this.explode = Math.min(1, this.explode + dt * 1.6);
      this.flash = Math.max(0, this.flash - dt * 3);
      this.shake = Math.max(0, this.shake - dt * 4);
      // Spur ausblenden
      const now = performance.now();
      this.trail = this.trail.filter((p) => now - p.t < 260);
      updateTimer();
    },

    draw() {
      ctx.clearRect(0, 0, W, H);
      drawBackground();
      const pz = this.pizza;
      const shakeX = this.shake ? (Math.random() - 0.5) * 8 * this.shake : 0;
      const shakeY = this.shake ? (Math.random() - 0.5) * 8 * this.shake : 0;

      ctx.save();
      ctx.translate(pz.cx + shakeX, pz.cy + shakeY);

      // Schatten
      ctx.save();
      ctx.beginPath(); ctx.arc(6, 10, pz.R, 0, TAU);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.filter = 'blur(6px)';
      ctx.fill();
      ctx.restore();

      ctx.rotate(pz.rot);
      const img = images[this.level.pizza];

      if (this.state === 'result' && this.result && this.cuts.length) {
        this.drawExploded(img);
      } else {
        drawPizzaImage(img, pz.R);
        this.drawCuts(pz.R, 1);
      }
      this.drawGuides(pz.R);
      ctx.restore();

      // Aufblitzen nach Schnitt
      if (this.flash > 0) {
        ctx.fillStyle = `rgba(255,255,255,${this.flash * 0.18})`;
        ctx.fillRect(0, 0, W, H);
      }

      this.drawTrail();
    },

    drawCuts(R, alpha) {
      ctx.save();
      ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.clip();
      for (const c of this.cuts) {
        const n = { x: Math.cos(c.a), y: Math.sin(c.a) };
        const tvec = { x: -n.y, y: n.x };
        const px = n.x * c.d, py = n.y * c.d;
        ctx.beginPath();
        ctx.moveTo(px - tvec.x * R * 2, py - tvec.y * R * 2);
        ctx.lineTo(px + tvec.x * R * 2, py + tvec.y * R * 2);
        ctx.lineWidth = 5; ctx.strokeStyle = `rgba(60,20,5,${0.55 * alpha})`; ctx.stroke();
        ctx.lineWidth = 1.5; ctx.strokeStyle = `rgba(255,235,200,${0.5 * alpha})`; ctx.stroke();
      }
      ctx.restore();
    },

    drawGuides(R) {
      if (!this.level.guides || this.state !== 'play' || this.cuts.length === 0) return;
      const m = this.cutsNeeded;
      const a0 = this.cuts[0].a;
      ctx.save();
      ctx.setLineDash([6, 8]);
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      for (let k = 1; k < m; k++) {
        const a = a0 + (Math.PI / m) * k;
        const tx = -Math.sin(a), ty = Math.cos(a);
        ctx.beginPath();
        ctx.moveTo(-tx * (R + 14), -ty * (R + 14));
        ctx.lineTo(tx * (R + 14), ty * (R + 14));
        ctx.stroke();
      }
      ctx.restore();
    },

    drawExploded(img) {
      const R = this.pizza.R;
      const e = easeOut(this.explode);
      const dist = R * 0.055 * e + 3 * e;
      const L = R * 4;
      const normals = this.cuts.map((c) => ({ x: Math.cos(c.a), y: Math.sin(c.a), d: c.d }));
      for (const reg of this.result.regions) {
        const len = Math.hypot(reg.cx, reg.cy) || 1;
        const ox = (reg.cx / len) * dist, oy = (reg.cy / len) * dist;
        ctx.save();
        ctx.translate(ox, oy);
        ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.clip();
        normals.forEach((n, k) => {
          const side = (reg.key >> k) & 1 ? 1 : -1;
          const tvec = { x: -n.y, y: n.x };
          const bx = n.x * n.d, by = n.y * n.d;
          ctx.beginPath();
          ctx.moveTo(bx - tvec.x * L, by - tvec.y * L);
          ctx.lineTo(bx + tvec.x * L, by + tvec.y * L);
          ctx.lineTo(bx + tvec.x * L + n.x * side * L, by + tvec.y * L + n.y * side * L);
          ctx.lineTo(bx - tvec.x * L + n.x * side * L, by - tvec.y * L + n.y * side * L);
          ctx.closePath();
          ctx.clip();
        });
        drawPizzaImage(img, R);
        ctx.restore();
      }
    },

    drawTrail() {
      if (this.trail.length < 2) return;
      const now = performance.now();
      ctx.save();
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (let i = 1; i < this.trail.length; i++) {
        const p = this.trail[i - 1], q = this.trail[i];
        const age = 1 - (now - q.t) / 260;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
        ctx.lineWidth = 10 * age + 2;
        ctx.strokeStyle = `rgba(255,255,255,${0.75 * age})`;
        ctx.stroke();
      }
      // Pizzaschneider am Finger
      if (this.pointerDown && images.cutter) {
        const q = this.trail[this.trail.length - 1];
        const p = this.trail[Math.max(0, this.trail.length - 4)];
        const ang = Math.atan2(q.y - p.y, q.x - p.x);
        const size = Math.min(W, H) * 0.22;
        ctx.save();
        ctx.translate(q.x, q.y);
        ctx.rotate(ang + Math.PI / 4);
        ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 6;
        // Bild: Rad unten links, Griff oben rechts -> Rad am Fingerpunkt ausrichten
        ctx.drawImage(images.cutter, -size * 0.22, -size * 0.78, size, size);
        ctx.restore();
      }
      ctx.restore();
    },
  };

  function drawPizzaImage(img, R) {
    if (img) {
      ctx.drawImage(img, -R, -R, R * 2, R * 2);
    } else {
      ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU);
      ctx.fillStyle = '#e0a04a'; ctx.fill();
      ctx.beginPath(); ctx.arc(0, 0, R * 0.86, 0, TAU);
      ctx.fillStyle = '#d23c2a'; ctx.fill();
    }
  }

  function drawBackground() {
    const bg = images.bg;
    if (bg) {
      const s = Math.max(W / bg.width, H / bg.height);
      const w = bg.width * s, h = bg.height * s;
      ctx.drawImage(bg, (W - w) / 2, (H - h) / 2, w, h);
    } else {
      ctx.fillStyle = '#4a2c17'; ctx.fillRect(0, 0, W, H);
    }
  }

  // ---------- HUD ----------
  function updateHud() {
    const lv = Game.level;
    $('#hud-level').textContent = `Level ${Game.levelIndex + 1}`;
    $('#hud-pizza').textContent = PIZZAS[lv.pizza].name;
    $('#hud-goal').textContent = `${lv.slices} Stücke`;
    $('#hud-cuts').textContent = `Schnitt ${Game.cuts.length}/${Game.cutsNeeded}`;
  }
  function updateTimer() {
    const frac = clamp(Game.timeLeft / Game.level.time, 0, 1);
    const bar = $('#timer-bar');
    bar.style.transform = `scaleX(${frac})`;
    bar.classList.toggle('danger', Game.timeLeft <= 3);
    $('#timer-text').textContent = Game.timeLeft.toFixed(1) + 's';
  }

  // ---------- Ergebnis ----------
  function showResult(r) {
    const el = $('#result');
    $('#res-title').textContent = r.timeout && !r.complete ? 'Zeit abgelaufen!'
      : r.stars === 3 ? 'Perfetto!' : r.stars === 2 ? 'Bravo!' : r.stars === 1 ? 'Geschafft!' : 'Zu ungleich!';
    $('#res-accuracy').textContent = (r.accuracy * 100).toFixed(1) + '%';
    $('#res-score').textContent = r.score.toLocaleString('de-DE');
    $('#res-bonus').textContent = r.timeBonus ? `+${r.timeBonus} Zeitbonus` : '';
    const stars = $$('#res-stars span');
    stars.forEach((s, i) => {
      s.classList.remove('on');
      if (i < r.stars) setTimeout(() => s.classList.add('on'), 250 + i * 220);
    });
    const next = $('#btn-next');
    const hasNext = Game.levelIndex + 1 < LEVELS.length;
    next.style.display = r.stars > 0 && hasNext ? '' : 'none';
    el.classList.add('show');
  }

  // ---------- Level-Auswahl ----------
  function buildLevelGrid() {
    const grid = $('#level-grid');
    grid.innerHTML = '';
    let lastPizza = null;
    LEVELS.forEach((lv, i) => {
      if (lv.pizza !== lastPizza) {
        lastPizza = lv.pizza;
        const h = document.createElement('div');
        h.className = 'world-title';
        const img = images[lv.pizza];
        h.innerHTML = `<img src="${PIZZAS[lv.pizza].file}" alt=""><span>${PIZZAS[lv.pizza].name}</span>`;
        if (!img) h.querySelector('img').style.visibility = 'hidden';
        grid.appendChild(h);
        const row = document.createElement('div');
        row.className = 'world-row';
        row.dataset.pizza = lv.pizza;
        grid.appendChild(row);
      }
      const row = grid.lastElementChild;
      const p = Progress.get(i);
      const unlocked = Progress.unlocked(i);
      const card = document.createElement('button');
      card.className = 'level-card' + (unlocked ? '' : ' locked');
      card.disabled = !unlocked;
      card.innerHTML = `
        <div class="num">${i + 1}</div>
        <div class="meta">${lv.slices} Stücke · ${lv.time}s</div>
        <div class="stars">${'★'.repeat(p.stars)}${'☆'.repeat(3 - p.stars)}</div>
        ${lv.rotate ? '<div class="tag">↻</div>' : ''}${lv.drift ? '<div class="tag">〰</div>' : ''}
        ${unlocked ? '' : '<div class="lock">🔒</div>'}`;
      card.addEventListener('click', () => { Sfx.tap(); Game.start(i); });
      row.appendChild(card);
    });
    $('#total-stars').textContent = `${Progress.totalStars()} / ${LEVELS.length * 3} ★`;
  }

  // ---------- Eingabe ----------
  function pointerPos(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() };
  }
  let strokeStart = null;
  canvas.addEventListener('pointerdown', (e) => {
    if (Game.state !== 'play') return;
    Sfx.ensure();
    Game.pointerDown = true; Game.pointerId = e.pointerId;
    canvas.setPointerCapture(e.pointerId);
    strokeStart = pointerPos(e);
    Game.trail = [strokeStart];
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!Game.pointerDown || e.pointerId !== Game.pointerId) return;
    Game.trail.push(pointerPos(e));
    if (Game.trail.length > 40) Game.trail.shift();
  });
  function endStroke(e) {
    if (!Game.pointerDown || e.pointerId !== Game.pointerId) return;
    Game.pointerDown = false;
    const end = pointerPos(e);
    if (strokeStart) Game.tryCut(strokeStart, end);
    strokeStart = null;
  }
  canvas.addEventListener('pointerup', endStroke);
  canvas.addEventListener('pointercancel', endStroke);
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  // ---------- Buttons ----------
  function bindUi() {
    $('#btn-play').addEventListener('click', () => { Sfx.ensure(); Sfx.tap(); buildLevelGrid(); showScreen('screen-levels'); });
    $('#btn-back-title').addEventListener('click', () => { Sfx.tap(); showScreen('screen-title'); });
    $('#btn-quit').addEventListener('click', () => { Sfx.tap(); leaveGame(); });
    $('#btn-retry').addEventListener('click', () => { Sfx.tap(); Game.start(Game.levelIndex); });
    $('#btn-next').addEventListener('click', () => { Sfx.tap(); Game.start(Game.levelIndex + 1); });
    $('#btn-levels').addEventListener('click', () => { Sfx.tap(); leaveGame(); });
    $('#btn-reset').addEventListener('click', () => {
      if (confirm('Gesamten Fortschritt wirklich löschen?')) { Progress.reset(); buildLevelGrid(); updateTitleStars(); }
    });
    const mute = $('#btn-mute');
    const syncMute = () => { mute.textContent = Sfx.isMuted() ? '🔇' : '🔊'; };
    mute.addEventListener('click', () => { Sfx.toggleMute(); syncMute(); });
    syncMute();
  }
  function leaveGame() {
    Game.state = null;
    Game.pointerDown = false;
    ctx.clearRect(0, 0, W, H);
    buildLevelGrid();
    showScreen('screen-levels');
  }
  function updateTitleStars() {
    $('#title-stars').textContent = `${Progress.totalStars()} / ${LEVELS.length * 3} ★`;
  }

  // ---------- Hauptschleife ----------
  function loop(now) {
    if (Game.state) {
      const dt = Math.min(0.05, (now - Game.lastT) / 1000);
      Game.lastT = now;
      Game.update(dt);
      Game.draw();
    }
    requestAnimationFrame(loop);
  }

  // ---------- Start ----------
  async function init() {
    Progress.load();
    resize();
    bindUi();
    const bar = $('#load-bar');
    await loadAssets((f) => { bar.style.transform = `scaleX(${f})`; });
    const logo = $('#logo');
    if (images.logo) logo.src = 'assets/ui/logo.webp'; else logo.replaceWith(Object.assign(document.createElement('h1'), { textContent: 'Pizza Slizer', className: 'fallback-title' }));
    if (images.bg) document.body.style.backgroundImage = "url('assets/ui/background.jpg')";
    updateTitleStars();
    $('#screen-loading').classList.remove('active');
    showScreen('screen-title');
    Game.lastT = performance.now();
    requestAnimationFrame(loop);
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }
  init();
})();
