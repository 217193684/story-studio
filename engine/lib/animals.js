/* Story Studio — animals. drawAnimal(spec, st): feet at (0,0), facing right unless st.facing === 'left'. */

const ANIMALS = {
  dog: { L: 110, H: 50, leg: 48, legW: 13, head: 28, snout: [24, 13], ear: 'flop', tail: 'wag', color: '#a16207', belly: '#e7c79a', neck: 26 },
  puppy: { L: 76, H: 38, leg: 30, legW: 10, head: 26, snout: [16, 10], ear: 'flop', tail: 'wag', color: '#d6a35c', belly: '#f3dfbf', neck: 16 },
  cat: { L: 86, H: 38, leg: 38, legW: 10, head: 25, snout: [9, 8], ear: 'pointy', tail: 'curl', color: '#6b7280', belly: '#d1d5db', neck: 18, whiskers: true, stripes: true },
  lion: { L: 170, H: 70, leg: 70, legW: 18, head: 40, snout: [18, 16], ear: 'round', tail: 'tuft', color: '#d39a3a', belly: '#e9c27a', neck: 30, mane: '#8a4b16', whiskers: true },
  cow: { L: 190, H: 92, leg: 66, legW: 18, head: 36, snout: [26, 22], snoutC: '#f4a6b4', ear: 'side', horns: 'small', tail: 'tuft', color: '#f8fafc', spots: '#1f2937', neck: 26, udder: true },
  bull: { L: 200, H: 100, leg: 66, legW: 20, head: 40, snout: [26, 22], snoutC: '#b45309', ear: 'side', horns: 'big', tail: 'tuft', color: '#3f2a1c', neck: 26 },
  horse: { L: 185, H: 78, leg: 104, legW: 16, head: 30, snout: [44, 18], ear: 'pointy', tail: 'hair', color: '#7c4a24', belly: '#7c4a24', neck: 80, neckUp: 1, mane: '#2b1a10', hooves: true },
  donkey: { L: 150, H: 70, leg: 74, legW: 14, head: 28, snout: [36, 17], ear: 'long', tail: 'tuft', color: '#8f8a85', belly: '#d6d3d1', neck: 46, neckUp: .7, mane: '#57534e', hooves: true },
  goat: { L: 110, H: 54, leg: 56, legW: 11, head: 24, snout: [22, 12], ear: 'side', horns: 'curve', tail: 'short', color: '#f5f5f4', neck: 34, neckUp: .7, goatee: true, hooves: true },
  sheep: { L: 120, H: 66, leg: 44, legW: 10, head: 22, snout: [16, 13], ear: 'side', tail: 'short', color: '#f5f5f0', faceC: '#1f2937', legC: '#1f2937', neck: 16, wool: true },
  pig: { L: 125, H: 66, leg: 30, legW: 14, head: 32, snout: [12, 15], snoutC: '#f9a8d4', ear: 'tri', tail: 'curly', color: '#f9b8cf', neck: 6, snoutFlat: true },
  elephant: { L: 230, H: 140, leg: 92, legW: 38, head: 62, snout: [0, 0], ear: 'elephant', tail: 'tuft', color: '#9ca3af', neck: 10, trunk: true },
  rabbit: { L: 60, H: 40, leg: 20, legW: 10, head: 22, snout: [8, 8], ear: 'bunny', tail: 'puff', color: '#e5e7eb', neck: 10, whiskers: true },
  wolf: { L: 130, H: 54, leg: 56, legW: 14, head: 30, snout: [30, 13], ear: 'pointy', tail: 'bushy', color: '#6b7280', belly: '#d1d5db', neck: 30 },
  zebra: { L: 180, H: 76, leg: 96, legW: 15, head: 30, snout: [40, 17], ear: 'pointy', tail: 'tuft', color: '#f8fafc', stripesBW: true, neck: 70, neckUp: 1, mane: '#111827', hooves: true },
  giraffe: { L: 160, H: 70, leg: 150, legW: 14, head: 26, snout: [30, 14], ear: 'pointy', tail: 'tuft', color: '#e8b04a', patches: '#9a5b22', neck: 210, neckUp: 1.4, hooves: true, ossicones: true },
};
const BIRDS = { chicken: { r: 34, color: '#f8fafc', comb: '#dc2626', beak: '#f59e0b', leg: 34 }, rooster: { r: 38, color: '#b45309', comb: '#dc2626', beak: '#f59e0b', leg: 38, tailC: '#14532d' }, duck: { r: 32, color: '#facc15', beak: '#f97316', leg: 20, flat: true }, bird: { r: 16, color: '#3b82f6', beak: '#f59e0b', leg: 12, flies: true }, crow: { r: 18, color: '#111827', beak: '#374151', leg: 14, flies: true }, owl: { r: 30, color: '#8b5e34', beak: '#f59e0b', leg: 10, owl: true } };
const ANIMAL_KINDS = [...Object.keys(ANIMALS), ...Object.keys(BIRDS), 'snake', 'fish', 'ghost', 'monster', 'robot'];

