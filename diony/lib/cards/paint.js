/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Kartu HTML statis: PAINT LIVE (Papan gambar: pensil, penghapus, isi warna, undo)
// Semua jalan di dalam kartu, tanpa fetch. By PIX.
const { BASE_CSS, safeJson } = require("../htmlcard");

const BODY = String.raw`
<style>
__BASECSS__
.cv{display:block;width:100%;background:#fff;border-radius:12px;border:1px solid var(--line);touch-action:none}
.pal{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}
.sl{width:26px;height:26px;border-radius:50%;border:2px solid var(--line);cursor:pointer}.sl.on{border-color:#fff;transform:scale(1.18)}
.tl{display:flex;gap:6px;flex-wrap:wrap}.tl .btn{padding:8px 10px;font-size:12px}.tl .btn.sel{background:var(--acc);color:#04130a}
</style>
<div class="stage"><div class="app">
 <div class="top"><div class="logo">🎨</div><div class="meta"><div class="title">Paint Live</div><div class="sub" id="who"></div></div></div>
 <canvas id="cv" class="cv" width="640" height="640"></canvas>
 <div class="pal" id="pal"></div>
 <div class="row" style="margin-bottom:8px"><span class="muted">Tebal</span><input type="range" id="sz" min="1" max="40" value="6" style="flex:1"><span class="muted" id="szv">6</span></div>
 <div class="tl"><button class="btn alt sel" id="t_p">✏️ Pensil</button><button class="btn alt" id="t_e">🧽 Hapus</button><button class="btn alt" id="t_f">🪣 Isi</button><button class="btn alt" id="t_u">↩ Undo</button><button class="btn red" id="t_c">🗑 Bersih</button></div>
</div></div>
<script>
(function(){
var CFG=__CFG__;document.getElementById('who').textContent='Pemain: '+CFG.nama;
var $=function(i){return document.getElementById(i)};
var cv=$('cv'),c=cv.getContext('2d'),col='#111',tool='p',hist=[],drawing=false,lx=0,ly=0;
c.fillStyle='#fff';c.fillRect(0,0,640,640);c.lineCap='round';c.lineJoin='round';
var COLS=['#111111','#ffffff','#ef4444','#f97316','#eab308','#22c55e','#06b6d4','#3b82f6','#8b5cf6','#ec4899','#92400e','#6b7280'];
COLS.forEach(function(x,i){var d=document.createElement('div');d.className='sl'+(i?'':' on');d.style.background=x;d.onclick=function(){col=x;[].forEach.call($('pal').children,function(n){n.classList.remove('on')});d.classList.add('on');if(tool==='e')sel('p');};$('pal').appendChild(d);});
function sel(t){tool=t;['p','e','f'].forEach(function(k){$('t_'+k).classList.toggle('sel',k===t)});}
$('t_p').onclick=function(){sel('p')};$('t_e').onclick=function(){sel('e')};$('t_f').onclick=function(){sel('f')};
$('sz').oninput=function(){$('szv').textContent=this.value;};
function snap(){if(hist.length>15)hist.shift();hist.push(c.getImageData(0,0,640,640));}
$('t_u').onclick=function(){if(hist.length)c.putImageData(hist.pop(),0,0);};
$('t_c').onclick=function(){snap();c.fillStyle='#fff';c.fillRect(0,0,640,640);};
function pos(e){var r=cv.getBoundingClientRect();return [(e.clientX-r.left)*640/r.width,(e.clientY-r.top)*640/r.height];}
function hex(h){return [parseInt(h.substr(1,2),16),parseInt(h.substr(3,2),16),parseInt(h.substr(5,2),16)];}
function fill(x,y){x|=0;y|=0;var im=c.getImageData(0,0,640,640),d=im.data,i=(y*640+x)*4,tr=d[i],tg=d[i+1],tb=d[i+2],n=hex(col);
 if(tr===n[0]&&tg===n[1]&&tb===n[2])return;var st=[[x,y]];
 function ok(p){return Math.abs(d[p]-tr)<24&&Math.abs(d[p+1]-tg)<24&&Math.abs(d[p+2]-tb)<24;}
 while(st.length){var q=st.pop(),px=q[0],py=q[1];while(py>=0&&ok((py*640+px)*4))py--;py++;var l=false,r=false;
  while(py<640&&ok((py*640+px)*4)){var p=(py*640+px)*4;d[p]=n[0];d[p+1]=n[1];d[p+2]=n[2];d[p+3]=255;
   if(px>0){if(ok(p-4)){if(!l){st.push([px-1,py]);l=true;}}else l=false;}
   if(px<639){if(ok(p+4)){if(!r){st.push([px+1,py]);r=true;}}else r=false;}py++;}}
 c.putImageData(im,0,0);}
cv.addEventListener('pointerdown',function(e){e.preventDefault();var p=pos(e);snap();if(tool==='f'){fill(p[0],p[1]);return;}drawing=true;lx=p[0];ly=p[1];try{cv.setPointerCapture(e.pointerId);}catch(x){}dot(p[0],p[1]);});
function dot(x,y){c.fillStyle=tool==='e'?'#fff':col;c.beginPath();c.arc(x,y,$('sz').value/2,0,7);c.fill();}
cv.addEventListener('pointermove',function(e){if(!drawing)return;var p=pos(e);c.strokeStyle=tool==='e'?'#fff':col;c.lineWidth=$('sz').value;c.beginPath();c.moveTo(lx,ly);c.lineTo(p[0],p[1]);c.stroke();lx=p[0];ly=p[1];});
function end(){drawing=false;}cv.addEventListener('pointerup',end);cv.addEventListener('pointercancel',end);
})();
</script>
`;

function buildPaintHtml({ playerName = "Kamu" } = {}) {
  return BODY.replace("__BASECSS__", () => BASE_CSS).replace("__CFG__", () => safeJson({ nama: String(playerName) }));
}

module.exports = { buildPaintHtml };
