/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Kartu HTML statis: DINO RUN LIVE — Dino Run: lompati kaktus dan burung, makin lama makin cepat
const { BASE_CSS, safeJson } = require("../htmlcard");

const BODY = String.raw`
<style>
__BASECSS__
.cv{display:block;width:100%;background:#f7f7f7;border-radius:12px;border:1px solid var(--line);touch-action:none;cursor:pointer}
.bar{display:flex;justify-content:space-between;margin:8px 0}
.pill{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:5px 12px;font-size:12px;font-weight:800}.pill b{color:var(--acc)}
</style>
<div class="stage"><div class="app">
 <div class="top"><div class="logo">🦖</div><div class="meta"><div class="title">Dino Run Live</div><div class="sub" id="who"></div></div></div>
 <canvas id="cv" class="cv" width="480" height="180"></canvas>
 <div class="bar"><span class="pill">Skor <b id="sc">0</b></span><span class="pill">Rekor <b id="bs">0</b></span><button class="btn alt" id="rs">⟳ Ulang</button></div>
 <div class="muted" style="text-align:center">Tap layar / spasi untuk lompat. Hindari kaktus dan burung!</div>
</div></div>
<script>
(function(){
var CFG=__CFG__;document.getElementById('who').textContent='Pemain: '+CFG.nama;
var $=function(i){return document.getElementById(i)};
var cv=$('cv'),c=cv.getContext('2d'),W=480,H=180,GY=150;
var best=0;try{best=+localStorage.getItem('pix_dino')||0;}catch(e){}
var d,obs,score,sp,state,fr,cl,gx;
function reset(){d={y:GY-30,v:0,on:true};obs=[];score=0;sp=5.2;state=0;fr=0;gx=0;cl=[{x:120,y:40},{x:330,y:28},{x:440,y:55}];$('sc').textContent=0;$('bs').textContent=best;}
function jump(){if(state===2){reset();return;}if(state===0)state=1;if(d.on){d.v=-11.2;d.on=false;}}
function spawn(){var bird=score>300&&Math.random()<0.3;
 if(bird)obs.push({x:W+10,y:GY-52-(Math.random()<.5?0:22),w:30,h:18,b:1});
 else{var n=Math.random()<.35?2:1,h=26+Math.floor(Math.random()*18);obs.push({x:W+10,y:GY-h,w:14*n+4,h:h,n:n});}}
function step(){
 fr++;
 if(state===1){score+=sp/10;sp=Math.min(11,sp+0.0016);gx=(gx+sp)%40;
  d.v+=0.62;d.y+=d.v;if(d.y>=GY-30){d.y=GY-30;d.v=0;d.on=true;}
  if(!obs.length||obs[obs.length-1].x<W-(220+Math.random()*220+sp*14))spawn();
  for(var i=obs.length-1;i>=0;i--){var o=obs[i];o.x-=sp+(o.b?1.5:0);if(o.x<-60){obs.splice(i,1);continue;}
   if(d.y+28>o.y+3&&d.y+4<o.y+o.h&&60>o.x&&32<o.x+o.w-4&&o.x<60-4)die();}
  for(var k=0;k<cl.length;k++){cl[k].x-=0.5;if(cl[k].x<-40)cl[k].x=W+20;}
  $('sc').textContent=Math.floor(score);}
 draw();requestAnimationFrame(step);}
function die(){state=2;var s=Math.floor(score);if(s>best){best=s;try{localStorage.setItem('pix_dino',best);}catch(e){}}$('bs').textContent=best;}
function draw(){
 c.fillStyle='#f7f7f7';c.fillRect(0,0,W,H);c.fillStyle='#e5e7eb';
 for(var k=0;k<cl.length;k++){var q=cl[k];c.beginPath();c.arc(q.x,q.y,10,0,7);c.arc(q.x+14,q.y+2,13,0,7);c.arc(q.x+28,q.y,9,0,7);c.fill();}
 c.fillStyle='#535353';c.fillRect(0,GY,W,2);for(var x=-gx;x<W;x+=40)c.fillRect(x,GY+6,12,2);
 c.fillStyle='#535353';var i;
 for(i=0;i<obs.length;i++){var o=obs[i];
  if(o.b){var f=Math.floor(fr/8)%2;c.fillRect(o.x+6,o.y+6,18,8);c.fillRect(o.x+20,o.y+3,10,5);c.fillRect(o.x+(f?4:8),o.y+(f?-2:12),10,6);}
  else{for(var j=0;j<o.n;j++){var cx=o.x+j*14;c.fillRect(cx+4,o.y,8,o.h);c.fillRect(cx,o.y+8,5,10);c.fillRect(cx,o.y+14,10,4);c.fillRect(cx+11,o.y+4,5,12);c.fillRect(cx+6,o.y+12,10,4);}}}
 // dino
 var dx=36,dy=d.y;c.fillRect(dx,dy+6,22,14);c.fillRect(dx+12,dy,16,12);c.fillRect(dx+26,dy+2,4,5);c.fillRect(dx-6,dy+8,8,6);c.fillRect(dx+4,dy+18,6,10);
 var lf=d.on&&state===1&&Math.floor(fr/5)%2;c.fillRect(dx+(lf?4:14),dy+20,6,10);c.fillStyle='#f7f7f7';c.fillRect(dx+22,dy+3,3,3);
 c.fillStyle='#535353';c.textAlign='right';c.font='bold 16px monospace';c.fillText(String(Math.floor(score)).padStart(5,'0'),W-12,24);
 c.textAlign='center';
 if(state===0){c.font='bold 16px sans-serif';c.fillText('TAP UNTUK MULAI',W/2,70);}
 if(state===2){c.font='bold 22px sans-serif';c.fillText('GAME OVER',W/2,66);c.font='14px sans-serif';c.fillText('Tap untuk main lagi',W/2,90);}
}
cv.addEventListener('pointerdown',function(e){e.preventDefault();jump();});
document.addEventListener('keydown',function(e){if(e.code==='Space'||e.key==='ArrowUp'){e.preventDefault();jump();}});
$('rs').onclick=reset;reset();step();
})();
</script>
`;

function buildDinoHtml({ playerName = "Kamu" } = {}) {
  return BODY.replace("__BASECSS__", () => BASE_CSS).replace("__CFG__", () => safeJson({ nama: String(playerName) }));
}

module.exports = { buildDinoHtml };
