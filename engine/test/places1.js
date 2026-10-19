g.fillStyle='#111';g.fillRect(0,0,1600,1000);
const names=PLACE_NAMES; const tods=['day','night','evening','day'];
names.forEach((n,i)=>{const col=i%6,row=Math.floor(i/6);const W=262,H=148,x=4+col*266,y=4+row*166;
 const P=PLACES[n];g.save();g.beginPath();g.rect(x,y,W,H);g.clip();P.draw(x,y,W,H,2.3,{tod:tods[i%4]});
 const u=H*P.size/310;g.save();g.translate(x+W*.55,y+H*P.floor);g.scale(u,u);drawHuman({name:'p'+i,skin:i%8,hair:HAIRS[i%HAIRS.length],outfit:Object.keys(OUTFITS)[i%30]},{t:1,pose:'stand',expr:'happy'});g.restore();g.restore();
 txt(n+' · '+tods[i%4],x+6,y+H+13,12,'#e5e7eb',700);});
