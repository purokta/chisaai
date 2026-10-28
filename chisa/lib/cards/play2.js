/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Kartu HTML statis: CHISA PLAY (.play2) — hasil cari video/musik/gambar + tautan, tampilan kartu.
// Semua data & thumbnail ditanam di HTML (data URI), tanpa fetch/jaringan (sandbox WA memblokir jaringan).
// Tombol di kartu menyalin perintah (.playaudio / .playvideo / .playimg) — sama seperti kartu musik.
const { BASE_CSS, safeJson } = require("../htmlcard");

const BODY = String.raw`
<style>
__BASECSS__
.app{padding:0;background:#0d0e14}
.bgl{position:absolute;inset:0;background-size:cover;background-position:center;opacity:.42;filter:blur(14px) saturate(1.2);transform:scale(1.15);pointer-events:none}
.shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(9,10,15,.55) 0%,rgba(9,10,15,.88) 38%,#0b0c11 100%);pointer-events:none}
.in{position:relative;padding:14px 12px 14px}
.gl{width:34px;height:34px;border-radius:10px;flex:none;display:flex;align-items:center;justify-content:center;font-size:19px;color:#2a1f05;background:linear-gradient(135deg,#f1deaa,#c9a24a);box-shadow:0 4px 12px rgba(201,162,74,.35)}
.hd{display:flex;gap:10px;align-items:center;margin-bottom:12px}
.hd .t1{font-size:15px;font-weight:900;letter-spacing:1.4px;color:#f1deaa}
.hd .t2{font-size:10.5px;color:var(--soft);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.gold{color:#e8d9a8}
.hero{border-radius:16px;overflow:hidden;background:#ffffff0d;border:1px solid #ffffff1f;margin-bottom:12px;backdrop-filter:blur(6px)}
.pic{position:relative;background-color:#262a37;background-size:cover;background-position:center}
.hero .pic{height:176px}
.badge{position:absolute;right:8px;bottom:8px;background:#000c;color:#fff;font-size:10.5px;font-weight:800;border-radius:6px;padding:2px 7px}
.tag{position:absolute;left:8px;top:8px;background:linear-gradient(135deg,#f1deaa,#c9a24a);color:#2a1f05;font-size:9.5px;font-weight:900;letter-spacing:1px;border-radius:6px;padding:3px 8px}
.hb{padding:10px 11px 11px}
.nm{font-size:14px;font-weight:800;line-height:1.28;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.mt{font-size:11px;color:var(--soft);margin-top:4px}
.lk{margin-top:6px;font-family:ui-monospace,Menlo,monospace;font-size:10px;color:#9fb4ff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.acts{display:flex;gap:7px;margin-top:9px;flex-wrap:wrap}
.ab{flex:1;min-width:0;border:1px solid #ffffff26;background:#ffffff12;color:#fff;border-radius:10px;padding:8px 4px;font-size:11.5px;font-weight:800;cursor:pointer;text-align:center;white-space:nowrap}
.ab.pri{background:linear-gradient(135deg,#f1deaa,#c9a24a);color:#2a1f05;border-color:#c9a24a}
.ab:active{transform:scale(.96)}
.tabs{display:flex;gap:6px;margin-bottom:10px}
.tb{flex:1;border:1px solid #ffffff22;background:#ffffff0e;color:#cfd5e2;border-radius:12px;padding:8px 4px;font-size:11.5px;font-weight:800;cursor:pointer;text-align:center}
.tb.on{background:#f1deaa22;border-color:#c9a24a;color:#f1deaa;box-shadow:inset 0 -2px 0 #c9a24a}
.pane{display:none}.pane.on{display:block}
.it{display:flex;gap:10px;background:#ffffff0d;border:1px solid #ffffff17;border-radius:14px;padding:8px;margin-bottom:8px;backdrop-filter:blur(4px)}
.it .pic{width:104px;height:62px;border-radius:9px;flex:none}
.it .badge{right:4px;bottom:4px;font-size:9.5px;padding:1px 5px}
.it .tx{min-width:0;flex:1;display:flex;flex-direction:column;justify-content:space-between}
.it .a{font-size:12px;font-weight:800;line-height:1.25;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.it .b{font-size:10px;color:var(--soft);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mini{display:flex;gap:6px;margin-top:5px}
.mb{border:1px solid #ffffff26;background:#ffffff12;color:#fff;border-radius:8px;padding:4px 9px;font-size:10.5px;font-weight:800;cursor:pointer}
.mb.g{background:#f1deaa22;border-color:#c9a24a77;color:#f1deaa}
.mb:active{transform:scale(.94)}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.gi{border-radius:12px;overflow:hidden;background:#ffffff0d;border:1px solid #ffffff17}
.gi .pic{height:104px}
.gi .gt{padding:6px 7px 7px}
.gi .a{font-size:10.5px;font-weight:700;line-height:1.25;height:26px;overflow:hidden}
.gi .mini{margin-top:4px}
.ln{background:#ffffff0d;border:1px solid #ffffff17;border-radius:12px;padding:8px 10px;margin-bottom:7px}
.ln .a{font-size:11.5px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ln .u{font-family:ui-monospace,Menlo,monospace;font-size:9.5px;color:#9fb4ff;margin-top:3px;word-break:break-all;line-height:1.35}
.sec{font-size:10px;font-weight:900;letter-spacing:1.5px;color:#c9a24a;margin:12px 0 7px}
.empty{padding:22px 12px;text-align:center;color:var(--soft);font-size:12px}
.bar{position:sticky;bottom:0;margin-top:10px;background:#0b0c11ee;border:1px solid #c9a24a66;border-radius:12px;padding:8px 10px;backdrop-filter:blur(8px)}
.bar .l{font-size:9.5px;letter-spacing:1.2px;font-weight:900;color:#c9a24a}
.bar .c{font-family:ui-monospace,Menlo,monospace;font-size:11px;color:#fff;margin-top:3px;word-break:break-all;line-height:1.35}
.bar .h{font-size:10px;color:var(--soft);margin-top:4px}
.toast{position:fixed;left:50%;bottom:76px;transform:translateX(-50%);background:#000d;color:#fff;padding:8px 14px;border-radius:20px;font-size:12px;opacity:0;transition:opacity .2s;pointer-events:none;max-width:86%;text-align:center}.toast.on{opacity:1}
.ft{text-align:center;font-size:10px;color:#6e7486;margin-top:10px;letter-spacing:1px}
</style>
<div class="stage"><div class="app">
 <div class="bgl" id="bgl"></div><div class="shade"></div>
 <div class="in">
  <div class="hd"><div class="gl">✦</div><div style="min-width:0;flex:1"><div class="t1">CHISA AI PLAY</div><div class="t2" id="who"></div></div></div>
  <div class="hero" id="hero"></div>
  <div class="tabs" id="tabs"></div>
  <div class="pane on" id="p-vid"></div>
  <div class="pane" id="p-img"></div>
  <div class="pane" id="p-lnk"></div>
  <div class="bar"><div class="l">✦ PERINTAH TERPILIH</div><div class="c" id="cmd">Tekan tombol Audio / Video / Gambar</div><div class="h" id="hint">Tombol menyalin perintah. Tempel di chat, atau pakai tombol di bawah kartu.</div></div>
  <div class="ft">✦ CHISA AI</div>
 </div>
</div><div class="toast" id="toast"></div></div>
<script>
(function(){
var CFG=__CFG__;
var $=function(i){return document.getElementById(i)};
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function bg(u){return u?"background-image:url('"+u+"')":''}
function toast(s){var t=$('toast');t.textContent=s;t.classList.add('on');setTimeout(function(){t.classList.remove('on')},2000)}
function copy(text,label){
 $('cmd').textContent=text;
 var done=function(){toast('Disalin: '+(label||text))},fail=function(){toast('Ketik: '+text)};
 try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(done,function(){legacy(text)?done():fail()});return}}catch(x){}
 legacy(text)?done():fail();
}
function legacy(text){try{var a=document.createElement('textarea');a.value=text;a.style.position='fixed';a.style.opacity='0';document.body.appendChild(a);a.select();var ok=document.execCommand('copy');document.body.removeChild(a);return ok}catch(x){return false}}
var P=CFG.prefix,it=CFG.items,im=CFG.imgs;
$('who').textContent='Untuk: '+CFG.nama+(CFG.q?'  •  '+CFG.q:'');
if(it[0]&&it[0].th)$('bgl').setAttribute('style',bg(it[0].th));
var h=it[0];
$('hero').innerHTML='<div class="pic" style="'+bg(h.th)+'"><span class="tag">HASIL TERATAS</span>'+(h.d?'<span class="badge">'+esc(h.d)+'</span>':'')+'</div>'+
 '<div class="hb"><div class="nm">'+esc(h.t||'Tanpa judul')+'</div><div class="mt">'+esc(h.m)+'</div><div class="lk">'+esc(h.u)+'</div>'+
 '<div class="acts"><button class="ab pri" data-k="a" data-i="0">✦ Audio</button><button class="ab pri" data-k="v" data-i="0">✦ Video</button>'+(CFG.q&&!CFG.link?'<button class="ab" data-k="g">✦ Gambar</button>':'')+'<button class="ab" data-k="l" data-i="0">Tautan</button></div></div>';
var tabs=[['vid','Hasil ('+it.length+')']];
if(im.length)tabs.push(['img','Gambar ('+im.length+')']);
tabs.push(['lnk','Tautan']);
$('tabs').innerHTML=tabs.map(function(t,i){return '<div class="tb'+(i?'':' on')+'" data-t="'+t[0]+'">'+t[1]+'</div>'}).join('');
var rest=it.slice(1);
$('p-vid').innerHTML=rest.length?'<div class="sec">HASIL LAIN</div>'+rest.map(function(r,j){var i=j+1;
 return '<div class="it"><div class="pic" style="'+bg(r.th)+'">'+(r.d?'<span class="badge">'+esc(r.d)+'</span>':'')+'</div><div class="tx"><div><div class="a">'+esc(r.t||'Tanpa judul')+'</div><div class="b">'+esc(r.m)+'</div></div>'+
 '<div class="mini"><button class="mb g" data-k="a" data-i="'+i+'">Audio</button><button class="mb g" data-k="v" data-i="'+i+'">Video</button><button class="mb" data-k="l" data-i="'+i+'">Tautan</button></div></div></div>'}).join(''):'<div class="empty">Hanya satu hasil untuk pencarian ini.</div>';
$('p-img').innerHTML=im.length?'<div class="grid">'+im.map(function(g,i){
 return '<div class="gi"><div class="pic" style="'+bg(g.th)+'"></div><div class="gt"><div class="a">'+esc(g.t||'Gambar')+'</div><div class="mini"><button class="mb g" data-k="gi" data-i="'+i+'">Tautan</button>'+(g.pg?'<button class="mb" data-k="gp" data-i="'+i+'">Sumber</button>':'')+'</div></div></div>'}).join('')+'</div><div class="acts" style="margin-top:10px"><button class="ab pri" data-k="g">✦ Kirim gambar ke chat</button></div>':'';
var L='<div class="sec">VIDEO / MUSIK</div>'+it.map(function(r,i){return '<div class="ln"><div class="a">'+(i+1)+'. '+esc(r.t||'Tanpa judul')+'</div><div class="u">'+esc(r.u)+'</div><div class="mini"><button class="mb g" data-k="l" data-i="'+i+'">Salin</button></div></div>'}).join('');
if(im.length)L+='<div class="sec">GAMBAR</div>'+im.map(function(g,i){return '<div class="ln"><div class="a">'+(i+1)+'. '+esc(g.t||'Gambar')+'</div><div class="u">'+esc(g.u)+'</div><div class="mini"><button class="mb g" data-k="gi" data-i="'+i+'">Salin</button></div></div>'}).join('');
$('p-lnk').innerHTML=L;
document.addEventListener('click',function(e){
 var el=e.target;
 while(el&&el!==document&&!(el.dataset&&(el.dataset.k||el.dataset.t)))el=el.parentNode;
 if(!el||el===document)return;
 var d=el.dataset;
 if(d.t){var all=document.querySelectorAll('.tb'),k;for(k=0;k<all.length;k++)all[k].classList.toggle('on',all[k]===el);
  ['vid','img','lnk'].forEach(function(n){var p=$('p-'+n);if(p)p.classList.toggle('on',n===d.t)});return}
 var r=it[+d.i],g=im[+d.i];
 if(d.k==='a')copy(P+'playaudio '+r.u,'perintah audio');
 else if(d.k==='v')copy(P+'playvideo '+r.u,'perintah video');
 else if(d.k==='g')copy(P+'playimg '+CFG.q,'perintah gambar');
 else if(d.k==='l')copy(r.u,'tautan');
 else if(d.k==='gi')copy(g.u,'tautan gambar');
 else if(d.k==='gp')copy(g.pg,'tautan sumber');
});
})();
</script>
`;

// items: [{ t, m, d, u, th }], imgs: [{ t, u, pg, th }]  (th = data URI atau '')
function buildPlay2Html({ playerName = "Kamu", q = "", link = false, prefix = ".", items = [], imgs = [] } = {}) {
  return BODY
    .replace("__BASECSS__", () => BASE_CSS)
    .replace("__CFG__", () => safeJson({ nama: String(playerName), q: String(q), link: !!link, prefix: String(prefix), items, imgs }));
}

module.exports = { buildPlay2Html };
