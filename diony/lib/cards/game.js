/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Kartu HTML statis: GAME LIVE (2048, Snake, XO lawan bot, Tebak Angka) - main langsung di dalam chat
const { BASE_CSS, safeJson } = require("../htmlcard");

const BODY = String.raw`
<style>
__BASECSS__
.pane{display:none;}.pane.on{display:block;}
.hd{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:12px;color:var(--soft);}
.hd b{color:var(--ink);font-size:15px;}
.g2048{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;background:#2a2f3a;padding:6px;border-radius:12px;touch-action:none;}
.t{aspect-ratio:1;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:22px;background:#3a404d;color:#fff;}
.dp{display:grid;grid-template-columns:repeat(3,56px);grid-template-rows:repeat(2,44px);gap:6px;justify-content:center;margin-top:10px;}
.dp button{border-radius:10px;border:1px solid var(--line);background:var(--card2);color:var(--ink);font-size:18px;font-weight:800;}
.dp .u{grid-column:2;}.dp .l{grid-row:2;grid-column:1;}.dp .d{grid-row:2;grid-column:2;}.dp .r{grid-row:2;grid-column:3;}
canvas{display:block;width:100%;background:#12151b;border:1px solid var(--line);border-radius:12px;}
.xo{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;}
.xo button{aspect-ratio:1;border-radius:12px;border:1px solid var(--line);background:var(--card);font-size:34px;font-weight:900;color:var(--ink);}
.xo button.x{color:#60a5fa;}.xo button.o{color:#f87171;}
.msg{margin:10px 0 0;text-align:center;font-size:13px;font-weight:700;min-height:18px;}
.center{text-align:center;}
</style>
<div class="stage"><div class="app">
  <div class="top"><div class="logo">🎮</div><div class="meta"><div class="title">Game Live</div><div class="sub" id="who"></div></div></div>
  <div class="chips" id="tabs"></div>

  <div class="pane on" id="p0">
    <div class="hd"><span>Skor <b id="s0">0</b></span><span>Terbaik <b id="b0">0</b></span><button class="btn alt" id="n0" style="padding:6px 10px">Baru</button></div>
    <div class="g2048" id="bd"></div>
    <div class="dp"><button class="u" data-m="u">&uarr;</button><button class="l" data-m="l">&larr;</button><button class="d" data-m="d">&darr;</button><button class="r" data-m="r">&rarr;</button></div>
    <div class="msg" id="m0">Geser papan atau tekan panah</div>
  </div>

  <div class="pane" id="p1">
    <div class="hd"><span>Skor <b id="s1">0</b></span><span>Terbaik <b id="b1">0</b></span><button class="btn alt" id="n1" style="padding:6px 10px">Main</button></div>
    <canvas id="cv" width="300" height="300"></canvas>
    <div class="dp"><button class="u" data-s="u">&uarr;</button><button class="l" data-s="l">&larr;</button><button class="d" data-s="d">&darr;</button><button class="r" data-s="r">&rarr;</button></div>
    <div class="msg" id="m1">Tekan Main</div>
  </div>

  <div class="pane" id="p2">
    <div class="hd"><span>Kamu <b>X</b> · Bot <b>O</b></span><span>Menang <b id="w2">0</b> · Seri <b id="d2">0</b> · Kalah <b id="l2">0</b></span></div>
    <div class="xo" id="xo"></div>
    <div class="msg" id="m2">Giliranmu</div>
    <div class="center" style="margin-top:8px"><button class="btn alt" id="n2">Ulang</button></div>
  </div>

  <div class="pane" id="p3">
    <div class="box center"><div class="muted">Tebak angka 1 - 100</div><div style="font-size:13px;margin:6px 0">Sisa nyawa: <b id="lv">7</b></div>
    <div class="row"><input class="inp" id="gn" type="number" inputmode="numeric" placeholder="Angka..."><button class="btn" id="gb">Tebak</button></div>
    <div class="msg" id="m3">Aku sudah memilih angka...</div><button class="btn alt" id="n3" style="margin-top:8px">Main lagi</button></div>
  </div>
</div></div>
<script>
(function(){
var C=__CFG__;var $=function(i){return document.getElementById(i);};
$('who').textContent='Pemain: '+C.nama;
var names=['2048','Snake','XO','Tebak'],cur=0;
function tabs(){var h='';names.forEach(function(n,i){h+='<button class="chip'+(i===cur?' on':'')+'" data-i="'+i+'">'+n+'</button>';});$('tabs').innerHTML=h;
 var b=$('tabs').children;for(var j=0;j<b.length;j++){b[j].onclick=function(){cur=+this.getAttribute('data-i');for(var k=0;k<4;k++)$('p'+k).classList.toggle('on',k===cur);if(cur!==1)snakeStop();tabs();};}}
tabs();

/* ================= 2048 ================= */
var B,S=0,BEST=0,over=false;
var COL={0:'#3a404d',2:'#eee4da;color:#776e65',4:'#ede0c8;color:#776e65',8:'#f2b179',16:'#f59563',32:'#f67c5f',64:'#f65e3b',128:'#edcf72',256:'#edcc61',512:'#edc850',1024:'#edc53f',2048:'#edc22e'};
function rnd(a){return a[Math.floor(Math.random()*a.length)];}
function add(){var e=[];for(var i=0;i<16;i++)if(!B[i])e.push(i);if(e.length)B[rnd(e)]=Math.random()<0.9?2:4;}
function reset(){B=[];for(var i=0;i<16;i++)B.push(0);S=0;over=false;add();add();draw();$('m0').textContent='Geser papan atau tekan panah';}
function draw(){var h='';B.forEach(function(v){var st=COL[v]||'#3c3a32;color:#fff';var fs=v>=1024?16:v>=128?19:22;h+='<div class="t" style="background:'+st+';font-size:'+fs+'px">'+(v||'')+'</div>';});$('bd').innerHTML=h;$('s0').textContent=S;if(S>BEST)BEST=S;$('b0').textContent=BEST;}
function line(a){var r=a.filter(function(x){return x;}),o=[];for(var i=0;i<r.length;i++){if(r[i]===r[i+1]){o.push(r[i]*2);S+=r[i]*2;i++;}else o.push(r[i]);}while(o.length<4)o.push(0);return o;}
function move(d){if(over)return;var nb=B.slice(),i,j,l;
 for(i=0;i<4;i++){var idx=[];for(j=0;j<4;j++)idx.push(d==='l'?i*4+j:d==='r'?i*4+3-j:d==='u'?j*4+i:(3-j)*4+i);
  l=line(idx.map(function(k){return B[k];}));idx.forEach(function(k,n){nb[k]=l[n];});}
 if(nb.join()===B.join())return;B=nb;add();draw();
 if(B.indexOf(2048)>-1)$('m0').textContent='🎉 2048! Lanjut terus?';
 if(!can()){over=true;$('m0').textContent='Game over! Skor '+S;}}
function can(){for(var i=0;i<16;i++){if(!B[i])return true;var r=i%4,c=(i-r)/4;if(r<3&&B[i]===B[i+1])return true;if(c<3&&B[i]===B[i+4])return true;}return false;}
var ds=$('p0').querySelectorAll('[data-m]');for(var i=0;i<ds.length;i++)ds[i].onclick=function(){move(this.getAttribute('data-m'));};
$('n0').onclick=reset;
var sx=0,sy=0;$('bd').addEventListener('touchstart',function(e){sx=e.touches[0].clientX;sy=e.touches[0].clientY;},{passive:true});
$('bd').addEventListener('touchend',function(e){var dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;if(Math.max(Math.abs(dx),Math.abs(dy))<24)return;
 move(Math.abs(dx)>Math.abs(dy)?(dx>0?'r':'l'):(dy>0?'d':'u'));},{passive:true});
reset();

/* ================= SNAKE ================= */
var cv=$('cv'),cx=null;try{cx=cv.getContext('2d');}catch(e){}var N=15,CS=20,sn,dir,nd,food,ss=0,sb=0,siv=null,alive=false;
function sfood(){for(;;){var f={x:Math.floor(Math.random()*N),y:Math.floor(Math.random()*N)};if(!sn.some(function(s){return s.x===f.x&&s.y===f.y;}))return f;}}
function sdraw(){if(!cx)return;cx.fillStyle='#12151b';cx.fillRect(0,0,300,300);cx.fillStyle='#ef4444';cx.fillRect(food.x*CS+2,food.y*CS+2,CS-4,CS-4);
 sn.forEach(function(s,i){cx.fillStyle=i?'#22c55e':'#86efac';cx.fillRect(s.x*CS+1,s.y*CS+1,CS-2,CS-2);});}
function snakeStop(){alive=false;clearInterval(siv);}
function sstart(){if(!cx){$('m1').textContent='Canvas tidak didukung di sini';return;}sn=[{x:7,y:7},{x:6,y:7},{x:5,y:7}];dir='r';nd='r';food=sfood();ss=0;$('s1').textContent=0;alive=true;$('m1').textContent='Ayo!';sdraw();clearInterval(siv);siv=setInterval(stick,130);}
function stick(){if(!alive)return;dir=nd;var h={x:sn[0].x+(dir==='r'?1:dir==='l'?-1:0),y:sn[0].y+(dir==='d'?1:dir==='u'?-1:0)};
 if(h.x<0||h.y<0||h.x>=N||h.y>=N||sn.some(function(s){return s.x===h.x&&s.y===h.y;})){snakeStop();$('m1').textContent='Game over! Skor '+ss;return;}
 sn.unshift(h);if(h.x===food.x&&h.y===food.y){ss+=10;if(ss>sb)sb=ss;$('s1').textContent=ss;$('b1').textContent=sb;food=sfood();}else sn.pop();sdraw();}
var opp={u:'d',d:'u',l:'r',r:'l'};
var sb2=$('p1').querySelectorAll('[data-s]');for(var k=0;k<sb2.length;k++)sb2[k].onclick=function(){var d=this.getAttribute('data-s');if(d!==opp[dir])nd=d;};
$('n1').onclick=sstart;
sn=[{x:7,y:7}];food={x:3,y:3};sdraw();

/* ================= XO ================= */
var X,turn,wn=0,dr=0,ls=0,fin=false,LN=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
function win(b){for(var i=0;i<8;i++){var a=LN[i];if(b[a[0]]&&b[a[0]]===b[a[1]]&&b[a[0]]===b[a[2]])return b[a[0]];}return b.indexOf('')<0?'d':null;}
function mm(b,p){var w=win(b);if(w==='O')return 1;if(w==='X')return -1;if(w==='d')return 0;var best=p==='O'?-9:9;
 for(var i=0;i<9;i++)if(!b[i]){b[i]=p;var s=mm(b,p==='O'?'X':'O');b[i]='';if(p==='O'?s>best:s<best)best=s;}return best;}
function bot(){var best=-9,mv=[];for(var i=0;i<9;i++)if(!X[i]){X[i]='O';var s=mm(X,'X');X[i]='';if(s>best){best=s;mv=[i];}else if(s===best)mv.push(i);}
 return Math.random()<0.15?rnd(X.map(function(v,i){return v?-1:i;}).filter(function(i){return i>=0;})):rnd(mv);}
function xdraw(){var h='';X.forEach(function(v,i){h+='<button class="'+(v==='X'?'x':v==='O'?'o':'')+'" data-i="'+i+'">'+v+'</button>';});$('xo').innerHTML=h;
 var bs=$('xo').children;for(var j=0;j<9;j++)bs[j].onclick=function(){tap(+this.getAttribute('data-i'));};}
function xend(w){fin=true;if(w==='X'){wn++;$('m2').textContent='🎉 Kamu menang!';}else if(w==='O'){ls++;$('m2').textContent='Bot menang 🤖';}else{dr++;$('m2').textContent='Seri!';}$('w2').textContent=wn;$('d2').textContent=dr;$('l2').textContent=ls;}
function tap(i){if(fin||X[i])return;X[i]='X';xdraw();var w=win(X);if(w){xend(w);return;}X[bot()]='O';xdraw();w=win(X);if(w){xend(w);return;}$('m2').textContent='Giliranmu';}
function xreset(){X=['','','','','','','','',''];fin=false;$('m2').textContent='Giliranmu';xdraw();}
$('n2').onclick=xreset;xreset();

/* ================= TEBAK ANGKA ================= */
var sec,lv,gend;
function greset(){sec=1+Math.floor(Math.random()*100);lv=7;gend=false;$('lv').textContent=lv;$('m3').textContent='Aku sudah memilih angka...';$('gn').value='';}
$('gb').onclick=function(){if(gend)return;var g=parseInt($('gn').value,10);if(!(g>=1&&g<=100)){$('m3').textContent='Masukkan angka 1 - 100';return;}
 lv--;$('lv').textContent=lv;if(g===sec){gend=true;$('m3').textContent='🎉 Benar! Angkanya '+sec+' (sisa nyawa '+lv+')';}
 else if(lv<=0){gend=true;$('m3').textContent='Kalah! Angkanya '+sec;}else $('m3').textContent=g<sec?'Terlalu kecil ⬆️':'Terlalu besar ⬇️';$('gn').value='';};
$('n3').onclick=greset;greset();
})();
</script>
`;

function buildGameHtml({ playerName = "Pemain" } = {}) {
  return BODY.replace("__BASECSS__", () => BASE_CSS).replace("__CFG__", () => safeJson({ nama: String(playerName) }));
}

module.exports = { buildGameHtml };
