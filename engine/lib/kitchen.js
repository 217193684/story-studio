// Story Studio — cozy kitchen ASMR routine: the cat chops, cooks, stirs and tastes while the weather goes on outside.
// renderKitchen(ctx, t, {weather: 'rain' | 'wind' | 'storm'}) — a 60 s routine that loops with a soft fade.
(function () {
  const W = 1280, H = 720, INK = '#3b2a22', LW = 5, TAU = Math.PI * 2, END = 60;
  let g, later = [];
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const ease = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
  const seg = (t, a, b) => ease((t - a) / (b - a));
  const lerp = (a, b, k) => a + (b - a) * k;
  const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  function shape(path, fill, lw = LW) { g.beginPath(); path(); if (fill) { g.fillStyle = fill; g.fill(); } if (lw) { g.lineWidth = lw; g.strokeStyle = INK; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); } }
  const ell = (x, y, rx, ry, fill, lw, rot = 0) => shape(() => g.ellipse(x, y, rx, ry, rot, 0, TAU), fill, lw);
  function rrect(x, y, w, h, r, fill, lw) { shape(() => { g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }, fill, lw); }
  function line(pts, lw = LW, col = INK) { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.lineWidth = lw; g.strokeStyle = col; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(); }
  function arc(x, y, r, a0, a1, lw = LW, col = INK) { g.beginPath(); g.arc(x, y, r, a0, a1); g.lineWidth = lw; g.strokeStyle = col; g.lineCap = 'round'; g.stroke(); }

  // ---------- the routine (seconds)
  const R = {
    chops: [{ veg: 'carrot', t0: 2.5, t1: 13, rate: 1.6 }, { veg: 'onion', t0: 34, t1: 42, rate: 2.2 }],
    pour: [[13.5, 17, 'carrot'], [42.5, 46, 'onion']],
    stir: [[17.5, 27], [46.5, 56]],
    taste: [27.5, 31.5], salt: [31.5, 33.5],
    lightning: [11.5, 40.5],
  };
  const chopTimes = (c) => { const out = []; for (let x = c.t0 + .3; x < c.t1 - .2; x += 1 / c.rate) out.push(x); return out; };

  // ---------- window + weather
  function outside(t, P) {
    const wx = 215, wy = 60, ww = 250, wh = 230;
    rrect(wx - 12, wy - 12, ww + 24, wh + 24, 24, '#ffffff');
    g.save(); g.beginPath(); g.rect(wx, wy, ww, wh); g.clip();
    const storm = P.weather === 'storm', wind = P.weather === 'wind';
    const flash = storm ? lightning(t) : 0;
    g.fillStyle = storm ? (flash > .3 ? '#cfd8ee' : '#3d4d6e') : wind ? '#b9cfe0' : '#8fa6c4'; g.fillRect(wx, wy, ww, wh);
    for (let i = 0; i < 4; i++) { const x = wx + ((rnd(i) * ww + t * (wind ? 30 : 8) * (1 + i % 2)) % (ww + 160)) - 80; ell(x, wy + 40 + i * 22, 70, 20, storm ? '#56658a' : wind ? '#e8f0f6' : '#a9bad2', 0); }
    // hills and a tree that sways in the wind
    g.fillStyle = storm ? '#2f4a3c' : '#7fa86a'; g.beginPath(); g.moveTo(wx, wy + wh); for (let x = wx; x <= wx + ww; x += 15) g.lineTo(x, wy + 200 - 18 * Math.sin(x * .03)); g.lineTo(wx + ww, wy + wh); g.fill();
    const sway = (wind ? 10 : storm ? 6 : 2) * Math.sin(t * (wind ? 2.2 : 1.5));
    line([[wx + 70, wy + wh], [wx + 74 + sway * .3, wy + 150]], 12, '#6b4a30');
    ell(wx + 74 + sway, wy + 115, 58, 50, storm ? '#2f5a3e' : '#5f9a52', 4); ell(wx + 44 + sway * 1.2, wy + 100, 34, 28, storm ? '#356546' : '#6fae5e', 0);
    if (wind) for (let i = 0; i < 7; i++) { const k = (t * .35 + rnd(i)) % 1, x = wx - 20 + k * (ww + 40), y = wy + 60 + rnd(i + 3) * 150 + Math.sin(k * 12 + i) * 18; g.save(); g.translate(x, y); g.rotate(k * 9 + i); ell(0, 0, 9, 5, i % 2 ? '#e0a040' : '#9cc06a', 2.5); g.restore(); }
    if (P.weather !== 'wind') { const n = storm ? 70 : 40; for (let i = 0; i < n; i++) { const x = wx + rnd(i) * ww, y = wy + ((rnd(i + 7) * wh + t * (storm ? 420 : 280)) % (wh + 20)); line([[x, y], [x - (storm ? 7 : 3), y + 16]], 2.5, 'rgba(225,235,255,.7)'); } }
    if (flash > 0) { g.fillStyle = `rgba(255,255,255,${flash * .5})`; g.fillRect(wx, wy, ww, wh); if (flash > .5) line([[wx + 170, wy], [wx + 150, wy + 60], [wx + 175, wy + 70], [wx + 140, wy + 150]], 4, '#fff'); }
    g.restore();
    line([[wx + ww / 2, wy], [wx + ww / 2, wy + wh]], LW); line([[wx, wy + wh / 2], [wx + ww, wy + wh / 2]], LW);
    rrect(wx - 12, wy - 12, ww + 24, wh + 24, 24, null);
    // drops on the glass when wet
    if (P.weather !== 'wind') for (let i = 0; i < 14; i++) ell(wx + rnd(i + 40) * ww, wy + ((rnd(i + 50) * wh + t * 12 * (1 + i % 3)) % wh), 3.5, 4.5, 'rgba(230,240,255,.55)', 0);
  }
  function lightning(t) { let k = 0; for (const at of R.lightning) { const d = (t - at); if (d >= 0 && d < .7) k = Math.max(k, d < .08 ? 1 : d < .16 ? .2 : d < .26 ? .9 : Math.max(0, 1 - (d - .26) / .4) * .4); } return k; }

  // ---------- kitchen
  function kitchen(t, P) {
    g.fillStyle = '#e4efe6'; g.fillRect(0, 0, W, H);
    for (let y = 0; y < 470; y += 48) for (let x = (y / 48) % 2 ? 0 : 24; x < W; x += 48) rrect(x + 2, y + 2, 44, 44, 6, 'rgba(255,255,255,.35)', 0);
    outside(t, P);
    // shelf with jars, hanging plant
    rrect(830, 120, 380, 16, 6, '#c98a55');
    [['#f6c35b', 860, 60], ['#ef8f6e', 930, 74], ['#9fd0c0', 1010, 56], ['#f4e3c1', 1090, 80]].forEach(([c, x, h], i) => { rrect(x, 120 - h, 54, h, 12, c); rrect(x + 6, 120 - h - 14, 42, 16, 6, '#8a5a3a'); });
    line([[1180, 0], [1180, 40]], 3); ell(1180, 60, 34, 22, '#d98b5a'); for (let i = 0; i < 5; i++) { const sw = Math.sin(t * 1.3 + i) * 4; line([[1160 + i * 10, 70], [1150 + i * 12 + sw, 130 + (i % 2) * 30]], 6, '#6fae5e'); }
    // stove + pot (right), counter
    shape(() => { g.moveTo(-40, 470); g.lineTo(1320, 470); g.lineTo(1320, 760); g.lineTo(-40, 760); g.closePath(); }, '#d9a46c');
    g.fillStyle = '#c98f58'; g.fillRect(-40, 500, 1360, 260); line([[-40, 500], [1320, 500]], LW);
    for (let i = 0; i < 6; i++) rrect(30 + i * 220, 540, 180, 160, 16, 'rgba(255,255,255,.12)', 3);
    rrect(860, 440, 320, 40, 12, '#555c66');
    const flame = 1 + .15 * Math.sin(t * 17);
    for (let i = 0; i < 5; i++) ell(960 + i * 30, 444, 7, 10 * flame, '#5aa9ff', 0);
  }

  // ---------- pot: fills with the chopped veg, bubbles, steam
  function pot(t) {
    const x = 1020, y = 390;
    const carrots = seg(t, R.pour[0][0] + 1.2, R.pour[0][1]), onions = seg(t, R.pour[1][0] + 1.2, R.pour[1][1]);
    rrect(x - 110, y - 20, 220, 80, 22, '#e86a4a'); line([[x - 110, y + 5], [x - 140, y]], 9); line([[x + 110, y + 5], [x + 140, y]], 9);
    ell(x, y - 20, 110, 24, '#c94f34');
    ell(x, y - 18, 96, 18, carrots > .5 ? '#f6a14a' : '#f3d7a0', 0);
    for (let i = 0; i < 12; i++) { const a = rnd(i) * TAU, r = rnd(i + 3) * 70; if (i / 12 < carrots) ell(x + Math.cos(a) * r, y - 18 + Math.sin(a) * r * .18, 7, 4, '#ff7b2c', 2); }
    for (let i = 0; i < 14; i++) { const a = rnd(i + 30) * TAU, r = rnd(i + 33) * 70; if (i / 14 < onions) ell(x + Math.cos(a) * r, y - 18 + Math.sin(a) * r * .18, 4, 3, '#4fa84a', 0); }
    for (let i = 0; i < 6; i++) { const k = (t * .9 + rnd(i)) % 1; ell(x - 70 + rnd(i + 9) * 140, y - 20 + rnd(i + 12) * 6, 4 + k * 4, 3 + k * 3, `rgba(255,255,255,${.7 * (1 - k)})`, 0); }
    for (let i = 0; i < 3; i++) { const k = ((t / 2.4 + i / 3) % 1); g.globalAlpha = Math.sin(k * Math.PI) * .6; const sx = x - 50 + i * 50, sy = y - 40 - k * 120; g.beginPath(); g.moveTo(sx, sy + 30); g.bezierCurveTo(sx + 18, sy + 10, sx - 18, sy - 10, sx + Math.sin(k * 5 + i) * 10, sy - 40); g.lineWidth = 7; g.strokeStyle = '#fff'; g.lineCap = 'round'; g.stroke(); g.globalAlpha = 1; }
    return { x, y };
  }

  // ---------- veg on the board: shrinks as it is chopped, slices pile up, then poured into the pot
  const VEG = { carrot: { col: '#ff8a3d', len: 190, thick: 36, top: '#5fae4c' }, onion: { col: '#7cc66a', len: 200, thick: 18, top: '#e9f5dc' } };
  function board(t, draw = true) {
    const bx = 330, by = 445;
    // which vegetable is on the board now
    const c = t < R.pour[0][1] ? R.chops[0] : t > R.chops[1].t0 - 2 && t < R.pour[1][1] ? R.chops[1] : null;
    const pour = c ? R.pour.find((p) => p[2] === c.veg) : null;
    const pk = pour ? seg(t, pour[0], pour[0] + 1.2) * (1 - seg(t, pour[1] - .6, pour[1])) : 0;   // board lifted towards the pot
    const appear = c ? seg(t, c.t0 - 2, c.t0 - .8) : 0;
    if (!draw) return { c, pk, x0: bx + 40 };
    g.save();
    const ox = pk * 520, oy = -pk * 80;
    g.translate(bx + 170 + ox, by + 30 + oy); g.rotate(pk * .35); g.translate(-(bx + 170), -(by + 30));
    rrect(bx, by, 340, 58, 20, '#e7b77d'); ell(bx + 300, by + 14, 8, 6, '#c98f58', 3);
    if (c && appear > 0) {
      const V = VEG[c.veg], times = chopTimes(c), done = times.filter((x) => x <= t).length, total = times.length;
      const slicesOnBoard = pk > .6 ? 0 : done;
      const cutLen = V.len * (done / total), x0 = bx + 40, y0 = by + 22;
      g.globalAlpha = appear;
      // remaining piece (cut from the right)
      if (done < total) {
        const L = V.len - cutLen;
        shape(() => { g.moveTo(x0, y0 - V.thick / 2); g.lineTo(x0 + L, y0 - V.thick / 2 + (c.veg === 'carrot' ? V.thick * .2 * (L / V.len) : 0)); g.lineTo(x0 + L, y0 + V.thick / 2 - (c.veg === 'carrot' ? V.thick * .2 * (L / V.len) : 0)); g.lineTo(x0, y0 + V.thick / 2); g.closePath(); }, V.col, 4);
        for (let i = 0; i < 3; i++) line([[x0 - 4, y0], [x0 - 34, y0 - 16 + i * 14]], 7, V.top);
      }
      // slices: one per chop, a little pile to the right
      for (let i = 0; i < slicesOnBoard; i++) { const sx = x0 + V.len + 22 + (i % 5) * 15 + Math.floor(i / 5) * 7, sy = y0 + 6 - Math.floor(i / 5) * 11; ell(sx, sy, c.veg === 'carrot' ? 9 : 7, c.veg === 'carrot' ? 15 : 8, V.col, 3); if (c.veg === 'carrot') ell(sx, sy, 3.5, 6, '#ffb070', 0); }
      g.globalAlpha = 1;
    }
    g.restore();
    // slices tumbling off the tilted board into the pot
    if (c && pk > .6 && t < pour[0] + 2.8) { const V = VEG[c.veg]; for (let i = 0; i < 7; i++) { const k = clamp((t - pour[0] - 1.1 - i * .13) / .6); if (k > 0 && k < 1) ell(985 + i * 9, 300 + k * 85, 8, 11, V.col, 3); } }
    return { c, pk, x0: bx + 40 };
  }

  // ---------- the cat, with a little bandana, behind the counter
  function cat(t, B, P) {
    const c = B.c;
    let chopY = 0, chopping = false;
    if (c && t > c.t0 && t < c.t1) { chopping = true; const ph = (((t - c.t0 - .3) * c.rate) % 1 + 1) % 1; chopY = -60 * Math.sin(Math.PI * ph) ** 1.5; }  // blade meets the board on each chop
    const stir = R.stir.find(([a, b]) => t > a && t < b), taste = seg(t, R.taste[0], R.taste[0] + 1) * (1 - seg(t, R.taste[1] - 1, R.taste[1]));
    const salt = t > R.salt[0] && t < R.salt[1];
    const happy = taste > .6 || (stir && t - stir[0] > 4 && Math.sin(t * .8) > .3);
    const breathe = Math.sin(t * 1.6) * 3, bob = chopping ? Math.sin(t * c.rate * TAU) * 2 : 0;
    const hx = 640 + (stir ? 60 : 0) * seg(t, (stir || [0])[0], (stir || [0])[0] + 1), hy = 230 + breathe * .4 + bob;
    // body
    shape(() => { g.moveTo(520, 480); g.bezierCurveTo(500, 360, 560, 320, 640, 320 + breathe); g.bezierCurveTo(720, 320 + breathe, 780, 360, 760, 480); g.closePath(); }, '#fff3e4');
    shape(() => { g.moveTo(560, 400); g.quadraticCurveTo(640, 390, 720, 400); g.lineTo(735, 480); g.lineTo(545, 480); g.closePath(); }, '#e86a6a', 4);   // apron
    ell(640, 430, 14, 10, '#fff', 3);
    // head
    g.save(); g.translate(hx, hy); g.rotate((taste ? -.06 : 0) + (stir ? .04 * Math.sin(t * 2) : 0));
    shape(() => { g.moveTo(-120, -60); g.lineTo(-96, -150); g.lineTo(-40, -100); g.closePath(); }, '#f0a868');
    shape(() => { g.moveTo(120, -60); g.lineTo(96, -150); g.lineTo(40, -100); g.closePath(); }, '#f0a868');
    ell(0, 0, 150, 125, '#fff3e4');
    // bandana
    shape(() => { g.moveTo(-128, -62); g.quadraticCurveTo(0, -150, 128, -62); g.quadraticCurveTo(0, -100, -128, -62); }, '#e86a6a', 4);
    for (let i = 0; i < 6; i++) ell(-80 + i * 32, -92 + Math.abs(i - 2.5) * 6, 5, 4, '#fff', 0);
    shape(() => { g.moveTo(120, -64); g.lineTo(165, -90 + Math.sin(t * 3) * 4); g.lineTo(158, -50); g.closePath(); }, '#e86a6a', 4);
    ell(-70, 30, 22, 13, 'rgba(255,150,140,.55)', 0); ell(70, 30, 22, 13, 'rgba(255,150,140,.55)', 0);
    const look = chopping ? 10 : stir ? 6 : 0, blink = (t % 4.7) < .14;
    for (const s of [-1, 1]) {
      const ex = s * 48, ey = 8 + look;
      if (happy) arc(ex, ey + 8, 16, Math.PI * 1.15, Math.PI * 1.85, 5);
      else if (blink) line([[ex - 13, ey + 2], [ex + 13, ey + 2]], 4.5);
      else { ell(ex + look * .3, ey, 13, 16, INK, 0); ell(ex + look * .3 - 4, ey - 6, 5, 5, '#fff', 0); }
    }
    const mo = taste > .6 ? Math.sin(t * 12) * 3 : 0;
    line([[-16, 42 + mo * .4], [-8, 50 + mo], [0, 42], [8, 50 + mo], [16, 42 + mo * .4]], 4);
    for (const s of [-1, 1]) { line([[s * 110, 25], [s * 160, 15]], 3.5); line([[s * 110, 40], [s * 158, 44]], 3.5); }
    g.restore();
    if (happy) for (let i = 0; i < 2; i++) { const k = (t * .7 + i * .5) % 1; g.globalAlpha = 1 - k; heart(hx + 140 + i * 26, hy - 70 - k * 60, 13); g.globalAlpha = 1; }
    // paws are drawn after the board and pot so they sit in front of them
    later.push(() => {
      const P2 = { x: 1020, y: 390 };
      if (chopping) {
        const V = VEG[c.veg], times = chopTimes(c), done = times.filter((x) => x <= t).length, kx = B.x0 + V.len * (1 - done / times.length) + 4;
        paw(B.x0 - 2, 476);                                    // holding the vegetable by its leafy end
        const ky = 425 + chopY;                                  // knife: blade comes down to the board
        rrect(kx - 3, ky - 70, 12, 50, 4, '#7a4a2a'); shape(() => { g.moveTo(kx - 6, ky - 22); g.lineTo(kx + 14, ky - 22); g.lineTo(kx + 10, ky + 30); g.lineTo(kx - 6, ky + 26); g.closePath(); }, '#e6edf2', 3.5);
        paw(kx + 4, ky - 50);
      } else if (stir) {
        const a = t * 2.4, sx = P2.x + Math.cos(a) * 50, sy = P2.y - 20 + Math.sin(a) * 9;
        line([[sx, sy], [sx - 40, sy - 120]], 9, '#b57a45'); ell(sx, sy, 16, 9, '#b57a45', 3); paw(sx - 40, sy - 120);
        paw(700, 470);
      } else if (taste > 0) {
        const sx = lerp(P2.x - 40, hx + 10, taste), sy = lerp(P2.y - 30, hy + 70, taste);
        line([[sx, sy], [sx + 30, sy + 90]], 9, '#b57a45'); ell(sx, sy, 16, 9, '#b57a45', 3); paw(sx + 30, sy + 90); paw(560, 470);
      } else if (salt) {
        const sh = Math.sin(t * 18) * 10, sx = P2.x - 10, sy = P2.y - 130 + sh;
        rrect(sx - 18, sy - 40, 36, 50, 12, '#ffffff'); rrect(sx - 18, sy - 52, 36, 16, 6, '#c0c8d0'); paw(sx, sy + 6);
        for (let i = 0; i < 8; i++) { const k = (t * 3 + rnd(i)) % 1; ell(sx - 10 + rnd(i + 2) * 20, sy + 20 + k * 80, 2, 2, '#fff', 0); }
        paw(560, 470);
      } else { paw(560, 470); paw(720, 470); }
    });
  }
  function paw(x, y) { ell(x, y, 30, 23, '#fff3e4'); line([[x - 9, y + 5], [x - 9, y + 14]], 3); line([[x + 4, y + 5], [x + 4, y + 15]], 3); }
  function heart(x, y, s) { shape(() => { g.moveTo(x, y + s); g.bezierCurveTo(x - s * 2, y - s * .4, x - s * .6, y - s * 1.7, x, y - s * .5); g.bezierCurveTo(x + s * .6, y - s * 1.7, x + s * 2, y - s * .4, x, y + s); }, '#ff7a8a', 3); }

  window.renderKitchen = function (ctx, t, opts) {
    g = ctx; later = []; t = ((t % END) + END) % END;
    const P = Object.assign({ weather: 'rain' }, opts || {});
    const z = 1.34 + .02 * Math.sin(TAU * t / END), cx = 690 + 10 * Math.sin(TAU * t / END), cy = 318;
    g.save(); g.translate(W / 2, H / 2); g.scale(z, z); g.translate(-cx, -cy);
    kitchen(t, P); pot(t); const B = board(t, false); cat(t, B, P); board(t); later.forEach((f) => f());  // board sits in front of the cat
    g.restore();
    if (P.weather === 'storm') { const f = lightning(t); if (f > 0) { g.fillStyle = `rgba(220,230,255,${f * .18})`; g.fillRect(0, 0, W, H); } }
    const dip = Math.max(0, 1 - t / .9, (t - (END - .9)) / .9);
    if (dip > 0) { g.fillStyle = `rgba(30,18,10,${ease(dip) * .95})`; g.fillRect(0, 0, W, H); }
  };
  window.kitchenSounds = function (opts) {
    const P = Object.assign({ weather: 'rain' }, opts || {}), ev = [];
    for (const c of R.chops) for (const x of chopTimes(c)) ev.push([x - .02, 'asmr_chop', .5]);
    for (const p of R.pour) ev.push([p[0] + 1.2, 'asmr_drop', .8]);
    for (const [a, b] of R.stir) for (let x = a + .3; x < b - 2.5; x += 3) ev.push([x, 'asmr_stir', .5]);
    ev.push([R.taste[0] + 1, 'asmr_sip', .7]); ev.push([R.salt[0] + .2, 'asmr_sprinkle', .8]);
    if (P.weather === 'storm') for (const at of R.lightning) ev.push([at + 1.0, 'thunder', .9]);
    const beds = [[P.weather === 'wind' ? 'amb_wind' : 'amb_rain', P.weather === 'storm' ? .045 : .03], ['asmr_simmer', .018], ['music_calm', .04]];
    return { events: ev, beds, loop: END };
  };
})();
