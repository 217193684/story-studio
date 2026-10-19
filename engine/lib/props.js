/* Story Studio — props. drawProp(kind, x, groundY, u, t, o): u = pixels per unit (an adult is 310 units tall). */
const PROP_NAMES = ['bakkie', 'water_tank', 'washing_line', 'chicken_coop', 'rondavel', 'braai', 'car', 'taxi', 'truck', 'bicycle', 'tree', 'palm', 'acacia', 'pine', 'dead_tree', 'bush', 'rock', 'bench', 'table', 'chair', 'sofa', 'bed', 'tv', 'lamp', 'plant', 'fridge', 'desk', 'door', 'fence', 'cactus', 'tombstone', 'coffin', 'campfire', 'tent', 'sign', 'stall', 'trashcan', 'streetlight', 'barrel', 'haybale', 'well', 'piano', 'drums', 'mic_stand', 'money_bag', 'treasure', 'cake', 'gift', 'balloons', 'ufo', 'rocket', 'ladder', 'ball', 'box', 'boxes', 'wanted_poster', 'horse_post', 'speaker', 'christmas_tree', 'coffee_table', 'wardrobe', 'computer', 'phone_booth', 'atm', 'cart', 'shopping_cart', 'motorbike', 'police_car', 'ambulance', 'boat', 'snowman', 'throne', 'mirror', 'clock', 'grave_hole', 'crystal_ball', 'cauldron', 'pot'];

