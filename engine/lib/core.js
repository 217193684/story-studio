/* Story Studio — drawing core. All library files draw on the 2D context `g` (set by the player). */
let g = null;
const TAU = Math.PI * 2, DEG = Math.PI / 180;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (a, b, x) => clamp((x - a) / (b - a));
const easeIO = (x) => { x = clamp(x); return x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; };
const easeOut = (x) => 1 - Math.pow(1 - clamp(x), 3);
const easeBack = (x) => { x = clamp(x); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const hash = (s) => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967295; };
const rnd = (i) => ((Math.sin(i * 127.1 + 311.7) * 43758.5453) % 1 + 1) % 1;
const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';

function hex2rgb(h) { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map((c) => c + c).join(''); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function rgb2hex(r, g_, b) { return '#' + [r, g_, b].map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join(''); }
/** f > 0 lightens towards white, f < 0 darkens towards black. */
function shade(h, f) { const [r, g_, b] = hex2rgb(h); return f >= 0 ? rgb2hex(r + (255 - r) * f, g_ + (255 - g_) * f, b + (255 - b) * f) : rgb2hex(r * (1 + f), g_ * (1 + f), b * (1 + f)); }
function mix(a, b, t) { const A = hex2rgb(a), B = hex2rgb(b); return rgb2hex(lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t)); }
function alpha(h, a) { const [r, g_, b] = hex2rgb(h); return `rgba(${r},${g_},${b},${a})`; }

function rr(x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
function circle(x, y, r, col) { g.beginPath(); g.arc(x, y, Math.max(0, r), 0, TAU); if (col) { g.fillStyle = col; g.fill(); } }
function ellipse(x, y, rx, ry, col, rot = 0) { g.beginPath(); g.ellipse(x, y, Math.max(0, rx), Math.max(0, ry), rot, 0, TAU); if (col) { g.fillStyle = col; g.fill(); } }
function line(x1, y1, x2, y2, col, w, cap = 'round') { g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.strokeStyle = col; g.lineWidth = w; g.lineCap = cap; g.stroke(); }
function poly(pts, col) { g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); if (col) { g.fillStyle = col; g.fill(); } }
function txt(s, x, y, size, col, wt = 800, al = 'left') { g.font = `${wt} ${size}px ${FONT}`; g.fillStyle = col; g.textAlign = al; g.textBaseline = 'alphabetic'; g.fillText(s, x, y); }
function vgrad(x, y, h, stops) { const gr = g.createLinearGradient(0, y, 0, y + h); stops.forEach((s, i) => gr.addColorStop(i / (stops.length - 1), s)); return gr; }

/** Time-of-day sky colours and how much light there is. */
const SKY = {
  day: { top: '#5fb3f0', bottom: '#cfe9fb', light: 1, sun: true },
  morning: { top: '#7fb8e8', bottom: '#fde3c0', light: .95, sun: true },
  evening: { top: '#3b2f6e', bottom: '#f39a5b', light: .7, sun: true },
  night: { top: '#060a1d', bottom: '#1b2552', light: .38, moon: true },
};
function sky(x, y, w, h, tod, t) {
  const s = SKY[tod] || SKY.day;
  g.fillStyle = vgrad(y, y, h, [s.top, s.bottom]); g.fillRect(x, y, w, h);
  if (tod === 'night') for (let i = 0; i < 50; i++) { const tw = .5 + .5 * Math.sin(t * 2.1 + i * 1.7); g.fillStyle = `rgba(255,255,255,${.2 + .55 * tw})`; g.fillRect(x + rnd(i + 1) * w, y + rnd(i + 60) * h * .6, 2.3, 2.3); }
  if (s.moon) { g.save(); g.shadowColor = 'rgba(244,239,208,.8)'; g.shadowBlur = 40; circle(x + w * .82, y + h * .2, h * .07, '#f4efd0'); g.restore(); }
  if (s.sun) { const sy = tod === 'evening' ? y + h * .62 : y + h * .18; g.save(); g.shadowColor = 'rgba(255,220,120,.9)'; g.shadowBlur = 50; circle(x + w * .82, sy, h * .065, tod === 'evening' ? '#ffb347' : '#fff3b0'); g.restore(); }
  if (tod !== 'night') for (let i = 0; i < 4; i++) { const cx = x + ((rnd(i + 9) * w + t * 8 * (1 + i * .3)) % (w + 300)) - 150, cy = y + h * (.12 + rnd(i + 3) * .25); const cc = tod === 'evening' ? 'rgba(255,200,180,.55)' : 'rgba(255,255,255,.85)', k = h / 600; g.beginPath(); [[0, 0, 40], [35, -10, 30], [70, 0, 34], [35, 10, 32]].forEach((c) => { g.moveTo(cx + c[0] * k + c[2] * k, cy + c[1] * k); g.arc(cx + c[0] * k, cy + c[1] * k, c[2] * k, 0, TAU); }); g.fillStyle = cc; g.fill(); }
}
/** Darkens a scene for its time of day (keeps lit things bright if drawn after). */
function nightShade(x, y, w, h, tod, extra = 0) {
  const l = (SKY[tod] || SKY.day).light; const a = clamp(1 - l + extra, 0, .85) * .75;
  if (a > 0.01) { g.fillStyle = `rgba(8,10,35,${a})`; g.fillRect(x, y, w, h); }
}
/** Lets other code (the website's Library page) choose which canvas to draw on. */
function setCtx(c) { g = c; }
