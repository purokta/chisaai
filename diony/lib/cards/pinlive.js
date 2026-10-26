/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// ===========================================================================
// KARTU PINLIVE — cari & lihat gambar Pinterest langsung di dalam kartu
//
// Pola SENGAJA disalin dari buildMusikLiveHtml di atas: satu WebSocket ke
// relay-nya sendiri (lib/pinlive-relay.js), URL dibaca ulang tiap kartu
// dibuat lewat bacaRelayPin() karena alamat trycloudflare berubah tiap
// tunnel restart. Tidak ada ruangan "bareng" seperti Spotifylive - Pinlive
// murni sesi cari+lihat sendirian.
//
// Thumbnail & gambar penuh TIDAK bisa dimuat lewat <img src="https://...">
// biasa - sandbox kartu WA memblokir permintaan jaringan biasa (lihat
// catatan di scrape/richhtml.js). Makanya keduanya dikirim lewat WebSocket
// yang sama (thumbnail langsung sebagai data URI, gambar penuh dipotong jadi
// beberapa bongkah base64), lalu kartu ini merakitnya jadi <img>/Blob URL.
//
// Tampilan meniru gaya app Pinterest: kolom cari + tombol "Cari" merah, deret
// chip tag saran, grid dua kolom, dan layar detail dengan penghitung index,
// tombol salin link, dan tombol unduh. Naik/turun dipakai buat pindah kartu
// (bukan gulir jari) - alasannya sama dengan kenapa Spotifylive pakai tombol
// buat daftar lagu: gulir jari tidak bisa diandalkan di dalam kartu WA.
// ===========================================================================

