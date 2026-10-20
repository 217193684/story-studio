/* Story Studio — people. A person is built from parts: skin, face, hair, body, outfit, hat, pose, expression.
   drawHuman(spec, st) draws with the feet at (0,0), standing about 310 units tall (adult). */

const SKINS = ['#3b2219', '#55341f', '#73472d', '#93633f', '#b07a50', '#cf9a71', '#e6b994', '#f5d5bd'];
const HAIR_COLORS = { black: '#15100f', darkbrown: '#3a2418', brown: '#6b4226', auburn: '#8a3b1e', ginger: '#c0622b', blonde: '#d9b45a', grey: '#9b9b9b', white: '#ececec', blue: '#3b82f6', pink: '#ec4899', red: '#dc2626', purple: '#7c3aed' };
const BODIES = {
  kid: { legU: 40, legL: 38, torso: 76, head: 40, sh: 46, hip: 42, armU: 36, armL: 34, arm: 12, leg: 15, neck: 6 },
  teen: { legU: 56, legL: 52, torso: 98, head: 36, sh: 56, hip: 48, armU: 48, armL: 46, arm: 14, leg: 17, neck: 9 },
  adult: { legU: 64, legL: 60, torso: 112, head: 36, sh: 64, hip: 56, armU: 54, armL: 52, arm: 15, leg: 19, neck: 10 },
  old: { legU: 60, legL: 56, torso: 106, head: 35, sh: 60, hip: 56, armU: 52, armL: 50, arm: 14, leg: 18, neck: 9, stoop: 7 },
};

/** Outfit presets. Every colour can be overridden per character with spec.colors {top,bottom,shoes,accent}. */
const OUTFITS = {
  casual: { top: ['tshirt', '#3b82f6', 'short'], bottom: ['pants', '#1e3a5f'], shoes: ['sneakers', '#f3f4f6'] },
  shorts: { top: ['tshirt', '#f97316', 'short'], bottom: ['shorts', '#1e3a5f'], shoes: ['sneakers', '#f3f4f6'] },
  hoodie: { top: ['hoodie', '#6b7280', 'long'], bottom: ['pants', '#1f2937'], shoes: ['sneakers', '#111827'], extras: ['hood', 'pocket'] },
  suit: { top: ['jacket', '#1f2937', 'long'], bottom: ['pants', '#1f2937'], shoes: ['shoes', '#0b0b0b'], extras: ['shirt', 'tie'], accent: '#b91c1c' },
  dress: { top: ['dress', '#db2777', 'short'], bottom: ['dress', '#db2777'], shoes: ['shoes', '#7c2d12'] },
  long_dress: { top: ['dress', '#7c3aed', 'long'], bottom: ['longdress', '#7c3aed'], shoes: ['shoes', '#1f2937'] },
  skirt: { top: ['tshirt', '#fde68a', 'short'], bottom: ['skirt', '#1e3a8a'], shoes: ['shoes', '#111827'] },
  worker: { top: ['shirt', '#475569', 'long'], bottom: ['pants', '#334155'], shoes: ['boots', '#78350f'], extras: ['hiviz'], hat: 'hardhat' },
  school: { top: ['shirt', '#f8fafc', 'short'], bottom: ['pants', '#6b7280'], shoes: ['shoes', '#111111'], extras: ['tie', 'collar'], accent: '#1e3a8a' },
  school_girl: { top: ['shirt', '#f8fafc', 'short'], bottom: ['skirt', '#6b7280'], shoes: ['shoes', '#111111'], extras: ['tie', 'collar'], accent: '#1e3a8a' },
  police: { top: ['shirt', '#1e3a8a', 'long'], bottom: ['pants', '#0f172a'], shoes: ['shoes', '#000000'], extras: ['badge', 'belt', 'collar'], hat: 'police' },
  security: { top: ['shirt', '#111827', 'long'], bottom: ['pants', '#111827'], shoes: ['boots', '#000000'], extras: ['badge', 'belt'], hat: 'cap' },
  doctor: { top: ['shirt', '#93c5fd', 'long'], bottom: ['pants', '#334155'], shoes: ['shoes', '#111827'], extras: ['labcoat', 'stethoscope'] },
  nurse: { top: ['tshirt', '#14b8a6', 'short'], bottom: ['pants', '#14b8a6'], shoes: ['sneakers', '#f8fafc'], extras: ['badge'] },
  cowboy: { top: ['shirt', '#b45309', 'long'], bottom: ['pants', '#1e40af'], shoes: ['boots', '#5b3417'], extras: ['vest', 'belt', 'buckle', 'bandana'], accent: '#3f2a1c', hat: 'cowboy' },
  sheriff: { top: ['shirt', '#d6c7a1', 'long'], bottom: ['pants', '#3f3f46'], shoes: ['boots', '#3f2a1c'], extras: ['vest', 'belt', 'buckle', 'star'], accent: '#57534e', hat: 'cowboy' },
  outlaw: { top: ['shirt', '#27272a', 'long'], bottom: ['pants', '#3f3f46'], shoes: ['boots', '#1c1917'], extras: ['belt', 'buckle', 'bandana', 'coat'], accent: '#7f1d1d', hat: 'cowboy' },
  pajamas: { top: ['shirt', '#a78bfa', 'long'], bottom: ['pants', '#a78bfa'], shoes: ['bare', '#000'], extras: ['dots'] },
  chef: { top: ['jacket', '#f8fafc', 'long'], bottom: ['pants', '#111111'], shoes: ['shoes', '#111111'], extras: ['apron', 'buttons'], accent: '#e5e7eb', hat: 'chef' },
  african_print: { top: ['dress', '#ea580c', 'short'], bottom: ['longdress', '#ea580c'], shoes: ['shoes', '#7c2d12'], extras: ['print'], accent: '#facc15' },
  dashiki: { top: ['tshirt', '#16a34a', 'short'], bottom: ['pants', '#1c1917'], shoes: ['shoes', '#3f2a1c'], extras: ['neckprint'], accent: '#facc15' },
  sport: { top: ['tshirt', '#facc15', 'short'], bottom: ['shorts', '#166534'], shoes: ['sneakers', '#f8fafc'], extras: ['number'] },
  party: { top: ['tshirt', '#c026d3', 'none'], bottom: ['skirt', '#111827'], shoes: ['shoes', '#111827'], extras: ['sparkle', 'necklace'], accent: '#fde047' },
  farmer: { top: ['shirt', '#dc2626', 'long'], bottom: ['overalls', '#1d4ed8'], shoes: ['boots', '#78350f'], extras: ['check'], hat: 'straw' },
  cardigan: { top: ['shirt', '#a16207', 'long'], bottom: ['pants', '#57534e'], shoes: ['shoes', '#3f2a1c'], extras: ['buttons'] },
  king: { top: ['jacket', '#7c3aed', 'long'], bottom: ['pants', '#4c1d95'], shoes: ['boots', '#1c1917'], extras: ['cape', 'belt'], accent: '#b91c1c', hat: 'crown' },
  wedding: { top: ['dress', '#f8fafc', 'none'], bottom: ['longdress', '#f8fafc'], shoes: ['shoes', '#f8fafc'], extras: ['sparkle'] },
  robe: { top: ['dress', '#111827', 'long'], bottom: ['longdress', '#111827'], shoes: ['shoes', '#111111'], extras: ['collar'] },
  gym: { top: ['tshirt', '#ef4444', 'none'], bottom: ['shorts', '#111827'], shoes: ['sneakers', '#f8fafc'] },
  office: { top: ['shirt', '#e0f2fe', 'long'], bottom: ['pants', '#1f2937'], shoes: ['shoes', '#111111'], extras: ['collar', 'tie'], accent: '#1d4ed8' },
  office_woman: { top: ['shirt', '#fce7f3', 'long'], bottom: ['skirt', '#1f2937'], shoes: ['shoes', '#111111'], extras: ['collar', 'necklace'], accent: '#e5e7eb' },
  taxi_driver: { top: ['shirt', '#0ea5e9', 'short'], bottom: ['pants', '#1f2937'], shoes: ['shoes', '#111111'], extras: ['collar'], hat: 'cap' },
  waiter: { top: ['shirt', '#f8fafc', 'long'], bottom: ['pants', '#111111'], shoes: ['shoes', '#111111'], extras: ['vest', 'bowtie'], accent: '#111111' },
  dj: { top: ['hoodie', '#111827', 'long'], bottom: ['pants', '#111827'], shoes: ['sneakers', '#ef4444'], extras: ['headphones'] },
  soldier: { top: ['shirt', '#4d5d3a', 'long'], bottom: ['pants', '#4d5d3a'], shoes: ['boots', '#1c1917'], extras: ['belt', 'camo'], hat: 'beret' },
  pastor: { top: ['jacket', '#111827', 'long'], bottom: ['pants', '#111827'], shoes: ['shoes', '#000000'], extras: ['shirt', 'collar'] },
};

