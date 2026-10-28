/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Kartu HTML statis: CHISA MUSIK (daftar lagu bisa di-scroll pakai tombol ▲ ▼, cari, pilih lagu).
// Semua data & gambar ditanam di HTML (data URI), tanpa fetch/jaringan. By PIX.
const { BASE_CSS, safeJson, escapeHtml } = require("../htmlcard");

const BODY = String.raw`
<style>
__BASECSS__
.app{padding:0;background:#10121a}
.bgl{position:absolute;inset:0;background-size:cover;background-position:center;opacity:.5;pointer-events:none}
.shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(10,12,18,.35) 0%,rgba(10,12,18,.82) 45%,#0b0d13 100%);pointer-events:none}
.in{position:relative;padding:14px 12px 14px}
.th{background-color:#2a2f3c;background-size:cover;background-position:center;background-image:__THUMB__}
.hd{display:flex;gap:11px;align-items:center;margin-bottom:12px}
.hd .th{width:58px;height:58px;border-radius:14px;flex:none;box-shadow:0 6px 16px rgba(0,0,0,.5);border:1px solid #ffffff22}
.hd .t1{font-size:17px;font-weight:900;letter-spacing:.3px}
.hd .t2{font-size:11px;color:var(--soft);margin-top:3px}
.pill{display:inline-block;margin-top:5px;background:#ffffff14;border:1px solid #ffffff1f;border-radius:20px;padding:2px 9px;font-size:10px;font-weight:700;color:#e8d9a8}
.selx{display:flex;gap:10px;align-items:center;background:#ffffff10;border:1px solid #ffffff1c;border-radius:14px;padding:9px;margin-bottom:10px;backdrop-filter:blur(6px)}
.nm{font-size:13px;font-weight:800;line-height:1.25;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.ar{font-size:11px;color:var(--soft);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cmd{margin-top:5px;font-family:ui-monospace,Menlo,monospace;font-size:11px;color:#04130a;background:var(--acc);display:inline-block;border-radius:6px;padding:2px 8px;font-weight:800;cursor:pointer}
.srch{margin-bottom:8px;font-size:13px;padding:8px 12px}
.lw{display:flex;gap:8px;align-items:stretch}
.list{flex:1;min-width:0;height:276px;overflow-y:auto;scroll-behavior:smooth;scrollbar-width:none;border-radius:12px;background:#0b0d1388;border:1px solid #ffffff14}
.list::-webkit-scrollbar{display:none}
.it{display:flex;gap:10px;align-items:center;height:62px;padding:7px 9px;border-bottom:1px solid #ffffff0d;cursor:pointer}
.it.on{background:linear-gradient(90deg,#22c55e33,#22c55e08);box-shadow:inset 3px 0 0 var(--acc)}
.it .no{width:22px;flex:none;text-align:center;font-size:11px;font-weight:800;color:var(--soft)}
.it .th{width:44px;height:44px;border-radius:9px;flex:none}
.it .tx{min-width:0;flex:1}
.it .a{font-size:12.5px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.it .b{font-size:10.5px;color:var(--soft);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.nav{width:42px;flex:none;display:flex;flex-direction:column;gap:6px;align-items:center;justify-content:space-between}
.nb{width:42px;height:42px;border-radius:12px;border:1px solid #ffffff26;background:#ffffff14;color:#fff;font-size:17px;font-weight:900;cursor:pointer;display:flex;align-items:center;justify-content:center}
.nb:active{background:var(--acc);color:#04130a}
.nb[disabled]{opacity:.28;pointer-events:none}
.pos{flex:1;width:6px;border-radius:6px;background:#ffffff18;position:relative;margin:2px 0}
.pos i{position:absolute;left:0;right:0;top:0;height:30%;background:var(--acc);border-radius:6px;transition:top .15s}
.cnt{font-size:10.5px;color:var(--soft);text-align:center;margin-top:8px}
.empty{padding:26px 14px;text-align:center;color:var(--soft);font-size:12px;line-height:1.5}
.pl{background:#ffffff10;border:1px solid #ffffff1c;border-radius:14px;padding:10px;margin-bottom:10px;backdrop-filter:blur(6px)}
.pl .top2{display:flex;gap:10px;align-items:center}
.pl .th{width:54px;height:54px;border-radius:11px;flex:none}
.pl.go .th{animation:sp 6s linear infinite;border-radius:50%}
@keyframes sp{to{transform:rotate(360deg)}}
.seek{width:100%;margin:9px 0 2px;accent-color:#22c55e;height:18px}
.tm{display:flex;justify-content:space-between;font-size:10px;color:var(--soft)}
.ctl2{display:flex;align-items:center;justify-content:center;gap:14px;margin-top:6px}
.cb{width:40px;height:40px;border-radius:50%;border:1px solid #ffffff26;background:#ffffff14;color:#fff;font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center}
.cb.big{width:52px;height:52px;background:var(--acc);color:#04130a;font-size:20px;border-color:var(--acc)}
.cb:active{transform:scale(.92)}
.vol{display:flex;align-items:center;gap:8px;margin-top:9px;font-size:11px;color:var(--soft)}
.vol input{flex:1;accent-color:#22c55e}
.vol b{width:34px;text-align:right;color:#fff}
.eq{display:inline-flex;gap:2px;align-items:flex-end;height:11px;width:14px;flex:none}
.eq i{width:3px;background:var(--acc);border-radius:1px;animation:eq .8s ease-in-out infinite}
.eq i:nth-child(2){animation-delay:.2s}.eq i:nth-child(3){animation-delay:.4s}
@keyframes eq{0%,100%{height:3px}50%{height:11px}}
.it.lock{opacity:.5}
.it.lock .no:after{content:'🔒';font-size:9px;display:block}
.mode{display:flex;justify-content:center;gap:8px;margin-top:8px}
.mb{border:1px solid #ffffff26;background:#ffffff10;color:#cfd5e2;border-radius:16px;padding:4px 10px;font-size:11px;font-weight:800;cursor:pointer}
.mb.on{background:var(--acc);color:#04130a;border-color:var(--acc)}
.st{min-height:14px;text-align:center;font-size:10.5px;color:#e8d9a8;margin-top:6px}
.st.err{color:#fca5a5}
.it .hot{color:#f87171;font-size:11px;flex:none}
.it .dur{font-size:10px;color:var(--soft);flex:none}
.toast{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);background:#000c;color:#fff;padding:8px 14px;border-radius:20px;font-size:12px;opacity:0;transition:opacity .2s;pointer-events:none}.toast.on{opacity:1}
</style>
<div class="stage"><div class="app">
 <div class="bgl" style="background-image:__BG__"></div><div class="shade"></div>
 <div class="in">
  <div class="hd"><div class="th"></div><div class="meta"><div class="t1">CHISA AI MUSIK</div><div class="t2" id="who"></div><span class="pill" id="tot"></span></div></div>
  <div class="pl" id="pl"><div class="top2"><div class="th"></div><div style="min-width:0;flex:1"><div class="nm" id="snm">Pilih lagu lalu tekan ▶</div><div class="ar" id="sar">Preview di kartu • lagu penuh dikirim sebagai audio</div></div></div>
   <input class="seek" id="seek" type="range" min="0" max="1000" value="0"><div class="tm"><span id="t1">0:00</span><span id="t2">0:00</span></div>
   <div class="ctl2"><button class="cb" id="pv" aria-label="Sebelumnya">⏮</button><button class="cb big" id="pp" aria-label="Putar">▶</button><button class="cb" id="nx" aria-label="Berikutnya">⏭</button></div>
   <div class="st" id="st"></div>
   <div class="mode"><button class="mb" id="shf">🔀 Acak</button><button class="mb" id="rpt">🔁 Ulang: mati</button><button class="mb" id="spd">⚡ 1x</button><button class="mb" id="onl">🎧 Preview saja</button></div>
   <div class="vol"><span>🔈</span><input id="vol" type="range" min="0" max="100" value="100"><span>🔊</span><b id="vp">100%</b></div>
   <span class="cmd hide" id="scmd"></span></div>
  <input class="inp srch" id="q" placeholder="Cari judul / artis...">
  <div class="lw">
   <div class="list" id="list"></div>
   <div class="nav"><button class="nb" id="up" aria-label="Naik">▲</button><div class="pos"><i id="bar"></i></div><button class="nb" id="dn" aria-label="Turun">▼</button></div>
  </div>
  <div class="cnt" id="cnt"></div>
  <div class="muted" style="text-align:center;margin-top:6px">Tekan lagu untuk memutar • ▲ ▼ untuk menggulir • 🔒 = ketik .chisamusik &lt;no&gt; • ♥ = favoritmu • .dmp3 &lt;no&gt; kirim audio penuh</div>
 </div>
</div><div class="toast" id="toast"></div></div>
<script>var AUD=__AUD__;</script>
<script>
(function(){
var CFG=__CFG__,AUD_=AUD;
var $=function(i){return document.getElementById(i)};
$('who').textContent='Untuk: '+CFG.nama;
var nPlay=CFG.tracks.filter(function(t){return t.p}).length;
$('tot').textContent='♫ '+CFG.tracks.length+' lagu • '+nPlay+' preview di kartu';
var all=CFG.tracks.map(function(t,i){return {n:i+1,a:t.a,b:t.b,p:t.p,f:t.f,d:t.d}});
var shuffle=false,repeat=0,speeds=[1,1.25,1.5,0.75],spi=0,only=false,blobUrl=null,wd=null,q0='';
var view=all.slice(),cur=-1,loaded=-1,H=62,au=new Audio();au.preload='auto';
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function fmt(x){if(!isFinite(x))return '0:00';x=Math.floor(x);return Math.floor(x/60)+':'+('0'+(x%60)).slice(-2)}
function toast(s){var t=$('toast');t.textContent=s;t.classList.add('on');setTimeout(function(){t.classList.remove('on');},2000);}
function render(){
 var L=$('list');
 if(!view.length){L.innerHTML='<div class="empty">'+(all.length?'Tidak ada lagu yang cocok.':'Belum ada lagu terbaca dari Google Drive.<br>Pastikan folder dibagikan ke "Siapa saja yang memiliki link", lalu ketik <b>.chisamusik refresh</b>.')+'</div>';upd();return;}
 L.innerHTML=view.map(function(t){var on=t.n-1===cur;return '<div class="it'+(on?' on':'')+(t.p?'':' lock')+'" data-n="'+t.n+'"><div class="no">'+(on&&!au.paused?'<span class="eq"><i></i><i></i><i></i></span>':t.n)+'</div><div class="th"></div><div class="tx"><div class="a">'+esc(t.a)+'</div><div class="b">'+esc(t.b)+'</div></div>'+(t.f?'<span class="hot">♥</span>':'')+(t.d?'<span class="dur">'+esc(t.d)+'</span>':'')+'</div>';}).join('');
 upd();
}
function upd(){
 var L=$('list'),max=L.scrollHeight-L.clientHeight,p=max>0?L.scrollTop/max:0;
 $('up').disabled=L.scrollTop<=2;$('dn').disabled=max<=2||L.scrollTop>=max-2;
 var f=Math.max(1,Math.min(view.length,Math.floor(L.scrollTop/H)+1)),l=Math.min(view.length,Math.ceil((L.scrollTop+L.clientHeight)/H));
 $('cnt').textContent=view.length?('Menampilkan '+f+'–'+l+' dari '+view.length):'';
 var bar=$('bar'),h=view.length?Math.min(100,Math.max(12,L.clientHeight/(view.length*H)*100)):100;bar.style.height=h+'%';bar.style.top=(p*(100-h))+'%';
}
function step(d){var L=$('list');L.scrollTop=L.scrollTop+d*H*3;setTimeout(upd,350);}
$('up').onclick=function(){step(-1)};$('dn').onclick=function(){step(1)};
$('list').addEventListener('scroll',upd);
document.addEventListener('keydown',function(e){if(e.target&&e.target.id==='q')return;if(e.key==='ArrowDown'){e.preventDefault();step(1);}if(e.key==='ArrowUp'){e.preventDefault();step(-1);}if((e.key==='ArrowRight'||e.key==='ArrowLeft')&&au.duration){au.currentTime=Math.max(0,Math.min(au.duration,au.currentTime+(e.key==='ArrowRight'?5:-5)));}if(e.key===' '&&cur>=0){e.preventDefault();toggle();}});
function setUi(){var on=!au.paused&&!au.error;$('pp').textContent=on?'⏸':'▶';$('pl').classList.toggle('go',on);render();}
function stat(x,err){var e=$('st');e.textContent=x||'';e.classList.toggle('err',!!err);}
function srcOf(i){
 var d=AUD_[String(i)];
 try{var k=d.indexOf(','),bin=atob(d.slice(k+1)),u=new Uint8Array(bin.length);for(var j=0;j<bin.length;j++)u[j]=bin.charCodeAt(j);
  if(blobUrl)URL.revokeObjectURL(blobUrl);blobUrl=URL.createObjectURL(new Blob([u],{type:'audio/mpeg'}));return blobUrl;}catch(x){return d;}
}
function play(i,tryData){
 var t=CFG.tracks[i];if(!t)return;
 if(!t.p){var c=$('scmd');c.textContent=CFG.prefix+'chisamusik '+(i+1);c.classList.remove('hide');$('snm').textContent=t.a;$('sar').textContent=t.b;stat('Lagu ini belum punya preview di kartu',1);toast('Ketik '+c.textContent+' untuk menerima lagunya sebagai audio');return;}
 $('scmd').classList.add('hide');cur=i;$('snm').textContent=t.a;$('sar').textContent=t.b;
 clearTimeout(wd);stat('Memuat preview...');
 au.src=tryData?AUD_[String(i)]:srcOf(i);loaded=i;au.volume=$('vol').value/100;au.playbackRate=speeds[spi];
 // pengawal: bila 5 detik belum ada suara, coba cara lain (data URI), lalu beri tahu pemakai dengan jelas
 wd=setTimeout(function(){if(loaded!==i)return;if(!au.duration||au.currentTime===0&&au.paused===false&&au.readyState<3){
   if(!tryData){play(i,true);return;}
   try{au.pause();}catch(x){}setUi();stat('Pemutar kartu tidak didukung di perangkat ini. Ketik '+CFG.prefix+'dmp3 '+(i+1)+' untuk menerima audio-nya',1);}},5000);
 var pr=au.play();if(pr&&pr.catch)pr.catch(function(){if(!tryData){play(i,true);return;}stat('Audio tidak bisa diputar. Ketik '+CFG.prefix+'dmp3 '+(i+1)+' untuk audio-nya',1);setUi();});
 setUi();
}
function nextIdx(d){
 var n=CFG.tracks.length,ok=[],j;for(j=0;j<n;j++)if(CFG.tracks[j].p)ok.push(j);if(!ok.length)return -1;
 if(shuffle&&ok.length>1){var r;do{r=ok[Math.floor(Math.random()*ok.length)];}while(r===cur);return r;}
 var k=cur<0?(d>0?-1:0):cur;for(j=1;j<=n;j++){var x=((k+d*j)%n+n)%n;if(CFG.tracks[x].p)return x;}return -1;
}
function toggle(){if(cur<0||loaded!==cur){var f=(cur>=0&&CFG.tracks[cur].p)?cur:nextIdx(1);if(f>=0)play(f);else toast('Belum ada lagu siap putar');return;}if(au.paused){var pr=au.play();if(pr&&pr.catch)pr.catch(function(){});}else au.pause();}
$('pp').onclick=toggle;
$('nx').onclick=function(){var x=nextIdx(1);if(x>=0)play(x);};
$('pv').onclick=function(){if(au.currentTime>4){au.currentTime=0;return;}var x=nextIdx(-1);if(x>=0)play(x);};
au.addEventListener('play',setUi);au.addEventListener('pause',setUi);au.addEventListener('playing',function(){clearTimeout(wd);stat('');setUi();});au.addEventListener('waiting',function(){stat('Memuat...');});au.addEventListener('loadedmetadata',function(){$('t2').textContent=fmt(au.duration);});
au.addEventListener('ended',function(){if(repeat===2){au.currentTime=0;au.play();return;}var x=nextIdx(1);if(repeat===0&&!shuffle&&x<=cur&&x>=0){setUi();stat('Playlist selesai');return;}if(x>=0)play(x);});
au.addEventListener('error',function(){if(loaded>=0&&au.src.indexOf('blob:')===0){play(loaded,true);return;}clearTimeout(wd);stat('Audio gagal dimuat. Ketik '+CFG.prefix+'dmp3 '+(loaded+1)+' untuk menerima audio-nya',1);setUi();});
var seeking=false;
au.addEventListener('timeupdate',function(){if(!seeking&&au.duration)$('seek').value=Math.round(au.currentTime/au.duration*1000);$('t1').textContent=fmt(au.currentTime);$('t2').textContent=fmt(au.duration);});
$('seek').addEventListener('input',function(){seeking=true;if(au.duration)$('t1').textContent=fmt(this.value/1000*au.duration);});
$('seek').addEventListener('change',function(){if(au.duration)au.currentTime=this.value/1000*au.duration;seeking=false;});
$('vol').addEventListener('input',function(){au.volume=this.value/100;$('vp').textContent=this.value+'%';});
function applyView(){var s=q0;view=all.filter(function(t){return (!only||t.p)&&(!s||(t.a+' '+t.b).toLowerCase().indexOf(s)>=0);});$('list').scrollTop=0;render();}
$('shf').onclick=function(){shuffle=!shuffle;this.classList.toggle('on',shuffle);toast(shuffle?'Acak: nyala':'Acak: mati');};
$('rpt').onclick=function(){repeat=(repeat+1)%3;this.textContent=['🔁 Ulang: mati','🔁 Ulang: semua','🔂 Ulang: satu'][repeat];this.classList.toggle('on',repeat>0);};
$('spd').onclick=function(){spi=(spi+1)%speeds.length;au.playbackRate=speeds[spi];this.textContent='⚡ '+speeds[spi]+'x';this.classList.toggle('on',spi>0);};
$('onl').onclick=function(){only=!only;this.classList.toggle('on',only);applyView();};
$('scmd').onclick=function(){var s=this.textContent;try{navigator.clipboard.writeText(s).then(function(){toast('Disalin: '+s)},function(){toast('Ketik: '+s)});}catch(x){toast('Ketik: '+s);}};
$('list').addEventListener('click',function(e){var el=e.target;while(el&&el!==this&&!(el.dataset&&el.dataset.n))el=el.parentNode;if(!el||el===this)return;var i=+el.dataset.n-1;if(i===cur&&CFG.tracks[i].p){toggle();return;}play(i);});
$('q').addEventListener('input',function(){q0=this.value.trim().toLowerCase();applyView();});
var first=CFG.start>=0?CFG.start:-1;if(first>=0){cur=first;$('snm').textContent=CFG.tracks[first].a;$('sar').textContent=CFG.tracks[first].b;}
render();
})();
</script>
`;

function buildMusikHtml({ playerName = "Kamu", tracks = [], prefix = ".", thumbUri = null, bgUri = null, audio = new Map(), start = -1, favIds = [] } = {}) {
  const fav = new Set(favIds), data = tracks.map((t, i) => ({ a: t.title, b: t.artist, p: audio.has(i) ? 1 : 0, f: fav.has(t.id) ? 1 : 0, d: t.dur || "" }));
  const aud = {};
  for (const [i, b64] of audio) aud[i] = "data:audio/mpeg;base64," + b64;
  const css = (u) => (u ? `url('${u}')` : "linear-gradient(135deg,#3a3f52,#1b1e29)");
  return BODY
    .replace("__BASECSS__", () => BASE_CSS)
    .replace("__THUMB__", () => css(thumbUri))
    .replace("__BG__", () => css(bgUri))
    .replace("__AUD__", () => safeJson(aud))
    .replace("__CFG__", () => safeJson({ nama: String(playerName), prefix: String(prefix), start, tracks: data }));
}

module.exports = { buildMusikHtml, escapeHtml };
