// Story Studio — "cozy" ambient scenes: slow, soft, painterly loops for relaxing nature videos.
// Every motion repeats exactly every LOOP seconds, so a short render can be tiled into an hour-long video.
(function () {
  const W = 1280, H = 720;
  let g = null, LOOP = 30;

  // ---------- helpers
  const TAU = Math.PI * 2;
  function rnd(i) { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function lp(t, period) { return ((t % period) + period) % period / period; } // 0..1 phase, loops cleanly
  function per(t, cycles) { return TAU * cycles * t / LOOP; }                  // angle that loops after LOOP seconds
  function lerp(a, b, k) { return a + (b - a) * k; }
  function grad(x0, y0, x1, y1, stops) { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; }
  function rgrad(x, y, r0, r1, stops) { const gr = g.createRadialGradient(x, y, r0, x, y, r1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; }
  function blob(x, y, rx, ry, fill) { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fillStyle = fill; g.fill(); }

  // ---------- grain: one noise tile reused every frame (offset changes), gives a soft painted texture
  let grain = null;
  function makeGrain() {
    const c = document.createElement('canvas'); c.width = 256; c.height = 256; const x = c.getContext('2d');
    const im = x.createImageData(256, 256);
    for (let i = 0; i < im.data.length; i += 4) { const v = 128 + (rnd(i * .37) - .5) * 70; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 18; }
    x.putImageData(im, 0, 0); grain = c;
  }

  // ---------- the view outside: night hills, a far cottage, mist, distant lightning
  function outside(t, P) {
    const k = P.flash;
    g.fillStyle = grad(0, 0, 0, H, [[0, mixc('#0d1b2a', '#5b6f8a', k)], [.55, mixc('#1d3247', '#7c8fa8', k)], [1, '#22384a']]); g.fillRect(0, 0, W, H);
    // hazy moon behind cloud
    g.fillStyle = rgrad(930, 150, 10, 160, [[0, 'rgba(230,236,220,.55)'], [.2, 'rgba(200,214,210,.22)'], [1, 'rgba(120,140,160,0)']]); g.fillRect(700, 0, 500, 360);
    // slow clouds (loop exactly)
    for (let i = 0; i < 7; i++) {
      const sp = (i % 3) + 1, x = ((rnd(i) * W + lp(t, LOOP / sp) * (W + 600)) % (W + 600)) - 300, y = 60 + rnd(i + 9) * 170;
      g.globalAlpha = .35 + .2 * rnd(i + 3);
      for (let j = 0; j < 5; j++) blob(x + j * 55, y + Math.sin(j * 1.7) * 14, 90 + 30 * rnd(i * 5 + j), 34 + 10 * rnd(j), mixc('#2a3d52', '#8a9bb2', k));
    }
    g.globalAlpha = 1;
    g.save(); g.translate(0, P.horizon - 520);
    // hills, far to near
    const hills = [['#1b2f3d', 470, 40, .004], ['#16283a', 520, 55, .006], ['#0f1e2c', 590, 45, .009]];
    hills.forEach(([c, base, amp, f], h) => {
      g.beginPath(); g.moveTo(0, H);
      for (let x = 0; x <= W; x += 16) g.lineTo(x, base - amp * Math.sin(x * f + h * 2) - amp * .5 * Math.sin(x * f * 2.3 + h));
      g.lineTo(W, H); g.closePath(); g.fillStyle = mixc(c, '#4d6680', k * .6); g.fill();
    });
    // trees on the middle hill
    for (let i = 0; i < 26; i++) {
      const x = rnd(i + 40) * W, y = 520 - 55 * Math.sin(x * .006 + 2) + 6, h = 30 + rnd(i + 70) * 45;
      g.beginPath(); g.moveTo(x - h * .28, y); g.lineTo(x, y - h); g.lineTo(x + h * .28, y); g.closePath(); g.fillStyle = mixc('#0c1a24', '#3c5568', k * .5); g.fill();
    }
    // far cottage with a warm window
    const cx = 380, cy = 470 - 40 * Math.sin(380 * .004) - 12;
    g.fillStyle = mixc('#0e1a24', '#3a4d5e', k * .5); g.fillRect(cx - 34, cy - 26, 68, 30);
    g.beginPath(); g.moveTo(cx - 42, cy - 24); g.lineTo(cx, cy - 52); g.lineTo(cx + 42, cy - 24); g.closePath(); g.fill();
    const flick = .85 + .15 * Math.sin(per(t, 7)) * Math.sin(per(t, 3));
    g.fillStyle = `rgba(255,190,100,${.9 * flick})`; g.fillRect(cx - 20, cy - 16, 10, 10); g.fillRect(cx + 8, cy - 16, 10, 10);
    g.fillStyle = rgrad(cx, cy - 10, 2, 60, [[0, `rgba(255,180,90,${.35 * flick})`], [1, 'rgba(255,180,90,0)']]); g.fillRect(cx - 70, cy - 70, 140, 120);
    // mist bands
    for (let i = 0; i < 4; i++) {
      const y = 480 + i * 40, x = lp(t, LOOP / (i + 1)) * W;
      blob(x, y, 520, 26, 'rgba(160,180,200,.08)'); blob(x - W, y, 520, 26, 'rgba(160,180,200,.08)');
    }
    g.restore();
  }

  // ---------- rain falling outside (seeded per frame-in-loop so the loop is exact)
  function rainOutside(t, P) {
    const fi = Math.floor(lp(t, LOOP) * LOOP * 30);
    g.strokeStyle = 'rgba(190,210,230,.28)'; g.lineWidth = 1.2; g.beginPath();
    const n = P.rain === 'heavy' ? 520 : 300;
    for (let i = 0; i < n; i++) {
      const x = rnd(i * 3.1 + fi * .7) * (W + 200) - 100, y = rnd(i * 7.7 + fi * 1.3) * H, l = 14 + rnd(i) * 18;
      g.moveTo(x, y); g.lineTo(x - l * .18, y + l);
    }
    g.stroke();
  }

  // ---------- drops on the glass: still beads + a few slow runners with trails
  function glassDrops(t, panes) {
    panes.forEach(([px, py, pw, ph], pi) => {
      g.save(); g.beginPath(); g.rect(px, py, pw, ph); g.clip();
      for (let i = 0; i < 34; i++) {
        const x = px + rnd(i + pi * 100) * pw, y = py + rnd(i * 3 + pi * 50) * ph, r = 1.2 + rnd(i * 5 + pi) * 2.6;
        blob(x, y, r, r * 1.1, 'rgba(200,220,240,.14)'); blob(x - r * .3, y - r * .35, r * .3, r * .3, 'rgba(255,255,255,.28)');
      }
      for (let i = 0; i < 4; i++) {
        const sp = 1 + (i % 2), ph0 = rnd(i + pi * 9);
        const k = (lp(t, LOOP / sp) + ph0) % 1, x = px + (.15 + rnd(i * 11 + pi) * .7) * pw + Math.sin(k * 9 + i) * 3, y = py - 20 + k * (ph + 40);
        g.strokeStyle = 'rgba(200,220,240,.13)'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x, Math.max(py, y - 90)); g.lineTo(x, y); g.stroke();
        blob(x, y, 3.6, 4.6, 'rgba(210,228,245,.4)'); blob(x - 1, y - 1.5, 1.2, 1.2, 'rgba(255,255,255,.6)');
      }
      // condensation in the lower corners
      g.fillStyle = rgrad(px, py + ph, 0, pw * .7, [[0, 'rgba(210,220,230,.16)'], [1, 'rgba(210,220,230,0)']]); g.fillRect(px, py, pw, ph);
      g.restore();
    });
  }

  // ---------- the room: warm wall, window frame, curtains, sill with tea, plant, books, a sleeping cat
  function room(t, P, win) {
    const [wx, wy, ww, wh] = win;
    // wall (cut out the window)
    g.save(); g.beginPath(); g.rect(0, 0, W, H); g.rect(wx, wy, ww, wh); g.clip('evenodd');
    g.fillStyle = grad(0, 0, W, 0, [[0, '#4a3222'], [.5, '#3a2618'], [1, '#2a1b12']]); g.fillRect(0, 0, W, H);
    // brush strokes texture on the wall
    for (let i = 0; i < 40; i++) blob(rnd(i + 1) * W, rnd(i + 2) * H, 90 + rnd(i + 3) * 200, 50 + rnd(i + 4) * 120, `rgba(${rnd(i) > .5 ? '255,215,160' : '15,8,4'},.03)`);
    g.restore();
    // frame
    const f = 18;
    g.fillStyle = '#6b4a30'; g.fillRect(wx - f, wy - f, ww + 2 * f, f); g.fillRect(wx - f, wy + wh, ww + 2 * f, f); g.fillRect(wx - f, wy, f, wh); g.fillRect(wx + ww, wy, f, wh);
    g.fillStyle = '#5a3d27'; g.fillRect(wx + ww / 2 - 7, wy, 14, wh); g.fillRect(wx, wy + wh * .45 - 7, ww, 14);
    g.fillStyle = 'rgba(255,200,140,.18)'; g.fillRect(wx - f, wy - f, ww + 2 * f, 4); g.fillRect(wx - f, wy - f, 4, wh + 2 * f);
    // curtains with a gentle sway
    [[wx - 120, 1], [wx + ww + 120, -1]].forEach(([cx, d], ci) => {
      const sway = Math.sin(per(t, 2) + ci) * 6;
      g.beginPath(); g.moveTo(cx - 70 * d, wy - 60);
      g.bezierCurveTo(cx + 40 * d, wy - 60, cx + 30 * d + sway, wy + wh * .5, cx + 60 * d + sway, wy + wh + 60);
      g.lineTo(cx - 90 * d, wy + wh + 60); g.closePath();
      g.fillStyle = grad(cx - 90, 0, cx + 90, 0, [[0, '#7a2f2f'], [.5, '#9c4038'], [1, '#6a2626']]); g.fill();
      for (let s = 0; s < 4; s++) { g.strokeStyle = 'rgba(40,10,10,.25)'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx - 50 * d + s * 22 * d, wy - 50); g.quadraticCurveTo(cx - 30 * d + s * 26 * d + sway, wy + wh * .5, cx - 40 * d + s * 30 * d + sway, wy + wh + 55); g.stroke(); }
    });
    // sill
    const sy = wy + wh + f;
    g.fillStyle = grad(0, sy, 0, sy + 40, [[0, '#8a6242'], [1, '#5c3f28']]); g.fillRect(wx - 80, sy, ww + 160, 30);
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(wx - 80, sy + 30, ww + 160, 12);
    // books
    [['#3d5a6b', 0], ['#7a5b2e', 1], ['#5b3a52', 2]].forEach(([c, i]) => { g.fillStyle = c; g.fillRect(wx + ww - 150 + i * 4, sy - 16 - i * 15, 120 - i * 10, 15); g.fillStyle = 'rgba(255,240,210,.5)'; g.fillRect(wx + ww - 148 + i * 4, sy - 14 - i * 15, 116 - i * 10, 2); });
    // potted plant
    const ppx = wx + 70;
    g.fillStyle = '#9a5a3a'; g.beginPath(); g.moveTo(ppx - 26, sy - 46); g.lineTo(ppx + 26, sy - 46); g.lineTo(ppx + 20, sy); g.lineTo(ppx - 20, sy); g.closePath(); g.fill();
    for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * .32 + Math.sin(per(t, 1) + i) * .03; g.strokeStyle = i % 2 ? '#4f7a46' : '#3f6a3a'; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(ppx, sy - 46); g.quadraticCurveTo(ppx + Math.cos(a) * 30, sy - 46 + Math.sin(a) * 40, ppx + Math.cos(a) * 52, sy - 46 + Math.sin(a) * 70); g.stroke(); }
    // tea cup + steam
    const tx = wx + ww * .5 - 120, ty = sy;
    blob(tx, ty - 2, 42, 7, 'rgba(0,0,0,.3)');
    g.fillStyle = '#e8ddcc'; g.beginPath(); g.moveTo(tx - 30, ty - 44); g.lineTo(tx + 30, ty - 44); g.quadraticCurveTo(tx + 28, ty - 4, tx, ty - 4); g.quadraticCurveTo(tx - 28, ty - 4, tx - 30, ty - 44); g.fill();
    g.strokeStyle = '#e8ddcc'; g.lineWidth = 6; g.beginPath(); g.arc(tx + 32, ty - 28, 10, -Math.PI / 2, Math.PI / 2); g.stroke();
    blob(tx, ty - 44, 30, 6, '#6b3e22');
    for (let i = 0; i < 3; i++) {
      const k = (lp(t, LOOP / 6) + i / 3) % 1, a = Math.sin(k * Math.PI) * .45;
      g.strokeStyle = `rgba(240,235,225,${a * .55})`; g.lineWidth = 10 + k * 10; g.lineCap = 'round'; g.filter = 'blur(3px)'; g.beginPath();
      const x0 = tx - 10 + i * 10, y0 = ty - 50 - k * 70;
      g.moveTo(x0, y0); g.bezierCurveTo(x0 + 14, y0 - 15, x0 - 14, y0 - 30, x0 + Math.sin(k * 6 + i) * 8, y0 - 45); g.stroke(); g.filter = 'none';
    }
    // sleeping cat, curled, breathing
    const cx = wx + ww * .5 + 110, cy = sy - 2, br = 1 + .035 * Math.sin(per(t, 8));
    blob(cx, cy, 82, 9, 'rgba(0,0,0,.3)');
    g.save(); g.translate(cx, cy); g.scale(1, br);
    blob(0, -30, 72, 32, '#b8783e'); blob(10, -40, 52, 20, 'rgba(255,210,150,.18)');
    for (let s = 0; s < 4; s++) { g.strokeStyle = 'rgba(110,60,25,.6)'; g.lineWidth = 5; g.beginPath(); g.arc(-10 + s * 18, -30, 26, Math.PI * 1.15, Math.PI * 1.45); g.stroke(); }
    g.strokeStyle = '#a86a34'; g.lineWidth = 15; g.lineCap = 'round'; g.beginPath(); g.moveTo(66, -18); g.quadraticCurveTo(70, 4, 20, 2); g.quadraticCurveTo(-30, 0, -50, -6); g.stroke();
    blob(-58, -26, 30, 25, '#b8783e');
    g.fillStyle = '#b8783e'; [[-78, -40, -72, -64, -60, -44], [-56, -46, -44, -66, -38, -44]].forEach(([a, b, c, d, e, f2]) => { g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.lineTo(e, f2); g.closePath(); g.fill(); });
    g.strokeStyle = '#3a2210'; g.lineWidth = 2.5; [[-70, -28], [-52, -28]].forEach(([ex, ey]) => { g.beginPath(); g.arc(ex, ey, 5, .2, Math.PI - .2); g.stroke(); });
    g.restore();
    // warm lamp light from the left, and the window's cool spill
    g.fillStyle = rgrad(80, 300, 20, 760, [[0, 'rgba(255,190,110,.35)'], [.5, 'rgba(255,170,90,.12)'], [1, 'rgba(255,160,80,0)']]); g.fillRect(0, 0, W, H);
    g.fillStyle = rgrad(wx + ww / 2, wy + wh / 2, 50, 600, [[0, `rgba(140,170,210,${.1 + P.flash * .3})`], [1, 'rgba(140,170,210,0)']]); g.fillRect(0, 0, W, H);
  }

  function mixc(a, b, k) {
    const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b);
    return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], Math.max(0, Math.min(1, k))))).join(',')})`;
  }

  // distant lightning: a soft double flash a couple of times per loop
  function flashAt(t, P) {
    if (!P.thunder) return 0;
    const ph = lp(t, LOOP) * LOOP; let k = 0;
    P.thunderAt.forEach((at) => { const d = ph - at; if (d >= 0 && d < .7) k = Math.max(k, d < .08 ? 1 : d < .16 ? .3 : d < .24 ? .8 : Math.max(0, 1 - (d - .24) / .45) * .5); });
    return k * .55;
  }

  window.renderCozy = function (ctx, t, opts) {
    g = ctx; if (!grain) makeGrain();
    const P = Object.assign({ scene: 'rain_window', rain: 'steady', thunder: true, thunderAt: [7.5, 21.0], loop: 30 }, opts || {});
    LOOP = P.loop; P.flash = flashAt(t, P);
    const win = [330, 60, 620, 450]; P.horizon = win[1] + win[3] * .66;
    const panes = [[win[0], win[1], win[2] / 2 - 7, win[3] * .45 - 7], [win[0] + win[2] / 2 + 7, win[1], win[2] / 2 - 7, win[3] * .45 - 7],
                   [win[0], win[1] + win[3] * .45 + 7, win[2] / 2 - 7, win[3] * .55 - 7], [win[0] + win[2] / 2 + 7, win[1] + win[3] * .45 + 7, win[2] / 2 - 7, win[3] * .55 - 7]];
    // outside, seen through wet glass: drawn soft
    g.save(); g.beginPath(); g.rect(win[0], win[1], win[2], win[3]); g.clip();
    g.filter = 'blur(2.2px)'; outside(t, P); g.filter = 'none'; rainOutside(t, P);
    g.restore();
    glassDrops(t, panes);
    room(t, P, win);
    // soft vignette + grain for a painted feel
    g.fillStyle = rgrad(W / 2, H / 2, H * .35, H * .95, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(10,5,2,.55)']]); g.fillRect(0, 0, W, H);
    const gx = Math.floor(rnd(Math.floor(t * 12)) * 256), gy = Math.floor(rnd(Math.floor(t * 12) + 5) * 256);
    g.save(); g.translate(-gx, -gy); g.fillStyle = g.createPattern(grain, 'repeat'); g.fillRect(gx, gy, W, H); g.restore();
  };
})();
