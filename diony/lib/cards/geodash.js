/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Kartu HTML statis: GEO DASH LIVE v2 (cube, pesawat, bola, UFO, wave, gravitasi + musik synth orisinal)
// Semua jalan di dalam kartu (tanpa fetch). Musik & efek dibuat lewat WebAudio (tanpa file audio).
const { BASE_CSS, safeJson } = require("../htmlcard");

const BODY = String.raw`
<style>
__BASECSS__
canvas{display:block;width:100%;border-radius:12px;border:1px solid var(--line);touch-action:none;background:#111;}
.bar{height:7px;border-radius:9px;background:var(--card2);overflow:hidden;margin:9px 0 6px;}
.bar i{display:block;height:100%;width:0;background:var(--acc);}
.st3{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:8px;}
.st3 div{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:6px 0;text-align:center;font-size:10px;color:var(--soft);}
.st3 b{display:block;font-size:14px;color:var(--ink);}
.jump{width:100%;padding:16px 0;font-size:15px;touch-action:none;user-select:none;-webkit-user-select:none;}
.lg{display:flex;flex-wrap:wrap;gap:4px 10px;justify-content:center;margin-top:8px;font-size:10.5px;color:var(--soft);}
.lg i{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:4px;}
</style>
<div class="stage"><div class="app">
  <div class="top"><div class="logo">🟩</div><div class="meta"><div class="title">Geo Dash Live</div><div class="sub" id="who"></div></div><button class="btn alt" id="mu" style="padding:6px 10px">🔊</button></div>
  <div class="chips" id="tabs"></div>
  <canvas id="cv" width="360" height="210"></canvas>
  <div class="bar"><i id="pg"></i></div>
  <div class="st3"><div><b id="sp">0%</b>Progres</div><div><b id="sa">1</b>Percobaan</div><div><b id="sb">0%</b>Terbaik</div><div><b id="sm">Cube</b>Mode</div></div>
  <button class="btn jump" id="jb">⬆ TAP / TAHAN</button>
  <div class="lg"><span><i style="background:#22c55e"></i>Cube</span><span><i style="background:#ec4899"></i>Pesawat</span><span><i style="background:#f97316"></i>Bola</span><span><i style="background:#ef4444"></i>UFO</span><span><i style="background:#a855f7"></i>Wave</span><span><i style="background:#38bdf8"></i>Gravitasi ↑</span><span><i style="background:#facc15"></i>Gravitasi ↓</span></div>
</div></div>
<script>
(function(){
var C=__CFG__;var $=function(i){return document.getElementById(i);};
var cv=$('cv'),cx=cv.getContext('2d'),W=360,H=210;
/*CORE*/
var T=30,P=30,G=165,CE=30,GR=1700,JV=560,SA=1000,VM=230,UG=1150,UJ=340;
var LV=[
 {n:'Mudah',v:190,gap:7,hue:140,bpm:124,pat:[0,1,2,3,4],plan:[['c',8],['ship',4],['c',5],['ball',4],['c',5]]},
 {n:'Normal',v:230,gap:6,hue:210,bpm:136,pat:[0,1,2,3,4,5,6,7],plan:[['c',8],['ship',5],['c',5],['ball',5],['c',5],['ufo',5],['c',5],['grav',3],['c',5]]},
 {n:'Sulit',v:265,gap:5,hue:330,bpm:148,pat:[0,1,2,3,4,5,6,7],plan:[['c',9],['ship',6],['c',6],['ball',6],['c',6],['ufo',6],['c',6],['wave',6],['c',6],['grav',4],['c',6]]}
];
var COMBO=[[2,0],[0,2],[1,1],[1,0],[0,1]];
function rng(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function gen(li){
  var d=LV[li],r=rng(li*977+13),x=14,ob=[],ceil=[],pc=0;
  function sp(a,c){ob.push({t:'s',x:a,w:1,c:c||0});}
  function bl(a,w,h){ob.push({t:'b',x:a,w:w,h:h});}
  function wl(a,w,h,c){if(h>0)ob.push({t:'w',x:a,w:w,h:h,c:c});}
  function por(a,k){ob.push({t:'o',x:a,w:1,k:k,i:pc++});}
  function gp(){return d.gap+Math.floor(r()*3);}
  d.plan.forEach(function(sec){
    var k=sec[0],n=sec[1],i;
    if(k==='c'){
      for(i=0;i<n;i++){
        var p=d.pat[Math.floor(r()*d.pat.length)],w;
        if(p===0){sp(x);w=1;}
        else if(p===1){sp(x);sp(x+1);w=2;}
        else if(p===2){bl(x,2,1);w=2;}
        else if(p===3){bl(x,2,2);w=2;}
        else if(p===4){bl(x,3,1);sp(x+5);w=6;}
        else if(p===5){sp(x);sp(x+1);sp(x+2);w=3;}
        else if(p===6){bl(x,2,1);bl(x+2,2,2);w=4;}
        else{sp(x);sp(x+2);w=3;}
        x+=w+gp();
      }
    }else if(k==='ship'||k==='ufo'||k==='wave'){
      por(x,k);var x0=x;x+=10;
      for(i=0;i<n;i++){var cb=COMBO[Math.floor(r()*COMBO.length)],w2=1+Math.floor(r()*2);wl(x,w2,cb[0],0);wl(x,w2,cb[1],1);x+=w2+d.gap+1+Math.floor(r()*3);}
      por(x,'cube');ceil.push([x0,x]);x+=8;
    }else if(k==='ball'){
      por(x,'ball');var x1=x,sf=0;x+=10;
      for(i=0;i<n;i++){var w3=1+Math.floor(r()*2);for(var j=0;j<w3;j++)sp(x+j,sf);x+=w3+d.gap+2+Math.floor(r()*3);sf=1-sf;}
      por(x,'cube');ceil.push([x1,x]);x+=8;
    }else{
      for(i=0;i<n;i++){
        var g0=x;por(x,'gf');x+=8;
        var w4=1+Math.floor(r()*2);for(var a=0;a<w4;a++)sp(x+a,1);x+=w4+d.gap+2;
        por(x,'gn');ceil.push([g0,x]);x+=8;
        var w5=1+Math.floor(r()*2);for(var b=0;b<w5;b++)sp(x+b,0);x+=w5+d.gap+2;
      }
    }
  });
  return {ob:ob,end:x+6,v:d.v,ceil:ceil};
}
function tick(s,L,held,dt){
  var m=s.m,fly=(m==='ship'||m==='ufo'||m==='wave'),edge=held&&!s.hh,pb=s.py+P,gd=s.gd,was=s.gr;
  var cei=(m!=='cube'||gd<0);
  s.ev='';
  if(m==='cube'){if(held&&was){s.vy=-JV*gd;s.ev='j';}s.vy+=GR*gd*dt;}
  else if(m==='ball'){if(edge&&was){s.gd=gd=-gd;s.vy=0;s.ev='j';}s.vy+=GR*gd*dt;}
  else if(m==='ship'){s.vy+=(held?-SA:SA)*dt;if(s.vy>VM)s.vy=VM;if(s.vy<-VM)s.vy=-VM;}
  else if(m==='ufo'){if(edge){s.vy=-UJ;s.ev='j';}s.vy+=UG*dt;if(s.vy>420)s.vy=420;if(s.vy<-420)s.vy=-420;}
  else{s.vy=(held?-1:1)*L.v*0.9;}
  s.hh=held;
  s.py+=s.vy*dt;s.px+=L.v*dt;s.gr=false;
  if(s.py+P>=G){s.py=G-P;if(s.vy>0)s.vy=0;if(gd>0&&!fly)s.gr=true;}
  if(cei&&s.py<=CE){s.py=CE;if(s.vy<0)s.vy=0;if(gd<0&&!fly)s.gr=true;}
  var ax=fly?6:4,ay=fly?6:0,l=s.px+ax,r=s.px+P-ax,t=s.py+ay,b=s.py+P-ay;
  for(var i=0;i<L.ob.length;i++){
    var o=L.ob[i],x=o.x*T;
    if(x>s.px+80)break;
    if(x+o.w*T<s.px-10)continue;
    if(o.t==='o'){
      if(o.i===s.po&&s.px+P/2>=x){
        s.po++;s.ev='p';
        if(o.k==='gf')s.gd=-1;else if(o.k==='gn')s.gd=1;
        else{s.m=o.k;s.gd=1;if(o.k==='wave')s.vy=0;}
      }
    }else if(o.t==='b'){
      if(m==='cube'&&gd>0&&!cei){
        var by=G-o.h*T;
        if(s.px+P-2>x&&s.px+2<x+o.w*T&&s.py+P>by){
          if(s.vy>=0&&pb<=by+10){s.py=by-P;s.vy=0;s.gr=true;}else{s.dead=true;return;}
        }
      }
    }else if(o.t==='s'){
      var sx=x+8;
      if(r>sx&&l<sx+14&&(o.c?(t<CE+22&&b>CE):(b>G-22&&t<G))){s.dead=true;return;}
    }else{
      if(r>x&&l<x+o.w*T&&(o.c?t<CE+o.h*T:b>G-o.h*T)){s.dead=true;return;}
    }
  }
  if(s.px>=L.end*T)s.win=true;
}
function newState(){return {px:0,py:G-P,vy:0,gr:true,m:'cube',gd:1,po:0,hh:false,ev:'',dead:false,win:false};}
/*ENDCORE*/
var K='geodash_v2',best=[0,0,0],att=[1,1,1];
try{var raw=localStorage.getItem(K);if(raw){var o0=JSON.parse(raw);if(o0&&o0.length===3)best=o0;}}catch(e){}
function save(){try{localStorage.setItem(K,JSON.stringify(best));}catch(e){}}
$('who').textContent='Pemain: '+C.nama;

/* ---------- AUDIO (synth orisinal, tanpa file) ---------- */
var AC=null,mg=null,nb=null,mOn=true,mt=null,mstep=0,mnext=0;
var SONG=[
 {r:[45,41,48,43],c:[[57,60,64],[53,57,60],[60,64,67],[55,59,62]]},
 {r:[38,34,41,36],c:[[62,65,69],[58,62,65],[65,69,72],[60,64,67]]},
 {r:[40,36,43,38],c:[[64,67,71],[60,64,67],[67,71,74],[62,66,69]]}
];
function F(n){return 440*Math.pow(2,(n-69)/12);}
function aInit(){
  if(AC){if(AC.state==='suspended')AC.resume();return;}
  try{var A=window.AudioContext||window.webkitAudioContext;AC=new A();
    nb=AC.createBuffer(1,AC.sampleRate*0.4,AC.sampleRate);var d=nb.getChannelData(0);for(var i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  }catch(e){AC=null;}
}
function tone(f,t,dur,type,vol,f2){
  if(!AC||!mg)return;
  var o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+dur);
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);o.connect(g);g.connect(mg);o.start(t);o.stop(t+dur+0.02);
}
function noise(t,dur,vol,hp){
  if(!AC||!mg||!nb)return;
  var s=AC.createBufferSource(),g=AC.createGain(),f=AC.createBiquadFilter();s.buffer=nb;f.type='highpass';f.frequency.value=hp;
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);s.connect(f);f.connect(g);g.connect(mg);s.start(t);s.stop(t+dur+0.02);
}
function sched(st,t){
  var S=SONG[li],bar=Math.floor(st/16)%4,q=st%16,ch=S.c[bar],root=S.r[bar],sd=60/LV[li].bpm/4;
  if(q%4===0){tone(150,t,0.12,'sine',0.5,45);}
  if(q===4||q===12)noise(t,0.12,0.18,1500);
  if(q%4===2)noise(t,0.04,0.09,7000);
  if(q%2===0)tone(F(root+(q%8===6?12:0)),t,sd*1.8,'sawtooth',0.16);
  tone(F(ch[[0,1,2,1][q%4]]+12),t,sd*0.9,'square',0.05);
  if(q%8===0)tone(F(ch[2]+24),t,sd*3,'triangle',0.08);
}
function mStart(){
  if(!mOn||!AC)return;mStop(true);
  mg=AC.createGain();mg.gain.value=0.45;mg.connect(AC.destination);
  mstep=0;mnext=AC.currentTime+0.06;
  mt=setInterval(function(){while(mnext<AC.currentTime+0.18){sched(mstep,mnext);mnext+=60/LV[li].bpm/4;mstep++;}},30);
}
function mStop(quick){
  if(mt){clearInterval(mt);mt=null;}
  if(mg&&AC){var g=mg;try{g.gain.cancelScheduledValues(AC.currentTime);g.gain.setTargetAtTime(0,AC.currentTime,quick?0.005:0.03);}catch(e){}setTimeout(function(){try{g.disconnect();}catch(e){}},300);mg=null;}
}
function sfx(k){
  if(!mOn||!AC)return;
  var t=AC.currentTime,tmp=mg;
  if(!mg){mg=AC.createGain();mg.gain.value=0.5;mg.connect(AC.destination);setTimeout(function(){try{mg.disconnect();}catch(e){}mg=null;},700);}
  if(k==='j')tone(520,t,0.09,'square',0.05,980);
  else if(k==='p')tone(300,t,0.22,'sine',0.12,1400);
  else if(k==='d'){noise(t,0.3,0.4,400);tone(180,t,0.3,'sawtooth',0.18,40);}
  else if(k==='w'){[523,659,784,1047].forEach(function(f,i){tone(f,t+i*0.1,0.25,'triangle',0.12);});}
}
$('mu').onclick=function(){mOn=!mOn;this.textContent=mOn?'🔊':'🔇';if(!mOn)mStop();else if(mode==='play'){aInit();mStart();}};

/* ---------- GAME ---------- */
var li=0,L=gen(0),s,mode='ready',held=false,parts=[],dtm=0,rot=0,acc=0,last=0,pct=0;
var MN={cube:'Cube',ship:'Pesawat',ball:'Bola',ufo:'UFO',wave:'Wave'},MC={cube:'#facc15',ship:'#ec4899',ball:'#f97316',ufo:'#ef4444',wave:'#a855f7'};
var PC={cube:'#22c55e',ship:'#ec4899',ball:'#f97316',ufo:'#ef4444',wave:'#a855f7',gf:'#38bdf8',gn:'#facc15'};
$('tabs').innerHTML=LV.map(function(d,i){return '<button class="chip'+(i?'':' on')+'" data-i="'+i+'">'+d.n+'</button>';}).join('');
$('tabs').onclick=function(e){var i=e.target.getAttribute('data-i');if(i===null)return;li=+i;var b=$('tabs').children;for(var k=0;k<b.length;k++)b[k].classList.toggle('on',k===li);L=gen(li);mStop(true);reset();mode='ready';hud();};
function reset(){s=newState();parts=[];rot=0;pct=0;}
function hud(){$('sp').textContent=pct+'%';$('pg').style.width=pct+'%';$('sa').textContent=att[li];$('sb').textContent=best[li]+'%';$('sm').textContent=MN[s.m]+(s.gd<0?' ↑':'');}
function die(){
  mode='dead';dtm=0.7;mStop(true);sfx('d');
  for(var i=0;i<18;i++){var a=Math.random()*6.28,f=60+Math.random()*190;parts.push({x:s.px+P/2,y:s.py+P/2,vx:Math.cos(a)*f,vy:Math.sin(a)*f-80,l:0.7,c:MC[s.m]});}
  if(pct>best[li]){best[li]=pct;save();}
  att[li]++;hud();
}
function press(){
  aInit();
  if(mode==='ready'){mode='play';acc=0;mStart();}
  else if(mode==='win'){reset();mode='play';acc=0;mStart();}
}
function down(e){if(e&&e.preventDefault)e.preventDefault();held=true;press();}
function up(){held=false;}
cv.addEventListener('pointerdown',down);$('jb').addEventListener('pointerdown',down);
['pointerup','pointercancel','pointerleave'].forEach(function(n){cv.addEventListener(n,up);$('jb').addEventListener(n,up);});
document.addEventListener('keydown',function(e){if(e.key===' '||e.key==='ArrowUp'||e.key==='w'){e.preventDefault();held=true;press();}});
document.addEventListener('keyup',function(e){if(e.key===' '||e.key==='ArrowUp'||e.key==='w')held=false;});

function frame(t){
  var dt=Math.min(0.05,(t-last)/1000||0);last=t;
  if(mode==='play'){
    acc+=dt;
    while(acc>=1/120&&mode==='play'){
      tick(s,L,held,1/120);acc-=1/120;
      if(s.ev)sfx(s.ev);
      if(s.dead){die();break;}
      if(s.win){mode='win';pct=100;best[li]=100;save();mStop();sfx('w');hud();break;}
    }
    if(mode==='play'){
      pct=Math.min(99,Math.floor(s.px/(L.end*T)*100));hud();
      if(s.m==='ball')rot+=(L.v/15)*dt*s.gd;else if(!s.gr)rot+=5.2*dt*s.gd;else rot=Math.round(rot/(Math.PI/2))*(Math.PI/2);
    }
  }else if(mode==='dead'){
    dtm-=dt;
    parts.forEach(function(p){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=900*dt;p.l-=dt;});
    if(dtm<=0){reset();mode='play';acc=0;mStart();hud();}
  }
  draw();requestAnimationFrame(frame);
}
function player(){
  var c=MC[s.m],m=s.m;
  cx.save();cx.translate(80+P/2,s.py+P/2);
  cx.fillStyle=c;cx.strokeStyle='#fff';cx.lineWidth=2;
  if(m==='cube'){cx.rotate(rot);cx.fillRect(-P/2,-P/2,P,P);cx.strokeRect(-P/2+1,-P/2+1,P-2,P-2);cx.fillStyle='#111';cx.fillRect(-8,-8,6,6);cx.fillRect(3,-8,6,6);cx.fillRect(-8,5,17,3);}
  else if(m==='ship'){cx.rotate(Math.atan2(s.vy,L.v)*0.7);cx.beginPath();cx.moveTo(-17,6);cx.lineTo(15,6);cx.lineTo(18,-1);cx.lineTo(8,-4);cx.lineTo(-12,-4);cx.closePath();cx.fill();cx.stroke();cx.fillStyle='#facc15';cx.fillRect(-4,-14,12,10);cx.strokeRect(-4,-14,12,10);}
  else if(m==='ball'){cx.rotate(rot);cx.beginPath();cx.arc(0,0,P/2-1,0,6.29);cx.fill();cx.stroke();cx.beginPath();cx.moveTo(-12,0);cx.lineTo(12,0);cx.moveTo(0,-12);cx.lineTo(0,12);cx.stroke();}
  else if(m==='ufo'){cx.beginPath();cx.ellipse(0,5,17,6,0,0,6.29);cx.fill();cx.stroke();cx.fillStyle='#7dd3fc';cx.beginPath();cx.arc(0,3,10,Math.PI,0);cx.fill();cx.stroke();}
  else{cx.rotate(Math.atan2(s.vy,L.v));cx.beginPath();cx.moveTo(-14,-9);cx.lineTo(15,0);cx.lineTo(-14,9);cx.closePath();cx.fill();cx.stroke();}
  cx.restore();
}
function draw(){
  var hu=LV[li].hue,sx=s.px-80,cy=(CE+G)/2;
  var g=cx.createLinearGradient(0,0,0,H);g.addColorStop(0,'hsl('+hu+',55%,22%)');g.addColorStop(1,'hsl('+hu+',60%,10%)');
  cx.fillStyle=g;cx.fillRect(0,0,W,H);
  cx.fillStyle='hsla('+hu+',70%,60%,.10)';
  var off=(sx*0.3)%70;for(var i=-1;i<7;i++)cx.fillRect(i*70-off,0,26,G);
  cx.fillStyle='hsl('+hu+',50%,14%)';cx.fillRect(0,G,W,H-G);
  cx.fillStyle='hsl('+hu+',80%,65%)';cx.fillRect(0,G,W,3);
  L.ceil.forEach(function(c){
    var a=Math.max(0,c[0]*T-sx),b=Math.min(W,c[1]*T-sx);if(b<=0||a>=W)return;
    cx.fillStyle='hsl('+hu+',50%,14%)';cx.fillRect(a,0,b-a,CE);cx.fillStyle='hsl('+hu+',80%,65%)';cx.fillRect(a,CE-3,b-a,3);
  });
  var fx=L.end*T-sx;if(fx<W+40){for(var r=0;r<6;r++){cx.fillStyle=r%2?'#fff':'#000';cx.fillRect(fx,r*(G/6),12,G/6);}}
  L.ob.forEach(function(o){
    var x=o.x*T-sx;if(x>W+10||x+o.w*T<-10)return;
    if(o.t==='o'){
      cx.strokeStyle=PC[o.k];cx.lineWidth=4;cx.shadowColor=PC[o.k];cx.shadowBlur=10;cx.beginPath();cx.ellipse(x+T/2,cy,9,(G-CE)/2,0,0,6.29);cx.stroke();
      cx.globalAlpha=.25;cx.fillStyle=PC[o.k];cx.fill();cx.globalAlpha=1;cx.shadowBlur=0;
    }else if(o.t==='b'){
      var h=o.h*T;cx.fillStyle='hsl('+hu+',70%,45%)';cx.fillRect(x,G-h,o.w*T,h);
      cx.strokeStyle='#fff';cx.lineWidth=2;cx.strokeRect(x+1,G-h+1,o.w*T-2,h-2);
      cx.fillStyle='hsla(0,0%,100%,.18)';for(var a=0;a<o.w;a++)for(var b=0;b<o.h;b++)cx.fillRect(x+a*T+7,G-(b+1)*T+7,16,16);
    }else if(o.t==='w'){
      var wh=o.h*T,wy=o.c?CE:G-wh;cx.fillStyle='hsl('+hu+',70%,40%)';cx.fillRect(x,wy,o.w*T,wh);cx.strokeStyle='#fff';cx.lineWidth=2;cx.strokeRect(x+1,wy+1,o.w*T-2,wh-2);
    }else{
      cx.fillStyle='#0a0a0a';cx.beginPath();
      if(o.c){cx.moveTo(x,CE);cx.lineTo(x+T/2,CE+T-2);cx.lineTo(x+T,CE);}else{cx.moveTo(x,G);cx.lineTo(x+T/2,G-T+2);cx.lineTo(x+T,G);}
      cx.closePath();cx.fill();cx.strokeStyle='#fff';cx.lineWidth=2;cx.stroke();
    }
  });
  if(mode!=='dead')player();
  else parts.forEach(function(p){if(p.l>0){cx.fillStyle=p.c;cx.fillRect(p.x-sx-4,p.y-4,8,8);}});
  cx.textAlign='center';cx.fillStyle='#fff';
  if(mode==='ready'){cx.font='800 18px sans-serif';cx.fillText('TAP UNTUK MULAI',W/2,70);cx.font='12px sans-serif';cx.fillText('Level: '+LV[li].n+' • Terbaik '+best[li]+'%',W/2,92);}
  if(mode==='win'){cx.fillStyle='#000a';cx.fillRect(0,0,W,H);cx.fillStyle='#fff';cx.font='800 22px sans-serif';cx.fillText('LEVEL SELESAI! 🎉',W/2,90);cx.font='13px sans-serif';cx.fillText('Percobaan: '+(att[li]-1)+' • Tap untuk main lagi',W/2,115);}
}
reset();hud();requestAnimationFrame(frame);
})();
</script>
`;

function buildGeoDashHtml({ playerName = "Kamu" } = {}) {
  return BODY.replace("__BASECSS__", () => BASE_CSS).replace("__CFG__", () => safeJson({ nama: String(playerName) }));
}

module.exports = { buildGeoDashHtml };
