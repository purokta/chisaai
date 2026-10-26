/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Kartu HTML statis: TETRIS LIVE — Tetris: tombol kontrol layar, ghost piece, level naik, skor terbaik tersimpan
const { BASE_CSS, safeJson } = require("../htmlcard");

const BODY = String.raw`
<style>
__BASECSS__
.wrap{display:flex;gap:10px;align-items:flex-start}
.cv{background:#0b0f1f;border:1px solid var(--line);border-radius:10px;touch-action:none}
.side{flex:1;display:grid;gap:7px}
.pill{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:6px 10px;font-size:11px;color:var(--soft)}
.pill b{display:block;font-size:18px;color:var(--ink)}
.ctl{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:10px}
.ctl button{padding:14px 0;font-size:18px;font-weight:800;border-radius:12px;border:1px solid var(--line);background:var(--card2);color:var(--ink);touch-action:manipulation;user-select:none;-webkit-user-select:none}
.ctl button:active{background:var(--acc);color:#04130a}
</style>
<div class="stage"><div class="app">
 <div class="top"><div class="logo">🧱</div><div class="meta"><div class="title">Tetris Live</div><div class="sub" id="who"></div></div></div>
 <div class="wrap">
  <canvas id="cv" class="cv" width="180" height="360" style="width:54%"></canvas>
  <div class="side">
   <div class="pill">Skor<b id="sc">0</b></div>
   <div class="pill">Level<b id="lv">1</b></div>
   <div class="pill">Baris<b id="ln">0</b></div>
   <div class="pill">Terbaik<b id="bs">0</b></div>
   <canvas id="nx" class="cv" width="72" height="54" style="width:100%"></canvas>
   <button class="btn alt" id="rs">⟳ Ulang</button>
  </div>
 </div>
 <div class="ctl"><button id="bl">◀</button><button id="br">▶</button><button id="bt">⟳</button><button id="bd">▼</button></div>
 <button class="btn" style="width:100%;margin-top:8px" id="hd">⤓ Jatuhkan</button>
</div></div>
<script>
(function(){
var CFG=__CFG__;document.getElementById('who').textContent='Pemain: '+CFG.nama;
var $=function(i){return document.getElementById(i)};
var c=$('cv').getContext('2d'),n=$('nx').getContext('2d'),W=10,H=20,S=18;
var SH={I:[[1,1,1,1]],O:[[1,1],[1,1]],T:[[0,1,0],[1,1,1]],S:[[0,1,1],[1,1,0]],Z:[[1,1,0],[0,1,1]],J:[[1,0,0],[1,1,1]],L:[[0,0,1],[1,1,1]]};
var COL={I:'#22d3ee',O:'#facc15',T:'#c084fc',S:'#4ade80',Z:'#f87171',J:'#60a5fa',L:'#fb923c'};
var bag=[],b,cur,nx,score,lines,lvl,over,acc,last,best=0;
try{best=+localStorage.getItem('pix_tetris')||0;}catch(e){}
function nt(){if(!bag.length)bag=Object.keys(SH).sort(function(){return Math.random()-.5});return bag.pop();}
function mk(t){var m=SH[t].map(function(r){return r.slice()});return {t:t,m:m,x:Math.floor((W-m[0].length)/2),y:0};}
function rot(m){var h=m.length,w=m[0].length,r=[],i,j;for(i=0;i<w;i++){r[i]=[];for(j=0;j<h;j++)r[i][j]=m[h-1-j][i];}return r;}
function hit(m,x,y){for(var i=0;i<m.length;i++)for(var j=0;j<m[i].length;j++)if(m[i][j]){var X=x+j,Y=y+i;if(X<0||X>=W||Y>=H||(Y>=0&&b[Y][X]))return true;}return false;}
function reset(){b=[];for(var i=0;i<H;i++)b.push(new Array(W).fill(0));score=0;lines=0;lvl=1;over=false;acc=0;nx=mk(nt());spawn();ui();}
function spawn(){cur=nx;nx=mk(nt());if(hit(cur.m,cur.x,cur.y)){over=true;if(score>best){best=score;try{localStorage.setItem('pix_tetris',best);}catch(e){}}ui();}}
function ui(){$('sc').textContent=score;$('lv').textContent=lvl;$('ln').textContent=lines;$('bs').textContent=best;}
function move(dx){if(over)return;if(!hit(cur.m,cur.x+dx,cur.y))cur.x+=dx;}
function turn(){if(over)return;var r=rot(cur.m),k=[0,-1,1,-2,2];for(var i=0;i<k.length;i++)if(!hit(r,cur.x+k[i],cur.y)){cur.m=r;cur.x+=k[i];return;}}
function lock(){for(var i=0;i<cur.m.length;i++)for(var j=0;j<cur.m[i].length;j++)if(cur.m[i][j]&&cur.y+i>=0)b[cur.y+i][cur.x+j]=cur.t;
 var cl=0;for(var y=H-1;y>=0;y--){if(b[y].every(function(v){return v})){b.splice(y,1);b.unshift(new Array(W).fill(0));cl++;y++;}}
 if(cl){score+=[0,100,300,500,800][cl]*lvl;lines+=cl;lvl=1+Math.floor(lines/10);}spawn();ui();}
function down(){if(over)return false;if(!hit(cur.m,cur.x,cur.y+1)){cur.y++;return true;}lock();return false;}
function drop(){if(over)return;var d=0;while(!hit(cur.m,cur.x,cur.y+1)){cur.y++;d++;}score+=d*2;lock();}
function cell(g,x,y,col,s){g.fillStyle=col;g.fillRect(x*s+1,y*s+1,s-2,s-2);g.fillStyle='rgba(255,255,255,.28)';g.fillRect(x*s+1,y*s+1,s-2,3);}
function draw(){
 c.fillStyle='#0b0f1f';c.fillRect(0,0,180,360);c.strokeStyle='#ffffff10';
 for(var x=0;x<=W;x++){c.beginPath();c.moveTo(x*S,0);c.lineTo(x*S,360);c.stroke();}
 for(var y=0;y<=H;y++){c.beginPath();c.moveTo(0,y*S);c.lineTo(180,y*S);c.stroke();}
 var i,j;for(i=0;i<H;i++)for(j=0;j<W;j++)if(b[i][j])cell(c,j,i,COL[b[i][j]],S);
 if(!over){var gy=cur.y;while(!hit(cur.m,cur.x,gy+1))gy++;
  for(i=0;i<cur.m.length;i++)for(j=0;j<cur.m[i].length;j++)if(cur.m[i][j]){c.strokeStyle=COL[cur.t];c.globalAlpha=.4;c.strokeRect((cur.x+j)*S+2,(gy+i)*S+2,S-4,S-4);c.globalAlpha=1;cell(c,cur.x+j,cur.y+i,COL[cur.t],S);}}
 n.fillStyle='#0b0f1f';n.fillRect(0,0,72,54);var m=nx.m,s=14,ox=(72-m[0].length*s)/2,oy=(54-m.length*s)/2;
 for(i=0;i<m.length;i++)for(j=0;j<m[i].length;j++)if(m[i][j]){n.fillStyle=COL[nx.t];n.fillRect(ox+j*s+1,oy+i*s+1,s-2,s-2);}
 if(over){c.fillStyle='#000b';c.fillRect(0,130,180,100);c.fillStyle='#fff';c.textAlign='center';c.font='bold 22px sans-serif';c.fillText('GAME OVER',90,170);c.font='13px sans-serif';c.fillText('Skor '+score+' • tap Ulang',90,200);}
}
function loop(t){if(!last)last=t;var dt=t-last;last=t;if(!over){acc+=dt;var sp=Math.max(90,720-(lvl-1)*65);while(acc>=sp){acc-=sp;down();}}draw();requestAnimationFrame(loop);}
function hold(id,fn){var el=$(id),iv=null;function stop(){clearInterval(iv);iv=null;}el.addEventListener('pointerdown',function(e){e.preventDefault();fn();stop();iv=setInterval(fn,95);});['pointerup','pointerleave','pointercancel'].forEach(function(ev){el.addEventListener(ev,stop);});}
hold('bl',function(){move(-1)});hold('br',function(){move(1)});hold('bd',function(){if(down())score+=1;ui();});
$('bt').addEventListener('pointerdown',function(e){e.preventDefault();turn();});$('hd').onclick=drop;$('rs').onclick=reset;
document.addEventListener('keydown',function(e){var k=e.key;if(k==='ArrowLeft')move(-1);else if(k==='ArrowRight')move(1);else if(k==='ArrowUp')turn();else if(k==='ArrowDown'){down();}else if(k===' '){e.preventDefault();drop();}});
reset();requestAnimationFrame(loop);
})();
</script>
`;

function buildTetrisHtml({ playerName = "Kamu" } = {}) {
  return BODY.replace("__BASECSS__", () => BASE_CSS).replace("__CFG__", () => safeJson({ nama: String(playerName) }));
}

module.exports = { buildTetrisHtml };
