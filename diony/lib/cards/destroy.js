/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Kartu HTML statis: DESTROY ANY WEBSITE — demo pixel-art yang bisa dimainkan langsung di kartu
// (hancurkan "website" dengan pistol / shotgun / granat) + tombol ke game asli https://destroy.spritefusion.com/
// Semua jalan di dalam kartu, tanpa fetch (sandbox WA memblokir jaringan). Game asli: Sprite Fusion.
const { BASE_CSS, safeJson } = require("../htmlcard");

const BODY = String.raw`
<style>
__BASECSS__
:root{--px:#ffb703;--px2:#ff6b35;--cy:#4cc9f0;--pk:#ef476f;--ink2:#272727}
.app{background:linear-gradient(180deg,#2d2438 0%,#1d1a26 38%,#14131b 100%);padding:12px 11px 14px;border:2px solid #3a3350}
.hero{display:flex;align-items:center;gap:10px;margin-bottom:10px}
.badge{width:38px;height:38px;flex:none;border-radius:6px;background:var(--px2);box-shadow:inset -3px -3px 0 #c2410c,inset 3px 3px 0 #ffd0a8,0 3px 0 #7c2d12;display:flex;align-items:center;justify-content:center;font-size:21px;image-rendering:pixelated}
.ttl{font-family:ui-monospace,Menlo,Consolas,'Courier New',monospace;font-weight:900;font-size:15px;letter-spacing:.5px;line-height:1.1;text-transform:uppercase;color:#fff;text-shadow:2px 2px 0 #7c2d12}
.ttl em{font-style:normal;color:var(--px)}
.by{font-size:10px;color:#b9b2cc;margin-top:3px;font-family:ui-monospace,Menlo,Consolas,monospace}
.live{margin-left:auto;font-size:9px;font-weight:900;font-family:ui-monospace,monospace;color:#04130a;background:#a3e635;border-radius:4px;padding:3px 6px;box-shadow:0 2px 0 #4d7c0f;animation:bl 1.4s steps(2) infinite}
@keyframes bl{50%{opacity:.55}}
.win{border:2px solid #4b4363;border-radius:8px;overflow:hidden;background:#0e0d14;box-shadow:0 4px 0 #0a0910}
.bar{display:flex;align-items:center;gap:6px;background:#2b2640;padding:6px 8px;border-bottom:2px solid #4b4363}
.dots{display:flex;gap:4px}.dots i{width:8px;height:8px;border-radius:2px;display:block}
.dots i:nth-child(1){background:#ef476f}.dots i:nth-child(2){background:#ffd166}.dots i:nth-child(3){background:#06d6a0}
.url{flex:1;background:#14131b;border:1px solid #4b4363;border-radius:4px;color:#cbd5e1;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:10px;padding:3px 7px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.url b{color:var(--px)}
canvas{display:block;width:100%;background:#fdfdfd;touch-action:none;cursor:crosshair;image-rendering:pixelated}
.hud{display:flex;gap:6px;align-items:center;margin:9px 0 7px}
.pill{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:10.5px;font-weight:800;background:#241f33;border:2px solid #3a3350;border-radius:6px;padding:4px 8px;color:#e5def5}
.pill b{color:var(--px)}
.meter{flex:1;height:14px;background:#241f33;border:2px solid #3a3350;border-radius:6px;overflow:hidden;position:relative}
.meter>i{position:absolute;left:0;top:0;bottom:0;width:0;background:repeating-linear-gradient(90deg,var(--px2) 0 6px,#ff8f5c 6px 8px);transition:width .15s}
.wp{display:flex;gap:6px;margin-bottom:8px}
.wb{flex:1;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:10.5px;font-weight:900;color:#e5def5;background:#241f33;border:2px solid #3a3350;border-radius:6px;padding:7px 2px;cursor:pointer;box-shadow:0 3px 0 #0a0910;text-align:center}
.wb.on{background:var(--px);color:#2b1700;border-color:#ffd166;box-shadow:0 3px 0 #b45309}
.wb:active{transform:translateY(2px);box-shadow:0 1px 0 #0a0910}
.cta{display:block;text-align:center;text-decoration:none;font-family:ui-monospace,Menlo,Consolas,monospace;font-weight:900;font-size:13px;letter-spacing:.5px;color:#2b1700;background:linear-gradient(180deg,#ffd166,var(--px) 55%,var(--px2));border:2px solid #fff3c4;border-radius:8px;padding:11px 10px;box-shadow:0 4px 0 #9a3412,0 8px 18px rgba(255,107,53,.28);margin-top:4px}
.cta:active{transform:translateY(3px);box-shadow:0 1px 0 #9a3412}
.mode{display:flex;gap:6px;margin-top:9px}
.mode span{flex:1;text-align:center;font-size:10px;font-weight:800;color:#cfc7e6;background:#1d1a26;border:1px dashed #4b4363;border-radius:6px;padding:6px 2px}
.help{margin-top:9px;font-size:10.5px;color:#b9b2cc;line-height:1.55;text-align:center}
.help kbd{font-family:ui-monospace,monospace;font-size:9.5px;background:#2b2640;border:1px solid #4b4363;border-radius:3px;padding:1px 4px;color:#fff}
.lnk{margin-top:7px;text-align:center;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:10px;color:var(--cy);word-break:break-all}
.win.sh{animation:shk .18s linear}
@keyframes shk{0%{transform:translate(0,0)}25%{transform:translate(-3px,2px)}50%{transform:translate(3px,-2px)}75%{transform:translate(-2px,-1px)}100%{transform:translate(0,0)}}
.rst{font-family:ui-monospace,monospace;font-size:10.5px;font-weight:900;color:#e5def5;background:#241f33;border:2px solid #3a3350;border-radius:6px;padding:4px 8px;cursor:pointer;box-shadow:0 2px 0 #0a0910}
</style>
<div class="stage"><div class="app">
 <div class="hero">
  <div class="badge">💥</div>
  <div><div class="ttl">Destroy <em>Any</em> Website</div><div class="by" id="who"></div></div>
  <div class="live">DEMO</div>
 </div>
 <div class="win" id="win">
  <div class="bar"><div class="dots"><i></i><i></i><i></i></div><div class="url" id="url"></div></div>
  <canvas id="cv" width="340" height="300"></canvas>
 </div>
 <div class="hud">
  <span class="pill">Hancur <b id="sc">0</b></span>
  <div class="meter"><i id="mt"></i></div>
  <button class="rst" id="rs">⟳</button>
 </div>
 <div class="wp">
  <button class="wb on" data-w="0">1 PISTOL</button>
  <button class="wb" data-w="1">2 SHOTGUN</button>
  <button class="wb" data-w="2">3 GRANAT</button>
 </div>
 <a class="cta" id="go" href="#" target="_blank" rel="noopener">▶ MAINKAN GAME ASLI</a>
 <div class="mode"><span>🧍 SOLO</span><span>⚡ QUICK MATCH</span><span>👥 ROOM TEMAN</span></div>
 <div class="help">Tap / klik situs untuk menembak • <kbd>1</kbd><kbd>2</kbd><kbd>3</kbd> ganti senjata • <kbd>←</kbd><kbd>→</kbd> geser karakter<br>Di game asli kamu ketik alamat web apa saja, lalu semua teks, gambar, dan kotaknya jadi level yang bisa dihancurkan.</div>
 <div class="lnk" id="lk"></div>
</div></div>
<script>
(function(){
var CFG=__CFG__,$=function(i){return document.getElementById(i)};
$('who').textContent='by Sprite Fusion • Pemain: '+CFG.nama;
$('url').innerHTML='https://<b>'+CFG.host+'</b>';$('lk').textContent=CFG.url;$('go').href=CFG.url;
var cv=$('cv'),c=cv.getContext('2d'),W=340,H=300,S=6,CW=Math.floor(W/S),GY=H-26;
var cells,total,alive,deb,bul,gren,fx,pl,wp=0,cool=0,best=0,shake=0,done=false,flash=0,aim={x:W/2,y:80},tick=0;
try{best=+localStorage.getItem('pix_destroy')||0;}catch(e){}
// ── bangun "website" dari persegi panjang berwarna lalu pecah jadi blok ──
function build(){
 var R=[],g=[];
 function rc(x,y,w,h,col){R.push([x,y,w,h,col]);}
 rc(0,0,W,30,'#1f2937');rc(10,9,46,12,'#f59e0b');
 for(var i=0;i<4;i++)rc(150+i*44,12,32,6,'#9ca3af');
 rc(0,30,W,100,'#dbeafe');
 rc(18,46,150,14,'#1e3a8a');rc(18,66,120,14,'#1e3a8a');
 rc(18,88,170,6,'#475569');rc(18,98,150,6,'#475569');
 rc(18,112,64,12,'#ef4444');rc(88,112,64,12,'#fff');
 rc(214,42,108,80,'#60a5fa');rc(230,56,30,30,'#fde047');rc(272,90,40,26,'#16a34a');
 for(var k=0;k<3;k++){var x=14+k*108;rc(x,142,100,64,'#f3f4f6');rc(x+6,148,88,28,['#fb7185','#34d399','#a78bfa'][k]);rc(x+6,182,70,6,'#4b5563');rc(x+6,192,52,6,'#9ca3af');}
 rc(14,216,312,8,'#111827');rc(14,232,250,6,'#6b7280');rc(14,242,280,6,'#6b7280');
 rc(0,GY-24,W,24,'#111827');rc(14,GY-16,60,8,'#9ca3af');rc(110,GY-16,40,8,'#6b7280');rc(250,GY-16,76,8,'#9ca3af');
 cells=[];for(var r=0;r<Math.ceil(GY/S);r++){cells[r]=[];for(var q=0;q<CW;q++)cells[r][q]=null;}
 var tmp=document.createElement('canvas');tmp.width=W;tmp.height=H;var t=tmp.getContext('2d');t.fillStyle='#fff';t.fillRect(0,0,W,H);
 for(var j=0;j<R.length;j++){t.fillStyle=R[j][4];t.fillRect(R[j][0],R[j][1],R[j][2],R[j][3]);}
 total=0;
 for(var rr=0;rr<cells.length;rr++)for(var cc=0;cc<CW;cc++){
  var d=t.getImageData(cc*S+3,rr*S+3,1,1).data;
  if(!(d[0]>250&&d[1]>250&&d[2]>250)){var v=(Math.random()*14-7)|0;cells[rr][cc]='rgb('+Math.max(0,Math.min(255,d[0]+v))+','+Math.max(0,Math.min(255,d[1]+v))+','+Math.max(0,Math.min(255,d[2]+v))+')';total++;}
 }
 alive=total;
}
function reset(){build();deb=[];bul=[];gren=[];fx=[];pl={x:W/2,v:0,f:1,r:0};cool=0;done=false;flash=0;tick=0;$('sc').textContent=0;$('mt').style.width='0';}
function kill(cx,cy,rad){
 var n=0,r0=Math.max(0,((cy-rad)/S)|0),r1=Math.min(cells.length-1,((cy+rad)/S)|0),c0=Math.max(0,((cx-rad)/S)|0),c1=Math.min(CW-1,((cx+rad)/S)|0);
 for(var r=r0;r<=r1;r++)for(var q=c0;q<=c1;q++){
  var col=cells[r][q];if(!col)continue;
  var dx=q*S+S/2-cx,dy=r*S+S/2-cy;if(dx*dx+dy*dy>rad*rad)continue;
  cells[r][q]=null;n++;alive--;
  var a=Math.atan2(dy,dx),sp=1.5+Math.random()*4;
  deb.push({x:q*S,y:r*S,vx:Math.cos(a)*sp+(Math.random()-.5)*2,vy:Math.sin(a)*sp-2-Math.random()*3,c:col,l:50+Math.random()*30|0,s:S-(Math.random()<.5?2:0)});
 }
 if(n){var p=Math.round((1-alive/total)*100);$('sc').textContent=total-alive;$('mt').style.width=p+'%';
  if(!done&&alive<=total*0.03){done=true;flash=40;shake=14;var s=total-alive;if(s>best){best=s;try{localStorage.setItem('pix_destroy',best);}catch(e){}}}}
 return n;
}
function boom(x,y,rad){kill(x,y,rad);shake=Math.max(shake,rad>30?12:5);for(var i=0;i<(rad>30?26:8);i++)fx.push({x:x,y:y,vx:(Math.random()-.5)*7,vy:(Math.random()-.5)*7,l:14+Math.random()*10|0,c:['#fde047','#fb923c','#ef4444','#fff'][i%4],s:3+Math.random()*3});}
function fire(tx,ty){
 if(cool>0)return;aim.x=tx;aim.y=ty;
 var gx=pl.x+(tx>pl.x?10:-10),gy=GY-18,a=Math.atan2(ty-gy,tx-gx);pl.f=tx>=pl.x?1:-1;pl.r=6;
 if(wp===0){cool=10;bul.push({x:gx,y:gy,vx:Math.cos(a)*13,vy:Math.sin(a)*13,r:7,l:60});}
 else if(wp===1){cool=26;for(var i=-3;i<=3;i++){var b=a+i*.075+(Math.random()-.5)*.05;bul.push({x:gx,y:gy,vx:Math.cos(b)*(11+Math.random()*3),vy:Math.sin(b)*(11+Math.random()*3),r:9,l:34});}shake=Math.max(shake,4);}
 else{cool=44;var sp=Math.min(11,Math.hypot(tx-gx,ty-gy)/16+4);gren.push({x:gx,y:gy,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-3.2,t:70});}
 for(var k=0;k<4;k++)fx.push({x:gx+Math.cos(a)*8,y:gy+Math.sin(a)*8,vx:Math.cos(a)*3+(Math.random()-.5)*2,vy:Math.sin(a)*3+(Math.random()-.5)*2,l:6,c:'#fde047',s:3});
}
function step(){
 tick++;if(cool>0)cool--;if(pl.r>0)pl.r--;
 pl.x+=pl.v;pl.v*=.8;pl.x=Math.max(14,Math.min(W-14,pl.x));
 var i,b;
 for(i=bul.length-1;i>=0;i--){b=bul[i];var steps=3,hit=false;for(var s=0;s<steps&&!hit;s++){b.x+=b.vx/steps;b.y+=b.vy/steps;
   var r=(b.y/S)|0,q=(b.x/S)|0;if(r>=0&&r<cells.length&&q>=0&&q<CW&&cells[r][q]){boom(b.x,b.y,b.r);hit=true;}}
  b.l--;if(hit||b.l<=0||b.x<-20||b.x>W+20||b.y<-20||b.y>H+20)bul.splice(i,1);}
 for(i=gren.length-1;i>=0;i--){b=gren[i];b.vy+=.28;b.x+=b.vx;b.y+=b.vy;b.t--;
  var r2=(b.y/S)|0,q2=(b.x/S)|0,hit2=r2>=0&&r2<cells.length&&q2>=0&&q2<CW&&cells[r2][q2];
  if(hit2||b.t<=0||b.y>GY){boom(b.x,Math.min(b.y,GY),46);gren.splice(i,1);}else if(b.x<3||b.x>W-3)b.vx*=-.7;}
 for(i=deb.length-1;i>=0;i--){var d=deb[i];d.vy+=.32;d.x+=d.vx;d.y+=d.vy;d.l--;if(d.y>GY-d.s){d.y=GY-d.s;d.vy*=-.35;d.vx*=.7;}if(d.l<=0)deb.splice(i,1);}
 for(i=fx.length-1;i>=0;i--){var f=fx[i];f.x+=f.vx;f.y+=f.vy;f.vy+=.12;f.l--;if(f.l<=0)fx.splice(i,1);}
 if(shake>0){shake--;if(shake===13||shake%7===6){var w=$('win');w.classList.remove('sh');void w.offsetWidth;w.classList.add('sh');}}
 if(flash>0)flash--;
}
function man(x,y,f,r){
 c.fillStyle='#111';c.fillRect(x-3,y-26,8,8);c.fillRect(x-1,y-18,4,10);c.fillRect(x-4,y-8,3,8);c.fillRect(x+3,y-8,3,8);
 c.fillStyle='#fff';c.fillRect(x+(f>0?2:-1),y-24,2,2);
 c.fillStyle='#111';var ax=x+(f>0?3:-3),ay=y-16;var a=Math.atan2(aim.y-ay,aim.x-ax);
 c.save();c.translate(ax,ay);c.rotate(a);c.fillStyle='#374151';c.fillRect(0,-2,wp===1?18:13,4);c.fillStyle='#111';c.fillRect(-2,-1,6,6);c.restore();
 if(r>0){c.fillStyle='#fde047';c.fillRect(ax+Math.cos(a)*16-3,ay+Math.sin(a)*16-3,6,6);}
}
function draw(){
 c.fillStyle='#fafafa';c.fillRect(0,0,W,H);
 for(var r=0;r<cells.length;r++){var row=cells[r];for(var q=0;q<CW;q++){var col=row[q];if(col){c.fillStyle=col;c.fillRect(q*S,r*S,S,S);}}}
 // tanah
 c.fillStyle='#4b5563';c.fillRect(0,GY,W,H-GY);c.fillStyle='#6b7280';for(var x=0;x<W;x+=12)c.fillRect(x,GY,6,3);
 var i;for(i=0;i<deb.length;i++){var d=deb[i];c.fillStyle=d.c;c.globalAlpha=Math.min(1,d.l/20);c.fillRect(d.x,d.y,d.s,d.s);}c.globalAlpha=1;
 for(i=0;i<bul.length;i++){var b=bul[i];c.strokeStyle='#fde047';c.lineWidth=2;c.beginPath();c.moveTo(b.x,b.y);c.lineTo(b.x-b.vx*1.2,b.y-b.vy*1.2);c.stroke();c.fillStyle='#fff';c.fillRect(b.x-1,b.y-1,3,3);}
 for(i=0;i<gren.length;i++){var g=gren[i];c.fillStyle='#16a34a';c.fillRect(g.x-3,g.y-3,7,7);c.fillStyle=(tick%6<3)?'#ef4444':'#fde047';c.fillRect(g.x-1,g.y-5,3,3);}
 for(i=0;i<fx.length;i++){var f=fx[i];c.fillStyle=f.c;c.fillRect(f.x,f.y,f.s,f.s);}
 man(pl.x,GY,pl.f,pl.r);
 // bidik
 c.strokeStyle='rgba(239,68,68,.75)';c.lineWidth=1;c.beginPath();c.arc(aim.x,aim.y,6,0,7);c.moveTo(aim.x-9,aim.y);c.lineTo(aim.x+9,aim.y);c.moveTo(aim.x,aim.y-9);c.lineTo(aim.x,aim.y+9);c.stroke();
 if(done){c.fillStyle='rgba(20,19,27,.78)';c.fillRect(0,96,W,92);c.textAlign='center';c.fillStyle='#ffb703';c.font='bold 20px monospace';c.fillText('WEBSITE HANCUR!',W/2,128);c.fillStyle='#fff';c.font='12px monospace';c.fillText('Skor '+(total-alive)+'  •  Rekor '+best,W/2,150);c.fillStyle='#a3e635';c.fillText('tap ⟳ untuk bangun ulang',W/2,172);c.textAlign='left';}
 if(flash>0){c.fillStyle='rgba(255,255,255,'+(flash/60)+')';c.fillRect(0,0,W,H);}
}
function loop(){step();draw();requestAnimationFrame(loop);}
function pos(e){var r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height};}
var down=false;
cv.addEventListener('pointerdown',function(e){e.preventDefault();down=true;var p=pos(e);aim.x=p.x;aim.y=p.y;fire(p.x,p.y);});
cv.addEventListener('pointermove',function(e){var p=pos(e);aim.x=p.x;aim.y=p.y;if(down&&wp===0)fire(p.x,p.y);});
window.addEventListener('pointerup',function(){down=false;});
function setW(n){wp=n;var b=document.querySelectorAll('.wb');for(var i=0;i<b.length;i++)b[i].className='wb'+(i===n?' on':'');}
var wbs=document.querySelectorAll('.wb');for(var i=0;i<wbs.length;i++)(function(b){b.onclick=function(){setW(+b.getAttribute('data-w'));};})(wbs[i]);
document.addEventListener('keydown',function(e){
 if(e.key==='1')setW(0);else if(e.key==='2')setW(1);else if(e.key==='3')setW(2);
 else if(e.key==='ArrowLeft'||e.key==='a'){pl.v=-4;pl.f=-1;}else if(e.key==='ArrowRight'||e.key==='d'){pl.v=4;pl.f=1;}});
$('rs').onclick=reset;
reset();loop();
// pembuka: karakter menembak otomatis sekali supaya kartu terasa hidup
setTimeout(function(){fire(W*0.62,70);},500);
})();
</script>
`;

function buildDestroyHtml({ playerName = "Kamu", url = "https://destroy.spritefusion.com/" } = {}) {
  let host = "destroy.spritefusion.com";
  try { host = new URL(url).host; } catch {}
  return BODY.replace("__BASECSS__", () => BASE_CSS).replace("__CFG__", () => safeJson({ nama: String(playerName).slice(0, 30), url, host }));
}

module.exports = { buildDestroyHtml };