const HAIRS = ['bald', 'buzz', 'short', 'sidepart', 'afro', 'puffs', 'curly', 'braids', 'locs', 'cornrows', 'long', 'ponytail', 'bun', 'mohawk', 'headwrap', 'hijab', 'spiky', 'bob'];
const HATS = ['none', 'cowboy', 'cap', 'hardhat', 'police', 'tophat', 'beanie', 'chef', 'crown', 'party', 'straw', 'beret', 'helmet'];
const BEARDS = ['none', 'beard', 'moustache', 'goatee', 'stubble'];
const EYES = ['round', 'almond', 'big', 'dot'];

/** Expressions: brow raise, brow slant (+ = worried/sad, - = angry), mouth shape, eye mode. */
const EXPRS = {
  neutral: { by: 0, bs: 0, m: 'line', e: 'open' },
  happy: { by: .15, bs: 0, m: 'smile', e: 'open' },
  laugh: { by: .3, bs: 0, m: 'laugh', e: 'happy' },
  sad: { by: .1, bs: .7, m: 'frown', e: 'open', lid: .3 },
  cry: { by: .15, bs: .9, m: 'cry', e: 'sad', tears: true },
  angry: { by: -.2, bs: -1, m: 'grit', e: 'open', lid: .25 },
  scared: { by: .5, bs: .6, m: 'wavy', e: 'wide', sweat: true },
  shocked: { by: .8, bs: 0, m: 'O', e: 'wide' },
  surprised: { by: .7, bs: 0, m: 'o', e: 'wide' },
  sleepy: { by: -.1, bs: 0, m: 'o', e: 'open', lid: .62 },
  sleeping: { by: 0, bs: 0, m: 'line', e: 'closed' },
  smug: { by: 0, bs: -.3, m: 'smirk', e: 'open', lid: .35 },
  love: { by: .2, bs: 0, m: 'smile', e: 'hearts' },
  dizzy: { by: .2, bs: .3, m: 'wavy', e: 'spiral' },
  wink: { by: .1, bs: 0, m: 'smile', e: 'wink' },
  confused: { by: .2, bs: .4, m: 'side', e: 'open', uneven: true },
  disgusted: { by: -.1, bs: -.4, m: 'frown', e: 'open', lid: .3 },
  thinking: { by: .1, bs: .2, m: 'side', e: 'up' },
  evil: { by: -.2, bs: -1, m: 'evil', e: 'open', lid: .3 },
  possessed: { by: -.25, bs: -1, m: 'evil', e: 'black' },
  blank_stare: { by: 0, bs: 0, m: 'line', e: 'black' },
  embarrassed: { by: .1, bs: .5, m: 'wavy', e: 'open', blush: true },
  cool: { by: 0, bs: 0, m: 'smirk', e: 'shades' },
  worried: { by: .35, bs: .75, m: 'wavy', e: 'open' },
  nervous: { by: .3, bs: .6, m: 'wavy', e: 'open', sweat: true },
  excited: { by: .5, bs: 0, m: 'laugh', e: 'wide' },
  proud: { by: .1, bs: -.2, m: 'smile', e: 'open', lid: .3 },
  serious: { by: -.1, bs: -.3, m: 'line', e: 'open', lid: .15 },
  bored: { by: -.1, bs: .1, m: 'line', e: 'open', lid: .55 },
  shy: { by: .2, bs: .4, m: 'smile', e: 'open', blush: true, lid: .2 },
  suspicious: { by: -.1, bs: -.5, m: 'side', e: 'open', lid: .45 },
  determined: { by: -.15, bs: -.6, m: 'line', e: 'open', lid: .2 },
};

/** Poses: arms/legs as [[angle, bend], …] for [back/left, front/right], degrees from hanging down. */
const POSES = {
  stand: { view: 'front', arms: [[7, 6], [7, 6]], legs: [[2, 0], [2, 0]] },
  idle: { view: 'side', arms: [[-6, 12], [6, 12]], legs: [[-4, 0], [4, 0]] },
  talk: { view: 'front', arms: [[7, 6], [20, 60]], legs: [[2, 0], [2, 0]], anim: 'talk' },
  walk: { view: 'side', anim: 'walk' },
  run: { view: 'side', anim: 'run' },
  sit: { view: 'side', arms: [[30, 50], [26, 55]], legs: [[88, 88], [84, 86]], seat: true },
  sitfront: { view: 'front', arms: [[16, 30], [16, 30]], legs: [[6, 0], [6, 0]], seatFront: true },
  point: { view: 'side', arms: [[-6, 12], [88, 0]], legs: [[-4, 0], [4, 0]] },
  wave: { view: 'front', arms: [[7, 6], [150, 20]], legs: [[2, 0], [2, 0]], anim: 'wave' },
  armsup: { view: 'front', arms: [[165, 8], [165, 8]], legs: [[4, 0], [4, 0]], anim: 'bounce' },
  cheer: { view: 'front', arms: [[150, 30], [150, 30]], legs: [[6, 0], [6, 0]], anim: 'jump' },
  shrug: { view: 'front', arms: [[32, 92], [32, 92]], legs: [[2, 0], [2, 0]] },
  angry: { view: 'front', arms: [[40, -108], [40, -108]], legs: [[8, 0], [8, 0]] },
  think: { view: 'front', arms: [[12, 70], [24, 150]], legs: [[2, 0], [2, 0]] },
  phone: { view: 'front', arms: [[7, 6], [26, 150]], legs: [[2, 0], [2, 0]], hold: 'phone' },
  drink: { view: 'side', arms: [[-6, 12], [48, 108]], legs: [[-4, 0], [4, 0]], hold: 'glass' },
  cry: { view: 'front', arms: [[28, 142], [28, 142]], legs: [[2, 0], [2, 0]], anim: 'sob' },
  laugh: { view: 'front', arms: [[20, -80], [20, -80]], legs: [[4, 0], [4, 0]], anim: 'shake' },
  dance: { view: 'front', anim: 'dance' },
  scared: { view: 'front', arms: [[118, 62], [118, 62]], legs: [[10, 8], [10, 8]], anim: 'tremble' },
  hide: { view: 'side', arms: [[128, 92], [140, 82]], legs: [[72, 140], [62, 130]], lean: 26 },
  kneel: { view: 'side', arms: [[42, 104], [38, 108]], legs: [[12, 100], [12, 100]] },
  pray: { view: 'side', arms: [[42, 104], [38, 108]], legs: [[12, 100], [12, 100]], lean: 4 },
  fight: { view: 'side', anim: 'punch', legs: [[-14, 10], [16, 10]] },
  carry: { view: 'front', arms: [[58, 40], [58, 40]], legs: [[2, 0], [2, 0]], hold: 'box' },
  facepalm: { view: 'front', arms: [[7, 6], [30, 148]], legs: [[2, 0], [2, 0]] },
  clap: { view: 'front', anim: 'clap', legs: [[2, 0], [2, 0]] },
  lie: { view: 'side', lie: true, arms: [[10, 0], [-10, 0]], legs: [[0, 0], [4, 0]] },
  sleep: { view: 'side', lie: true, arms: [[10, 0], [-10, 0]], legs: [[0, 0], [4, 0]], zzz: true },
  fall: { view: 'side', anim: 'fall', arms: [[150, 20], [130, 20]], legs: [[10, 0], [-10, 0]] },
  jump: { view: 'front', anim: 'jump', arms: [[140, 20], [140, 20]], legs: [[12, 30], [12, 30]] },
  ride: { view: 'side', arms: [[40, 60], [44, 58]], legs: [[62, 48], [58, 46]], seat: true },
  sneak: { view: 'side', anim: 'sneak', lean: 18 },
  hug: { view: 'side', arms: [[80, 60], [84, 56]], legs: [[-4, 0], [4, 0]] },
  shoot: { view: 'side', arms: [[-6, 12], [90, 0]], legs: [[-10, 0], [10, 0]], hold: 'gun' },
  dj: { view: 'front', anim: 'dj' },
  sing: { view: 'front', arms: [[7, 6], [30, 140]], legs: [[4, 0], [4, 0]], hold: 'mic', anim: 'sway' },
  read: { view: 'front', arms: [[46, 70], [46, 70]], legs: [[2, 0], [2, 0]], hold: 'book' },
  eat: { view: 'side', arms: [[-6, 12], [52, 112]], legs: [[-4, 0], [4, 0]], hold: 'food' },
  tired: { view: 'front', arms: [[4, 2], [4, 2]], legs: [[2, 6], [2, 6]], lean: 8 },
  stop: { view: 'front', arms: [[7, 6], [90, 70]], legs: [[4, 0], [4, 0]] },
  pointfront: { view: 'front', arms: [[7, 6], [95, 0]], legs: [[4, 0], [4, 0]] },
  hands_up: { view: 'front', arms: [[150, 40], [150, 40]], legs: [[4, 0], [4, 0]], anim: 'tremble' },
  torch: { view: 'side', arms: [[-6, 12], [72, 10]], legs: [[-4, 0], [4, 0]], hold: 'torch' },
};