function drawProp(kind, x, gy, u, t = 0, o = {}) {
  g.save(); g.translate(x, gy); g.scale(u * (o.flip ? -1 : 1), u);
  const c = o.color;
  switch (kind) {
    case 'car': case 'police_car': case 'ambulance': vehicle(kind === 'ambulance' ? 'van' : 'car', c || (kind === 'police_car' ? '#f8fafc' : kind === 'ambulance' ? '#f8fafc' : '#dc2626'), t, o, kind); break;
    case 'taxi': vehicle('van', c || '#f8fafc', t, o, 'taxi'); break;
    case 'truck': vehicle('truck', c || '#2563eb', t, o, 'truck'); break;
    case 'bakkie': vehicle('bakkie', c || '#e5e7eb', t, o, 'bakkie'); break;
    case 'water_tank': rr(-110, -330, 220, 330, 30); g.fillStyle = c || '#15803d'; g.fill(); for (let i = 1; i < 6; i++) line(-110, -330 + i * 55, 110, -330 + i * 55, shade(c || '#15803d', -.2), 4); ellipse(0, -330, 110, 20, shade(c || '#15803d', .15)); rr(-130, -20, 260, 20, 4); g.fillStyle = '#9ca3af'; g.fill(); break;
    case 'washing_line': line(-260, 0, -260, -300, '#6b7280', 8); line(260, 0, 260, -300, '#6b7280', 8); g.strokeStyle = '#9ca3af'; g.lineWidth = 3; g.beginPath(); g.moveTo(-260, -290); g.quadraticCurveTo(0, -250, 260, -290); g.stroke(); [['#dc2626', -180], ['#2563eb', -60], ['#facc15', 60], ['#f8fafc', 170]].forEach(([cc, x], i) => { const sw = Math.sin(t * 2 + i) * 4; rr(x - 40 + sw, -280 + Math.abs(x) * .06, 80, 100 - i * 8, 6); g.fillStyle = cc; g.fill(); }); break;
    case 'chicken_coop': rr(-150, -200, 300, 200, 6); g.fillStyle = '#92400e'; g.fill(); poly([[-170, -200], [0, -290], [170, -200]], '#7f1d1d'); g.fillStyle = '#1c1917'; g.fillRect(-40, -110, 80, 110); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 2; for (let i = -140; i < 150; i += 20) line(i, -190, i, -10, 'rgba(255,255,255,.25)', 2); break;
    case 'rondavel': rr(-200, -280, 400, 280, 10); g.fillStyle = c || '#f5f5f4'; g.fill(); g.fillStyle = shade(c || '#f5f5f4', -.12); g.fillRect(-200, -60, 400, 60); poly([[-240, -270], [0, -470], [240, -270]], '#a16207'); for (let i = 0; i < 12; i++) line(-230 + i * 40, -275, -i * 3, -460, '#854d0e', 3); rr(-45, -190, 90, 190, [45, 45, 0, 0]); g.fillStyle = '#3f2a1c'; g.fill(); break;
    case 'braai': rr(-120, -150, 240, 40, 8); g.fillStyle = '#1f2937'; g.fill(); line(-100, -110, -110, 0, '#374151', 8); line(100, -110, 110, 0, '#374151', 8); for (let i = 0; i < 4; i++) { ellipse(-75 + i * 50, -158, 22, 9, i % 2 ? '#7c2d12' : '#9a3412'); } for (let i = 0; i < 3; i++) { const k = (t * .7 + i / 3) % 1; circle(-40 + i * 40 + Math.sin(k * 6) * 10, -180 - k * 140, 14 + k * 26, `rgba(200,200,200,${.4 * (1 - k)})`); } break;
    case 'bicycle': case 'motorbike': { const spin = (o.moving ? t * 8 : 0); [[-110, 0], [110, 0]].forEach(([wx]) => { g.save(); g.translate(wx, -60); g.rotate(spin); circle(0, 0, 60); g.strokeStyle = '#111'; g.lineWidth = 10; g.stroke(); for (let i = 0; i < 4; i++) line(0, 0, Math.cos(i * .8) * 56, Math.sin(i * .8) * 56, '#6b7280', 3); g.restore(); }); g.strokeStyle = c || '#16a34a'; g.lineWidth = 12; g.beginPath(); g.moveTo(-110, -60); g.lineTo(-20, -140); g.lineTo(80, -140); g.lineTo(110, -60); g.moveTo(-20, -140); g.lineTo(10, -60); g.lineTo(-110, -60); g.stroke(); if (kind === 'motorbike') { rr(-70, -175, 150, 60, 25); g.fillStyle = c || '#111827'; g.fill(); } line(80, -140, 70, -190, '#111', 8); line(55, -195, 95, -190, '#111', 8); break; }
    case 'tree': treeShape(0, 0, 3.4, c || '#15803d'); break;
    case 'palm': treeShape(0, 0, 3.2, '#16a34a', 'palm'); break;
    case 'acacia': treeShape(0, 0, 3.6, '#4d7c0f', 'acacia'); break;
    case 'pine': treeShape(0, 0, 3.0, '#14532d', 'pine'); break;
    case 'dead_tree': treeShape(0, 0, 4, '#000', 'dead'); break;
    case 'bush': [[-50, -40, 55], [20, -50, 60], [70, -30, 40], [-10, -30, 50]].forEach((q) => circle(q[0], q[1], q[2], c || '#16a34a')); break;
    case 'rock': ellipse(0, -40, 90, 50, c || '#78716c'); ellipse(-20, -60, 40, 18, shade(c || '#78716c', .15)); break;
    case 'bench': rr(-130, -110, 260, 18, 4); g.fillStyle = '#92400e'; g.fill(); rr(-130, -170, 260, 18, 4); g.fill(); g.fillStyle = '#1f2937'; g.fillRect(-120, -92, 10, 92); g.fillRect(110, -92, 10, 92); break;
    case 'table': rr(-150, -150, 300, 18, 5); g.fillStyle = c || '#a16207'; g.fill(); g.fillStyle = shade(c || '#a16207', -.3); g.fillRect(-135, -132, 14, 132); g.fillRect(121, -132, 14, 132); (o.items || []).forEach((it, i, arr) => drawHeld(it === 'meat' ? 'food' : it, (i - (arr.length - 1) / 2) * 80, -152, 0, 2)); break;
    case 'coffee_table': rr(-110, -70, 220, 14, 5); g.fillStyle = c || '#78350f'; g.fill(); g.fillStyle = shade(c || '#78350f', -.3); g.fillRect(-100, -56, 10, 56); g.fillRect(90, -56, 10, 56); break;
    case 'chair': g.fillStyle = c || '#92400e'; rr(-45, -100, 90, 14, 4); g.fill(); g.fillRect(-45, -210, 12, 124); g.fillRect(-40, -86, 10, 86); g.fillRect(32, -86, 10, 86); rr(-45, -210, 12, 110, 4); g.fill(); break;
    case 'sofa': { const cc = c || '#1d4ed8'; rr(-230, -230, 460, 130, 30); g.fillStyle = shade(cc, -.15); g.fill(); rr(-250, -130, 500, 90, 24); g.fillStyle = cc; g.fill(); rr(-270, -170, 60, 140, 24); g.fill(); rr(210, -170, 60, 140, 24); g.fill(); g.fillStyle = '#3f2a1c'; g.fillRect(-240, -40, 16, 40); g.fillRect(224, -40, 16, 40); break; }
    case 'bed': rr(-260, -130, 520, 100, 10); g.fillStyle = '#6b4226'; g.fill(); rr(-250, -170, 500, 70, 20); g.fillStyle = c || '#2f6f93'; g.fill(); rr(-240, -200, 120, 60, 20); g.fillStyle = '#f1f5f9'; g.fill(); rr(-275, -260, 30, 260, 8); g.fillStyle = '#6b4226'; g.fill(); break;
    case 'tv': { const on = o.on !== false; rr(-130, -150, 260, 150, 6); g.fillStyle = '#3f2a1c'; g.fill(); rr(-150, -360, 300, 200, 10); g.fillStyle = '#111827'; g.fill(); rr(-140, -350, 280, 180, 4); g.fillStyle = on ? `hsl(${(t * 40) % 360},55%,${45 + 8 * Math.sin(t * 7)}%)` : '#0b0f19'; g.fill(); if (o.text) txt(o.text, 0, -250, 30, '#fff', 900, 'center'); break; }
    case 'lamp': line(0, 0, 0, -300, '#374151', 8); ellipse(0, 0, 40, 10, '#374151'); poly([[-50, -280], [50, -280], [30, -360], [-30, -360]], c || '#fde68a'); if (o.on !== false) lampLight(0, -300, 220, '255,220,150', .35); break;
    case 'plant': plant(0, 0, 2.4); break;
    case 'fridge': rr(-90, -360, 180, 360, 14); g.fillStyle = c || '#e5e7eb'; g.fill(); line(-90, -240, 90, -240, '#9ca3af', 4); line(70, -330, 70, -270, '#9ca3af', 8); line(70, -210, 70, -120, '#9ca3af', 8); break;
    case 'desk': rr(-200, -160, 400, 20, 4); g.fillStyle = c || '#e5e7eb'; g.fill(); g.fillStyle = '#9ca3af'; g.fillRect(-190, -140, 16, 140); g.fillRect(174, -140, 16, 140); rr(60, -140, 110, 120, 4); g.fill(); break;
    case 'computer': rr(-80, -150, 160, 110, 8); g.fillStyle = '#111827'; g.fill(); rr(-70, -140, 140, 90, 4); g.fillStyle = '#38bdf8'; g.fill(); g.fillStyle = '#374151'; g.fillRect(-10, -40, 20, 30); rr(-50, -12, 100, 12, 4); g.fill(); break;
    case 'door': doorShape(-80, -400, 160, 400, c || '#7c4a24', o.open || 0); break;
    case 'fence': for (let i = -4; i <= 4; i++) { g.fillStyle = c || '#a16207'; g.fillRect(i * 60 - 8, -140, 16, 140); poly([[i * 60 - 8, -140], [i * 60 + 8, -140], [i * 60, -158]], c || '#a16207'); } g.fillRect(-250, -110, 500, 12); g.fillRect(-250, -50, 500, 12); break;
    case 'cactus': { const cc = c || '#15803d'; rr(-28, -320, 56, 320, 28); g.fillStyle = cc; g.fill(); rr(-90, -220, 30, 110, 15); g.fill(); rr(-90, -130, 70, 30, 15); g.fill(); rr(60, -260, 30, 110, 15); g.fill(); rr(20, -170, 70, 30, 15); g.fill(); g.strokeStyle = shade(cc, -.25); g.lineWidth = 3; for (let i = -1; i <= 1; i++) line(i * 12, -300, i * 12, -10, shade(cc, -.25), 3); break; }
    case 'tombstone': rr(-60, -170, 120, 170, [60, 60, 0, 0]); g.fillStyle = c || '#6b7280'; g.fill(); txt('RIP', 0, -90, 34, '#374151', 900, 'center'); break;
    case 'coffin': poly([[-200, -20], [-130, -90], [170, -90], [210, -40], [170, 0], [-130, 0]], c || '#3f2a1c'); line(-80, -45, 120, -45, '#a16207', 4); break;
    case 'campfire': for (let i = 0; i < 4; i++) line(-70 + i * 10, -10, 70 - i * 10, -30 + (i % 2) * 20, '#5b3417', 16); g.save(); g.shadowColor = '#f97316'; g.shadowBlur = 40; for (let i = 0; i < 5; i++) { const fh = 90 + 30 * Math.sin(t * 9 + i * 2); poly([[-50 + i * 25 - 20, -20], [-50 + i * 25 + 20, -20], [-50 + i * 25 + Math.sin(t * 11 + i) * 8, -20 - fh]], i % 2 ? '#f97316' : '#facc15'); } g.restore(); lampLight(0, -60, 300, '255,160,60', .35); break;
    case 'tent': poly([[-200, 0], [0, -260], [200, 0]], c || '#16a34a'); poly([[-50, 0], [0, -150], [50, 0]], shade(c || '#16a34a', -.4)); break;
    case 'sign': line(0, 0, 0, -220, '#78350f', 14); rr(-140, -330, 280, 120, 8); g.fillStyle = c || '#fef3c7'; g.fill(); g.strokeStyle = '#78350f'; g.lineWidth = 6; g.stroke(); txt(o.text || 'WELCOME', 0, -255, o.text && o.text.length > 9 ? 30 : 42, '#1f2937', 900, 'center'); break;
    case 'stall': g.fillStyle = '#a16207'; g.fillRect(-200, -340, 14, 340); g.fillRect(186, -340, 14, 340); for (let i = 0; i < 8; i++) { poly([[-220 + i * 55, -360], [-165 + i * 55, -360], [-165 + i * 55, -300], [-220 + i * 55, -300]], i % 2 ? '#f8fafc' : (c || '#dc2626')); } rr(-210, -150, 420, 150, 6); g.fillStyle = '#92400e'; g.fill(); for (let i = 0; i < 9; i++) circle(-170 + i * 42, -170, 20, ['#f97316', '#facc15', '#16a34a', '#dc2626'][i % 4]); break;
    case 'trashcan': rr(-50, -150, 100, 150, 8); g.fillStyle = c || '#4b5563'; g.fill(); rr(-60, -165, 120, 20, 6); g.fillStyle = shade(c || '#4b5563', -.2); g.fill(); break;
    case 'streetlight': line(0, 0, 0, -520, '#374151', 14); line(0, -520, 70, -520, '#374151', 10); ellipse(80, -510, 30, 12, '#fef3c7'); if (o.on) lampLight(80, -500, 300, '255,226,150', .45); break;
    case 'barrel': rr(-60, -170, 120, 170, 30); g.fillStyle = c || '#92400e'; g.fill(); line(-60, -130, 60, -130, '#3f2a1c', 6); line(-60, -40, 60, -40, '#3f2a1c', 6); break;
    case 'haybale': rr(-110, -120, 220, 120, 20); g.fillStyle = '#facc15'; g.fill(); for (let i = 0; i < 12; i++) line(-100 + i * 18, -110, -95 + i * 18, -10, '#ca8a04', 3); break;
    case 'well': rr(-110, -120, 220, 120, 6); g.fillStyle = '#78716c'; g.fill(); g.fillStyle = '#5b3417'; g.fillRect(-100, -300, 14, 180); g.fillRect(86, -300, 14, 180); poly([[-140, -290], [0, -360], [140, -290]], '#7f1d1d'); break;
    case 'piano': rr(-200, -280, 400, 200, 8); g.fillStyle = c || '#111827'; g.fill(); g.fillStyle = '#f8fafc'; g.fillRect(-190, -150, 380, 40); for (let i = 0; i < 18; i++) { g.fillStyle = '#111'; g.fillRect(-185 + i * 21, -150, 8, 24); } g.fillStyle = c || '#111827'; g.fillRect(-190, -80, 20, 80); g.fillRect(170, -80, 20, 80); break;
    case 'drums': ellipse(0, -110, 90, 90, '#dc2626'); ellipse(0, -110, 60, 60, '#f8fafc'); ellipse(-130, -180, 50, 20, '#e5e7eb'); ellipse(130, -200, 50, 12, '#facc15'); line(130, -200, 130, 0, '#6b7280', 5); break;
    case 'mic_stand': line(0, 0, 0, -320, '#374151', 8); ellipse(0, 0, 50, 10, '#374151'); circle(0, -340, 18, '#9ca3af'); break;
    case 'money_bag': ellipse(0, -80, 80, 80, '#a16207'); poly([[-30, -150], [30, -150], [0, -120]], '#a16207'); txt('R', 0, -60, 70, '#fde68a', 900, 'center'); break;
    case 'treasure': rr(-110, -120, 220, 120, 8); g.fillStyle = '#92400e'; g.fill(); g.beginPath(); g.ellipse(0, -120, 110, 50, 0, Math.PI, 0); g.fill(); for (let i = 0; i < 8; i++) circle(-70 + i * 20, -125 - (i % 2) * 10, 14, '#facc15'); g.fillStyle = '#facc15'; g.fillRect(-15, -110, 30, 30); break;
    case 'cake': rr(-110, -120, 220, 120, 10); g.fillStyle = '#f9a8d4'; g.fill(); rr(-90, -200, 180, 80, 10); g.fillStyle = '#fbcfe8'; g.fill(); for (let i = 0; i < 5; i++) { drawHeld('candle', -60 + i * 30, -200, 0, 1.4); } break;
    case 'gift': rr(-80, -140, 160, 140, 8); g.fillStyle = c || '#dc2626'; g.fill(); g.fillStyle = '#facc15'; g.fillRect(-12, -140, 24, 140); g.fillRect(-80, -82, 160, 24); ellipse(-25, -150, 25, 14, '#facc15', .4); ellipse(25, -150, 25, 14, '#facc15', -.4); break;
    case 'balloons': for (let i = 0; i < 4; i++) { const bx = -60 + i * 40, by = -380 - (i % 2) * 50 + Math.sin(t * 2 + i) * 8; line(0, 0, bx, by + 50, '#6b7280', 2); ellipse(bx, by, 36, 46, ['#ef4444', '#3b82f6', '#facc15', '#22c55e'][i]); } break;
    case 'ufo': { const yy = -400 + Math.sin(t * 2) * 20; g.fillStyle = 'rgba(190,255,190,.18)'; poly([[-60, yy], [60, yy], [160, 0], [-160, 0]]); g.fill(); ellipse(0, yy - 20, 90, 60, 'rgba(147,197,253,.8)'); ellipse(0, yy, 200, 40, '#9ca3af'); for (let i = 0; i < 6; i++) circle(-150 + i * 60, yy + 6, 8, Math.sin(t * 8 + i) > 0 ? '#facc15' : '#f97316'); break; }
    case 'rocket': rr(-60, -460, 120, 380, [60, 60, 10, 10]); g.fillStyle = '#e5e7eb'; g.fill(); circle(0, -350, 30, '#60a5fa'); poly([[-60, -140], [-120, -40], [-60, -90]], '#dc2626'); poly([[60, -140], [120, -40], [60, -90]], '#dc2626'); if (o.on) { g.save(); g.shadowColor = '#f97316'; g.shadowBlur = 30; poly([[-40, -80], [40, -80], [0, 80 + Math.sin(t * 30) * 30]], '#f97316'); g.restore(); } break;
    case 'ladder': line(-50, 0, -40, -420, '#a16207', 12); line(50, 0, 40, -420, '#a16207', 12); for (let i = 0; i < 7; i++) line(-48, -40 - i * 55, 48, -40 - i * 55, '#a16207', 8); break;
    case 'ball': circle(0, -40 - Math.abs(Math.sin(t * 5)) * (o.bounce ? 80 : 0), 40, c || '#f97316'); break;
    case 'box': rr(-80, -140, 160, 140, 4); g.fillStyle = '#c08a4a'; g.fill(); g.fillStyle = '#a0703a'; g.fillRect(-80, -80, 160, 12); break;
    case 'boxes': [[-90, 0], [80, 0], [-5, -140]].forEach(([bx, by]) => { rr(bx - 80, by - 140, 160, 140, 4); g.fillStyle = '#c08a4a'; g.fill(); g.fillStyle = '#a0703a'; g.fillRect(bx - 80, by - 80, 160, 12); }); break;
    case 'wanted_poster': rr(-80, -420, 160, 210, 4); g.fillStyle = '#fef3c7'; g.fill(); txt('WANTED', 0, -380, 30, '#7f1d1d', 900, 'center'); circle(0, -310, 40, '#78716c'); txt('$500', 0, -232, 28, '#1f2937', 900, 'center'); break;
    case 'horse_post': g.fillStyle = '#78350f'; g.fillRect(-150, -150, 18, 150); g.fillRect(132, -150, 18, 150); g.fillRect(-160, -150, 320, 16); break;
    case 'speaker': rr(-70, -260, 140, 260, 8); g.fillStyle = '#111827'; g.fill(); circle(0, -170, 45 + Math.abs(Math.sin(t * 8)) * 4, '#374151'); circle(0, -60, 30, '#374151'); break;
    case 'christmas_tree': treeShape(0, 0, 3, '#166534', 'pine'); for (let i = 0; i < 12; i++) circle(-60 + rnd(i) * 120, -80 - rnd(i + 5) * 280, 8, ['#ef4444', '#facc15', '#3b82f6'][i % 3]); break;
    case 'wardrobe': rr(-130, -420, 260, 420, 8); g.fillStyle = c || '#7c4a24'; g.fill(); line(0, -410, 0, -10, shade(c || '#7c4a24', -.3), 4); circle(-14, -220, 6, '#facc15'); circle(14, -220, 6, '#facc15'); break;
    case 'phone_booth': rr(-90, -440, 180, 440, 8); g.fillStyle = c || '#dc2626'; g.fill(); g.fillStyle = 'rgba(191,219,254,.7)'; g.fillRect(-70, -380, 140, 300); break;
    case 'atm': rr(-80, -300, 160, 300, 8); g.fillStyle = '#1e3a8a'; g.fill(); rr(-60, -270, 120, 80, 4); g.fillStyle = '#38bdf8'; g.fill(); txt('ATM', 0, -140, 34, '#fff', 900, 'center'); break;
    case 'cart': case 'shopping_cart': g.strokeStyle = '#6b7280'; g.lineWidth = 6; g.strokeRect(-110, -200, 200, 120); for (let i = 0; i < 6; i++) line(-110 + i * 40, -200, -110 + i * 40, -80, '#6b7280', 3); line(90, -200, 140, -240, '#6b7280', 8); circle(-90, -20, 18, '#111'); circle(70, -20, 18, '#111'); break;
    case 'boat': poly([[-260, -100], [260, -100], [200, 0], [-200, 0]], c || '#b91c1c'); line(0, -100, 0, -420, '#78350f', 10); poly([[10, -400], [180, -140], [10, -140]], '#f8fafc'); break;
    case 'snowman': circle(0, -90, 90, '#f8fafc'); circle(0, -230, 65, '#f8fafc'); circle(0, -340, 48, '#f8fafc'); circle(-15, -350, 6, '#111'); circle(15, -350, 6, '#111'); poly([[0, -335], [40, -330], [0, -325]], '#f97316'); break;
    case 'throne': rr(-120, -460, 240, 460, 20); g.fillStyle = '#facc15'; g.fill(); rr(-90, -420, 180, 260, 14); g.fillStyle = '#b91c1c'; g.fill(); rr(-130, -180, 260, 60, 8); g.fillStyle = '#b91c1c'; g.fill(); break;
    case 'mirror': ellipse(0, -300, 90, 130, '#a16207'); ellipse(0, -300, 76, 116, '#bfdbfe'); g.fillStyle = 'rgba(255,255,255,.5)'; poly([[-40, -360], [-10, -400], [20, -250], [-10, -220]]); g.fill(); break;
    case 'clock': circle(0, -380, 60, '#f8fafc'); g.strokeStyle = '#111'; g.lineWidth = 6; g.stroke(); line(0, -380, Math.cos(t * .5) * 40, -380 + Math.sin(t * .5) * 40, '#111', 4); line(0, -380, 0, -420, '#111', 6); break;
    case 'grave_hole': ellipse(0, -10, 150, 30, '#1c1917'); poly([[-180, -10], [-120, -60], [-60, -10]], '#57534e'); break;
    case 'crystal_ball': circle(0, -140, 70, 'rgba(167,139,250,.75)'); g.save(); g.shadowColor = '#a78bfa'; g.shadowBlur = 40; circle(0, -140, 30 + Math.sin(t * 3) * 8, 'rgba(255,255,255,.45)'); g.restore(); rr(-60, -80, 120, 80, 10); g.fillStyle = '#78350f'; g.fill(); break;
    case 'cauldron': case 'pot': ellipse(0, -90, 120, 90, '#1f2937'); ellipse(0, -160, 110, 26, kind === 'cauldron' ? '#22c55e' : '#9a3412'); for (let i = 0; i < 4; i++) { const k = (t * .8 + i / 4) % 1; circle(-40 + i * 25, -170 - k * 120, 10 + k * 20, kind === 'cauldron' ? `rgba(134,239,172,${.7 * (1 - k)})` : `rgba(255,255,255,${.4 * (1 - k)})`); } break;
  }
  g.restore();
}

