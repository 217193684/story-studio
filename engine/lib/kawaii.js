// Story Studio — "kawaii" cozy routine scenes: flat colours, bold outlines, slow cute motion (ASMR-style animation).
// renderKawaii(ctx, t, opts) draws the cat's late-night meal at time t (seconds). Original character design.
(function () {
  const W = 1280, H = 720, INK = '#3b2a22', LW = 5;
  let g, pawLater = () => {};
  const TAU = Math.PI * 2;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const ease = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
  const seg = (t, a, b) => ease((t - a) / (b - a));           // 0 before a, 1 after b, smooth between
  const lerp = (a, b, k) => a + (b - a) * k;
  function rnd(i) { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

  // shapes with the bold outline
  function shape(path, fill, lw = LW) { g.beginPath(); path(); if (fill) { g.fillStyle = fill; g.fill(); } if (lw) { g.lineWidth = lw; g.strokeStyle = INK; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); } }
  const ell = (x, y, rx, ry, fill, lw, rot = 0) => shape(() => g.ellipse(x, y, rx, ry, rot, 0, TAU), fill, lw);
  function rrect(x, y, w, h, r, fill, lw) { shape(() => { g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }, fill, lw); }
  function stroke(pts, lw = LW, col = INK) { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.lineWidth = lw; g.strokeStyle = col; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(); }
  function arc(x, y, r, a0, a1, lw = LW, col = INK) { g.beginPath(); g.arc(x, y, r, a0, a1); g.lineWidth = lw; g.strokeStyle = col; g.lineCap = 'round'; g.stroke(); }

  // ---------- timeline (seconds) — one full meal; the renderer loops it
  const T = { lid: [4, 6.5], peek: [6.5, 8.5], bites: [[10, 'onigiri'], [17, 'egg'], [24, 'sausage']], sip: [31, 35], end: 40 };
  const BITE = 6; // seconds per bite: reach 0-1.4, lift 1.4-2.6, chew 2.6-5.2

  // ---------- room: wall, window with night rain, sofa, rug
  function room(t) {
    g.fillStyle = '#f6dcb8'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 22; i++) { const x = rnd(i) * W, y = rnd(i + 3) * 420; stroke([[x, y], [x + 10, y - 6]], 3, 'rgba(160,110,70,.35)'); stroke([[x + 6, y + 8], [x + 14, y + 4]], 3, 'rgba(160,110,70,.35)'); }
    // window, top left
    rrect(70, 40, 330, 260, 26, '#2f4570');
    g.save(); g.beginPath(); g.rect(80, 50, 310, 240); g.clip();
    g.fillStyle = '#34507f'; g.fillRect(80, 50, 310, 240);
    ell(320, 110, 30, 30, '#fff3c4', 0);
    g.fillStyle = '#26395e'; g.beginPath(); g.moveTo(80, 250); for (let x = 80; x <= 390; x += 20) g.lineTo(x, 220 - 20 * Math.sin(x * .03)); g.lineTo(390, 290); g.lineTo(80, 290); g.fill();
    for (let i = 0; i < 40; i++) { const x = 80 + rnd(i) * 330, y = 50 + ((rnd(i + 7) * 240 + t * 260) % 260); stroke([[x, y], [x - 4, y + 16]], 2.5, 'rgba(200,220,255,.6)'); }
    g.restore();
    stroke([[235, 46], [235, 294]], LW); stroke([[76, 170], [394, 170]], LW);
    rrect(56, 296, 358, 22, 10, '#c98a55');
    // curtain
    shape(() => { g.moveTo(400, 30); g.quadraticCurveTo(470, 200, 430, 340); g.lineTo(470, 340); g.quadraticCurveTo(500, 180, 460, 30); g.closePath(); }, '#e8a0a0');
    // sofa behind the cat
    rrect(560, 150, 760, 330, 60, '#8fae6b'); rrect(600, 270, 700, 220, 40, '#a3c27f');
    stroke([[720, 200], [800, 170]], 4, 'rgba(59,42,34,.6)'); stroke([[1100, 220], [1160, 200]], 4, 'rgba(59,42,34,.6)');
    // rug edge
    shape(() => { g.moveTo(-20, 470); g.quadraticCurveTo(300, 420, 640, 440); g.lineTo(640, 760); g.lineTo(-20, 760); g.closePath(); }, '#fbf1e1');
    for (let i = 0; i < 9; i++) stroke([[40 + i * 60, 520 + (i % 2) * 30], [52 + i * 60, 512 + (i % 2) * 30]], 3, 'rgba(160,110,70,.4)');
  }

  // ---------- table + candle + tea
  function table(t) {
    shape(() => { g.moveTo(-40, 520); g.lineTo(1320, 470); g.lineTo(1320, 760); g.lineTo(-40, 760); g.closePath(); }, '#9a5b34');
    shape(() => { g.moveTo(-40, 520); g.lineTo(1320, 470); g.lineTo(1320, 495); g.lineTo(-40, 545); g.closePath(); }, '#b8743f', 0);
    // tray with candle pumpkin + vase
    shape(() => { g.moveTo(40, 600); g.lineTo(330, 585); g.lineTo(350, 690); g.lineTo(30, 705); g.closePath(); }, '#c78a52');
    rrect(80, 520, 60, 100, 28, '#efc9a8'); stroke([[100, 525], [92, 455]], 6, '#7a4a2a'); stroke([[115, 525], [120, 450]], 6, '#7a4a2a'); stroke([[125, 525], [140, 465]], 6, '#7a4a2a');
    ell(240, 640, 72, 52, '#f08a3c'); arc(240, 640, 40, Math.PI * 1.15, Math.PI * 1.85, 4); arc(240, 650, 62, Math.PI * 1.1, Math.PI * 1.35, 4);
    const fl = 1 + .12 * Math.sin(t * 9) + .06 * Math.sin(t * 23);
    g.fillStyle = 'rgba(255,200,90,.25)'; g.beginPath(); g.arc(240, 600, 60 * fl, 0, TAU); g.fill();
    ell(240, 612, 10, 18 * fl, '#ffcf4a', 3);
    // tea cup (right), steam — hidden while the cat is holding it
    if (t > T.sip[0] + .3 && t < T.sip[1] - .3) return;
    ell(1110, 610, 70, 22, '#cfe4f2'); rrect(1060, 545, 100, 70, 26, '#ffffff'); arc(1168, 578, 18, -Math.PI / 2, Math.PI / 2, LW);
    ell(1110, 548, 48, 12, '#b5703f', 4);
    for (let i = 0; i < 2; i++) { const k = ((t / 3 + i * .5) % 1); g.globalAlpha = Math.sin(k * Math.PI) * .7; const x = 1095 + i * 26, y = 530 - k * 80; g.beginPath(); g.moveTo(x, y + 30); g.bezierCurveTo(x + 14, y + 15, x - 14, y, x + Math.sin(k * 6) * 6, y - 20); g.lineWidth = 4; g.strokeStyle = '#fff'; g.stroke(); g.globalAlpha = 1; }
  }

  // ---------- the lunch box (food items disappear as they are eaten)
  const FOOD = {
    onigiri: (x, y, s = 1) => { shape(() => { g.moveTo(x, y - 34 * s); g.quadraticCurveTo(x + 40 * s, y + 24 * s, x + 30 * s, y + 26 * s); g.lineTo(x - 30 * s, y + 26 * s); g.quadraticCurveTo(x - 40 * s, y + 24 * s, x, y - 34 * s); }, '#ffffff', 4); rrect(x - 14 * s, y + 4 * s, 28 * s, 22 * s, 4, '#2e3b33', 3); },
    egg: (x, y, s = 1) => { rrect(x - 30 * s, y - 18 * s, 60 * s, 36 * s, 10, '#ffd75e', 4); arc(x - 8 * s, y, 10 * s, 0, TAU, 3, 'rgba(59,42,34,.5)'); },
    sausage: (x, y, s = 1) => { for (let i = 0; i < 4; i++) stroke([[x - 14 * s + i * 9 * s, y + 6 * s], [x - 18 * s + i * 11 * s, y + 26 * s]], 7 * s, '#e0503c'); ell(x, y, 24 * s, 18 * s, '#e8604a', 4); ell(x - 7 * s, y - 2 * s, 3, 3, INK, 0); ell(x + 7 * s, y - 2 * s, 3, 3, INK, 0); },
  };
  const SLOTS = { onigiri: [630, 520], egg: [715, 535], sausage: [790, 520] };
  function eatenAt(item) { const b = T.bites.find((x) => x[1] === item); return b ? b[0] + 1.4 : 1e9; }

  function lunchbox(t) {
    const bx = 590, by = 470;
    ell(bx + 125, by + 120, 165, 30, 'rgba(59,42,34,.25)', 0);
    rrect(bx, by, 250, 115, 26, '#f2a541');
    rrect(bx + 14, by + 12, 222, 90, 18, '#fff4dc');
    for (let i = 0; i < 9; i++) ell(bx + 50 + rnd(i) * 160, by + 70 + rnd(i + 2) * 22, 5, 3, '#fff', 2);
    ell(bx + 205, by + 75, 18, 14, '#7cb860', 3); ell(bx + 195, by + 62, 12, 10, '#8fcf6c', 3);
    for (const k of Object.keys(SLOTS)) if (t < eatenAt(k)) FOOD[k](SLOTS[k][0], SLOTS[k][1] + 10, .9);
    // steam once open
    const open = seg(t, T.lid[0], T.lid[1]);
    if (open > .5) for (let i = 0; i < 3; i++) { const k = ((t / 2.6 + i / 3) % 1); g.globalAlpha = Math.sin(k * Math.PI) * .55 * open; const x = bx + 70 + i * 55, y = by - k * 110; g.beginPath(); g.moveTo(x, y + 30); g.bezierCurveTo(x + 16, y + 10, x - 16, y - 10, x + Math.sin(k * 5 + i) * 8, y - 35); g.lineWidth = 6; g.strokeStyle = '#fff'; g.lineCap = 'round'; g.stroke(); g.globalAlpha = 1; }
  }
  function lid(t) {
    const k = seg(t, T.lid[0], T.lid[1]);
    const x = lerp(590, 360, k), y = lerp(462, 560, k) - Math.sin(k * Math.PI) * 120, rot = lerp(0, -.12, k);
    g.save(); g.translate(x + 125, y + 50); g.rotate(rot);
    rrect(-125, -50, 250, 100, 26, '#f6b84a');
    g.save(); g.beginPath(); g.rect(-120, -45, 240, 90); g.clip(); for (let i = -4; i < 6; i++) { g.fillStyle = '#ffd96a'; g.beginPath(); g.moveTo(-120 + i * 50, -50); g.lineTo(-95 + i * 50, -50); g.lineTo(-145 + i * 50 + 100, 50); g.lineTo(-170 + i * 50 + 100, 50); g.fill(); } g.restore();
    rrect(-125, -50, 250, 100, 26, null);
    g.restore();
  }

  // ---------- the cat (original design: cream with ginger ears and a ginger tuft)
  function cat(t) {
    let reach = 0, lift = 0, chew = 0, item = null, happy = 0;
    for (const [b0, it] of T.bites) {
      const d = t - b0;
      if (d >= 0 && d < BITE) { reach = seg(d, 0, 1.2) * (1 - seg(d, 1.4, 2.4)); lift = seg(d, 1.4, 2.4) * (1 - seg(d, 2.5, 2.8)); chew = d > 2.6 && d < 5.2 ? 1 : 0; item = d > 1.3 && d < 2.7 ? it : null; happy = seg(d, 2.6, 3.2) * (1 - seg(d, 5, BITE)); }
    }
    const lidReach = seg(t, T.lid[0] - 1, T.lid[0]) * (1 - seg(t, T.lid[1], T.lid[1] + .8));
    const sip = seg(t, T.sip[0], T.sip[0] + 1) * (1 - seg(t, T.sip[1] - .8, T.sip[1]));
    const breathe = Math.sin(t * 1.6) * 4;
    const lean = Math.max(reach, lidReach) * 24 - lift * 4;
    const hx = 860 - lean * 1.5, hy = 245 + lean + breathe * .4;
    // tail
    const tw = Math.sin(t * 1.2) * 10;  // tail curls round the body and its tip sways
    const tail = () => { g.beginPath(); g.moveTo(980, 490); g.quadraticCurveTo(1060, 500, 1060, 450 + tw * .3); g.quadraticCurveTo(1062, 410, 1040 + tw, 400); };
    tail(); g.lineWidth = 34; g.strokeStyle = INK; g.lineCap = 'round'; g.stroke(); tail(); g.lineWidth = 24; g.strokeStyle = '#fff3e4'; g.stroke();
    g.beginPath(); g.arc(1040 + tw, 400, 12, 0, TAU); g.fillStyle = '#f0a868'; g.fill();
    // body
    shape(() => { g.moveTo(760, 500); g.bezierCurveTo(730, 380, 800, 330, 880, 330 + breathe); g.bezierCurveTo(980, 330 + breathe, 1030, 400, 1020, 500); g.closePath(); }, '#fff3e4');
    ell(890, 420 + breathe * .5, 46, 30, '#ffe2c4', 0);
    // head
    g.save(); g.translate(hx, hy); g.rotate(-lean * .004 + sip * .08);
    shape(() => { g.moveTo(-120, -60); g.lineTo(-96, -150); g.lineTo(-40, -100); g.closePath(); }, '#f0a868');
    shape(() => { g.moveTo(120, -60); g.lineTo(96, -150); g.lineTo(40, -100); g.closePath(); }, '#f0a868');
    ell(-90, -110, 10, 18, '#ffb3a7', 0, -.3); ell(90, -110, 10, 18, '#ffb3a7', 0, .3);
    ell(0, 0, 150, 125, '#fff3e4');
    shape(() => { g.moveTo(-30, -122); g.quadraticCurveTo(0, -70, 40, -118); }, '#f0a868', 0); arc(0, -40, 92, Math.PI * 1.35, Math.PI * 1.62, 5, '#f0a868');
    ell(-70, 30, 22, 13, 'rgba(255,150,140,.55)', 0); ell(70, 30, 22, 13, 'rgba(255,150,140,.55)', 0);
    // eyes: closed and content, open and sparkly when the food appears, happy arcs while chewing
    const peek = seg(t, T.peek[0], T.peek[0] + .4) * (1 - seg(t, T.peek[1], T.peek[1] + .4));
    const blink = (t % 5.3) < .15;
    for (const s of [-1, 1]) {
      const ex = s * 48, ey = 5;
      if (happy > .3 || sip > .5) arc(ex, ey + 8, 16, Math.PI * 1.15, Math.PI * 1.85, 5);
      else if (peek > .3 && !blink) { ell(ex, ey, 15, 19, INK, 0); ell(ex - 5, ey - 7, 6, 6, '#fff', 0); ell(ex + 5, ey + 6, 3, 3, '#fff', 0); }
      else stroke([[ex - 14, ey + 2], [ex - 4, ey + 6], [ex + 6, ey + 2]], 4.5);
    }
    // mouth: little "w", wiggles while chewing
    const cw = chew ? Math.sin(t * 14) * 4 : 0;
    stroke([[-16, 40 + cw * .4], [-8, 48 + cw], [0, 40], [8, 48 + cw], [16, 40 + cw * .4]], 4);
    if (chew) { ell(-34, 44 + cw * .5, 7, 5, '#ffe2c4', 0); ell(34, 44 - cw * .5, 7, 5, '#ffe2c4', 0); }
    // whiskers
    for (const s of [-1, 1]) { stroke([[s * 110, 25], [s * 160, 15]], 3.5); stroke([[s * 110, 40], [s * 158, 44]], 3.5); }
    g.restore();
    // paw: rests, reaches into the box, lifts food to the mouth, or holds the tea
    let px = 800, py = 470 + breathe * .3;
    if (lidReach > 0) { px = lerp(px, 700, lidReach); py = lerp(py, 470, lidReach); }
    if (reach > 0 || lift > 0) { const sx = SLOTS[item || T.bites.find((b) => t - b[0] >= 0 && t - b[0] < BITE)?.[1] || 'egg']; px = lerp(px, sx[0] + 20, reach); py = lerp(py, sx[1] - 10, reach); px = lerp(px, hx - 10, lift); py = lerp(py, hy + 80, lift); }
    if (sip > 0) { const up = seg(sip, .35, 1); px = lerp(lerp(px, 1060, seg(sip, 0, .35)), hx + 30, up); py = lerp(lerp(py, 560, seg(sip, 0, .35)), hy + 95, up); }
    pawLater = () => {  // drawn after the table and box, so the paw is in front of them
      if (sip > .05) { rrect(px - 10, py - 10, 80, 56, 22, '#ffffff'); }
      ell(px, py, 34, 26, '#fff3e4'); stroke([[px - 10, py + 6], [px - 10, py + 16]], 3); stroke([[px + 4, py + 6], [px + 4, py + 18]], 3);
      if (item && lift > .05) FOOD[item](px + 4, py - 40, .85);  // held up on top of the paw
    };
    if (happy > .5) for (let i = 0; i < 2; i++) { const k = (t * .8 + i * .5) % 1; g.globalAlpha = 1 - k; heart(hx + 130 + i * 30, hy - 80 - k * 60, 14); g.globalAlpha = 1; }
  }
  function heart(x, y, s) { shape(() => { g.moveTo(x, y + s); g.bezierCurveTo(x - s * 2, y - s * .4, x - s * .6, y - s * 1.7, x, y - s * .5); g.bezierCurveTo(x + s * .6, y - s * 1.7, x + s * 2, y - s * .4, x, y + s); }, '#ff7a8a', 3); }

  window.renderKawaii = function (ctx, t) {
    g = ctx; t = ((t % T.end) + T.end) % T.end;
    // close-up camera on the cat and the box, with a very slow drift (loops with the scene)
    const z = 1.24 + .03 * Math.sin(TAU * t / T.end), cx = 790 + 14 * Math.sin(TAU * t / T.end), cy = 372;
    g.save(); g.translate(W / 2, H / 2); g.scale(z, z); g.translate(-cx, -cy);
    room(t); cat(t); table(t); lunchbox(t); lid(t); pawLater();
    g.restore();
    // soft dip to dark where the loop restarts, so a new meal begins like the next evening
    const dip = Math.max(0, 1 - t / .9, (t - (T.end - .9)) / .9);
    if (dip > 0) { g.fillStyle = `rgba(30,18,10,${ease(dip) * .95})`; g.fillRect(0, 0, W, H); }
    // soft warm vignette
    const gr = g.createRadialGradient(W / 2, H / 2, H * .45, W / 2, H / 2, H * 1.05); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(80,40,10,.25)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  };
  // when sounds should play (seconds within the loop), for the renderer
  window.kawaiiSounds = function () {
    const ev = [[T.lid[0] + .3, 'asmr_lid'], [T.sip[0] + 1.2, 'asmr_sip']];
    for (const [b0] of T.bites) { ev.push([b0 + .9, 'asmr_pick']); for (let k = 0; k < 3; k++) ev.push([b0 + 2.7 + k * .8, 'asmr_chew']); }
    return { events: ev, loop: T.end };
  };
})();
