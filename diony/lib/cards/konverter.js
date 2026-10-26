/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Kartu HTML statis: KONVERTER LIVE (Konverter satuan: panjang, berat, volume, waktu, data, kecepatan, luas, suhu)
// Semua jalan di dalam kartu, tanpa fetch. By PIX.
const { BASE_CSS, safeJson } = require("../htmlcard");

const BODY = String.raw`
<style>
__BASECSS__
.tabs{display:flex;gap:6px;overflow-x:auto;margin-bottom:10px;scrollbar-width:none}.tabs::-webkit-scrollbar{display:none}
.big{font-size:30px;font-weight:800;word-break:break-all;color:var(--acc);margin:6px 0}
select.inp{padding:9px 8px;font-size:13px}
.sw{background:var(--card2);border:1px solid var(--line);color:var(--ink);border-radius:50%;width:38px;height:38px;font-size:17px;flex:none;cursor:pointer}
.lst{display:grid;gap:5px;margin-top:10px;max-height:190px;overflow:auto}
.lst div{display:flex;justify-content:space-between;background:var(--card);border:1px solid var(--line);border-radius:9px;padding:7px 10px;font-size:12px}
.lst b{color:var(--acc)}
</style>
<div class="stage"><div class="app">
 <div class="top"><div class="logo">🔁</div><div class="meta"><div class="title">Konverter Live</div><div class="sub" id="who"></div></div></div>
 <div class="tabs" id="tabs"></div>
 <input class="inp" id="v" type="number" inputmode="decimal" value="1" step="any">
 <div class="row" style="margin:8px 0"><select class="inp" id="a"></select><button class="sw" id="sw">⇅</button><select class="inp" id="b"></select></div>
 <div class="box"><div class="muted" id="eq"></div><div class="big" id="out">0</div></div>
 <div class="lst" id="lst"></div>
</div></div>
<script>
(function(){
var CFG=__CFG__;document.getElementById('who').textContent='Pemain: '+CFG.nama;
var $=function(i){return document.getElementById(i)};
var U={
 'Panjang':{m:1,u:{mm:0.001,cm:0.01,m:1,km:1000,inci:0.0254,kaki:0.3048,yard:0.9144,mil:1609.344}},
 'Berat':{m:1,u:{mg:0.000001,g:0.001,kg:1,ton:1000,ons:0.1,pon:0.45359237,oz:0.0283495}},
 'Volume':{m:1,u:{ml:0.001,l:1,'m³':1000,'sdt':0.005,'sdm':0.015,cup:0.24,galon:3.78541}},
 'Waktu':{m:1,u:{detik:1,menit:60,jam:3600,hari:86400,minggu:604800,bulan:2629800,tahun:31557600}},
 'Data':{m:1,u:{bit:0.125,byte:1,KB:1024,MB:1048576,GB:1073741824,TB:1099511627776}},
 'Kecepatan':{m:1,u:{'m/s':1,'km/j':0.277778,'mil/j':0.44704,knot:0.514444}},
 'Luas':{m:1,u:{'cm²':0.0001,'m²':1,'ha':10000,'km²':1000000,'are':100,'acre':4046.86}},
 'Suhu':{t:1,u:{'°C':1,'°F':1,'K':1}}
};
var cat='Panjang';
function fmt(n){if(!isFinite(n))return '—';var a=Math.abs(n);if(a!==0&&(a>=1e12||a<1e-6))return n.toExponential(4);return (+n.toPrecision(10)).toLocaleString('id-ID',{maximumFractionDigits:8});}
function conv(v,f,t){
 if(U[cat].t){var c=f==='°C'?v:f==='°F'?(v-32)*5/9:v-273.15;return t==='°C'?c:t==='°F'?c*9/5+32:c+273.15;}
 var u=U[cat].u;return v*u[f]/u[t];}
function fill(){var k=Object.keys(U[cat].u),h=k.map(function(x){return '<option>'+x+'</option>'}).join('');$('a').innerHTML=h;$('b').innerHTML=h;$('b').selectedIndex=Math.min(2,k.length-1);calc();}
function calc(){var v=parseFloat($('v').value);if(isNaN(v)){$('out').textContent='0';$('eq').textContent='';$('lst').innerHTML='';return;}
 var f=$('a').value,t=$('b').value,r=conv(v,f,t);$('out').textContent=fmt(r)+' '+t;$('eq').textContent=fmt(v)+' '+f+' =';
 $('lst').innerHTML=Object.keys(U[cat].u).map(function(x){return '<div><span>'+x+'</span><b>'+fmt(conv(v,f,x))+'</b></div>'}).join('');}
var T=$('tabs');Object.keys(U).forEach(function(k,i){var b=document.createElement('button');b.className='chip'+(i?'':' on');b.textContent=k;b.onclick=function(){cat=k;[].forEach.call(T.children,function(c){c.classList.remove('on')});b.classList.add('on');fill();};T.appendChild(b);});
$('v').oninput=calc;$('a').onchange=calc;$('b').onchange=calc;
$('sw').onclick=function(){var x=$('a').selectedIndex;$('a').selectedIndex=$('b').selectedIndex;$('b').selectedIndex=x;calc();};
fill();
})();
</script>
`;

function buildKonverterHtml({ playerName = "Kamu" } = {}) {
  return BODY.replace("__BASECSS__", () => BASE_CSS).replace("__CFG__", () => safeJson({ nama: String(playerName) }));
}

module.exports = { buildKonverterHtml };