function drawAnimal(sp, st) {
  const kind = sp.kind || sp.animal || 'dog';
  g.save();
  if ((st.facing || 'right') === 'left') g.scale(-1, 1);
  const sc = sp.size === 'big' ? 1.25 : sp.size === 'small' ? .75 : 1;
  g.scale(sc, sc);
  if (BIRDS[kind]) drawBird(kind, sp, st);
  else if (kind === 'snake') drawSnake(sp, st);
  else if (kind === 'fish') drawFish(sp, st);
  else if (kind === 'ghost') drawGhost(sp, st);
  else if (kind === 'monster') drawMonster(sp, st);
  else if (kind === 'robot') drawRobot(sp, st);
  else drawQuad(kind, sp, st);
  g.restore();
}

function animalEye(x, y, r, expr, t, seed) {
  const blink = ((t + seed * 5) % 3.7) < .12;
  if (blink || expr === 'sleeping') { line(x - r, y, x + r, y, '#111', 2.5); return; }
  if (expr === 'happy' || expr === 'laugh') { g.strokeStyle = '#111'; g.lineWidth = 2.5; g.beginPath(); g.arc(x, y + 2, r, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); return; }
  const wide = expr === 'scared' || expr === 'shocked' ? 1.35 : 1;
  circle(x, y, r * 1.15 * wide, '#fff'); circle(x + r * .3, y, r * .7, '#111'); circle(x + r * .1, y - r * .3, r * .25, '#fff');
  if (expr === 'angry') line(x - r * 1.3, y - r * 1.6, x + r * 1.2, y - r * .9, '#111', 3);
}

