/* Story Studio — effects. Screen effects take the scene box; anchored ones a point. p = 0..1 progress, t = time. */
const EFFECT_NAMES = ['rain', 'snow', 'lightning', 'fog', 'dust', 'leaves', 'fire', 'smoke', 'explosion', 'sparkle', 'hearts', 'stars', 'sweat', 'music', 'question', 'exclamation', 'anger', 'speed', 'confetti', 'flash', 'blackout', 'spotlight', 'vignette', 'knock', 'pow', 'boom', 'zzz', 'magic', 'tears', 'shock', 'money_rain', 'bubbles', 'tumbleweed', 'sunrays', 'glitch', 'heartbeat', 'red_glow', 'blood_moon'];

function screenEffect(kind, x, y, w, h, t, p, o = {}) {
  switch (kind) {
    case 'rain': g.strokeStyle = 'rgba(180,200,255,.55)'; g.lineWidth = 2; for (let i = 0; i < 160; i++) { const rx = x + ((rnd(i) * w + t * 120) % w), ry = y + ((rnd(i + 99) * h + t * 900) % h); g.beginPath(); g.moveTo(rx, ry); g.lineTo(rx - 6, ry + 22); g.stroke(); } g.fillStyle = 'rgba(20,30,60,.18)'; g.fillRect(x, y, w, h); break;
    case 'snow': for (let i = 0; i < 120; i++) { const sx = x + ((rnd(i) * w + Math.sin(t + i) * 30) % w + w) % w, sy = y + ((rnd(i + 50) * h + t * 70) % h); circle(sx, sy, 2 + rnd(i + 3) * 3, 'rgba(255,255,255,.9)'); } break;
    case 'lightning': { const k = t % 4; if (k < .25) { g.fillStyle = `rgba(255,255,255,${k < .08 || (k > .14 && k < .2) ? .8 : .2})`; g.fillRect(x, y, w, h); let lx = x + w * (.3 + rnd(Math.floor(t / 4)) * .4), ly = y; g.strokeStyle = '#fff'; g.lineWidth = 5; g.beginPath(); g.moveTo(lx, ly); for (let i = 0; i < 8; i++) { lx += (rnd(i + Math.floor(t)) - .5) * 80; ly += h * .07; g.lineTo(lx, ly); } g.stroke(); } break; }
    case 'fog': for (let i = 0; i < 8; i++) { const fx = x + ((i * w * .2 + t * 25 * (1 + i % 3)) % (w * 1.4)) - w * .2; ellipse(fx, y + h * (.55 + (i % 4) * .1), w * .3, h * .08, 'rgba(210,220,235,.16)'); } break;
    case 'dust': for (let i = 0; i < 40; i++) { const dx = x + ((rnd(i) * w + t * 200) % w), dy = y + h * (.6 + rnd(i + 7) * .35) - Math.sin(t * 3 + i) * 10; circle(dx, dy, 3 + rnd(i) * 6, 'rgba(214,180,120,.35)'); } break;
    case 'leaves': for (let i = 0; i < 25; i++) { const lx = x + ((rnd(i) * w + t * 140) % w), ly = y + ((rnd(i + 3) * h + t * 60) % h); ellipse(lx, ly, 9, 4, ['#d97706', '#b45309', '#65a30d'][i % 3], t * 3 + i); } break;
    case 'blackout': g.fillStyle = `rgba(0,0,0,${.85 * (o.amount ?? 1)})`; g.fillRect(x, y, w, h); break;
    case 'flash': g.fillStyle = `rgba(255,255,255,${(1 - p) * .9})`; g.fillRect(x, y, w, h); break;
    case 'vignette': { const v = g.createRadialGradient(x + w / 2, y + h / 2, h * .3, x + w / 2, y + h / 2, h * .95); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(0,0,0,${o.amount ?? .6})`); g.fillStyle = v; g.fillRect(x, y, w, h); break; }
    case 'red_glow': { const v = g.createRadialGradient(x + w / 2, y + h / 2, h * .3, x + w / 2, y + h / 2, h * .95); v.addColorStop(0, 'rgba(120,0,0,0)'); v.addColorStop(1, `rgba(140,0,0,${.5 * Math.min(1, p * 3)})`); g.fillStyle = v; g.fillRect(x, y, w, h); break; }
    case 'confetti': for (let i = 0; i < 90; i++) { const cx = x + rnd(i) * w + Math.sin(t * 2 + i) * 20, cy = y + ((rnd(i + 40) * h * .5 + p * h * 1.2) % h); g.save(); g.translate(cx, cy); g.rotate(t * 4 + i); g.fillStyle = ['#ef4444', '#3b82f6', '#facc15', '#22c55e', '#ec4899'][i % 5]; g.fillRect(-5, -3, 10, 6); g.restore(); } break;
    case 'money_rain': for (let i = 0; i < 40; i++) { const cx = x + rnd(i) * w, cy = y + ((rnd(i + 40) * h + t * 160) % h); g.save(); g.translate(cx, cy); g.rotate(Math.sin(t * 3 + i) * .6); rr(-18, -9, 36, 18, 2); g.fillStyle = '#22c55e'; g.fill(); txt('R', 0, 6, 14, '#14532d', 900, 'center'); g.restore(); } break;
    case 'speed': for (let i = 0; i < 24; i++) { const sy = y + rnd(i) * h, len = w * (.1 + rnd(i + 5) * .2), sx = x + ((rnd(i + 9) * w - t * 2200) % w + w) % w; line(sx, sy, sx + len, sy, 'rgba(255,255,255,.5)', 3); } break;
    case 'sunrays': g.save(); g.translate(x + w * .82, y + h * .15); g.rotate(t * .05); for (let i = 0; i < 12; i++) { g.rotate(Math.PI / 6); g.fillStyle = 'rgba(255,240,180,.08)'; poly([[0, 0], [w, -60], [w, 60]]); g.fill(); } g.restore(); break;
    case 'glitch': if (Math.sin(t * 23) > .6) for (let i = 0; i < 6; i++) { g.fillStyle = `rgba(${i % 2 ? '255,0,80' : '0,255,255'},.25)`; g.fillRect(x, y + rnd(i + Math.floor(t * 10)) * h, w, 8 + rnd(i) * 20); } break;
    case 'spotlight': { g.save(); g.fillStyle = 'rgba(0,0,0,.65)'; g.beginPath(); g.rect(x, y, w, h); g.arc(o.cx ?? x + w / 2, o.cy ?? y + h * .55, h * .28, 0, TAU, true); g.fill(); g.restore(); break; }
    case 'heartbeat': { const k = Math.pow(Math.max(0, Math.sin(t * 7)), 8); g.fillStyle = `rgba(120,0,0,${.25 * k})`; g.fillRect(x, y, w, h); break; }
    case 'blood_moon': g.fillStyle = 'rgba(130,0,0,.25)'; g.fillRect(x, y, w, h); break;
    case 'tumbleweed': { const tx = x + ((t * 220) % (w + 300)) - 150, ty = y + h * .84 - Math.abs(Math.sin(t * 4)) * 40; g.save(); g.translate(tx, ty); g.rotate(t * 5); g.strokeStyle = '#a16207'; g.lineWidth = 3; for (let i = 0; i < 8; i++) { g.beginPath(); g.arc(0, 0, 30 - i * 2, i, i + 4); g.stroke(); } g.restore(); break; }
  }
}

function pointEffect(kind, x, y, s, t, p) {
  g.save(); g.translate(x, y); g.scale(s, s);
  switch (kind) {
    case 'hearts': for (let i = 0; i < 5; i++) { const k = (p * 1.5 + i / 5) % 1, hx = Math.sin(i * 2 + t * 2) * 50, hy = -k * 160; g.save(); g.translate(hx, hy); g.scale(1 - k * .4, 1 - k * .4); g.globalAlpha = 1 - k; g.beginPath(); g.moveTo(0, 10); g.bezierCurveTo(-26, -6, -10, -26, 0, -10); g.bezierCurveTo(10, -26, 26, -6, 0, 10); g.fillStyle = '#e11d48'; g.fill(); g.restore(); } break;
    case 'stars': for (let i = 0; i < 4; i++) { const a = t * 5 + i * Math.PI / 2; txt('★', Math.cos(a) * 50, Math.sin(a) * 14, 26, '#facc15', 900, 'center'); } break;
    case 'sparkle': case 'magic': for (let i = 0; i < 12; i++) { const a = i * .52 + t, r = 40 + 50 * ((p + i * .1) % 1); const k = .5 + .5 * Math.sin(t * 9 + i); g.fillStyle = `rgba(255,${kind === 'magic' ? 180 : 240},${kind === 'magic' ? 255 : 150},${k})`; poly([[Math.cos(a) * r, Math.sin(a) * r - 8 * k], [Math.cos(a) * r + 3, Math.sin(a) * r], [Math.cos(a) * r, Math.sin(a) * r + 8 * k], [Math.cos(a) * r - 3, Math.sin(a) * r]]); g.fill(); } break;
    case 'music': for (let i = 0; i < 3; i++) { const k = (t * .7 + i / 3) % 1; txt(i % 2 ? '♪' : '♫', 20 + Math.sin(k * 6 + i) * 20, -k * 120, 36, `rgba(255,255,255,${1 - k})`, 900, 'center'); } break;
    case 'question': txt('?', 0, -10 * Math.sin(t * 6), 80, '#facc15', 900, 'center'); break;
    case 'exclamation': { const sc = easeBack(p * 4); g.scale(sc, sc); txt('!', 0, 0, 90, '#ef4444', 900, 'center'); break; }
    case 'anger': for (let i = 0; i < 4; i++) { g.save(); g.rotate(i * Math.PI / 2 + .4); line(10, 0, 30, 0, '#dc2626', 7); g.restore(); } break;
    case 'sweat': for (let i = 0; i < 3; i++) { const k = (t * 1.3 + i / 3) % 1; ellipse(20 + i * 18, -20 + k * 50, 6, 10, `rgba(147,197,253,${1 - k})`); } break;
    case 'zzz': for (let i = 0; i < 3; i++) { const k = (t * .6 + i / 3) % 1; txt('Z', k * 40, -k * 90, 26 + i * 8, `rgba(255,255,255,${1 - k})`, 900, 'center'); } break;
    case 'knock': for (let i = 0; i < 2; i++) { const k = clamp(p * 2 - i * .3); if (k > 0 && k < 1) { g.strokeStyle = `rgba(245,158,11,${1 - k})`; g.lineWidth = 6; g.beginPath(); g.arc(0, 0, 20 + k * 120, 0, TAU); g.stroke(); } } if (p < .5) txt('KNOCK!', 0, -60, 48, `rgba(245,158,11,${1 - p * 2})`, 900, 'center'); break;
    case 'pow': case 'boom': case 'shock': { const sc = easeBack(clamp(p * 3)) * (1 - clamp((p - .7) * 3)); g.scale(sc, sc); g.beginPath(); for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, r = i % 2 ? 60 : 110; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fillStyle = kind === 'boom' ? '#f97316' : '#facc15'; g.fill(); g.strokeStyle = '#111'; g.lineWidth = 5; g.stroke(); txt(kind === 'boom' ? 'BOOM!' : kind === 'pow' ? 'POW!' : 'WHAT?!', 0, 16, 44, '#111', 900, 'center'); break; }
    case 'explosion': { const r = 40 + p * 220; for (let i = 0; i < 10; i++) circle(Math.cos(i) * r * .5, Math.sin(i * 1.3) * r * .4, r * (.4 + rnd(i) * .3) * (1 - p * .5), i % 2 ? `rgba(249,115,22,${1 - p})` : `rgba(250,204,21,${1 - p})`); for (let i = 0; i < 6; i++) circle(Math.cos(i * 2) * r * .8, Math.sin(i * 2) * r * .6 - p * 60, r * .35, `rgba(80,80,80,${.6 * p * (1 - p) * 4})`); break; }
    case 'smoke': for (let i = 0; i < 6; i++) { const k = (t * .4 + i / 6) % 1; circle(Math.sin(k * 5 + i) * 20, -k * 200, 20 + k * 40, `rgba(140,140,140,${.45 * (1 - k)})`); } break;
    case 'fire': g.save(); g.shadowColor = '#f97316'; g.shadowBlur = 30; for (let i = 0; i < 6; i++) { const fh = 100 + 40 * Math.sin(t * 9 + i * 2); poly([[-75 + i * 30 - 24, 0], [-75 + i * 30 + 24, 0], [-75 + i * 30 + Math.sin(t * 11 + i) * 10, -fh]], i % 2 ? '#f97316' : '#facc15'); } g.restore(); break;
    case 'tears': for (let i = 0; i < 2; i++) { const k = (t * 2 + i / 2) % 1; ellipse(i ? 20 : -20, k * 40, 5, 9, `rgba(96,165,250,${1 - k})`); } break;
    case 'bubbles': for (let i = 0; i < 8; i++) { const k = (t * .5 + i / 8) % 1; circle(Math.sin(i * 3 + t) * 40, -k * 200, 8 + i % 3 * 4, `rgba(186,230,253,${.7 * (1 - k)})`); } break;
  }
  g.restore();
}
