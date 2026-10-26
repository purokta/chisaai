/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Kartu HTML statis: CATATAN & TO-DO (To-do list dengan progres + catatan cepat)
// Semua jalan di dalam kartu, tanpa fetch. By PIX.
const { BASE_CSS, safeJson } = require("../htmlcard");

const BODY = String.raw`
<style>
__BASECSS__
.tabs{display:flex;gap:6px;margin-bottom:10px}.tabs .chip{flex:1;text-align:center}
.it{display:flex;align-items:center;gap:9px;background:var(--card);border:1px solid var(--line);border-radius:11px;padding:9px 10px;margin-bottom:6px}
.it.d span{text-decoration:line-through;color:var(--soft)}.it span{flex:1;font-size:13.5px;word-break:break-word}
.ck{width:22px;height:22px;border-radius:7px;border:2px solid var(--line);background:none;color:#04130a;font-weight:900;cursor:pointer;flex:none}.it.d .ck{background:var(--acc);border-color:var(--acc)}
.x{border:0;background:none;color:var(--red);font-size:16px;cursor:pointer}
.nt{background:var(--card);border:1px solid var(--line);border-left:4px solid var(--acc);border-radius:11px;padding:10px;margin-bottom:7px;font-size:13px;white-space:pre-wrap;word-break:break-word}
.nt small{display:block;color:var(--soft);font-size:10px;margin-top:5px}
textarea.inp{min-height:70px;resize:vertical}
.prog{height:6px;background:var(--card2);border-radius:5px;overflow:hidden;margin:2px 0 10px}.prog i{display:block;height:100%;width:0;background:var(--acc);transition:width .3s}
</style>
<div class="stage"><div class="app">
 <div class="top"><div class="logo">📝</div><div class="meta"><div class="title">Catatan &amp; To-Do</div><div class="sub" id="who"></div></div></div>
 <div class="tabs"><button class="chip on" id="tt">✅ To-Do</button><button class="chip" id="tn">🗒 Catatan</button></div>
 <div id="pt"><div class="row" style="margin-bottom:8px"><input class="inp" id="ti" placeholder="Tugas baru..." maxlength="120"><button class="btn" id="ta">+</button></div><div class="prog"><i id="pg"></i></div><div id="tl"></div><div class="row" style="margin-top:6px"><button class="btn alt" style="flex:1" id="tc">Hapus yang selesai</button></div></div>
 <div id="pn" class="hide"><textarea class="inp" id="ni" placeholder="Tulis catatan..." maxlength="600"></textarea><button class="btn" style="width:100%;margin:8px 0" id="na">Simpan Catatan</button><div id="nl"></div></div>
 <div class="muted" style="text-align:center;margin-top:8px">Tersimpan di perangkat ini selama kartu dipakai</div>
</div></div>
<script>
(function(){
var CFG=__CFG__;document.getElementById('who').textContent=CFG.nama;
var $=function(i){return document.getElementById(i)};
var S={t:[],n:[]};try{S=JSON.parse(localStorage.getItem('pix_cat')||'{"t":[],"n":[]}');}catch(e){}
function save(){try{localStorage.setItem('pix_cat',JSON.stringify(S));}catch(e){}}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function rt(){var h='',d=0;S.t.forEach(function(x,i){if(x.d)d++;h+='<div class="it'+(x.d?' d':'')+'"><button class="ck" data-k="'+i+'">'+(x.d?'✓':'')+'</button><span>'+esc(x.s)+'</span><button class="x" data-x="'+i+'">✕</button></div>';});
 $('tl').innerHTML=h||'<div class="muted" style="text-align:center;padding:14px">Belum ada tugas</div>';$('pg').style.width=(S.t.length?d*100/S.t.length:0)+'%';}
function rn(){$('nl').innerHTML=S.n.map(function(x,i){return '<div class="nt">'+esc(x.s)+'<small>'+esc(x.w)+' • <a data-n="'+i+'" style="color:var(--red)">hapus</a></small></div>'}).join('')||'<div class="muted" style="text-align:center;padding:14px">Belum ada catatan</div>';}
$('ta').onclick=function(){var v=$('ti').value.trim();if(!v)return;S.t.unshift({s:v,d:0});$('ti').value='';save();rt();};
$('ti').onkeydown=function(e){if(e.key==='Enter')$('ta').onclick();};
$('tl').onclick=function(e){var k=e.target.dataset;if(k.k!==undefined)S.t[+k.k].d^=1;else if(k.x!==undefined)S.t.splice(+k.x,1);else return;save();rt();};
$('tc').onclick=function(){S.t=S.t.filter(function(x){return !x.d});save();rt();};
$('na').onclick=function(){var v=$('ni').value.trim();if(!v)return;S.n.unshift({s:v,w:new Date().toLocaleString('id-ID')});$('ni').value='';save();rn();};
$('nl').onclick=function(e){var k=e.target.dataset.n;if(k===undefined)return;S.n.splice(+k,1);save();rn();};
$('tt').onclick=function(){$('pt').classList.remove('hide');$('pn').classList.add('hide');$('tt').classList.add('on');$('tn').classList.remove('on');};
$('tn').onclick=function(){$('pn').classList.remove('hide');$('pt').classList.add('hide');$('tn').classList.add('on');$('tt').classList.remove('on');};
rt();rn();
})();
</script>
`;

function buildCatatanHtml({ playerName = "Kamu" } = {}) {
  return BODY.replace("__BASECSS__", () => BASE_CSS).replace("__CFG__", () => safeJson({ nama: String(playerName) }));
}

module.exports = { buildCatatanHtml };