function drawQuad(kind, sp, st) {
  const A = { ...ANIMALS[kind] }, t = st.t || 0, pose = st.pose || 'stand', c = sp.color || A.color, dk = shade(c, -.2);
  const legC = A.legC || c, seed = hash(sp.name || kind);
  const moving = pose === 'walk' || pose === 'run', ph = st.walkPhase || 0;
  const swing = pose === 'run' ? 34 : pose === 'walk' ? 20 : 0;
  const L2 = A.L / 2, sit = pose === 'sit', lying = pose === 'lie' || pose === 'sleep';
  let bodyY = -(A.leg + A.H * .45), headDown = pose === 'eat';
  if (pose === 'run') bodyY -= Math.abs(Math.sin(ph)) * 8;
  if (pose === 'jump') bodyY -= 40 * Math.max(0, Math.sin(t * 6));
  if (lying) bodyY = -A.H * .45;
  // sitting: the body tilts up around the hips; R() maps a standing-pose point to its sitting position
  const sa = sit ? -32 * DEG : 0, pv = [-L2 * .7, bodyY + A.H * .35];
  const R = (x, y) => { if (!sit) return [x, y]; const dx = x - pv[0], dy = y - pv[1]; return [pv[0] + dx * Math.cos(sa) - dy * Math.sin(sa), pv[1] + dx * Math.sin(sa) + dy * Math.cos(sa) + (A.leg * .55)]; };
  const legLen = A.leg + A.H * .25;
  const drawLeg = (lx, phase, far, front) => {
    const col = far ? shade(legC, -.22) : legC;
    if (sit && !front) { const hp = R(lx, bodyY + A.H * .1); ellipse(hp[0] + 6, hp[1] + 4, L2 * .34, A.H * .42, far ? shade(c, -.22) : c, -.3); ellipse(hp[0] + L2 * .3, -6, L2 * .26, 7, col); return; }
    const a = moving ? swing * Math.sin(ph + phase) * DEG : 0;
    const top = R(lx, bodyY + A.H * .2), foot = sit ? [top[0] + 4, 0] : [top[0] + Math.sin(a) * legLen, top[1] + Math.cos(a) * legLen];
    line(top[0], top[1], foot[0], foot[1], col, A.legW);
    if (A.hooves) line(foot[0], foot[1] - 6, foot[0], foot[1], '#1c1917', A.legW + 1, 'butt');
  };
  // tail
  const happy = st.expr === 'happy' || st.expr === 'laugh';
  const tw = Math.sin(t * (happy ? 14 : 3)) * (happy || A.tail === 'wag' ? 18 : 6);
  const tb = R(-L2 * .95, bodyY - A.H * .15);
  g.save(); g.translate(tb[0], tb[1]); g.rotate(sa);
  switch (A.tail) {
    case 'wag': case 'bushy': g.rotate((-50 + tw) * DEG); line(0, 0, -A.L * .32, 0, A.tail === 'bushy' ? c : dk, A.tail === 'bushy' ? 18 : 8); break;
    case 'curl': g.strokeStyle = c; g.lineWidth = 8; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(-40, 10 + tw, -36, -40 + tw * .5); g.stroke(); break;
    case 'tuft': g.rotate((20 + tw * .4) * DEG); line(0, 0, -6, A.H * .7, dk, 4); ellipse(-6, A.H * .75, 6, 12, shade(c, -.45)); break;
    case 'hair': g.rotate((25 + tw * .3) * DEG); g.fillStyle = A.mane || dk; g.beginPath(); g.moveTo(0, -6); g.quadraticCurveTo(-30, 30, -14, A.H * 1.1); g.lineTo(4, A.H * 1.05); g.quadraticCurveTo(-8, 30, 10, 4); g.fill(); break;
    case 'curly': g.strokeStyle = shade(c, -.12); g.lineWidth = 4; g.beginPath(); for (let a = 0; a < 9; a += .3) g.lineTo(-a * 2 + Math.cos(a * 1.5) * 6, -4 + Math.sin(a * 1.5) * 6); g.stroke(); break;
    case 'short': ellipse(-4, -4, 10, 6, c); break;
    case 'puff': circle(-4, -2, 10, '#fff'); break;
  }
  g.restore();
  if (!lying) { drawLeg(L2 * .62 - 8, Math.PI, true, true); drawLeg(-L2 * .62 - 8, 0, true, false); }
  // body
  const bc = R(0, bodyY);
  const bodyPath = () => { g.beginPath(); g.ellipse(bc[0], bc[1], L2, A.H / 2, sa, 0, TAU); };
  if (A.wool) for (let i = 0; i < 14; i++) { const q = R(-L2 * .8 + (i % 7) * L2 * .27, bodyY - A.H * .25 + Math.floor(i / 7) * A.H * .45); circle(q[0], q[1], A.H * .32, i % 2 ? c : shade(c, -.04)); }
  bodyPath(); g.fillStyle = c; g.fill();
  g.save(); bodyPath(); g.clip(); g.translate(bc[0], bc[1]); g.rotate(sa);
  if (A.belly) ellipse(0, A.H * .22, L2 * .75, A.H * .22, A.belly);
  if (A.spots) [[-.4, -.2, .35], [.25, .1, .28], [-.05, .35, .2], [.5, -.3, .18]].forEach((q) => ellipse(L2 * q[0], A.H * q[1], L2 * q[2], A.H * q[2] * 1.1, A.spots));
  if (A.stripes) for (let i = -3; i <= 3; i++) line(i * 14, -A.H / 2, i * 14 - 6, 0, dk, 5);
  if (A.stripesBW) for (let i = -6; i <= 6; i++) line(i * 15, -A.H / 2, i * 15 - 10, A.H / 2, '#111827', 6);
  if (A.patches) for (let i = 0; i < 12; i++) { rr(-L2 + rnd(i) * A.L, -A.H / 2 + rnd(i + 5) * A.H, 18, 14, 5); g.fillStyle = A.patches; g.fill(); }
  g.restore();
  if (A.udder && !sit) ellipse(-L2 * .15, bodyY + A.H * .48, 16, 10, '#f4a6b4');
  if (!lying) { drawLeg(L2 * .62 + 6, 0, false, true); drawLeg(-L2 * .62 + 6, Math.PI, false, false); }
  else { ellipse(L2 * .5, -6, 22, 8, legC); ellipse(-L2 * .5, -6, 22, 8, legC); }
  // neck + head
  const nUp = A.neckUp || .4;
  let [hx, hy] = R(L2 * .92 + A.neck * .35, bodyY - A.H * .25 - A.neck * nUp);
  if (sit) hy -= A.neck * .15;
  if (headDown) { hx = L2 * 1.05; hy = -A.head * .7; }
  if (pose === 'lie') hy = bodyY - A.H * .2;
  if (pose === 'sleep') { hy = -A.head * .8; hx = L2 * 1.0; }
  hy += Math.sin(t * 2 + seed * 6) * 1.5;
  const nb = R(L2 * .55, bodyY - A.H * .1);
  line(nb[0], nb[1], hx - A.head * .3, hy + A.head * .2, c, A.trunk ? A.head * 1.2 : Math.max(A.legW * 1.4, A.head * .9));
  if (A.mane && kind !== 'lion') { const m0 = R(L2 * .5, bodyY - A.H * .45); line(m0[0], m0[1], hx - A.head * .5, hy - A.head * .6, A.mane, 10); }
  if (kind === 'lion') circle(hx - 4, hy, A.head * 1.55, A.mane);
  if (A.ear === 'elephant') ellipse(hx - A.head * .5, hy + 4, A.head * .75, A.head * 1.0, shade(c, -.1));
  if (A.ear === 'long') ellipse(hx - A.head * .4, hy - A.head * 1.2, 8, A.head * .9, c, -.3);
  if (A.ear === 'bunny') { ellipse(hx - 6, hy - A.head * 1.5, 7, A.head * 1.1, c, -.15); ellipse(hx - 6, hy - A.head * 1.5, 3, A.head * .8, '#fbcfe8', -.15); }
  const hr = A.head;
  ellipse(hx, hy, hr * 1.05, hr * .92, A.faceC || c);
  if (A.snout[0] > 0 && !A.snoutFlat) ellipse(hx + hr * .8, hy + hr * .22, A.snout[0], A.snout[1], A.snoutC || (A.faceC ? A.faceC : shade(c, .12)));
  if (A.snoutFlat) { ellipse(hx + hr * 1.0, hy + hr * .15, 8, A.snout[1], A.snoutC); circle(hx + hr * 1.03, hy + hr * .05, 2.5, '#9d174d'); circle(hx + hr * 1.03, hy + hr * .25, 2.5, '#9d174d'); }
  else if (A.snout[0] > 0) circle(hx + hr * .8 + A.snout[0] * .85, hy + hr * .12, Math.max(3, A.snout[1] * .35), kind === 'cow' ? '#be7083' : '#1f1410');
  if (A.trunk) { g.strokeStyle = c; g.lineWidth = 22; g.lineCap = 'round'; g.beginPath(); g.moveTo(hx + hr * .7, hy + hr * .2); g.quadraticCurveTo(hx + hr * 1.3, hy + hr * 1.2, hx + hr * 1.0 + Math.sin(t * 2) * 10, hy + hr * 1.9); g.stroke(); poly([[hx + hr * .5, hy + hr * .5], [hx + hr * .62, hy + hr * .95], [hx + hr * .4, hy + hr * .6]], '#f5f5f4'); }
  const talk = clamp(st.talk || 0);
  const mx = hx + hr * .55 + A.snout[0] * .6, my = hy + hr * .22 + A.snout[1] * .7;
  if (talk > .05 && !A.trunk) ellipse(mx, my, A.snout[0] * .4 + 4, 3 + talk * hr * .3, '#4a1a14');
  else if (happy && !A.trunk) { g.strokeStyle = '#1f1410'; g.lineWidth = 2; g.beginPath(); g.arc(mx - 4, my - 4, 7, .2, Math.PI - .2); g.stroke(); }
  if ((kind === 'dog' || kind === 'puppy') && (happy || moving) && talk < .05) ellipse(mx - 2, my + 6, 5, 9, '#ef4444');
  animalEye(hx + hr * .3, hy - hr * .22, Math.max(3.2, hr * .13), st.expr, t, seed);
  if (A.ear === 'flop') ellipse(hx - hr * .55, hy - hr * .1, hr * .32, hr * .72, shade(c, -.25), .35);
  if (A.ear === 'pointy') poly([[hx - hr * .55, hy - hr * .5], [hx - hr * .1, hy - hr * .7], [hx - hr * .45, hy - hr * 1.5]], shade(c, -.1));
  if (A.ear === 'round') circle(hx - hr * .45, hy - hr * .75, hr * .3, shade(c, -.15));
  if (A.ear === 'side') ellipse(hx - hr * .7, hy - hr * .4, hr * .45, hr * .18, shade(c, -.08), -.4);
  if (A.ear === 'tri') poly([[hx - hr * .5, hy - hr * .6], [hx + hr * .1, hy - hr * .8], [hx - hr * .3, hy - hr * 1.25]], shade(c, -.1));
  if (A.horns === 'small') poly([[hx - hr * .3, hy - hr * .75], [hx - hr * .1, hy - hr * .8], [hx - hr * .3, hy - hr * 1.25]], '#f5f5f4');
  if (A.horns === 'big') { g.strokeStyle = '#f5f5f4'; g.lineWidth = 8; g.lineCap = 'round'; g.beginPath(); g.moveTo(hx - hr * .2, hy - hr * .7); g.quadraticCurveTo(hx - hr * .2, hy - hr * 1.6, hx + hr * .5, hy - hr * 1.5); g.stroke(); }
  if (A.horns === 'curve') { g.strokeStyle = '#a8a29e'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(hx - hr * .1, hy - hr * .7); g.quadraticCurveTo(hx - hr * .9, hy - hr * 1.7, hx - hr * 1.3, hy - hr * .7); g.stroke(); }
  if (A.ossicones) { line(hx - hr * .3, hy - hr * .7, hx - hr * .4, hy - hr * 1.4, shade(c, -.3), 5); circle(hx - hr * .4, hy - hr * 1.45, 5, '#5b3417'); }
  if (A.goatee) poly([[hx + hr * 1.0, hy + hr * .6], [hx + hr * 1.3, hy + hr * .6], [hx + hr * 1.12, hy + hr * 1.3]], '#d6d3d1');
  if (A.whiskers) { g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 1.2; for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(hx + hr * .9, hy + hr * .25); g.lineTo(hx + hr * 1.6, hy + hr * .25 + i * 6); g.stroke(); } }
  if (pose === 'sleep' || st.expr === 'sleeping') for (let i = 0; i < 3; i++) { const k = ((t * .6 + i / 3) % 1); txt('z', hx + 20 + k * 30, hy - 30 - k * 50, 18 + i * 5, `rgba(255,255,255,${1 - k})`, 900, 'center'); }
}

