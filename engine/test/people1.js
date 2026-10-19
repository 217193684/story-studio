g.fillStyle='#e8eef3';g.fillRect(0,0,1600,900);
const cast=[
 {name:'a',skin:0,hair:'afro',outfit:'casual',gender:'m'},
 {name:'b',skin:2,hair:'braids',outfit:'dress',gender:'f'},
 {name:'c',skin:7,hair:'long',hairColor:'blonde',outfit:'office_woman',gender:'f'},
 {name:'d',skin:5,hair:'short',eyes:'almond',outfit:'suit',gender:'m',glasses:true},
 {name:'e',skin:4,hair:'hijab',outfit:'long_dress',gender:'f',colors:{accent:'#0f766e',top:'#1e3a8a',bottom:'#1e3a8a'}},
 {name:'f',skin:1,hair:'bald',beard:'beard',outfit:'worker',gender:'m',build:'big'},
 {name:'g',skin:6,hair:'sidepart',hairColor:'brown',outfit:'cowboy',gender:'m',beard:'moustache'},
 {name:'h',skin:3,hair:'puffs',outfit:'school_girl',gender:'f',age:'kid'},
 {name:'i',skin:2,hair:'headwrap',outfit:'african_print',gender:'f',build:'big'},
 {name:'j',skin:6,hair:'short',hairColor:'white',outfit:'cardigan',age:'old',gender:'m',glasses:true},
 {name:'k',skin:4,hair:'locs',outfit:'dj',gender:'m'},
 {name:'l',skin:7,hair:'ponytail',hairColor:'ginger',outfit:'nurse',gender:'f',eyes:'big'},
];
const poses=['stand','walk','talk','wave','point','sit','dance','angry','phone','cheer','think','run'];
const exprs=['happy','neutral','laugh','smug','talking','sad','happy','angry','neutral','shocked','thinking','scared'];
cast.forEach((sp,i)=>{const cx=70+i*128,fy=430;g.save();g.translate(cx,fy);g.scale(.42,.42);
 drawHuman(sp,{t:1.3+i*.2,pose:poses[i],expr:exprs[i]=='talking'?'happy':exprs[i],talk:exprs[i]=='talking'?.7:0,facing:i%2?'left':'right',walkPhase:1.2+i,seat:70});g.restore();
 txt(poses[i],cx,460,14,'#334155',700,'center');});
// second row: expressions close-up
const ex=['neutral','happy','laugh','sad','cry','angry','scared','shocked','sleepy','smug','love','dizzy','wink','confused','evil','cool'];
ex.forEach((e,i)=>{const cx=60+i*98,fy=880;g.save();g.translate(cx,fy);g.scale(.62,.62);g.translate(0,0);
 drawHuman({name:'z'+i,skin:(i*3)%8,hair:HAIRS[i%HAIRS.length],outfit:Object.keys(OUTFITS)[i%30],gender:i%2?'f':'m',hat:i%4==0?HATS[(i/4|0)+1]:undefined},{t:2,pose:'stand',expr:e,facing:'front'});g.restore();
 txt(e,cx,895,13,'#334155',700,'center');});