function escapeHtml(str) {
    return String(str == null ? '' : str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function buildPinLiveHtml(opts = {}) {
    const botName = escapeHtml(opts.botName || 'Bot');
    const playerName = escapeHtml(opts.playerName || 'Kamu');

    const relayUrl = String(opts.relayUrl || '').trim();
    const konfig = JSON.stringify({
        url: /^wss?:\/\//.test(relayUrl) ? relayUrl : '',
        nama: opts.playerName || 'Pemain',
        // Kunci sesi 30 menit. Dibuat bot lewat pinliveRelay.buatKunci(), dan
        // server memutus sambungan begitu kuncinya lewat masa berlaku.
        kunci: String(opts.kunci || '')
    });

    return `
<style>
:root{
  --bg:#0b0b0b; --card:#141414; --card-2:#1c1c1c;
  --ink:#ffffff; --ink-soft:#b8b8b8; --muted:#8a8a8a;
  --red:#e60023; --red-hi:#ff2440; --line:#2a2a2a;
  --sys:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
}
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
html,body{background:transparent;color:var(--ink);font-family:var(--sys);min-height:100vh;overflow-x:hidden;-webkit-font-smoothing:antialiased;}
.stage{min-height:100vh;display:flex;align-items:flex-start;justify-content:center;padding:14px 10px;}

.app{
  width:100%;max-width:380px;border-radius:16px;overflow:hidden;position:relative;
  background:linear-gradient(180deg,#232323 0%,#161616 26%,var(--bg) 62%);
  box-shadow:0 18px 40px rgba(0,0,0,.55);
  padding:14px 12px 16px;
}

/* ---------- header ---------- */
.top{display:flex;align-items:center;gap:9px;margin-bottom:12px;}
.top__logo{width:24px;height:24px;border-radius:50%;background:var(--red);flex:none;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:900;color:#fff;}
.top__meta{min-width:0;flex:1;}
.top__title{font-size:13px;font-weight:800;letter-spacing:.01em;}
.top__sub{font-size:10.5px;color:var(--ink-soft);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px;}
.top__badge{font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--red-hi);border:1px solid rgba(230,0,35,.45);border-radius:20px;padding:3px 8px;flex:none;}

.status{font-size:10.5px;color:var(--muted);margin-bottom:10px;min-height:13px;transition:color .2s;}
.status.wait{color:#e0b34d;}
.status.bad{color:#ff6b6b;}

/* ---------- kolom cari ---------- */
.searchbar{display:flex;gap:8px;margin-bottom:10px;}
.searchbar input{
  flex:1;min-width:0;background:var(--card-2);border:1px solid var(--line);border-radius:24px;
  padding:10px 14px;color:var(--ink);font-size:13px;outline:none;
}
.searchbar input::placeholder{color:var(--muted);}
.searchbar button{
  flex:none;background:var(--red);color:#fff;border:none;border-radius:24px;
  padding:0 18px;font-size:12.5px;font-weight:800;cursor:pointer;
}
.searchbar button:active{background:var(--red-hi);}
.searchbar button:disabled{opacity:.5;}

.tags{display:flex;gap:6px;overflow-x:auto;padding-bottom:10px;margin-bottom:2px;scrollbar-width:none;}
.tags::-webkit-scrollbar{display:none;}
.tag{
  flex:none;background:var(--card-2);border:1px solid var(--line);color:var(--ink-soft);
  font-size:10.5px;font-weight:600;border-radius:16px;padding:6px 11px;cursor:pointer;white-space:nowrap;
}
.tag:active{background:#292929;}

/* ---------- grid hasil ----------
   Dulu dipaging 6/halaman lewat tombol naik/turun (gulir jari dianggap
   tidak diandalkan di kartu WA). Sekarang grid-nya sendiri yang jadi area
   gulir (overflow-y:auto internal, BUKAN gulir dokumen/halaman penuh) -
   nested scroll begini jauh lebih konsisten ditangkap webview kartu
   dibanding gulir di level halaman, dan tetap dilengkapi kartu yang masuk
   dengan animasi halus (bukan main ganti isi tiba-tiba/kaku). Waktu gulir
   sampai (hampir) dasar, kartu otomatis minta batch pin berikutnya ke
   server (lihat cobaMuatLanjut) - jadi tidak mentok cuma di sejumlah kecil
   foto pertama saja. */
.gridwrap{position:relative;}
.grid{
  display:grid;grid-template-columns:1fr 1fr;gap:8px;min-height:120px;
  /* Piksel, BUKAN vh. Di WebView kartu WA tinggi viewport ditentukan isi
     kartu bukan layar HP, jadi 58vh bikin grid-nya kependekan - cuma
     kebagian dua baris foto. 560px kira-kira 4 baris, mirip galeri
     Pinterest di HP. */
  max-height:560px;overflow-y:auto;overscroll-behavior:contain;
  scroll-behavior:smooth;-webkit-overflow-scrolling:touch;
  padding-bottom:2px;
}
.grid::-webkit-scrollbar{width:4px;}
.grid::-webkit-scrollbar-thumb{background:var(--line);border-radius:4px;}

/* sepasang tombol kecil naik/turun di bawah grid - gulir jari kadang tidak
   diambil webview kartu WA (kena rebut daftar pesan), jadi ini jalan
   cadangan yang selalu bisa dipakai. Cuma muncul kalau grid-nya memang
   lebih tinggi dari area yang kelihatan (lihat is-on di gulirGrid()). */
.grid-gulir{display:none;align-items:center;justify-content:center;gap:8px;margin:6px 0 2px;}
.grid-gulir.is-on{display:flex;}
.grid-gulir button{
  width:26px;height:22px;border:none;border-radius:7px;cursor:pointer;padding:0;
  background:var(--card-2);border:1px solid var(--line);color:var(--ink-soft);
  font-size:10px;line-height:1;display:flex;align-items:center;justify-content:center;
}
.grid-gulir button:active{background:#292929;}
.grid-gulir button:disabled{opacity:.3;}
.grid-gulir__info{font-size:10px;color:var(--muted);min-width:26px;text-align:center;}
.pin-card{
  border-radius:12px;overflow:hidden;background:var(--card-2);border:1px solid var(--line);
  cursor:pointer;position:relative;aspect-ratio:3/4;
  opacity:0;transform:translateY(12px) scale(.97);
  transition:opacity .34s ease, transform .34s ease;
}
.pin-card.masuk{opacity:1;transform:translateY(0) scale(1);}
.pin-card img{width:100%;height:100%;object-fit:cover;display:block;}
.pin-card .ph{width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:10px;}
.pin-card .cap{
  position:absolute;left:0;right:0;bottom:0;padding:14px 8px 6px;
  background:linear-gradient(180deg,transparent,rgba(0,0,0,.75));
  font-size:9.5px;color:#fff;font-weight:600;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.pin-card .vbadge{
  position:absolute;top:6px;right:6px;width:20px;height:20px;border-radius:50%;
  background:rgba(20,20,20,.75);color:#fff;font-size:9px;display:flex;align-items:center;justify-content:center;
}

/* status di bawah grid: "memuat foto lain..." atau "sudah semua ditampilkan" */
.gridstatus{font-size:10.5px;color:var(--muted);text-align:center;padding:9px 4px 2px;min-height:15px;}
.gridstatus .dot{display:inline-block;width:4px;height:4px;border-radius:50%;background:var(--muted);margin-left:3px;animation:pinDot 1s infinite ease-in-out;}
.gridstatus .dot:nth-child(2){animation-delay:.15s;}
.gridstatus .dot:nth-child(3){animation-delay:.3s;}
@keyframes pinDot{0%,80%,100%{opacity:.25;transform:translateY(0);}40%{opacity:1;transform:translateY(-2px);}}

.empty,.hint{font-size:11.5px;color:var(--muted);text-align:center;padding:26px 10px;}

/* ---------- layar detail ---------- */
.detail{position:absolute;inset:0;background:var(--bg);border-radius:16px;display:none;flex-direction:column;padding:12px;z-index:20;}
.detail.show{display:flex;}
.detail__top{display:flex;align-items:center;gap:8px;margin-bottom:10px;}
.detail__back{flex:none;width:28px;height:28px;border-radius:50%;background:var(--card-2);border:1px solid var(--line);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:14px;}
.detail__count{flex:1;text-align:center;font-size:11.5px;color:var(--ink-soft);font-weight:700;}
.detail__copy{flex:none;height:28px;border-radius:14px;background:var(--red);color:#fff;border:none;padding:0 12px;font-size:11px;font-weight:800;cursor:pointer;display:flex;align-items:center;gap:5px;}
.detail__copy:disabled{opacity:.55;}

.detail__stage{flex:1;position:relative;border-radius:12px;overflow:hidden;background:var(--card-2);display:flex;align-items:center;justify-content:center;}
.detail__stage img,.detail__stage video{width:100%;height:100%;object-fit:contain;display:block;opacity:0;transition:opacity .28s ease;}
.detail__stage img.masuk,.detail__stage video.masuk{opacity:1;}
.detail__stage .loading{font-size:11px;color:var(--ink-soft);}
.detail__nav{position:absolute;right:8px;bottom:8px;display:flex;flex-direction:column;gap:8px;}
.detail__nav button{width:34px;height:34px;border-radius:50%;border:none;background:rgba(20,20,20,.82);color:#fff;font-size:15px;cursor:pointer;box-shadow:0 4px 10px rgba(0,0,0,.4);}
.detail__nav button:disabled{opacity:.35;}
.detail__caption{margin-top:8px;font-size:10.5px;color:var(--ink-soft);}
.detail__caption b{color:var(--ink);}

.toast{
  position:absolute;left:50%;bottom:14px;transform:translateX(-50%) translateY(10px);
  background:rgba(20,20,20,.92);border:1px solid var(--line);color:#fff;font-size:11px;font-weight:600;
  padding:8px 14px;border-radius:20px;opacity:0;transition:opacity .2s,transform .2s;pointer-events:none;z-index:30;
}
.toast.show{opacity:1;transform:translateX(-50%) translateY(0);}

.mati{display:none;margin-top:10px;font-size:10.5px;color:#ff8a8a;text-align:center;line-height:1.5;}
</style>

<div class="stage">
  <div class="app" id="app">

    <div class="top">
      <div class="top__logo">P</div>
      <div class="top__meta">
        <div class="top__title">Pinlive — ${botName}</div>
        <div class="top__sub" id="sub">Pencarian gambar Pinterest langsung</div>
      </div>
      <div class="top__badge">LIVE</div>
    </div>

    <div class="status" id="status">Menyambung ke server...</div>

    <div class="searchbar">
      <input id="in-q" type="text" placeholder="Cari sesuatu di Pinterest..." maxlength="80" />
      <button id="btn-cari">Cari</button>
    </div>
    <div class="tags" id="tags" style="display:none;"></div>

    <div class="gridwrap">
      <div class="grid" id="grid"></div>
    </div>
    <div class="grid-gulir" id="grid-gulir">
      <button id="grid-atas" title="Ke atas">▲</button>
      <span class="grid-gulir__info" id="grid-gulir-info"></span>
      <button id="grid-bawah" title="Ke bawah">▼</button>
    </div>
    <div class="gridstatus" id="gstatus" style="display:none;"></div>
    <div class="hint" id="hint">Ketik kata kunci lalu tekan Cari untuk mulai.</div>

    <div class="detail" id="detail">
      <div class="detail__top">
        <div class="detail__back" id="d-back">←</div>
        <div class="detail__count" id="d-count">1/1</div>
        <button class="detail__copy" id="d-copy">📋 Salin</button>
      </div>
      <div class="detail__stage" id="d-stage"><span class="loading">Menyiapkan...</span></div>
      <div class="detail__nav">
        <button id="d-up">▲</button>
        <button id="d-down">▼</button>
      </div>
      <div class="detail__caption" id="d-cap"></div>
    </div>

    <div class="toast" id="toast"></div>
    <div class="mati" id="mati"><span>Server tidak menjawab.</span></div>
  </div>
</div>

<script>
(function(){
  var CFG = ${konfig};
  var $ = function(id){ return document.getElementById(id); };

  var ws = null, nyambung = false, ulangSambung = 0, timerSambung = null, sesiMati = false;

  var currentList = [];   // {i,title,pinner,link,domain,thumb}
  var currentQuery = '';

  // Grid sekarang gulir menerus (bukan dipaging tombol naik/turun lagi) -
  // habisHasil menandai kata kunci ini sudah tidak punya batch lanjutan di
  // Pinterest sama sekali, sedangMuatLanjut mengunci supaya gulir yang
  // dipicu berkali-kali dalam sedetik tidak numpuk beberapa pl_lanjut
  // sekaligus ke server.
  var habisHasil = false;
  var sedangMuatLanjut = false;

  var detailOpen = false;
  var detailIndex = -1;
  // true selagi layar detail lagi nunggu batch lanjutan (dipicu dari tombol
  // "▼" pas sudah di foto terakhir yang termuat) supaya begitu batch itu
  // sampai, kartu bisa lanjut otomatis ke foto berikutnya tanpa orangnya
  // harus balik ke grid dulu buat "mancing" batch itu turun.
  var detailTungguLanjut = false;
  var mediaCache = {};     // i -> {kind:'image'|'video', mime, url, chunks:[], total, diterima}

  function setStatus(t, kls){
    var el = $('status');
    el.textContent = t || '';
    el.className = 'status' + (kls ? ' ' + kls : '');
  }

  function toast(msg){
    var t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(function(){ t.classList.remove('show'); }, 1600);
  }

  function kirim(o){ try { if (ws && ws.readyState === 1) ws.send(JSON.stringify(o)); } catch(e){} }

  function sambung(){
    if (!CFG.url) { setStatus('Alamat server belum siap. Coba lagi sebentar.', 'bad'); return; }
    if (ws && (ws.readyState === 0 || ws.readyState === 1)) return;
    setStatus(ulangSambung ? 'Menyambung ulang...' : 'Menyambung ke server...', 'wait');
    try { ws = new WebSocket(CFG.url); } catch(e){ jadwalSambungUlang(); return; }

    (function(sock){
      setTimeout(function(){
        if (sock && sock.readyState === 0){ try { sock.close(); } catch(e){} }
      }, 9000);
    })(ws);

    ws.onopen = function(){
      kirim({ t:'pl_kunci', kunci: CFG.kunci || '' });
      nyambung = true; ulangSambung = 0;
      setStatus('Tersambung. Ketik kata kunci di atas.', null);
    };
    ws.onclose = function(){ nyambung = false; jadwalSambungUlang(); };
    ws.onerror = function(){ try { ws.close(); } catch(e){} };
    ws.onmessage = function(ev){
      var d; try { d = JSON.parse(ev.data); } catch(e){ return; }
      if (!d || String(d.t).slice(0,3) !== 'pl_') return;
      terima(d);
    };
  }

  function jadwalSambungUlang(){
    if (sesiMati) return;
    if (timerSambung || !CFG.url) return;
    ulangSambung++;
    var jeda = Math.min(1000 * ulangSambung, 8000);
    if (ulangSambung >= 3){
      setStatus('Server tidak menjawab. Kartu ini mungkin kedaluwarsa.', 'bad');
      $('mati').style.display = '';
      $('mati').firstElementChild.textContent = 'Alamat server di kartu ini sudah tidak hidup - alamatnya berubah tiap bot restart, jadi kartu lama (apalagi hasil diteruskan) tidak bisa nyambung lagi. Kirim ulang perintah .pinlive buat dapat kartu baru.';
    } else {
      setStatus('Koneksi putus. Mencoba lagi...', 'bad');
    }
    timerSambung = setTimeout(function(){ timerSambung = null; sambung(); }, jeda);
  }

  function terima(d){
    if (d.t === 'pl_kunci_ok') { return; }
    if (d.t === 'pl_kunci_habis') {
      sesiMati = true;
      setStatus('Sesi kartu ini sudah habis.', 'bad');
      $('mati').style.display = '';
      $('mati').firstElementChild.textContent = 'Sesi kartu ini berlaku 30 menit dan sudah habis. Kirim .pinlive lagi buat kartu baru.';
      return;
    }
    if (d.t === 'pl_err') {
      setStatus(d.m || 'Terjadi kesalahan.', 'bad');
      $('btn-cari').disabled = false;
      // Gagal di tengah auto-muat-lanjut (baik dipicu gulir grid maupun
      // tombol "▼" di layar detail) - lepas kuncinya sekarang juga
      // daripada nunggu batas waktu jaga-jaga di cobaMuatLanjut, supaya
      // orangnya bisa langsung coba gulir/tekan lagi.
      if (sedangMuatLanjut) { sedangMuatLanjut = false; sembunyikanStatusGrid(); }
      if (detailTungguLanjut) { detailTungguLanjut = false; renderDetailFrame(); }
      return;
    }
    if (d.t === 'pl_kosong') {
      $('btn-cari').disabled = false;
      currentList = [];
      habisHasil = true;
      sedangMuatLanjut = false;
      $('grid').innerHTML = '';
      sembunyikanStatusGrid();
      $('hint').style.display = '';
      $('hint').textContent = 'Tidak ada hasil untuk "' + d.q + '". Coba kata kunci lain.';
      return;
    }
    if (d.t === 'pl_hasil') { onHasil(d); return; }
    if (d.t === 'pl_hasil_tambahan') { onHasilTambahan(d); return; }
    if (d.t === 'pl_habis') { onHabis(d); return; }
    if (d.t === 'pl_media_proses') { onMediaProses(d); return; }
    if (d.t === 'pl_media_meta') { onMediaMeta(d); return; }
    if (d.t === 'pl_media_bongkah') { onMediaBongkah(d); return; }
    if (d.t === 'pl_media_selesai') { onMediaSelesai(d); return; }
  }

  function onHasil(d){
    $('btn-cari').disabled = false;
    currentQuery = d.q;
    currentList = d.list || [];
    habisHasil = !!d.habis;
    sedangMuatLanjut = false;
    $('sub').textContent = 'Hasil untuk "' + d.q + '" (' + currentList.length + ')';
    setStatus('Ketuk salah satu gambar untuk melihat penuh.', null);
    $('hint').style.display = 'none';

    // PENTING: bersihkan cache media & tutup layar detail tiap hasil
    // pencarian baru datang. Tanpa ini, index (0,1,2,...) dipakai ulang
    // tiap pencarian baru, jadi kalau sebelumnya pernah buka detail index 0
    // di kata kunci lama, kartu bisa nampilin gambar/video LAMA itu lagi
    // waktu index 0 dibuka di hasil pencarian yang baru - caption benar
    // (diambil dari currentList terbaru) tapi gambarnya nyasar punya yang
    // lama.
    mediaCache = {};
    if (detailOpen) tutupDetail();

    var tagsEl = $('tags');
    tagsEl.innerHTML = '';
    (d.tags || []).forEach(function(tag){
      var chip = document.createElement('div');
      chip.className = 'tag';
      chip.textContent = tag;
      chip.onclick = function(){ $('in-q').value = tag; mulaiCari(tag); };
      tagsEl.appendChild(chip);
    });
    tagsEl.style.display = (d.tags && d.tags.length) ? 'flex' : 'none';

    var grid = $('grid');
    grid.innerHTML = '';
    grid.scrollTop = 0;
    sembunyikanStatusGrid();
    tambahKartu(currentList);
    if (habisHasil) tampilkanStatusHabis();
    gulirGrid.perbarui();
  }

  // Bikin satu elemen kartu pin buat grid - dipisah dari tambahKartu supaya
  // bisa dipakai baik waktu render hasil pencarian baru maupun waktu
  // menyisipkan batch tambahan hasil gulir ke bawah (pl_hasil_tambahan).
  function buatKartuPin(p){
    var card = document.createElement('div');
    card.className = 'pin-card';
    if (p.thumb) {
      var img = document.createElement('img');
      img.src = p.thumb;
      card.appendChild(img);
    } else {
      var ph = document.createElement('div');
      ph.className = 'ph';
      ph.textContent = 'Gagal muat';
      card.appendChild(ph);
    }
    if (p.video) {
      var vb = document.createElement('div');
      vb.className = 'vbadge';
      vb.textContent = '▶';
      card.appendChild(vb);
    }
    if (p.title) {
      var cap = document.createElement('div');
      cap.className = 'cap';
      cap.textContent = p.title;
      card.appendChild(cap);
    }
    card.onclick = function(){ bukaDetail(p.i); };
    return card;
  }

  // Tambah kartu ke grid TANPA membuang isi yang sudah ada (dipakai baik
  // buat render awal maupun nyisip batch baru pas gulir sampai bawah), lalu
  // kasih animasi masuk halus (fade + naik dikit) - bukan main muncul
  // langsung kaku. Class 'masuk' sengaja ditambahkan sesudah frame
  // berikutnya (double rAF) supaya browser sempat "melihat" dulu state
  // awalnya (opacity 0) sebelum transisi CSS-nya jalan; kalau class-nya
  // ditambah di frame yang sama, browser bisa menggabungnya jadi satu
  // render dan transisinya tidak kelihatan sama sekali.
  function tambahKartu(list){
    if (!list || !list.length) return;
    var grid = $('grid');
    var elBaru = list.map(function(p){
      var card = buatKartuPin(p);
      grid.appendChild(card);
      return card;
    });
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        elBaru.forEach(function(el){ el.classList.add('masuk'); });
      });
    });
  }

  function sembunyikanStatusGrid(){
    $('gstatus').style.display = 'none';
  }
  function tampilkanStatusMuat(){
    var el = $('gstatus');
    el.style.display = '';
    el.className = 'gridstatus';
    el.innerHTML = 'Memuat foto lain<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
  }
  function tampilkanStatusHabis(){
    var el = $('gstatus');
    el.style.display = '';
    el.className = 'gridstatus';
    el.textContent = 'Sudah semua foto ditampilkan untuk kata kunci ini.';
  }

  // Sepasang tombol kecil "Ke atas"/"Ke bawah" di bawah grid - cadangan
  // buat gulir jari yang kadang tidak diambil webview kartu WA. Tombolnya
  // cuma tampil kalau isi grid memang lebih tinggi dari area yang
  // kelihatan, dan nonaktif sendiri pas sudah mentok atas/bawah. Dipanggil
  // ulang (perbarui) tiap grid digulir dan tiap ada kartu baru masuk.
  function pasangGulirGrid(){
    var el = $('grid');
    function perbarui(){
      var bisa = el.scrollHeight - el.clientHeight > 4;
      $('grid-gulir').className = 'grid-gulir' + (bisa ? ' is-on' : '');
      if (!bisa) return;
      $('grid-atas').disabled = el.scrollTop <= 1;
      $('grid-bawah').disabled = el.scrollTop >= el.scrollHeight - el.clientHeight - 1;
      var hal = Math.max(1, Math.ceil(el.scrollHeight / Math.max(1, el.clientHeight)));
      var kini = Math.min(hal, Math.floor(el.scrollTop / Math.max(1, el.clientHeight)) + 1);
      $('grid-gulir-info').textContent = kini + '/' + hal;
    }
    function geser(arah){
      el.scrollTop += arah * Math.max(80, el.clientHeight - 40);
      setTimeout(perbarui, 260);
    }
    $('grid-atas').addEventListener('click', function(){ geser(-1); });
    $('grid-bawah').addEventListener('click', function(){ geser(1); });
    return { perbarui: perbarui };
  }
  var gulirGrid = pasangGulirGrid();

  // Dipanggil waktu grid digulir sampai (hampir) dasar. Terkunci lewat
  // sedangMuatLanjut supaya beberapa event scroll beruntun dalam sedetik
  // tidak numpuk beberapa permintaan pl_lanjut sekaligus ke server.
  function cobaMuatLanjut(){
    if (sedangMuatLanjut || habisHasil) return;
    if (!nyambung || !currentQuery || !currentList.length) return;
    sedangMuatLanjut = true;
    tampilkanStatusMuat();
    kirim({ t:'pl_lanjut', q: currentQuery });
    // Jaga-jaga kalau balasannya nyasar/hilang total (mis. koneksi putus
    // persis waktu itu, tanpa sempat kirim pl_err/pl_habis) - lepas kunci
    // gulirnya sendiri setelah beberapa detik supaya percobaan berikutnya
    // masih bisa jalan. Kalau ternyata sudah dijawab lebih dulu (lewat
    // onHasilTambahan/onHabis/pl_err), flag-flag ini sudah balik false
    // duluan jadi blok di bawah tidak melakukan apa-apa.
    setTimeout(function(){
      sedangMuatLanjut = false;
      if (detailTungguLanjut) {
        detailTungguLanjut = false;
        renderDetailFrame();
        toast('Gagal memuat foto berikutnya. Coba lagi.');
      }
    }, 12000);
  }

  $('grid').addEventListener('scroll', function(){
    var g = $('grid');
    if (g.scrollTop + g.clientHeight >= g.scrollHeight - 90) cobaMuatLanjut();
    gulirGrid.perbarui();
  }, { passive: true });

  function onHasilTambahan(d){
    if (d.q !== currentQuery) return;
    sedangMuatLanjut = false;
    var mulaiDari = currentList.length;
    currentList = currentList.concat(d.list || []);
    tambahKartu(d.list || []);

    if (d.habis) { habisHasil = true; tampilkanStatusHabis(); }
    else { sembunyikanStatusGrid(); }
    gulirGrid.perbarui();

    // Layar detail lagi nunggu batch ini buat lanjut otomatis (lihat
    // $('d-down').onclick) - begitu ada foto baru, langsung pindah ke foto
    // pertama dari batch barunya tanpa orangnya perlu balik ke grid dulu.
    if (detailOpen && detailTungguLanjut && (d.list || []).length) {
      detailTungguLanjut = false;
      detailIndex = mulaiDari;
      renderDetailFrame();
      mintaMedia(detailIndex);
    } else if (detailOpen) {
      renderDetailFrame(); // total & status tombol "▼" ikut ter-update
    }
  }

  function onHabis(d){
    if (d.q !== currentQuery) return;
    sedangMuatLanjut = false;
    habisHasil = true;
    tampilkanStatusHabis();
    if (detailOpen && detailTungguLanjut) {
      detailTungguLanjut = false;
      renderDetailFrame();
      toast('Sudah foto terakhir untuk kata kunci ini.');
    }
  }

  function mulaiCari(q){
    q = String(q || '').trim();
    if (!q) return;
    if (!nyambung) { setStatus('Belum tersambung ke server, tunggu sebentar...', 'wait'); return; }
    $('btn-cari').disabled = true;
    setStatus('Mencari "' + q + '"...', 'wait');
    kirim({ t:'pl_cari', q: q });
  }
  $('btn-cari').onclick = function(){ mulaiCari($('in-q').value); };
  $('in-q').addEventListener('keydown', function(ev){ if (ev.key === 'Enter') mulaiCari($('in-q').value); });

  // ---------------- detail ----------------
  function bukaDetail(i){
    detailOpen = true;
    detailIndex = i;
    $('detail').classList.add('show');
    renderDetailFrame();
    mintaMedia(i);
  }
  function tutupDetail(){
    detailOpen = false;
    $('detail').classList.remove('show');
    // Hentikan video yang lagi jalan biar tidak nyanyi di belakang layar
    // waktu kartu ditutup.
    var v = $('d-stage').querySelector('video');
    if (v) { try { v.pause(); } catch(e){} }
  }
  $('d-back').onclick = tutupDetail;

  function renderDetailFrame(){
    var total = currentList.length;
    $('d-count').textContent = (detailIndex + 1) + '/' + total;
    $('d-up').disabled = (detailIndex <= 0);
    // Tombol "▼" TETAP aktif di foto terakhir yang sudah termuat selama
    // kata kunci ini masih mungkin punya batch lanjutan (belum habisHasil) -
    // menekannya di posisi itu memicu auto-muat lewat handler di bawah,
    // bukan cuma dikunci diam kalau grid-nya sendiri belum tahu sudah habis
    // atau belum.
    $('d-down').disabled = (detailIndex >= total - 1) && habisHasil;
    var p = currentList[detailIndex] || {};
    $('d-cap').innerHTML = (p.title ? '<b>' + escapeHtmlJs(p.title) + '</b><br>' : '') + (p.pinner ? 'oleh ' + escapeHtmlJs(p.pinner) : '');
    // Link pin sudah ada dari hasil pencarian - tidak perlu nunggu gambar
    // atau videonya kelar dimuat buat bisa disalin.
    $('d-copy').disabled = !p.link;
  }

  function escapeHtmlJs(s){
    return String(s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  $('d-up').onclick = function(){ if (detailIndex > 0) { detailIndex--; renderDetailFrame(); mintaMedia(detailIndex); } };
  $('d-down').onclick = function(){
    if (detailIndex < currentList.length - 1) {
      detailIndex++; renderDetailFrame(); mintaMedia(detailIndex);
      return;
    }
    // Sudah di foto terakhir yang termuat. Kalau kata kuncinya masih punya
    // sisa di Pinterest, tarik dulu batch berikutnya di belakang layar lalu
    // lanjut otomatis begitu sampai (lihat onHasilTambahan) - jadi orangnya
    // tidak perlu keluar ke grid dulu cuma buat "mancing" batch berikutnya
    // turun.
    if (habisHasil) { toast('Sudah foto terakhir untuk kata kunci ini.'); return; }
    detailTungguLanjut = true;
    $('d-down').disabled = true;
    toast('Memuat foto berikutnya...');
    cobaMuatLanjut();
  };

  $('d-copy').onclick = function(){
    var p = currentList[detailIndex];
    if (!p) return;

    // Yang disalin adalah URL foto/video yang SEDANG ditampilkan, bukan link
    // halaman Pinterest-nya. Alamat media itu baru diketahui setelah server
    // mengirim meta, jadi diambil dari cache media - dengan link halaman
    // sebagai cadangan kalau medianya belum sempat dimuat.
    var c = mediaCache[detailIndex];
    var alamat = (c && c.media) || p.link;
    if (!alamat) { toast('Pin ini tidak punya link sumber.'); return; }

    var label = (c && c.media)
      ? (c.kind === 'video' ? 'Link video disalin' : 'Link foto disalin')
      : 'Link pin disalin';
    salinTeks(alamat, function(ok){ toast(ok ? label : 'Gagal menyalin link'); });
  };

  // Coba execCommand('copy') dulu (cara lama, paling luas didukung di
  // webview terbatas kayak kartu interaktif WhatsApp) - baru kalau itu
  // gagal, coba clipboard API modern. PENTING: navigator.clipboard.writeText
  // di sebagian webview bisa melempar error LANGSUNG (bukan Promise
  // ditolak) begitu dipanggil - jadi harus dibungkus try/catch juga,
  // supaya tidak berhenti diam-diam sebelum sempat coba cara cadangan.
  function salinTeks(teks, cb){
    cb = cb || function(){};

    if (fallbackSalin(teks)) { cb(true); return; }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        var sudahDijawab = false;
        var jawab = function(ok){ if (sudahDijawab) return; sudahDijawab = true; cb(ok); };
        try {
          navigator.clipboard.writeText(teks).then(function(){ jawab(true); }).catch(function(){ jawab(false); });
        } catch(e) { jawab(false); return; }
        setTimeout(function(){ jawab(false); }, 700);
        return;
      }
    } catch(e){}
    cb(false);
  }

  function fallbackSalin(teks){
    try {
      var ta = document.createElement('textarea');
      ta.value = teks;
      ta.style.position = 'fixed';
      ta.style.top = '0';
      ta.style.left = '0';
      ta.style.opacity = '0';
      ta.setAttribute('readonly', '');
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      ta.setSelectionRange(0, teks.length);
      var ok = false;
      try { ok = document.execCommand('copy'); } catch(e) { ok = false; }
      document.body.removeChild(ta);
      return !!ok;
    } catch(e){ return false; }
  }

  function mintaMedia(i){
    var stage = $('d-stage');
    var p = currentList[i] || {};
    var kind = p.video ? 'video' : 'image';
    var c = mediaCache[i];
    if (c && c.url) {
      tampilkanMedia(c);
      return;
    }
    stage.innerHTML = '<span class="loading">' + (kind === 'video' ? 'Menyiapkan video...' : 'Menyiapkan gambar...') + '</span>';
    kirim({ t:'pl_media', i: i, kind: kind, q: currentQuery });
  }

  // Ganti media di layar detail dengan crossfade halus (elemen dibuat lewat
  // DOM API, bukan innerHTML string, supaya bisa dipasangi event load/loadeddata
  // buat memicu class 'masuk' - baru pudar-masuk begitu medianya benar-benar
  // siap ditampilkan, bukan main muncul kaku begitu src dipasang).
  function tampilkanMedia(c){
    var stage = $('d-stage');
    stage.innerHTML = '';
    var el;
    if (c.kind === 'video') {
      el = document.createElement('video');
      el.src = c.url;
      el.controls = true;
      el.playsInline = true;
      el.preload = 'auto';
    } else {
      el = document.createElement('img');
      el.src = c.url;
    }
    stage.appendChild(el);

    var tandaiMasuk = function(){ el.classList.add('masuk'); };
    el.addEventListener(c.kind === 'video' ? 'loadeddata' : 'load', tandaiMasuk, { once: true });
    // Data URI base64 biasanya sudah siap dalam hitungan milidetik, tapi
    // jaga-jaga kalau event load-nya entah kenapa tidak pernah nembak di
    // sebagian webview kartu - paksa tetap muncul lewat timeout singkat
    // supaya gambarnya tidak nyangkut transparan selamanya.
    setTimeout(tandaiMasuk, 400);
  }

  function onMediaProses(d){
    // Buang balasan "nyasar" dari pencarian sebelumnya (lihat catatan di
    // onHasil) - kalau query di balasan sudah tidak sama dengan yang aktif
    // sekarang, abaikan total, jangan disentuh cache/tampilan sama sekali.
    if (d.q !== currentQuery) return;
    if (d.i !== detailIndex) return;
    $('d-stage').innerHTML = '<span class="loading">' + (d.kind === 'video' ? 'Menyiapkan video...' : 'Menyiapkan gambar...') + '</span>';
  }
  function onMediaMeta(d){
    if (d.q !== currentQuery) return;
    mediaCache[d.i] = { kind: d.kind, mime: d.mime, media: d.media || null, chunks: new Array(d.totalBongkah), total: d.totalBongkah, diterima: 0, url: null };
    if (d.i === detailIndex && d.fallback) {
      toast(d.kind === 'image' ? 'Video tidak tersedia, menampilkan gambar' : 'Memuat ulang media');
    }
  }
  function onMediaBongkah(d){
    if (d.q !== currentQuery) return;
    var c = mediaCache[d.i];
    if (!c) return;
    c.chunks[d.c] = d.data;
    c.diterima++;
    if (d.i === detailIndex && c.total > 1) {
      var pct = Math.round((c.diterima / c.total) * 100);
      var lbl = $('d-stage').querySelector('.loading');
      if (lbl) lbl.textContent = (c.kind === 'video' ? 'Memuat video... ' : 'Memuat gambar... ') + pct + '%';
    }
  }
  function onMediaSelesai(d){
    if (d.q !== currentQuery) return;
    var c = mediaCache[d.i];
    if (!c) return;
    var b64 = c.chunks.join('');
    c.url = 'data:' + c.mime + ';base64,' + b64;
    c.chunks = null;
    if (d.i === detailIndex) tampilkanMedia(c);
  }

  sambung();
})();
</script>
`;
}

module.exports = { buildPinLiveHtml };