function personDims(sp) {
  const b = { ...BODIES[sp.age || 'adult'] };
  const k = sp.build || 'average';
  if (k === 'slim') { b.sh -= 8; b.hip -= 6; b.arm -= 2; b.leg -= 2; }
  if (k === 'big') { b.sh += 16; b.hip += 24; b.arm += 4; b.leg += 5; b.belly = true; }
  if (k === 'muscular') { b.sh += 22; b.hip += 2; b.arm += 6; b.leg += 4; b.muscle = true; }
  if (sp.gender === 'f' && sp.age !== 'kid') { b.sh -= 6; b.hip += 4; }
  const hs = sp.height === 'tall' ? 1.1 : sp.height === 'short' ? .9 : 1;
  ['legU', 'legL', 'torso', 'armU', 'armL'].forEach((p) => (b[p] *= hs));
  return b;
}

function outfitOf(sp) {
  const o = OUTFITS[sp.outfit] || OUTFITS.casual, c = sp.colors || {};
  return {
    top: { kind: o.top[0], color: c.top || o.top[1], sleeves: o.top[2] },
    bottom: { kind: o.bottom[0], color: c.bottom || o.bottom[1] },
    shoes: { kind: o.shoes[0], color: c.shoes || o.shoes[1] },
    extras: o.extras || [], accent: c.accent || o.accent || '#facc15',
    hat: sp.hat && sp.hat !== 'auto' ? sp.hat : (o.hat || 'none'),
  };
}

/* ---------- pose maths ---------- */
function poseAngles(name, t, pt, wphase) {
  const P = POSES[name] || POSES.stand;
  let arms = (P.arms || [[7, 6], [7, 6]]).map((a) => a.slice()), legs = (P.legs || [[2, 0], [2, 0]]).map((a) => a.slice());
  let lean = P.lean || 0, y = 0, x = 0, rot = 0, tilt = 0;
  const s = Math.sin;
  switch (P.anim) {
    case 'walk': { const f = wphase; legs = [[-24 * s(f), 26 * Math.max(0, s(f + 1.2))], [24 * s(f), 26 * Math.max(0, -s(f + 1.2))]]; arms = [[22 * s(f), 18], [-22 * s(f), 18]]; y = -3 * Math.abs(Math.cos(f)); break; }
    case 'run': { const f = wphase; legs = [[-42 * s(f), 60 * Math.max(0, s(f + 1))], [42 * s(f), 60 * Math.max(0, -s(f + 1))]]; arms = [[50 * s(f), 85], [-50 * s(f), 85]]; lean = 12; y = -8 * Math.abs(Math.cos(f)); break; }
    case 'sneak': { const f = wphase; legs = [[-16 * s(f) + 10, 40], [16 * s(f) + 10, 40]]; arms = [[60, 70], [70, 60]]; y = 0; break; }
    case 'wave': arms[1][1] = 20 + 28 * s(t * 10); break;
    case 'bounce': y = -Math.max(0, s(t * 7)) * 10; break;
    case 'jump': y = -Math.max(0, s(t * 6)) * 26; break;
    case 'sob': y = 2 * s(t * 18); tilt = 3 * s(t * 9); break;
    case 'shake': y = 3 * s(t * 24); tilt = 5 * s(t * 6); break;
    case 'tremble': x = 1.6 * s(t * 70); break;
    case 'talk': arms[1] = [22 + 14 * s(t * 2.3), 55 + 25 * s(t * 3.1)]; arms[0] = [8 + 6 * s(t * 1.7 + 1), 10]; break;
    case 'sway': tilt = 4 * s(t * 3); x = 3 * s(t * 3); break;
    case 'dance': { const f = t * 7.5; arms = [[110 + 40 * s(f), 50 + 30 * s(f * .5)], [110 - 40 * s(f), 50 - 30 * s(f * .5)]]; legs = [[6 + 8 * s(f), 10 + 10 * Math.max(0, s(f))], [6 - 8 * s(f), 10 + 10 * Math.max(0, -s(f))]]; y = -Math.abs(s(f)) * 8; tilt = 6 * s(f * .5); x = 6 * s(f * .5); break; }
    case 'dj': { const f = t * 8; arms = [[60, 60 + 12 * s(f)], [30, 150]]; y = -Math.abs(s(f)) * 5; break; }
    case 'punch': { const f = t * 9; const e = Math.max(0, s(f)); arms = [[60, 110], [80 + 8 * e, 100 * (1 - e)]]; lean = 8 * e; break; }
    case 'clap': { const f = t * 14; arms = [[52, 92 + 18 * s(f)], [52, 92 + 18 * s(f)]]; break; }
    case 'fall': { const k = easeIO(prog(0, .45, pt)); rot = -90 * k; break; }
  }
  return { arms, legs, lean, y, x, rot, tilt, view: P.view, lie: P.lie || (P.anim === 'fall' && pt > .45), seat: P.seat, seatFront: P.seatFront, hold: P.hold, zzz: P.zzz };
}
function mixPose(a, b, k) {
  if (k >= 1) return b; if (k <= 0) return a;
  const L = (p, q) => p.map((v, i) => [lerp(v[0], q[i][0], k), lerp(v[1], q[i][1], k)]);
  return { ...(k < .5 ? a : b), arms: L(a.arms, b.arms), legs: L(a.legs, b.legs), lean: lerp(a.lean, b.lean, k), y: lerp(a.y, b.y, k), x: lerp(a.x, b.x, k), rot: lerp(a.rot, b.rot, k), tilt: lerp(a.tilt, b.tilt, k) };
}
function limb(x, y, a1, a2, l1, l2, sx) {
  const e = [x + sx * Math.sin(a1 * DEG) * l1, y + Math.cos(a1 * DEG) * l1];
  return [e, [e[0] + sx * Math.sin((a1 + a2) * DEG) * l2, e[1] + Math.cos((a1 + a2) * DEG) * l2]];
}

