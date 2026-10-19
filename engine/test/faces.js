g.fillStyle='#e8eef3';g.fillRect(0,0,1600,900);
const ex=['neutral','happy','laugh','sad','cry','angry','scared','shocked','sleepy','smug','love','wink','confused','evil','cool','thinking'];
const hairs=['afro','braids','long','short','hijab','bald','puffs','locs','headwrap','sidepart','curly','ponytail','bun','mohawk','spiky','bob'];
ex.forEach((e,i)=>{const cx=110+(i%8)*195,fy=(i<8?430:880);g.save();g.translate(cx,fy+300);g.scale(1.25,1.25);
 drawHuman({name:'f'+i,skin:(i*5)%8,hair:hairs[i],hairColor:['black','brown','blonde','black','black','black','black','black','black','auburn','black','ginger','black','pink','blue','darkbrown'][i],eyes:EYES[i%4],beard:BEARDS[i%5],outfit:'casual',gender:i%2?'f':'m',age:i==6?'kid':i==9?'old':'adult',glasses:i==3},{t:2+i*.37,pose:'stand',expr:e,facing:i%3==0?'front':i%3==1?'right':'left',talk:i==1?.6:0});g.restore();
 txt(e+' / '+hairs[i]+' / '+EYES[i%4],cx,fy-12,15,'#334155',700,'center');});
