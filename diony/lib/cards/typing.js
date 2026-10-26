/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Kartu HTML statis: TYPING TEST LIVE — Tes kecepatan mengetik (WPM & akurasi), mode 30/60 detik
const { BASE_CSS, safeJson } = require("../htmlcard");

const BODY = String.raw`
<style>
__BASECSS__
.tx{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px;font-size:16px;line-height:1.7;font-family:ui-monospace,Menlo,Consolas,monospace;word-break:break-word;min-height:120px;margin:10px 0}
.tx span.ok{color:#4ade80}.tx span.bad{color:#f87171;background:#7f1d1d55;border-radius:3px}.tx span.cur{border-bottom:2px solid var(--acc);color:#fff}
.st{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
.pill{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:7px 4px;font-size:10px;color:var(--soft);text-align:center}.pill b{display:block;font-size:18px;color:var(--ink)}
.res{text-align:center;padding:10px;font-weight:800;color:var(--acc);min-height:22px}
</style>
<div class="stage"><div class="app">
 <div class="top"><div class="logo">⌨️</div><div class="meta"><div class="title">Typing Test Live</div><div class="sub" id="who"></div></div></div>
 <div class="chips" id="md"><button class="chip on" data-s="30">30 detik</button><button class="chip" data-s="60">60 detik</button></div>
 <div class="st"><div class="pill">WPM<b id="wp">0</b></div><div class="pill">Akurasi<b id="ac">100%</b></div><div class="pill">Waktu<b id="tm">30</b></div><div class="pill">Rekor<b id="bs">0</b></div></div>
 <div class="tx" id="tx"></div>
 <textarea class="inp" id="in" rows="2" placeholder="Ketik di sini untuk mulai..." autocapitalize="off" autocomplete="off" autocorrect="off" spellcheck="false"></textarea>
 <div class="res" id="rs"></div>
 <button class="btn" style="width:100%" id="rt">⟳ Ulang</button>
</div></div>
<script>
(function(){
var CFG=__CFG__;document.getElementById('who').textContent='Pemain: '+CFG.nama;
var $=function(i){return document.getElementById(i)};
var P='yang dan untuk dengan tidak ini itu dari pada ada akan bisa saya kamu kita mereka rumah makan minum belajar bermain bekerja sekolah teman pagi siang malam hari bulan tahun cepat lambat besar kecil indah cantik tampan baik buruk senang sedih marah takut berani sabar rajin malas pintar bodoh kuat lemah tinggi rendah jauh dekat panas dingin basah kering baru lama muda tua air api tanah angin hujan matahari bintang laut gunung hutan sungai jalan kota desa pasar toko buku kertas pensil meja kursi pintu jendela lampu mobil motor sepeda kereta pesawat kapal'.split(' ');
var T,typed,sec=30,left,iv,started,done,best={};
try{best=JSON.parse(localStorage.getItem('pix_typing')||'{}');}catch(e){}
function gen(){var a=[];for(var i=0;i<70;i++)a.push(P[Math.floor(Math.random()*P.length)]);return a.join(' ');}
function reset(){clearInterval(iv);T=gen();typed='';started=false;done=false;left=sec;$('in').value='';$('in').disabled=false;$('rs').textContent='';$('wp').textContent=0;$('ac').textContent='100%';$('tm').textContent=sec;$('bs').textContent=best[sec]||0;render();}
function render(){var h='';for(var i=0;i<T.length;i++){var ch=T[i]===' '?'&nbsp;':T[i],cls='';if(i<typed.length)cls=typed[i]===T[i]?'ok':'bad';else if(i===typed.length)cls='cur';h+='<span class="'+cls+'">'+ch+'</span>';}$('tx').innerHTML=h;}
function stats(){var ok=0;for(var i=0;i<typed.length;i++)if(typed[i]===T[i])ok++;var el=Math.max(1,sec-left),w=Math.round((ok/5)/(el/60)),a=typed.length?Math.round(ok*100/typed.length):100;return {w:w,a:a};}
function end(){clearInterval(iv);done=true;$('in').disabled=true;var s=stats();$('wp').textContent=s.w;$('ac').textContent=s.a+'%';
 var nb=s.w>(best[sec]||0);if(nb){best[sec]=s.w;try{localStorage.setItem('pix_typing',JSON.stringify(best));}catch(e){}$('bs').textContent=s.w;}
 var rank=s.w>=80?'Dewa Ketik':s.w>=60?'Jago':s.w>=40?'Lumayan':s.w>=25?'Pemula':'Santai dulu';
 $('rs').textContent=s.w+' WPM • akurasi '+s.a+'% • '+rank+(nb?' • REKOR BARU!':'');}
$('in').addEventListener('input',function(){if(done)return;typed=this.value;if(!started){started=true;iv=setInterval(function(){left--;$('tm').textContent=left;var s=stats();$('wp').textContent=s.w;$('ac').textContent=s.a+'%';if(left<=0)end();},1000);}
 if(typed.length>=T.length)end();else{var s=stats();$('wp').textContent=s.w;$('ac').textContent=s.a+'%';}render();});
$('rt').onclick=reset;
$('md').onclick=function(e){var s=e.target.dataset&&e.target.dataset.s;if(!s)return;sec=+s;[].forEach.call($('md').children,function(x){x.classList.toggle('on',x===e.target)});reset();};
reset();
})();
</script>
`;

function buildTypingHtml({ playerName = "Kamu" } = {}) {
  return BODY.replace("__BASECSS__", () => BASE_CSS).replace("__CFG__", () => safeJson({ nama: String(playerName) }));
}

module.exports = { buildTypingHtml };