/* ---------- held things ---------- */
function drawHeld(kind, x, y, ang, sc = 1) {
  g.save(); g.translate(x, y); g.rotate(ang); g.scale(sc, sc);
  switch (kind) {
    case 'phone': rr(-7, -16, 14, 28, 3); g.fillStyle = '#111827'; g.fill(); rr(-5, -13, 10, 20, 2); g.fillStyle = '#60a5fa'; g.fill(); break;
    case 'glass': rr(-8, -22, 16, 26, 3); g.fillStyle = 'rgba(220,240,255,.55)'; g.fill(); g.fillStyle = '#f59e0b'; g.fillRect(-7, -12, 14, 15); break;
    case 'bottle': rr(-7, -30, 14, 34, 4); g.fillStyle = '#166534'; g.fill(); g.fillStyle = '#14532d'; g.fillRect(-3, -42, 6, 14); g.fillStyle = '#fde68a'; g.fillRect(-7, -20, 14, 10); break;
    case 'box': rr(-38, -40, 76, 56, 4); g.fillStyle = '#c08a4a'; g.fill(); g.fillStyle = '#a0703a'; g.fillRect(-38, -16, 76, 6); break;
    case 'gun': g.fillStyle = '#3f3f46'; rr(-4, -8, 38, 10, 3); g.fill(); rr(-6, -8, 12, 22, 3); g.fill(); g.fillStyle = '#78350f'; rr(-8, 2, 12, 18, 3); g.fill(); break;
    case 'mic': circle(0, -18, 8, '#9ca3af'); rr(-3, -12, 6, 22, 2); g.fillStyle = '#111827'; g.fill(); break;
    case 'book': rr(-22, -16, 44, 30, 3); g.fillStyle = '#b91c1c'; g.fill(); g.fillStyle = '#fef3c7'; g.fillRect(-20, -14, 19, 26); g.fillRect(1, -14, 19, 26); break;
    case 'food': ellipse(0, -2, 18, 6, '#e5e7eb'); circle(-5, -6, 6, '#b45309'); circle(5, -7, 5, '#16a34a'); break;
    case 'money': for (let i = 0; i < 3; i++) { rr(-14 + i * 3, -10 - i * 3, 28, 16, 2); g.fillStyle = i % 2 ? '#15803d' : '#22c55e'; g.fill(); } break;
    case 'torch': rr(-5, -6, 26, 12, 3); g.fillStyle = '#374151'; g.fill(); g.fillStyle = 'rgba(255,240,180,.28)'; poly([[20, -6], [220, -60], [220, 60], [20, 6]]); g.fill(); break;
    case 'cup': rr(-9, -14, 18, 18, 3); g.fillStyle = '#f8fafc'; g.fill(); g.strokeStyle = '#f8fafc'; g.lineWidth = 3; g.beginPath(); g.arc(10, -6, 5, -1.5, 1.5); g.stroke(); break;
    case 'flower': line(0, 10, 0, -26, '#16a34a', 3); for (let i = 0; i < 5; i++) circle(Math.cos(i * 1.26) * 7, -30 + Math.sin(i * 1.26) * 7, 6, '#f43f5e'); circle(0, -30, 4, '#facc15'); break;
    case 'bag': rr(-16, -4, 32, 28, 5); g.fillStyle = '#7c2d12'; g.fill(); g.strokeStyle = '#7c2d12'; g.lineWidth = 3; g.beginPath(); g.arc(0, -4, 10, Math.PI, 0); g.stroke(); break;
    case 'sign': g.fillStyle = '#78350f'; g.fillRect(-3, -10, 6, 40); rr(-34, -52, 68, 44, 4); g.fillStyle = '#fef3c7'; g.fill(); break;
    case 'candle': rr(-5, -24, 10, 28, 2); g.fillStyle = '#f5f5f4'; g.fill(); g.save(); g.shadowColor = '#fbbf24'; g.shadowBlur = 20; ellipse(0, -30, 4, 7, '#fbbf24'); g.restore(); break;
    case 'umbrella': line(0, 14, 0, -50, '#1f2937', 3); g.beginPath(); g.arc(0, -50, 46, Math.PI, 0); g.fillStyle = '#dc2626'; g.fill(); break;
    case 'knife': rr(-3, 0, 6, 14, 2); g.fillStyle = '#78350f'; g.fill(); poly([[-3, 0], [3, 0], [2, -30], [-1, -34]], '#d1d5db'); break;
    case 'beer': rr(-9, -24, 18, 28, 3); g.fillStyle = '#d97706'; g.fill(); rr(-9, -28, 18, 8, 3); g.fillStyle = '#fff7ed'; g.fill(); break;
  }
  g.restore();
}

