/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Kartu HTML statis: MINESWEEPER LIVE — Minesweeper 3 level, mode bendera, timer & rekor
const { BASE_CSS, safeJson } = require("../htmlcard");

const BODY = String.raw`
<style>
__BASECSS__
.bd{display:grid;gap:3px;margin:10px 0;touch-action:manipulation}
.c{aspect-ratio:1;border-radius:7px;border:1px solid var(--line);background:linear-gradient(#2a3350,#1d2540);color:var(--ink);font-weight:800;font-size:15px;display:flex;align-items:center;justify-content:center;cursor:pointer;user-select:none;-webkit-user-select:none;padding:0}
.c.o{background:var(--card);cursor:default}
.c.m{background:#7f1d1d}.c.f{color:#fbbf24}
.n1{color:#60a5fa}.n2{color:#4ade80}.n3{color:#f87171}.n4{color:#a78bfa}.n5{color:#fb923c}.n6{color:#22d3ee}.n7,.n8{color:#e5e7eb}
.st{display:flex;gap:6px;justify-content:space-between}
.pill{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:5px 11px;font-size:12px;font-weight:800}.pill b{color:var(--acc)}
.msg{text-align:center;font-weight:800;min-height:22px;margin-bottom:4px}
</style>
<div class="stage"><div class="app">
 <div class="top"><div class="logo">💣</div><div class="meta"><div class="title">Minesweeper Live</div><div class="sub" id="who"></div></div></div>
 <div class="chips" id="lv"><button class="chip on" data-k="0">Mudah</button><button class="chip" data-k="1">Sedang</button><button class="chip" data-k="2">Sulit</button></div>
 <div class="st"><span class="pill">Ranjau <b id="mc">0</b></span><span class="pill">Waktu <b id="tm">0</b>d</span><span class="pill">Terbaik <b id="bs">-</b></span></div>
 <div class="bd" id="bd"></div>
 <div class="msg" id="ms"></div>
 <div class="row"><button class="btn alt" id="fl" style="flex:1">🚩 Mode bendera: OFF</button><button class="btn" id="rs" style="flex:1">⟳ Ulang</button></div>
 <div class="muted" style="text-align:center;margin-top:8px">Tap petak untuk buka. Aktifkan mode bendera untuk menandai ranjau.</div>
</div></div>
<script>
(function(){
var CFG=__CFG__;document.getElementById('who').textContent='Pemain: '+CFG.nama;
var $=function(i){return document.getElementById(i)};
var LV=[[8,8,9],[9,10,16],[9,12,24]],K=0,R,C,M,g,first,over,flag=false,tm=0,iv=null,left,rec={};
try{rec=JSON.parse(localStorage.getItem('pix_mines')||'{}');}catch(e){}
function start(){clearInterval(iv);iv=null;tm=0;R=LV[K][0];C=LV[K][1];M=LV[K][2];first=true;over=false;g=[];
 for(var i=0;i<R;i++){g[i]=[];for(var j=0;j<C;j++)g[i][j]={m:0,o:0,f:0,n:0};}
 left=M;$('mc').textContent=M;$('tm').textContent=0;$('ms').textContent='';$('bs').textContent=rec[K]||'-';render();}
function nb(i,j,f){for(var a=-1;a<=1;a++)for(var b=-1;b<=1;b++){if(!a&&!b)continue;var y=i+a,x=j+b;if(y>=0&&y<R&&x>=0&&x<C)f(y,x);}}
function place(si,sj){var p=0;while(p<M){var i=Math.floor(Math.random()*R),j=Math.floor(Math.random()*C);if(g[i][j].m||(Math.abs(i-si)<=1&&Math.abs(j-sj)<=1))continue;g[i][j].m=1;p++;}
 for(var i2=0;i2<R;i2++)for(var j2=0;j2<C;j2++){var n=0;nb(i2,j2,function(y,x){n+=g[y][x].m});g[i2][j2].n=n;}}
function open(i,j){var q=[[i,j]];while(q.length){var p=q.pop(),c=g[p[0]][p[1]];if(c.o||c.f)continue;c.o=1;if(c.n===0&&!c.m)nb(p[0],p[1],function(y,x){if(!g[y][x].o)q.push([y,x])});}}
function tap(i,j){if(over)return;var c=g[i][j];
 if(flag){if(c.o)return;c.f^=1;left+=c.f?-1:1;$('mc').textContent=left;render();return;}
 if(c.f||c.o)return;
 if(first){first=false;place(i,j);iv=setInterval(function(){tm++;$('tm').textContent=tm;},1000);}
 if(c.m){over=true;clearInterval(iv);for(var a=0;a<R;a++)for(var b=0;b<C;b++)if(g[a][b].m)g[a][b].o=1;c.hit=1;$('ms').textContent='💥 Kena ranjau! Coba lagi.';render();return;}
 open(i,j);var safe=0;for(var a2=0;a2<R;a2++)for(var b2=0;b2<C;b2++)if(!g[a2][b2].m&&!g[a2][b2].o)safe++;
 if(!safe){over=true;clearInterval(iv);var nw=!rec[K]||tm<rec[K];if(nw){rec[K]=tm;try{localStorage.setItem('pix_mines',JSON.stringify(rec));}catch(e){}}$('bs').textContent=rec[K];$('ms').textContent='🎉 Menang dalam '+tm+' detik'+(nw?' — REKOR!':'');}
 render();}
function render(){var bd=$('bd');bd.style.gridTemplateColumns='repeat('+C+',1fr)';bd.innerHTML='';
 for(var i=0;i<R;i++)for(var j=0;j<C;j++){(function(i,j){var c=g[i][j],d=document.createElement('button');d.className='c'+(c.o?' o':'')+(c.hit?' m':'');
  d.textContent=c.o?(c.m?'💣':(c.n?c.n:'')):(c.f?'🚩':'');if(c.o&&!c.m&&c.n)d.classList.add('n'+c.n);d.onclick=function(){tap(i,j)};bd.appendChild(d);})(i,j);}}
$('fl').onclick=function(){flag=!flag;this.textContent='🚩 Mode bendera: '+(flag?'ON':'OFF');this.classList.toggle('alt',!flag);};
$('rs').onclick=start;
$('lv').onclick=function(e){var k=e.target.dataset&&e.target.dataset.k;if(k===undefined)return;K=+k;[].forEach.call($('lv').children,function(x){x.classList.toggle('on',x===e.target)});start();};
start();
})();
</script>
`;

function buildMinesHtml({ playerName = "Kamu" } = {}) {
  return BODY.replace("__BASECSS__", () => BASE_CSS).replace("__CFG__", () => safeJson({ nama: String(playerName) }));
}

module.exports = { buildMinesHtml };
