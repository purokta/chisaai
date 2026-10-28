/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Kartu HTML statis: POMODORO LIVE (timer fokus/istirahat, cincin progres, penghitung sesi, fokus hari ini). Tanpa jaringan.
const { BASE_CSS, safeJson } = require("../htmlcard");

const BODY = String.raw`
<style>
__BASECSS__
.ring{position:relative;width:200px;height:200px;margin:6px auto 10px}
.ring svg{width:200px;height:200px;transform:rotate(-90deg)}
.ring .bg{fill:none;stroke:#ffffff14;stroke-width:12}
.ring .fg{fill:none;stroke:var(--acc);stroke-width:12;stroke-linecap:round;transition:stroke-dashoffset .5s linear,stroke .3s}
.ring .mid{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.big{font-size:44px;font-weight:900;font-variant-numeric:tabular-nums;letter-spacing:1px}
.ph{font-size:12px;font-weight:800;color:var(--soft);letter-spacing:2px;text-transform:uppercase}
.modes{display:flex;gap:6px;margin-bottom:8px}.modes .chip{flex:1;text-align:center}
.ctl{display:flex;gap:8px;justify-content:center;margin:6px 0 10px}.ctl .btn{min-width:92px}
.dots{display:flex;gap:7px;justify-content:center;margin:2px 0 10px}
.dots i{width:12px;height:12px;border-radius:50%;background:#ffffff1c;border:1px solid #ffffff26}.dots i.on{background:var(--acc);border-color:var(--acc)}
.st{display:flex;gap:8px}.st .box{flex:1;text-align:center}.st b{display:block;font-size:20px}
.brk .fg{stroke:#38bdf8}
</style>
<div class="stage"><div class="app" id="app">
 <div class="top"><div class="logo">🍅</div><div class="meta"><div class="title">Pomodoro Live</div><div class="sub" id="who"></div></div></div>
 <div class="modes"><button class="chip on" data-m="25,5">25 / 5</button><button class="chip" data-m="50,10">50 / 10</button><button class="chip" data-m="15,3">15 / 3</button></div>
 <div class="ring"><svg viewBox="0 0 100 100"><circle class="bg" cx="50" cy="50" r="44"/><circle class="fg" id="fg" cx="50" cy="50" r="44" stroke-dasharray="276.46" stroke-dashoffset="0"/></svg>
  <div class="mid"><div class="big" id="t">25:00</div><div class="ph" id="ph">Fokus</div></div></div>
 <div class="dots" id="dots"><i></i><i></i><i></i><i></i></div>
 <div class="ctl"><button class="btn" id="go">▶ Mulai</button><button class="btn alt" id="rs">↺ Reset</button><button class="btn alt" id="sk">⏭ Lewati</button></div>
 <input class="inp" id="tk" placeholder="Sedang fokus ke apa? (opsional)" maxlength="60" style="margin-bottom:10px">
 <div class="st"><div class="box"><b id="n1">0</b><span class="muted">sesi selesai</span></div><div class="box"><b id="n2">0</b><span class="muted">menit fokus</span></div></div>
</div></div>
<script>
(function(){
var CFG=__CFG__,$=function(i){return document.getElementById(i)};
$('who').textContent='Untuk: '+CFG.nama;
var F=25*60,B=5*60,phase='f',left=F,total=F,run=false,iv=null,done=0,mins=0,cyc=0,C=2*Math.PI*44;
function fmt(s){return ('0'+Math.floor(s/60)).slice(-2)+':'+('0'+(s%60)).slice(-2)}
function beep(){try{var a=new (window.AudioContext||window.webkitAudioContext)(),o=a.createOscillator(),g=a.createGain();o.connect(g);g.connect(a.destination);o.frequency.value=880;g.gain.value=.15;o.start();setTimeout(function(){o.stop()},350)}catch(e){}}
function draw(){
 $('t').textContent=fmt(left);$('ph').textContent=phase==='f'?'Fokus':'Istirahat';
 $('fg').style.strokeDashoffset=String(C*(1-left/total));$('app').classList.toggle('brk',phase==='b');
 var d=$('dots').children;for(var i=0;i<4;i++)d[i].className=i<cyc?'on':'';
 $('go').textContent=run?'⏸ Jeda':'▶ Mulai';$('n1').textContent=done;$('n2').textContent=mins;
 document.title=fmt(left)+' • '+(phase==='f'?'Fokus':'Istirahat');
}
function tick(){
 left--;
 if(left<=0){beep();
  if(phase==='f'){done++;mins+=Math.round(F/60);cyc=Math.min(4,cyc+1);phase='b';total=left=B}
  else{phase='f';total=left=F;if(cyc>=4)cyc=0}
 }
 draw();
}
function setRun(v){run=v;clearInterval(iv);if(v)iv=setInterval(tick,1000);draw()}
$('go').onclick=function(){setRun(!run)};
$('rs').onclick=function(){setRun(false);phase='f';total=left=F;cyc=0;draw()};
$('sk').onclick=function(){var was=run;setRun(false);if(phase==='f'){phase='b';total=left=B}else{phase='f';total=left=F}draw();if(was)setRun(true)};
Array.prototype.forEach.call(document.querySelectorAll('.chip'),function(c){c.onclick=function(){
 Array.prototype.forEach.call(document.querySelectorAll('.chip'),function(x){x.classList.remove('on')});c.classList.add('on');
 var p=c.dataset.m.split(',');F=+p[0]*60;B=+p[1]*60;setRun(false);phase='f';total=left=F;cyc=0;draw()}});
draw();
})();
</script>
`;

function buildPomoHtml({ playerName = "Kamu" } = {}) {
  return BODY.replace("__BASECSS__", () => BASE_CSS).replace("__CFG__", () => safeJson({ nama: String(playerName) }));
}
module.exports = { buildPomoHtml };
