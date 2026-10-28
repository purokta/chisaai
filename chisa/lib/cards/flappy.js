/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Kartu HTML statis: FLAPPY LIVE (Game Flappy Bird: tap untuk lompat, hindari pipa, skor terbaik tersimpan)
// Semua jalan di dalam kartu, tanpa fetch. By PIX.
const { BASE_CSS, safeJson } = require("../htmlcard");

const BODY = String.raw`
<style>
__BASECSS__
.cv{display:block;width:100%;border-radius:12px;border:1px solid var(--line);background:#70c5ce;touch-action:none;cursor:pointer}
.bar{display:flex;justify-content:space-between;align-items:center;margin:8px 0}
.pill{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:5px 12px;font-size:12px;font-weight:800}
.pill b{color:var(--acc)}
</style>
<div class="stage"><div class="app">
 <div class="top"><div class="logo">🐤</div><div class="meta"><div class="title">Flappy Live</div><div class="sub" id="who"></div></div></div>
 <canvas id="cv" class="cv" width="320" height="440"></canvas>
 <div class="bar"><span class="pill">Skor <b id="sc">0</b></span><span class="pill">Terbaik <b id="bs">0</b></span><button class="btn alt" id="rs">⟳ Ulang</button></div>
 <div class="muted" style="text-align:center">Tap layar / spasi untuk lompat. Lewati pipa sebanyak mungkin!</div>
</div></div>
<script>
(function(){
var CFG=__CFG__;document.getElementById('who').textContent='Pemain: '+CFG.nama;
var cv=document.getElementById('cv'),c=cv.getContext('2d'),W=320,H=440,G=0.42,J=-6.6,GAP=118,SP=2.3;
var best=0;try{best=+localStorage.getItem('pix_flappy')||0;}catch(e){}
var b,pipes,score,state,t,gx;
function reset(){b={x:80,y:200,v:0};pipes=[];score=0;state=0;t=0;gx=0;document.getElementById('sc').textContent=0;document.getElementById('bs').textContent=best;}
function flap(){if(state===2){reset();return;}if(state===0)state=1;b.v=J;}
function add(){var top=50+Math.random()*(H-GAP-140);pipes.push({x:W+10,t:top,p:false});}
function loop(){
 if(state===1){t++;b.v+=G;b.y+=b.v;if(t%88===1)add();
  for(var i=0;i<pipes.length;i++){var p=pipes[i];p.x-=SP;
   if(!p.p&&p.x+46<b.x){p.p=true;score++;document.getElementById('sc').textContent=score;}
   if(b.x+11>p.x&&b.x-11<p.x+46&&(b.y-11<p.t||b.y+11>p.t+GAP))die();}
  if(pipes.length&&pipes[0].x<-60)pipes.shift();
  if(b.y>H-40||b.y<-10)die();gx=(gx+SP)%24;}
 else if(state===0){b.y=200+Math.sin(Date.now()/250)*8;}
 draw();requestAnimationFrame(loop);}
function die(){if(state!==1)return;state=2;if(score>best){best=score;try{localStorage.setItem('pix_flappy',best);}catch(e){}}document.getElementById('bs').textContent=best;}
function draw(){
 var g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,'#4ec0ca');g.addColorStop(1,'#a8e6ef');c.fillStyle=g;c.fillRect(0,0,W,H);
 for(var i=0;i<pipes.length;i++){var p=pipes[i];c.fillStyle='#4caf50';c.fillRect(p.x,0,46,p.t);c.fillRect(p.x,p.t+GAP,46,H);c.fillStyle='#2e7d32';c.fillRect(p.x-3,p.t-18,52,18);c.fillRect(p.x-3,p.t+GAP,52,18);}
 c.fillStyle='#d9c27a';c.fillRect(0,H-40,W,40);c.fillStyle='#7cb342';c.fillRect(0,H-40,W,8);
 c.fillStyle='#b89f55';for(var x=-gx;x<W;x+=24)c.fillRect(x,H-22,12,4);
 c.save();c.translate(b.x,b.y);c.rotate(Math.max(-0.5,Math.min(1.1,b.v/10)));
 c.fillStyle='#ffd23f';c.beginPath();c.arc(0,0,12,0,7);c.fill();c.fillStyle='#fff';c.beginPath();c.arc(5,-4,4.5,0,7);c.fill();c.fillStyle='#000';c.beginPath();c.arc(6.5,-4,2,0,7);c.fill();
 c.fillStyle='#ff7043';c.beginPath();c.moveTo(10,2);c.lineTo(20,5);c.lineTo(10,9);c.fill();c.fillStyle='#f5b800';c.beginPath();c.ellipse(-4,3,6,4,0,0,7);c.fill();c.restore();
 c.textAlign='center';c.fillStyle='#fff';c.strokeStyle='#0008';c.lineWidth=4;c.font='bold 38px sans-serif';
 if(state>0){c.strokeText(score,W/2,70);c.fillText(score,W/2,70);}
 if(state===0){c.font='bold 18px sans-serif';c.strokeText('TAP UNTUK MULAI',W/2,H/2+60);c.fillText('TAP UNTUK MULAI',W/2,H/2+60);}
 if(state===2){c.fillStyle='#000a';c.fillRect(40,150,240,130);c.fillStyle='#fff';c.font='bold 26px sans-serif';c.fillText('GAME OVER',W/2,195);c.font='16px sans-serif';c.fillText('Skor '+score+'  •  Terbaik '+best,W/2,225);c.fillText(score>=20?'🏆 Emas':score>=10?'🥈 Perak':score>=5?'🥉 Perunggu':'Coba lagi!',W/2,253);}
}
cv.addEventListener('pointerdown',function(e){e.preventDefault();flap();});
document.addEventListener('keydown',function(e){if(e.code==='Space'||e.key==='ArrowUp'){e.preventDefault();flap();}});
document.getElementById('rs').onclick=reset;
reset();loop();
})();
</script>
`;

function buildFlappyHtml({ playerName = "Kamu" } = {}) {
  return BODY.replace("__BASECSS__", () => BASE_CSS).replace("__CFG__", () => safeJson({ nama: String(playerName) }));
}

module.exports = { buildFlappyHtml };
