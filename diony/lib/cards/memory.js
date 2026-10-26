/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Kartu HTML statis: MEMORY LIVE (Game cocokkan kartu 3 level, hitung langkah & waktu, rekor tersimpan)
// Semua jalan di dalam kartu, tanpa fetch. By PIX.
const { BASE_CSS, safeJson } = require("../htmlcard");

const BODY = String.raw`
<style>
__BASECSS__
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin:10px 0}
.cd{aspect-ratio:1;perspective:400px;cursor:pointer}
.in{position:relative;width:100%;height:100%;transition:transform .35s;transform-style:preserve-3d}
.cd.f .in{transform:rotateY(180deg)}
.fc,.bc{position:absolute;inset:0;border-radius:11px;display:flex;align-items:center;justify-content:center;backface-visibility:hidden;-webkit-backface-visibility:hidden;font-size:28px}
.bc{background:linear-gradient(135deg,#2a3350,#1d2540);border:1px solid var(--line);color:#9db4ff}
.fc{background:var(--card2);border:1px solid var(--line);transform:rotateY(180deg)}
.cd.m .fc{background:#143d26;border-color:var(--acc)}
.st{display:flex;gap:6px;justify-content:space-between}
.pill{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:5px 11px;font-size:12px;font-weight:800}.pill b{color:var(--acc)}
.win{text-align:center;padding:10px;color:var(--acc);font-weight:800;min-height:20px}
</style>
<div class="stage"><div class="app">
 <div class="top"><div class="logo">🧠</div><div class="meta"><div class="title">Memory Live</div><div class="sub" id="who"></div></div></div>
 <div class="chips" id="lv"><button class="chip on" data-n="6">Mudah 4×3</button><button class="chip" data-n="8">Sedang 4×4</button><button class="chip" data-n="10">Susah 4×5</button></div>
 <div class="st"><span class="pill">Langkah <b id="mv">0</b></span><span class="pill">Waktu <b id="tm">0</b>d</span><span class="pill">Rekor <b id="bs">-</b></span></div>
 <div class="grid" id="g"></div>
 <div class="win" id="win"></div>
 <button class="btn" style="width:100%" id="rs">⟳ Acak Ulang</button>
</div></div>
<script>
(function(){
var CFG=__CFG__;document.getElementById('who').textContent='Pemain: '+CFG.nama;
var $=function(i){return document.getElementById(i)};
var E=['🐶','🐱','🦊','🐼','🐸','🦁','🐙','🦄','🍕','🍩'],N=6,first=null,lock=false,mv=0,tm=0,iv=null,left=0,rec={};
try{rec=JSON.parse(localStorage.getItem('pix_mem')||'{}');}catch(e){}
function shuf(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t;}return a;}
function start(){clearInterval(iv);iv=null;mv=0;tm=0;first=null;lock=false;left=N;$('mv').textContent=0;$('tm').textContent=0;$('win').textContent='';$('bs').textContent=rec[N]||'-';
 var d=shuf(E.slice(0,N).concat(E.slice(0,N))),g=$('g');g.innerHTML='';
 d.forEach(function(e){var c=document.createElement('div');c.className='cd';c.dataset.e=e;c.innerHTML='<div class="in"><div class="bc">❔</div><div class="fc">'+e+'</div></div>';c.onclick=function(){flip(c)};g.appendChild(c);});}
function flip(c){if(lock||c.classList.contains('f'))return;if(!iv)iv=setInterval(function(){tm++;$('tm').textContent=tm;},1000);
 c.classList.add('f');if(!first){first=c;return;}mv++;$('mv').textContent=mv;
 if(first.dataset.e===c.dataset.e){first.classList.add('m');c.classList.add('m');first=null;left--;if(!left)done();}
 else{lock=true;var a=first;first=null;setTimeout(function(){a.classList.remove('f');c.classList.remove('f');lock=false;},750);}}
function done(){clearInterval(iv);var b=!rec[N]||mv<rec[N];if(b){rec[N]=mv;try{localStorage.setItem('pix_mem',JSON.stringify(rec));}catch(e){}}$('bs').textContent=rec[N];
 $('win').textContent='🎉 Selesai! '+mv+' langkah, '+tm+' detik'+(b?' — REKOR BARU!':'');}
$('rs').onclick=start;
$('lv').onclick=function(e){var n=e.target.dataset&&e.target.dataset.n;if(!n)return;N=+n;[].forEach.call($('lv').children,function(x){x.classList.toggle('on',x===e.target)});start();};
start();
})();
</script>
`;

function buildMemoryHtml({ playerName = "Kamu" } = {}) {
  return BODY.replace("__BASECSS__", () => BASE_CSS).replace("__CFG__", () => safeJson({ nama: String(playerName) }));
}

module.exports = { buildMemoryHtml };
