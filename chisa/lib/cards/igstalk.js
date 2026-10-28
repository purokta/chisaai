/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Kartu HTML statis: IG STALK LIVE (1 akun, atau 2 akun untuk dibandingkan)
// Semua data ditanam di HTML lewat __CFG__, tanpa fetch (sandbox WA memblokir jaringan).
const { BASE_CSS, safeJson } = require("../htmlcard");

const BODY = String.raw`
<style>
__BASECSS__
.hd{display:flex;gap:12px;align-items:center;margin-bottom:10px;}
.av{width:68px;height:68px;border-radius:50%;flex:none;background:var(--card2);border:2px solid var(--acc);display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:800;color:var(--acc);overflow:hidden;}
.av img{width:100%;height:100%;object-fit:cover;display:block;}
.nm{font-size:16px;font-weight:800;line-height:1.2;word-break:break-word;}
.un{font-size:12px;color:var(--soft);margin-top:2px;}
.bd{display:flex;gap:5px;flex-wrap:wrap;margin-top:6px;}
.b{font-size:10px;font-weight:800;padding:3px 8px;border-radius:20px;background:var(--card2);border:1px solid var(--line);color:var(--soft);}
.b.g{color:#04130a;background:var(--acc);border-color:var(--acc);}
.b.w{color:#1a1203;background:var(--warn);border-color:var(--warn);}
.b.r{color:#fff;background:var(--red);border-color:var(--red);}
.st{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:10px 0;}
.st div{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:9px 4px;text-align:center;}
.st b{display:block;font-size:17px;font-weight:800;}
.st span{font-size:10px;color:var(--soft);}
.bio{white-space:pre-wrap;word-break:break-word;font-size:13px;line-height:1.45;margin:8px 0;}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px;margin-bottom:10px;}
.sec{font-size:11px;font-weight:800;letter-spacing:.08em;color:var(--acc);margin:2px 0 8px;}
.kv{display:flex;justify-content:space-between;gap:10px;padding:7px 0;border-bottom:1px solid var(--line);font-size:12.5px;}
.kv:last-child{border-bottom:0;}
.kv span{color:var(--soft);flex:none;}
.kv b{text-align:right;word-break:break-word;}
.bar{height:8px;border-radius:8px;background:var(--card2);overflow:hidden;margin:6px 0 2px;}
.bar i{display:block;height:100%;background:linear-gradient(90deg,var(--acc2),var(--acc));border-radius:8px;}
.note{font-size:12px;color:var(--soft);line-height:1.5;padding:3px 0;}
.tg{display:flex;flex-wrap:wrap;gap:6px;}
.tg .b{font-size:11.5px;font-weight:700;color:var(--ink);cursor:pointer;}
.act{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;}
.act .btn{flex:1;min-width:110px;font-size:12px;padding:9px 8px;}
.tb{width:100%;border-collapse:collapse;font-size:12.5px;}
.tb th,.tb td{padding:8px 6px;border-bottom:1px solid var(--line);text-align:center;}
.tb th{color:var(--soft);font-size:11px;font-weight:700;}
.tb td:first-child,.tb th:first-child{text-align:left;color:var(--soft);}
.tb td.w{color:var(--acc);font-weight:800;}
.foot{text-align:center;margin-top:10px;letter-spacing:.12em;font-size:10px;}
.sep{height:1px;background:var(--line);margin:12px 0;}
.toast{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);background:var(--acc);color:#04130a;font-weight:800;font-size:12px;padding:8px 14px;border-radius:20px;opacity:0;transition:opacity .2s;pointer-events:none;}
.toast.on{opacity:1;}
</style>
<div class="stage"><div class="app">
  <div class="top"><div class="logo">✦</div><div class="meta"><div class="title">CHISA AI • IG STALK</div><div class="sub" id="sub"></div></div></div>
  <div class="chips" id="tabs"></div>
  <div id="view"></div>
  <div class="muted foot">✦ 𝐂𝐇𝐈𝐒𝐀 𝐀𝐈</div>
</div></div>
<div class="toast" id="toast">Tersalin</div>
<script>
(function(){
var C=__CFG__, P=C.profiles, tab='ringkasan';
function $(i){return document.getElementById(i);}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function full(n){return n==null?'-':Number(n).toLocaleString('id-ID');}
function short(n){if(n==null)return '-';if(n>=1e9)return (n/1e9).toFixed(1).replace('.',',')+' M';if(n>=1e6)return (n/1e6).toFixed(1).replace('.',',')+' jt';if(n>=1e4)return (n/1e3).toFixed(1).replace('.',',')+' rb';return full(n);}
function toast(t){var e=$('toast');e.textContent=t||'Tersalin';e.className='toast on';setTimeout(function(){e.className='toast';},1400);}
function copy(t){
  try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(function(){toast();},function(){fb(t);});return;}}catch(e){}
  fb(t);
}
function fb(t){try{var a=document.createElement('textarea');a.value=t;a.style.position='fixed';a.style.opacity='0';document.body.appendChild(a);a.select();document.execCommand('copy');document.body.removeChild(a);toast();}catch(e){toast('Gagal menyalin');}}
window.__cp=function(i,k){var p=P[i],v={user:'@'+p.username,url:p.url,bio:p.bio||''}[k];if(v)copy(v);};
window.__ct=function(t){copy(t);};

function badges(p){
  var h='';
  if(p.verified)h+='<span class="b g">Terverifikasi</span>';
  if(p.business)h+='<span class="b w">Bisnis'+(p.category?' • '+esc(p.category):'')+'</span>';
  if(p.private)h+='<span class="b r">Privat</span>';
  if(!p.verified&&!p.business&&!p.private)h+='<span class="b">Publik</span>';
  return h;
}
function head(p){
  var ini=esc((p.fullName||p.username||'?').charAt(0).toUpperCase());
  return '<div class="hd"><div class="av">'+(p.avatarUri?'<img src="'+p.avatarUri+'">':ini)+'</div><div style="min-width:0"><div class="nm">'+esc(p.fullName||p.username)+'</div><div class="un">@'+esc(p.username)+'</div><div class="bd">'+badges(p)+'</div></div></div>';
}
function ringkasan(p,i){
  return '<div class="card">'+head(p)+
  '<div class="st"><div><b>'+short(p.posts)+'</b><span>Postingan</span></div><div><b>'+short(p.followers)+'</b><span>Pengikut</span></div><div><b>'+short(p.following)+'</b><span>Mengikuti</span></div></div>'+
  (p.bio?'<div class="bio">'+esc(p.bio)+'</div>':'<div class="note">Bio kosong.</div>')+
  '<div class="kv"><span>Tautan profil</span><b>'+esc(p.url.replace('https://',''))+'</b></div>'+
  (p.link?'<div class="kv"><span>Tautan luar</span><b>'+esc(p.link)+'</b></div>':'')+
  '<div class="act"><button class="btn" onclick="__cp('+i+',\'user\')">Salin @user</button><button class="btn alt" onclick="__cp('+i+',\'url\')">Salin tautan</button>'+(p.bio?'<button class="btn alt" onclick="__cp('+i+',\'bio\')">Salin bio</button>':'')+'</div></div>';
}
function analisis(p){
  var a=p.a,h='<div class="card"><div class="sec">ANALISIS @'+esc(p.username).toUpperCase()+'</div>'+
  '<div class="kv"><span>Tingkat akun</span><b>'+esc(a.tier)+'</b></div>'+
  '<div class="kv"><span>Pengikut : mengikuti</span><b>'+(a.ratio==null?'-':a.ratio+' : 1')+'</b></div>'+
  (p.followers!=null&&p.following!=null?'<div class="kv"><span>Selisih</span><b>'+(p.followers>=p.following?'+':'-')+full(Math.abs(p.followers-p.following))+'</b></div>':'')+
  (a.ratioNote?'<div class="note">'+esc(a.ratioNote)+'.</div>':'')+
  '<div class="sep"></div><div class="kv"><span>Kelengkapan profil</span><b>'+a.score+' / 100</b></div><div class="bar"><i style="width:'+a.score+'%"></i></div>';
  for(var i=0;i<a.notes.length;i++)h+='<div class="note">• '+esc(a.notes[i])+'</div>';
  return h+'<div class="note" style="margin-top:6px">Perkiraan dari data publik, bukan penilaian pasti.</div></div>';
}
function chipsOf(arr){var h='<div class="tg">';for(var i=0;i<arr.length;i++)h+='<span class="b" onclick="__ct(this.textContent)">'+esc(arr[i])+'</span>';return h+'</div>';}
function bio(p){
  var a=p.a,h='<div class="card"><div class="sec">ISI BIO @'+esc(p.username).toUpperCase()+'</div>';
  if(!p.bio)return h+'<div class="note">Bio kosong.</div></div>';
  h+='<div class="bio">'+esc(p.bio)+'</div>';
  if(a.tags.length)h+='<div class="sec" style="margin-top:10px">TAGAR</div>'+chipsOf(a.tags);
  if(a.mentions.length)h+='<div class="sec" style="margin-top:10px">AKUN DISEBUT</div>'+chipsOf(a.mentions);
  if(a.emails.length)h+='<div class="sec" style="margin-top:10px">SURAT ELEKTRONIK</div>'+chipsOf(a.emails);
  if(a.links.length)h+='<div class="sec" style="margin-top:10px">TAUTAN</div>'+chipsOf(a.links);
  if(!a.tags.length&&!a.mentions.length&&!a.emails.length&&!a.links.length)h+='<div class="note">Tidak ada tagar, akun, surel, atau tautan di bio.</div>';
  return h+'<div class="note" style="margin-top:6px">Ketuk salah satu untuk menyalin.</div></div>';
}
function banding(){
  var A=P[0],B=P[1];
  var rows=[['Postingan','posts'],['Pengikut','followers'],['Mengikuti','following']];
  var h='<div class="card"><div class="sec">BANDING</div><table class="tb"><tr><th></th><th>@'+esc(A.username)+'</th><th>@'+esc(B.username)+'</th></tr>';
  for(var i=0;i<rows.length;i++){
    var k=rows[i][1],x=A[k],y=B[k],cx='',cy='';
    if(k!=='following'&&x!=null&&y!=null&&x!==y){if(x>y)cx='w';else cy='w';}
    h+='<tr><td>'+rows[i][0]+'</td><td class="'+cx+'">'+full(x)+'</td><td class="'+cy+'">'+full(y)+'</td></tr>';
  }
  var ra=A.a.ratio,rb=B.a.ratio,sa=A.a.score,sb=B.a.score;
  h+='<tr><td>Rasio</td><td class="'+(ra!=null&&rb!=null&&ra>rb?'w':'')+'">'+(ra==null?'-':ra)+'</td><td class="'+(ra!=null&&rb!=null&&rb>ra?'w':'')+'">'+(rb==null?'-':rb)+'</td></tr>';
  h+='<tr><td>Kelengkapan</td><td class="'+(sa>sb?'w':'')+'">'+sa+'</td><td class="'+(sb>sa?'w':'')+'">'+sb+'</td></tr>';
  h+='<tr><td>Tingkat</td><td>'+esc(A.a.tier.split(' ')[0])+'</td><td>'+esc(B.a.tier.split(' ')[0])+'</td></tr>';
  h+='<tr><td>Status</td><td>'+(A.private?'Privat':'Publik')+'</td><td>'+(B.private?'Privat':'Publik')+'</td></tr></table>';
  var ff=(A.followers!=null&&B.followers!=null&&A.followers!==B.followers)?(A.followers>B.followers?A:B):null;
  if(ff&&Math.min(A.followers,B.followers)>0)h+='<div class="note" style="margin-top:8px">@'+esc(ff.username)+' punya pengikut '+(Math.max(A.followers,B.followers)/Math.min(A.followers,B.followers)).toFixed(1).replace('.',',')+' kali lipat lebih banyak.</div>';
  return h+'</div>';
}
function render(){
  var h='',i;
  if(tab==='ringkasan'){for(i=0;i<P.length;i++)h+=ringkasan(P[i],i);}
  else if(tab==='analisis'){for(i=0;i<P.length;i++)h+=analisis(P[i]);}
  else if(tab==='bio'){for(i=0;i<P.length;i++)h+=bio(P[i]);}
  else if(tab==='banding'){h=banding();}
  $('view').innerHTML=h;
  var t=[['ringkasan','Ringkasan'],['analisis','Analisis'],['bio','Bio']];
  if(P.length>1)t.push(['banding','Banding']);
  var c='';for(i=0;i<t.length;i++)c+='<button class="chip'+(t[i][0]===tab?' on':'')+'" onclick="__tab(\''+t[i][0]+'\')">'+t[i][1]+'</button>';
  $('tabs').innerHTML=c;
}
window.__tab=function(t){tab=t;render();};
$('sub').textContent=P.map(function(p){return '@'+p.username;}).join(' vs ')+' • '+C.waktu;
render();
})();
</script>
`;

function buildIgstalkHtml({ profiles = [], waktu = "" } = {}) {
  return BODY.replace("__BASECSS__", () => BASE_CSS).replace("__CFG__", () => safeJson({ profiles, waktu: String(waktu) }));
}

module.exports = { buildIgstalkHtml };
