/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Kartu HTML statis: DIONYSUS ISEKAI LIVE — RPG top-down ala anime: kota, guild, toko, penginapan, hutan, gua, bos
const { BASE_CSS, safeJson } = require("../htmlcard");

const BODY = String.raw`
<style>
__BASECSS__
.hr{display:flex;justify-content:space-between;font-size:11px;color:var(--soft);margin-bottom:3px;font-weight:700}
.b{height:6px;background:#0b0e14;border-radius:4px;margin-bottom:3px;overflow:hidden}.b i{display:block;height:100%}
.scr{position:relative;border-radius:10px;overflow:hidden;border:1px solid var(--line);background:#000;margin-top:6px}
#cv{width:100%;display:block}
.ov{position:absolute;inset:0;background:rgba(10,12,20,.95);padding:10px;overflow:auto;display:flex;flex-direction:column;gap:6px}
.ot{font-weight:800;font-size:14px}.ob{font-size:12px;line-height:1.5;color:#dfe5f1}
.og{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:auto}.og .btn{font-size:12px;padding:9px 6px}
.en{font-size:52px;text-align:center}.mut{font-size:11px;color:var(--soft)}
.bl{background:var(--card);border-radius:8px;padding:6px 8px;font-size:11px;min-height:48px}
.log{font-size:11px;color:var(--soft);min-height:40px;margin:6px 2px}
.pad{display:flex;justify-content:space-between;align-items:center;margin-top:6px}
.dp{display:grid;grid-template-columns:repeat(3,50px);grid-template-rows:repeat(3,50px);gap:4px}
.dp button,.ab button{border:1px solid var(--line);background:var(--card2);color:var(--ink);border-radius:14px;font-size:18px;font-weight:800;touch-action:manipulation;user-select:none;-webkit-user-select:none}
.dp button:active,.ab button:active{background:var(--acc);color:#04130a}
.u{grid-area:1/2}.l{grid-area:2/1}.r{grid-area:2/3}.d{grid-area:3/2}
.ab{display:flex;gap:10px}.ab button{width:62px;height:62px;border-radius:50%;font-size:15px}
</style>
<div class="stage"><div class="app">
 <div class="top"><div class="logo">⚔️</div><div class="meta"><div class="title">Chisa AI Isekai Live</div><div class="sub" id="sub">Dunia lain menunggumu</div></div></div>
 <div id="hud"></div>
 <div class="scr"><canvas id="cv"></canvas><div id="ov" class="ov hide"></div></div>
 <div class="log" id="log"></div>
 <div class="pad">
  <div class="dp"><button class="u" data-d="u">▲</button><button class="l" data-d="l">◀</button><button class="r" data-d="r">▶</button><button class="d" data-d="d">▼</button></div>
  <div class="ab"><button id="bB">☰</button><button id="bA">A</button></div>
 </div>
</div></div>
<script>
(function(){
var CFG=__CFG__,$=function(i){return document.getElementById(i)};
var TS=30,VW=11,VH=9,cv=$('cv'),c=cv.getContext('2d');cv.width=VW*TS;cv.height=VH*TS;
var RND=function(a,b){return a+Math.floor(Math.random()*(b-a+1))};
var esc=function(s){return String(s).replace(/[&<>"']/g,function(x){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]})};
function seeded(s){return function(){s=(s*1664525+1013904223)%4294967296;return s/4294967296}}
function grid(w,h,f){var g=[];for(var y=0;y<h;y++){g.push([]);for(var x=0;x<w;x++)g[y].push(f)}return g}
function rect(g,x,y,w,h,t){for(var j=y;j<y+h;j++)for(var i=x;i<x+w;i++)g[j][i]=t}
function border(g){var h=g.length,w=g[0].length;for(var x=0;x<w;x++){g[0][x]='#';g[h-1][x]='#'}for(var y=0;y<h;y++){g[y][0]='#';g[y][w-1]='#'}}
/* ---------- DUNIA ---------- */
var MAPS={};
(function(){
 var t=grid(20,14,'.');border(t);rect(t,2,2,4,2,'G');rect(t,8,2,4,2,'S');rect(t,14,2,4,2,'I');rect(t,2,8,3,2,'~');rect(t,1,5,18,1,',');rect(t,9,5,2,8,',');rect(t,9,13,2,1,'D');
 MAPS.kota={g:t,name:'Kota Chisa AI',enc:0,d:{to:'hutan',x:10,y:1},npcs:[{x:6,y:7,e:'🧝‍♀️',id:'mira'},{x:14,y:8,e:'👴',id:'zeus'},{x:16,y:10,e:'🐱',id:'cat'}]};
 var f=grid(22,20,'f'),r=seeded(7);
 for(var y=1;y<19;y++)for(var x=1;x<21;x++)if(r()<.17&&(x<9||x>12))f[y][x]='#';
 rect(f,3,8,3,3,'~');border(f);rect(f,10,0,2,1,'D');rect(f,10,19,2,1,'C');
 MAPS.hutan={g:f,name:'Hutan Bisikan',enc:.2,pool:['slime','slime','gob','wolf'],d:{to:'kota',x:9,y:12},npcs:[]};
 var q=grid(14,12,'c'),r2=seeded(21);
 for(var y2=1;y2<11;y2++)for(var x2=1;x2<13;x2++)if(r2()<.12&&(x2<5||x2>8))q[y2][x2]='#';
 border(q);rect(q,6,1,2,1,'X');rect(q,6,11,2,1,'D');
 MAPS.gua={g:q,name:'Gua Naga Api',enc:.25,pool:['orc','bat','orc'],d:{to:'hutan',x:10,y:18},npcs:[],rock:1};
})();
var TILE={'.':['#3b7d4a',''],'f':['#2f6a3c',''],',':['#b09a64',''],'#':['#1f4d2b','🌲'],'~':['#2b6cb0','🌊'],'G':['#6b4f2a','🏰'],'S':['#6b4f2a','🏪'],'I':['#6b4f2a','🏨'],'D':['#6d28d9','✨'],'C':['#111827','🕳️'],'c':['#374151',''],'X':['#7f1d1d','🐉']};
var WALK={'.':1,'f':1,',':1,'c':1};
/* ---------- DATA ---------- */
var CLS={hero:{n:'Pahlawan',e:'🦸',hp:120,mp:20,atk:14,def:8,g:[18,3,3,1.6],sk:['Tebasan Cahaya',8,1.9,0]},
 mage:{n:'Penyihir',e:'🧙‍♀️',hp:80,mp:60,atk:10,def:5,g:[11,9,2.6,1],sk:['Meteor Chisa AI',12,2.8,1]},
 arch:{n:'Pemanah',e:'🧝',hp:96,mp:36,atk:12,def:6,g:[14,5,2.8,1.2],sk:['Panah Kembar',7,2.2,0]}};
var WP=[{n:'Bilah Kayu',a:0,p:0},{n:'Bilah Besi',a:6,p:150},{n:'Bilah Baja',a:14,p:600},{n:'Bilah Chisa AI',a:28,p:2200}];
var AR=[{n:'Baju Lusuh',d:0,p:0},{n:'Jubah Kulit',d:4,p:120},{n:'Zirah Besi',d:10,p:500},{n:'Zirah Naga',d:22,p:2000}];
var IT={pot:['🧪','Potion','+60 HP',50],eth:['💧','Ether','+30 MP',70],eli:['🍷','Elixir Anggur','HP & MP penuh',250]};
var EN={slime:{n:'Slime',e:'🟢',hp:34,atk:8,def:1,x:14,g:9},gob:{n:'Goblin',e:'👺',hp:52,atk:12,def:3,x:24,g:16},wolf:{n:'Serigala Hitam',e:'🐺',hp:70,atk:16,def:4,x:36,g:24},
 orc:{n:'Orc',e:'👹',hp:130,atk:26,def:9,x:80,g:50},bat:{n:'Kelelawar Iblis',e:'🦇',hp:95,atk:30,def:6,x:70,g:45},naga:{n:'Naga Api',e:'🐉',hp:520,atk:58,def:14,x:500,g:600,boss:1}};
var QD=[{n:'Basmi 3 Slime',t:'slime',k:3,g:70,x:35},{n:'Kalahkan 3 Goblin',t:'gob',k:3,g:140,x:70},{n:'Buru 3 Serigala Hitam',t:'wolf',k:3,g:240,x:130},{n:'Basmi 4 Orc',t:'orc',k:4,g:650,x:320},{n:'Tumbangkan Naga Api',t:'naga',k:1,g:2500,x:1200,once:1}];
var RANK=['F','E','D','C','B','A','S'],RT=[0,1,3,6,10,15,22];
/* ---------- STATE ---------- */
var P=null,mem=null,KEY='dionysus_rpg_v1',face=[0,1],isOpen=false,acts=[],logs=[];
function load(){try{var s=localStorage.getItem(KEY);if(s)return JSON.parse(s)}catch(e){}return mem}
function save(){mem=P;try{localStorage.setItem(KEY,JSON.stringify(P))}catch(e){}}
function K(){return CLS[P.cls]}
function mhp(){return Math.round(K().hp+K().g[0]*(P.lv-1))}
function mmp(){return Math.round(K().mp+K().g[1]*(P.lv-1))}
function atk(){return Math.round(K().atk+K().g[2]*(P.lv-1))+WP[P.w].a}
function def(){return Math.round(K().def+K().g[3]*(P.lv-1))+AR[P.a].d}
function need(){return Math.round(30*P.lv+8*P.lv*P.lv)}
function rank(){var r=0;for(var i=0;i<RT.length;i++)if(P.done>=RT[i])r=i;return RANK[r]}
function bar(v,m,col){return '<div class="b"><i style="width:'+Math.max(0,Math.min(100,Math.round(v/m*100)))+'%;background:'+col+'"></i></div>'}
function say(t){logs.push(t);if(logs.length>3)logs.shift();$('log').innerHTML=logs.map(esc).join('<br>')}
function hud(){
 if(!P){$('hud').innerHTML='';return}
 $('hud').innerHTML='<div class="hr"><span>'+K().e+' Lv.'+P.lv+' · Rank '+rank()+'</span><span>HP '+P.hp+'/'+mhp()+'</span><span>MP '+P.mp+'/'+mmp()+'</span><span>💰'+P.gold+'</span></div>'+bar(P.hp,mhp(),'#ef4444')+bar(P.mp,mmp(),'#3b82f6')+bar(P.exp,need(),'#eab308');
 $('sub').textContent=CFG.nama+' · '+MAPS[P.map].name;
}
/* ---------- OVERLAY ---------- */
var ov=$('ov');
function open(title,body,btns){acts=[];var h='<div class="ot">'+title+'</div><div class="ob">'+body+'</div><div class="og">';(btns||[]).forEach(function(b){acts.push(b.f);h+='<button class="btn '+(b.c===undefined?'alt':b.c)+'" data-i="'+(acts.length-1)+'">'+b.l+'</button>'});ov.innerHTML=h+'</div>';ov.classList.remove('hide');isOpen=true}
function close(){ov.classList.add('hide');isOpen=false;acts=[];hud();draw()}
ov.addEventListener('click',function(e){var b=e.target.closest?e.target.closest('button'):null;if(!b)return;var f=acts[+b.getAttribute('data-i')];if(f)f()});
var BACK={l:'Tutup',f:function(){close()}};
/* ---------- GAMBAR ---------- */
function draw(){
 if(!P)return;var M=MAPS[P.map],g=M.g,ox=Math.max(0,Math.min(g[0].length-VW,P.x-5)),oy=Math.max(0,Math.min(g.length-VH,P.y-4));
 c.textAlign='center';c.textBaseline='middle';c.font='20px "Apple Color Emoji","Segoe UI Emoji",sans-serif';
 for(var vy=0;vy<VH;vy++)for(var vx=0;vx<VW;vx++){
  var ch=g[oy+vy][ox+vx],t=TILE[ch]||TILE['.'],px=vx*TS,py=vy*TS;
  c.fillStyle=t[0];c.fillRect(px,py,TS,TS);
  if((ox+vx+oy+vy)%2===0&&WALK[ch]){c.fillStyle='rgba(255,255,255,.04)';c.fillRect(px,py,TS,TS)}
  var em=t[1];if(ch==='#'&&M.rock)em='🪨';if(em)c.fillText(em,px+TS/2,py+TS/2+1);
 }
 M.npcs.forEach(function(n){var vx=n.x-ox,vy=n.y-oy;if(vx>=0&&vx<VW&&vy>=0&&vy<VH)c.fillText(n.e,vx*TS+TS/2,vy*TS+TS/2+1)});
 var sx=(P.x-ox)*TS+TS/2,sy=(P.y-oy)*TS+TS/2;
 c.fillStyle='rgba(250,204,21,.28)';c.beginPath();c.arc(sx,sy,13,0,7);c.fill();c.fillText(K().e,sx,sy+1);
}
/* ---------- GERAK & INTERAKSI ---------- */
function npcAt(x,y){var l=MAPS[P.map].npcs;for(var i=0;i<l.length;i++)if(l[i].x===x&&l[i].y===y)return l[i];return null}
function step(dx,dy){
 if(!P||isOpen)return;face=[dx,dy];var M=MAPS[P.map],nx=P.x+dx,ny=P.y+dy;
 if(ny<0||nx<0||ny>=M.g.length||nx>=M.g[0].length)return;
 var n=npcAt(nx,ny);if(n)return talk(n);
 var ch=M.g[ny][nx];
 if(WALK[ch]){P.x=nx;P.y=ny;draw();if(M.enc&&Math.random()<M.enc){var pl=M.pool;battle(pl[RND(0,pl.length-1)])}}
 else touch(ch);
}
function act(){
 if(!P||isOpen)return;var nx=P.x+face[0],ny=P.y+face[1],M=MAPS[P.map];
 if(ny<0||nx<0||ny>=M.g.length||nx>=M.g[0].length)return;
 var n=npcAt(nx,ny);if(n)return talk(n);
 var ch=M.g[ny][nx];if(WALK[ch])say('Tidak ada apa-apa di sini.');else touch(ch);
}
function travel(to,x,y,msg){P.map=to;P.x=x;P.y=y;save();draw();hud();say(msg||('Tiba di '+MAPS[to].name+'.'))}
function touch(ch){
 var M=MAPS[P.map];
 if(ch==='G')return guild();if(ch==='S')return shop();if(ch==='I')return inn();
 if(ch==='D')return travel(M.d.to,M.d.x,M.d.y);
 if(ch==='C'){if(P.lv<6)return say('Aura naga terasa dari gua. Butuh Lv.6 untuk masuk.');return travel('gua',6,10,'Kamu masuk Gua Naga Api. Hawa panas menyengat...')}
 if(ch==='X')return open('🐉 Naga Api','Sang Naga bangkit dari tumpukan emas. Siap bertarung?',[{l:'Lawan!',c:'red',f:function(){battle('naga')}},{l:'Mundur',f:close}]);
 if(ch==='#')say(M.rock?'Dinding gua yang dingin.':'Pohon besar menghalangi jalan.');
 if(ch==='~')say('Air terlalu dalam untuk diseberangi.');
}
var HINT=['Hutan di selatan penuh Slime dan Goblin. Latih dirimu dulu!','Gua di ujung hutan butuh minimal Lv.6. Naga Api menjaga hartanya di dalam.','Belilah zirah di toko sebelum melawan Orc.','Quest Guild memberi gold dan EXP. Ambil semuanya!','Potion itu murah, pingsan itu mahal.'];
function talk(n){
 if(n.id==='mira')return open('🧝‍♀️ Mira, Elf Penjaga','"'+HINT[RND(0,HINT.length-1)]+'"',[BACK]);
 if(n.id==='zeus')return open('👴 Kakek Zeus','"Dulu aku pahlawan sepertimu. Kini Naga Api menjaga Permata Chisa AI di dasar gua. Tumbangkan dia, dan namamu akan abadi."'+(P.boss?'<br><br><b>Kau sudah melakukannya, Nak. Dunia berterima kasih.</b>':''),[BACK]);
 var g=Math.random()<.3?RND(2,12):0;P.gold+=g;if(g)save();
 open('🐱 Kucing Guild',g?'Meong~! Kucing itu menjatuhkan '+g+' gold dari kantongnya.':'Meong~ (dia mengeong manja).',[BACK]);
}
/* ---------- GUILD / TOKO / PENGINAPAN ---------- */
function guild(){
 var body='<b>Rank '+rank()+'</b> · Quest selesai: '+P.done+'<br>',btns=[];
 QD.forEach(function(q,i){
  var s=P.q[i],txt='• '+q.n+' (+'+q.g+'g, +'+q.x+' EXP)';
  if(s===1)txt+=' — '+P.qp[i]+'/'+q.k;if(s===2)txt+=' — <b>selesai!</b>';if(s===3)txt+=' — tuntas';
  body+=txt+'<br>';
  if(s===0)btns.push({l:'Ambil: '+q.n.split(' ')[0]+' '+q.t,f:function(){P.q[i]=1;P.qp[i]=0;save();say('Quest diambil: '+q.n);guild()}});
  if(s===2)btns.push({l:'Lapor: '+q.n.split(' ')[0]+' '+q.t,c:'',f:function(){P.gold+=q.g;P.exp+=q.x;P.done++;P.q[i]=q.once?3:0;var up=lvl();save();say('Hadiah: +'+q.g+'g, +'+q.x+' EXP'+(up?' · LEVEL UP Lv.'+P.lv:''));guild()}});
 });
 btns.push(BACK);open('🏰 Guild Petualang',body,btns);
}
function shop(msg){
 var btns=[],body='💰 Gold: <b>'+P.gold+'</b><br>'+(msg?'<i>'+msg+'</i><br>':'')+'Senjata: '+WP[P.w].n+' (+'+WP[P.w].a+' ATK)<br>Armor: '+AR[P.a].n+' (+'+AR[P.a].d+' DEF)';
 Object.keys(IT).forEach(function(k){var it=IT[k];btns.push({l:it[0]+' '+it[1]+' '+it[3]+'g ('+P.inv[k]+')',f:function(){if(P.gold<it[3])return shop('Gold tidak cukup.');P.gold-=it[3];P.inv[k]++;save();hud();shop('Membeli '+it[1]+'.')}})});
 var w=WP[P.w+1],a=AR[P.a+1];
 if(w)btns.push({l:'⚔️ '+w.n+' '+w.p+'g',f:function(){if(P.gold<w.p)return shop('Gold tidak cukup.');P.gold-=w.p;P.w++;save();hud();shop('Kamu memakai '+w.n+'!')}});
 if(a)btns.push({l:'🛡️ '+a.n+' '+a.p+'g',f:function(){if(P.gold<a.p)return shop('Gold tidak cukup.');P.gold-=a.p;P.a++;save();hud();shop('Kamu memakai '+a.n+'!')}});
 btns.push(BACK);open('🏪 Toko Mimi',body,btns);
}
function inn(){
 var cost=20+P.lv*3;
 open('🏨 Penginapan Anggur','Istirahat penuh (HP & MP pulih) dan progres tersimpan.<br>Biaya: <b>'+cost+'</b> gold.',[{l:'Menginap',c:'',f:function(){if(P.gold<cost){say('Gold tidak cukup.');return close()}P.gold-=cost;P.hp=mhp();P.mp=mmp();save();say('Kamu tidur nyenyak. HP & MP pulih.');close()}},BACK]);
}
/* ---------- ITEM & MENU ---------- */
function useItem(k){
 if(P.inv[k]<1)return 'Item habis.';
 if(k==='pot'){if(P.hp>=mhp())return 'HP sudah penuh.';P.hp=Math.min(mhp(),P.hp+60);}
 else if(k==='eth'){if(P.mp>=mmp())return 'MP sudah penuh.';P.mp=Math.min(mmp(),P.mp+30);}
 else{P.hp=mhp();P.mp=mmp();}
 P.inv[k]--;save();return 'Memakai '+IT[k][1]+'.';
}
function bag(msg){
 var btns=[];Object.keys(IT).forEach(function(k){if(P.inv[k]>0)btns.push({l:IT[k][0]+' '+IT[k][1]+' x'+P.inv[k],f:function(){bag(useItem(k))}})});
 btns.push({l:'Kembali',f:menu});open('🎒 Tas',(msg?'<i>'+msg+'</i><br>':'')+'HP '+P.hp+'/'+mhp()+' · MP '+P.mp+'/'+mmp()+'<br>'+(btns.length>1?'Pilih item untuk dipakai.':'Tas kosong.'),btns);
}
function status(){
 open('📜 Status '+esc(CFG.nama),K().e+' '+K().n+' Lv.'+P.lv+' (Rank '+rank()+')<br>EXP '+P.exp+'/'+need()+'<br>HP '+P.hp+'/'+mhp()+' · MP '+P.mp+'/'+mmp()+'<br>ATK '+atk()+' · DEF '+def()+'<br>Senjata: '+WP[P.w].n+'<br>Armor: '+AR[P.a].n+'<br>Skill: '+K().sk[0]+' ('+K().sk[1]+' MP)<br>Monster dibunuh: '+P.kills+(P.boss?'<br>🏆 Pembunuh Naga Api':''),[{l:'Kembali',f:menu}]);
}
function menu(){
 if(!P)return;
 open('☰ Menu',MAPS[P.map].name,[{l:'📜 Status',f:status},{l:'🎒 Tas',f:function(){bag()}},{l:'💾 Simpan',f:function(){save();say('Progres tersimpan.');close()}},{l:'♻️ Ulang Game',c:'red',f:function(){open('Ulang dari awal?','Semua progres akan dihapus.',[{l:'Ya, hapus',c:'red',f:function(){P=null;mem=null;try{localStorage.removeItem(KEY)}catch(e){}intro()}},{l:'Batal',f:menu}])}},BACK]);
}
/* ---------- LEVEL & PERTEMPURAN ---------- */
function lvl(){var up=0;while(P.exp>=need()){P.exp-=need();P.lv++;up=1}if(up){P.hp=Math.min(mhp(),P.hp+Math.round(mhp()*.35));P.mp=Math.min(mmp(),P.mp+Math.round(mmp()*.35))}return up}
function battle(id){
 var e={},b=EN[id];for(var k in b)e[k]=b[k];e.m=e.hp;var lg=['Muncul: '+e.n+'!'];
 function hit(a,d){return Math.max(1,Math.round(a*RND(90,112)/100-d*.6))}
 function view(){
  var sk=K().sk;
  open(e.e+' '+esc(e.n),'<div class="en">'+e.e+'</div><div class="mut">'+esc(e.n)+' '+Math.max(0,e.hp)+'/'+e.m+'</div>'+bar(e.hp,e.m,'#ef4444')+'<div class="mut">Kamu · HP '+P.hp+'/'+mhp()+' · MP '+P.mp+'/'+mmp()+'</div>'+bar(P.hp,mhp(),'#22c55e')+'<div class="bl">'+lg.slice(-4).join('<br>')+'</div>',
  [{l:'⚔️ Serang',c:'',f:function(){turn('atk')}},{l:'✨ '+sk[0]+' ('+sk[1]+')',f:function(){turn('sk')}},{l:'🧪 Item',f:items},{l:'🏃 Kabur',c:'red',f:function(){turn('run')}}]);
 }
 function items(){
  var btns=[];Object.keys(IT).forEach(function(k){if(P.inv[k]>0)btns.push({l:IT[k][0]+' '+IT[k][1]+' x'+P.inv[k],f:function(){var r=useItem(k);lg.push(r);if(r.indexOf('Memakai')===0)return enemy();view()}})});
  btns.push({l:'Kembali',f:view});open('🧪 Item','Pilih item (memakai item menghabiskan giliran).',btns);
 }
 function enemy(){
  var d=Math.max(1,Math.round(e.atk*RND(88,112)/100-def()*.5));P.hp-=d;lg.push(e.n+' menyerang: '+d+' damage');
  if(P.hp<=0)return lose();view();
 }
 function turn(kd){
  if(kd==='run'){if(e.boss){lg.push('Tidak bisa kabur dari bos!');return view()}if(Math.random()<.6){say('Berhasil kabur dari '+e.n+'.');return close()}lg.push('Gagal kabur!')}
  else if(kd==='sk'){var s=K().sk;if(P.mp<s[1]){lg.push('MP tidak cukup!');return view()}P.mp-=s[1];var d=hit(atk()*s[2],s[3]?0:e.def);lg.push(s[0]+'! '+d+' damage');e.hp-=d}
  else{var cr=Math.random()<(P.cls==='arch'?.2:.1),d2=hit(atk()*(cr?1.7:1),e.def);lg.push((cr?'KRITIS! ':'')+'Serangan: '+d2+' damage');e.hp-=d2}
  if(e.hp<=0)return win();enemy();
 }
 function win(){
  var gg=e.g+RND(0,Math.floor(e.g/3)),t=['Menang! +'+e.x+' EXP, +'+gg+' gold'];P.exp+=e.x;P.gold+=gg;P.kills++;
  QD.forEach(function(q,i){if(P.q[i]===1&&q.t===id&&P.qp[i]<q.k){P.qp[i]++;if(P.qp[i]>=q.k){P.q[i]=2;t.push('Quest selesai: '+q.n+' — lapor ke Guild!')}}});
  if(lvl())t.push('✨ LEVEL UP! Sekarang Lv.'+P.lv);
  if(Math.random()<.15){P.inv.pot++;t.push('Dapat 1 Potion')}
  if(e.boss){P.boss=1;t.push('🏆 Naga Api tumbang! Kamu pahlawan Chisa AI!')}
  save();open('🎉 Kemenangan',t.join('<br>'),[{l:'Lanjut',c:'',f:close}]);
 }
 function lose(){
  P.gold=Math.floor(P.gold*.8);P.hp=Math.ceil(mhp()/2);P.mp=Math.ceil(mmp()/2);P.map='kota';P.x=9;P.y=6;save();
  open('💀 Kalah','Kamu pingsan... lalu terbangun di Kota Chisa AI. 20% gold hilang.',[{l:'Bangun',f:close}]);
 }
 view();
}
/* ---------- AWAL CERITA ---------- */
function intro(){
 hud();c.fillStyle='#0f1115';c.fillRect(0,0,cv.width,cv.height);
 function pick(k){P={cls:k,lv:1,exp:0,hp:0,mp:0,gold:100,w:0,a:0,inv:{pot:3,eth:1,eli:0},map:'kota',x:9,y:6,q:[0,0,0,0,0],qp:[0,0,0,0,0],done:0,kills:0,boss:0};P.hp=mhp();P.mp=mmp();save();close();say('Selamat datang di dunia Chisa AI, '+CFG.nama+'! Temui Guild di barat laut kota.')}
 open('✨ Terpanggil ke Dunia Lain','Cahaya anggur keemasan menelanmu... Dewa Chisa AI memanggil <b>'+esc(CFG.nama)+'</b> sebagai pahlawan baru. Pilih jalanmu:',
 Object.keys(CLS).map(function(k){var x=CLS[k];return {l:x.e+' '+x.n+'<br><small>HP '+x.hp+' · ATK '+x.atk+'</small>',c:'',f:function(){pick(k)}}}));
}
/* ---------- KONTROL ---------- */
var DIR={u:[0,-1],d:[0,1],l:[-1,0],r:[1,0]},tm=null;
function stop(){clearInterval(tm);tm=null}
Array.prototype.forEach.call(document.querySelectorAll('[data-d]'),function(b){
 var d=DIR[b.getAttribute('data-d')];
 b.addEventListener('pointerdown',function(e){e.preventDefault();stop();step(d[0],d[1]);tm=setInterval(function(){step(d[0],d[1])},170)});
 ['pointerup','pointerleave','pointercancel'].forEach(function(ev){b.addEventListener(ev,stop)});
});
$('bA').addEventListener('click',act);
$('bB').addEventListener('click',function(){if(!P)return;if(isOpen)close();else menu()});
document.addEventListener('keydown',function(e){
 var k=e.key,m={ArrowUp:'u',w:'u',ArrowDown:'d',s:'d',ArrowLeft:'l',a:'l',ArrowRight:'r',d:'r'}[k];
 if(m){e.preventDefault();step(DIR[m][0],DIR[m][1])}else if(k==='z'||k==='Enter'||k===' '){e.preventDefault();act()}else if(k==='x'||k==='Escape'){if(P){if(isOpen)close();else menu()}}
});
P=load();
if(P){hud();draw();say('Selamat datang kembali, '+CFG.nama+'!')}else intro();
})();
</script>
`;

function buildDionysusRpgHtml({ playerName = "Petualang" } = {}) {
  return BODY.replace("__BASECSS__", () => BASE_CSS).replace("__CFG__", () => safeJson({ nama: String(playerName).slice(0, 24) }));
}

module.exports = { buildDionysusRpgHtml };
