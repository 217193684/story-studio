/* Story Studio — the player. Draws one frame of a compiled story (window.D) at time T on a 1280×720 logical canvas. */
const VW = 1280, VH = 720;
const NAME_COLORS = ['#F59E0B', '#2DD4BF', '#F472B6', '#60A5FA', '#A3E635', '#FB923C', '#C084FC', '#F87171', '#34D399', '#FACC15'];

function sceneAt(D, T) { let s = D.scenes[0]; for (const sc of D.scenes) if (T >= sc.start) s = sc; return s; }

function actorState(sc, id, T) {
  const a = sc.actors[id]; const st = { ...a.init, prevPose: null, poseStart: sc.start, blend: 1, walkPhase: 0 };
  let poseAt = sc.start;
  const setPose = (p, t) => { if (p && p !== st.pose) { st.prevPose = st.pose; st.pose = p; poseAt = t; } };
  for (const e of a.events) {
    if (e.t > T) break;
    if (e.type === 'set') {
      if (e.pose) setPose(e.pose, e.t);
      ['x', 'y', 'expr', 'facing', 'hold', 'visible', 'depth', 'alpha'].forEach((k) => { if (e[k] !== undefined) st[k] = e[k]; });
    } else if (e.type === 'move') {
      const k = clamp((T - e.t) / Math.max(.01, e.t1 - e.t));
      st.facing = e.x1 >= e.x0 ? 'right' : 'left';
      if (T < e.t1) {
        if (st.pose !== e.pose) setPose(e.pose, e.t);
        st.x = lerp(e.x0, e.x1, k); if (e.y1 !== undefined) st.y = lerp(e.y0 || 0, e.y1, k);
        st.walkPhase = Math.abs(st.x - e.x0) * VW / (e.pose === 'run' ? 60 : 38);
        if (e.visibleDuring !== undefined) st.visible = true;
      } else {
        st.x = e.x1; if (e.y1 !== undefined) st.y = e.y1; setPose(e.after || 'stand', e.t1);
        if (e.hideAfter) st.visible = false;
        if (e.faceAfter) st.facing = e.faceAfter;
      }
    }
  }
  st.poseT = T - poseAt; st.blend = st.prevPose ? clamp(st.poseT / .28) : 1;
  // talking: envelope value for this moment
  st.talk = 0;
  const tk = window.D.talk[id];
  if (tk) for (const seg of tk) { if (T >= seg[0] && T < seg[0] + seg[2].length / seg[1]) { st.talk = seg[2][Math.floor((T - seg[0]) * seg[1])] || 0; break; } }
  return st;
}

function charHeight(spec) {
  if (spec.kind && spec.kind !== 'human') { const A = ANIMALS[spec.kind]; if (A) return A.leg + A.H + A.head + (A.neck || 0) * (A.neckUp || .3); const B = BIRDS[spec.kind]; if (B) return B.leg + B.r * 2.4; return 260; }
  return { kid: 230, teen: 280, adult: 310, old: 300 }[spec.age || 'adult'];
}

function cameraAt(sc, T) {
  const cams = sc.camera || []; let cur = { zoom: 1, cx: .5, cy: .55, t: sc.start }, prev = cur;
  for (const c of cams) { if (c.t > T) break; prev = { ...cur }; cur = { ...cur, ...c }; }
  const k = easeIO(clamp((T - cur.t) / (cur.dur || .9)));
  const cam = { zoom: lerp(prev.zoom, cur.zoom, k), cx: lerp(prev.cx, cur.cx, k), cy: lerp(prev.cy, cur.cy, k), shake: 0 };
  for (const c of cams) if (c.shake && T >= c.t && T < c.t + c.shake) cam.shake = 1;
  return cam;
}