/* ---------- the person ---------- */
function drawHuman(sp, st) {
  const D = personDims(sp), O = outfitOf(sp), skin = SKINS[clamp(sp.skin ?? 3, 0, 7) | 0], hairC = HAIR_COLORS[sp.hairColor] || sp.hairColor || HAIR_COLORS.black;
  const t = st.t || 0;
  let P = poseAngles(st.pose || 'stand', t, st.poseT ?? 9, st.walkPhase || 0);
  if (st.prevPose && st.blend < 1) P = mixPose(poseAngles(st.prevPose, t, 9, st.walkPhase || 0), P, easeIO(st.blend));
  const facing = st.facing || 'right', side = P.view === 'side';
  const ex = EXPRS[st.expr] || EXPRS.neutral, hold = st.hold || P.hold;
  g.save();
  g.translate(P.x, 0);
  if (facing === 'left') g.scale(-1, 1);
  if (P.lie) { g.translate(0, -D.sh * .45); g.rotate(-Math.PI / 2); }
  else if (P.rot) { g.rotate(P.rot * DEG); }

  // skeleton
  let hipY = -(D.legU + D.legL);
  const legU = P.seatFront ? D.legU * .28 : D.legU;
  if (P.seat) hipY = -(st.seat ?? D.legL + 8);
  if (P.seatFront) hipY = -(st.seat ?? D.legL + 8) - D.legU * .25;
  const legX = side ? [-3, 3] : [-D.hip * .22, D.hip * .22], legS = side ? [1, 1] : [-1, 1];
  let legs = [0, 1].map((i) => limb(legX[i], hipY, P.legs[i][0], -P.legs[i][1], legU, D.legL, legS[i]));
  let dy = 0;
  if (!P.seat && !P.seatFront && !P.lie) {
    let lowest = -1e9; legs.forEach(([k, f]) => { lowest = Math.max(lowest, f[1] + D.leg * .32, k[1] + D.leg * .5); });
    dy = -lowest;
  } else if (P.seatFront) { dy = 0; }
  g.translate(0, dy + P.y);
  const lean = (P.lean || 0) + (D.stoop || 0);
  const shY = hipY - D.torso, neckTop = shY - D.neck, headC = [Math.sin(lean * DEG) * D.torso, neckTop - D.head * .9];
  const shX = side ? [-3 + headC[0] * .85, 3 + headC[0] * .85] : [-D.sh / 2 + 4, D.sh / 2 - 4];
  const armS = side ? [1, 1] : [-1, 1];
  const arms = [0, 1].map((i) => limb(shX[i], shY + 8, P.arms[i][0], P.arms[i][1], D.armU, D.armL, armS[i]));

  const has = (e) => O.extras.includes(e);
  const top = O.top, bot = O.bottom;
  const longSleeve = top.sleeves === 'long', noSleeve = top.sleeves === 'none';
  const pantsC = bot.kind === 'pants' || bot.kind === 'overalls' ? bot.color : null;
  const dress = bot.kind === 'dress' || bot.kind === 'longdress';

  const drawArm = (i, dark) => {
    const [e, h] = arms[i], s0 = [shX[i], shY + 8], dk = (c) => (dark ? shade(c, -.18) : c);
    const sleeveC = has('labcoat') || has('coat') ? (has('labcoat') ? '#f8fafc' : O.accent) : top.color;
    line(s0[0], s0[1], e[0], e[1], noSleeve ? dk(skin) : dk(sleeveC), D.arm);
    line(e[0], e[1], h[0], h[1], longSleeve || has('labcoat') || has('coat') ? dk(sleeveC) : dk(skin), D.arm * .92);
    if (!noSleeve && !longSleeve && !has('labcoat')) circle(e[0], e[1], D.arm * .5, dk(top.color));
    if (D.muscle && !longSleeve) ellipse((s0[0] + e[0]) / 2, (s0[1] + e[1]) / 2, D.arm * .75, D.arm * .9, dk(noSleeve ? skin : top.color));
    circle(h[0], h[1], D.arm * .62, dk(skin));
  };
  const drawLeg = (i, dark) => {
    const [k, f] = legs[i], h0 = [legX[i], hipY], dk = (c) => (dark ? shade(c, -.18) : c);
    const upC = pantsC || (bot.kind === 'shorts' ? bot.color : skin), loC = pantsC || skin;
    line(h0[0], h0[1], k[0], k[1], dk(upC), D.leg);
    line(k[0], k[1], f[0], f[1], dk(loC), D.leg * .92);
    if (O.shoes.kind === 'boots') line(k[0] * .45 + f[0] * .55, k[1] * .45 + f[1] * .55, f[0], f[1], dk(O.shoes.color), D.leg * 1.02);
    const sc = O.shoes.kind === 'bare' ? skin : O.shoes.color;
    if (side) { const dir = P.lie ? 0 : 1; ellipse(f[0] + D.leg * .38 * dir, f[1] + D.leg * .16, D.leg * .78, D.leg * .34, dk(sc)); }
    else ellipse(f[0] + legS[i] * 2, f[1] + D.leg * .16, D.leg * .56, D.leg * .32, dk(sc));
  };

  // back things
  if (has('cape')) { poly([[shX[0] - 4, shY + 4], [shX[1] + 4, shY + 4], [D.hip * .7 + 10, -D.legL * .3], [-D.hip * .7 - 10, -D.legL * .3]], O.accent); }
  headBack(sp, D, headC, hairC, O, side, st);
  if (side) { drawArm(0, true); drawLeg(0, true); }
  else { drawLeg(0, false); drawLeg(1, false); }

  // torso
  const tw = side ? D.sh * .62 : D.sh, bw = side ? D.hip * .72 : D.hip, tx = side ? headC[0] * .45 : 0;
  g.save();
  g.beginPath(); g.moveTo(tx - tw / 2, shY + 6); g.quadraticCurveTo(tx - tw / 2, shY - 2, tx - tw / 2 + 12, shY - 2); g.lineTo(tx + tw / 2 - 12, shY - 2); g.quadraticCurveTo(tx + tw / 2, shY - 2, tx + tw / 2, shY + 6);
  g.lineTo(bw / 2, hipY + 8); g.lineTo(-bw / 2, hipY + 8); g.closePath();
  g.fillStyle = top.color; g.fill(); g.save(); g.clip();
  if (D.belly) ellipse(tx + (side ? 10 : 0), hipY - D.torso * .28, bw * .62, D.torso * .38, shade(top.color, -.06));
  if (has('dots')) for (let i = 0; i < 30; i++) circle(-tw / 2 + rnd(i) * tw, shY + rnd(i + 9) * D.torso, 3, shade(top.color, .35));
  if (has('check')) { g.strokeStyle = shade(top.color, -.3); g.lineWidth = 3; for (let i = -6; i < 6; i++) { line(i * 12, shY, i * 12, hipY + 10, shade(top.color, -.3), 3); line(-tw, shY + 12 + i * 12 + 72, tw, shY + 12 + i * 12 + 72, shade(top.color, -.3), 3); } }
  if (has('print')) for (let i = 0; i < 24; i++) { const px = -tw / 2 + rnd(i * 3) * tw, py = shY + rnd(i * 7) * D.torso; poly([[px, py - 7], [px + 7, py], [px, py + 7], [px - 7, py]], O.accent); }
  if (has('camo')) for (let i = 0; i < 18; i++) ellipse(-tw / 2 + rnd(i * 5) * tw, shY + rnd(i * 11) * D.torso, 10, 6, i % 2 ? '#3a4a2a' : '#6b7a4a', rnd(i));
  if (has('neckprint')) { g.fillStyle = O.accent; g.beginPath(); g.moveTo(-18, shY - 2); g.lineTo(18, shY - 2); g.lineTo(0, shY + 34); g.closePath(); g.fill(); }
  if (has('hiviz')) { g.fillStyle = '#f97316'; g.fillRect(tx - tw / 2, shY - 2, tw, D.torso + 12); g.fillStyle = '#e5e7eb'; g.fillRect(tx - tw / 2, shY + D.torso * .45, tw, 7); g.fillRect(tx - tw / 2, shY + D.torso * .7, tw, 7); }
  if (has('vest')) { g.fillStyle = O.accent; if (side) g.fillRect(tx - tw / 2, shY - 2, tw * .7, D.torso + 8); else { g.fillRect(tx - tw / 2, shY - 2, tw * .36, D.torso + 10); g.fillRect(tx + tw * .14, shY - 2, tw * .36, D.torso + 10); } }
  if (top.kind === 'jacket' && !side) { g.fillStyle = has('shirt') ? '#f8fafc' : shade(top.color, .15); poly([[-12, shY - 2], [12, shY - 2], [0, shY + D.torso * .55]]); g.fill(); g.strokeStyle = shade(top.color, -.35); g.lineWidth = 2.5; g.beginPath(); g.moveTo(-14, shY - 2); g.lineTo(-2, shY + D.torso * .55); g.moveTo(14, shY - 2); g.lineTo(2, shY + D.torso * .55); g.stroke(); }
  if (has('overalls') || bot.kind === 'overalls') { g.fillStyle = bot.color; g.fillRect(tx - tw * .3, shY + D.torso * .35, tw * .6, D.torso); g.fillRect(tx - tw * .3, shY - 2, 8, D.torso * .4); g.fillRect(tx + tw * .3 - 8, shY - 2, 8, D.torso * .4); }
  if (has('apron')) { g.fillStyle = O.accent; g.fillRect(tx - tw * .32, shY + 12, tw * .64, D.torso + 6); }
  if (pantsC || bot.kind === 'shorts') { g.fillStyle = bot.kind === 'shorts' ? bot.color : pantsC; g.fillRect(-bw, hipY - 8, bw * 2, 20); }
  if (has('belt') || has('buckle')) { g.fillStyle = '#3f2a1c'; g.fillRect(-bw, hipY - 10, bw * 2, 7); if (has('buckle')) { rr(tx - 8, hipY - 12, 16, 11, 2); g.fillStyle = '#facc15'; g.fill(); } }
  if (has('pocket')) { rr(tx - 20, hipY - 34, 40, 18, 5); g.fillStyle = shade(top.color, -.12); g.fill(); }
  if (has('number') && !side) txt('10', 0, shY + D.torso * .55, 26, shade(top.color, -.55), 900, 'center');
  if (has('buttons')) for (let i = 0; i < 4; i++) circle(tx, shY + 16 + i * D.torso * .2, 2.6, shade(top.color, -.35));
  if (has('sparkle')) for (let i = 0; i < 10; i++) { const k = .5 + .5 * Math.sin(t * 6 + i * 2); circle(-tw / 2 + rnd(i * 13) * tw, shY + rnd(i * 17) * D.torso, 2 + 2 * k, `rgba(255,255,255,${.4 + .5 * k})`); }
  g.restore(); g.restore();
  if (has('collar')) { g.fillStyle = has('shirt') || top.kind !== 'jacket' ? (top.kind === 'shirt' ? shade(top.color, .3) : '#f8fafc') : '#f8fafc'; poly([[tx - 12, shY - 3], [tx, shY + 8], [tx - 4, shY + 14], [tx - 16, shY + 4]]); g.fill(); poly([[tx + 12, shY - 3], [tx, shY + 8], [tx + 4, shY + 14], [tx + 16, shY + 4]]); g.fill(); }
  if (has('tie') && !side) { poly([[-5, shY + 6], [5, shY + 6], [7, shY + D.torso * .62], [0, shY + D.torso * .7], [-7, shY + D.torso * .62]], O.accent); }
  if (has('bowtie')) { poly([[tx, shY + 6], [tx - 12, shY], [tx - 12, shY + 12]], O.accent); poly([[tx, shY + 6], [tx + 12, shY], [tx + 12, shY + 12]], O.accent); }
  if (has('badge')) { rr(tx + (side ? 4 : tw * .16), shY + 18, 14, 10, 2); g.fillStyle = '#facc15'; g.fill(); }
  if (has('star')) { const sx = tx + (side ? 6 : -tw * .22), sy = shY + 26; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 5 : 11; g.lineTo(sx + Math.cos(a) * r, sy + Math.sin(a) * r); } g.closePath(); g.fillStyle = '#facc15'; g.fill(); }
  if (has('necklace')) { g.strokeStyle = O.accent; g.lineWidth = 3; g.beginPath(); g.arc(tx, shY - 4, 16, .3, Math.PI - .3); g.stroke(); }
  if (has('stethoscope')) { g.strokeStyle = '#374151'; g.lineWidth = 3; g.beginPath(); g.arc(tx, shY + 2, 18, .2, Math.PI - .2); g.stroke(); circle(tx + 10, shY + 30, 5, '#9ca3af'); }
  if (has('bandana')) { poly([[tx - 18, shY - 4], [tx + 18, shY - 4], [tx, shY + 18]], O.accent); }

  // lower garments drawn over legs
  if (dress || bot.kind === 'skirt') {
    const ln = bot.kind === 'longdress' ? D.legU + D.legL * .85 : bot.kind === 'skirt' ? D.legU * .8 : D.legU + D.legL * .2;
    const flare = bot.kind === 'longdress' ? 1.35 : 1.5, sw = side ? .78 : 1;
    const skC = bot.color, kneeOff = side ? (legs[1][0][0] + legs[0][0][0]) / 2 * .35 : 0;
    poly([[-bw / 2 * sw, hipY - 10], [bw / 2 * sw, hipY - 10], [bw / 2 * flare * sw + kneeOff, hipY + ln], [-bw / 2 * flare * sw + kneeOff, hipY + ln]], skC);
    if (has('print')) { g.save(); poly([[-bw / 2 * sw, hipY - 10], [bw / 2 * sw, hipY - 10], [bw / 2 * flare * sw, hipY + ln], [-bw / 2 * flare * sw, hipY + ln]]); g.clip(); for (let i = 0; i < 26; i++) { const px = -bw + rnd(i * 5) * bw * 2, py = hipY + rnd(i * 9) * ln; poly([[px, py - 7], [px + 7, py], [px, py + 7], [px - 7, py]], O.accent); } g.restore(); }
  }
  if (has('labcoat') || has('coat')) {
    const cc = has('labcoat') ? '#f8fafc' : O.accent, ln = D.torso + D.legU * 1.05;
    if (side) poly([[tx - tw / 2 - 2, shY - 2], [tx + tw / 2 - 6, shY - 2], [tx + tw / 2 - 2, shY + ln], [tx - tw / 2 - 8, shY + ln]], cc);
    else { poly([[-tw / 2 - 2, shY - 2], [-8, shY - 2], [-6, shY + ln], [-bw / 2 - 12, shY + ln]], cc); poly([[tw / 2 + 2, shY - 2], [8, shY - 2], [6, shY + ln], [bw / 2 + 12, shY + ln]], cc); }
  }
  if (side) drawLeg(1, false);

  // neck + head
  line(tx * .8, shY + 4, headC[0] * .7, neckTop, skin, D.head * .42, 'butt');
  drawHead(sp, D, headC, skin, hairC, O, ex, st, side, P);
  if (side) drawArm(1, false); else { drawArm(0, false); drawArm(1, false); }
  if (hold) { const [e, h] = arms[1]; drawHeld(hold, h[0], h[1], Math.atan2(h[1] - e[1], h[0] - e[0]) - Math.PI / 2 + (hold === 'gun' || hold === 'torch' ? Math.PI / 2 : 0), D.arm / 15); }
  if (has('headphones')) { g.strokeStyle = '#111827'; g.lineWidth = 6; g.beginPath(); g.arc(headC[0], headC[1], D.head * 1.08, Math.PI * 1.05, Math.PI * 1.95); g.stroke(); circle(headC[0] - D.head * 1.02, headC[1] + 4, 10, '#ef4444'); circle(headC[0] + D.head * 1.02, headC[1] + 4, 10, '#ef4444'); }
  g.restore();
  if (P.zzz || st.expr === 'sleeping') { for (let i = 0; i < 3; i++) { const k = ((t * .6 + i / 3) % 1); txt('z', (P.lie ? -150 : 30) + k * 40, (P.lie ? -60 : -330) - k * 60, 22 + i * 6, `rgba(255,255,255,${1 - k})`, 900, 'center'); } }
}

