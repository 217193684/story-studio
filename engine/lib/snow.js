// Story Studio — snowy calm loops (needs kitty.js loaded first).
//   renderCabin(ctx, t)  — a cabin in the snowy mountains at night: falling snow, chimney smoke, Kitty in the window (60 s loop)
//   renderStudy(ctx, t)  — Kitty studying at a desk by a big window onto snowy mountains, glancing outside (60 s loop)
// Every motion repeats exactly within the loop, so it can be repeated for hours without a jump.
(function () {
  const W = 1280, H = 720, INK = '#3a2520', LW = 5, TAU = Math.PI * 2, LOOP = 60;
  let g;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const ease = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
  const seg = (t, a, b) => ease((t - a) / (b - a));
  const bump = (t, a, b) => Math.sin(Math.PI * clamp((t - a) / (b - a)));
  const per = (t, cycles) => TAU * cycles * t / LOOP;
  const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const mod = (a, b) => ((a % b) + b) % b;
  function shape(path, fill, lw = LW, col = INK) { g.beginPath(); path(); if (fill) { g.fillStyle = fill; g.fill(); } if (lw) { g.lineWidth = lw; g.strokeStyle = col; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); } }
  const ell = (x, y, rx, ry, fill, lw, rot = 0) => shape(() => g.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), rot, 0, TAU), fill, lw);
  const poly = (pts, fill, lw = LW, col = INK) => shape(() => { g.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) g.lineTo(p[0], p[1]); g.closePath(); }, fill, lw, col);
  function rrect(x, y, w, h, r, fill, lw = LW) { shape(() => { g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }, fill, lw); }
  function line(pts, lw = LW, col = INK) { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.lineWidth = lw; g.strokeStyle = col; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(); }
  function glow(x, y, r, col, a) { const gr = g.createRadialGradient(x, y, 2, x, y, r); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
  function vignette(a) { const gr = g.createRadialGradient(W / 2, H / 2, H * .45, W / 2, H / 2, H * 1.05); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(15,12,40,${a})`); g.fillStyle = gr; g.fillRect(0, 0, W, H); }

  // falling snow: each flake falls a whole number of times per loop, so the loop is seamless
  function snow(t, n, size, cycles, x0, y0, w, h, seed, col = 'rgba(255,255,255,.9)') {
    for (let i = 0; i < n; i++) {
      const c = cycles + (i % 2), y = y0 - 10 + mod(rnd(i + seed) * (h + 20) + c * (h + 20) * t / LOOP, h + 20);
      const x = x0 + rnd(i * 3.3 + seed) * w + Math.sin(per(t, c * 2) + i) * 9;
      ell(x, y, size * (.7 + .5 * rnd(i + seed * 2)), size * (.7 + .5 * rnd(i + seed * 2)), col, 0);
    }
  }
  function stars(t, n, x0, y0, w, h, seed) {
    for (let i = 0; i < n; i++) { const a = .35 + .4 * Math.sin(per(t, 2 + i % 4) + i); ell(x0 + rnd(i + seed) * w, y0 + rnd(i * 1.7 + seed) * h, 1.6 + rnd(i) * 1.4, 1.6 + rnd(i) * 1.4, `rgba(255,250,225,${a})`, 0); }
  }
  function pine(x, y, s, col = '#1f2b5c', capped = true) {
    for (let k = 0; k < 3; k++) {
      const w = (46 - k * 11) * s, top = y - (40 + k * 30) * s, base = y - k * 28 * s;
      poly([[x - w, base], [x, top - 22 * s], [x + w, base]], col, 3.5 * Math.min(1, s + .3));
      if (capped) shape(() => { g.moveTo(x - w * .45, top + 4 * s); g.lineTo(x, top - 22 * s); g.lineTo(x + w * .45, top + 4 * s); g.quadraticCurveTo(x, top + 12 * s, x - w * .45, top + 4 * s); }, '#f6f4fb', 0);
    }
    rrect(x - 5 * s, y - 2, 10 * s, 14 * s, 2, '#5a3a2a', 3);
  }
  function mountain(px, py, lx, ly, rx, ry, col) {
    poly([[lx, ly], [px, py], [rx, ry]], col, 4);
    const k = .7, bx = px + (rx - px) * k, by = py + (ry - py) * k;          // warm moonlit edge on the right ridge
    poly([[px, py], [bx, by], [bx - 34, by + 10], [px - 8, py + 34]], '#f2bfa4', 0);
    line([[px, py], [bx, by]], 4, '#f7d77c');
    poly([[px, py], [px - 24, py + 40], [px - 8, py + 32], [px + 8, py + 46], [px + 20, py + 30]], '#fbf7ff', 0);
    poly([[lx, ly], [px, py], [rx, ry]], null, 4);
  }

  // ======================= 1. cabin in the snowy mountains =======================
  function renderCabin(ctx, t) {
    g = ctx; t = mod(t, LOOP);
    const sky = g.createLinearGradient(0, 0, 0, 520); sky.addColorStop(0, '#16204a'); sky.addColorStop(1, '#3b57a3'); g.fillStyle = sky; g.fillRect(0, 0, W, H);
    stars(t, 80, 0, 0, W, 330, 3);
    glow(190, 110, 120, '255,240,200', .25); ell(190, 110, 36, 36, '#fff4d6', 0); ell(204, 102, 30, 30, '#1c2752', 0);   // crescent moon
    const sh = clamp((t - 12) / 1.1); if (sh > 0 && sh < 1) { const x = 1100 - sh * 380, y = 70 + sh * 110; line([[x, y], [x + 60, y - 18]], 3, `rgba(255,250,220,${Math.sin(sh * Math.PI) * .9})`); }   // shooting star
    mountain(170, 120, -80, 520, 430, 520, '#2b3f87'); mountain(450, 190, 250, 520, 720, 520, '#25387a'); mountain(1150, 90, 800, 560, 1450, 560, '#2b3f87');
    // rolling snow hills with soft gold contour lines
    shape(() => { g.moveTo(-20, 430); g.bezierCurveTo(260, 380, 520, 470, 760, 470); g.bezierCurveTo(960, 470, 1100, 400, 1300, 380); g.lineTo(1300, 740); g.lineTo(-20, 740); g.closePath(); }, '#f3f0fa', 4);
    for (let i = 0; i < 6; i++) { const y = 500 + i * 34, x = 100 + rnd(i) * 900; line([[x, y], [x + 120, y - 10], [x + 250, y + 4]], 3, 'rgba(231,204,110,.75)'); }
    [[60, 440, .45], [110, 455, .5], [240, 430, .4], [600, 470, .4], [660, 476, .45], [720, 470, .35], [900, 455, .45], [960, 440, .5], [1030, 425, .45], [1180, 400, .5], [1230, 410, .4]].forEach(([x, y, s]) => pine(x, y, s));
    // cabin
    const cx = 470, cy = 470, fl = .85 + .15 * Math.sin(per(t, 9)) * Math.sin(per(t, 4) + 1);
    glow(cx, cy - 40, 260, '255,190,100', .28 * fl);
    rrect(cx - 30 + 70, cy - 210, 36, 80, 4, '#8a5546');                                             // chimney
    rrect(cx - 130, cy - 120, 260, 120, 6, '#9b5f4a'); for (let i = 1; i < 5; i++) line([[cx - 130, cy - 120 + i * 24], [cx + 130, cy - 120 + i * 24]], 2.5, 'rgba(58,37,32,.35)');
    poly([[cx - 160, cy - 112], [cx, cy - 210], [cx + 160, cy - 112]], '#6f4a6a');
    shape(() => { g.moveTo(cx - 172, cy - 104); g.lineTo(cx, cy - 222); g.lineTo(cx + 172, cy - 104); g.quadraticCurveTo(cx + 150, cy - 92, cx + 120, cy - 110); g.quadraticCurveTo(cx + 60, cy - 100, cx, cy - 170); g.quadraticCurveTo(cx - 60, cy - 100, cx - 120, cy - 110); g.quadraticCurveTo(cx - 150, cy - 92, cx - 172, cy - 104); }, '#fbf8ff');
    ell(cx + 52, cy - 210, 26, 9, '#fbf8ff', 3.5);                                                   // snow on the chimney
    // windows: warm light; Kitty looks out of the left one and blinks
    rrect(cx - 100, cy - 92, 70, 60, 6, `rgb(255,${190 + 30 * fl},${100 + 30 * fl})`);
    g.save(); g.beginPath(); g.rect(cx - 100, cy - 92, 70, 60); g.clip();
    Kitty.sitting(g, cx - 65, cy - 52, .22, { blink: bump(t, 20, 20.35) + bump(t, 47, 47.35), look: Math.sin(per(t, 1)) * .6 });
    g.restore(); rrect(cx - 100, cy - 92, 70, 60, 6, null); line([[cx - 100, cy - 62], [cx - 30, cy - 62]], 3.5);
    rrect(cx + 30, cy - 92, 70, 60, 6, `rgb(255,${190 + 30 * fl},${100 + 30 * fl})`); line([[cx + 65, cy - 92], [cx + 65, cy - 32]], 3.5); line([[cx + 30, cy - 62], [cx + 100, cy - 62]], 3.5);
    rrect(cx - 20, cy - 70, 40, 70, 4, '#6b3f34'); ell(cx + 10, cy - 34, 3.5, 3.5, '#f7d77c', 0);
    shape(() => { g.moveTo(cx - 150, cy + 4); g.quadraticCurveTo(cx, cy - 16, cx + 150, cy + 4); g.quadraticCurveTo(cx, cy + 22, cx - 150, cy + 4); }, '#fbf8ff', 3.5);   // snow drift at the walls
    ell(cx - 65, cy + 30, 80, 14, 'rgba(255,200,110,.25)', 0); ell(cx + 65, cy + 30, 80, 14, 'rgba(255,200,110,.25)', 0);       // window light on the snow
    // chimney smoke, drifting with the breeze
    for (let i = 0; i < 6; i++) { const k = mod(t / 6 + i / 6, 1), x = cx + 58 + k * 70 + Math.sin(k * 5 + i) * 10, y = cy - 220 - k * 190; ell(x, y, 12 + k * 26, 10 + k * 20, `rgba(240,232,244,${(1 - k) * .55})`, 0); }
    // a bunny hops across the snow once per loop
    const bk = clamp((t - 30) / 12);
    if (bk > 0 && bk < 1) {
      const hop = Math.abs(Math.sin(bk * Math.PI * 9)), x = 140 + bk * 1000, y = 610 - hop * 34;
      ell(x, 618, 22 - hop * 8, 5, 'rgba(90,100,160,.25)', 0);
      g.save(); g.translate(x, y); g.scale(-1, 1);
      ell(-14, -18, 7, 20, '#fffaf2', 3.5, -.25); ell(-4, -20, 7, 20, '#fffaf2', 3.5, .1); ell(-13, -18, 3, 12, '#f7b5b5', 0, -.25);
      ell(0, 0, 28, 20, '#fffaf2', 4); ell(-12, -6, 15, 14, '#fffaf2', 4); ell(-17, -8, 2.6, 2.6, INK, 0); ell(26, -2, 8, 8, '#fffaf2', 3.5);
      g.restore();
    }
    // big snowy pines in front
    pine(70, 760, 2.1, '#18224a'); pine(230, 770, 1.5, '#18224a'); pine(1210, 760, 2.2, '#18224a'); pine(1060, 780, 1.4, '#18224a');
    snow(t, 70, 2.2, 2, 0, 0, W, H, 11, 'rgba(255,255,255,.65)');
    snow(t, 50, 3.6, 3, 0, 0, W, H, 37);
    snow(t, 20, 5.5, 5, 0, 0, W, H, 71, 'rgba(255,240,240,.95)');
    vignette(.35);
  }
  function cabinSounds() {
    return { events: [], beds: [['amb_wind', .05], ['amb_night', .01], ['music_calm', .02]], loop: LOOP };
  }

  // ======================= 2. Kitty studying by the window =======================
  function archWindow(x, y, w, h, r) { g.moveTo(x, y + h); g.lineTo(x, y + r); g.arcTo(x, y, x + r, y, r); g.lineTo(x + w - r, y); g.arcTo(x + w, y, x + w, y + r, r); g.lineTo(x + w, y + h); g.closePath(); }
  function renderStudy(ctx, t) {
    g = ctx; t = mod(t, LOOP);
    // what Kitty does: write, gaze out at the snow, write, turn a page, yawn, write
    const turn = seg(t, 18, 19.6) * (1 - seg(t, 30, 31.6));
    const wr = seg(t, .5, 1.2) * (1 - seg(t, 17, 17.7)) + seg(t, 32.5, 33.2) * (1 - seg(t, 40, 40.7)) + seg(t, 49, 49.7) * (1 - seg(t, 57.5, 58.2));
    const flip = clamp((t - 41.2) / 1.3), yawn = bump(t, 44, 47.5);
    const blink = bump(t, 8, 8.3) + bump(t, 25, 25.3) + bump(t, 54, 54.3), ear = bump(t, 27, 27.4) + bump(t, 27.6, 28);
    const br = Math.sin(per(t, 15)), lampF = .94 + .06 * Math.sin(per(t, 3));
    // wall
    g.fillStyle = '#b87f68'; g.fillRect(0, 0, W, H);
    for (let y = 30; y < 470; y += 44) line([[0, y], [W, y]], 3, 'rgba(58,37,32,.22)');
    // string lights
    for (let i = 0; i < 13; i++) { const u = i / 12, x = 590 + u * 670, y = 40 + Math.sin(u * Math.PI) * 50; const a = .55 + .45 * Math.sin(per(t, 2 + i % 3) + i); glow(x, y + 10, 26, '255,210,120', .35 * a); ell(x, y + 10, 7, 9, `rgba(255,${200 + 40 * a},${120 + 50 * a},1)`, 3); }
    shape(() => { g.moveTo(590, 40); g.quadraticCurveTo(925, 140, 1260, 40); }, null, 3);
    // the big window onto the mountains
    const wx = 60, wy = 50, ww = 480, wh = 420;
    g.save(); g.beginPath(); archWindow(wx, wy, ww, wh, 100); g.clip();
    const sky = g.createLinearGradient(0, wy, 0, wy + wh); sky.addColorStop(0, '#1d2350'); sky.addColorStop(1, '#4a4f8c'); g.fillStyle = sky; g.fillRect(wx, wy, ww, wh);
    stars(t, 40, wx, wy, ww, 200, 5); ell(wx + 380, wy + 90, 30, 30, '#fff4d6', 0); glow(wx + 380, wy + 90, 90, '255,240,200', .2);
    poly([[wx - 20, wy + 330], [wx + 140, wy + 150], [wx + 260, wy + 280], [wx + 360, wy + 170], [wx + 520, wy + 340]], '#b9b6dc', 4);
    poly([[wx + 140, wy + 150], [wx + 108, wy + 190], [wx + 128, wy + 182], [wx + 146, wy + 198], [wx + 168, wy + 180]], '#fbf8ff', 0);
    poly([[wx + 360, wy + 170], [wx + 330, wy + 206], [wx + 352, wy + 198], [wx + 372, wy + 212], [wx + 392, wy + 196]], '#fbf8ff', 0);
    shape(() => { g.moveTo(wx - 20, wy + 360); g.bezierCurveTo(wx + 120, wy + 300, wx + 300, wy + 380, wx + 520, wy + 320); g.lineTo(wx + 520, wy + wh + 10); g.lineTo(wx - 20, wy + wh + 10); g.closePath(); }, '#eceaf7', 4);
    [[wx + 60, wy + 350, .5], [wx + 110, wy + 362, .4], [wx + 400, wy + 345, .5], [wx + 450, wy + 340, .4]].forEach(([x, y, s]) => pine(x, y, s, '#4c5a92'));
    snow(t, 45, 2.4, 2, wx, wy, ww, wh, 13); snow(t, 20, 4, 3, wx, wy, ww, wh, 41);
    g.restore();
    g.save(); g.beginPath(); archWindow(wx, wy, ww, wh, 100); g.lineWidth = 26; g.strokeStyle = '#f2e3cf'; g.stroke(); g.restore();
    shape(() => archWindow(wx - 13, wy - 13, ww + 26, wh + 26, 113), null, 4.5); shape(() => archWindow(wx + 13, wy + 13, ww - 26, wh - 26, 87), null, 4.5);
    line([[wx + ww / 2, wy + 13], [wx + ww / 2, wy + wh]], 18, INK); line([[wx + ww / 2, wy + 13], [wx + ww / 2, wy + wh]], 10, '#f2e3cf');
    line([[wx + 13, wy + 230], [wx + ww - 13, wy + 230]], 18, INK); line([[wx + 13, wy + 230], [wx + ww - 13, wy + 230]], 10, '#f2e3cf');
    // lamp glow over the whole corner
    glow(1090, 330, 440 * lampF, '255,205,120', .38);
    // Kitty behind the desk
    const hx = 770 - turn * 26, hy = 285 + br * 2 - yawn * 8 + (1 - turn) * 6;
    Kitty.torso(g, 770, 340 + br * 1.5, 1.25);
    Kitty.head(g, hx, hy, 1.25, { look: -turn * .95, down: (1 - turn) * (1 - yawn) * .9, rot: -turn * .13 + (1 - turn) * .03, eyes: yawn > .35 ? 'closed' : undefined, blink, yawn, earTwitch: ear });
    // desk
    poly([[300, 440], [1290, 440], [1290, 520], [300, 520]], '#c99161');
    poly([[300, 520], [1290, 520], [1290, 730], [300, 730]], '#a46d48'); line([[330, 560], [1290, 560]], 3, 'rgba(58,37,32,.3)');
    // notebook (and a page turning)
    poly([[640, 455], [770, 452], [770, 510], [622, 512]], '#fffdf6', 4); poly([[770, 452], [900, 455], [918, 512], [770, 510]], '#fffdf6', 4);
    for (let i = 0; i < 4; i++) { line([[652, 468 + i * 10], [758, 466 + i * 10]], 2.2, 'rgba(90,110,170,.45)'); line([[782, 466 + i * 10], [898, 468 + i * 10]], 2.2, 'rgba(90,110,170,.45)'); }
    for (let i = 0; i < 3; i++) line([[658, 466 + i * 10], [700 + rnd(i) * 50, 464 + i * 10]], 2.5, 'rgba(58,37,32,.55)');
    if (flip > 0 && flip < 1) { const lift = Math.sin(flip * Math.PI) * 46, xt = 900 + (640 - 900) * flip, xb = 918 + (622 - 918) * flip; poly([[770, 452], [xt, 455 - lift], [xb, 512 - lift * .8], [770, 510]], '#f6f1e4', 4); }
    // arms and paws: left paw holds the notebook, right paw writes with a pencil
    const pw = turn > .5 ? 0 : 1, px = 840 + Math.sin(t * 6.3) * 16 * wr + (1 - wr) * 6, py = 482 + Math.sin(t * 12.6) * 3 * wr - flip * (1 - flip) * 30;
    Kitty.arm(g, 700, 395, 670, 488, 1);
    Kitty.arm(g, 840, 395, px, py, 1);
    line([[px - 20, py + 16], [px + 40, py - 44]], 15, INK); line([[px - 20, py + 16], [px + 40, py - 44]], 8, '#ffcc4d'); line([[px - 20, py + 16], [px - 13, py + 9]], 8, '#f4d9b8'); ell(px + 40, py - 44, 5, 5, '#f39aa0', 3);
    ell(px + 4, py - 6, 14, 11, '#fffaf2', 0); g.beginPath(); g.ellipse(px + 4, py - 6, 14, 11, 0, Math.PI * 1.1, Math.PI * 1.9); g.lineWidth = 4; g.strokeStyle = INK; g.stroke();   // paw wrapped round the pencil
    // books, lamp, mug with steam
    [['#e98a7a', 0], ['#7d8fd0', 1], ['#f6c35b', 2]].forEach(([c, i]) => rrect(960 - i * 4, 470 - i * 24, 130, 24, 6, c, 4));
    ell(1150, 480, 46, 10, '#7d5a8c', 4); line([[1150, 478], [1150, 370]], 9, INK); line([[1150, 478], [1150, 370]], 4, '#7d5a8c');
    shape(() => { g.moveTo(1080, 372); g.quadraticCurveTo(1086, 290, 1150, 288); g.quadraticCurveTo(1214, 290, 1220, 372); g.closePath(); }, '#ffe2a8'); rrect(1080, 364, 140, 14, 7, '#f7942f', 4);
    rrect(470, 432, 70, 66, 18, '#f3a6b0'); shape(() => g.arc(546, 465, 15, -Math.PI / 2, Math.PI / 2), null, LW); ell(505, 436, 30, 7, '#7a4a30', 3);
    for (let i = 0; i < 2; i++) { const k = mod(t / 4 + i * .5, 1); g.globalAlpha = Math.sin(k * Math.PI) * .6; const x = 492 + i * 24, y = 418 - k * 80; g.beginPath(); g.moveTo(x, y + 20); g.bezierCurveTo(x + 12, y + 8, x - 12, y - 2, x + Math.sin(k * 6) * 6, y - 22); g.lineWidth = 4; g.strokeStyle = '#fff'; g.stroke(); g.globalAlpha = 1; }
    // a little plant on the sill
    rrect(90, 432, 60, 44, 10, '#e07f5a'); for (let i = 0; i < 4; i++) ell(100 + i * 14, 418 - (i % 2) * 14, 10, 20, '#79b36a', 3.5, (i - 1.5) * .35);
    vignette(.3);
  }
  function studySounds() {
    const ev = [1, 5, 9, 13, 33.4, 37, 50, 54].map((at) => [at, 'asmr_pencil', .35]);
    ev.push([41.3, 'asmr_page', .55]);
    return { events: ev, beds: [['amb_wind', .025], ['amb_room', .02], ['clock', .006], ['music_calm', .024]], loop: LOOP };
  }

  Object.assign(window, { renderCabin, cabinSounds, renderStudy, studySounds });
})();