function drawScene(D, sc, T) {
  const P = PLACES[sc.place] || PLACES.street, u0 = VH * P.size / 310, floorY = VH * P.floor;
  const opts = { tod: sc.tod, mood: sc.mood, ...(sc.opts || {}) };
  for (const pe of sc.propEvents || []) if (pe.t <= T && pe.place) Object.assign(opts, pe.place);
  const cam = cameraAt(sc, T);
  g.save();
  const sx = cam.shake ? Math.sin(T * 60) * 8 : 0, sy = cam.shake ? Math.cos(T * 47) * 6 : 0;
  g.translate(VW / 2 + sx, VH / 2 + sy); g.scale(cam.zoom, cam.zoom);
  const z = cam.zoom, cx = clamp(cam.cx, .5 / z, 1 - .5 / z), cy = clamp(cam.cy, .5 / z, 1 - .5 / z);
  g.translate(-cx * VW, -cy * VH);
  P.draw(0, 0, VW, VH, T, opts);
  if (P.indoor && sc.tod === 'night') { g.fillStyle = 'rgba(10,12,40,.38)'; g.fillRect(0, 0, VW, VH); }
  if (P.indoor && sc.tod === 'evening') { g.fillStyle = 'rgba(60,30,40,.12)'; g.fillRect(0, 0, VW, VH); }
  const props = (sc.props || []).map((p, i) => ({ ...p, i }));
  const propState = (p) => { const s = { ...p }; for (const pe of sc.propEvents || []) if (pe.t <= T && pe.prop === p.i) { if (pe.move) { const k = clamp((T - pe.t) / pe.dur); s.x = lerp(pe.x0, pe.x1, easeIO(k)); s.moving = k < 1; s.dir = pe.x1 > pe.x0 ? 1 : -1; s.flip = pe.x1 < pe.x0; } Object.assign(s, pe.set || {}); } return s; };
  const drawP = (p) => { const s = propState(p), d = s.depth || 0; drawProp(s.type, s.x * VW, floorY - d * VH * .07, u0 * (s.scale || 1) * (1 - d * .3), T, s); };
  props.filter((p) => !p.front).forEach(drawP);
  // actors, far ones first
  const states = Object.keys(sc.actors).map((id) => ({ id, st: actorState(sc, id, T) })).filter((a) => a.st.visible !== false);
  states.sort((a, b) => (b.st.depth || 0) - (a.st.depth || 0));
  const heads = {};
  for (const { id, st } of states) {
    const spec = D.cast[id] || { kind: 'human' }, d = st.depth || 0, u = u0 * (1 - d * .3) * (spec.scale || 1);
    const ax = st.x * VW, ay = floorY - d * VH * .07 - (st.y || 0) * VH;
    heads[id] = [ax, ay - charHeight(spec) * u, u];
    g.save(); g.translate(ax, ay); g.scale(u, u); if (st.alpha !== undefined) g.globalAlpha = st.alpha;
    const look = st.facing === 'left' ? -.5 : st.facing === 'right' ? .5 : 0;
    const dst = { t: T, pose: st.pose, prevPose: st.prevPose, blend: st.blend, poseT: st.poseT, facing: st.facing, expr: st.expr, talk: st.talk, walkPhase: st.walkPhase, hold: st.hold, look, seat: st.seat };
    if (!spec.kind || spec.kind === 'human') drawHuman(spec, dst); else drawAnimal(spec, dst);
    g.restore();
  }
  props.filter((p) => p.front).forEach(drawP);
  // anchored effects
  for (const e of sc.effects || []) {
    if (T < e.t0 || T > e.t1 || !e.point) continue;
    const p = (T - e.t0) / (e.t1 - e.t0); let ex = (e.x ?? .5) * VW, ey = VH * (e.y ?? .4), s = 1;
    if (e.at && heads[e.at]) {
      const [hx, hy, hu] = heads[e.at]; s = Math.max(.6, hu * 1.2);
      const off = { shock: [110, -70, .75], pow: [110, -70, .75], boom: [110, -70, .8], exclamation: [40, -60, 1], question: [40, -60, 1], anger: [50, 10, 1], sweat: [30, 40, 1], hearts: [0, -10, 1], music: [40, 0, 1], zzz: [40, -20, 1], stars: [0, -10, 1], tears: [0, 90, 1] }[e.kind] || [0, -20, 1];
      ex = hx + off[0] * s; ey = hy + off[1] * s; s *= off[2];
    }
    pointEffect(e.kind, ex, ey, s, T, p);
  }
  g.restore();
  // screen effects and weather
  if (sc.weather && sc.weather !== 'none') screenEffect(sc.weather, 0, 0, VW, VH, T, 0);
  for (const e of sc.effects || []) if (!e.point && T >= e.t0 && T <= e.t1) screenEffect(e.kind, 0, 0, VW, VH, T, (T - e.t0) / (e.t1 - e.t0), e);
  if (sc.mood === 'scary') screenEffect('vignette', 0, 0, VW, VH, T, 0, { amount: .55 });
  if (sc.mood === 'tense' || sc.mood === 'mystery') screenEffect('vignette', 0, 0, VW, VH, T, 0, { amount: .35 });
  if (sc.mood === 'romantic') { g.fillStyle = 'rgba(255,150,170,.08)'; g.fillRect(0, 0, VW, VH); }
  if (sc.mood === 'sad') { g.fillStyle = 'rgba(60,80,120,.12)'; g.fillRect(0, 0, VW, VH); }
}

