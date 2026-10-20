// Story Studio — calm, low-motion loops made for long sleep / study videos (flat colours, bold outlines).
//   renderSleep(ctx, t, {weather})  — cat asleep in a basket by a rainy window          (40 s loop)
//   renderLofi(ctx, t, {weather})   — cat with headphones at a laptop, nodding along      (48 s loop)
//   renderFarm(ctx, t)              — a farm seen from above, a dog runs by now and then   (60 s loop)
// Every motion repeats exactly within its loop, so the renderer can repeat a loop for 90 minutes without a jump.
(function () {
  const W = 1280, H = 720, INK = '#3b2a22', LW = 5, TAU = Math.PI * 2;
  let g, LOOP = 40;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const ease = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
  const seg = (t, a, b) => ease((t - a) / (b - a));
  const bump = (t, a, b) => Math.sin(Math.PI * clamp((t - a) / (b - a)));   // 0 → 1 → 0 between a and b
  const per = (t, cycles) => TAU * cycles * t / LOOP;                         // angle that loops exactly
  const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  function shape(path, fill, lw = LW) { g.beginPath(); path(); if (fill) { g.fillStyle = fill; g.fill(); } if (lw) { g.lineWidth = lw; g.strokeStyle = INK; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); } }
  const ell = (x, y, rx, ry, fill, lw, rot = 0) => shape(() => g.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), rot, 0, TAU), fill, lw);
  function rrect(x, y, w, h, r, fill, lw) { shape(() => { g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }, fill, lw); }
  function line(pts, lw = LW, col = INK) { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.lineWidth = lw; g.strokeStyle = col; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(); }
  function arc(x, y, r, a0, a1, lw = LW, col = INK) { g.beginPath(); g.arc(x, y, r, a0, a1); g.lineWidth = lw; g.strokeStyle = col; g.lineCap = 'round'; g.stroke(); }
  function text(s, x, y, size, col, a = 1) { g.globalAlpha = a; g.font = `700 ${size}px Fredoka, 'Arial Rounded MT Bold', sans-serif`; g.fillStyle = col; g.strokeStyle = INK; g.lineWidth = 4; g.textAlign = 'center'; g.strokeText(s, x, y); g.fillText(s, x, y); g.globalAlpha = 1; }
  function camera(t, z, cx, cy, draw) { g.save(); g.translate(W / 2, H / 2); g.scale(z, z); g.translate(-cx, -cy); draw(); g.restore(); }
  function vignette(a = .3) { const gr = g.createRadialGradient(W / 2, H / 2, H * .4, W / 2, H / 2, H * 1.05); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(20,10,30,${a})`); g.fillStyle = gr; g.fillRect(0, 0, W, H); }

  // night window with weather — shared by the sleep and lofi scenes
  function nightWindow(t, wx, wy, ww, wh, weather) {
    rrect(wx - 12, wy - 12, ww + 24, wh + 24, 22, '#f3e6d6');
    g.save(); g.beginPath(); g.rect(wx, wy, ww, wh); g.clip();
    const storm = weather === 'storm', flash = storm ? Math.max(0, 1 - Math.abs(((t % LOOP) - LOOP * .55)) / .25) : 0;
    g.fillStyle = flash > .3 ? '#8d9cc4' : '#24315a'; g.fillRect(wx, wy, ww, wh);
    for (let i = 0; i < 30; i++) ell(wx + rnd(i) * ww, wy + rnd(i + 5) * wh * .6, 1.6, 1.6, `rgba(255,255,230,${.4 + .4 * Math.sin(per(t, 2 + i % 3) + i)})`, 0);
    ell(wx + ww * .75, wy + 55, 26, 26, '#fff4c8', 0); ell(wx + ww * .75 + 10, wy + 50, 22, 22, flash > .3 ? '#8d9cc4' : '#24315a', 0);
    g.fillStyle = '#1b2646'; g.beginPath(); g.moveTo(wx, wy + wh); for (let x = wx; x <= wx + ww; x += 12) g.lineTo(x, wy + wh * .72 - 14 * Math.sin(x * .04)); g.lineTo(wx + ww, wy + wh); g.fill();
    for (let i = 0; i < 7; i++) { const x = wx + 20 + i * ww / 7, y = wy + wh * .8 + (i % 2) * 10; g.fillStyle = `rgba(255,205,120,${.7 + .3 * Math.sin(per(t, 1 + i % 2) + i)})`; g.fillRect(x, y, 6, 6); }
    if (weather !== 'clear') { const n = storm ? 60 : 36, fi = Math.floor((t % LOOP) * 30); for (let i = 0; i < n; i++) { const x = wx + rnd(i * 3.1 + fi * .7) * ww, y = wy + rnd(i * 7.7 + fi * 1.3) * wh; line([[x, y], [x - 3, y + 14]], 2.2, 'rgba(200,215,255,.55)'); } }
    g.restore();
    line([[wx + ww / 2, wy], [wx + ww / 2, wy + wh]], LW); line([[wx, wy + wh / 2], [wx + ww, wy + wh / 2]], LW); rrect(wx - 12, wy - 12, ww + 24, wh + 24, 22, null);
    if (weather !== 'clear') for (let i = 0; i < 12; i++) ell(wx + rnd(i + 40) * ww, wy + ((rnd(i + 50) * wh + t * 9 * (1 + i % 3)) % wh), 3, 4, 'rgba(220,230,255,.5)', 0);
    return flash;
  }
  // cat head (original design: cream, ginger ears and tuft); eyes: 'sleep' | 'lazy' | 'blink' | 'yawn'
  function catHead(x, y, rot, eyes, opts = {}) {
    g.save(); g.translate(x, y); g.rotate(rot);
    const tw = opts.earTwitch || 0;
    g.save(); g.translate(-96, -110); g.rotate(-tw * .25); g.translate(96, 110);
    shape(() => { g.moveTo(-120, -60); g.lineTo(-96, -150); g.lineTo(-40, -100); g.closePath(); }, '#f0a868'); ell(-90, -108, 9, 16, '#ffb3a7', 0, -.3); g.restore();
    shape(() => { g.moveTo(120, -60); g.lineTo(96, -150); g.lineTo(40, -100); g.closePath(); }, '#f0a868'); ell(90, -108, 9, 16, '#ffb3a7', 0, .3);
    ell(0, 0, 150, 125, '#fff3e4');
    shape(() => { g.moveTo(-30, -122); g.quadraticCurveTo(0, -70, 40, -118); }, '#f0a868', 0);
    ell(-70, 30, 22, 13, 'rgba(255,150,140,.55)', 0); ell(70, 30, 22, 13, 'rgba(255,150,140,.55)', 0);
    for (const s of [-1, 1]) {
      const ex = s * 48, ey = 8;
      if (eyes === 'sleep' || eyes === 'yawn' || eyes === 'blink') arc(ex, ey - 2, 16, Math.PI * .15, Math.PI * .85, 5);          // closed, peaceful
      else { ell(ex, ey + 2, 13, 13, INK, 0); ell(ex - 4, ey - 2, 4, 4, '#fff', 0); g.fillStyle = '#fff3e4'; g.fillRect(ex - 16, ey - 16, 32, 13 + (opts.lid || 0) * 6); line([[ex - 15, ey - 3 + (opts.lid || 0) * 6], [ex + 15, ey - 3 + (opts.lid || 0) * 6]], 4.5); } // heavy, lazy lids
    }
    const yawn = opts.yawn || 0;
    if (yawn > .05) { ell(0, 52, 18 * yawn + 4, 26 * yawn + 3, '#b5485a', 4); ell(0, 62 + 10 * yawn, 10 * yawn, 6 * yawn, '#ff8a9a', 0); }
    else line([[-16, 42], [-8, 50], [0, 42], [8, 50], [16, 42]], 4);
    for (const s of [-1, 1]) { line([[s * 110, 25], [s * 160, 15]], 3.5); line([[s * 110, 40], [s * 158, 44]], 3.5); }
    g.restore();
  }

  // ======================= 1. sleeping cat =======================
  function renderSleep(ctx, t, opts) {
    g = ctx; LOOP = 40; t = ((t % LOOP) + LOOP) % LOOP; const P = Object.assign({ weather: 'rain' }, opts || {});
    camera(t, 1.18 + .015 * Math.sin(per(t, 1)), 650, 380, () => {
      g.fillStyle = '#3c3a5c'; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 26; i++) ell(rnd(i) * W, rnd(i + 2) * 470, 26, 3, 'rgba(255,255,255,.05)', 0);
      const flash = nightWindow(t, 120, 70, 330, 260, P.weather);
      // lamp glow, breathing slowly
      const glow = .9 + .1 * Math.sin(per(t, 2));
      const gr = g.createRadialGradient(1050, 300, 10, 1050, 300, 420 * glow); gr.addColorStop(0, 'rgba(255,200,120,.45)'); gr.addColorStop(1, 'rgba(255,200,120,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      line([[1050, 300], [1050, 470]], 8, '#6b4a30'); shape(() => { g.moveTo(990, 300); g.lineTo(1110, 300); g.lineTo(1085, 220); g.lineTo(1015, 220); g.closePath(); }, '#ffd58a'); ell(1050, 478, 50, 12, '#6b4a30');
      // floor, rug
      shape(() => { g.moveTo(-40, 470); g.lineTo(1320, 470); g.lineTo(1320, 760); g.lineTo(-40, 760); g.closePath(); }, '#5a4a6e');
      ell(650, 600, 470, 110, '#7d6a9c'); ell(650, 600, 410, 85, null, 4);
      // basket
      ell(650, 560, 300, 90, '#c98a55'); ell(650, 520, 270, 70, '#a5683a', 4);
      for (let i = -6; i <= 6; i++) arc(650 + i * 42, 610, 30, Math.PI * 1.1, Math.PI * 1.9, 3, 'rgba(59,42,34,.4)');
      // blanket
      shape(() => { g.moveTo(420, 540); g.quadraticCurveTo(650, 470, 880, 540); g.quadraticCurveTo(870, 600, 650, 610); g.quadraticCurveTo(430, 600, 420, 540); }, '#e8a0a0');
      for (let i = 0; i < 6; i++) ell(470 + i * 75, 560 + (i % 2) * 12, 7, 7, '#fff', 0);
      // the cat: curled up, breathing
      const br = Math.sin(per(t, 10)), ear = bump(t, 18, 18.6) + bump(t, 18.8, 19.3), tail = bump(t, 29, 31);
      g.save(); g.translate(650, 500); g.scale(1, 1 + br * .03);
      ell(30, -10, 190, 80, '#fff3e4'); ell(60, -40, 120, 36, 'rgba(255,220,180,.35)', 0);
      g.beginPath(); g.moveTo(200, 10); g.quadraticCurveTo(230 + tail * 20, -40 - tail * 30, 160 + tail * 10, -70 - tail * 20); g.lineWidth = 30; g.strokeStyle = INK; g.lineCap = 'round'; g.stroke();
      g.beginPath(); g.moveTo(200, 10); g.quadraticCurveTo(230 + tail * 20, -40 - tail * 30, 160 + tail * 10, -70 - tail * 20); g.lineWidth = 21; g.strokeStyle = '#fff3e4'; g.stroke();
      ell(160 + tail * 10, -70 - tail * 20, 10, 10, '#f0a868', 0);
      g.restore();
      g.save(); g.translate(470, 470 + br * 3); g.scale(.62, .62); catHead(0, 0, -.25, 'sleep', { earTwitch: ear }); g.restore();
      ell(530, 520 + br * 2, 32, 20, '#fff3e4');   // paw under the chin
      // z z z
      for (let i = 0; i < 3; i++) { const k = ((t / 4 + i / 3) % 1); text('z', 540 + k * 50 + i * 6, 410 - k * 140, 24 + k * 22, '#cfd6ff', Math.sin(k * Math.PI)); }
      if (flash > 0) { g.fillStyle = `rgba(220,230,255,${flash * .15})`; g.fillRect(0, 0, W, H); }
    });
    vignette(.4);
  }
  function sleepSounds(opts) {
    const P = Object.assign({ weather: 'rain' }, opts || {}), ev = [];
    if (P.weather === 'storm') ev.push([40 * .55 + 1.1, 'thunder', .8]);
    return { events: ev, beds: [[P.weather === 'clear' ? 'amb_night' : 'amb_rain', P.weather === 'storm' ? .05 : .035], ['asmr_purr', .02], ['clock', .006], ['music_calm', .02]], loop: 40 };
  }

  // ======================= 2. lofi cat with headphones =======================
  function renderLofi(ctx, t, opts) {
    g = ctx; LOOP = 94; t = ((t % LOOP) + LOOP) % LOOP; const P = Object.assign({ weather: 'rain' }, opts || {});  // loop = the lofi track's length
    const beat = Math.sin(per(t, 118)), nod = Math.max(0, beat) * 6;   // ~75 bpm nod, whole beats per loop
    const te = t % 47, yawn = bump(t, 20, 23.5), blink = bump(te, 9, 9.35) + bump(te, 33, 33.35), ear = bump(te, 36, 36.5) + bump(t, 70, 70.4);
    camera(t, 1.12, 640, 360, () => {
      g.fillStyle = '#2d3a5c'; g.fillRect(0, 0, W, H);
      nightWindow(t, 90, 60, 420, 300, P.weather);
      // shelf, plant, posters
      rrect(800, 110, 360, 14, 6, '#8a5a3a'); [['#f6c35b', 820], ['#9fd0c0', 880], ['#ef8f6e', 940]].forEach(([c, x], i) => rrect(x, 40 + i * 6, 44, 70 - i * 6, 8, c));
      ell(1080, 80, 30, 26, '#d98b5a'); for (let i = 0; i < 5; i++) line([[1065 + i * 8, 70], [1050 + i * 12 + Math.sin(per(t, 2) + i) * 3, 20 - (i % 2) * 14]], 6, '#6fae5e');
      // desk lamp glow
      const gr = g.createRadialGradient(1100, 330, 10, 1100, 330, 380); gr.addColorStop(0, 'rgba(255,200,120,.35)'); gr.addColorStop(1, 'rgba(255,200,120,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      line([[1150, 470], [1130, 360], [1080, 320]], 7, '#ffcf6a'); shape(() => { g.moveTo(1040, 340); g.lineTo(1100, 290); g.lineTo(1120, 330); g.closePath(); }, '#ffcf6a');
      // cat (body behind the desk), headphones
      const tailA = Math.sin(per(t, 12)) * 14;
      shape(() => { g.moveTo(500, 520); g.bezierCurveTo(480, 400, 540, 350, 640, 350); g.bezierCurveTo(740, 350, 800, 400, 780, 520); g.closePath(); }, '#fff3e4');
      g.beginPath(); g.moveTo(780, 480); g.quadraticCurveTo(860, 470 + tailA, 870, 400 + tailA); g.lineWidth = 30; g.strokeStyle = INK; g.lineCap = 'round'; g.stroke(); g.beginPath(); g.moveTo(780, 480); g.quadraticCurveTo(860, 470 + tailA, 870, 400 + tailA); g.lineWidth = 21; g.strokeStyle = '#fff3e4'; g.stroke();
      const hx = 640, hy = 250 + nod - yawn * 8, rot = Math.sin(per(t, 59)) * .04 - yawn * .08;
      catHead(hx, hy, rot, blink > .5 || yawn > .4 ? 'blink' : 'lazy', { lid: .6, yawn, earTwitch: ear });
      g.save(); g.translate(hx, hy); g.rotate(rot);
      arc(0, -20, 150, Math.PI * 1.08, Math.PI * 1.92, 16, INK); arc(0, -20, 150, Math.PI * 1.08, Math.PI * 1.92, 9, '#9fb8ff');
      rrect(-178, -40, 50, 90, 22, '#9fb8ff'); rrect(128, -40, 50, 90, 22, '#9fb8ff'); ell(-153, 5, 12, 22, '#ffd6e0', 0); ell(153, 5, 12, 22, '#ffd6e0', 0);
      g.restore();
      // desk, laptop (screen glow on the cat), mug with steam
      shape(() => { g.moveTo(-40, 500); g.lineTo(1320, 500); g.lineTo(1320, 760); g.lineTo(-40, 760); g.closePath(); }, '#a8714a');
      g.fillStyle = '#93603c'; g.fillRect(-40, 530, 1360, 230); line([[-40, 530], [1320, 530]], LW);
      shape(() => { g.moveTo(470, 520); g.lineTo(810, 520); g.lineTo(840, 545); g.lineTo(440, 545); g.closePath(); }, '#c9d2e0');
      shape(() => { g.moveTo(490, 520); g.lineTo(510, 400); g.lineTo(770, 400); g.lineTo(790, 520); g.closePath(); }, '#7d8aa3');
      g.fillStyle = 'rgba(160,200,255,.07)'; g.beginPath(); g.moveTo(510, 400); g.lineTo(380, 250); g.lineTo(900, 250); g.lineTo(770, 400); g.fill();
      for (let i = 0; i < 14; i++) { const h = 8 + 26 * Math.abs(Math.sin(per(t, 118) * .5 + i * .7) * Math.sin(per(t, 59) + i)); rrect(560 + i * 12, 470 - h, 7, h, 3, '#bfe0ff', 0); }
      ell(640, 430, 12, 12, '#bfe0ff', 0);
      rrect(950, 440, 80, 75, 22, '#f2a7a7'); arc(1036, 475, 16, -Math.PI / 2, Math.PI / 2, LW); ell(990, 444, 34, 8, '#8a5a3a', 3);
      for (let i = 0; i < 2; i++) { const k = ((t / 3 + i * .5) % 1); g.globalAlpha = Math.sin(k * Math.PI) * .6; const x = 975 + i * 26, y = 420 - k * 80; g.beginPath(); g.moveTo(x, y + 25); g.bezierCurveTo(x + 12, y + 10, x - 12, y, x + Math.sin(k * 6) * 6, y - 20); g.lineWidth = 4; g.strokeStyle = '#fff'; g.stroke(); g.globalAlpha = 1; }
      ell(560, 515, 30, 20, '#fff3e4'); ell(720, 515, 30, 20, '#fff3e4');   // paws on the desk
      // notes floating from the headphones
      for (let i = 0; i < 4; i++) { const k = ((t / (94 / 15) + i / 4) % 1), side = i % 2 ? 1 : -1; text(i % 3 ? '♪' : '♫', hx + side * (190 + k * 40), hy - 20 - k * 160, 30 + k * 10, i % 2 ? '#ffd76a' : '#ffb3c8', Math.sin(k * Math.PI)); }
    });
    vignette(.35);
  }
  function lofiSounds(opts) {
    const P = Object.assign({ weather: 'rain' }, opts || {});
    return { events: [], beds: [['music_lofi', .09], [P.weather === 'clear' ? 'amb_night' : 'amb_rain', .02]], loop: 94 };
  }

  // ======================= 3. farm seen from above =======================
  function renderFarm(ctx, t) {
    g = ctx; LOOP = 60; t = ((t % LOOP) + LOOP) % LOOP;
    camera(t, 1.05, 640, 360, () => {
      g.fillStyle = '#8cc46a'; g.fillRect(-100, -100, W + 200, H + 200);
      // patchwork fields with crop rows
      [[60, 40, 360, 230, '#b9d77a'], [440, 30, 330, 200, '#e8cf7a'], [60, 300, 300, 200, '#9fcf6e'], [880, 400, 360, 280, '#d8b96a']].forEach(([x, y, w, h, c], i) => {
        rrect(x, y, w, h, 18, c, 4); g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); for (let r = 0; r < 14; r++) line([[x + r * 26 + 10, y], [x + r * 26 + 10, y + h]], 4, i === 1 ? 'rgba(160,120,40,.35)' : 'rgba(60,110,40,.35)'); g.restore();
      });
      // dirt path the dog runs along
      g.beginPath(); g.moveTo(-60, 560); g.bezierCurveTo(300, 520, 500, 620, 760, 560); g.bezierCurveTo(950, 520, 1100, 380, 1340, 360); g.lineWidth = 46; g.strokeStyle = '#d9b483'; g.lineCap = 'round'; g.stroke();
      // pond with ripples
      ell(640, 330, 120, 70, '#7fc4e0'); ell(640, 330, 120, 70, null, 5);
      for (let i = 0; i < 3; i++) { const k = ((t / 5 + i / 3) % 1); g.globalAlpha = 1 - k; ell(600 + i * 30, 320 + (i % 2) * 15, 10 + k * 40, 6 + k * 20, null, 2.5); g.globalAlpha = 1; }
      ell(700, 345, 14, 8, '#fff', 3); ell(712, 338, 6, 5, '#fff', 3);   // a duck
      // farmhouse + barn roofs from above
      rrect(830, 70, 210, 150, 10, '#e07a5a'); line([[830, 145], [1040, 145]], 5); rrect(1000, 90, 26, 26, 4, '#9a6a4a');
      rrect(1080, 160, 150, 200, 10, '#c94f40'); line([[1155, 160], [1155, 360]], 5);
      // fence
      for (let i = 0; i < 16; i++) { ell(860 + i * 24, 390, 5, 5, '#8a5a3a', 3); } line([[860, 390], [1220, 390]], 4, '#8a5a3a');
      // cows grazing (heads dip slowly), chickens pecking
      [[960, 300, 0], [1010, 250, 1.3], [935, 245, 2.1]].forEach(([x, y, o]) => { const d = Math.sin(per(t, 3) + o) * 6; ell(x, y, 30, 18, '#ffffff'); ell(x - 8, y - 4, 9, 7, INK, 0); ell(x + 10, y + 6, 7, 5, INK, 0); ell(x + 34 + d, y, 12, 10, '#ffffff'); });
      for (let i = 0; i < 6; i++) { const x = 770 + (i % 3) * 26, y = 470 + Math.floor(i / 3) * 24, pk = Math.max(0, Math.sin(per(t, 12) + i * 1.7)) * 4; ell(x, y, 9, 7, i % 2 ? '#fff' : '#e3a25a', 2.5); ell(x + 9 + pk, y, 4, 4, '#e3a25a', 2); }
      // trees from above, gently swaying
      [[40, 640, 70], [180, 660, 56], [520, 690, 64], [780, 230, 46], [440, 270, 52], [1240, 600, 70], [380, 470, 40], [300, 240, 44]].forEach(([x, y, r], i) => {
        const sx = Math.sin(per(t, 15) + i) * 4, sy = Math.cos(per(t, 15) + i * 1.3) * 3;
        ell(x + 12, y + 14, r, r * .9, 'rgba(40,70,30,.3)', 0); ell(x + sx, y + sy, r, r * .92, '#4f9a4a'); ell(x + sx - r * .25, y + sy - r * .25, r * .45, r * .4, '#6fb85e', 0);
      });
      // the dog runs the path once per loop
      const dk = clamp((t - 24) / 7);
      if (dk > 0 && dk < 1) {
        const u = dk, px = -60 + u * 1400, py = u < .58 ? 560 + Math.sin(u / .58 * Math.PI * 2) * 25 : 560 - (u - .58) / .42 * 200, leg = Math.sin(t * 30) * 6;
        g.save(); g.translate(px, py); g.rotate(u < .58 ? 0 : -.35); g.scale(1.6, 1.6);
        ell(-14, leg, 6, 4, '#a0622e', 0); ell(14, -leg, 6, 4, '#a0622e', 0); ell(0, 0, 26, 13, '#c47a3a'); ell(26, 0, 12, 11, '#c47a3a'); ell(30, -9, 5, 7, '#7a4a20', 0); ell(30, 9, 5, 7, '#7a4a20', 0); line([[-26, 0], [-40, Math.sin(t * 20) * 6]], 5, '#c47a3a');
        g.restore();
      }
      // a bird crosses, and cloud shadows drift over everything
      const bk = clamp((t - 44) / 6); if (bk > 0 && bk < 1) { const bx = 1340 - bk * 1450, by = 120 + bk * 80, fl = Math.sin(t * 16) * 8; line([[bx - 14, by - fl], [bx, by], [bx + 14, by - fl]], 4); }
      for (let i = 0; i < 3; i++) { const x = ((t / LOOP + i / 3) % 1) * (W + 700) - 350, y = 120 + i * 230; ell(x, y, 260, 110, 'rgba(20,40,30,.13)', 0); ell(x + 140, y + 30, 160, 80, 'rgba(20,40,30,.13)', 0); }
    });
    const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, 'rgba(255,240,200,.12)'); gr.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  }
  function farmSounds() {
    return { events: [[25.2, 'dog_bark', .5], [6, 'rooster', .25]], beds: [['amb_farm', .04], ['amb_birds', .02], ['amb_wind', .012], ['music_calm', .02]], loop: 60 };
  }

  Object.assign(window, { renderSleep, sleepSounds, renderLofi, lofiSounds, renderFarm, farmSounds });
})();
