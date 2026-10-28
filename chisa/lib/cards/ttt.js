/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Kartu HTML statis: TIC TAC TOE widget (kamu = O hijau, AI = X putih) — dibuka lewat tombol "Click Me".
// Tampilan: judul + "Melawan AI", giliran + skor (Kamu/Seri/AI), papan 3x3, 4 tingkat lawan, "Ulang papan".
const { BASE_CSS } = require("../htmlcard");

const BODY = String.raw`
<style>
__BASECSS__
html,body{min-height:0}
.wg{background:#0b1015;color:#e8edf2;font-family:var(--sys);padding:18px 16px 22px;user-select:none;-webkit-user-select:none}
.hd{display:flex;justify-content:space-between;align-items:baseline;padding-bottom:12px;border-bottom:1px solid #1f2933}
.tt{font-size:20px;font-weight:700}.mv{font-size:13px;color:#8693a1}
.sr{display:flex;justify-content:space-between;align-items:center;margin:14px 0 12px;font-size:15px}
.st{display:flex;align-items:center;gap:8px;color:#cfd7df}.dot{width:12px;height:12px;border-radius:50%;background:#fff}
.sc{font-size:13px;color:#8693a1}.sc b{color:#fff;margin:0 8px 0 3px}
.bd{display:grid;grid-template-columns:repeat(3,1fr);background:#111b23;border:1px solid #1f2d38;border-radius:14px;padding:10px}
.ce{aspect-ratio:1;display:flex;align-items:center;justify-content:center;cursor:pointer;border-right:1px solid #26343f;border-bottom:1px solid #26343f}
.ce:nth-child(3n){border-right:0}.ce:nth-child(n+7){border-bottom:0}
.ce svg{width:46%;height:46%}.ce.w{background:#0f2a24;border-radius:12px}
.lb{margin:16px 0 8px;font-size:13px;color:#8693a1}
.lv{display:flex;gap:8px;flex-wrap:wrap}
.lc{padding:11px 17px;border-radius:24px;border:1px solid #26343f;color:#cfd7df;font-size:15px;cursor:pointer}
.lc.on{background:#00a884;border-color:#00a884;color:#fff;font-weight:600}
.rs{text-align:center;color:#00c39a;font-size:16px;margin-top:22px;cursor:pointer}
</style>
<div class="wg">
 <div class="hd"><div class="tt">__NAMA__ TicTacToe</div><div class="mv">Melawan AI</div></div>
 <div class="sr"><div class="st"><span class="dot"></span><span id="ts">Giliranmu</span></div>
  <div class="sc">Kamu<b id="a">0</b> Seri<b id="d">0</b> AI<b id="c">0</b></div></div>
 <div class="bd" id="bd"></div>
 <div class="lb">Tingkat lawan</div><div class="lv" id="lv"></div>
 <div class="rs" id="rs">Ulang papan</div>
</div>
<script>
(function(){
var $=function(i){return document.getElementById(i)};
var LN=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
var O='<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="38" fill="none" stroke="#00b386" stroke-width="13"/></svg>';
var X='<svg viewBox="0 0 100 100"><path d="M14 14L86 86M86 14L14 86" stroke="#f1f3f5" stroke-width="13" stroke-linecap="round"/></svg>';
var NV=['Pemula','Terlatih','Taktisi','Master'],RND=[.85,.5,.2,0];
var b,over,lvl=0,sc={a:0,d:0,c:0},cells=[];
NV.forEach(function(n,i){var e=document.createElement('div');e.className='lc'+(i===lvl?' on':'');e.textContent=n;
 e.onclick=function(){lvl=i;var k=$('lv').children;for(var j=0;j<4;j++)k[j].className='lc'+(j===i?' on':'');reset()};$('lv').appendChild(e)});
for(var i=0;i<9;i++){(function(i){var e=document.createElement('div');e.className='ce';e.onclick=function(){play(i)};$('bd').appendChild(e);cells.push(e)})(i)}
function win(bd){for(var i=0;i<8;i++){var l=LN[i];if(bd[l[0]]&&bd[l[0]]===bd[l[1]]&&bd[l[0]]===bd[l[2]])return l}return null}
function full(bd){for(var i=0;i<9;i++)if(!bd[i])return false;return true}
function mm(bd,p){var w=win(bd);if(w)return{s:bd[w[0]]==='X'?1:-1};if(full(bd))return{s:0};
 var bs=p==='X'?-2:2,bm=-1;for(var i=0;i<9;i++)if(!bd[i]){bd[i]=p;var r=mm(bd,p==='X'?'O':'X').s;bd[i]='';if(p==='X'?r>bs:r<bs){bs=r;bm=i}}return{s:bs,m:bm}}
function render(){var w=win(b);for(var i=0;i<9;i++){cells[i].innerHTML=b[i]==='O'?O:b[i]==='X'?X:'';cells[i].className='ce'+(w&&w.indexOf(i)>-1?' w':'')}
 $('a').textContent=sc.a;$('d').textContent=sc.d;$('c').textContent=sc.c}
function reset(){b=['','','','','','','','',''];over=false;$('ts').textContent='Giliranmu';render()}
function end(){var w=win(b);over=true;if(w&&b[w[0]]==='O'){sc.a++;$('ts').textContent='Kamu menang!'}else if(w){sc.c++;$('ts').textContent='AI menang'}else{sc.d++;$('ts').textContent='Seri'}render()}
function play(i){if(over){reset();return}if(b[i])return;b[i]='O';if(win(b)||full(b)){end();return}
 var f=[],m;for(var k=0;k<9;k++)if(!b[k])f.push(k);
 m=Math.random()<RND[lvl]?f[Math.floor(Math.random()*f.length)]:mm(b,'X').m;
 b[m]='X';if(win(b)||full(b)){end();return}render();$('ts').textContent='Giliranmu'}
$('rs').onclick=reset;reset();
})();
</script>
`;

function buildTttHtml({ botName = "Chisa AI" } = {}) {
  return BODY.replace("__BASECSS__", () => BASE_CSS).replace("__NAMA__", () => String(botName).replace(/[<>&]/g, ""));
}
module.exports = { buildTttHtml };