function captionsAt(D, T) {
  const c = D.captions.find((c) => T >= c.t0 && T < c.t1 + .25); if (!c) return;
  const size = 34, sp = size * .3, lh = size * 1.3, maxW = 1060;
  g.font = `800 ${size}px ${FONT}`; g.textBaseline = 'alphabetic'; g.textAlign = 'left'; g.lineJoin = 'round';
  const ws = c.words, lines = [[]]; let cw = 0;
  ws.forEach((w, i) => { const m = g.measureText(w[0]).width; if (cw + m > maxW && lines[lines.length - 1].length) { lines.push([]); cw = 0; } lines[lines.length - 1].push(i); cw += m + sp; });
  let yy = VH - 40 - (lines.length - 1) * lh;
  if (c.name) {
    g.font = `900 22px ${FONT}`; const nw = g.measureText(c.name).width + 28; const ny = yy - size - 34;
    rr(VW / 2 - nw / 2, ny - 4, nw, 34, 17); g.fillStyle = c.color || '#F59E0B'; g.fill(); txt(c.name, VW / 2, ny + 20, 22, '#111', 900, 'center');
    g.font = `800 ${size}px ${FONT}`; g.textAlign = 'left';
  }
  lines.forEach((li) => {
    const lw = li.reduce((a, i) => a + g.measureText(ws[i][0]).width + sp, -sp); let xx = (VW - lw) / 2;
    li.forEach((i) => { const w = ws[i], on = T >= w[1];
      g.lineWidth = size * .24; g.strokeStyle = 'rgba(0,0,0,.9)'; g.strokeText(w[0], xx, yy);
      g.fillStyle = on ? (c.narrator ? '#fde68a' : '#fff') : 'rgba(255,255,255,.55)'; g.fillText(w[0], xx, yy); xx += g.measureText(w[0]).width + sp; });
    yy += lh;
  });
}

window.render = function (T) {
  const D = window.D; g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, g.canvas.width, g.canvas.height); g.restore();
  g.save(); g.scale(g.canvas.width / VW, g.canvas.height / VH);
  const sc = sceneAt(D, T);
  drawScene(D, sc, T);
  if (D.captionsOn !== false) captionsAt(D, T);
  // scene title card ("Later that night…")
  if (sc.title && T < sc.start + 2.4) { const a = clamp((T - sc.start) / .3) * (1 - clamp((T - sc.start - 2.0) / .4)); g.fillStyle = `rgba(0,0,0,${.55 * a})`; g.fillRect(0, VH * .4, VW, VH * .16); g.globalAlpha = a; txt(sc.title, VW / 2, VH * .5, 44, '#fff', 900, 'center'); g.globalAlpha = 1; }
  // fade through black between scenes
  const fin = clamp((T - sc.start) / .45), fout = clamp((sc.end - T) / .45);
  const fa = 1 - Math.min(fin, fout); if (fa > 0) { g.fillStyle = `rgba(0,0,0,${fa})`; g.fillRect(0, 0, VW, VH); }
  // opening title and end card
  if (T < D.intro) { const a = 1 - clamp((T - D.intro + .6) / .6); g.fillStyle = `rgba(0,0,0,${.6 * a})`; g.fillRect(0, 0, VW, VH); g.globalAlpha = a; txt(D.title, VW / 2, VH * .46, D.title.length > 28 ? 54 : 70, '#fff', 900, 'center'); if (D.subtitle) txt(D.subtitle, VW / 2, VH * .56, 28, '#fde68a', 700, 'center'); g.globalAlpha = 1; }
  if (T > D.total - D.outro) { const a = clamp((T - (D.total - D.outro)) / .6); g.fillStyle = `rgba(0,0,0,${.85 * a})`; g.fillRect(0, 0, VW, VH); g.globalAlpha = a; txt(D.endText || 'The End', VW / 2, VH * .48, 72, '#fff', 900, 'center'); if (D.endSub) txt(D.endSub, VW / 2, VH * .58, 28, '#fde68a', 700, 'center'); g.globalAlpha = 1; }
  g.restore();
};