function drawBird(kind, sp, st) {
  const B = BIRDS[kind], t = st.t || 0, c = sp.color || B.color, r = B.r, pose = st.pose || 'stand';
  const flying = B.flies && (pose === 'fly' || pose === 'walk' || pose === 'run');
  const ph = st.walkPhase || 0, by = flying ? -r * 3 - Math.sin(t * 3) * 10 : -(B.leg + r * .8);
  if (!flying) { const s1 = pose === 'walk' || pose === 'run' ? 18 * Math.sin(ph) : 0; [[-6, s1], [6, -s1]].forEach(([dx, a]) => { const fx = dx + Math.sin(a * DEG) * B.leg; line(dx, by + r * .6, fx, 0, B.beak, 4); line(fx - 6, 0, fx + 8, 0, B.beak, 3); }); }
  if (B.tailC) { poly([[-r * .8, by - r * .2], [-r * 1.9, by - r * 1.2], [-r * 1.4, by + r * .2]], B.tailC); }
  ellipse(0, by, r * 1.15, r * .9, c);
  if (B.owl) { ellipse(0, by - r * .1, r * .95, r * 1.2, c); circle(-r * .35, by - r * .45, r * .3, '#fef3c7'); circle(r * .35, by - r * .45, r * .3, '#fef3c7'); circle(-r * .35, by - r * .45, r * .13, '#111'); circle(r * .35, by - r * .45, r * .13, '#111'); poly([[-3, by - r * .2], [3, by - r * .2], [0, by]], B.beak); return; }
  const wa = flying ? Math.sin(t * 16) * 50 : (pose === 'talk' ? Math.sin(t * 8) * 15 : 0);
  g.save(); g.translate(-r * .1, by - r * .1); g.rotate((-wa - 10) * DEG); ellipse(-r * .3, 0, r * .75, r * .4, shade(c, -.12)); g.restore();
  const hx = r * .85, hy = by - r * .8;
  circle(hx, hy, r * .6, c);
  if (B.comb) { [[-.2, -.7], [.1, -.8], [.35, -.65]].forEach((q) => circle(hx + r * q[0], hy + r * q[1], r * .2, B.comb)); ellipse(hx + r * .45, hy + r * .5, r * .12, r * .2, B.comb); }
  const talk = clamp(st.talk || 0);
  if (B.flat) { ellipse(hx + r * .7, hy + r * .1, r * .4, r * .14 + talk * 6, B.beak); }
  else { poly([[hx + r * .5, hy - r * .08 - talk * 4], [hx + r * 1.05, hy + r * .05], [hx + r * .5, hy + r * .2 + talk * 4]], B.beak); }
  animalEye(hx + r * .2, hy - r * .15, Math.max(2.5, r * .12), st.expr, t, hash(sp.name || kind));
}

