/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// ===========================================================================
// YTLIVE-CARD — diambil PERSIS dari scrape/ytlive.js sairi (fungsi buildYtLiveHtml)
// Hanya ganti: module.exports -> export
// HTML/CSS/JS di dalam TIDAK DIUBAH SAMA SEKALI
// ===========================================================================

function escapeHtml(str) {
    return String(str == null ? '' : str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function buildYtLiveHtml(opts = {}) {
    const botName = escapeHtml(opts.botName || 'Bot');

    const relayUrl = String(opts.relayUrl || '').trim();
    const konfig = JSON.stringify({
        url: /^wss?:\/\//.test(relayUrl) ? relayUrl : '',
        nama: opts.playerName || 'Pemain',
        kunci: String(opts.kunci || '')
    });

    return `
<style>
:root{
  --bg:#0f0f0f; --card:#181818; --card-2:#212121;
  --ink:#ffffff; --ink-soft:#aaaaaa; --muted:#8a8a8a;
  --red:#ff0000; --red-hi:#ff2e2e; --line:#303030;
  --sys:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
}
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
html,body{background:transparent;color:var(--ink);font-family:var(--sys);min-height:100vh;overflow-x:hidden;-webkit-font-smoothing:antialiased;}
.stage{min-height:100vh;display:flex;align-items:flex-start;justify-content:center;padding:14px 10px;}

.app{
  width:100%;max-width:380px;border-radius:16px;overflow:hidden;position:relative;
  background:linear-gradient(180deg,#242424 0%,#181818 26%,var(--bg) 62%);
  box-shadow:0 18px 40px rgba(0,0,0,.55);
  padding:14px 12px 16px;
}

/* ---------- header ---------- */
.top{display:flex;align-items:center;gap:9px;margin-bottom:12px;}
.top__logo{width:26px;height:19px;border-radius:6px;background:var(--red);flex:none;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:900;color:#fff;}
.top__logo svg{width:12px;height:12px;fill:#fff;}
.top__meta{min-width:0;flex:1;}
.top__title{font-size:13px;font-weight:800;letter-spacing:.01em;}
.top__sub{font-size:10.5px;color:var(--ink-soft);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px;}
.top__badge{font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--red-hi);border:1px solid rgba(255,0,0,.45);border-radius:20px;padding:3px 8px;flex:none;}

.status{font-size:10.5px;color:var(--muted);margin-bottom:10px;min-height:13px;transition:color .2s;}
.status.wait{color:#e0b34d;}
.status.bad{color:#ff6b6b;}

.jatah{display:none;font-size:10px;color:var(--ink-soft);margin:-6px 0 10px;line-height:1.5;}
.jatah b{color:#fff;font-weight:800;}
.jatah.habis{color:#ff8a8a;}
.jatah.habis b{color:#ff6b6b;}

.limit{padding:22px 16px;text-align:center;}
.limit__judul{font-size:13px;font-weight:800;color:#ff6b6b;margin-bottom:8px;}
.limit__isi{font-size:11px;color:var(--ink-soft);line-height:1.65;}
.limit__isi b{color:#fff;}

/* ---------- kolom cari ---------- */
.searchbar{display:flex;gap:8px;margin-bottom:12px;}
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

/* ---------- grid hasil ---------- */
.gridwrap{position:relative;}
.grid{
  display:flex;flex-direction:column;gap:10px;min-height:120px;
  max-height:520px;overflow-y:auto;overscroll-behavior:contain;
  scroll-behavior:smooth;-webkit-overflow-scrolling:touch;
  padding-bottom:2px;
}
.grid::-webkit-scrollbar{width:4px;}
.grid::-webkit-scrollbar-thumb{background:var(--line);border-radius:4px;}

.grid-gulir{display:none;align-items:center;justify-content:center;gap:8px;margin:2px 0 10px;}
.grid-gulir.is-on{display:flex;}
.grid-gulir button{
  width:26px;height:22px;border:none;border-radius:7px;cursor:pointer;padding:0;
  background:var(--card-2);border:1px solid var(--line);color:var(--ink-soft);
  font-size:10px;line-height:1;display:flex;align-items:center;justify-content:center;
}
.grid-gulir button:active{background:#2b2b2b;}
.grid-gulir button:disabled{opacity:.3;}
.grid-gulir__info{font-size:10px;color:var(--muted);min-width:26px;text-align:center;}

.vid-card{
  display:flex;gap:8px;cursor:pointer;
  opacity:0;transform:translateY(10px);transition:opacity .3s ease, transform .3s ease;
}
.vid-card.masuk{opacity:1;transform:translateY(0);}
.vid-card__thumb{flex:none;width:132px;aspect-ratio:16/9;border-radius:10px;overflow:hidden;position:relative;background:var(--card-2);}
.vid-card__thumb img{width:100%;height:100%;object-fit:cover;display:block;}
.vid-card__thumb .ph{width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:9px;}
.vid-card__dur{position:absolute;right:4px;bottom:4px;background:rgba(0,0,0,.8);color:#fff;font-size:9px;font-weight:700;padding:1px 4px;border-radius:4px;}
.vid-card__meta{min-width:0;flex:1;padding-top:1px;}
.vid-card__title{font-size:12px;font-weight:700;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.vid-card__channel{font-size:10.5px;color:var(--ink-soft);margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.vid-card__extra{font-size:9.5px;color:var(--muted);margin-top:2px;}

.empty,.hint{font-size:11.5px;color:var(--muted);text-align:center;padding:26px 10px;}

/* ---------- layar detail ---------- */
.detail{position:absolute;inset:0;background:var(--bg);border-radius:16px;display:none;flex-direction:column;padding:12px;z-index:20;}
.detail.show{display:flex;}
.detail__top{display:flex;align-items:center;gap:8px;margin-bottom:10px;}
.detail__back{flex:none;width:28px;height:28px;border-radius:50%;background:var(--card-2);border:1px solid var(--line);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:14px;}
.detail__count{flex:1;text-align:center;font-size:11.5px;color:var(--ink-soft);font-weight:700;}
.detail__copy{flex:none;height:28px;border-radius:14px;background:var(--red);color:#fff;border:none;padding:0 12px;font-size:11px;font-weight:800;cursor:pointer;display:flex;align-items:center;gap:5px;}
.detail__copy:disabled{opacity:.55;}

.detail__stage{flex:1;position:relative;border-radius:12px;overflow:hidden;background:#000;display:flex;align-items:center;justify-content:center;}
.detail__stage video{width:100%;height:100%;object-fit:contain;display:block;opacity:0;transition:opacity .28s ease;}
.detail__stage video.masuk{opacity:1;}

.app.gede .detail__stage{border-radius:14px;}
.detail__zoom{background:rgba(20,20,20,.82);}
.app.gede .detail__zoom{background:var(--red);}
.detail__stage .loading{font-size:11px;color:var(--ink-soft);text-align:center;padding:0 20px;}
.detail__nav{position:absolute;right:8px;bottom:8px;display:flex;flex-direction:column;gap:8px;}
.detail__nav button{width:34px;height:34px;border-radius:50%;border:none;background:rgba(20,20,20,.82);color:#fff;font-size:15px;cursor:pointer;box-shadow:0 4px 10px rgba(0,0,0,.4);}
.detail__nav button:disabled{opacity:.35;}
.detail__caption{margin-top:8px;}
.detail__caption b{display:block;font-size:11.5px;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.detail__caption span{font-size:10.5px;color:var(--ink-soft);}

.detail__next{margin-top:10px;border-top:1px solid var(--line);padding-top:8px;}
.detail__next h4{font-size:10px;font-weight:800;color:var(--muted);letter-spacing:.04em;text-transform:uppercase;margin-bottom:7px;}
.detail__next .isi{display:flex;flex-direction:column;gap:8px;max-height:190px;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;}
.detail__next .isi::-webkit-scrollbar{width:4px;}
.detail__next .isi::-webkit-scrollbar-thumb{background:var(--line);border-radius:4px;}
.app.gede .detail__next{display:none;}

.next-row{display:flex;gap:8px;cursor:pointer;padding:3px;border-radius:8px;}
.next-row:active{background:var(--card-2);}
.next-row.kini{background:var(--card-2);}
.next-row__thumb{flex:none;width:74px;aspect-ratio:16/9;border-radius:7px;overflow:hidden;background:var(--card-2);position:relative;}
.next-row__thumb img{width:100%;height:100%;object-fit:cover;display:block;}
.next-row__dur{position:absolute;right:3px;bottom:3px;background:rgba(0,0,0,.8);font-size:8px;font-weight:700;padding:1px 3px;border-radius:3px;}
.next-row__meta{min-width:0;flex:1;}
.next-row__title{font-size:10.5px;font-weight:700;line-height:1.28;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.next-row__ch{font-size:9px;color:var(--ink-soft);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.next-row__kini{font-size:9px;color:var(--red-hi);font-weight:800;margin-top:3px;}

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
      <div class="top__logo"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>
      <div class="top__meta">
        <div class="top__title">Ytlive — ${botName}</div>
        <div class="top__sub" id="sub">Cari & putar video YouTube langsung</div>
      </div>
      <div class="top__badge">LIVE</div>
    </div>

    <div class="status" id="status">Menyambung ke server...</div>
    <div class="jatah" id="jatah"></div>

    <div class="searchbar">
      <input id="in-q" type="text" placeholder="Cari video di YouTube..." maxlength="80" />
      <button id="btn-cari">Cari</button>
    </div>

    <div class="gridwrap">
      <div class="grid" id="grid"></div>
    </div>
    <div class="grid-gulir" id="grid-gulir">
      <button id="grid-atas" title="Ke atas">▲</button>
      <span class="grid-gulir__info" id="grid-gulir-info"></span>
      <button id="grid-bawah" title="Ke bawah">▼</button>
    </div>
    <div class="hint" id="hint">Ketik kata kunci lalu tekan Cari untuk mulai.</div>

    <div class="detail" id="detail">
      <div class="detail__top">
        <div class="detail__back" id="d-back">←</div>
        <div class="detail__count" id="d-count">1/1</div>
        <button class="detail__copy" id="d-copy">📋 Salin</button>
      </div>
      <div class="detail__stage" id="d-stage"><span class="loading">Menyiapkan...</span></div>
      <div class="detail__nav">
        <button id="d-zoom" class="detail__zoom" title="Perbesar">⛶</button>
        <button id="d-up">▲</button>
        <button id="d-down">▼</button>
      </div>
      <div class="detail__caption" id="d-cap"></div>
      <div class="detail__next" id="d-next">
        <h4>Selanjutnya</h4>
        <div class="isi" id="d-next-isi"></div>
      </div>
    </div>

    <div class="toast" id="toast"></div>
    <div class="mati" id="mati" style="display:none;"><span>Server tidak menjawab.</span></div>
  </div>
</div>

<script>
(function(){
  var CFG = ${konfig};
  var $ = function(id){ return document.getElementById(id); };

  var ws = null, nyambung = false, ulangSambung = 0, timerSambung = null, sesiMati = false;
  var currentList = [];
  var currentQuery = '';
  var detailOpen = false;
  var detailIndex = -1;
  var mediaCache = {};
  var jatahBebas = true, jatahSisa = -1, jatahBatas = 0, jatahNama = 'Free';

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

  function escapeHtml(s){
    var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML;
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
      kirim({ t:'yl_kunci', kunci: CFG.kunci || '' });
      nyambung = true; ulangSambung = 0;
      setStatus('Tersambung. Ketik kata kunci di atas.', null);
    };

    ws.onclose = function(){
      nyambung = false;
      if (sesiMati) return;
      setStatus('Terputus. ' + (ulangSambung ? 'Mencoba lagi...' : ''), 'bad');
      jadwalSambungUlang();
    };
    ws.onerror = function(){ try { ws.close(); } catch(e){} };

    ws.onmessage = function(ev){
      var d;
      try { d = JSON.parse(ev.data); } catch(e){ return; }
      tanganiPesan(d);
    };
  }

  function jadwalSambungUlang(){
    if (sesiMati) return;
    ulangSambung++;
    if (ulangSambung > 6) {
      setStatus('', null);
      $('mati').style.display = '';
      return;
    }
    clearTimeout(timerSambung);
    timerSambung = setTimeout(sambung, Math.min(1600 * ulangSambung, 8000));
  }

  function mulaiCari(q){
    var query = String(q || '').trim();
    if (!query) return;
    if (!nyambung) { setStatus('Belum tersambung ke server.', 'bad'); return; }
    $('btn-cari').disabled = true;
    setStatus('Mencari "' + query + '"...', 'wait');
    kirim({ t:'yl_cari', q: query });
  }

  $('btn-cari').addEventListener('click', function(){ mulaiCari($('in-q').value); });
  $('in-q').addEventListener('keydown', function(e){ if (e.key === 'Enter') mulaiCari($('in-q').value); });

  function tanganiPesan(d){
    if (d.t === 'yl_kunci_ok') { return; }
    if (d.t === 'yl_kunci_habis') {
      sesiMati = true;
      try { ws.close(); } catch(e){}
      setStatus('', null);
      $('mati').style.display = '';
      $('mati').firstElementChild.textContent = 'Sesi kartu ini berlaku 30 menit dan sudah habis. Kirim .ytlive lagi buat kartu baru.';
      return;
    }
    if (d.t === 'yl_err') {
      $('btn-cari').disabled = false;
      setStatus(d.m || 'Terjadi kesalahan.', 'bad');
      if (typeof d.i === 'number') onMediaGagal(d);
      return;
    }
    if (d.t === 'yl_jatah') { onJatah(d); return; }
    if (d.t === 'yl_limit') { onLimitHabis(d); return; }
    if (d.t === 'yl_hasil') { onHasil(d); return; }
    if (d.t === 'yl_media_proses') { onMediaProses(d); return; }
    if (d.t === 'yl_media_meta') { onMediaMeta(d); return; }
    if (d.t === 'yl_media_bongkah') { onMediaBongkah(d); return; }
    if (d.t === 'yl_media_selesai') { onMediaSelesai(d); return; }
    if (d.t === 'yl_pong') { return; }
  }

  function onHasil(d){
    $('btn-cari').disabled = false;
    currentQuery = d.q;
    currentList = d.list || [];
    $('sub').textContent = 'Hasil untuk "' + d.q + '" (' + currentList.length + ')';
    setStatus('Ketuk salah satu video untuk memutar.', null);
    $('hint').style.display = currentList.length ? 'none' : '';
    if (!currentList.length) $('hint').textContent = 'Tidak ada video ditemukan. Coba kata kunci lain.';

    mediaCache = {};
    if (detailOpen) tutupDetail();

    var grid = $('grid');
    grid.innerHTML = '';
    grid.scrollTop = 0;
    tambahKartu(currentList);
    gulirGrid.perbarui();
  }

  function buatKartuVideo(v){
    var card = document.createElement('div');
    card.className = 'vid-card';

    var thumb = document.createElement('div');
    thumb.className = 'vid-card__thumb';
    if (v.thumb) {
      var img = document.createElement('img');
      img.src = v.thumb;
      thumb.appendChild(img);
    } else {
      var ph = document.createElement('div');
      ph.className = 'ph';
      ph.textContent = 'Gagal muat';
      thumb.appendChild(ph);
    }
    if (v.duration) {
      var dur = document.createElement('div');
      dur.className = 'vid-card__dur';
      dur.textContent = v.duration;
      thumb.appendChild(dur);
    }
    card.appendChild(thumb);

    var meta = document.createElement('div');
    meta.className = 'vid-card__meta';
    meta.innerHTML =
      '<div class="vid-card__title"></div>' +
      '<div class="vid-card__channel"></div>' +
      '<div class="vid-card__extra"></div>';
    meta.querySelector('.vid-card__title').textContent = v.title || '(tanpa judul)';
    meta.querySelector('.vid-card__channel').textContent = v.channel || '-';
    meta.querySelector('.vid-card__extra').textContent = [v.views, v.datePassed].filter(Boolean).join(' • ');
    card.appendChild(meta);

    card.onclick = function(){ bukaDetail(v.i); };
    return card;
  }

  function tambahKartu(list){
    if (!list || !list.length) return;
    var grid = $('grid');
    var elBaru = list.map(function(v){
      var card = buatKartuVideo(v);
      grid.appendChild(card);
      return card;
    });
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        elBaru.forEach(function(el){ el.classList.add('masuk'); });
      });
    });
  }

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
    el.addEventListener('scroll', perbarui, { passive: true });
    return { perbarui: perbarui };
  }
  var gulirGrid = pasangGulirGrid();

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
    var v = $('d-stage').querySelector('video');
    if (v) { try { v.pause(); } catch(e){} }
    setGede(false);
  }
  $('d-back').addEventListener('click', tutupDetail);
  $('d-zoom').addEventListener('click', function(){ setGede(!modeGede); });

  function renderDetailFrame(){
    var v = currentList[detailIndex];
    $('d-count').textContent = (detailIndex + 1) + '/' + currentList.length;
    if (v) {
      $('d-cap').innerHTML = '';
      var b = document.createElement('b'); b.textContent = v.title || '-';
      var s = document.createElement('span'); s.textContent = v.channel || '-';
      $('d-cap').appendChild(b); $('d-cap').appendChild(s);
    }
    $('d-up').disabled = detailIndex <= 0;
    $('d-down').disabled = detailIndex >= currentList.length - 1;
    $('d-copy').disabled = !v;
    renderSelanjutnya();
  }

  function renderSelanjutnya(){
    var isi = $('d-next-isi');
    if (!isi) return;
    isi.innerHTML = '';

    if (currentList.length < 2) {
      $('d-next').style.display = 'none';
      return;
    }
    $('d-next').style.display = '';

    var barisKini = null;

    currentList.forEach(function(v, i){
      var row = document.createElement('div');
      row.className = 'next-row' + (i === detailIndex ? ' kini' : '');

      var th = document.createElement('div');
      th.className = 'next-row__thumb';
      if (v.thumb) {
        var img = document.createElement('img');
        img.src = v.thumb;
        th.appendChild(img);
      }
      if (v.duration) {
        var d = document.createElement('div');
        d.className = 'next-row__dur';
        d.textContent = v.duration;
        th.appendChild(d);
      }
      row.appendChild(th);

      var meta = document.createElement('div');
      meta.className = 'next-row__meta';
      var t = document.createElement('div');
      t.className = 'next-row__title';
      t.textContent = v.title || '(tanpa judul)';
      meta.appendChild(t);
      var c = document.createElement('div');
      c.className = i === detailIndex ? 'next-row__kini' : 'next-row__ch';
      c.textContent = i === detailIndex ? '▶ Sedang diputar' : (v.channel || '-');
      meta.appendChild(c);
      row.appendChild(meta);

      if (i !== detailIndex) {
        row.onclick = function(){ bukaDetail(i); };
      }

      if (i === detailIndex) barisKini = row;
      isi.appendChild(row);
    });

    if (barisKini) {
      isi.scrollTop = Math.max(0, barisKini.offsetTop - 8);
    }
  }

  $('d-up').addEventListener('click', function(){
    if (detailIndex <= 0) return;
    detailIndex--; renderDetailFrame(); mintaMedia(detailIndex);
  });
  $('d-down').addEventListener('click', function(){
    if (detailIndex >= currentList.length - 1) return;
    detailIndex++; renderDetailFrame(); mintaMedia(detailIndex);
  });

  $('d-copy').addEventListener('click', function(){
    var v = currentList[detailIndex];
    if (!v) return;
    var url = v.videoId ? ('https://youtu.be/' + v.videoId) : (v.url || '');
    if (!url) { toast('Video ini tidak punya link.'); return; }
    salinTeks(url, function(ok){ toast(ok ? 'Link video disalin' : 'Gagal menyalin link'); });
  });

  function salinTeks(teks, cb){
    cb = cb || function(){};
    if (fallbackSalin(teks)) { cb(true); return; }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        var dijawab = false;
        var jawab = function(ok){ if (dijawab) return; dijawab = true; cb(ok); };
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

  function onJatah(d){
    jatahBebas = !!d.bebas;
    jatahBatas = Number(d.batas) || 0;
    jatahSisa = Number(d.sisa);
    if (d.nama) jatahNama = d.nama;

    var el = $('jatah');
    if (!el) return;
    if (jatahBebas) { el.style.display = 'none'; return; }

    el.style.display = '';
    el.className = 'jatah' + (jatahSisa <= 0 ? ' habis' : '');
    el.innerHTML = 'Jatah unduh hari ini: <b>' + jatahSisa + '/' + jatahBatas + '</b> — reset otomatis jam 00:00';
  }

  function onLimitHabis(d){
    if (d && typeof d.batas === 'number' && d.batas) jatahBatas = d.batas;
    if (d && d.nama) jatahNama = d.nama;
    onJatah({ bebas:false, sisa:0, batas:jatahBatas, nama:jatahNama });

    setStatus('Limit unduh video bot ini sudah habis.', 'bad');
    toast('Limit bot habis');

    if (typeof d.i !== 'number') return;
    delete mediaCache[d.i];
    if (d.i !== detailIndex) return;
    $('d-stage').innerHTML =
      '<div class="limit">' +
        '<div class="limit__judul">⚠️ Limit bot habis</div>' +
        '<div class="limit__isi">' +
          'Bot ini paket <b>' + escapeHtml(jatahNama) + '</b>, jadi cuma bisa mengunduh ' +
          '<b>' + jatahBatas + ' video sehari</b> dan sudah terpakai semua.<br><br>' +
          'Jatahnya balik sendiri jam <b>00:00</b> dan <b>tidak bisa ditambah lewat .claim</b>. ' +
          'Cari-cari video tetap bisa, cuma pemutarannya yang ditahan.' +
        '</div>' +
      '</div>';
  }

  function mintaMedia(i){
    var v = currentList[i];
    if (!v) return;
    var stage = $('d-stage');

    if (mediaCache[i] && mediaCache[i].url) {
      tampilkanMedia(mediaCache[i]);
      return;
    }

    if (!jatahBebas && jatahSisa <= 0) { onLimitHabis({ i: i }); return; }

    stage.innerHTML = '<span class="loading">Menyiapkan video...</span>';
    kirim({ t:'yl_media', i: i, q: currentQuery });
  }

  function onMediaProses(d){
    if (d.q !== currentQuery || d.i !== detailIndex) return;
    $('d-stage').innerHTML = '<span class="loading">Mengunduh video, mohon tunggu...</span>';
  }

  function mseSiap(mime){
    try {
      return !!(window.MediaSource && window.MediaSource.isTypeSupported &&
                window.MediaSource.isTypeSupported(mime));
    } catch (e) { return false; }
  }

  function onMediaMeta(d){
    if (d.q !== currentQuery) return;
    var mime = d.mime || 'video/mp4';
    mediaCache[d.i] = {
      mime: mime,
      chunks: [],
      diterima: 0,
      total: d.total || 0,
      alir: !!d.alir,
      url: null,
      ms: null, sb: null, antre: [], msJalan: false, msRusak: false, tamat: false
    };
    if (d.i === detailIndex) siapkanPemutar(d.i);
  }

  function siapkanPemutar(i){
    var c = mediaCache[i];
    if (!c || !c.alir || c.ms || c.msRusak) return;
    if (!mseSiap(c.mime)) { c.msRusak = true; return; }

    try {
      var ms = new MediaSource();
      c.ms = ms;
      var video = pasangElemenVideo(URL.createObjectURL(ms));

      ms.addEventListener('sourceopen', function(){
        try {
          c.sb = ms.addSourceBuffer(c.mime);
          c.sb.mode = 'sequence';
          c.sb.addEventListener('updateend', function(){ suapBerikutnya(c); });
          c.sb.addEventListener('error', function(){ c.msRusak = true; });
          c.msJalan = true;
          suapBerikutnya(c);
          if (video) video.classList.add('masuk');
        } catch (e) { c.msRusak = true; }
      });
    } catch (e) {
      try { console.warn('[YTLIVE] MediaSource gagal, pakai jalur mundur:', e && e.message); } catch (x) { }
      c.msRusak = true;
      c.ms = null;
    }
  }

  function b64KeBytes(b64){
    var biner = atob(b64);
    var arr = new Uint8Array(biner.length);
    for (var k = 0; k < biner.length; k++) arr[k] = biner.charCodeAt(k);
    return arr;
  }

  function suapBerikutnya(c){
    if (!c.sb || c.msRusak) return;
    if (c.sb.updating || !c.antre.length) {
      if (!c.antre.length && c.tamat && c.ms && c.ms.readyState === 'open' && !c.sb.updating) {
        try { c.ms.endOfStream(); } catch (e) { }
      }
      return;
    }
    var potong = c.antre.shift();
    try { c.sb.appendBuffer(potong); } catch (e) { c.msRusak = true; }
  }

  function onMediaBongkah(d){
    if (d.q !== currentQuery) return;
    var c = mediaCache[d.i];
    if (!c) return;

    c.chunks[d.c] = d.data;
    c.diterima++;

    if (c.alir && !c.msRusak) {
      if (!c.ms && d.i === detailIndex) siapkanPemutar(d.i);
      if (c.msJalan) {
        try {
          c.antre.push(b64KeBytes(d.data));
          suapBerikutnya(c);
        } catch (e) { c.msRusak = true; }
      }
    }

    if (d.i === detailIndex) {
      var lbl = $('d-stage').querySelector('.loading');
      if (lbl) {
        lbl.textContent = c.alir
          ? 'Menyiapkan video... ' + Math.round(c.diterima * 120 / 1024) + ' KB'
          : ('Mengunduh video... ' + Math.round((c.diterima / (c.total || 1)) * 100) + '%');
      }
    }
  }

  function onMediaSelesai(d){
    if (d.q !== currentQuery) return;
    var c = mediaCache[d.i];
    if (!c) return;
    c.tamat = true;

    if (c.alir && c.msJalan && !c.msRusak) {
      c.chunks = null;
      suapBerikutnya(c);
      return;
    }

    if (!c.chunks || !c.chunks.length) return;
    var b64 = c.chunks.join('');
    c.url = 'data:' + String(c.mime).split(';')[0] + ';base64,' + b64;
    c.chunks = null;
    if (d.i === detailIndex) tampilkanMedia(c);
  }

  function onMediaGagal(d){
    if (typeof d.i !== 'number') return;
    delete mediaCache[d.i];
    if (d.i === detailIndex) {
      $('d-stage').innerHTML = '<span class="loading">' + escapeHtml(d.m || 'Video gagal diambil.') + '</span>';
    }
  }

  function pasangElemenVideo(src){
    var stage = $('d-stage');
    if (!stage) return null;
    stage.innerHTML = '';
    var video = document.createElement('video');
    video.controls = true;
    video.playsInline = true;
    video.setAttribute('controlsList', 'nofullscreen nodownload noremoteplayback');
    video.disablePictureInPicture = true;
    video.src = src;
    stage.appendChild(video);
    pasangUkuranPutar(0);
    return video;
  }

  function tampilkanMedia(c){
    var video = pasangElemenVideo(c.url);
    if (!video) return;
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){ video.classList.add('masuk'); });
    });
  }

  var modeGede = false;
  var RASIO_GEDE = 16 / 9;
  var TINGGI_GEDE_MAKS = 720;

  function pasangUkuranPutar(putaran){
    if (typeof putaran !== 'number' || !(putaran >= 0) || putaran > 10) putaran = 0;
    var app = document.querySelector('.app');
    var stage = $('d-stage');
    var video = stage ? stage.querySelector('video') : null;

    if (!modeGede) {
      if (app) app.style.minHeight = '';
      if (video) {
        video.style.position = '';
        video.style.top = '';
        video.style.left = '';
        video.style.width = '';
        video.style.height = '';
        video.style.transform = '';
      }
      return;
    }
    if (!video || !app) return;

    var r = stage.getBoundingClientRect();
    if (!r.width) return;

    var target = Math.min(Math.round(r.width * RASIO_GEDE), TINGGI_GEDE_MAKS);

    if (Math.abs(r.height - target) > 2 && putaran < 4) {
      var tinggiApp = app.getBoundingClientRect().height;
      app.style.minHeight = Math.round(tinggiApp - r.height + target) + 'px';
      return requestAnimationFrame(function(){ pasangUkuranPutar(putaran + 1); });
    }

    video.style.position = 'absolute';
    video.style.top = '50%';
    video.style.left = '50%';
    video.style.width = r.height + 'px';
    video.style.height = r.width + 'px';
    video.style.transform = 'translate(-50%,-50%) rotate(90deg)';
  }

  function setGede(on){
    modeGede = !!on;
    var app = document.querySelector('.app');
    if (app) app.classList.toggle('gede', modeGede);
    var tombol = $('d-zoom');
    if (tombol) {
      tombol.textContent = modeGede ? '⤡' : '⛶';
      tombol.title = modeGede ? 'Kecilkan' : 'Perbesar';
    }
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){ pasangUkuranPutar(0); });
    });
  }

  window.addEventListener('resize', function(){
    if (modeGede) pasangUkuranPutar(0);
  });

  sambung();
})();
</script>
`;
}

module.exports = { buildYtLiveHtml };
