/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Kartu HTML statis: CHISA ARCADE — satu kartu, banyak game (tab): Dino Runner, Tic Tac Toe, Doom, Flappy, Slot.
// Di chat tampil ringkas + tombol "Lihat perincian"; saat ditekan, kartu naik dari bawah (bottom sheet bawaan WhatsApp).
// Semua jalan di dalam kartu, tanpa fetch (sandbox WA memblokir jaringan). Skor terbaik disimpan di localStorage (bila ada).
const { BASE_CSS, safeJson } = require("../htmlcard");

const BODY = String.raw`
<style>
__BASECSS__
html,body{min-height:0}
.ar{background:#0b0d12;color:#fff;font-family:var(--sys);padding-bottom:10px;user-select:none;-webkit-user-select:none}
.tabs{display:flex;overflow-x:auto;scrollbar-width:none;border-bottom:1px solid #1f2430;background:#0e1118}
.tabs::-webkit-scrollbar{display:none}
.tab{flex:1 0 auto;padding:14px 16px 12px;font-size:15px;font-weight:600;color:#9aa3b5;text-align:center;white-space:nowrap;cursor:pointer;border-bottom:3px solid transparent}
.tab.on{color:#fff;border-bottom-color:#fff}
.card{margin:14px 12px 0;border:1px solid #2b303b;border-radius:18px;background:linear-gradient(180deg,#1b202b,#12151c);overflow:hidden}
.hd{display:flex;justify-content:space-between;align-items:center;padding:14px 18px;border-bottom:1px solid #2b303b}
.ey{font-size:11px;letter-spacing:2.5px;color:#9aa3b5}
.tt{font-size:22px;font-weight:800;margin-top:2px}
.sc{text-align:right}.sc b{display:block;font-size:24px;font-family:monospace;color:#dfe6ff;text-shadow:0 0 10px #6d7dff88}
.sc span{font-size:11px;color:#9aa3b5;letter-spacing:.5px}
.bd{padding:14px}
.ft{text-align:center;color:#9aa3b5;font-size:12px;padding:0 10px 14px}
.pn{display:none}.pn.on{display:block}
canvas{display:block;width:100%;border-radius:14px;border:1px solid #2b303b;touch-action:none;background:#151922}
.ttt{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;background:#0b0d12;border:1px solid #2b303b;border-radius:16px;padding:12px}
.ce{aspect-ratio:1;border-radius:14px;background:#14131a;border:1px solid #22242d;display:flex;align-items:center;justify-content:center;font-size:54px;font-weight:800;cursor:pointer}
.ce.x{color:#7dd3fc}.ce.o{color:#f87171}.ce.w{background:#1d2a1f;border-color:#22c55e}
.st{text-align:center;font-size:14px;font-weight:700;margin-bottom:10px;min-height:20px}
.pad{display:flex;justify-content:space-between;align-items:center;margin-top:10px;gap:8px}
.pb{width:54px;height:54px;border-radius:14px;border:1px solid #2b303b;background:#20242d;color:#fff;font-size:22px;font-weight:800;touch-action:none}
.pb.f{width:84px;background:#b91c1c;border-color:#ef4444}
.reels{display:flex;gap:10px;justify-content:center;margin:6px 0 14px}
.rl{width:30%;aspect-ratio:1;border-radius:16px;background:#0b0d12;border:2px solid #2b303b;display:flex;align-items:center;justify-content:center;font-size:52px}
.rl.w{border-color:#facc15;box-shadow:0 0 18px #facc1588}
.bt{width:100%;border:0;border-radius:14px;padding:14px;font-size:16px;font-weight:800;background:#22c55e;color:#04130a;cursor:pointer}
.bt:disabled{opacity:.5}
</style>
<div class="ar">
 <div class="tabs" id="tabs"></div>
 <div class="card">
  <div class="hd"><div><div class="ey" id="ey">CHISA AI ARCADE</div><div class="tt" id="tt">Dino Runner</div></div><div class="sc"><b id="sc">00000</b><span id="bs">BEST 00000</span></div></div>
  <div class="bd">
   <div class="pn" id="p0"><canvas id="c0" width="480" height="180"></canvas></div>
   <div class="pn" id="p1"><div class="st" id="ts"></div><div class="ttt" id="tg"></div></div>
   <div class="pn" id="p2"><canvas id="c2" width="320" height="200"></canvas>
    <div class="pad"><button class="pb" id="dl">◀</button><button class="pb" id="du">▲</button><button class="pb" id="dd">▼</button><button class="pb" id="dr">▶</button><button class="pb f" id="df">🔫 TEMBAK</button></div></div>
   <div class="pn" id="p3"><canvas id="c3" width="320" height="440" style="max-width:300px;margin:0 auto"></canvas></div>
   <div class="pn" id="p4"><div class="reels"><div class="rl" id="r0">🍒</div><div class="rl" id="r1">🍒</div><div class="rl" id="r2">🍒</div></div><div class="st" id="ss"></div><button class="bt" id="sb">PUTAR (10 koin)</button></div>
  </div>
  <div class="ft" id="ft"></div>
 </div>
</div>
<script>
(function(){
var CFG=__CFG__,$=function(i){return document.getElementById(i)};
var NAMES=['Dino Runner','Tic Tac Toe','Doom','Flappy','Slot'];
var FOOT=['Tap layar untuk lompat','YOU = X \u2022 CPU = O','Panah untuk gerak \u2022 TEMBAK untuk menembak demon','Tap layar untuk terbang, lewati pipa','Modal 100 koin \u2022 tiga sama = jackpot'];
var KEYS=['dino','ttt','doom','flappy','slot'];
function lsGet(k){try{return +localStorage.getItem('dio_arc_'+k)||0}catch(e){return 0}}
function lsSet(k,v){try{localStorage.setItem('dio_arc_'+k,v)}catch(e){}}
function pad5(n){n=String(Math.floor(n));while(n.length<5)n='0'+n;return n}
var cur=-1,raf=0,G=[];
function hud(s,b){$('sc').textContent=pad5(s);$('bs').textContent='BEST '+pad5(b)}
function rnd(a,b){return a+Math.random()*(b-a)}

/* ===== 0. DINO ===== */
(function(){
var cv=$('c0'),c=cv.getContext('2d'),W=480,H=180,GY=150,best=lsGet('dino');
var d,obs,score,sp,state,fr,gx,cl;
function reset(){d={y:GY-30,v:0,on:true};obs=[];score=0;sp=5.2;state=0;fr=0;gx=0;cl=[{x:120,y:40},{x:330,y:28},{x:440,y:55}];hud(0,best)}
function jump(){if(state===2){reset();return}if(state===0)state=1;if(d.on){d.v=-11.2;d.on=false}}
function spawn(){if(score>300&&Math.random()<.3)obs.push({x:W+10,y:GY-52-(Math.random()<.5?0:22),w:30,h:18,b:1});else{var n=Math.random()<.35?2:1,h=26+Math.floor(Math.random()*18);obs.push({x:W+10,y:GY-h,w:14*n+4,h:h,n:n})}}
function die(){state=2;var s=Math.floor(score);if(s>best){best=s;lsSet('dino',best)}hud(score,best)}
function step(){fr++;if(state!==1)return;score+=sp/10;sp=Math.min(11,sp+.0016);gx=(gx+sp)%40;
 d.v+=.62;d.y+=d.v;if(d.y>=GY-30){d.y=GY-30;d.v=0;d.on=true}
 if(!obs.length||obs[obs.length-1].x<W-(220+Math.random()*220+sp*14))spawn();
 for(var i=obs.length-1;i>=0;i--){var o=obs[i];o.x-=sp+(o.b?1.5:0);if(o.x<-60){obs.splice(i,1);continue}
  if(d.y+28>o.y+3&&d.y+4<o.y+o.h&&60>o.x&&32<o.x+o.w-4)die()}
 for(var k=0;k<cl.length;k++){cl[k].x-=.5;if(cl[k].x<-40)cl[k].x=W+20}
 hud(score,best)}
function draw(){c.fillStyle='#151922';c.fillRect(0,0,W,H);c.fillStyle='#262c3a';
 for(var k=0;k<cl.length;k++){var q=cl[k];c.fillRect(q.x,q.y,50,6);c.fillRect(q.x+10,q.y-5,28,5)}
 c.fillStyle='#3a4154';c.fillRect(0,GY,W,2);for(var x=-gx;x<W;x+=40)c.fillRect(x,GY+8,12,2);
 c.fillStyle='#e8ecf7';var i,o;
 for(i=0;i<obs.length;i++){o=obs[i];c.fillStyle='#e07a7a';
  if(o.b){var f=Math.floor(fr/8)%2;c.fillRect(o.x+6,o.y+6,18,8);c.fillRect(o.x+20,o.y+3,10,5);c.fillRect(o.x+(f?4:8),o.y+(f?-2:12),10,6)}
  else{for(var j=0;j<o.n;j++){var cx=o.x+j*14;c.fillRect(cx+4,o.y,8,o.h);c.fillRect(cx,o.y+8,5,10);c.fillRect(cx,o.y+14,10,4);c.fillRect(cx+11,o.y+4,5,12);c.fillRect(cx+6,o.y+12,10,4)}}}
 var dx=36,dy=d.y;c.fillStyle='#e8ecf7';c.fillRect(dx,dy+6,22,14);c.fillRect(dx+12,dy,16,12);c.fillRect(dx+26,dy+2,4,5);c.fillRect(dx-6,dy+8,8,6);c.fillRect(dx+4,dy+18,6,10);
 var lf=d.on&&state===1&&Math.floor(fr/5)%2;c.fillRect(dx+(lf?4:14),dy+20,6,10);c.fillStyle='#151922';c.fillRect(dx+22,dy+3,3,3);
 c.fillStyle='#e8ecf7';c.textAlign='center';
 if(state===0){c.font='bold 16px sans-serif';c.fillText('TAP UNTUK MULAI',W/2,70)}
 if(state===2){c.font='bold 26px sans-serif';c.fillText('GAME OVER',W/2,66);c.font='14px sans-serif';c.fillText('Tap layar untuk main lagi',W/2,92)}}
cv.addEventListener('pointerdown',function(e){e.preventDefault();jump()});
G[0]={anim:1,enter:function(){reset()},step:step,draw:draw,key:function(e){if(e.code==='Space'||e.key==='ArrowUp'){e.preventDefault();jump()}}};
})();

/* ===== 1. TIC TAC TOE ===== */
(function(){
var b,over,wins=0,best=lsGet('ttt'),cells=[],LN=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
var tg=$('tg'),ts=$('ts');
for(var i=0;i<9;i++){(function(i){var e=document.createElement('div');e.className='ce';e.onclick=function(){play(i)};tg.appendChild(e);cells.push(e)})(i)}
function win(bd){for(var i=0;i<8;i++){var l=LN[i];if(bd[l[0]]&&bd[l[0]]===bd[l[1]]&&bd[l[0]]===bd[l[2]])return l}return null}
function full(bd){for(var i=0;i<9;i++)if(!bd[i])return false;return true}
function mm(bd,p){var w=win(bd);if(w)return{s:bd[w[0]]==='O'?1:-1};if(full(bd))return{s:0};
 var bs=p==='O'?-2:2,bm=-1;for(var i=0;i<9;i++)if(!bd[i]){bd[i]=p;var r=mm(bd,p==='O'?'X':'O').s;bd[i]='';if(p==='O'?r>bs:r<bs){bs=r;bm=i}}return{s:bs,m:bm}}
function render(){var w=win(b);for(var i=0;i<9;i++){cells[i].textContent=b[i]||'';cells[i].className='ce'+(b[i]?' '+b[i].toLowerCase():'')+(w&&w.indexOf(i)>-1?' w':'')}}
function reset(){b=['','','','','','','','',''];over=false;ts.textContent='Giliranmu (X)';render();hud(wins,best)}
function end(){var w=win(b);over=true;if(w&&b[w[0]]==='X'){wins++;if(wins>best){best=wins;lsSet('ttt',best)}ts.textContent='Kamu menang! \uD83C\uDF89 Tap untuk lanjut'}else if(w)ts.textContent='CPU menang \uD83D\uDE08 Tap untuk lanjut';else ts.textContent='Seri. Tap untuk lanjut';render();hud(wins,best)}
function play(i){if(over){reset();return}if(b[i])return;b[i]='X';if(win(b)||full(b)){end();return}
 var m;if(Math.random()<.25){var f=[];for(var k=0;k<9;k++)if(!b[k])f.push(k);m=f[Math.floor(Math.random()*f.length)]}else m=mm(b,'O').m;
 b[m]='O';if(win(b)||full(b)){end();return}render();ts.textContent='Giliranmu (X)'}
G[1]={enter:function(){reset()}};
})();

/* ===== 2. DOOM (raycaster mini) ===== */
(function(){
var cv=$('c2'),c=cv.getContext('2d'),W=320,H=200,N=160,CW=W/N,best=lsGet('doom');
var MAP=['1111111111111111','1000000000000001','1011101111011101','1000001000000001','1110001000111001','1000000000000001','1011110110111101','1000000000000001','1000111011100001','1011000000001101','1000001111000001','1110000000000111','1000011011010001','1011000000000101','1000000000000001','1111111111111111'];
var px,py,dx,dy,pl=.66,hp,kills,en,zb=[],keys={},flash=0,over,hurt;
function wall(x,y){var r=MAP[Math.floor(y)];return !r||r.charAt(Math.floor(x))!=='0'}
function spawn(){for(var t=0;t<60;t++){var x=1+Math.floor(Math.random()*14)+.5,y=1+Math.floor(Math.random()*14)+.5;if(!wall(x,y)&&Math.hypot(x-px,y-py)>6){en.push({x:x,y:y,hp:2,hit:0});return}}}
function reset(){px=1.5;py=1.5;dx=Math.cos(.6);dy=Math.sin(.6);hp=100;kills=0;en=[];over=false;hurt=0;flash=0;for(var i=0;i<4;i++)spawn();hud(0,best)}
function rot(a){var ox=dx;dx=dx*Math.cos(a)-dy*Math.sin(a);dy=ox*Math.sin(a)+dy*Math.cos(a)}
function tf(e){var sx=e.x-px,sy=e.y-py,ex=-dy*pl,ey=dx*pl,inv=1/(ex*dy-dx*ey);return{tx:inv*(dy*sx-dx*sy),ty:inv*(-ey*sx+ex*sy)}}
function shoot(){if(over){reset();return}flash=5;var bi=-1,bd=99;
 for(var i=0;i<en.length;i++){var t=tf(en[i]);if(t.ty>.2&&Math.abs(t.tx/t.ty)<.16&&zb[N>>1]>t.ty&&t.ty<bd){bd=t.ty;bi=i}}
 if(bi>-1){en[bi].hp--;en[bi].hit=4;if(en[bi].hp<=0){en.splice(bi,1);kills++;if(kills>best){best=kills;lsSet('doom',best)}spawn();hud(kills,best)}}}
function step(){if(over)return;
 if(keys.l)rot(-.045);if(keys.r)rot(.045);
 var mx=0,my=0,sp=.06;if(keys.u){mx=dx*sp;my=dy*sp}if(keys.d){mx=-dx*sp;my=-dy*sp}
 if(!wall(px+mx*4,py))px+=mx;if(!wall(px,py+my*4))py+=my;
 for(var i=0;i<en.length;i++){var e=en[i],ex=px-e.x,ey=py-e.y,dist=Math.hypot(ex,ey);
  if(dist>.7){var s=.012+kills*.0004,nx=e.x+ex/dist*s,ny=e.y+ey/dist*s;if(!wall(nx,e.y))e.x=nx;if(!wall(e.x,ny))e.y=ny}
  else{hp-=.5;hurt=6}}
 if(hp<=0){hp=0;over=true}
 if(flash>0)flash--;if(hurt>0)hurt--}
function draw(){
 var g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,'#1a1020');g.addColorStop(.5,'#2a1a1a');g.addColorStop(.5,'#2b2b30');g.addColorStop(1,'#0e0e12');c.fillStyle=g;c.fillRect(0,0,W,H);
 for(var x=0;x<N;x++){var cx=2*x/N-1,rx=dx+(-dy*pl)*cx,ry=dy+(dx*pl)*cx;
  var mx=Math.floor(px),my=Math.floor(py),ddx=Math.abs(1/(rx||1e-9)),ddy=Math.abs(1/(ry||1e-9)),sx,sy,sdx,sdy,side=0,hit=0,n=0;
  if(rx<0){sx=-1;sdx=(px-mx)*ddx}else{sx=1;sdx=(mx+1-px)*ddx}
  if(ry<0){sy=-1;sdy=(py-my)*ddy}else{sy=1;sdy=(my+1-py)*ddy}
  while(!hit&&n++<40){if(sdx<sdy){sdx+=ddx;mx+=sx;side=0}else{sdy+=ddy;my+=sy;side=1}if(MAP[my].charAt(mx)!=='0')hit=1}
  var pd=side===0?sdx-ddx:sdy-ddy;if(pd<.05)pd=.05;zb[x]=pd;
  var lh=H/pd,sh=Math.max(.15,1-pd/10)*(side?.65:1);
  c.fillStyle='rgb('+Math.floor(150*sh)+','+Math.floor(60*sh)+','+Math.floor(50*sh)+')';c.fillRect(x*CW,(H-lh)/2,CW+.5,lh)}
 var arr=en.slice().sort(function(a,b){return Math.hypot(b.x-px,b.y-py)-Math.hypot(a.x-px,a.y-py)});
 for(var i=0;i<arr.length;i++){var e=arr[i],t=tf(e),tx=t.tx,ty=t.ty;
  if(ty<=.2)continue;var scx=(W/2)*(1+tx/ty),sz=H/ty,top=(H-sz)/2+sz*.05,l=scx-sz/2;
  var fd=Math.max(.35,1-ty/9),hc=e.hit>0?'#fff':'rgb('+Math.floor(239*fd)+','+Math.floor(68*fd)+','+Math.floor(68*fd)+')',bc='rgb('+Math.floor(150*fd)+','+Math.floor(20*fd)+','+Math.floor(20*fd)+')';if(e.hit>0)e.hit--;
  for(var col=Math.max(0,Math.floor(l/CW));col<=Math.min(N-1,Math.floor((l+sz)/CW));col++){if(zb[col]<ty)continue;var u=(col*CW-l)/sz;
   if(u>.18&&u<.82){c.fillStyle=bc;c.fillRect(col*CW,top+sz*.3,CW+.5,sz*.65)}
   if(u>.3&&u<.7){c.fillStyle=hc;c.fillRect(col*CW,top,CW+.5,sz*.32)}
   if((u>.37&&u<.46)||(u>.54&&u<.63)){c.fillStyle='#facc15';c.fillRect(col*CW,top+sz*.1,CW+.5,sz*.06)}}}
 if(flash>0){c.fillStyle='rgba(255,220,120,.3)';c.fillRect(0,0,W,H);c.fillStyle='#facc15';c.fillRect(W/2-6,H-62,12,26)}
 c.fillStyle='#3b3b44';c.fillRect(W/2-14,H-38,28,38);c.fillStyle='#55555f';c.fillRect(W/2-8,H-46,16,14);
 c.fillStyle='rgba(255,255,255,.7)';c.fillRect(W/2-1,H/2-6,2,12);c.fillRect(W/2-6,H/2-1,12,2);
 if(hurt>0){c.fillStyle='rgba(220,0,0,.3)';c.fillRect(0,0,W,H)}
 c.fillStyle='#0009';c.fillRect(6,6,104,14);c.fillStyle=hp>40?'#22c55e':'#ef4444';c.fillRect(8,8,Math.max(0,hp),10);
 if(over){c.fillStyle='rgba(0,0,0,.6)';c.fillRect(0,0,W,H);c.fillStyle='#ef4444';c.textAlign='center';c.font='bold 28px sans-serif';c.fillText('KAMU MATI',W/2,H/2-6);c.fillStyle='#fff';c.font='14px sans-serif';c.fillText('Kill: '+kills+' \u2022 tekan TEMBAK untuk ulang',W/2,H/2+20)}}
function bind(id,k){var el=$(id),on=function(e){e.preventDefault();keys[k]=1},off=function(e){e.preventDefault();keys[k]=0};
 el.addEventListener('pointerdown',on);el.addEventListener('pointerup',off);el.addEventListener('pointerleave',off);el.addEventListener('pointercancel',off)}
bind('dl','l');bind('dr','r');bind('du','u');bind('dd','d');
$('df').addEventListener('pointerdown',function(e){e.preventDefault();shoot()});
cv.addEventListener('pointerdown',function(e){e.preventDefault();shoot()});
var KM={ArrowLeft:'l',ArrowRight:'r',ArrowUp:'u',ArrowDown:'d',a:'l',d:'r',w:'u',s:'d'};
G[2]={anim:1,enter:function(){reset();keys={}},step:step,draw:draw,
 key:function(e){var k=KM[e.key];if(k)keys[k]=e.type==='keydown'?1:0;if(e.type==='keydown'&&e.code==='Space'){e.preventDefault();shoot()}}};
})();

/* ===== 3. FLAPPY ===== */
(function(){
var cv=$('c3'),c=cv.getContext('2d'),W=320,H=440,GR=.42,J=-6.6,GAP=118,SP=2.3,best=lsGet('flappy');
var b,pipes,score,state,t,gx;
function reset(){b={x:80,y:200,v:0};pipes=[];score=0;state=0;t=0;gx=0;hud(0,best)}
function flap(){if(state===2){reset();return}if(state===0)state=1;b.v=J}
function die(){if(state!==1)return;state=2;if(score>best){best=score;lsSet('flappy',best)}hud(score,best)}
function step(){if(state===1){t++;b.v+=GR;b.y+=b.v;if(t%88===1)pipes.push({x:W+10,t:50+Math.random()*(H-GAP-140),p:false});
  for(var i=0;i<pipes.length;i++){var p=pipes[i];p.x-=SP;if(!p.p&&p.x+46<b.x){p.p=true;score++;hud(score,best)}
   if(b.x+11>p.x&&b.x-11<p.x+46&&(b.y-11<p.t||b.y+11>p.t+GAP))die()}
  if(pipes.length&&pipes[0].x<-60)pipes.shift();if(b.y>H-40||b.y<-10)die();gx=(gx+SP)%24}
 else if(state===0)b.y=200+Math.sin(Date.now()/250)*8}
function draw(){var g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,'#4ec0ca');g.addColorStop(1,'#a8e6ef');c.fillStyle=g;c.fillRect(0,0,W,H);
 for(var i=0;i<pipes.length;i++){var p=pipes[i];c.fillStyle='#4caf50';c.fillRect(p.x,0,46,p.t);c.fillRect(p.x,p.t+GAP,46,H);c.fillStyle='#2e7d32';c.fillRect(p.x-3,p.t-18,52,18);c.fillRect(p.x-3,p.t+GAP,52,18)}
 c.fillStyle='#d9c27a';c.fillRect(0,H-40,W,40);c.fillStyle='#7cb342';c.fillRect(0,H-40,W,8);c.fillStyle='#b89f55';for(var x=-gx;x<W;x+=24)c.fillRect(x,H-22,12,4);
 c.save();c.translate(b.x,b.y);c.rotate(Math.max(-.5,Math.min(1.1,b.v/10)));
 c.fillStyle='#ffd23f';c.beginPath();c.arc(0,0,12,0,7);c.fill();c.fillStyle='#fff';c.beginPath();c.arc(5,-4,4.5,0,7);c.fill();c.fillStyle='#000';c.beginPath();c.arc(6.5,-4,2,0,7);c.fill();
 c.fillStyle='#ff7043';c.beginPath();c.moveTo(10,2);c.lineTo(20,5);c.lineTo(10,9);c.fill();c.restore();
 c.textAlign='center';c.fillStyle='#fff';c.strokeStyle='#0008';c.lineWidth=4;c.font='bold 38px sans-serif';
 if(state>0){c.strokeText(score,W/2,70);c.fillText(score,W/2,70)}
 if(state===0){c.font='bold 18px sans-serif';c.strokeText('TAP UNTUK MULAI',W/2,H/2+60);c.fillText('TAP UNTUK MULAI',W/2,H/2+60)}
 if(state===2){c.fillStyle='#000a';c.fillRect(40,150,240,120);c.fillStyle='#fff';c.font='bold 26px sans-serif';c.fillText('GAME OVER',W/2,195);c.font='16px sans-serif';c.fillText('Skor '+score+' \u2022 Terbaik '+best,W/2,225);c.fillText('Tap untuk main lagi',W/2,250)}}
cv.addEventListener('pointerdown',function(e){e.preventDefault();flap()});
G[3]={anim:1,enter:function(){reset()},step:step,draw:draw,key:function(e){if(e.code==='Space'||e.key==='ArrowUp'){e.preventDefault();flap()}}};
})();

/* ===== 4. SLOT ===== */
(function(){
var SY=['\uD83C\uDF47','\uD83C\uDF52','\uD83C\uDF4B','\uD83D\uDC8E','7\uFE0F\u20E3','\uD83D\uDD14'],coins=100,best=Math.max(100,lsGet('slot')),busy=false;
var sb=$('sb'),ss=$('ss'),rs=[$('r0'),$('r1'),$('r2')];
function show(){hud(coins,best);sb.textContent=coins>=10?'PUTAR (10 koin)':'KOIN HABIS \u2022 TAP UNTUK ISI ULANG'}
function spin(){if(busy)return;if(coins<10){coins=100;ss.textContent='Koin diisi ulang';show();return}
 busy=true;sb.disabled=true;coins-=10;show();ss.textContent='Berputar...';for(var i=0;i<3;i++)rs[i].className='rl';
 var res=[0,0,0].map(function(){return Math.floor(Math.random()*SY.length)}),stop=[0,0,0],tk=0;
 var iv=setInterval(function(){tk++;for(var i=0;i<3;i++){if(tk>=10+i*8){if(!stop[i]){stop[i]=1;rs[i].textContent=SY[res[i]]}}else rs[i].textContent=SY[Math.floor(Math.random()*SY.length)]}
  if(tk>=26){clearInterval(iv);var s={};res.forEach(function(r){s[r]=(s[r]||0)+1});var mx=Math.max(s[res[0]],s[res[1]],s[res[2]]),win=0;
   if(mx===3)win=res[0]===4?200:100;else if(mx===2)win=20;
   coins+=win;if(coins>best){best=coins;lsSet('slot',best)}
   if(win){for(var j=0;j<3;j++)rs[j].className='rl w';ss.textContent=mx===3?'JACKPOT! +'+win+' koin \uD83C\uDF89':'Dua sama +'+win+' koin'}else ss.textContent='Belum beruntung, putar lagi';
   busy=false;sb.disabled=false;show()}},70)}
sb.onclick=spin;
G[4]={enter:function(){ss.textContent='Tekan PUTAR';show()}};
})();

/* ===== TAB & LOOP ===== */
function loop(){var g=G[cur];if(g.step)g.step();g.draw();raf=requestAnimationFrame(loop)}
function go(i){cancelAnimationFrame(raf);cur=i;
 for(var k=0;k<5;k++){$('p'+k).className='pn'+(k===i?' on':'');$('tabs').children[k].className='tab'+(k===i?' on':'')}
 $('tt').textContent=NAMES[i];$('ft').textContent=FOOT[i];G[i].enter();if(G[i].anim)loop()}
for(var i=0;i<5;i++){(function(i){var t=document.createElement('div');t.className='tab';t.textContent=NAMES[i];t.onclick=function(){if(cur!==i)go(i)};$('tabs').appendChild(t)})(i)}
var kh=function(e){var g=G[cur];if(g&&g.key)g.key(e)};document.addEventListener('keydown',kh);document.addEventListener('keyup',kh);
go(0);
})();
</script>
`;

function buildArcadeHtml({ playerName = "Kamu" } = {}) {
  return BODY.replace("__BASECSS__", () => BASE_CSS).replace("__CFG__", () => safeJson({ nama: String(playerName) }));
}

module.exports = { buildArcadeHtml };
