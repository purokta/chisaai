/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// ===========================================================================
// KARTU SPOTIFYLIVE — cari & putar lagu, plus ruangan "Dengerin Bareng"
//
// Pola persis meniru buildChessHtml di atas: satu WebSocket ke relay-nya
// sendiri (lib/musiklive-relay.js), URL dibaca ulang tiap kartu
// dibuat lewat bacaRelayMusik() karena alamat trycloudflare berubah tiap
// tunnel restart.
//
// Audio dan sampul TIDAK bisa dimuat lewat <audio src="https://..."> atau
// <img src="https://..."> — sandbox kartu WA memblokir permintaan jaringan
// biasa (lihat catatan di scrape/richhtml.js). Makanya server mengirim
// audio/sampul sebagai potongan base64 lewat WebSocket yang sama dipakai buat
// pencarian, lalu kartu ini merakitnya jadi Blob URL sebelum diputar - itulah
// kenapa modul ini butuh relay+tunnel sendiri, bukan link Spotify langsung.
// ===========================================================================

function escapeHtml(str) {
    return String(str == null ? '' : str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function buildMusikLiveHtml(opts = {}) {
    const botName = escapeHtml(opts.botName || 'Bot');
    const playerName = escapeHtml(opts.playerName || 'Kamu');

    const relayUrl = String(opts.relayUrl || '').trim();
    const konfig = JSON.stringify({
        url: /^wss?:\/\//.test(relayUrl) ? relayUrl : '',
        nama: opts.playerName || 'Pemain',
        kode: String(opts.kode || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4),
        // Kunci sesi 30 menit. Dibuat bot lewat musiklive-relay.buatKunci(),
        // dan server memutus sambungan begitu kuncinya lewat masa berlaku.
        kunci: String(opts.kunci || '')
    });

    return `
<style>
:root{
  --bg:#121212; --elev:#181818; --elev-2:#232323; --elev-3:#2a2a2a;
  --ink:#ffffff; --ink-soft:#b3b3b3; --muted:#7a7a7a;
  --accent:#1db954; --accent-hi:#1ed760; --line:#2e2e2e;
  --sys:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
}
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
html,body{background:transparent;color:var(--ink);font-family:var(--sys);min-height:100vh;overflow-x:hidden;-webkit-font-smoothing:antialiased;}
.stage{min-height:100vh;display:flex;align-items:flex-start;justify-content:center;padding:14px 10px;}

.app{
  width:100%;max-width:380px;border-radius:16px;overflow:hidden;
  background:linear-gradient(180deg,#3a3a3a 0%,#1f1f1f 26%,var(--bg) 62%);
  box-shadow:0 18px 40px rgba(0,0,0,.55);
  padding:16px 14px 18px;
}

/* ---------- header ---------- */
.top{display:flex;align-items:center;gap:10px;margin-bottom:16px;}
.top__meta{min-width:0;flex:1;}
.top__sub{font-size:11px;color:var(--ink-soft);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:5px;}
.top__badge{font-size:9.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--accent);border:1px solid rgba(29,185,84,.4);border-radius:20px;padding:4px 9px;flex:none;}

/* Logo Spotify - SVG yang digambar sendiri oleh CSS waktu kartu dibuka.
   Bedanya dengan sumber aslinya: di sana animasinya berulang tanpa henti,
   di kartu chat itu mengganggu dan bikin HP bekerja terus. Jadi dijalankan
   SEKALI dengan "forwards" supaya berhenti di bentuk jadinya. */
.brand{display:block;height:26px;width:auto;overflow:visible;}
.brand #logo--circle{fill:var(--accent-hi);stroke:var(--accent-hi);stroke-dasharray:90;stroke-dashoffset:90;transform-origin:84px 50%;
  animation:sl-gambar 2.2s ease forwards, sl-besar 2.2s ease forwards;}
.brand .logo--circle--bar{fill:#04140b;opacity:0;transform:scaleY(.78);animation:sl-batang 2.2s ease forwards;}
.brand #logo--circle--bar-1{animation-delay:.18s;}
.brand #logo--circle--bar-2{animation-delay:.42s;}
.brand #logo--circle--bar-3{animation-delay:.62s;}
.brand #logo--name path{fill:var(--ink);stroke:var(--ink);stroke-dasharray:600;stroke-dashoffset:600;animation:sl-gambar 2.2s ease forwards;}
@keyframes sl-gambar{0%{fill-opacity:0;stroke-width:1px;}37%{fill-opacity:0;}50%{stroke-width:1px;}100%{fill-opacity:1;stroke-dashoffset:0;stroke-width:0;}}
@keyframes sl-besar{0%,1%{transform:scale(0);}70%,100%{transform:scale(1);}}
@keyframes sl-batang{0%,30%{opacity:0;transform:scaleY(.78);}70%,100%{opacity:1;transform:scaleY(1);}}

/* ---------- tab ---------- */
.tabs{display:flex;gap:8px;margin-bottom:14px;}
.tabs button{
  flex:1;background:var(--elev-2);border:none;border-radius:999px;padding:9px 0;
  font-size:12px;font-weight:600;color:var(--ink-soft);cursor:pointer;font-family:inherit;
  transition:background .15s,color .15s;
}
.tabs button.is-on{background:var(--accent);color:#000;}
.pane{display:none;}
.pane.is-on{display:block;}

/* ---------- status ---------- */
.status{display:flex;align-items:center;gap:8px;margin-bottom:12px;font-size:11.5px;color:var(--ink-soft);}
.status__dot{width:7px;height:7px;border-radius:50%;background:var(--accent);flex:none;box-shadow:0 0 0 3px rgba(29,185,84,.16);}
.status__dot.is-wait{background:var(--muted);box-shadow:0 0 0 3px rgba(122,122,122,.14);}
.status__dot.is-bad{background:#e2514a;box-shadow:0 0 0 3px rgba(226,81,74,.16);}

.mati{font-size:12px;color:var(--ink-soft);line-height:1.6;padding:12px 2px;}

/* ---------- pencarian ---------- */
.searchbar{display:flex;align-items:center;gap:8px;margin-bottom:12px;}
.searchbar__box{
  flex:1;display:flex;align-items:center;gap:8px;background:var(--elev-2);
  border-radius:999px;padding:0 14px;height:40px;
}
.searchbar__box svg{width:16px;height:16px;color:var(--ink-soft);flex:none;}
.searchbar input{flex:1;min-width:0;background:none;border:none;outline:none;font-size:13px;color:var(--ink);font-family:inherit;height:100%;}
.searchbar input::placeholder{color:var(--muted);}
.searchbar button{
  background:var(--accent);border:none;border-radius:999px;height:40px;padding:0 18px;
  font-size:12.5px;font-weight:700;color:#000;cursor:pointer;font-family:inherit;flex:none;
}
.searchbar button:active{background:var(--accent-hi);}

/* ---------- daftar lagu ---------- */
/* Gulir dengan JARI tidak bisa diandalkan di dalam kartu - gerakannya selalu
   direbut daftar pesan WhatsApp (sudah dicoba lewat CSS maupun penanganan
   sentuh sendiri, dua-duanya kalah). Karena itu kotaknya digulir lewat TOMBOL
   naik/turun kecil di bawahnya: sekali pencet geser satu layar daftar. */
.hasil{display:flex;flex-direction:column;max-height:216px;overflow:hidden;margin:0 -6px 8px;padding:0 2px;scroll-behavior:smooth;}
.hasil.is-gulir{overflow-y:auto;}
.hasil::-webkit-scrollbar{width:3px;}
.hasil::-webkit-scrollbar-thumb{background:#4d4d4d;border-radius:3px;}

.gulir{display:none;align-items:center;justify-content:center;gap:8px;margin:0 0 12px;}
.gulir.is-on{display:flex;}
.gulir button{width:26px;height:22px;border:none;border-radius:7px;background:var(--elev-2);color:var(--ink-soft);cursor:pointer;line-height:0;padding:0;}
.gulir button:disabled{opacity:.3;}
.gulir button svg{width:12px;height:12px;display:block;margin:0 auto;}
.gulir__info{font-size:10px;color:var(--muted);}

.chat__log{max-height:120px;}
.chat__mahkota{flex:none;width:12px;height:12px;color:#f0c419;margin-top:1px;}
#daftar-ruang{max-height:210px;overflow:hidden;scroll-behavior:smooth;}
#daftar-ruang.is-gulir{overflow-y:auto;}
/* Baris sisa jatah unduh lagu. Sama seperti kartu Ytlive: satu-satunya baris
   kecil di atas daftar - tidak ada lagi hitung mundur sesi yang dulu memakai
   elemen ini, jadi namanya balik seragam (#jatah) dengan kartu Ytlive. */
.jatah{font-size:10.5px;color:var(--muted);margin:-2px 0 8px;}
.jatah b{color:var(--ink);font-weight:800;}
.jatah.is-habis{color:#e2514a;}
.jatah:empty{display:none;margin:0;}

.limit{
  margin:-2px 0 10px;padding:12px 14px;border-radius:12px;
  background:rgba(226,81,74,.09);border:1px solid rgba(226,81,74,.32);
}
.limit__judul{font-size:12px;font-weight:800;color:#e2514a;margin-bottom:6px;}
.limit__isi{font-size:10.5px;color:var(--muted);line-height:1.65;}
.limit__isi b{color:var(--ink);}

/* Not musik cadangan waktu sampul lagu tidak ada. WAJIB berupa SVG, bukan huruf
   "♪": karakter itu dianggap emoji oleh perender kartu WhatsApp lalu ditukar
   dengan gambar emoji yang TIDAK BISA diunduh dari dalam sandbox, dan sisanya
   tampil sebagai bulatan merah muda polos di atas sampul. */
.art__nada{width:45%;height:45%;display:block;opacity:.5;}
.trk{display:flex;align-items:center;gap:11px;border-radius:8px;padding:7px 6px;cursor:pointer;}
.trk:active{background:var(--elev-2);}
.trk.is-main{background:rgba(29,185,84,.12);}
.trk.is-main .trk__title{color:var(--accent);}
.trk__eq{display:none;width:14px;height:14px;flex:none;align-items:flex-end;gap:2px;}
.trk.is-main .trk__eq{display:flex;}
.trk__eq i{display:block;width:3px;background:var(--accent);border-radius:1px;animation:eq .9s ease-in-out infinite;}
.trk__eq i:nth-child(1){height:6px;animation-delay:-.2s;}
.trk__eq i:nth-child(2){height:12px;animation-delay:-.5s;}
.trk__eq i:nth-child(3){height:8px;}
@keyframes eq{0%,100%{transform:scaleY(.4);}50%{transform:scaleY(1);}}
.trk__art{
  width:44px;height:44px;border-radius:4px;flex:none;
  background:var(--elev-3) center/cover no-repeat;
  display:flex;align-items:center;justify-content:center;font-size:17px;color:var(--muted);
  box-shadow:0 4px 10px rgba(0,0,0,.4);
}
.trk__meta{min-width:0;flex:1;}
.trk__title{font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.trk__artist{font-size:11px;color:var(--ink-soft);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px;}

/* ---------- pemutar ---------- */
.player{display:none;background:var(--elev);border-radius:14px;padding:16px 14px 14px;margin-bottom:6px;box-shadow:0 8px 22px rgba(0,0,0,.4);}
.player.is-on{display:block;}
.player__top{display:flex;gap:12px;align-items:center;margin-bottom:14px;}
.player__art{
  width:60px;height:60px;border-radius:6px;flex:none;
  background:var(--elev-3) center/cover no-repeat;
  display:flex;align-items:center;justify-content:center;font-size:22px;color:var(--muted);
  box-shadow:0 8px 18px rgba(0,0,0,.5);
}
.player__meta{min-width:0;flex:1;}
.player__title{font-size:15px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.player__artist{font-size:12px;color:var(--ink-soft);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:3px;}
.player__bar{-webkit-appearance:none;appearance:none;width:100%;height:4px;border-radius:4px;background:#4d4d4d;accent-color:var(--accent);cursor:pointer;display:block;}
.player__bar::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;border-radius:50%;background:#fff;border:none;margin-top:-4px;}
.player__prog{font-size:10.5px;color:var(--ink-soft);display:flex;justify-content:space-between;margin-top:7px;}
.player__ctl{display:flex;align-items:center;justify-content:center;gap:24px;margin-top:12px;}
.player__ctl button{background:none;border:none;color:var(--ink-soft);cursor:pointer;line-height:0;padding:4px;}
.player__ctl button svg{width:22px;height:22px;display:block;}
.player__ctl .is-main{
  width:50px;height:50px;border-radius:50%;background:var(--ink);color:#000;
  display:flex;align-items:center;justify-content:center;padding:0;
}
.player__ctl .is-main svg{width:24px;height:24px;}
.player__ctl .is-main:active{transform:scale(.95);}
.player__load{font-size:11px;color:var(--ink-soft);text-align:center;margin-top:10px;min-height:14px;}

/* ---------- lobby / ruangan ---------- */
.field{margin-bottom:12px;}
.field__label{display:block;font-size:11px;font-weight:600;color:var(--ink-soft);margin-bottom:6px;}
.field input{width:100%;background:var(--elev-2);border:1px solid transparent;border-radius:6px;padding:11px 12px;font-size:13px;color:var(--ink);font-family:inherit;outline:none;}
.field input:focus{border-color:var(--ink-soft);}
.field input::placeholder{color:var(--muted);}

.btn{width:100%;background:var(--accent);border:none;border-radius:999px;padding:12px;font-size:13px;font-weight:700;letter-spacing:.02em;color:#000;cursor:pointer;font-family:inherit;margin-bottom:8px;}
.btn:active{background:var(--accent-hi);}
.btn--ghost{background:transparent;border:1px solid #6a6a6a;color:var(--ink);}
.btn--ghost:active{background:rgba(255,255,255,.06);}
.sep{text-align:center;font-size:10.5px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin:10px 0;}

.kode{background:var(--elev);border:1px solid var(--line);border-radius:12px;padding:18px 14px;text-align:center;margin-bottom:12px;}
.kode__label{font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-bottom:8px;}
.kode__nilai{font-size:30px;font-weight:800;letter-spacing:.2em;color:var(--accent);text-indent:.2em;}
.kode__catatan{font-size:11px;color:var(--ink-soft);margin-top:10px;line-height:1.55;}

.anggota{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;}
.anggota__chip{display:inline-flex;align-items:center;gap:6px;background:var(--elev-2);border-radius:999px;padding:5px 11px;font-size:11px;color:var(--ink-soft);}
.anggota__buang{background:none;border:none;color:inherit;font:inherit;line-height:1;padding:0 0 0 1px;cursor:pointer;opacity:.65;}

/* ---------- daftar ruang global ---------- */
.ruang{display:flex;align-items:center;gap:10px;background:var(--elev);border:1px solid var(--line);border-radius:12px;padding:10px 12px;margin-bottom:8px;}
.ruang__meta{min-width:0;flex:1;}
.ruang__judul{font-size:12.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.ruang__sub{font-size:10.5px;color:var(--ink-soft);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px;}
.ruang__masuk{flex:none;background:var(--accent);border:none;border-radius:999px;padding:7px 14px;font-size:11.5px;font-weight:700;color:#04140b;cursor:pointer;font-family:inherit;}
.ruang__masuk:disabled{background:var(--elev-2);color:var(--muted);cursor:default;}
.pilihan{display:flex;align-items:center;gap:8px;background:var(--elev-2);border-radius:10px;padding:10px 12px;margin-bottom:12px;cursor:pointer;}
.pilihan input{width:16px;height:16px;flex:none;accent-color:var(--accent);}
.pilihan span{font-size:11.5px;color:var(--ink-soft);line-height:1.45;}
.anggota__buang:active{opacity:1;}
.anggota__chip.is-host{background:var(--accent);color:#04140b;font-weight:700;}

.ikut{display:flex;align-items:center;gap:8px;flex-wrap:wrap;background:rgba(29,185,84,.1);border:1px solid rgba(29,185,84,.32);border-radius:999px;padding:7px 12px;margin-bottom:10px;}
.ikut__judul{font-size:9.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--accent);}
.ikut__teks{font-size:11.5px;color:var(--ink-soft);}
.ikut__teks{margin-left:auto;}

.chat{margin-top:14px;}
.chat__log{max-height:110px;overflow-y:auto;font-size:11.5px;color:var(--ink-soft);margin-bottom:8px;padding:10px;background:var(--elev);border-radius:10px;line-height:1.55;
  -webkit-overflow-scrolling:touch;overscroll-behavior:contain;touch-action:pan-y;}
.chat__log::-webkit-scrollbar{width:4px;}
.chat__log::-webkit-scrollbar-thumb{background:#4d4d4d;border-radius:4px;}
.chat__empty{color:var(--muted);font-style:italic;}
.chat__row{display:flex;align-items:flex-start;gap:6px;margin-bottom:4px;}
.chat__row.is-me{color:var(--accent);}
.chat__isi{min-width:0;flex:1;word-break:break-word;}
.chat__hapus{flex:none;background:none;border:none;color:var(--muted);font-size:13px;line-height:1;padding:0 2px;cursor:pointer;}
.chat__hapus:active{color:#e2514a;}
.chat__row.is-hapus .chat__isi{color:var(--muted);font-style:italic;}
.chat__bar{display:flex;gap:6px;}
.chat__bar input{flex:1;min-width:0;background:var(--elev-2);border:none;border-radius:999px;padding:9px 14px;font-size:12px;color:var(--ink);font-family:inherit;outline:none;}
.chat__bar input::placeholder{color:var(--muted);}
.chat__bar button{background:var(--accent);border:none;border-radius:999px;padding:0 16px;font-size:11.5px;font-weight:700;color:#000;cursor:pointer;font-family:inherit;}
</style>

<div class="stage">
  <div class="app">
    <div class="top">
      <div class="top__meta">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 559 168" class="brand"> <g id="logo--circle"> <path id="logo--circle_1_" d="M84,0.3L84,0.3C37.7,0.3,0.3,37.8,0.3,84c0,46.3,37.5,83.7,83.7,83.7 c46.3,0,83.7-37.5,83.7-83.7C167.7,37.8,130.2,0.3,84,0.3z"/> <path class="logo--circle--bar" id="logo--circle--bar-1" d="M41.7,114.7c29.2-6.7,53.9-3.9,73.6,8.1c2.5,1.5,5.7,0.7,7.2-1.7 c1.5-2.5,0.7-5.7-1.7-7.2c-22.1-13.5-49.4-16.6-81.3-9.3c-2.8,0.6-4.6,3.4-3.9,6.2C36,113.6,38.8,115.4,41.7,114.7z"/> <path class="logo--circle--bar" id="logo--circle--bar-2" d="M130.5,89.3c-25.8-15.9-63.7-20.4-94.1-11.1c-3.4,1-5.4,4.7-4.4,8.1 c1,3.4,4.7,5.4,8.1,4.3c26.6-8.1,60.9-4.1,83.4,9.8c3.1,1.9,7.1,0.9,9-2.2v0C134.5,95.2,133.6,91.2,130.5,89.3z"/> <path class="logo--circle--bar" id="logo--circle--bar-3" d="M144.3,71.8c2.2-3.7,1-8.5-2.7-10.7C110.5,42.6,61.3,40.9,31.7,49.8 c-4.1,1.3-6.5,5.6-5.2,9.8c1.3,4.1,5.6,6.5,9.8,5.2c25.8-7.8,70.3-6.3,97.3,9.7h0C137.2,76.7,142.1,75.5,144.3,71.8z"/> </g> <g id="logo--name"> <path id="logo--name--s" d="M228.1,77.6L228.1,77.6c-14.5-3.5-17.1-5.9-17.1-11c0-4.8,4.5-8,11.2-8 c6.5,0,13,2.5,19.8,7.5c0.2,0.2,0.5,0.2,0.7,0.2c0.3,0,0.5-0.2,0.6-0.4l7.1-10c0.3-0.4,0.2-1-0.2-1.3c-8.1-6.5-17.2-9.6-27.8-9.6 c-15.6,0-26.5,9.4-26.5,22.8c0,14.4,9.4,19.5,25.7,23.4c13.8,3.2,16.2,5.9,16.2,10.6c0,5.3-4.7,8.6-12.3,8.6 c-8.4,0-15.3-2.8-23-9.5c-0.2-0.2-0.5-0.2-0.7-0.2c-0.3,0-0.5,0.1-0.6,0.3l-7.9,9.4c-0.3,0.4-0.3,1,0.1,1.3c9,8,20,12.2,31.9,12.2 c16.8,0,27.7-9.2,27.7-23.4C252.9,88.5,245.7,81.9,228.1,77.6z"/> <path id="logo--name--p" d="M291,63.3L291,63.3c-7.3,0-13.3,2.9-18.2,8.8v-6.6c0-0.5-0.4-0.9-0.9-0.9h-13 c-0.5,0-0.9,0.4-0.9,0.9v73.6c0,0.5,0.4,1,0.9,1h13c0.5,0,0.9-0.4,0.9-1v-23.2c4.9,5.5,10.9,8.2,18.2,8.2 c13.5,0,27.3-10.4,27.3-30.4C318.2,73.8,304.5,63.3,291,63.3z M303.2,93.7c0,10.1-6.2,17.2-15.2,17.2c-8.8,0-15.5-7.4-15.5-17.2 c0-9.8,6.7-17.2,15.5-17.2C296.8,76.5,303.2,83.7,303.2,93.7L303.2,93.7z"/> <path id="logo--name--o" d="M353.4,63.3L353.4,63.3c-17.5,0-31.1,13.4-31.1,30.6c0,17,13.6,30.3,30.9,30.3 c17.5,0,31.2-13.4,31.2-30.5C384.4,76.7,370.8,63.3,353.4,63.3z M353.4,111c-9.3,0-16.3-7.5-16.3-17.3c0-9.9,6.8-17.1,16.1-17.1 c9.3,0,16.4,7.5,16.4,17.4C369.5,103.8,362.7,111,353.4,111z"/> <path id="logo--name--t" d="M421.6,64.5L421.6,64.5l-14.3,0V49.9c0-0.5-0.4-0.9-0.9-0.9h-13c-0.5,0-1,0.4-1,0.9v14.6 h-6.2c-0.5,0-0.9,0.4-0.9,0.9v11.1c0,0.5,0.4,0.9,0.9,0.9h6.2v28.8c0,11.6,5.8,17.5,17.2,17.5c4.6,0,8.5-1,12.1-3 c0.3-0.2,0.5-0.5,0.5-0.8v-10.6c0-0.3-0.2-0.6-0.5-0.8c-0.3-0.2-0.6-0.2-0.9,0c-2.5,1.2-4.9,1.8-7.6,1.8c-4.2,0-6-1.9-6-6.1V77.5 h14.2c0.5,0,0.9-0.4,0.9-0.9V65.5C422.6,64.9,422.2,64.5,421.6,64.5z"/> <g id="logo--name--i"> <path id="logo--name--i-stem" d="M442.5,64.5L442.5,64.5l-13,0c-0.5,0-1,0.4-1,0.9v56.5c0,0.5,0.4,0.9,1,0.9h13 c0.5,0,1-0.4,1-0.9V65.5C443.5,64.9,443,64.5,442.5,64.5z"/> <path id="logo--name--i-dot" d="M436.1,38.8c-5.1,0-9.3,4.2-9.3,9.3c0,5.1,4.2,9.3,9.3,9.3s9.3-4.2,9.3-9.3 C445.4,42.9,441.2,38.8,436.1,38.8z"/> </g> <path id="logo--name--fy" d="M537.6,64.6h-13.5c-0.4,0-0.8,0.3-0.9,0.6l-13.8,39.4l-15.1-39.5 c-0.1-0.4-0.5-0.6-0.9-0.6h-22.1v0l0,0v-1.8c0-5.3,2-7.6,6.5-7.6c2.7,0,4.9,0.5,7.3,1.3c0.3,0.1,0.6,0,0.8-0.1 c0.2-0.2,0.4-0.5,0.4-0.8V44.7c0-0.4-0.3-0.8-0.7-0.9c-2.6-0.8-5.8-1.5-10.8-1.5c-12,0-18.3,6.7-18.3,19.5v2.7h-6.2 c-0.5,0-1,0.4-1,0.9v11.2c0,0.5,0.4,0.9,1,0.9h6.2v44.4c0,0.5,0.4,0.9,1,0.9h12.9c0.5,0,1-0.4,1-0.9V77.5h12.1l18.5,44.4 c-2.1,4.7-4.2,5.6-7,5.6c-2.3,0-4.7-0.7-7.1-2c-0.2-0.1-0.5-0.1-0.8-0.1c-0.2,0.1-0.5,0.3-0.6,0.5l-4.4,9.6c-0.2,0.5,0,1,0.4,1.2 c4.6,2.5,8.7,3.5,13.8,3.5c9.6,0,14.8-4.5,19.5-16.4l22.5-58c0.1-0.3,0.1-0.6-0.1-0.9C538.2,64.7,537.9,64.6,537.6,64.6z"/> <g id="logo--name--registered"> <path id="logo--name--registered-r_1_" d="M551.6,74.4c1.3-0.4,2.2-1.3,2.2-2.9c0-1.9-1.5-3.1-3.7-3.1h-4.3V78h1.8 v-3.3h2L552,78h2.2L551.6,74.4L551.6,74.4z M550,73.2h-2.4v-3h2.4c1.2,0,1.9,0.5,1.9,1.5C551.9,72.6,551.2,73.2,550,73.2z"/> <path id="logo--name--registered-r-circle" d="M549.6,64.4c-5.1,0-9.2,4.2-9.2,9.2c0,5,4,9.1,9.1,9.1 c5.1,0,9.2-4.2,9.2-9.2C558.7,68.5,554.7,64.4,549.6,64.4z M549.5,81.8c-4.6,0-8.2-3.7-8.2-8.2c0-4.5,3.5-8.3,8.2-8.3 c4.6,0,8.2,3.7,8.2,8.2C557.7,78,554.2,81.8,549.5,81.8z"/> </g> </g> </svg>
        <div class="top__sub">${botName}</div>
      </div>
      <span class="top__badge">Live</span>
    </div>

    <div class="tabs">
      <button id="tab-cari" class="is-on">Cari</button>
      <button id="tab-ruang">Bareng</button>
      <button id="tab-global">Ruang Global</button>
    </div>

    <!-- ================= TAB CARI & PUTAR ================= -->
    <div class="pane is-on" id="pane-cari">
      <div class="status"><span class="status__dot is-wait" id="dot"></span><span id="status">Menyambung ke server...</span></div>
      <div id="mati" style="display:none"><div class="mati">Server musik live lagi tidak bisa dipakai (relay/tunnel mati). Coba lagi nanti.</div></div>

      <div class="ikut" id="ikut" style="display:none">
        <span class="ikut__judul">Pendengar</span>
        <span class="ikut__teks" id="ikut-teks">Ngikutin host</span>
      </div>

      <div class="searchbar">
        <div class="searchbar__box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
          <input id="in-cari" maxlength="60" autocomplete="off" spellcheck="false" placeholder="Lagu atau artis">
        </div>
        <button id="btn-cari">Cari</button>
      </div>

      <div class="jatah" id="jatah"></div>
      <div class="limit" id="limit" style="display:none">
        <div class="limit__judul">⚠️ Limit bot habis</div>
        <div class="limit__isi" id="limit-isi"></div>
      </div>
      <div class="hasil" id="hasil"></div>
      <div class="gulir" id="gulir">
        <button id="gulir-atas" title="Ke atas"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg></button>
        <span class="gulir__info" id="gulir-info"></span>
        <button id="gulir-bawah" title="Ke bawah"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></button>
      </div>

      <div class="player" id="player">
        <div class="player__top">
          <div class="player__art" id="p-art"><svg class="art__nada" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg></div>
          <div class="player__meta">
            <div class="player__title" id="p-title">-</div>
            <div class="player__artist" id="p-artist">-</div>
          </div>
        </div>
        <audio id="audio" style="display:none"></audio>
        <input type="range" class="player__bar" id="p-bar" min="0" max="100" value="0">
        <div class="player__prog"><span id="p-now">0:00</span><span id="p-total">0:00</span></div>
        <div class="player__ctl" id="p-ctl">
          <button id="p-mundur" aria-label="Mundur 10 detik"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.5 5V2.5L8 6l4.5 3.5V7A5.5 5.5 0 116.9 13.4a1 1 0 10-1.97.33A7.5 7.5 0 1012.5 5z"/></svg></button>
          <button id="p-play" class="is-main" aria-label="Putar"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a.75.75 0 001.14.64l10.5-6.5a.75.75 0 000-1.28L9.14 4.86A.75.75 0 008 5.5z"/></svg></button>
          <button id="p-maju" aria-label="Maju 10 detik"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.5 5V2.5L16 6l-4.5 3.5V7a5.5 5.5 0 105.6 6.4 1 1 0 011.97.33A7.5 7.5 0 1111.5 5z"/></svg></button>
        </div>
        <div class="player__load" id="p-load"></div>
      </div>
    </div>

    <!-- ================= TAB RUANG GLOBAL =================
         Daftar ruangan yang dibuka untuk umum. Tidak perlu kode: tinggal
         pencet Masuk. Ruangan berkode sengaja TIDAK muncul di sini. -->
    <div class="pane" id="pane-global">
      <div class="status"><span class="status__dot is-wait" id="dot2"></span><span id="status2">Memuat daftar ruangan...</span></div>
      <div class="searchbar" style="margin-bottom:10px">
        <div class="searchbar__box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
          <input id="cari-ruang" maxlength="30" autocomplete="off" spellcheck="false" placeholder="Cari nama ruangan atau host">
        </div>
      </div>

      <div id="daftar-ruang"></div>
      <div class="gulir" id="gulir-ruang">
        <button id="ruang-atas" title="Ke atas"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg></button>
        <span class="gulir__info" id="ruang-info"></span>
        <button id="ruang-bawah" title="Ke bawah"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></button>
      </div>
      <button class="btn btn--ghost" id="btn-segarkan">Muat ulang daftar</button>
    </div>

    <!-- ================= TAB DENGERIN BARENG ================= -->
    <div class="pane" id="pane-ruang">
      <div class="lobby" id="lobby">
        <div class="mati" style="padding-top:0">Yang membuat ruangan jadi <b>host</b> - cuma dia yang memilih lagu, memutar, dan menjeda. Yang gabung pakai kode tinggal dengerin: lagunya ikut jalan sendiri, mengikuti host.</div>

        <div class="field">
          <label class="field__label" for="in-nama">Nama kamu</label>
          <input id="in-nama" maxlength="14" autocomplete="off" spellcheck="false" placeholder="${playerName}">
        </div>

        <label class="pilihan">
          <input type="checkbox" id="in-publik">
          <span>Buka untuk umum &mdash; ruanganmu muncul di Ruang Global, orang lain bisa masuk langsung tanpa kode.</span>
        </label>

        <div class="field">
          <label class="field__label" for="in-maks">Maksimal orang di ruangan (2-10)</label>
          <input id="in-maks" type="number" min="2" max="10" value="10" inputmode="numeric">
        </div>

        <div class="field" id="field-judul" style="display:none">
          <label class="field__label" for="in-judul">Nama ruangan (boleh kosong)</label>
          <input id="in-judul" maxlength="30" autocomplete="off" spellcheck="false" placeholder="Santuy sore">
        </div>

        <button class="btn" id="btn-buat">Buat ruangan</button>
        <div class="sep">atau</div>

        <div class="field">
          <label class="field__label" for="in-kode">Kode ruangan</label>
          <input id="in-kode" maxlength="4" autocomplete="off" spellcheck="false" placeholder="ABCD">
        </div>
        <button class="btn btn--ghost" id="btn-gabung">Gabung ruangan</button>
      </div>

      <div id="arena" style="display:none">
        <div class="kode">
          <div class="kode__label">Kode ruangan</div>
          <div class="kode__nilai" id="kode-besar">----</div>
          <div class="kode__catatan" id="kode-catatan">Bagikan kode ini.</div>
        </div>
        <div class="anggota" id="anggota"></div>
        <button class="btn btn--ghost" id="btn-keluar-ruang">Keluar ruangan</button>

        <div class="chat">
          <div class="chat__log" id="chat-log"><div class="chat__empty">Belum ada pesan. Sapa teman dengerinmu!</div></div>
          <div class="gulir" id="gulir-chat">
            <button id="chat-atas" title="Ke atas"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg></button>
            <span class="gulir__info" id="chat-info"></span>
            <button id="chat-bawah" title="Ke bawah"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></button>
          </div>
          <div class="chat__bar">
            <input id="chat-in" maxlength="120" autocomplete="off" spellcheck="false" placeholder="Ketik pesan...">
            <button id="chat-send">Kirim</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
<script>
(function(){
  var CFG = ${konfig};
  var $ = function(id){ return document.getElementById(id); };
  // Ikon pemutar - pakai SVG (bukan emoji) supaya bentuknya sama di semua HP.
  var IKON_PUTAR = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a.75.75 0 001.14.64l10.5-6.5a.75.75 0 000-1.28L9.14 4.86A.75.75 0 008 5.5z"/></svg>';
  var IKON_JEDA  = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 4.5h3v15H8zM13 4.5h3v15h-3z"/></svg>';
  // Sengaja SVG, bukan '\u266A'. Perender kartu WhatsApp menukar karakter itu
  // dengan gambar emoji, dan gambarnya tidak bisa diunduh dari dalam sandbox -
  // yang tersisa cuma bulatan merah muda polos menutupi sampul lagu.
  var IKON_NOT   = '<svg class="art__nada" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>';

  function pilihTab(mode){
    $('tab-cari').className = mode === 'cari' ? 'is-on' : '';
    $('tab-ruang').className = mode === 'ruang' ? 'is-on' : '';
    $('tab-global').className = mode === 'global' ? 'is-on' : '';
    $('pane-cari').className = 'pane' + (mode === 'cari' ? ' is-on' : '');
    $('pane-ruang').className = 'pane' + (mode === 'ruang' ? ' is-on' : '');
    $('pane-global').className = 'pane' + (mode === 'global' ? ' is-on' : '');
    aturSegarDaftar(mode === 'global');
  }
  $('tab-cari').addEventListener('click', function(){ bukaAudio(); pilihTab('cari'); });
  $('tab-ruang').addEventListener('click', function(){ bukaAudio(); pilihTab('ruang'); });
  $('tab-global').addEventListener('click', function(){ bukaAudio(); pilihTab('global'); mintaDaftar(); });

  var cid;
  try { cid = localStorage.getItem('musik_cid'); if (!cid){ cid = Math.random().toString(36).slice(2,14); localStorage.setItem('musik_cid', cid); } }
  catch(e){ cid = Math.random().toString(36).slice(2,14); }

  var ws = null, nyambung = false, ulangSambung = 0, timerSambung = null;
  var kode = CFG.kode || '';
  var bongkahMasuk = [], totalBongkahDiharap = 0, metaSaatIni = null;
  var audioUrlLama = null;
  var sedangPutarDariJauh = false; // true kalau state datang dari m_kontrol (jangan disiarkan balik)
  var sayaHost = false;            // true cuma buat pembuat ruangan
  var sayaId = '';                 // tanda pengenal kita di dalam ruangan
  var daftarAnggota = [], namaHost = null, idHost = null;
  var barisChatTerakhir = null;    // pesan kita yang masih menunggu nomornya
  var urlLaguSekarang = '';        // lagu yang sedang dipegang kartu ini
  var timerDenyut = null;          // host mengabarkan posisinya berkala
  var timerPing = null;
  var latensi = 0;                 // perkiraan waktu tempuh sekali jalan (ms)

  // Sisa jatah unduh lagu hari ini, dikabari server lewat 'm_jatah'. Disimpan di
  // kartu supaya penolakan pas jatah habis muncul SEKETIKA, tanpa perlu bolak
  // balik ke server dulu buat mendengar jawaban yang sudah bisa ditebak. Ini
  // murni tampilan - server tetap yang memutuskan, jadi mengutak-atik nilai di
  // sini lewat devtools tidak menembus batasnya.
  var jatahBebas = true, jatahSisa = -1, jatahBatas = 0, jatahNama = 'Free';

  // Seberapa sering & seberapa ketat penyelarasan. Angkanya dipilih supaya
  // selisih anggota ke host rata-rata di BAWAH 1 detik: kabar tiap 700ms
  // berarti telat terburuk ~0,7 detik, ditambah waktu tempuh jaringan yang
  // sudah dikompensasi sendiri lewat pengukuran ping.
  var DENYUT_MS = 700;
  var TOLERANSI = 0.45;            // detik; di bawah ini tidak dilompati
  var posisiMenyusul = 0;          // detik awal buat anggota yang telat gabung
  var lanjutSetelahRakit = true;   // apakah lagu langsung jalan setelah dirakit

  if (CFG.kode) { $('in-kode').value = CFG.kode; }

  if (!CFG.url){
    $('mati').style.display = '';
    $('dot').className = 'status__dot is-bad';
    $('status').textContent = 'Server musik live mati.';
  }

  function setStatus(teks, jenis){
    $('status').textContent = teks;
    $('dot').className = 'status__dot' + (jenis === 'wait' ? ' is-wait' : jenis === 'bad' ? ' is-bad' : '');
  }

  // ================= peran host vs pendengar =================
  // Di dalam ruangan cuma HOST yang mengatur lagu. Buat anggota, semua alat
  // kendali dimatikan di sini (server juga menolaknya) supaya tidak ada dua
  // orang yang saling rebut memutar/menjeda.
  function pendengarSaja(){ return !!kode && !sayaHost; }

  // ================= jatah unduh lagu =================
  function tampilJatah(d){
    jatahBebas = !!d.bebas;
    jatahBatas = Number(d.batas) || 0;
    jatahSisa = Number(d.sisa);
    if (d.nama) jatahNama = d.nama;

    var el = $('jatah');
    if (!el) return;
    // Paket tanpa batas: barisnya dikosongkan (.jatah:empty menyembunyikannya),
    // bukan diisi "tanpa batas" yang cuma memakan tinggi kartu.
    if (jatahBebas){ el.textContent = ''; el.className = 'jatah'; return; }

    el.className = 'jatah' + (jatahSisa <= 0 ? ' is-habis' : '');
    el.innerHTML = 'Jatah unduh lagu hari ini: <b>' + jatahSisa + '/' + jatahBatas + '</b> — reset otomatis jam 00:00';
    if (jatahSisa > 0) $('limit').style.display = 'none';
  }

  function tampilLimitHabis(d){
    if (d && typeof d.batas === 'number' && d.batas) jatahBatas = d.batas;
    if (d && d.nama) jatahNama = d.nama;
    tampilJatah({ bebas:false, sisa:0, batas:jatahBatas, nama:jatahNama });

    $('limit-isi').innerHTML =
      'Bot ini paket <b>' + escapeHtml(jatahNama) + '</b>, jadi cuma bisa mengunduh ' +
      '<b>' + jatahBatas + ' lagu sehari</b> dan sudah terpakai semua.<br><br>' +
      'Jatahnya balik sendiri jam <b>00:00</b> dan <b>tidak bisa ditambah lewat .claim</b>. ' +
      'Cari-cari lagu tetap bisa, cuma pemutarannya yang ditahan. Ikut ruangan orang lain ' +
      'juga tetap bisa — yang dipotong cuma jatah orang yang memilih lagunya.';
    $('limit').style.display = '';
    $('p-load').textContent = 'Limit bot habis.';
    setStatus('Jatah unduh lagu bot ini sudah habis.', 'bad');
  }

  function terapkanPeran(){
    var dengar = pendengarSaja();
    // Peran berubah (mis. jadi host karena host lama keluar) - daftar anggota
    // digambar ulang supaya tombol keluarkan ikut muncul/hilang.
    if (daftarAnggota.length) tampilAnggota(daftarAnggota, namaHost, idHost);
    if (kode) mulaiPing();
    if (sayaHost && kode) mulaiDenyut();
    $('ikut').style.display = dengar ? '' : 'none';
    // Kolom cari dibuat cuma-baca, BUKAN disembunyikan: isinya mengikuti ketikan
    // host, jadi anggota lihat apa yang sedang dicari host.
    $('in-cari').readOnly = dengar;
    $('btn-cari').disabled = dengar;
    $('btn-cari').style.opacity = dengar ? '.4' : '';
    // Daftar host tetap terlihat penuh buat anggota; kliknya yang dijaga
    // (lihat pendengarSaja di penangan baris).
    $('hasil').style.cursor = dengar ? 'default' : '';
    $('p-ctl').style.pointerEvents = dengar ? 'none' : '';
    $('p-ctl').style.opacity = dengar ? '.4' : '';
    $('p-bar').style.pointerEvents = dengar ? 'none' : '';
    if (kode){
      $('kode-catatan').innerHTML = sayaHost
        ? 'Bagikan kode ini. Buka tab "Cari &amp; Putar" buat memilih lagu - semua anggota ikut dengar bareng.'
        : 'Kamu pendengar di ruangan ini. Host yang memilih dan mengatur lagunya.';
    }
  }

  // Sebagian HP menolak audio.play() kalau elemennya belum pernah dibunyikan
  // lewat sentuhan pemakai. Dulu itu diatasi dengan tombol "Nyalakan suara",
  // tapi buat pendengar itu langkah tambahan yang tidak perlu: menekan "Gabung
  // ruangan" ITU SENDIRI sudah sentuhan yang sah. Jadi pada sentuhan itu kita
  // bunyikan potongan hening sebentar - setelah itu elemen audio-nya terbuka dan
  // lagu dari host bisa langsung jalan sendiri.
  var HENING = 'data:audio/wav;base64,UklGRkQDAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YSADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==';
  var audioTerbuka = false, nungguSentuh = false;

  function bukaAudio(){
    if (audioTerbuka) return;
    audioTerbuka = true;
    var a = $('audio');
    if (a.src) return;              // sudah ada lagu, tidak perlu dipancing
    try {
      a.src = HENING;
      var pr = a.play();
      if (pr && pr.then) pr.then(function(){ a.pause(); a.removeAttribute('src'); })
                           .catch(function(){ audioTerbuka = false; });
    } catch(e){ audioTerbuka = false; }
  }

  // Jaring pengaman kalau pemblokiran tetap terjadi: sentuhan BERIKUTNYA di mana
  // pun pada kartu langsung menyalakan lagunya, tanpa tombol khusus.
  function pasangSentuhSekali(){
    if (nungguSentuh) return;
    nungguSentuh = true;
    var f = function(){
      document.removeEventListener('click', f, true);
      document.removeEventListener('touchstart', f, true);
      nungguSentuh = false;
      sedangPutarDariJauh = true;
      putarAman();
    };
    document.addEventListener('click', f, true);
    document.addEventListener('touchstart', f, true);
  }

  function putarAman(){
    var pr;
    try { pr = $('audio').play(); } catch(e){ pasangSentuhSekali(); return; }
    if (pr && pr.catch) pr.catch(function(){ pasangSentuhSekali(); });
  }

  function sambung(){
    if (!CFG.url) return;
    if (ws && (ws.readyState === 0 || ws.readyState === 1)) return;
    setStatus(ulangSambung ? 'Menyambung ulang...' : 'Menyambung ke server...', 'wait');
    try { ws = new WebSocket(CFG.url); } catch(e){ jadwalSambungUlang(); return; }

    // Penjaga waktu. WebSocket yang menggantung di status CONNECTING TIDAK pernah
    // memicu onerror/onclose sendiri - kartunya bisa diam di "Menyambung ke
    // server..." berjam-jam. Itu yang terjadi kalau alamat tunnel di kartu sudah
    // kedaluwarsa (cloudflared restart = alamat baru, kartu lama tetap menunjuk
    // alamat mati). Jadi kalau 9 detik belum tersambung, soketnya dipaksa tutup
    // supaya jalur sambung-ulang jalan dan pemakai dapat pesan yang jelas.
    (function(sock){
      setTimeout(function(){
        if (sock && sock.readyState === 0){ try { sock.close(); } catch(e){} }
      }, 9000);
    })(ws);

    ws.onopen = function(){
      // Tunjukkan kunci sesinya dulu; tanpa ini server memutus sambungan.
      kirim({ t:'m_kunci', kunci: CFG.kunci || '' });
      nyambung = true; ulangSambung = 0;
      setStatus('Tersambung. Cari lagu di atas.', null);
      if (kode) kirim({ t:'m_gabung', kode: kode, nama: $('in-nama').value || CFG.nama });
    };
    ws.onclose = function(){ nyambung = false; jadwalSambungUlang(); };
    ws.onerror = function(){ try { ws.close(); } catch(e){} };
    ws.onmessage = function(ev){
      var d; try { d = JSON.parse(ev.data); } catch(e){ return; }
      if (!d || String(d.t).slice(0,2) !== 'm_') return;
      terima(d);
    };
  }

  function jadwalSambungUlang(){
    if (sesiMati) return;              // kunci sudah kedaluwarsa, percuma
    if (timerSambung || !CFG.url) return;
    ulangSambung++;
    var jeda = Math.min(1000 * ulangSambung, 8000);
    if (ulangSambung >= 3){
      setStatus('Server tidak menjawab. Kartu ini mungkin kedaluwarsa.', 'bad');
      $('mati').style.display = '';
      $('mati').firstElementChild.textContent = 'Alamat server di kartu ini sudah tidak hidup - alamatnya berubah tiap bot restart, jadi kartu lama (apalagi hasil diteruskan) tidak bisa nyambung lagi. Kirim ulang perintah .spotifylive buat dapat kartu baru.';
    } else {
      setStatus('Koneksi putus. Mencoba lagi...', 'bad');
    }
    timerSambung = setTimeout(function(){ timerSambung = null; sambung(); }, jeda);
  }

  function kirim(o){ try { if (ws && ws.readyState === 1) ws.send(JSON.stringify(o)); } catch(e){} }

  // ================= denyut penyelaras =================
  // Kirim aksi sekali jalan (play/jeda/geser) TIDAK cukup buat bikin semua HP
  // seragam: pesan bisa telat, dan tiap anggota mengunduh lagunya sendiri dengan
  // lama yang beda-beda, jadi begitu mulai, posisinya sudah melenceng dan tidak
  // pernah balik lagi. Karena itu host mengabarkan keadaan sebenarnya - detik ke
  // berapa dan sedang jalan atau tidak - tiap 2 detik, lalu tiap anggota
  // menyamakan dirinya ke kabar itu. Efeknya seperti berbagi layar: host jeda,
  // semua ikut jeda; host geser, semua ikut geser.
  function mulaiDenyut(){
    if (timerDenyut) return;
    timerDenyut = setInterval(function(){
      if (!sayaHost || !kode || !urlLaguSekarang) return;
      var a = $('audio');
      if (!a.duration) return;
      kirim({ t:'m_denyut', url: urlLaguSekarang, posisi: a.currentTime || 0, jalan: !a.paused });
    }, DENYUT_MS);
  }

  function mulaiPing(){
    if (timerPing) return;
    timerPing = setInterval(function(){
      if (kode) kirim({ t:'m_ping', ts: Date.now() });
    }, 5000);
    if (kode) kirim({ t:'m_ping', ts: Date.now() });
  }

  function catatPong(d){
    var pp = Date.now() - (Number(d.ts) || Date.now());
    var sekali = Math.min(Math.max(pp / 2, 0), 1500);
    latensi = latensi ? (latensi * 0.6 + sekali * 0.4) : sekali;
  }

  function ikutiDenyut(d){
    if (sayaHost || !kode) return;
    // Lagu anggota belum sama dengan lagu host - tunggu kiriman 'ganti'.
    if (!d.url || d.url !== urlLaguSekarang) return;
    var a = $('audio');
    if (!a.duration) return;

    if (d.jalan && a.paused){ sedangPutarDariJauh = true; putarAman(); }
    else if (!d.jalan && !a.paused){ sedangPutarDariJauh = true; a.pause(); }

    // Kabar ini dikirim beberapa ratus milidetik yang lalu, jadi kalau lagunya
    // sedang jalan, host sekarang sudah lebih maju sebanyak waktu tempuh tadi.
    var sasaran = (Number(d.posisi) || 0) + (d.jalan ? latensi / 1000 : 0);

    // Selisih kecil dibiarkan - kalau tiap kabar dipaksa lompat, suaranya
    // jadi patah-patah tanpa ada gunanya buat telinga.
    if (Math.abs((a.currentTime || 0) - sasaran) > TOLERANSI){
      try { a.currentTime = sasaran; } catch(e){}
    }
  }

  // ================= hasil dari server =================
  function terima(d){
    if (d.t === 'm_err'){ setStatus(d.m, 'bad'); $('p-load').textContent = d.m; return; }
    if (d.t === 'm_jatah'){ tampilJatah(d); return; }
    if (d.t === 'm_limit'){ tampilLimitHabis(d); return; }
    if (d.t === 'm_hasil'){
      if (pendengarSaja() && typeof d.q === 'string') $('in-cari').value = d.q;
      tampilHasil(d.list);
      return;
    }
    if (d.t === 'm_ketik'){ if (pendengarSaja()) $('in-cari').value = d.q || ''; return; }
    if (d.t === 'm_proses'){ $('p-load').textContent = d.m; return; }
    if (d.t === 'm_meta'){
      metaSaatIni = d; bongkahMasuk = new Array(d.totalBongkah); totalBongkahDiharap = d.totalBongkah;
      $('player').className = 'player is-on';
      $('p-title').textContent = d.title || 'Tanpa judul';
      $('p-artist').textContent = d.artist || 'Artis tidak diketahui';
      $('p-art').style.backgroundImage = d.cover ? 'url(' + d.cover + ')' : '';
      // innerHTML, bukan textContent: IKON_NOT sekarang berisi markup SVG.
      $('p-art').innerHTML = d.cover ? '' : IKON_NOT;
      $('p-load').textContent = 'Mengunduh 0%...';
      return;
    }
    if (d.t === 'm_bongkah'){
      bongkahMasuk[d.i] = d.data;
      var terisi = 0; for (var i=0;i<bongkahMasuk.length;i++) if (bongkahMasuk[i]) terisi++;
      $('p-load').textContent = 'Mengunduh ' + Math.round(terisi/totalBongkahDiharap*100) + '%...';
      return;
    }
    if (d.t === 'm_selesai'){ rakitDanPutar(); return; }
    if (d.t === 'm_ruang'){
      kode = d.kode; sayaHost = !!d.host; sayaId = d.saya || ''; $('kode-besar').textContent = kode;
      $('lobby').style.display = 'none'; $('arena').style.display = '';
      terapkanPeran();
      return;
    }
    if (d.t === 'm_peran'){
      // Host lama keluar - jabatannya turun ke kita.
      sayaHost = !!d.host; terapkanPeran();
      tambahChat('', 'Host sebelumnya keluar. Sekarang kamu yang mengatur lagu.', false);
      return;
    }
    if (d.t === 'm_anggota'){ daftarAnggota = d.anggota || []; namaHost = d.host; idHost = d.hostId; tampilAnggota(daftarAnggota, namaHost, idHost); return; }
    if (d.t === 'm_hilang'){
      kode = ''; sayaHost = false; $('lobby').style.display = ''; $('arena').style.display = 'none';
      terapkanPeran();
      return;
    }
    if (d.t === 'm_chat'){ tambahChat(d.nama, d.m, false, d.id, d.dari); return; }
    if (d.t === 'm_chat_id'){
      // Nomor buat pesan yang barusan KITA kirim - dipasang belakangan supaya
      // tombol hapusnya muncul.
      if (barisChatTerakhir){
        barisChatTerakhir.setAttribute('data-id', d.id);
        barisChatTerakhir.setAttribute('data-dari', sayaId);
        pasangTombolHapus(barisChatTerakhir, d.id);
        barisChatTerakhir = null;
      }
      return;
    }
    if (d.t === 'm_chat_hapus'){ hapusChat(d.id); return; }
    // Sama persis dengan 'yl_kunci_ok' di kartu Ytlive: kuncinya sudah diterima
    // server, kartu tidak perlu berbuat apa-apa lagi. Masa berlaku sengaja TIDAK
    // ditampilkan - dulu ada hitung mundur "Sesi berakhir dalam mm:ss" di sini.
    if (d.t === 'm_kunci_ok'){ return; }
    if (d.t === 'm_kunci_habis'){
      // Berhenti mencoba nyambung: kartunya memang sudah tidak berlaku, jadi
      // percobaan berulang cuma bikin bingung.
      sesiMati = true;
      if (timerSambung){ clearTimeout(timerSambung); timerSambung = null; }
      try { ws.close(); } catch(e){}
      setStatus('', null);
      $('jatah').textContent = '';
      $('mati').style.display = '';
      $('mati').firstElementChild.textContent = 'Sesi kartu ini berlaku 30 menit dan sudah habis. Kirim .spotifylive lagi buat kartu baru.';
      return;
    }
    if (d.t === 'm_daftar'){
      $('dot2').className = 'status__dot';
      $('status2').textContent = (d.list && d.list.length ? d.list.length + ' ruangan terbuka' : 'Belum ada ruangan terbuka');
      tampilDaftar(d.list);
      return;
    }
    if (d.t === 'm_ditendang'){
      kode = ''; sayaHost = false; sayaId = '';
      $('lobby').style.display = ''; $('arena').style.display = 'none';
      $('chat-log').innerHTML = '<div class="chat__empty">Belum ada pesan.</div>';
      terapkanPeran();
      setStatus('Kamu dikeluarkan dari ruangan oleh host.', 'bad');
      return;
    }
    if (d.t === 'm_kontrol'){ terapkanKontrolJauh(d); return; }
    if (d.t === 'm_denyut'){ ikutiDenyut(d); return; }
    if (d.t === 'm_pong'){ catatPong(d); return; }
  }

  // ================= pencarian & pemutaran =================
  function escapeHtml(s){
    var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML;
  }

  // Tandai baris lagu yang sedang diputar - sama-sama kelihatan di layar host
  // maupun anggota, jadi jelas lagu mana yang lagi jalan.
  function tandaiAktif(){
    var baris = $('hasil').querySelectorAll('.trk');
    for (var i=0;i<baris.length;i++){
      var cocok = urlLaguSekarang && baris[i].getAttribute('data-url') === urlLaguSekarang;
      baris[i].className = 'trk' + (cocok ? ' is-main' : '');
    }
  }

  // ================= gulir lewat tombol =================
  // Gulir dengan jari tidak bisa diandalkan di dalam kartu WhatsApp (gerakannya
  // direbut daftar pesan), jadi tiap kotak panjang - hasil pencarian, chat, dan
  // daftar ruang global - memakai sepasang tombol kecil. Ditulis sekali di sini
  // lalu dipasang ke ketiganya, bukan disalin tiga kali.
  function pasangGulir(idKotak, idBar, idAtas, idBawah, idInfo, kelasKotak){
    var el = $(idKotak);

    function perbarui(){
      var bisa = el.scrollHeight - el.clientHeight > 4;
      $(idBar).className = 'gulir' + (bisa ? ' is-on' : '');
      el.className = kelasKotak + (bisa ? ' is-gulir' : '');
      if (!bisa) return;
      $(idAtas).disabled = el.scrollTop <= 1;
      $(idBawah).disabled = el.scrollTop >= el.scrollHeight - el.clientHeight - 1;
      var hal = Math.max(1, Math.ceil(el.scrollHeight / Math.max(1, el.clientHeight)));
      var kini = Math.min(hal, Math.floor(el.scrollTop / Math.max(1, el.clientHeight)) + 1);
      $(idInfo).textContent = kini + '/' + hal;
    }

    function geser(arah){
      el.scrollTop += arah * Math.max(60, el.clientHeight - 40);
      setTimeout(perbarui, 260);
    }

    $(idAtas).addEventListener('click', function(){ geser(-1); });
    $(idBawah).addEventListener('click', function(){ geser(1); });
    el.addEventListener('scroll', perbarui);
    return { perbarui: perbarui, keBawah: function(){ el.scrollTop = el.scrollHeight; setTimeout(perbarui, 60); } };
  }

  var gulirHasil = pasangGulir('hasil', 'gulir', 'gulir-atas', 'gulir-bawah', 'gulir-info', 'hasil');
  var gulirChat  = pasangGulir('chat-log', 'gulir-chat', 'chat-atas', 'chat-bawah', 'chat-info', 'chat__log');
  var gulirRuang = pasangGulir('daftar-ruang', 'gulir-ruang', 'ruang-atas', 'ruang-bawah', 'ruang-info', '');
  function perbaruiGulir(){ gulirHasil.perbarui(); }

  function tampilHasil(list){
    var el = $('hasil'); el.innerHTML = '';
    if (!list || !list.length){ el.innerHTML = '<div class="mati">Tidak ada hasil. Coba kata kunci lain.</div>'; return; }
    list.forEach(function(tr){
      var row = document.createElement('div');
      row.className = 'trk';
      row.setAttribute('data-url', tr.url || '');
      // Sampul datang sebagai data URI base64 dari server (link biasa diblokir
      // sandbox kartu, hasilnya kotak kosong seperti sebelumnya).
      row.innerHTML =
        '<div class="trk__art" style="' + (tr.cover ? 'background-image:url(' + tr.cover.replace(/"/g,'') + ')' : '') + '">' + (tr.cover ? '' : IKON_NOT) + '</div>' +
        '<div class="trk__meta"><div class="trk__title">' + escapeHtml(tr.title) + '</div><div class="trk__artist">' + escapeHtml(tr.artist) + '</div></div>' +
        '<span class="trk__eq"><i></i><i></i><i></i></span>';
      row.addEventListener('click', function(){
        if (pendengarSaja()) return;   // anggota cuma menonton daftar host
        // Lagu yang belum pernah diunduh di kartu ini butuh jatah. Yang sudah
        // pernah diputar tetap boleh diulang - byte-nya sudah ada di sini.
        if (!jatahBebas && jatahSisa <= 0 && tr.url !== urlLaguSekarang){ tampilLimitHabis({}); return; }
        sedangPutarDariJauh = false;
        urlLaguSekarang = tr.url;
        tandaiAktif();
        $('p-load').textContent = 'Menyiapkan...';
        kirim({ t:'m_putar', url: tr.url });
        siarkanGanti(tr);
      });
      el.appendChild(row);
    });
    tandaiAktif();
    setTimeout(perbaruiGulir, 30);
  }

  $('btn-cari').addEventListener('click', function(){
    var q = $('in-cari').value.trim();
    if (!q) return;
    $('hasil').innerHTML = '<div class="mati">Mencari...</div>';
    kirim({ t:'m_cari', q: q });
  });
  $('in-cari').addEventListener('keydown', function(e){
    if (e.key === 'Enter'){ e.preventDefault(); $('btn-cari').click(); }
  });

  // Ketikan host ikut tampil di layar anggota. Dibatasi (throttle)
  // supaya tiap huruf tidak jadi satu pesan sendiri - 200ms sudah terasa
  // langsung buat mata, tapi jauh lebih hemat buat soketnya.
  function rem(fn, jeda){
    var kunci = false, tunda = null;
    return function(){
      if (kunci){ clearTimeout(tunda); tunda = setTimeout(function(){ kunci = false; fn(); }, jeda); return; }
      kunci = true; fn();
      setTimeout(function(){ kunci = false; }, jeda);
    };
  }

  var siarKetik = rem(function(){
    if (sayaHost && kode) kirim({ t:'m_ketik', q: $('in-cari').value });
  }, 200);
  $('in-cari').addEventListener('input', siarKetik);


  function b64ToBlob(b64, mime){
    var bin = atob(b64);
    var arr = new Uint8Array(bin.length);
    for (var i=0;i<bin.length;i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }

  function rakitDanPutar(){
    if (!metaSaatIni) return;
    var utuh = bongkahMasuk.join('');
    var blob = b64ToBlob(utuh, 'audio/mpeg');
    if (audioUrlLama) URL.revokeObjectURL(audioUrlLama);
    audioUrlLama = URL.createObjectURL(blob);
    var audio = $('audio');
    audio.src = audioUrlLama;
    $('p-load').textContent = '';

    // Anggota yang gabung di tengah lagu: lompat ke posisi host dulu, baru jalan.
    if (posisiMenyusul > 0){
      var lompat = posisiMenyusul; posisiMenyusul = 0;
      audio.addEventListener('loadedmetadata', function sekali(){
        audio.removeEventListener('loadedmetadata', sekali);
        try { audio.currentTime = Math.min(lompat, audio.duration || lompat); } catch(e){}
      });
    }

    if (sedangPutarDariJauh){
      // Datang dari host: ikut jalan, kecuali host memang lagi menjeda.
      if (lanjutSetelahRakit) putarAman();
      lanjutSetelahRakit = true;
    } else {
      putarAman();
    }
    sedangPutarDariJauh = false;
  }

  var audio = $('audio');
  audio.addEventListener('play', function(){
    $('p-play').innerHTML = IKON_JEDA;
    if (sedangPutarDariJauh) sedangPutarDariJauh = false; else siarkanKontrol('play');
  });
  audio.addEventListener('pause', function(){
    $('p-play').innerHTML = IKON_PUTAR;
    if (sedangPutarDariJauh) sedangPutarDariJauh = false; else siarkanKontrol('pause');
  });
  audio.addEventListener('timeupdate', function(){
    if (!audio.duration) return;
    $('p-bar').value = (audio.currentTime / audio.duration) * 100;
    $('p-now').textContent = fmtWaktu(audio.currentTime);
    $('p-total').textContent = fmtWaktu(audio.duration);
  });
  function fmtWaktu(s){ s = Math.floor(s||0); return Math.floor(s/60) + ':' + String(s%60).padStart(2,'0'); }


  $('p-play').addEventListener('click', function(){ if (audio.paused) audio.play().catch(function(){}); else audio.pause(); });
  $('p-mundur').addEventListener('click', function(){ audio.currentTime = Math.max(0, audio.currentTime - 10); siarkanSeek(); });
  $('p-maju').addEventListener('click', function(){ audio.currentTime = Math.min(audio.duration||0, audio.currentTime + 10); siarkanSeek(); });
  audio.addEventListener('seeked', function(){ if (!sedangPutarDariJauh) siarkanSeek(); });
  $('p-bar').addEventListener('change', function(){
    if (audio.duration) audio.currentTime = (parseFloat($('p-bar').value)/100) * audio.duration;
    siarkanSeek();
  });

  // ================= sinkron ruangan =================
  // Cuma host yang menyiarkan. Anggota memanggil fungsi ini juga (jalur kodenya
  // sama), tapi berhenti di penjaga ini - biar tidak ada pesan sia-sia yang
  // ujungnya ditolak server.
  function siarkanGanti(tr){ if (!sayaHost) return; kirim({ t:'m_kontrol', aksi:'ganti', posisi:0, track:{ title:tr.title, artist:tr.artist, cover:tr.cover, url:tr.url } }); }
  function siarkanKontrol(aksi){ if (!sayaHost) return; kirim({ t:'m_kontrol', aksi: aksi, posisi: audio.currentTime||0 }); }
  function siarkanSeek(){ if (!sayaHost) return; kirim({ t:'m_kontrol', aksi:'seek', posisi: audio.currentTime||0 }); }

  function terapkanKontrolJauh(d){
    if (d.aksi === 'ganti' && d.track && d.track.url){
      sedangPutarDariJauh = true;
      urlLaguSekarang = d.track.url;
      tandaiAktif();
      $('ikut-teks').textContent = 'Ngikutin ' + (d.dari || 'host');
      posisiMenyusul = (Number(d.posisi) || 0) + (d.jalan === false ? 0 : latensi / 1000);
      lanjutSetelahRakit = (d.jalan !== false);
      $('p-load').textContent = 'Menyiapkan lagu dari ' + escapeHtml(d.dari) + '...';
      kirim({ t:'m_putar', url: d.track.url });
      pilihTab('cari');
      return;
    }
    if (d.aksi === 'play'){
      sedangPutarDariJauh = true;
      if (audio.duration && typeof d.posisi === 'number') { try { audio.currentTime = d.posisi; } catch(e){} }
      putarAman();
      return;
    }
    if (d.aksi === 'pause'){ sedangPutarDariJauh = true; audio.pause(); return; }
    if (d.aksi === 'seek'){ if (audio.duration) audio.currentTime = d.posisi || 0; return; }
  }

  // ================= ruangan: buat/gabung/keluar/chat =================
  function tampilAnggota(list, hostNama, hostId){
    var el = $('anggota'); el.innerHTML = '';
    (list||[]).forEach(function(a){
      // Daftar sekarang berisi objek {id, nama}. Bentuk lama (teks) tetap
      // diterima supaya kartu yang belum diperbarui tidak langsung rusak.
      var id = (a && a.id) || '';
      var nama = (a && a.nama) || String(a || '');
      var iniHost = hostId ? (id === hostId) : (hostNama && nama === hostNama);

      var chip = document.createElement('span');
      chip.className = 'anggota__chip' + (iniHost ? ' is-host' : '');
      chip.appendChild(document.createTextNode(iniHost ? (nama + ' - host') : nama));

      // Tombol keluarkan cuma muncul buat host, dan tidak pada dirinya sendiri.
      if (sayaHost && !iniHost && id){
        var buang = document.createElement('button');
        buang.className = 'anggota__buang';
        buang.textContent = '\u00d7';
        buang.title = 'Keluarkan ' + nama;
        buang.addEventListener('click', function(){
          kirim({ t:'m_tendang', id: id });
        });
        chip.appendChild(buang);
      }
      el.appendChild(chip);
    });
  }

  // ================= ruang global =================
  var timerDaftar = null;
  // sesiMati cuma penanda "kartu sudah tidak berlaku" supaya sambung-ulang
  // berhenti. Tidak ada lagi hitung mundur sisa sesi seperti dulu - mengikuti
  // kartu Ytlive, masa berlaku kunci ditangani sepenuhnya di server dan kartu
  // baru bereaksi saat server benar-benar mengirim 'm_kunci_habis'.
  var sesiMati = false;

  function mintaDaftar(){ kirim({ t:'m_daftar' }); }

  function aturSegarDaftar(nyala){
    // Daftar disegarkan berkala HANYA selagi tabnya dibuka - kalau jalan terus,
    // tiap kartu yang terbuka akan menghujani server tanpa ada yang melihat.
    if (nyala && !timerDaftar){ timerDaftar = setInterval(mintaDaftar, 6000); }
    else if (!nyala && timerDaftar){ clearInterval(timerDaftar); timerDaftar = null; }
  }

  var daftarRuang = [];

  function tampilDaftar(list){
    if (list) daftarRuang = list;
    var el = $('daftar-ruang');
    var kunci = ($('cari-ruang').value || '').toLowerCase().trim();
    list = daftarRuang.filter(function(r){
      if (!kunci) return true;
      return ((r.judul || '') + ' ' + (r.host || '')).toLowerCase().indexOf(kunci) >= 0;
    });
    el.innerHTML = '';
    if (kunci && !list.length){
      el.innerHTML = '<div class="mati">Tidak ada ruangan yang cocok dengan "' + escapeHtml(kunci) + '".</div>';
      gulirRuang.perbarui();
      return;
    }
    if (!list || !list.length){
      el.innerHTML = '<div class="mati">Belum ada ruangan umum yang terbuka. Kamu bisa membuat sendiri di tab "Bareng" - centang "Buka untuk umum".</div>';
      gulirRuang.perbarui();
      return;
    }
    list.forEach(function(r){
      var baris = document.createElement('div');
      baris.className = 'ruang';

      var meta = document.createElement('div');
      meta.className = 'ruang__meta';
      var judul = document.createElement('div');
      judul.className = 'ruang__judul';
      judul.textContent = r.judul || r.kode;
      var sub = document.createElement('div');
      sub.className = 'ruang__sub';
      sub.textContent = (r.lagu ? (r.lagu + ' - ' + (r.artis || '')) : 'Belum ada lagu') +
        '  \u00b7  ' + r.jumlah + '/' + r.maks + ' orang';
      meta.appendChild(judul); meta.appendChild(sub);

      var masuk = document.createElement('button');
      masuk.className = 'ruang__masuk';
      if (kode === r.kode){ masuk.textContent = 'Di sini'; masuk.disabled = true; }
      else if (r.jumlah >= r.maks){ masuk.textContent = 'Penuh'; masuk.disabled = true; }
      else {
        masuk.textContent = 'Masuk';
        masuk.addEventListener('click', function(){
          bukaAudio();
          kirim({ t:'m_gabung', kode: r.kode, nama: $('in-nama').value || CFG.nama || 'Pemain' });
          pilihTab('ruang');
        });
      }

      baris.appendChild(meta); baris.appendChild(masuk);
      el.appendChild(baris);
    });
    setTimeout(gulirRuang.perbarui, 30);
  }

  $('cari-ruang').addEventListener('input', function(){ tampilDaftar(null); });

  $('btn-segarkan').addEventListener('click', mintaDaftar);

  // Kolom nama ruangan cuma berguna kalau ruangannya memang dibuka untuk umum.
  $('in-publik').addEventListener('change', function(){
    $('field-judul').style.display = this.checked ? '' : 'none';
  });

  function tambahChat(nama, teks, milikSaya, idPesan, dariId){
    var log = $('chat-log');
    var kosong = log.querySelector('.chat__empty');
    if (kosong) kosong.remove();

    var row = document.createElement('div');
    row.className = 'chat__row' + (milikSaya ? ' is-me' : '');
    if (idPesan) row.setAttribute('data-id', idPesan);
    if (dariId) row.setAttribute('data-dari', dariId);

    // Mahkota kecil menandai pesan dari host - di ruangan ramai, tanpa penanda
    // ini orang sering tidak tahu instruksi datang dari yang megang lagu.
    var dariHost = (dariId && idHost && dariId === idHost) || (milikSaya && sayaHost);
    if (dariHost){
      var mk = document.createElement('span');
      mk.className = 'chat__mahkota';
      mk.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" style="width:100%;height:100%;display:block"><path d="M3 8l4.5 3L12 4l4.5 7L21 8l-1.8 9.5a1 1 0 01-1 .8H5.8a1 1 0 01-1-.8L3 8z"/></svg>';
      mk.title = 'Host ruangan';
      row.appendChild(mk);
    }

    var isi = document.createElement('span');
    isi.className = 'chat__isi';
    if (nama || milikSaya){
      var b = document.createElement('b'); b.textContent = (milikSaya ? 'Kamu' : nama) + ': ';
      isi.appendChild(b);
    }
    isi.appendChild(document.createTextNode(teks));
    row.appendChild(isi);

    // Pesan bisa dihapus penulisnya sendiri, dan host bisa menghapus pesan
    // siapa pun. Pesan sistem (tanpa nama & tanpa id) tidak dapat tombol.
    if (idPesan && (milikSaya || sayaHost)){
      var hapus = document.createElement('button');
      hapus.className = 'chat__hapus';
      hapus.textContent = '\u00d7';
      hapus.title = 'Hapus pesan';
      hapus.addEventListener('click', function(){
        kirim({ t:'m_chat_hapus', id: idPesan, dari: dariId || sayaId });
      });
      row.appendChild(hapus);
    }

    log.appendChild(row);
    gulirChat.keBawah();
    return row;
  }

  function pasangTombolHapus(row, idPesan){
    if (!row || row.querySelector('.chat__hapus')) return;
    var hapus = document.createElement('button');
    hapus.className = 'chat__hapus';
    hapus.textContent = '\u00d7';
    hapus.title = 'Hapus pesan';
    hapus.addEventListener('click', function(){
      kirim({ t:'m_chat_hapus', id: idPesan, dari: sayaId });
    });
    row.appendChild(hapus);
  }

  function hapusChat(idPesan){
    var row = $('chat-log').querySelector('[data-id="' + idPesan + '"]');
    if (!row) return;
    row.className = 'chat__row is-hapus';
    row.innerHTML = '';
    var isi = document.createElement('span');
    isi.className = 'chat__isi';
    isi.textContent = 'Pesan dihapus';
    row.appendChild(isi);
  }

  $('btn-buat').addEventListener('click', function(){
    bukaAudio();
    kirim({
      t:'m_buat',
      nama: $('in-nama').value || 'Pemain',
      publik: $('in-publik').checked,
      judul: $('in-judul').value,
      maks: parseInt($('in-maks').value, 10) || 10
    });
  });
  $('btn-gabung').addEventListener('click', function(){
    bukaAudio();
    var k = ($('in-kode').value || '').toUpperCase().trim();
    if (!k) return;
    kirim({ t:'m_gabung', kode: k, nama: $('in-nama').value || 'Pemain' });
  });
  $('btn-keluar-ruang').addEventListener('click', function(){
    kirim({ t:'m_keluar' });
    kode = ''; sayaHost = false; sayaId = ''; daftarAnggota = [];
    $('lobby').style.display = ''; $('arena').style.display = 'none';
    terapkanPeran();
  });
  function kirimChat(){
    var teks = $('chat-in').value.trim();
    if (!teks) return;
    kirim({ t:'m_chat', m: teks.slice(0,120) });
    // Ditampilkan seketika supaya terasa cepat; nomor pesannya menyusul dari
    // server lewat m_chat_id, baru tombol hapusnya dipasang.
    barisChatTerakhir = tambahChat('Kamu', teks, true);
    $('chat-in').value = '';
  }
  $('chat-send').addEventListener('click', kirimChat);
  $('chat-in').addEventListener('keydown', function(e){ if (e.key === 'Enter'){ e.preventDefault(); kirimChat(); } });

  window.addEventListener('pagehide', function(){ kirim({ t:'m_keluar' }); });

  terapkanPeran();
  sambung();
  // Kalau kartunya dibuka dengan kode ruangan (mis. ".spotifylive K7QP"),
  // langsung pindah ke tab Dengerin Bareng biar pemain tidak perlu cari sendiri.
  if (CFG.kode) pilihTab('ruang');
})();
</script>
`;
}

module.exports = { buildMusikLiveHtml };