function vehicle(shape, c, t, o, kind) {
  const moving = o.moving, bounce = moving ? Math.sin(t * 20) * 3 : 0, spin = moving ? t * 10 * (o.dir || 1) : 0;
  g.translate(0, bounce);
  if (shape === 'car') {
    rr(-380, -230, 760, 140, 40); g.fillStyle = c; g.fill();
    g.beginPath(); g.moveTo(-210, -230); g.lineTo(-130, -340); g.lineTo(150, -340); g.lineTo(240, -230); g.closePath(); g.fill();
    g.fillStyle = '#bfdbfe'; poly([[-185, -235], [-120, -322], [0, -322], [0, -235]]); g.fill(); poly([[20, -235], [20, -322], [140, -322], [212, -235]]); g.fill();
    if (kind === 'police_car') { g.fillStyle = '#1e3a8a'; g.fillRect(-380, -180, 760, 40); rr(-40, -365, 80, 25, 6); g.fillStyle = Math.sin(t * 12) > 0 ? '#ef4444' : '#3b82f6'; g.fill(); }
  } else if (shape === 'van') {
    rr(-440, -380, 880, 300, 40); g.fillStyle = c; g.fill();
    g.fillStyle = '#93c5fd'; for (let i = 0; i < 5; i++) rr(-400 + i * 150, -350, 120, 90, 10), g.fill();
    rr(330, -350, 90, 120, 14); g.fill();
    g.fillStyle = kind === 'taxi' ? '#1d4ed8' : '#dc2626'; g.fillRect(-440, -220, 880, 26);
    if (kind === 'ambulance') { g.fillStyle = '#dc2626'; g.fillRect(-60, -250, 120, 30); g.fillRect(-15, -295, 30, 120); rr(-30, -410, 60, 30, 6); g.fillStyle = Math.sin(t * 12) > 0 ? '#ef4444' : '#60a5fa'; g.fill(); }
  } else if (shape === 'bakkie') {
    rr(-400, -230, 800, 140, 26); g.fillStyle = c; g.fill();
    g.beginPath(); g.moveTo(40, -230); g.lineTo(90, -350); g.lineTo(300, -350); g.lineTo(370, -230); g.closePath(); g.fill();
    g.fillStyle = '#bfdbfe'; poly([[70, -235], [108, -330], [290, -330], [345, -235]]); g.fill();
    g.fillStyle = shade(c, -.25); g.fillRect(-390, -250, 400, 22); g.fillStyle = shade(c, -.12); g.fillRect(-400, -230, 420, 10);
  } else {
    rr(-460, -420, 560, 330, 10); g.fillStyle = '#e5e7eb'; g.fill(); rr(110, -330, 230, 240, 30); g.fillStyle = c; g.fill(); rr(170, -310, 140, 90, 10); g.fillStyle = '#bfdbfe'; g.fill();
  }
  circle(shape === 'truck' ? 330 : 360, -170, 22, '#fef3c7');
  [-240, 240].forEach((wx) => { g.save(); g.translate(shape === 'truck' ? (wx < 0 ? -320 : 230) : wx, -80); g.rotate(spin); circle(0, 0, 80, '#111827'); circle(0, 0, 40, '#9ca3af'); line(-36, 0, 36, 0, '#4b5563', 6); g.restore(); });
  if (moving) for (let i = 0; i < 4; i++) { const k = (t * 3 + i / 4) % 1; circle(-440 - k * 160 * (o.dir || 1), -60 - i * 6, 20 + k * 40, `rgba(160,160,160,${.4 * (1 - k)})`); }
}
