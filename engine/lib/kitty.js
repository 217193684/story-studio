// Story Studio — the channel's cat ("Kitty"): white, orange patch over the right ear, orange ears,
// dot eyes, a little "w" mouth and pink blush. Flat colours, dark-brown outline. Shared by the calm scenes.
//   Kitty.head(g, x, y, scale, {look, down, eyes, blink, yawn, earTwitch, rot})
//     look: -1 (looking left) .. 1 (right)   down: 0..1 looking down   eyes: 'open' | 'closed' | 'happy'
//   Kitty.torso(g, x, y, scale)   — chest/shoulders under the head (for sitting behind a desk or a window)
//   Kitty.arm(g, x0, y0, x1, y1, scale) — a soft arm ending in a round paw
(function () {
  const TAU = Math.PI * 2;
  const C = { ink: '#3a2520', white: '#fffaf2', orange: '#f7942f', orangeDeep: '#e2682a', blush: 'rgba(247,150,150,.8)', shade: 'rgba(230,205,190,.55)' };
  let g;
  function shape(path, fill, lw) { g.beginPath(); path(); if (fill) { g.fillStyle = fill; g.fill(); } if (lw) { g.lineWidth = lw; g.strokeStyle = C.ink; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); } }
  const ell = (x, y, rx, ry, fill, lw, rot = 0) => shape(() => g.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), rot, 0, TAU), fill, lw);
  function arc(x, y, r, a0, a1, lw) { g.beginPath(); g.arc(x, y, r, a0, a1); g.lineWidth = lw; g.strokeStyle = C.ink; g.lineCap = 'round'; g.stroke(); }

  function ear(s, dx, twitch) {
    g.save(); g.translate(s * 58 + dx * .35, -52); g.rotate(s * .12 - twitch * .35 * (s < 0 ? 1 : 0));
    shape(() => { g.moveTo(-s * 40, 16); g.quadraticCurveTo(s * -10, -38, s * 8, -50); g.quadraticCurveTo(s * 26, -38, s * 44, 8); g.closePath(); }, C.orange, 5);
    shape(() => { g.moveTo(-s * 18, 6); g.quadraticCurveTo(s * -2, -24, s * 8, -32); g.quadraticCurveTo(s * 18, -22, s * 28, 4); g.closePath(); }, C.orangeDeep, 0);
    g.restore();
  }
  function head(ctx, x, y, s = 1, o = {}) {
    g = ctx; g.save(); g.translate(x, y); g.rotate(o.rot || 0); g.scale(s, s);
    const lk = o.look || 0, dx = lk * 22, dn = o.down || 0, dy = dn * 9;
    ear(-1, dx, o.earTwitch || 0); ear(1, dx, 0);
    const face = () => g.ellipse(0, 0, 104, 90, 0, 0, TAU);
    shape(face, C.white, 0);
    g.save(); g.beginPath(); face(); g.clip();
    ell(58 + dx * .6, -74, 82, 58, C.orange, 0, .35);           // the orange patch over the right ear
    ell(dx * .5, 84, 60, 16, C.shade, 0);                      // soft shade under the chin
    g.restore();
    shape(face, null, 5.5);
    // blush
    ell(-60 + dx, 26 + dy * .5, 17, 10, C.blush, 0); ell(60 + dx, 26 + dy * .5, 17, 10, C.blush, 0);
    // eyes
    const bl = Math.min(1, o.blink || 0), shut = o.eyes === 'closed' || o.eyes === 'happy' || bl > .75;
    for (const sd of [-1, 1]) {
      const ex = sd * 42 + dx * 1.1, ey = 6 + dy;
      if (o.eyes === 'happy') arc(ex, ey + 6, 11, Math.PI * 1.15, Math.PI * 1.85, 4.5);        // ^ ^
      else if (shut) arc(ex, ey - 4, 11, Math.PI * .15, Math.PI * .85, 4.5);                     // ‿ ‿ peaceful
      else {
        const ry = (dn > .5 ? 8 : 12.5) * (1 - bl * .9);
        ell(ex, ey, 11, ry, C.ink, 0);
        if (ry > 5) ell(ex - 3.5 + lk * 2, ey - ry * .38, 3.6, 3.6, '#fff', 0);
      }
    }
    // mouth: a little "w", or a yawn
    const yw = o.yawn || 0, mx = dx * 1.05, my = 22 + dy;
    if (yw > .06) { ell(mx, my + 8, 6 + 12 * yw, 4 + 20 * yw, '#6e2a2a', 4); ell(mx, my + 10 + 14 * yw, 8 * yw, 5 * yw, '#f28b8b', 0); }
    else { arc(mx - 6.5, my, 6.5, .1, Math.PI - .1, 3.6); arc(mx + 6.5, my, 6.5, .1, Math.PI - .1, 3.6); }
    g.restore();
  }
  function torso(ctx, x, y, s = 1) {
    g = ctx; g.save(); g.translate(x, y); g.scale(s, s);
    shape(() => { g.moveTo(-90, 120); g.bezierCurveTo(-96, 20, -60, -20, 0, -20); g.bezierCurveTo(60, -20, 96, 20, 90, 120); g.closePath(); }, C.white, 5.5);
    g.restore();
  }
  function arm(ctx, x0, y0, x1, y1, s = 1) {
    g = ctx;
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.lineCap = 'round'; g.lineWidth = 46 * s; g.strokeStyle = C.ink; g.stroke();
    g.lineWidth = 36 * s; g.strokeStyle = C.white; g.stroke();
    ell(x1, y1, 24 * s, 18 * s, C.white, 5 * s);
    for (const k of [-1, 0, 1]) { g.beginPath(); g.moveTo(x1 + k * 8 * s, y1 + 6 * s); g.lineTo(x1 + k * 8 * s, y1 + 15 * s); g.lineWidth = 3 * s; g.strokeStyle = C.ink; g.stroke(); }
  }
  // a little sitting cat seen from the front (used small, e.g. in a cabin window)
  function sitting(ctx, x, y, s = 1, o = {}) {
    torso(ctx, x, y + 70 * s, s); head(ctx, x, y, s, o);
  }
  window.Kitty = { head, torso, arm, sitting, C };
})();
