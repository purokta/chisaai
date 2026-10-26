/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Kartu HTML statis: BREAKOUT LIVE — Breakout: pecahkan bata, 3 nyawa, level makin sulit
const { BASE_CSS, safeJson } = require("../htmlcard");

const BODY = String.raw`
<style>
__BASECSS__
.cv{display:block;width:100%;background:#0b0f1f;border-radius:12px;border:1px solid var(--line);touch-action:none}
.bar{display:flex;justify-content:space-between;margin:8px 0;gap:6px}
.pill{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:5px 12px;font-size:12px;font-weight:800}.pill b{color:var(--acc)}
</style>
<div class="stage"><div class="app">
 <div class="top"><div class="logo">🧱</div><div class="meta"><div class="title">Breakout Live</div><div class="sub" id="who"></div></div></div>
 <canvas id="cv" class="cv" width="320" height="440"></canvas>
 <div class="bar"><span class="pill">Skor <b id="sc">0</b></span><span class="pill">Nyawa <b id="lf">3</b></span><span class="pill">Level <b id="lv">1</b></span><span class="pill">Rekor <b id="bs">0</b></span></div>
 <button class="btn alt" id="rs" style="width:100%">⟳ Ulang</button>
 <div class="muted" style="text-align:center;margin-top:6px">Geser jari / mouse untuk menggerakkan papan. Tap untuk meluncurkan bola.</div>
</div></div>
<script>
(function(){
var CFG=__CFG__;document.getElementById('who').textContent='Pemain: '+CFG.nama;
var $=function(i){return document.getElementById(i)};
var cv=$('cv'),c=cv.getContext('2d'),W=320,H=440,PW=64,PH=10;
var best=0;try{best=+localStorage.getItem('pix_breakout')||0;}catch(e){}
var px,ball,bricks,score,lives,lvl,state,keys={};
var COLS=['#ef4444','#f97316','#eab308','#22c55e','#06b6d4','#a78bfa'];
function build(){bricks=[];var rows=Math.min(8,4+lvl);for(var r=0;r<rows;r++)for(var i=0;i<8;i++)bricks.push({x:8+i*38,y:50+r*20,w:34,h:14,c:COLS[r%6],hp:r<2&&lvl>2?2:1});}
function serve(){ball={x:px+PW/2,y:H-50,vx:0,vy:0,r:6};state=0;}
function reset(){px=W/2-PW/2;score=0;lives=3;lvl=1;build();serve();ui();}
function ui(){$('sc').textContent=score;$('lf').textContent=lives;$('lv').textContent=lvl;$('bs').textContent=best;}
function launch(){if(state===0){var s=4.2+lvl*0.35,a=(Math.random()*0.8-0.4);ball.vx=s*Math.sin(a);ball.vy=-s*Math.cos(a);state=1;}else if(state===2){reset();}else if(state===3){lvl++;build();serve();ui();}}
function move(clientX){var r=cv.getBoundingClientRect();px=Math.max(0,Math.min(W-PW,(clientX-r.left)*W/r.width-PW/2));if(state===0)ball.x=px+PW/2;}
function over(){state=2;if(score>best){best=score;try{localStorage.setItem('pix_breakout',best);}catch(e){}}ui();}
function step(){
 if(state===1){ball.x+=ball.vx;ball.y+=ball.vy;
  if(ball.x<ball.r){ball.x=ball.r;ball.vx*=-1;}if(ball.x>W-ball.r){ball.x=W-ball.r;ball.vx*=-1;}if(ball.y<ball.r){ball.y=ball.r;ball.vy*=-1;}
  if(ball.vy>0&&ball.y+ball.r>=H-28&&ball.y+ball.r<=H-28+PH+6&&ball.x>px-4&&ball.x<px+PW+4){var rel=(ball.x-(px+PW/2))/(PW/2),sp=Math.min(9,Math.hypot(ball.vx,ball.vy)*1.01);var an=rel*1.05;ball.vx=sp*Math.sin(an);ball.vy=-sp*Math.cos(an);ball.y=H-28-ball.r;}
  for(var i=bricks.length-1;i>=0;i--){var b=bricks[i];
   if(ball.x+ball.r>b.x&&ball.x-ball.r<b.x+b.w&&ball.y+ball.r>b.y&&ball.y-ball.r<b.y+b.h){
    var ox=Math.min(ball.x+ball.r-b.x,b.x+b.w-(ball.x-ball.r)),oy=Math.min(ball.y+ball.r-b.y,b.y+b.h-(ball.y-ball.r));
    if(ox<oy)ball.vx*=-1;else ball.vy*=-1;b.hp--;score+=10*lvl;if(b.hp<=0)bricks.splice(i,1);ui();break;}}
  if(!bricks.length)state=3;
  if(ball.y>H+10){lives--;ui();if(lives<=0)over();else serve();}}
 draw();requestAnimationFrame(step);}
function draw(){
 c.fillStyle='#0b0f1f';c.fillRect(0,0,W,H);
 bricks.forEach(function(b){c.fillStyle=b.c;c.globalAlpha=b.hp>1?1:.85;c.fillRect(b.x,b.y,b.w,b.h);c.globalAlpha=1;c.fillStyle='rgba(255,255,255,.25)';c.fillRect(b.x,b.y,b.w,3);if(b.hp>1){c.strokeStyle='#fff';c.strokeRect(b.x+1,b.y+1,b.w-2,b.h-2);}});
 c.fillStyle='#e5e7eb';c.beginPath();c.roundRect?c.roundRect(px,H-28,PW,PH,5):c.rect(px,H-28,PW,PH);c.fill();
 c.fillStyle='#fde047';c.beginPath();c.arc(ball.x,ball.y,ball.r,0,7);c.fill();
 c.textAlign='center';c.fillStyle='#fff';c.font='bold 16px sans-serif';
 if(state===0)c.fillText('TAP UNTUK MELUNCURKAN',W/2,H/2+40);
 if(state===2){c.fillStyle='#000b';c.fillRect(30,160,260,110);c.fillStyle='#fff';c.font='bold 26px sans-serif';c.fillText('GAME OVER',W/2,205);c.font='15px sans-serif';c.fillText('Skor '+score+' • tap untuk ulang',W/2,238);}
 if(state===3){c.fillStyle='#000b';c.fillRect(30,160,260,110);c.fillStyle='#4ade80';c.font='bold 24px sans-serif';c.fillText('LEVEL '+lvl+' SELESAI',W/2,205);c.fillStyle='#fff';c.font='15px sans-serif';c.fillText('Tap untuk lanjut',W/2,238);}
}
cv.addEventListener('pointermove',function(e){move(e.clientX);});
cv.addEventListener('pointerdown',function(e){e.preventDefault();move(e.clientX);launch();});
$('rs').onclick=reset;
document.addEventListener('keydown',function(e){if(e.key==='ArrowLeft'){px=Math.max(0,px-22);if(state===0)ball.x=px+PW/2;}else if(e.key==='ArrowRight'){px=Math.min(W-PW,px+22);if(state===0)ball.x=px+PW/2;}else if(e.key===' '){e.preventDefault();launch();}});
reset();step();
})();
</script>
`;

function buildBreakoutHtml({ playerName = "Kamu" } = {}) {
  return BODY.replace("__BASECSS__", () => BASE_CSS).replace("__CFG__", () => safeJson({ nama: String(playerName) }));
}

module.exports = { buildBreakoutHtml };