/* ---------- head ---------- */
function headBack(sp, D, c, hc, O, side, st) {
  const r = D.head, [x, y] = c, hs = sp.hair || 'short', lookX = side ? 1 : 0;
  if (O.extras.includes('hood')) { g.strokeStyle = shade(O.top.color, -.12); g.lineWidth = 16; g.beginPath(); g.arc(x, y + 8, r * 1.1, Math.PI * .1, Math.PI * .9); g.stroke(); }
  if (hs === 'afro') circle(x - lookX * 4, y - r * .32, r * 1.48, hc);
  if (hs === 'curly') for (let i = 0; i < 9; i++) { const a = Math.PI * (1.0 + i / 8); circle(x + Math.cos(a) * r * 1.02, y - r * .1 + Math.sin(a) * r * 1.02, r * .38, hc); }
  if (hs === 'long') { rr(x - r * 1.12 - lookX * 6, y - r * .7, r * 2.24, r * 3.2, r * .9); g.fillStyle = hc; g.fill(); }
  if (hs === 'bob') { rr(x - r * 1.15, y - r * .9, r * 2.3, r * 1.9, r * .8); g.fillStyle = hc; g.fill(); }
  if (hs === 'braids' || hs === 'locs') { const n = hs === 'locs' ? 7 : 9, w = hs === 'locs' ? 9 : 6; for (let i = 0; i < n; i++) { const bx = x - r * 1.0 + (i / (n - 1)) * r * 2 - lookX * 8, len = r * (hs === 'locs' ? 2.6 : 2.3); line(bx, y - r * .4, bx + Math.sin(i + (st.t || 0)) * 2, y + len, hc, w); if (hs === 'braids') circle(bx, y + len, 4, sp.accentHair || '#facc15'); } }
  if (hs === 'ponytail') { if (side) ellipse(x - r * 1.15, y + r * .05, r * .34, r * .95, hc, .45); else { ellipse(x + r * .95, y + r * .25, r * .3, r * .8, hc, -.25); } }
  if (hs === 'hijab') { rr(x - r * 1.28, y - r * 1.25, r * 2.56, r * 3.2, r * 1.1); g.fillStyle = sp.colors?.accent || '#0f766e'; g.fill(); }
  if (hs === 'headwrap') { ellipse(x, y - r * .9, r * 1.25, r * .95, sp.colors?.accent || '#dc2626'); }
}

