/* Story Studio — places. Each place: { floor: fraction of height where feet stand, size: adult height as a fraction of
   height, spots: named x positions (0..1), draw(x,y,w,h,t,o) } where o = { tod: day|morning|evening|night, mood, tv, lights } */

/* ---- shared building blocks ---- */
function wall(x, y, w, h, c, fl, floorC, boards = true) {
  g.fillStyle = vgrad(y, y, h * fl, [shade(c, .06), shade(c, -.08)]); g.fillRect(x, y, w, h * fl);
  g.fillStyle = shade(c, -.25); g.fillRect(x, y + h * fl - 8, w, 8);
  g.fillStyle = floorC; g.fillRect(x, y + h * fl, w, h * (1 - fl));
  if (boards) { g.strokeStyle = shade(floorC, -.12); g.lineWidth = 2; for (let i = 1; i < 6; i++) { const yy = y + h * fl + i * h * (1 - fl) / 6; g.beginPath(); g.moveTo(x, yy); g.lineTo(x + w, yy); g.stroke(); } }
}
function windowFrame(x, y, w, h, tod, t, frame = '#e7e5e4', curtains) {
  rr(x - 10, y - 10, w + 20, h + 20, 6); g.fillStyle = frame; g.fill();
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); sky(x, y, w, h * 1.4, tod, t);
  g.fillStyle = tod === 'night' ? '#0f1535' : '#86a37a'; g.fillRect(x, y + h * .78, w, h * .22);
  g.restore(); line(x + w / 2, y, x + w / 2, y + h, frame, 6); line(x, y + h / 2, x + w, y + h / 2, frame, 6);
  if (curtains) { g.fillStyle = curtains; poly([[x - 22, y - 16], [x + w * .22, y - 16], [x + w * .06, y + h * .5], [x + w * .18, y + h + 14], [x - 22, y + h + 14]]); g.fill(); poly([[x + w + 22, y - 16], [x + w * .78, y - 16], [x + w * .94, y + h * .5], [x + w * .82, y + h + 14], [x + w + 22, y + h + 14]]); g.fill(); }
}
function doorShape(x, y, w, h, c = '#7c4a24', open = 0, inside = '#0b0b10') {
  rr(x - 8, y - 8, w + 16, h + 8, 4); g.fillStyle = shade(c, -.3); g.fill();
  g.fillStyle = inside; g.fillRect(x, y, w, h);
  const dw = w * (1 - open * .85); g.fillStyle = c; g.fillRect(x, y, dw, h);
  if (open < .5) { rr(x + 8, y + 10, dw - 16, h * .38, 3); g.fillStyle = shade(c, -.1); g.fill(); rr(x + 8, y + h * .5, dw - 16, h * .42, 3); g.fill(); circle(x + dw - 14, y + h * .52, 5, '#facc15'); }
}
function frame(x, y, w, h, inner) { rr(x - 6, y - 6, w + 12, h + 12, 3); g.fillStyle = '#7c4a24'; g.fill(); g.fillStyle = inner; g.fillRect(x, y, w, h); g.fillStyle = 'rgba(255,255,255,.35)'; poly([[x, y + h], [x + w * .4, y + h * .4], [x + w * .65, y + h * .7], [x + w, y + h * .3], [x + w, y + h]]); g.fill(); }
function plant(x, y, s = 1) { rr(x - 18 * s, y - 34 * s, 36 * s, 34 * s, 4); g.fillStyle = '#b45309'; g.fill(); for (let i = 0; i < 7; i++) ellipse(x + (i - 3) * 9 * s, y - 50 * s - Math.abs(i - 3) * -6 * s, 10 * s, 28 * s, i % 2 ? '#15803d' : '#16a34a', (i - 3) * .3); }
function lampLight(x, y, r, c = '255,220,150', a = .35) { const gr = g.createRadialGradient(x, y, 2, x, y, r); gr.addColorStop(0, `rgba(${c},${a})`); gr.addColorStop(1, `rgba(${c},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
function ground(x, y, w, h, fl, c, tex) { g.fillStyle = vgrad(y + h * fl, y + h * fl, h * (1 - fl), [c, shade(c, -.15)]); g.fillRect(x, y + h * fl - 2, w, h * (1 - fl) + 2); if (tex === 'grass') for (let i = 0; i < 90; i++) { const gx = x + rnd(i) * w, gy = y + h * fl + rnd(i + 90) * h * (1 - fl); line(gx, gy, gx + 3, gy - 9, shade(c, -.2), 2); } if (tex === 'dirt') for (let i = 0; i < 60; i++) circle(x + rnd(i) * w, y + h * fl + rnd(i + 7) * h * (1 - fl), 2 + rnd(i + 3) * 3, shade(c, -.12)); }
function hills(x, y, w, h, base, c, amp, seed) { g.beginPath(); g.moveTo(x, y + h); for (let i = 0; i <= 20; i++) g.lineTo(x + i * w / 20, base - amp * (.5 + .5 * Math.sin(i * .7 + seed)) - amp * .4 * Math.sin(i * 1.9 + seed * 2)); g.lineTo(x + w, y + h); g.closePath(); g.fillStyle = c; g.fill(); }
function treeShape(x, gy, s, c = '#15803d', kind = 'round') {
  if (kind === 'acacia') { line(x, gy, x - 6 * s, gy - 90 * s, '#5b3417', 10 * s); line(x - 4 * s, gy - 60 * s, x + 30 * s, gy - 100 * s, '#5b3417', 6 * s); ellipse(x - 10 * s, gy - 110 * s, 80 * s, 18 * s, c); ellipse(x + 30 * s, gy - 112 * s, 50 * s, 14 * s, shade(c, .08)); return; }
  if (kind === 'pine') { g.fillStyle = '#5b3417'; g.fillRect(x - 6 * s, gy - 30 * s, 12 * s, 30 * s); for (let i = 0; i < 3; i++) poly([[x - (50 - i * 10) * s, gy - (30 + i * 40) * s], [x + (50 - i * 10) * s, gy - (30 + i * 40) * s], [x, gy - (100 + i * 40) * s]], shade(c, -i * .06)); return; }
  if (kind === 'dead') { g.strokeStyle = '#1c1917'; g.lineCap = 'round'; const br = (bx, by, a, l, wdt) => { if (l < 8) return; const ex = bx + Math.cos(a) * l, ey = by + Math.sin(a) * l; line(bx, by, ex, ey, '#1c1917', wdt); br(ex, ey, a - .45, l * .7, wdt * .65); br(ex, ey, a + .4, l * .65, wdt * .65); }; br(x, gy, -Math.PI / 2, 70 * s, 12 * s); return; }
  if (kind === 'palm') { g.strokeStyle = '#8b5a2b'; g.lineWidth = 12 * s; g.beginPath(); g.moveTo(x, gy); g.quadraticCurveTo(x + 20 * s, gy - 80 * s, x + 10 * s, gy - 160 * s); g.stroke(); for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * .55; ellipse(x + 10 * s + Math.cos(a) * 40 * s, gy - 160 * s + Math.sin(a) * 26 * s + 14 * s, 46 * s, 10 * s, '#16a34a', a); } return; }
  g.fillStyle = '#6b4226'; g.fillRect(x - 8 * s, gy - 70 * s, 16 * s, 70 * s);
  [[0, -110, 50], [-34, -84, 36], [34, -84, 36], [0, -70, 38]].forEach((q) => circle(x + q[0] * s, gy + q[1] * s, q[2] * s, c));
  circle(x - 14 * s, gy - 122 * s, 18 * s, shade(c, .12));
}
function house(x, gy, w, h, wallC, roofC, tod, t, opts = {}) {
  g.fillStyle = wallC; g.fillRect(x, gy - h, w, h);
  if (opts.flatRoof) { g.fillStyle = roofC; g.fillRect(x - 6, gy - h - 10, w + 12, 12); for (let i = 0; i < w / 10; i++) line(x + i * 10, gy - h - 10, x + i * 10, gy - h + 2, shade(roofC, -.15), 1.5); }
  else poly([[x - 12, gy - h], [x + w / 2, gy - h - h * .45], [x + w + 12, gy - h]], roofC);
  const lit = tod === 'night' || tod === 'evening';
  const wc = (i) => (lit && rnd(i + x) > .35 ? '#ffd37a' : (tod === 'night' ? '#0f1535' : '#bfdbfe'));
  g.fillStyle = wc(1); g.fillRect(x + w * .14, gy - h * .72, w * .26, h * .28); g.fillStyle = wc(2); g.fillRect(x + w * .6, gy - h * .72, w * .26, h * .28);
  g.fillStyle = shade(wallC, -.35); g.fillRect(x + w * .4, gy - h * .45, w * .2, h * .45);
}

const PLACES = {
  bedroom: { floor: .82, size: .52, indoor: true, spots: { bed: .16, window: .42, door: .86, center: .6, left: .25, right: .75 }, draw(x, y, w, h, t, o) {
    wall(x, y, w, h, '#4c3f75', .82, '#6b4b33'); windowFrame(x + w * .32, y + h * .14, w * .2, h * .36, o.tod, t, '#e7e5e4', '#7c3aed');
    doorShape(x + w * .8, y + h * .2, w * .11, h * .62, '#8b5a2b', o.doorOpen || 0);
    frame(x + w * .6, y + h * .2, w * .08, h * .12, '#93c5fd');
    rr(x + w * .02, y + h * .62, w * .26, h * .2, 8); g.fillStyle = '#6b4226'; g.fill(); rr(x + w * .03, y + h * .56, w * .24, h * .14, 12); g.fillStyle = '#2f6f93'; g.fill(); rr(x + w * .035, y + h * .53, w * .07, h * .07, 10); g.fillStyle = '#f1f5f9'; g.fill();
    rr(x + w * .62, y + h * .58, w * .1, h * .24, 4); g.fillStyle = '#8b5a2b'; g.fill(); circle(x + w * .67, y + h * .52, 16, '#fde68a'); if (o.tod === 'night') lampLight(x + w * .67, y + h * .52, h * .3);
    ellipse(x + w * .5, y + h * .9, w * .2, h * .04, '#9f1239');
  } },
  lounge: { floor: .82, size: .52, indoor: true, spots: { sofa: .48, tv: .14, window: .74, door: .92, center: .5, left: .3, right: .7 }, draw(x, y, w, h, t, o) {
    wall(x, y, w, h, '#c2410c', .82, '#7c4a24'); g.fillStyle = 'rgba(255,255,255,.06)'; for (let i = 0; i < 20; i++) g.fillRect(x + i * w / 20, y, w / 40, h * .82);
    windowFrame(x + w * .66, y + h * .14, w * .18, h * .32, o.tod, t, '#f5f5f4', '#fbbf24'); frame(x + w * .38, y + h * .18, w * .14, h * .14, '#0ea5e9');
    // tv
    rr(x + w * .06, y + h * .64, w * .16, h * .18, 4); g.fillStyle = '#3f2a1c'; g.fill(); rr(x + w * .05, y + h * .34, w * .18, h * .28, 6); g.fillStyle = '#111827'; g.fill();
    const on = o.tv !== false; rr(x + w * .058, y + h * .35, w * .164, h * .25, 3); g.fillStyle = on ? `hsl(${(t * 40) % 360},55%,${45 + 8 * Math.sin(t * 7)}%)` : '#0b0f19'; g.fill(); if (on) lampLight(x + w * .14, y + h * .48, h * .35, '120,170,255', .25);
    // sofa
    rr(x + w * .33, y + h * .58, w * .32, h * .2, 18); g.fillStyle = '#1e3a8a'; g.fill(); rr(x + w * .31, y + h * .66, w * .36, h * .14, 14); g.fillStyle = '#1d4ed8'; g.fill(); rr(x + w * .3, y + h * .62, w * .05, h * .18, 12); g.fill(); rr(x + w * .63, y + h * .62, w * .05, h * .18, 12); g.fill();
    plant(x + w * .9, y + h * .82, 1.1); ellipse(x + w * .5, y + h * .9, w * .24, h * .04, '#a16207');
  } },
  kitchen: { floor: .82, size: .52, indoor: true, spots: { stove: .22, fridge: .08, table: .65, window: .45, center: .55, left: .3, right: .8 }, draw(x, y, w, h, t, o) {
    wall(x, y, w, h, '#e0f2fe', .82, '#d6d3d1', false); for (let i = 0; i < 16; i++) for (let j = 0; j < 4; j++) { g.strokeStyle = 'rgba(0,0,0,.06)'; g.strokeRect(x + i * w / 16, y + h * (.42 + j * .07), w / 16, h * .07); }
    windowFrame(x + w * .38, y + h * .12, w * .16, h * .24, o.tod, t, '#f8fafc');
    rr(x + w * .02, y + h * .3, w * .1, h * .52, 6); g.fillStyle = '#e5e7eb'; g.fill(); line(x + w * .11, y + h * .4, x + w * .11, y + h * .5, '#9ca3af', 4);
    g.fillStyle = '#7c2d12'; g.fillRect(x + w * .13, y + h * .58, w * .42, h * .24); g.fillStyle = '#d6d3d1'; g.fillRect(x + w * .125, y + h * .56, w * .43, h * .03);
    for (let i = 0; i < 4; i++) { rr(x + w * (.14 + i * .1), y + h * .62, w * .09, h * .17, 3); g.fillStyle = '#9a3412'; g.fill(); circle(x + w * (.18 + i * .1), y + h * .7, 3, '#fde68a'); }
    rr(x + w * .17, y + h * .52, w * .1, h * .04, 3); g.fillStyle = '#111827'; g.fill(); if (o.cooking) for (let i = 0; i < 3; i++) { const k = (t * .7 + i / 3) % 1; circle(x + w * .22 + Math.sin(k * 6) * 8, y + h * (.5 - k * .15), 8 + k * 10, `rgba(255,255,255,${.4 * (1 - k)})`); }
    for (let i = 0; i < 3; i++) { rr(x + w * (.14 + i * .14), y + h * .12, w * .12, h * .16, 3); g.fillStyle = '#9a3412'; g.fill(); }
    rr(x + w * .62, y + h * .62, w * .22, h * .04, 4); g.fillStyle = '#a16207'; g.fill(); g.fillStyle = '#78350f'; g.fillRect(x + w * .64, y + h * .66, w * .015, h * .16); g.fillRect(x + w * .81, y + h * .66, w * .015, h * .16);
  } },
  office: { floor: .82, size: .52, indoor: true, spots: { desk: .3, desk2: .7, window: .5, door: .92, center: .5, left: .2, right: .8 }, draw(x, y, w, h, t, o) {
    wall(x, y, w, h, '#cbd5e1', .82, '#64748b', false);
    rr(x + w * .3, y + h * .1, w * .4, h * .36, 4); g.fillStyle = '#e2e8f0'; g.fill(); g.save(); g.beginPath(); g.rect(x + w * .31, y + h * .12, w * .38, h * .32); g.clip(); sky(x + w * .31, y + h * .12, w * .38, h * .5, o.tod, t);
    for (let i = 0; i < 9; i++) { const bh = h * (.12 + rnd(i) * .2); g.fillStyle = o.tod === 'night' ? '#1e293b' : '#94a3b8'; g.fillRect(x + w * (.31 + i * .043), y + h * .44 - bh, w * .036, bh); if (o.tod === 'night') for (let j = 0; j < 5; j++) if (rnd(i * 9 + j) > .5) { g.fillStyle = '#fde68a'; g.fillRect(x + w * (.315 + i * .043), y + h * .44 - bh + 8 + j * 12, 5, 5); } }
    g.restore(); line(x + w * .5, y + h * .1, x + w * .5, y + h * .46, '#e2e8f0', 6);
    circle(x + w * .13, y + h * .2, 22, '#f8fafc'); g.strokeStyle = '#111'; g.lineWidth = 2; g.stroke(); line(x + w * .13, y + h * .2, x + w * .13 + Math.cos(t) * 14, y + h * .2 + Math.sin(t) * 14, '#111', 2); line(x + w * .13, y + h * .2, x + w * .13, y + h * .2 - 10, '#111', 3);
    [.18, .58].forEach((dx) => { rr(x + w * dx, y + h * .6, w * .24, h * .04, 3); g.fillStyle = '#e5e7eb'; g.fill(); g.fillStyle = '#9ca3af'; g.fillRect(x + w * (dx + .01), y + h * .64, w * .012, h * .18); g.fillRect(x + w * (dx + .218), y + h * .64, w * .012, h * .18); rr(x + w * (dx + .07), y + h * .46, w * .1, h * .13, 4); g.fillStyle = '#111827'; g.fill(); rr(x + w * (dx + .075), y + h * .47, w * .09, h * .1, 2); g.fillStyle = '#38bdf8'; g.fill(); });
    plant(x + w * .04, y + h * .82, 1.2); doorShape(x + w * .88, y + h * .22, w * .1, h * .6, '#94a3b8');
  } },
  classroom: { floor: .82, size: .5, indoor: true, spots: { board: .4, teacher: .18, desks: .65, door: .92, center: .5, left: .25, right: .75 }, draw(x, y, w, h, t, o) {
    wall(x, y, w, h, '#fef3c7', .82, '#a16207');
    rr(x + w * .2, y + h * .12, w * .44, h * .32, 4); g.fillStyle = '#7c4a24'; g.fill(); g.fillStyle = '#14532d'; g.fillRect(x + w * .21, y + h * .135, w * .42, h * .29);
    txt(o.board || 'A  B  C   1 + 2 = 3', x + w * .42, y + h * .3, h * .055, 'rgba(255,255,255,.85)', 600, 'center');
    windowFrame(x + w * .72, y + h * .14, w * .12, h * .26, o.tod, t);
    rr(x + w * .05, y + h * .6, w * .14, h * .05, 3); g.fillStyle = '#92400e'; g.fill(); g.fillRect(x + w * .06, y + h * .65, w * .12, h * .17);
    for (let i = 0; i < 3; i++) { rr(x + w * (.42 + i * .16), y + h * .7, w * .12, h * .035, 3); g.fillStyle = '#b45309'; g.fill(); g.fillStyle = '#6b7280'; g.fillRect(x + w * (.43 + i * .16), y + h * .735, 4, h * .085); g.fillRect(x + w * (.53 + i * .16), y + h * .735, 4, h * .085); }
    circle(x + w * .9, y + h * .1, 18, '#f8fafc');
  } },
  bar: { floor: .84, size: .52, indoor: true, spots: { counter: .4, stool1: .3, stool2: .5, door: .9, center: .6, left: .2, right: .78 }, draw(x, y, w, h, t, o) {
    wall(x, y, w, h, '#3f2a1c', .84, '#1c1917');
    for (let r = 0; r < 3; r++) { g.fillStyle = '#5b3417'; g.fillRect(x + w * .1, y + h * (.18 + r * .12), w * .6, 6); for (let i = 0; i < 14; i++) { const bc = ['#166534', '#b45309', '#7f1d1d', '#1e40af', '#a16207'][(i + r) % 5]; rr(x + w * (.11 + i * .042), y + h * (.18 + r * .12) - 34, 12, 34, 3); g.fillStyle = bc; g.fill(); } }
    g.save(); g.shadowColor = '#f472b6'; g.shadowBlur = 25; txt(o.sign || 'OPEN', x + w * .84, y + h * .26, h * .07, '#f9a8d4', 900, 'center'); g.restore();
    [.25, .5].forEach((lx) => { line(x + w * lx, y, x + w * lx, y + h * .1, '#111', 2); ellipse(x + w * lx, y + h * .11, 20, 10, '#facc15'); lampLight(x + w * lx, y + h * .2, h * .3, '255,200,120', .3); });
    rr(x + w * .06, y + h * .58, w * .68, h * .26, 6); g.fillStyle = '#7c2d12'; g.fill(); g.fillStyle = '#451a03'; g.fillRect(x + w * .05, y + h * .56, w * .7, h * .04);
    [.2, .38, .56].forEach((sx) => { line(x + w * sx, y + h * .74, x + w * sx, y + h * .84, '#9ca3af', 5); ellipse(x + w * sx, y + h * .73, 22, 8, '#b91c1c'); });
    doorShape(x + w * .86, y + h * .3, w * .1, h * .54, '#5b3417');
  } },
  club: { floor: .86, size: .5, indoor: true, spots: { dj: .5, floor: .3, floor2: .7, left: .2, right: .8, center: .5 }, draw(x, y, w, h, t, o) {
    g.fillStyle = '#0b0614'; g.fillRect(x, y, w, h);
    for (let i = 0; i < 6; i++) { const a = Math.sin(t * 1.3 + i) * .6, c = ['#ec4899', '#22d3ee', '#a855f7', '#facc15', '#22c55e', '#f97316'][i]; g.save(); g.translate(x + w * (.1 + i * .16), y); g.rotate(a); g.fillStyle = alpha(c, .16); poly([[-10, 0], [10, 0], [90, h], [-90, h]]); g.fill(); g.restore(); }
    circle(x + w * .5, y + h * .1, 30, '#d1d5db'); for (let i = 0; i < 20; i++) { const a = i * .9 + t * 2; circle(x + w * .5 + Math.cos(a) * 22, y + h * .1 + Math.sin(a) * 22, 4, i % 3 ? '#fff' : '#e5e7eb'); }
    for (let i = 0; i < 10; i++) for (let j = 0; j < 3; j++) { const on = Math.sin(t * 6 + i * 1.7 + j * 2.3) > .2; g.fillStyle = on ? ['#ec4899', '#22d3ee', '#a855f7', '#facc15'][(i + j) % 4] : '#1f1235'; poly([[x + i * w / 10, y + h * (.86 + j * .047)], [x + (i + 1) * w / 10, y + h * (.86 + j * .047)], [x + (i + 1) * w / 10 + 6, y + h * (.86 + (j + 1) * .047)], [x + i * w / 10 + 6, y + h * (.86 + (j + 1) * .047)]]); g.fill(); }
    rr(x + w * .4, y + h * .64, w * .2, h * .22, 6); g.fillStyle = '#1f1235'; g.fill(); for (let i = 0; i < 2; i++) { circle(x + w * (.45 + i * .1), y + h * .62, 20, '#111'); circle(x + w * (.45 + i * .1), y + h * .62, 6, '#9ca3af'); }
    g.fillStyle = 'rgba(0,0,0,.6)'; for (let i = 0; i < 12; i++) { const cx = x + w * (.03 + i * .085), bob = Math.abs(Math.sin(t * 7 + i)) * 10; circle(cx, y + h * .66 - bob, 18, 'rgba(0,0,0,.65)'); rr(cx - 22, y + h * .68 - bob, 44, h * .2, 18); g.fill(); }
  } },
  restaurant: { floor: .84, size: .52, indoor: true, spots: { table1: .25, table2: .7, door: .92, center: .5, left: .2, right: .8 }, draw(x, y, w, h, t, o) {
    wall(x, y, w, h, '#7f1d1d', .84, '#3f2a1c'); windowFrame(x + w * .4, y + h * .14, w * .2, h * .28, o.tod, t, '#fef3c7', '#facc15');
    [.25, .72].forEach((tx) => { ellipse(x + w * tx, y + h * .66, w * .1, h * .03, '#f8fafc'); g.fillStyle = '#f8fafc'; g.fillRect(x + w * (tx - .1), y + h * .66, w * .2, h * .08); g.fillStyle = '#78350f'; g.fillRect(x + w * tx - 4, y + h * .74, 8, h * .1); drawHeld('candle', x + w * tx, y + h * .645, 0, 1); lampLight(x + w * tx, y + h * .6, h * .15, '255,200,120', .4); });
    for (let i = 0; i < 3; i++) frame(x + w * (.06 + i * .3) + (i == 1 ? w * .55 : 0), y + h * .2, w * .07, h * .12, '#fbbf24');
  } },
  shop: { floor: .84, size: .52, indoor: true, spots: { counter: .35, shelf: .7, door: .92, center: .55, left: .2, right: .78 }, draw(x, y, w, h, t, o) {
    wall(x, y, w, h, '#fde68a', .84, '#78716c', false);
    for (let r = 0; r < 4; r++) { g.fillStyle = '#9a3412'; g.fillRect(x + w * .48, y + h * (.18 + r * .15), w * .44, 8); for (let i = 0; i < 12; i++) { rr(x + w * (.49 + i * .036), y + h * (.18 + r * .15) - 30, 16, 30, 3); g.fillStyle = ['#dc2626', '#2563eb', '#16a34a', '#f59e0b', '#7c3aed'][(i * 3 + r) % 5]; g.fill(); } }
    rr(x + w * .08, y + h * .6, w * .34, h * .24, 4); g.fillStyle = '#b91c1c'; g.fill(); g.fillStyle = '#f8fafc'; g.fillRect(x + w * .07, y + h * .58, w * .36, h * .03);
    rr(x + w * .3, y + h * .5, w * .08, h * .08, 4); g.fillStyle = '#374151'; g.fill();
    rr(x + w * .1, y + h * .1, w * .3, h * .1, 6); g.fillStyle = '#dc2626'; g.fill(); txt(o.sign || 'SPAZA SHOP', x + w * .25, y + h * .17, h * .045, '#fff', 900, 'center');
  } },
  street: { floor: .86, size: .45, spots: { left: .2, center: .5, right: .8, house1: .15, house2: .5, house3: .85 }, draw(x, y, w, h, t, o) {
    sky(x, y, w, h * .8, o.tod, t); hills(x, y, w, h, y + h * .62, '#7aa36b', h * .06, 1);
    [[.02, .2, '#fde68a', '#b91c1c'], [.3, .22, '#bfdbfe', '#1e3a8a'], [.6, .18, '#fecaca', '#7f1d1d'], [.82, .2, '#d9f99d', '#365314']].forEach((q, i) => house(x + w * q[0], y + h * .74, w * q[1], h * .22, q[2], q[3], o.tod, t));
    treeShape(x + w * .26, y + h * .76, .9); treeShape(x + w * .55, y + h * .76, .8, '#166534');
    g.fillStyle = '#9ca3af'; g.fillRect(x, y + h * .74, w, h * .04); ground(x, y, w, h, .78, '#4b5563'); for (let i = 0; i < 10; i++) { g.fillStyle = '#facc15'; g.fillRect(x + i * w / 9, y + h * .9, w * .05, 5); }
    nightShade(x, y, w, h, o.tod); if (o.tod === 'night') [.15, .5, .85].forEach((lx) => { line(x + w * lx, y + h * .78, x + w * lx, y + h * .52, '#374151', 5); lampLight(x + w * lx, y + h * .52, h * .3, '255,226,150', .5); circle(x + w * lx, y + h * .52, 6, '#fef3c7'); });
  } },
  township: { floor: .86, size: .45, spots: { spaza: .78, left: .2, center: .5, right: .8, house1: .12, house2: .4 }, draw(x, y, w, h, t, o) {
    sky(x, y, w, h * .8, o.tod, t); hills(x, y, w, h, y + h * .6, '#a3a36b', h * .05, 3);
    for (let i = 0; i < 9; i++) { const hx = x + w * (i * .11 - .02), hw = w * .09; g.fillStyle = ['#fde68a', '#fca5a5', '#bae6fd', '#e5e7eb', '#bbf7d0'][i % 5]; g.fillRect(hx, y + h * .58, hw, h * .1); g.fillStyle = '#9ca3af'; g.fillRect(hx - 3, y + h * .56, hw + 6, h * .025); }
    [[.02, '#f5f5f4'], [.25, '#fbcfe8'], [.5, '#bfdbfe']].forEach((q, i) => house(x + w * q[0], y + h * .78, w * .2, h * .2, q[1], '#94a3b8', o.tod, t, { flatRoof: true }));
    rr(x + w * .7, y + h * .55, w * .22, h * .23, 2); g.fillStyle = '#dc2626'; g.fill(); for (let i = 0; i < 10; i++) line(x + w * (.71 + i * .021), y + h * .55, x + w * (.71 + i * .021), y + h * .78, '#b91c1c', 2); rr(x + w * .74, y + h * .62, w * .14, h * .1, 2); g.fillStyle = '#1f2937'; g.fill(); txt('SPAZA', x + w * .81, y + h * .6, h * .035, '#fde68a', 900, 'center');
    line(x, y + h * .3, x + w, y + h * .34, '#1f2937', 1.5); line(x, y + h * .32, x + w, y + h * .37, '#1f2937', 1.5); g.fillStyle = '#57534e'; g.fillRect(x + w * .45, y + h * .28, 6, h * .5);
    ground(x, y, w, h, .78, '#b08968', 'dirt'); nightShade(x, y, w, h, o.tod);
  } },
  taxi_rank: { floor: .86, size: .45, spots: { left: .15, center: .5, right: .85, taxi1: .25, taxi2: .6 }, draw(x, y, w, h, t, o) {
    sky(x, y, w, h * .8, o.tod, t); for (let i = 0; i < 8; i++) { const bh = h * (.2 + rnd(i + 3) * .25); g.fillStyle = '#94a3b8'; g.fillRect(x + w * i * .13, y + h * .62 - bh, w * .11, bh); }
    g.fillStyle = '#475569'; g.fillRect(x, y + h * .4, w, h * .04); for (let i = 0; i < 7; i++) g.fillRect(x + w * (.02 + i * .16), y + h * .44, 8, h * .34);
    ground(x, y, w, h, .78, '#6b7280'); for (let i = 0; i < 4; i++) drawProp('taxi', x + w * (.12 + i * .26), y + h * .82, h / 900 * .95, t, { color: ['#f8fafc', '#e5e7eb', '#fef9c3', '#f8fafc'][i] });
    nightShade(x, y, w, h, o.tod);
  } },
  city: { floor: .88, size: .42, spots: { left: .2, center: .5, right: .8 }, draw(x, y, w, h, t, o) {
    sky(x, y, w, h * .8, o.tod, t);
    for (let i = 0; i < 12; i++) { const bh = h * (.35 + rnd(i) * .4), bx = x + w * (i * .085 - .02), bw = w * .08, c = ['#334155', '#475569', '#1e293b', '#64748b'][i % 4]; g.fillStyle = c; g.fillRect(bx, y + h * .78 - bh, bw, bh); for (let r = 0; r < bh / 22; r++) for (let k = 0; k < 3; k++) { g.fillStyle = o.tod === 'night' ? (rnd(i * 50 + r * 3 + k) > .45 ? '#fde68a' : '#0f172a') : '#bfdbfe'; g.fillRect(bx + 8 + k * bw * .3, y + h * .78 - bh + 10 + r * 22, bw * .18, 10); } }
    g.fillStyle = '#9ca3af'; g.fillRect(x, y + h * .78, w, h * .04); ground(x, y, w, h, .82, '#374151'); for (let i = 0; i < 10; i++) { g.fillStyle = '#f8fafc'; g.fillRect(x + i * w / 9, y + h * .92, w * .05, 5); }
    nightShade(x, y, w, h, o.tod, -.15);
  } },
  construction: { floor: .86, size: .44, spots: { left: .2, center: .5, right: .8, crane: .8 }, draw(x, y, w, h, t, o) {
    sky(x, y, w, h * .8, o.tod, t); g.strokeStyle = '#f59e0b'; g.lineWidth = 8; g.strokeRect(x + w * .76, y + h * .15, w * .04, h * .65); line(x + w * .6, y + h * .15, x + w * .98, y + h * .15, '#f59e0b', 10); line(x + w * .66, y + h * .15, x + w * .66, y + h * .15 + h * .2 + Math.sin(t) * 10, '#111', 2); rr(x + w * .64, y + h * .35 + Math.sin(t) * 10, w * .04, h * .05, 2); g.fillStyle = '#78716c'; g.fill();
    g.fillStyle = '#9ca3af'; g.fillRect(x + w * .1, y + h * .4, w * .38, h * .38); for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { g.fillStyle = '#475569'; g.fillRect(x + w * (.12 + i * .09), y + h * (.43 + j * .12), w * .06, h * .08); }
    g.strokeStyle = '#78350f'; g.lineWidth = 4; for (let i = 0; i < 5; i++) { line(x + w * (.08 + i * .1), y + h * .38, x + w * (.08 + i * .1), y + h * .78, '#78350f', 4); } for (let j = 0; j < 3; j++) line(x + w * .08, y + h * (.45 + j * .12), x + w * .48, y + h * (.45 + j * .12), '#78350f', 4);
    ground(x, y, w, h, .78, '#a8a29e', 'dirt'); poly([[x + w * .52, y + h * .82], [x + w * .6, y + h * .7], [x + w * .68, y + h * .82]], '#d6b37a'); [.3, .45].forEach((cx) => { poly([[x + w * cx - 12, y + h * .86], [x + w * cx + 12, y + h * .86], [x + w * cx, y + h * .8]], '#f97316'); });
    nightShade(x, y, w, h, o.tod);
  } },
  farm: { floor: .86, size: .44, spots: { barn: .2, field: .7, left: .3, center: .5, right: .8 }, draw(x, y, w, h, t, o) {
    sky(x, y, w, h * .75, o.tod, t); hills(x, y, w, h, y + h * .58, '#84cc16', h * .07, 2);
    g.fillStyle = '#b91c1c'; g.fillRect(x + w * .06, y + h * .4, w * .24, h * .38); poly([[x + w * .04, y + h * .4], [x + w * .18, y + h * .26], [x + w * .32, y + h * .4]], '#7f1d1d'); g.fillStyle = '#f8fafc'; g.fillRect(x + w * .14, y + h * .55, w * .08, h * .23); g.strokeStyle = '#f8fafc'; g.lineWidth = 3; g.beginPath(); g.moveTo(x + w * .14, y + h * .55); g.lineTo(x + w * .22, y + h * .78); g.moveTo(x + w * .22, y + h * .55); g.lineTo(x + w * .14, y + h * .78); g.stroke();
    rr(x + w * .32, y + h * .3, w * .05, h * .48, 10); g.fillStyle = '#9ca3af'; g.fill();
    ground(x, y, w, h, .78, '#65a30d', 'grass'); for (let i = 0; i < 12; i++) { g.fillStyle = '#a16207'; g.fillRect(x + w * (.4 + i * .05), y + h * .72, 6, h * .08); } line(x + w * .4, y + h * .74, x + w, y + h * .74, '#a16207', 5); line(x + w * .4, y + h * .77, x + w, y + h * .77, '#a16207', 5);
    rr(x + w * .82, y + h * .7, w * .08, h * .08, 8); g.fillStyle = '#facc15'; g.fill();
    nightShade(x, y, w, h, o.tod);
  } },
  bush: { floor: .86, size: .44, spots: { left: .2, center: .5, right: .8, tree: .3 }, draw(x, y, w, h, t, o) {
    sky(x, y, w, h * .75, o.tod, t); hills(x, y, w, h, y + h * .6, '#a3a36b', h * .08, 4); hills(x, y, w, h, y + h * .68, '#b5a16a', h * .05, 7);
    ground(x, y, w, h, .76, '#c2a46a', 'grass'); treeShape(x + w * .3, y + h * .78, 1.3, '#4d7c0f', 'acacia'); treeShape(x + w * .82, y + h * .74, .8, '#4d7c0f', 'acacia');
    for (let i = 0; i < 6; i++) ellipse(x + w * rnd(i + 30), y + h * (.78 + rnd(i) * .1), 26, 14, '#65a30d');
    nightShade(x, y, w, h, o.tod);
  } },
  forest: { floor: .86, size: .44, spots: { left: .2, center: .5, right: .8 }, draw(x, y, w, h, t, o) {
    sky(x, y, w, h * .75, o.tod, t);
    for (let L = 0; L < 3; L++) for (let i = 0; i < 9; i++) treeShape(x + w * (i * .12 + L * .05 - .04), y + h * (.7 + L * .06), .9 + L * .25, shade('#14532d', .15 - L * .12), 'pine');
    ground(x, y, w, h, .82, '#3f6212', 'grass'); nightShade(x, y, w, h, o.tod, o.mood === 'scary' ? .2 : 0);
  } },
  beach: { floor: .88, size: .44, spots: { left: .2, center: .5, right: .8, sea: .5 }, draw(x, y, w, h, t, o) {
    sky(x, y, w, h * .7, o.tod, t); g.fillStyle = '#0ea5e9'; g.fillRect(x, y + h * .55, w, h * .22);
    for (let i = 0; i < 4; i++) { g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 3; g.beginPath(); for (let k = 0; k <= 40; k++) g.lineTo(x + k * w / 40, y + h * (.6 + i * .05) + Math.sin(k * .6 + t * 2 + i) * 4); g.stroke(); }
    g.fillStyle = '#fde68a'; g.beginPath(); g.moveTo(x, y + h * .74); for (let k = 0; k <= 40; k++) g.lineTo(x + k * w / 40, y + h * .74 + Math.sin(k * .5 + t * 1.5) * 5); g.lineTo(x + w, y + h); g.lineTo(x, y + h); g.fill();
    treeShape(x + w * .08, y + h * .82, 1.1, '#16a34a', 'palm'); line(x + w * .8, y + h * .9, x + w * .82, y + h * .62, '#78350f', 4); g.beginPath(); g.arc(x + w * .82, y + h * .62, w * .07, Math.PI, 0); g.fillStyle = '#ef4444'; g.fill();
    nightShade(x, y, w, h, o.tod);
  } },
  hospital: { floor: .82, size: .52, indoor: true, spots: { bed: .3, monitor: .12, door: .9, center: .55, left: .2, right: .75 }, draw(x, y, w, h, t, o) {
    wall(x, y, w, h, '#e0f2fe', .82, '#cbd5e1', false); windowFrame(x + w * .52, y + h * .14, w * .16, h * .26, o.tod, t, '#f8fafc');
    rr(x + w * .04, y + h * .3, w * .1, h * .14, 6); g.fillStyle = '#111827'; g.fill(); g.strokeStyle = '#22c55e'; g.lineWidth = 3; g.beginPath(); for (let k = 0; k <= 30; k++) { const ph = (k / 30 + t * .8) % 1; g.lineTo(x + w * (.045 + k * .003), y + h * .37 - (ph > .45 && ph < .5 ? 26 : ph > .5 && ph < .55 ? -14 : 0)); } g.stroke();
    rr(x + w * .18, y + h * .6, w * .3, h * .08, 8); g.fillStyle = '#f8fafc'; g.fill(); rr(x + w * .17, y + h * .5, w * .02, h * .32, 4); g.fillStyle = '#94a3b8'; g.fill(); rr(x + w * .48, y + h * .55, w * .02, h * .27, 4); g.fill(); rr(x + w * .19, y + h * .56, w * .07, h * .05, 8); g.fillStyle = '#f8fafc'; g.fill(); rr(x + w * .25, y + h * .58, w * .23, h * .06, 6); g.fillStyle = '#7dd3fc'; g.fill();
    g.fillStyle = 'rgba(148,163,184,.5)'; g.fillRect(x + w * .72, y + h * .08, w * .006, h * .74); for (let i = 0; i < 6; i++) { rr(x + w * (.72 + i * .02), y + h * .1, w * .02, h * .7, 6); g.fillStyle = i % 2 ? '#99f6e4' : '#5eead4'; g.fill(); }
    doorShape(x + w * .88, y + h * .24, w * .1, h * .58, '#e5e7eb');
  } },
  police_station: { floor: .84, size: .52, indoor: true, spots: { desk: .3, cell: .82, center: .5, left: .15, right: .6 }, draw(x, y, w, h, t, o) {
    wall(x, y, w, h, '#93c5fd', .84, '#475569', false); rr(x + w * .1, y + h * .12, w * .4, h * .1, 4); g.fillStyle = '#1e3a8a'; g.fill(); txt('POLICE', x + w * .3, y + h * .19, h * .055, '#fff', 900, 'center');
    for (let i = 0; i < 3; i++) { rr(x + w * (.1 + i * .1), y + h * .28, w * .07, h * .12, 2); g.fillStyle = '#fef3c7'; g.fill(); circle(x + w * (.135 + i * .1), y + h * .32, 10, '#78716c'); txt('WANTED', x + w * (.135 + i * .1), y + h * .385, h * .02, '#7f1d1d', 900, 'center'); }
    rr(x + w * .15, y + h * .6, w * .32, h * .24, 4); g.fillStyle = '#334155'; g.fill(); g.fillStyle = '#1e293b'; g.fillRect(x + w * .14, y + h * .58, w * .34, h * .03);
    g.fillStyle = '#1e293b'; g.fillRect(x + w * .66, y + h * .2, w * .32, h * .64); for (let i = 0; i < 9; i++) line(x + w * (.67 + i * .035), y + h * .2, x + w * (.67 + i * .035), y + h * .84, '#9ca3af', 5); line(x + w * .66, y + h * .3, x + w * .98, y + h * .3, '#9ca3af', 6);
  } },
  church: { floor: .84, size: .5, indoor: true, spots: { pulpit: .5, pews: .25, left: .2, center: .5, right: .8 }, draw(x, y, w, h, t, o) {
    wall(x, y, w, h, '#f5f5f4', .84, '#78350f'); [.15, .78].forEach((wx) => { rr(x + w * wx, y + h * .12, w * .08, h * .3, [w * .04, w * .04, 0, 0]); g.fillStyle = '#1e3a8a'; g.fill(); for (let i = 0; i < 6; i++) { g.fillStyle = ['#dc2626', '#facc15', '#22c55e', '#3b82f6', '#a855f7', '#f97316'][i]; g.fillRect(x + w * (wx + .01 + (i % 2) * .03), y + h * (.17 + Math.floor(i / 2) * .08), w * .025, h * .06); } });
    g.fillStyle = '#a16207'; g.fillRect(x + w * .495, y + h * .1, w * .012, h * .26); g.fillRect(x + w * .47, y + h * .16, w * .062, h * .02);
    rr(x + w * .44, y + h * .56, w * .12, h * .28, 4); g.fillStyle = '#7c2d12'; g.fill();
    for (let i = 0; i < 2; i++) { rr(x + w * (.05 + i * .7), y + h * .7, w * .2, h * .14, 4); g.fillStyle = '#92400e'; g.fill(); }
  } },
  graveyard: { floor: .86, size: .44, spots: { left: .2, center: .5, right: .8, grave: .4 }, draw(x, y, w, h, t, o) {
    sky(x, y, w, h * .75, o.tod || 'night', t); hills(x, y, w, h, y + h * .62, '#1e293b', h * .07, 5);
    treeShape(x + w * .85, y + h * .8, 1.6, '#000', 'dead'); ground(x, y, w, h, .76, '#1f3a2a', 'grass');
    for (let i = 0; i < 7; i++) { const gx = x + w * (.05 + i * .12), gy = y + h * (.78 + (i % 2) * .05), tilt = (rnd(i) - .5) * .2; g.save(); g.translate(gx, gy); g.rotate(tilt); rr(-22, -60, 44, 62, [22, 22, 0, 0]); g.fillStyle = '#6b7280'; g.fill(); line(-8, -38, 8, -38, '#374151', 3); line(0, -46, 0, -26, '#374151', 3); g.restore(); }
    for (let i = 0; i < 12; i++) line(x + i * w / 11, y + h * .7, x + i * w / 11, y + h * .78, '#111', 4); line(x, y + h * .72, x + w, y + h * .72, '#111', 3);
    nightShade(x, y, w, h, o.tod || 'night', .05);
  } },
  western_town: { floor: .88, size: .42, spots: { saloon: .3, sheriff: .7, left: .15, center: .5, right: .85 }, draw(x, y, w, h, t, o) {
    sky(x, y, w, h * .8, o.tod, t); hills(x, y, w, h, y + h * .6, '#d97706', h * .1, 6);
    [['SALOON', '#92400e', .04, .26], ['BANK', '#a16207', .33, .18], ['SHERIFF', '#78350f', .54, .2], ['HOTEL', '#7c2d12', .78, .22]].forEach(([n, c, bx, bw]) => { g.fillStyle = c; g.fillRect(x + w * bx, y + h * .36, w * bw, h * .42); g.fillStyle = shade(c, -.2); g.fillRect(x + w * bx, y + h * .3, w * bw, h * .08); txt(n, x + w * (bx + bw / 2), y + h * .36, h * .045, '#fef3c7', 900, 'center'); for (let i = 0; i < 3; i++) { g.fillStyle = '#1c1917'; g.fillRect(x + w * (bx + .02 + i * bw / 3.2), y + h * .46, w * .035, h * .08); } g.fillStyle = shade(c, -.35); g.fillRect(x + w * (bx + bw * .4), y + h * .6, w * bw * .2, h * .18); g.fillStyle = shade(c, .15); g.fillRect(x + w * bx, y + h * .56, w * bw, 6); });
    ground(x, y, w, h, .78, '#d6a35c', 'dirt'); drawProp('cactus', x + w * .97, y + h * .86, h / 900, t);
    nightShade(x, y, w, h, o.tod);
  } },
  desert: { floor: .88, size: .42, spots: { left: .2, center: .5, right: .8 }, draw(x, y, w, h, t, o) {
    sky(x, y, w, h * .8, o.tod, t); hills(x, y, w, h, y + h * .6, '#c2410c', h * .14, 8); hills(x, y, w, h, y + h * .72, '#f59e0b', h * .06, 2);
    ground(x, y, w, h, .78, '#fbbf24', 'dirt'); drawProp('cactus', x + w * .15, y + h * .84, h / 700, t); drawProp('cactus', x + w * .8, y + h * .8, h / 1000, t); ellipse(x + w * .55, y + h * .82, 40, 14, '#a8a29e');
    nightShade(x, y, w, h, o.tod);
  } },
  saloon: { floor: .84, size: .52, indoor: true, spots: { bar: .35, piano: .85, doors: .62, center: .5, left: .2, right: .75 }, draw(x, y, w, h, t, o) {
    wall(x, y, w, h, '#92400e', .84, '#5b3417'); for (let i = 0; i < 16; i++) line(x + i * w / 16, y, x + i * w / 16, y + h * .84, 'rgba(0,0,0,.12)', 3);
    for (let i = 0; i < 2; i++) { rr(x + w * (.08 + i * .1), y + h * .2, w * .07, h * .14, 2); g.fillStyle = '#fef3c7'; g.fill(); txt('WANTED', x + w * (.115 + i * .1), y + h * .24, h * .02, '#7f1d1d', 900, 'center'); circle(x + w * (.115 + i * .1), y + h * .29, 12, '#78716c'); }
    rr(x + w * .1, y + h * .58, w * .42, h * .26, 4); g.fillStyle = '#5b3417'; g.fill(); g.fillStyle = '#3f2a1c'; g.fillRect(x + w * .09, y + h * .56, w * .44, h * .035); for (let i = 0; i < 6; i++) drawHeld('bottle', x + w * (.14 + i * .06), y + h * .555, 0, .8);
    const sw = Math.sin(t * 3) * .12; [[.58, 1], [.66, -1]].forEach(([dx, s]) => { g.save(); g.translate(x + w * (dx + (s < 0 ? .08 : 0)), y + h * .5); g.scale(1 - Math.abs(sw), 1); rr(s > 0 ? 0 : -w * .08, 0, w * .08, h * .2, 3); g.fillStyle = '#a16207'; g.fill(); g.restore(); });
    rr(x + w * .78, y + h * .52, w * .18, h * .26, 4); g.fillStyle = '#1c1917'; g.fill(); g.fillStyle = '#f8fafc'; g.fillRect(x + w * .79, y + h * .6, w * .16, h * .04); for (let i = 0; i < 10; i++) g.fillStyle = '#111', g.fillRect(x + w * (.792 + i * .016), y + h * .6, 3, h * .025);
    lampLight(x + w * .3, y + h * .15, h * .4, '255,190,110', .25);
  } },
  park: { floor: .88, size: .44, spots: { bench: .4, swing: .8, left: .2, center: .5, right: .85 }, draw(x, y, w, h, t, o) {
    sky(x, y, w, h * .75, o.tod, t); hills(x, y, w, h, y + h * .62, '#86c06c', h * .06, 9); ground(x, y, w, h, .74, '#65a30d', 'grass');
    g.fillStyle = '#d6d3d1'; g.beginPath(); g.moveTo(x, y + h * .9); g.quadraticCurveTo(x + w * .5, y + h * .78, x + w, y + h * .86); g.lineTo(x + w, y + h * .92); g.quadraticCurveTo(x + w * .5, y + h * .84, x, y + h * .96); g.fill();
    treeShape(x + w * .12, y + h * .78, 1.2); treeShape(x + w * .62, y + h * .74, .9, '#166534');
    rr(x + w * .32, y + h * .74, w * .16, h * .025, 3); g.fillStyle = '#92400e'; g.fill(); rr(x + w * .32, y + h * .68, w * .16, h * .025, 3); g.fill(); g.fillStyle = '#1f2937'; g.fillRect(x + w * .335, y + h * .765, 5, h * .05); g.fillRect(x + w * .47, y + h * .765, 5, h * .05);
    line(x + w * .74, y + h * .84, x + w * .78, y + h * .48, '#dc2626', 6); line(x + w * .9, y + h * .84, x + w * .86, y + h * .48, '#dc2626', 6); line(x + w * .76, y + h * .48, x + w * .88, y + h * .48, '#dc2626', 6); const sa = Math.sin(t * 2) * .3; g.save(); g.translate(x + w * .82, y + h * .48); g.rotate(sa); line(-12, 0, -12, h * .24, '#374151', 2); line(12, 0, 12, h * .24, '#374151', 2); rr(-16, h * .24, 32, 7, 2); g.fillStyle = '#1f2937'; g.fill(); g.restore();
    nightShade(x, y, w, h, o.tod);
  } },
  road: { floor: .9, size: .4, spots: { car: .5, left: .2, right: .8 }, draw(x, y, w, h, t, o) {
    const sp = o.speed ?? 300; sky(x, y, w, h * .7, o.tod, t); hills(x, y, w, h, y + h * .56, '#7aa36b', h * .07, 11);
    for (let i = 0; i < 7; i++) { const tx = x + ((w * i / 6 - t * sp * .6) % (w + 200) + w + 200) % (w + 200) - 100; treeShape(tx, y + h * .66, .7); }
    ground(x, y, w, h, .66, '#86a35b'); g.fillStyle = '#374151'; g.fillRect(x, y + h * .72, w, h * .28);
    for (let i = 0; i < 9; i++) { const lx = x + ((i * w / 7 - t * sp) % (w + 100) + w + 100) % (w + 100) - 50; g.fillStyle = '#f8fafc'; g.fillRect(lx, y + h * .85, w * .07, 6); }
    nightShade(x, y, w, h, o.tod);
  } },
  stage: { floor: .82, size: .5, indoor: true, spots: { center: .5, left: .25, right: .75, mic: .5 }, draw(x, y, w, h, t, o) {
    g.fillStyle = '#1c0a0a'; g.fillRect(x, y, w, h);
    for (let i = 0; i < 14; i++) { g.fillStyle = i % 2 ? '#991b1b' : '#7f1d1d'; g.fillRect(x + i * w / 14, y, w / 14 + 1, h * .82); }
    g.fillStyle = '#5b3417'; g.fillRect(x, y + h * .82, w, h * .18); g.fillStyle = '#7c2d12'; g.fillRect(x, y + h * .82, w, 10);
    poly([[x, y], [x + w * .2, y], [x + w * .12, y + h * .82], [x, y + h * .82]], '#b91c1c'); poly([[x + w, y], [x + w * .8, y], [x + w * .88, y + h * .82], [x + w, y + h * .82]], '#b91c1c');
    g.fillStyle = 'rgba(255,250,220,.18)'; poly([[x + w * .45, y], [x + w * .55, y], [x + w * .7, y + h * .9], [x + w * .3, y + h * .9]]); g.fill(); ellipse(x + w * .5, y + h * .88, w * .2, h * .04, 'rgba(255,250,220,.25)');
    g.fillStyle = 'rgba(0,0,0,.75)'; for (let i = 0; i < 16; i++) { circle(x + w * (.03 + i * .065), y + h * .98, 26); g.fill(); }
  } },
  haunted_house: { floor: .88, size: .42, spots: { door: .5, left: .2, center: .5, right: .8 }, draw(x, y, w, h, t, o) {
    sky(x, y, w, h * .8, 'night', t); hills(x, y, w, h, y + h * .66, '#111827', h * .06, 13);
    g.fillStyle = '#1f2937'; g.fillRect(x + w * .3, y + h * .3, w * .4, h * .48); poly([[x + w * .27, y + h * .3], [x + w * .5, y + h * .1], [x + w * .73, y + h * .3]], '#111827'); g.fillRect(x + w * .58, y + h * .12, w * .05, h * .14);
    const fl = Math.sin(t * 13) + Math.sin(t * 7) > .8; [[.35, .38], [.58, .38], [.35, .56], [.58, .56]].forEach(([wx, wy], i) => { g.fillStyle = i === 1 && fl ? '#fde68a' : '#0b0f19'; g.fillRect(x + w * wx, y + h * wy, w * .07, h * .1); line(x + w * wx, y + h * wy, x + w * (wx + .07), y + h * (wy + .1), '#374151', 2); });
    doorShape(x + w * .47, y + h * .6, w * .06, h * .18, '#3f2a1c', o.doorOpen || 0);
    treeShape(x + w * .12, y + h * .82, 1.8, '#000', 'dead'); ground(x, y, w, h, .78, '#1c1917', 'dirt');
    g.fillStyle = 'rgba(200,210,230,.12)'; for (let i = 0; i < 5; i++) ellipse(x + ((i * w * .3 + t * 20) % (w * 1.3)) - w * .15, y + h * (.82 + i % 2 * .05), w * .2, h * .04); g.fill();
  } },
  hallway: { floor: .84, size: .5, indoor: true, spots: { door1: .2, door2: .5, door3: .8, center: .5, left: .15, right: .85 }, draw(x, y, w, h, t, o) {
    wall(x, y, w, h, '#57534e', .84, '#292524');
    [.12, .44, .76].forEach((dx, i) => doorShape(x + w * dx, y + h * .26, w * .12, h * .58, '#44403c', o.door === i + 1 ? 1 : 0));
    const fl = o.mood === 'scary' ? (Math.sin(t * 17) + Math.sin(t * 5.3) > .5 ? 1 : .25) : 1;
    [.3, .62].forEach((lx) => { ellipse(x + w * lx, y + h * .08, 20, 7, '#fef3c7'); lampLight(x + w * lx, y + h * .12, h * .45, '255,240,200', .35 * fl); });
    if (fl < 1) { g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(x, y, w, h); }
  } },
  jail: { floor: .84, size: .52, indoor: true, spots: { bed: .2, center: .5, bars: .9, left: .3, right: .7 }, draw(x, y, w, h, t, o) {
    wall(x, y, w, h, '#78716c', .84, '#57534e', false); for (let i = 0; i < 10; i++) for (let j = 0; j < 8; j++) { g.strokeStyle = 'rgba(0,0,0,.12)'; g.strokeRect(x + i * w / 10 + (j % 2) * w / 20, y + j * h * .105, w / 10, h * .105); }
    g.fillStyle = '#1c1917'; g.fillRect(x + w * .45, y + h * .14, w * .1, h * .12); for (let i = 0; i < 4; i++) line(x + w * (.46 + i * .027), y + h * .14, x + w * (.46 + i * .027), y + h * .26, '#9ca3af', 3);
    rr(x + w * .04, y + h * .66, w * .26, h * .06, 3); g.fillStyle = '#9ca3af'; g.fill();
    for (let i = 0; i < 14; i++) line(x + w * (.02 + i * .075), y, x + w * (.02 + i * .075), y + h, 'rgba(55,65,81,.9)', 8);
  } },
  space: { floor: .86, size: .44, spots: { left: .2, center: .5, right: .8 }, draw(x, y, w, h, t, o) {
    g.fillStyle = '#030712'; g.fillRect(x, y, w, h); for (let i = 0; i < 120; i++) { const tw = .5 + .5 * Math.sin(t * 2 + i); circle(x + rnd(i) * w, y + rnd(i + 200) * h * .8, 1 + rnd(i + 7) * 1.5, `rgba(255,255,255,${.3 + .6 * tw})`); }
    circle(x + w * .2, y + h * .25, h * .12, '#f97316'); ellipse(x + w * .2, y + h * .25, h * .2, h * .04, null, -.3); g.strokeStyle = '#fde68a'; g.lineWidth = 4; g.stroke(); circle(x + w * .78, y + h * .18, h * .05, '#60a5fa');
    g.fillStyle = '#9ca3af'; g.beginPath(); g.moveTo(x, y + h); g.lineTo(x, y + h * .8); for (let i = 0; i <= 20; i++) g.lineTo(x + i * w / 20, y + h * (.78 + Math.sin(i * 1.3) * .015)); g.lineTo(x + w, y + h); g.fill();
    [[.3, .9, 40], [.7, .86, 26], [.55, .95, 18]].forEach((c) => { ellipse(x + w * c[0], y + h * c[1], c[2], c[2] * .3, '#6b7280'); });
  } },
  cave: { floor: .86, size: .46, spots: { left: .2, center: .5, right: .8 }, draw(x, y, w, h, t, o) {
    g.fillStyle = '#1c1917'; g.fillRect(x, y, w, h); g.fillStyle = '#292524'; g.beginPath(); g.moveTo(x, y + h); for (let i = 0; i <= 20; i++) g.lineTo(x + i * w / 20, y + h * (.2 + .1 * Math.sin(i * 1.7)) + (i % 2) * 20); g.lineTo(x + w, y + h); g.fill();
    for (let i = 0; i < 10; i++) poly([[x + w * (i * .1), y], [x + w * (i * .1 + .06), y], [x + w * (i * .1 + .03), y + h * (.08 + rnd(i) * .1)]], '#44403c');
    ground(x, y, w, h, .82, '#44403c', 'dirt'); drawProp('campfire', x + w * .5, y + h * .86, h / 800, t);
  } },
  wedding: { floor: .84, size: .5, indoor: true, spots: { altar: .5, left: .2, center: .5, right: .8 }, draw(x, y, w, h, t, o) {
    wall(x, y, w, h, '#fdf2f8', .84, '#f5f5f4', false);
    g.strokeStyle = '#f9a8d4'; g.lineWidth = 14; g.beginPath(); g.arc(x + w * .5, y + h * .84, w * .22, Math.PI, 0); g.stroke(); for (let i = 0; i < 18; i++) { const a = Math.PI + i * Math.PI / 17; circle(x + w * .5 + Math.cos(a) * w * .22, y + h * .84 + Math.sin(a) * w * .22, 10, i % 2 ? '#f472b6' : '#fff'); }
    for (let i = 0; i < 2; i++) { rr(x + w * (.03 + i * .78), y + h * .7, w * .18, h * .14, 4); g.fillStyle = '#f8fafc'; g.fill(); }
    for (let i = 0; i < 20; i++) { const k = (t * .15 + rnd(i)) % 1; circle(x + rnd(i + 3) * w, y + k * h, 4, alpha('#f9a8d4', .8)); }
  } },
  gym: { floor: .84, size: .52, indoor: true, spots: { left: .2, center: .5, right: .8 }, draw(x, y, w, h, t, o) {
    wall(x, y, w, h, '#1f2937', .84, '#374151', false); g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(x + w * .05, y + h * .15, w * .9, h * .3);
    for (let i = 0; i < 3; i++) { line(x + w * (.15 + i * .3), y + h * .78, x + w * (.29 + i * .3), y + h * .78, '#9ca3af', 6); rr(x + w * (.14 + i * .3), y + h * .7, 14, h * .16, 4); g.fillStyle = '#111'; g.fill(); rr(x + w * (.28 + i * .3), y + h * .7, 14, h * .16, 4); g.fill(); }
    txt('NO PAIN NO GAIN', x + w * .5, y + h * .32, h * .06, '#ef4444', 900, 'center');
  } },
};
const PLACE_NAMES = Object.keys(PLACES);