function drawSnake(sp, st) {
  const t = st.t || 0, c = sp.color || '#16a34a';
  g.strokeStyle = c; g.lineWidth = 16; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath();
  for (let i = 0; i <= 30; i++) { const x = -150 + i * 6, y = -10 + Math.sin(i * .45 - t * 4) * 12; i ? g.lineTo(x, y) : g.moveTo(x, y); }
  g.stroke(); ellipse(36, -14 + Math.sin(30 * .45 - t * 4) * 12, 16, 11, c);
  circle(42, -20, 3.5, '#fff'); circle(43, -20, 2, '#111');
  if (st.talk > .05 || Math.sin(t * 3) > .6) { line(52, -12, 66, -12, '#dc2626', 2); line(66, -12, 72, -16, '#dc2626', 2); line(66, -12, 72, -8, '#dc2626', 2); }
}
function drawFish(sp, st) { const t = st.t || 0, c = sp.color || '#f97316'; const y = -40 + Math.sin(t * 2) * 6; ellipse(0, y, 40, 22, c); poly([[-34, y], [-62, y - 20 + Math.sin(t * 8) * 6], [-62, y + 20 + Math.sin(t * 8) * 6]], shade(c, -.15)); circle(22, y - 5, 5, '#fff'); circle(23, y - 5, 2.5, '#111'); }
function drawGhost(sp, st) {
  const t = st.t || 0, y = -110 + Math.sin(t * 2.2) * 10, c = sp.color || '#f8fafc', a = sp.alpha ?? .85;
  g.save(); g.globalAlpha = a; g.shadowColor = 'rgba(200,220,255,.8)'; g.shadowBlur = 30;
  g.beginPath(); g.arc(0, y - 30, 55, Math.PI, 0); g.lineTo(55, y + 60); for (let i = 0; i < 5; i++) g.quadraticCurveTo(55 - i * 22 - 11, y + 75 + Math.sin(t * 5 + i) * 6, 55 - (i + 1) * 22, y + 60); g.closePath(); g.fillStyle = c; g.fill(); g.restore();
  ellipse(-18, y - 30, 9, 14, '#111'); ellipse(18, y - 30, 9, 14, '#111');
  const talk = clamp(st.talk || 0); ellipse(0, y + 2, 10, 6 + talk * 14 + (st.expr === 'scared' || st.expr === 'evil' ? 6 : 0), '#111');
}
function drawMonster(sp, st) {
  const t = st.t || 0, c = sp.color || '#7c3aed', ph = st.walkPhase || 0, bob = Math.sin(t * 2) * 3;
  [[-26, 1], [26, -1]].forEach(([x, s]) => line(x, -60, x + s * 6 * Math.sin(ph), 0, shade(c, -.2), 26));
  ellipse(0, -130 + bob, 80, 90, c);
  for (let i = 0; i < 5; i++) poly([[-60 + i * 30, -205 + bob], [-45 + i * 30, -240 + bob], [-30 + i * 30, -205 + bob]], shade(c, -.25));
  circle(0, -160 + bob, 30, '#fff'); circle(6, -160 + bob, 13, '#111');
  const talk = clamp(st.talk || 0); rr(-40, -110 + bob, 80, 18 + talk * 26, 8); g.fillStyle = '#2e1065'; g.fill();
  for (let i = 0; i < 5; i++) poly([[-36 + i * 16, -110 + bob], [-28 + i * 16, -96 + bob], [-20 + i * 16, -110 + bob]], '#fff');
  [[-80, 1], [80, -1]].forEach(([x, s]) => line(x, -140 + bob, x - s * 30, -90 + bob + Math.sin(t * 3) * 10, c, 22));
}
function drawRobot(sp, st) {
  const t = st.t || 0, c = sp.color || '#94a3b8', ph = st.walkPhase || 0;
  [[-20, 1], [20, -1]].forEach(([x, s]) => line(x, -80, x + s * 10 * Math.sin(ph), 0, shade(c, -.25), 18));
  rr(-50, -200, 100, 120, 14); g.fillStyle = c; g.fill(); rr(-30, -170, 60, 40, 6); g.fillStyle = '#0f172a'; g.fill();
  for (let i = 0; i < 3; i++) circle(-15 + i * 15, -150, 5, ['#ef4444', '#22c55e', '#3b82f6'][i]);
  rr(-40, -280, 80, 66, 12); g.fillStyle = shade(c, .1); g.fill(); line(0, -280, 0, -305, '#475569', 4); circle(0, -308, 7, Math.sin(t * 6) > 0 ? '#ef4444' : '#7f1d1d');
  circle(-17, -255, 10, '#22d3ee'); circle(17, -255, 10, '#22d3ee');
  const talk = clamp(st.talk || 0); rr(-20, -232, 40, 6 + talk * 10, 3); g.fillStyle = '#0f172a'; g.fill();
  [[-50, -1], [50, 1]].forEach(([x, s]) => line(x, -190, x + s * 26, -120 + Math.sin(t * 2 + s) * 8, shade(c, -.15), 16));
}