function drawHead(sp, D, c, skin, hc, O, ex, st, side, P) {
  const r = D.head, t = st.t || 0;
  g.save(); g.translate(c[0], c[1]); g.rotate((P.tilt || 0) * DEG);
  const look = side ? .55 : st.look ?? 0, hs = sp.hair || 'short', eyeKind = sp.eyes || 'round';
  // ears
  if (hs !== 'hijab') { if (look < .45) circle(r * .98, 2, r * .2, shade(skin, -.08)); if (look > -.45) circle(-r * .98, 2, r * .2, shade(skin, -.08)); }
  circle(0, 0, r, skin);
  if (sp.age === 'old') { g.strokeStyle = shade(skin, -.22); g.lineWidth = 1.6; [-.55, -.45].forEach((yy) => { g.beginPath(); g.moveTo(-r * .35, r * yy); g.quadraticCurveTo(0, r * (yy - .06), r * .35, r * yy); g.stroke(); }); }
  // beard behind mouth
  const bd = sp.beard || 'none', lx = look * r * .32;
  if (bd === 'beard') { g.beginPath(); g.moveTo(-r * .96, 0); g.quadraticCurveTo(-r * .9, r * 1.25, lx, r * 1.28); g.quadraticCurveTo(r * .9, r * 1.25, r * .96, 0); g.quadraticCurveTo(r * .5, r * .55, lx, r * .62); g.quadraticCurveTo(-r * .5, r * .55, -r * .96, 0); g.fillStyle = hc; g.fill(); }
  if (bd === 'goatee') ellipse(lx, r * .78, r * .22, r * .26, hc);
  if (bd === 'stubble') for (let i = 0; i < 40; i++) { const a = Math.PI * (.15 + .7 * rnd(i)), rr_ = r * (.62 + .3 * rnd(i + 40)); circle(Math.cos(a) * rr_ + lx * .5, Math.sin(a) * rr_, 1.1, alpha(hc, .5)); }
  // eyes
  const blink = ((t + hash(sp.name || sp.id || 'x') * 7) % 4.3) < .12;
  const eyeY = -r * .05, ew = r * .36, eyes = [-ew + lx, ew + lx];
  const lidK = ex.lid || 0, mode = blink && !['hearts', 'spiral', 'shades', 'black'].includes(ex.e) ? 'closed' : ex.e;
  const pl = (st.lookX ?? look) * r * .08;
  eyes.forEach((exx, i) => {
    const far = side && i === 0 ? .82 : 1;
    if (mode === 'closed' || mode === 'happy' || mode === 'sad' || (mode === 'wink' && i === 1)) {
      g.strokeStyle = '#1f1410'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath();
      if (mode === 'happy' || mode === 'wink') g.arc(exx, eyeY + 3, r * .14, Math.PI * 1.15, Math.PI * 1.85); else if (mode === 'sad') g.arc(exx, eyeY - 6, r * .14, Math.PI * .2, Math.PI * .8); else { g.moveTo(exx - r * .14, eyeY); g.lineTo(exx + r * .14, eyeY); }
      g.stroke(); return;
    }
    if (mode === 'hearts') { const hx = exx, hy = eyeY, s = r * .13; g.beginPath(); g.moveTo(hx, hy + s); g.bezierCurveTo(hx - s * 2, hy - s * .4, hx - s * .6, hy - s * 1.7, hx, hy - s * .5); g.bezierCurveTo(hx + s * .6, hy - s * 1.7, hx + s * 2, hy - s * .4, hx, hy + s); g.fillStyle = '#e11d48'; g.fill(); return; }
    if (mode === 'spiral') { g.strokeStyle = '#1f1410'; g.lineWidth = 2; g.beginPath(); for (let a = 0; a < 12; a += .3) { const rr_ = a * r * .015; g.lineTo(exx + Math.cos(a + t * 6) * rr_, eyeY + Math.sin(a + t * 6) * rr_); } g.stroke(); return; }
    if (mode === 'shades') { return; }
    if (mode === 'black') { // possessed: the whole eye goes black, with a faint red glint
      ellipse(exx, eyeY, r * .19 * far, r * .23, '#050505');
      circle(exx + pl * .5 - r * .05, eyeY - r * .07, r * .035, 'rgba(220,30,30,.85)');
      return;
    }
    const wide = mode === 'wide' ? 1.3 : 1;
    let rx = r * .17, ry = r * .21, pr = r * .1;
    if (eyeKind === 'almond') { rx = r * .2; ry = r * .12; pr = r * .085; }
    if (eyeKind === 'big') { rx = r * .21; ry = r * .26; pr = r * .13; }
    if (eyeKind === 'dot') { circle(exx + pl, eyeY, r * .09 * wide, '#1f1410'); return; }
    ellipse(exx, eyeY, rx * wide * far, ry * wide, '#fff', eyeKind === 'almond' ? (i ? -.1 : .1) : 0);
    const py = mode === 'up' ? -ry * .45 : 0;
    circle(exx + pl + (side ? rx * .25 : 0), eyeY + py, pr * (mode === 'wide' ? .8 : 1), '#1f1410');
    circle(exx + pl + (side ? rx * .25 : 0) - pr * .35, eyeY + py - pr * .35, pr * .3, '#fff');
    if (lidK > 0) { g.save(); ellipse(exx, eyeY, rx * wide * far + 1, ry * wide + 1); g.clip(); const sl = (ex.bs < 0 ? (i ? 1 : -1) : 0) * ry * .9; poly([[exx - rx * 2, eyeY - ry * 2], [exx + rx * 2, eyeY - ry * 2], [exx + rx * 2, eyeY - ry + ry * 2 * lidK - sl], [exx - rx * 2, eyeY - ry + ry * 2 * lidK + sl]], skin); g.restore(); }
    if (eyeKind === 'almond') { g.strokeStyle = '#1f1410'; g.lineWidth = 2.2; g.beginPath(); g.ellipse(exx, eyeY, rx * far, ry, i ? -.1 : .1, Math.PI * 1.05, Math.PI * 1.95); g.stroke(); }
  });
  if (mode === 'shades') { rr(-r * .78 + lx, eyeY - r * .16, r * .66, r * .3, 6); g.fillStyle = '#0b0b0b'; g.fill(); rr(r * .1 + lx, eyeY - r * .16, r * .66, r * .3, 6); g.fill(); line(-r * .12 + lx, eyeY - 4, r * .12 + lx, eyeY - 4, '#0b0b0b', 3); }
  // brows
  const bc = hs === 'hijab' || hs === 'headwrap' ? shade(hc, 0) : hc;
  eyes.forEach((exx, i) => {
    const sgn = i ? 1 : -1, by = eyeY - r * (.32 + .14 * ex.by) - (ex.uneven && i ? 5 : 0), sl = ex.bs * r * .1;
    g.strokeStyle = bc; g.lineWidth = r * .09; g.lineCap = 'round'; g.beginPath();
    // inner end goes up when worried (bs>0), down when angry (bs<0)
    const inner = i ? exx - r * .15 : exx + r * .15, outer = i ? exx + r * .15 : exx - r * .15;
    g.moveTo(outer, by); g.lineTo(inner, by - sl); g.stroke();
  });
  // nose
  g.strokeStyle = shade(skin, -.3); g.lineWidth = 2.4; g.beginPath(); g.arc(lx + (side ? 4 : 0), r * .22, r * .1, .2, Math.PI - .2); g.stroke();
  if (ex.blush || sp.age === 'kid') { const a = ex.blush ? .45 : .18; circle(-r * .55 + lx, r * .3, r * .14, `rgba(244,63,94,${a})`); circle(r * .55 + lx, r * .3, r * .14, `rgba(244,63,94,${a})`); }
  // mouth
  const talk = clamp(st.talk || 0), mx = lx * .9, my = r * .5;
  if (bd === 'moustache') { ellipse(mx - r * .17, my - r * .12, r * .2, r * .08, hc, .2); ellipse(mx + r * .17, my - r * .12, r * .2, r * .08, hc, -.2); }
  g.lineCap = 'round';
  if (talk > .05) {
    const h = r * (.06 + .3 * talk), w = r * (.18 + .08 * talk);
    ellipse(mx, my + h * .25, w, h, '#4a1a14');
    if (h > r * .14) ellipse(mx, my + h * .7, w * .6, h * .3, '#e25563');
    if (ex.m === 'smile' || ex.m === 'laugh') { g.strokeStyle = '#4a1a14'; g.lineWidth = 2; }
  } else {
    g.strokeStyle = '#4a1a14'; g.lineWidth = 3; g.beginPath();
    switch (ex.m) {
      case 'smile': g.arc(mx, my - r * .1, r * .26, .25, Math.PI - .25); g.stroke(); break;
      case 'laugh': g.moveTo(mx - r * .3, my - r * .02); g.quadraticCurveTo(mx, my + r * .55, mx + r * .3, my - r * .02); g.closePath(); g.fillStyle = '#4a1a14'; g.fill(); ellipse(mx, my + r * .22, r * .14, r * .08, '#e25563'); break;
      case 'frown': g.arc(mx, my + r * .22, r * .22, Math.PI + .4, -.4); g.stroke(); break;
      case 'cry': g.moveTo(mx - r * .25, my + r * .12); g.quadraticCurveTo(mx, my - r * .12, mx + r * .25, my + r * .12); g.quadraticCurveTo(mx, my + r * .02, mx - r * .25, my + r * .12); g.fillStyle = '#4a1a14'; g.fill(); break;
      case 'grit': rr(mx - r * .24, my - r * .06, r * .48, r * .16, 4); g.fillStyle = '#fff'; g.fill(); g.lineWidth = 2; g.stroke(); line(mx - r * .24, my + r * .02, mx + r * .24, my + r * .02, '#4a1a14', 1.5); break;
      case 'wavy': g.moveTo(mx - r * .24, my); for (let i = 1; i <= 6; i++) g.lineTo(mx - r * .24 + i * r * .08, my + (i % 2 ? -3 : 3)); g.stroke(); break;
      case 'O': ellipse(mx, my + r * .05, r * .14, r * .2, '#4a1a14'); break;
      case 'o': ellipse(mx, my + r * .02, r * .08, r * .1, '#4a1a14'); break;
      case 'smirk': g.moveTo(mx - r * .18, my + 2); g.quadraticCurveTo(mx + r * .1, my + 6, mx + r * .26, my - r * .08); g.stroke(); break;
      case 'side': g.moveTo(mx - r * .1, my + 3); g.lineTo(mx + r * .2, my - 2); g.stroke(); break;
      case 'evil': g.arc(mx, my - r * .16, r * .3, .35, Math.PI - .35); g.stroke(); break;
      default: g.moveTo(mx - r * .16, my); g.lineTo(mx + r * .16, my); g.stroke();
    }
  }
  if (ex.tears) { const k = (t * 1.5) % 1; eyes.forEach((exx) => { g.fillStyle = 'rgba(96,165,250,.85)'; rr(exx - 3, eyeY + 8, 6, r * .3 + k * r * .5, 3); g.fill(); }); }
  if (ex.sweat) { const k = (t * .8) % 1; g.fillStyle = 'rgba(147,197,253,.9)'; g.beginPath(); g.ellipse(r * .85, -r * .3 + k * r * .4, 5, 8, 0, 0, TAU); g.fill(); }
  // hair front
  hairFront(hs, r, hc, look, sp, t);
  if (sp.glasses) { g.strokeStyle = '#111827'; g.lineWidth = 3; circle(eyes[0], eyeY, r * .26); g.stroke(); circle(eyes[1], eyeY, r * .26); g.stroke(); line(eyes[0] + r * .26, eyeY, eyes[1] - r * .26, eyeY, '#111827', 3); }
  drawHat(O.hat, r, look, sp);
  g.restore();
}

