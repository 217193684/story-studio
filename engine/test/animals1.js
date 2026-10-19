g.fillStyle='#e8eef3';g.fillRect(0,0,1600,900);
const ks=ANIMAL_KINDS; const poses=['stand','walk','run','sit','lie','eat','stand','walk'];
ks.forEach((k,i)=>{const col=i%8,row=Math.floor(i/8);const cx=100+col*195,fy=250+row*300;
 g.save();g.translate(cx,fy);const s=k=='elephant'||k=='giraffe'?.5:k=='horse'||k=='cow'||k=='bull'||k=='zebra'||k=='lion'?.62:.85;g.scale(s,s);
 drawAnimal({kind:k,name:k},{t:1.1+i*.3,pose:i%5==3&&(k=='dog'||k=='cat')?'sit':poses[i%8],expr:i%3==0?'happy':'neutral',walkPhase:1+i,facing:i%4==1?'left':'right',talk:i%6==2?.6:0});g.restore();
 txt(k,cx,fy+22,15,'#334155',700,'center');});
