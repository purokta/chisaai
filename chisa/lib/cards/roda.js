/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Kartu HTML statis: RODA PUTAR LIVE — Roda putar pilihan sendiri: makan apa, truth or dare, undian
const { BASE_CSS, safeJson } = require("../htmlcard");

const BODY = String.raw`
<style>
__BASECSS__
.wh{position:relative;width:min(100%,320px);margin:6px auto}
.wh canvas{display:block;width:100%}
.pt{position:absolute;left:50%;top:-4px;transform:translateX(-50%);width:0;height:0;border-left:11px solid transparent;border-right:11px solid transparent;border-top:24px solid #fff;filter:drop-shadow(0 2px 3px #0008);z-index:2}
.out{text-align:center;font-size:22px;font-weight:800;color:var(--acc);min-height:34px;margin:6px 0;word-break:break-word}
textarea.inp{min-height:96px;resize:vertical}
</style>
<div class="stage"><div class="app">
 <div class="top"><div class="logo">🎡</div><div class="meta"><div class="title">Roda Putar Live</div><div class="sub" id="who"></div></div></div>
 <div class="chips" id="pr"></div>
 <div class="wh"><div class="pt"></div><canvas id="cv" width="360" height="360"></canvas></div>
 <div class="out" id="out">Putar rodanya!</div>
 <button class="btn" style="width:100%" id="sp">🎡 PUTAR</button>
 <div class="muted" style="margin:10px 0 4px">Pilihan (satu per baris, 2-12 item):</div>
 <textarea class="inp" id="ta"></textarea>
 <div class="row" style="margin-top:6px"><button class="btn alt" id="rm" style="flex:1">Buang hasil dari daftar</button><label class="muted" style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="so" checked> Suara</label></div>
 <div class="muted" id="hs" style="margin-top:8px"></div>
</div></div>
<script>
(function(){
var CFG=__CFG__;document.getElementById('who').textContent='Pemain: '+CFG.nama;
var $=function(i){return document.getElementById(i)};
var c=$('cv').getContext('2d'),CX=180,CY=180,R=170;
var PRE={'Makan apa?':'Nasi goreng\nMie ayam\nBakso\nSate\nGado-gado\nSoto','Ya / Tidak':'Ya\nTidak\nMungkin\nCoba lagi nanti','Truth or Dare':'Truth\nDare\nTruth\nDare\nSkip','Giliran siapa?':'Pemain 1\nPemain 2\nPemain 3\nPemain 4','Hadiah':'Zonk\n10 Poin\n50 Poin\nJackpot 100\nZonk\n25 Poin'};
var COLS=['#ef4444','#f97316','#eab308','#22c55e','#06b6d4','#3b82f6','#8b5cf6','#ec4899','#14b8a6','#f43f5e','#84cc16','#a855f7'];
var opts=[],rot=0,spinning=false,hist=[],AC=null;
function parse(){opts=$('ta').value.split('\n').map(function(s){return s.trim()}).filter(Boolean).slice(0,12);}
function tick(){if(!$('so').checked)return;try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();var o=AC.createOscillator(),g=AC.createGain();o.frequency.value=700;g.gain.setValueAtTime(.08,AC.currentTime);g.gain.exponentialRampToValueAtTime(.0001,AC.currentTime+.06);o.connect(g);g.connect(AC.destination);o.start();o.stop(AC.currentTime+.07);}catch(e){}}
function draw(){c.clearRect(0,0,360,360);var n=opts.length;
 if(n<2){c.fillStyle='#ffffff22';c.beginPath();c.arc(CX,CY,R,0,7);c.fill();c.fillStyle='#fff';c.textAlign='center';c.font='bold 16px sans-serif';c.fillText('Isi minimal 2 pilihan',CX,CY);return;}
 var a=Math.PI*2/n;
 for(var i=0;i<n;i++){var s=rot+i*a-Math.PI/2;c.beginPath();c.moveTo(CX,CY);c.arc(CX,CY,R,s,s+a);c.closePath();c.fillStyle=COLS[i%COLS.length];c.fill();c.strokeStyle='#0b0f1f';c.lineWidth=3;c.stroke();
  c.save();c.translate(CX,CY);c.rotate(s+a/2);c.textAlign='right';c.fillStyle='#fff';c.font='bold '+(n>8?13:16)+'px sans-serif';c.shadowColor='#0008';c.shadowBlur=3;var t=opts[i];if(t.length>14)t=t.slice(0,13)+'…';c.fillText(t,R-14,5);c.restore();}
 c.beginPath();c.arc(CX,CY,22,0,7);c.fillStyle='#0b0f1f';c.fill();c.strokeStyle='#fff';c.lineWidth=4;c.stroke();}
function idxAt(){var n=opts.length,a=Math.PI*2/n,x=((-rot)%(Math.PI*2)+Math.PI*2)%(Math.PI*2);return Math.floor(x/a)%n;}
function spin(){if(spinning)return;parse();if(opts.length<2){draw();return;}spinning=true;$('out').textContent='...';
 var start=rot,extra=(5+Math.random()*3)*Math.PI*2+Math.random()*Math.PI*2,dur=4200,t0=performance.now(),lastI=-1;
 function f(t){var p=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-p,3.4);rot=start+extra*e;var i=idxAt();if(i!==lastI){tick();lastI=i;}draw();
  if(p<1)requestAnimationFrame(f);else{spinning=false;var w=opts[idxAt()];$('out').textContent=w;hist.unshift(w);hist=hist.slice(0,6);$('hs').textContent='Riwayat: '+hist.join(' • ');}}
 requestAnimationFrame(f);}
Object.keys(PRE).forEach(function(k,i){var b=document.createElement('button');b.className='chip'+(i?'':' on');b.textContent=k;b.onclick=function(){[].forEach.call($('pr').children,function(x){x.classList.toggle('on',x===b)});$('ta').value=PRE[k];parse();draw();$('out').textContent='Putar rodanya!';};$('pr').appendChild(b);});
$('ta').value=PRE['Makan apa?'];$('ta').oninput=function(){parse();draw();};
$('sp').onclick=spin;$('cv').onclick=spin;
$('rm').onclick=function(){var w=$('out').textContent;if(spinning||opts.length<=2)return;var i=opts.indexOf(w);if(i<0)return;opts.splice(i,1);$('ta').value=opts.join('\n');draw();$('out').textContent='Dibuang: '+w;};
parse();draw();
})();
</script>
`;

function buildRodaHtml({ playerName = "Kamu" } = {}) {
  return BODY.replace("__BASECSS__", () => BASE_CSS).replace("__CFG__", () => safeJson({ nama: String(playerName) }));
}

module.exports = { buildRodaHtml };