function hairFront(hs, r, hc, look, sp, t) {
  const cap = (a0, a1, sc = 1.04, dy = 0) => { g.beginPath(); g.arc(0, dy, r * sc, a0, a1); g.closePath(); g.fillStyle = hc; g.fill(); };
  switch (hs) {
    case 'bald': g.fillStyle = 'rgba(255,255,255,.18)'; ellipse(-r * .3, -r * .62, r * .22, r * .1, null, -.5); g.fill(); break;
    case 'buzz': g.globalAlpha = .85; cap(Math.PI * 1.08, Math.PI * 1.92, 1.02); g.globalAlpha = 1; break;
    case 'short': cap(Math.PI * 1.0, Math.PI * 2.0, 1.06, -2); g.fillStyle = hc; g.fillRect(-r * 1.05, -r * .1, r * .16, r * .4); g.fillRect(r * .89, -r * .1, r * .16, r * .4); break;
    case 'sidepart': cap(Math.PI * 1.0, Math.PI * 2.0, 1.07, -2); ellipse(-r * .25 + look * 8, -r * .62, r * .7, r * .3, hc, -.25); break;
    case 'spiky': cap(Math.PI, Math.PI * 2, 1.04); for (let i = 0; i < 7; i++) { const a = Math.PI * (1.08 + i * .14); poly([[Math.cos(a - .1) * r, Math.sin(a - .1) * r], [Math.cos(a) * r * 1.45, Math.sin(a) * r * 1.45], [Math.cos(a + .1) * r, Math.sin(a + .1) * r]], hc); } break;
    case 'afro': cap(Math.PI * 1.02, Math.PI * 1.98, 1.02, -4); break;
    case 'puffs': cap(Math.PI * 1.05, Math.PI * 1.95, 1.03); circle(-r * .78, -r * .82, r * .5, hc); circle(r * .78, -r * .82, r * .5, hc); break;
    case 'curly': cap(Math.PI * 1.05, Math.PI * 1.95, 1.04); for (let i = 0; i < 5; i++) circle(-r * .6 + i * r * .3, -r * .82, r * .24, hc); break;
    case 'braids': case 'locs': case 'cornrows': cap(Math.PI * 1.03, Math.PI * 1.97, 1.04); g.strokeStyle = shade(hc, .2); g.lineWidth = 2; for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(i * r * .18, -r * 1.0); g.quadraticCurveTo(i * r * .22, -r * .6, i * r * .3, -r * .35); g.stroke(); } break;
    case 'long': case 'bob': cap(Math.PI * 1.0, Math.PI * 2.0, 1.07, -2); ellipse(-r * .55 + look * 6, -r * .5, r * .5, r * .32, hc, -.6); ellipse(r * .55 + look * 6, -r * .5, r * .5, r * .32, hc, .6); break;
    case 'ponytail': case 'bun': cap(Math.PI * 1.0, Math.PI * 2.0, 1.06, -2); if (hs === 'bun') circle(0, -r * 1.12, r * .42, hc); break;
    case 'mohawk': for (let i = 0; i < 6; i++) poly([[-6, -r * .6 - i * 3], [6, -r * .6 - i * 3], [0 + i * 2 - 5, -r * 1.5 + i * 4]], hc); rr(-7, -r * 1.25, 14, r * .7, 4); g.fillStyle = hc; g.fill(); break;
    case 'headwrap': { const c = sp.colors?.accent || '#dc2626'; g.beginPath(); g.arc(0, -r * .12, r * 1.05, Math.PI * 1.0, Math.PI * 2.0); g.closePath(); g.fillStyle = c; g.fill(); ellipse(0, -r * 1.05, r * 1.0, r * .62, c); ellipse(r * .35, -r * 1.45, r * .4, r * .25, shade(c, -.15), .4); g.strokeStyle = shade(c, -.25); g.lineWidth = 2; g.beginPath(); g.arc(0, -r * .9, r * .8, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); break; }
    case 'hijab': { const c = sp.colors?.accent || '#0f766e'; g.strokeStyle = c; g.lineWidth = r * .28; g.beginPath(); g.arc(0, 0, r * 1.06, Math.PI * .72, Math.PI * 2.28); g.stroke(); break; }
  }
}

function drawHat(h, r, look, sp) {
  const lx = look * r * .25;
  switch (h) {
    case 'cowboy': ellipse(lx * .5, -r * .62, r * 1.75, r * .26, '#7c4a24'); rr(-r * .72 + lx * .5, -r * 1.42, r * 1.44, r * .86, r * .3); g.fillStyle = '#8b5a2b'; g.fill(); g.fillStyle = '#3f2a1c'; g.fillRect(-r * .72 + lx * .5, -r * .8, r * 1.44, r * .14); break;
    case 'cap': { const c = sp.colors?.hat || '#dc2626'; g.beginPath(); g.arc(0, -r * .35, r * 1.02, Math.PI, 0); g.closePath(); g.fillStyle = c; g.fill(); ellipse(r * .85 * (look >= 0 ? 1 : -1), -r * .38, r * .62, r * .14, shade(c, -.2)); circle(0, -r * 1.35, 4, shade(c, -.25)); break; }
    case 'hardhat': g.beginPath(); g.arc(0, -r * .4, r * 1.06, Math.PI, 0); g.closePath(); g.fillStyle = '#facc15'; g.fill(); ellipse(0, -r * .42, r * 1.3, r * .14, '#eab308'); g.fillStyle = '#eab308'; g.fillRect(-4, -r * 1.42, 8, r); break;
    case 'police': rr(-r * 1.0, -r * 1.25, r * 2.0, r * .6, 6); g.fillStyle = '#0f172a'; g.fill(); ellipse(lx, -r * .62, r * 1.1, r * .16, '#111827'); circle(0, -r * .98, 6, '#facc15'); break;
    case 'tophat': rr(-r * .7, -r * 2.0, r * 1.4, r * 1.4, 4); g.fillStyle = '#111827'; g.fill(); ellipse(0, -r * .6, r * 1.2, r * .16, '#111827'); g.fillStyle = '#b91c1c'; g.fillRect(-r * .7, -r * .9, r * 1.4, r * .16); break;
    case 'beanie': { const c = sp.colors?.hat || '#2563eb'; g.beginPath(); g.arc(0, -r * .3, r * 1.04, Math.PI, 0); g.closePath(); g.fillStyle = c; g.fill(); rr(-r * 1.06, -r * .5, r * 2.12, r * .3, 8); g.fillStyle = shade(c, -.2); g.fill(); circle(0, -r * 1.38, r * .2, '#f8fafc'); break; }
    case 'chef': rr(-r * .8, -r * 1.2, r * 1.6, r * .7, 6); g.fillStyle = '#f8fafc'; g.fill(); [-.5, 0, .5].forEach((k) => circle(r * k, -r * 1.35, r * .45, '#f8fafc')); break;
    case 'crown': poly([[-r * .8, -r * .7], [r * .8, -r * .7], [r * .9, -r * 1.4], [r * .45, -r * 1.05], [0, -r * 1.55], [-r * .45, -r * 1.05], [-r * .9, -r * 1.4]], '#facc15'); circle(0, -r * .9, 5, '#dc2626'); break;
    case 'party': poly([[-r * .5, -r * .75], [r * .5, -r * .75], [0, -r * 1.9]], '#a855f7'); circle(0, -r * 1.9, 6, '#facc15'); for (let i = 0; i < 3; i++) circle(-r * .15 + i * r * .15, -r * (1.0 + i * .25), 3, '#fde047'); break;
    case 'straw': ellipse(0, -r * .62, r * 1.7, r * .24, '#d9b45a'); rr(-r * .7, -r * 1.25, r * 1.4, r * .7, r * .3); g.fillStyle = '#e5c56d'; g.fill(); g.fillStyle = '#b91c1c'; g.fillRect(-r * .7, -r * .78, r * 1.4, r * .12); break;
    case 'beret': ellipse(-r * .15, -r * .8, r * 1.0, r * .38, '#4d5d3a', -.15); circle(r * .4, -r * .8, 5, '#facc15'); break;
    case 'helmet': g.beginPath(); g.arc(0, -r * .2, r * 1.12, Math.PI, 0); g.closePath(); g.fillStyle = '#e5e7eb'; g.fill(); g.fillStyle = 'rgba(96,165,250,.6)'; rr(-r * .8 + lx, -r * .35, r * 1.6, r * .4, 8); g.fill(); break;
  }
}
