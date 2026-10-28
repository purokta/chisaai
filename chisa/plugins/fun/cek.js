/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// HIBURAN: cek sifat (cek kacung, cek cantik, cek ganteng, cek bodoh, dst)
//   .cek <sifat> [@tag / reply]     atau langsung   .cekkacung  .cekcantik  .cekganteng
//   Bot kirim teks loading yang bergerak (pesan di-edit terus) sampai 100%, lalu hasil random 0-100%
//   + teks penilaian sesuai tingkatannya.
//     - sifat BAGUS  (ganteng, cantik, pintar, ...): 0% = buruk ... 100% = bagus
//     - sifat BURUK  (kacung, bodoh, miskin, ...)  : 0% = bagus ... 100% = buruk
//   Tambah sifat baru: cukup tambah satu baris di TRAITS (good: true = sifat bagus, false = sifat buruk).
const { targets, tag } = require('../../lib/grouputil')

const sleep = (ms) => new Promise(r => setTimeout(r, ms))
const pick = (a) => a[Math.floor(Math.random() * a.length)]

// key = nama command setelah "cek"  |  noun = kata benda di hasil  |  good = sifat bagus?
const TRAITS = [
  // ── sifat bagus ──
  { key: 'ganteng', noun: 'kegantengan', good: true },
  { key: 'tampan', hide: true, noun: 'ketampanan', good: true },
  { key: 'cantik', noun: 'kecantikan', good: true },
  { key: 'imut', noun: 'keimutan', good: true },
  { key: 'keren', noun: 'kekerenan', good: true },
  { key: 'pintar', noun: 'kepintaran', good: true },
  { key: 'pinter', hide: true, noun: 'kepintaran', good: true },
  { key: 'jenius', noun: 'kejeniusan', good: true },
  { key: 'kaya', noun: 'kekayaan', good: true },
  { key: 'sultan', noun: 'kesultanan', good: true },
  { key: 'baik', noun: 'kebaikan', good: true },
  { key: 'sabar', noun: 'kesabaran', good: true },
  { key: 'rajin', noun: 'kerajinan', good: true },
  { key: 'setia', noun: 'kesetiaan', good: true },
  { key: 'sholeh', noun: 'kesholehan', good: true },
  { key: 'sholehah', noun: 'kesholehan', good: true },
  { key: 'humoris', hide: true, noun: 'kelucuan', good: true },
  { key: 'lucu', noun: 'kelucuan', good: true },
  { key: 'jago', noun: 'kejagoan', good: true },
  { key: 'pemberani', noun: 'keberanian', good: true },
  { key: 'dermawan', noun: 'kedermawanan', good: true },
  { key: 'bijak', noun: 'kebijaksanaan', good: true },
  { key: 'hoki', noun: 'keberuntungan', good: true },
  { key: 'sigma', noun: 'kesigmaan', good: true },
  { key: 'jujur', noun: 'kejujuran', good: true },
  { key: 'sopan', noun: 'kesopanan', good: true },
  { key: 'ramah', noun: 'keramahan', good: true },
  { key: 'tulus', noun: 'ketulusan', good: true },
  { key: 'kuat', noun: 'kekuatan', good: true },
  { key: 'cerdas', hide: true, noun: 'kecerdasan', good: true },
  { key: 'bahagia', noun: 'kebahagiaan', good: true },
  { key: 'romantis', noun: 'keromantisan', good: true },
  { key: 'bersyukur', noun: 'kesyukuran', good: true },
  { key: 'tegas', noun: 'ketegasan', good: true },
  { key: 'karismatik', noun: 'kekarismaan', good: true },
  { key: 'kocak', hide: true, noun: 'kekocakan', good: true },
  // ── sifat buruk ──
  { key: 'kacung', noun: 'kekacungan', good: false },
  { key: 'bodoh', noun: 'kebodohan', good: false },
  { key: 'jelek', noun: 'kejelekan', good: false },
  { key: 'miskin', noun: 'kemiskinan', good: false },
  { key: 'malas', noun: 'kemalasan', good: false },
  { key: 'pelit', noun: 'kepelitan', good: false },
  { key: 'sombong', noun: 'kesombongan', good: false },
  { key: 'cupu', noun: 'kecupuan', good: false },
  { key: 'noob', noun: 'kenooban', good: false },
  { key: 'gabut', noun: 'kegabutan', good: false },
  { key: 'jomblo', noun: 'kejombloan', good: false },
  { key: 'bucin', noun: 'kebucinan', good: false },
  { key: 'toxic', noun: 'ketoxican', good: false },
  { key: 'lemot', noun: 'kelemotan', good: false },
  { key: 'baper', noun: 'kebaperan', good: false },
  { key: 'pelupa', noun: 'kepelupaan', good: false },
  { key: 'alay', noun: 'kealayan', good: false },
  { key: 'gila', noun: 'kegilaan', good: false },
  { key: 'kepo', noun: 'kekepoan', good: false },
  { key: 'ngeselin', noun: 'kengeselan', good: false },
  { key: 'bau', noun: 'kebauan', good: false },
  { key: 'pemalas', hide: true, noun: 'kemalasan', good: false },
  { key: 'jahat', noun: 'kejahatan', good: false },
  { key: 'licik', noun: 'kelicikan', good: false },
  { key: 'kejam', noun: 'kekejaman', good: false },
  { key: 'sadis', noun: 'kesadisan', good: false },
  { key: 'serakah', noun: 'keserakahan', good: false },
  { key: 'curang', noun: 'kecurangan', good: false },
  { key: 'rakus', noun: 'kerakusan', good: false },
  { key: 'pemarah', noun: 'kemarahan', good: false },
  { key: 'galak', noun: 'kegalakan', good: false },
  { key: 'cerewet', noun: 'kecerewetan', good: false },
  { key: 'nakal', noun: 'kenakalan', good: false },
  { key: 'genit', noun: 'kegenitan', good: false },
  { key: 'playboy', noun: 'keplayboyan', good: false },
  { key: 'munafik', noun: 'kemunafikan', good: false },
  { key: 'pendendam', noun: 'kependendaman', good: false },
  { key: 'penakut', noun: 'kepenakutan', good: false },
  { key: 'lebay', noun: 'kelebayan', good: false },
  { key: 'julid', noun: 'kejulidan', good: false },
  { key: 'sirik', noun: 'kesirikan', good: false },
  { key: 'nyebelin', hide: true, noun: 'kenyebelan', good: false },
]

const BY_KEY = Object.fromEntries(TRAITS.map(t => [t.key, t]))

// ── teks penilaian per tingkatan persen. {n} = nama sifat (mis. "kekacungan"), {who} = "mu" / "@tag" ──
// Batas tingkatan: 0 | 1-10 | 11-20 | 21-30 | 31-40 | 41-50 | 51-60 | 61-70 | 71-80 | 81-90 | 91-99 | 100
const tierOf = (p) => p === 0 ? 0 : p === 100 ? 11 : Math.min(10, Math.ceil(p / 10))

// SIFAT BAGUS: indeks naik = makin bagus (0% buruk -> 100% bagus)
const GOOD_TXT = [
  /* 0   */ ['{n} nol besar. Sama sekali tidak terdeteksi, alat ukurnya sampai bingung.', 'Kosong melompong. Tidak ada {n} sedikit pun, mungkin sedang libur panjang.'],
  /* 1-10 */ ['Nyaris tak terlihat. Perlu kaca pembesar buat nemuin {n}-nya.', 'Sangat rendah. Tapi tenang, semua legenda pernah mulai dari bawah.'],
  /* 11-20 */ ['Masih sangat kurang. Butuh banyak usaha dan doa.', 'Rendah banget. Jangan menyerah, masih ada jalan.'],
  /* 21-30 */ ['Di bawah rata-rata. Ada bibit, tinggal disiram tiap hari.', 'Kurang, tapi belum parah. Masih bisa diperbaiki.'],
  /* 31-40 */ ['Mulai kelihatan sedikit. Terus semangat, jangan kendor.', 'Lumayan lah, walau belum bisa dibanggakan.'],
  /* 41-50 */ ['Hampir setengah jalan. Standar orang biasa, aman.', 'Pas-pasan tapi nyaman. Tidak mengecewakan, tidak mengagumkan.'],
  /* 51-60 */ ['Di atas rata-rata. Mulai ada yang melirik nih.', 'Lumayan bagus! Sudah lewat setengah, tinggal dipoles.'],
  /* 61-70 */ ['Bagus! Banyak orang yang diam-diam mengakuinya.', 'Mantap. {n}-nya sudah kelihatan dari jauh.'],
  /* 71-80 */ ['Keren banget! Level ini jarang dimiliki orang.', 'Hebat. Sudah masuk kelas atas, tinggal sedikit lagi.'],
  /* 81-90 */ ['Luar biasa! Hampir sempurna, orang-orang pasti iri.', 'Wow, ini level elite. Layak jadi panutan.'],
  /* 91-99 */ ['Nyaris sempurna! Kurang sedikit lagi jadi legenda.', 'Dewa banget. Alat ukur sampai hampir meledak.'],
  /* 100 */ ['SEMPURNA 100%! Level legenda, tidak ada tandingannya. Semua orang tunduk.', 'MAKSIMAL! {n}-nya menembus batas, layak diabadikan dalam sejarah.'],
]

// SIFAT BURUK: indeks naik = makin buruk (0% bagus -> 100% buruk)
const BAD_TXT = [
  /* 0   */ ['Bersih total! Sama sekali tidak ada {n}. Kamu manusia teladan.', 'Nol besar, suci sempurna. Alat ukur sampai kagum.'],
  /* 1-10 */ ['Hampir tidak ada. Nyaris bersih, aman terkendali.', 'Sangat rendah. Cuma bumbu tipis, tidak masalah.'],
  /* 11-20 */ ['Rendah, masih aman. Sesekali kambuh, wajar.', 'Sedikit terdeteksi. Belum perlu khawatir.'],
  /* 21-30 */ ['Mulai kelihatan dikit. Masih bisa dikendalikan.', 'Ada, tapi masih tahap ringan. Jaga terus ya.'],
  /* 31-40 */ ['Lumayan terasa. Teman-teman mulai sadar.', 'Mulai mengganggu dikit. Perlu dikurangi nih.'],
  /* 41-50 */ ['Setengah-setengah. Antara iya dan tidak, tapi condong iya.', 'Sedang. Kadang muncul, kadang bersembunyi.'],
  /* 51-60 */ ['Sudah lewat setengah! Mulai jadi bahan obrolan grup.', 'Lumayan parah. Orang sekitar mulai geleng-geleng.'],
  /* 61-70 */ ['Parah juga ya. Susah disangkal lagi.', 'Tinggi. Sudah jadi ciri khas, bukan lagi kebetulan.'],
  /* 71-80 */ ['Sangat parah! Satu grup sudah tahu semua.', 'Gawat. {n}-nya sudah level berbahaya.'],
  /* 81-90 */ ['Parah banget! Sudah jadi legenda di mana-mana.', 'Astaga, ini mah level akut. Butuh penanganan serius.'],
  /* 91-99 */ ['Nyaris maksimal! Kurang sedikit lagi jadi juara dunia.', 'Hampir mencapai puncak. Alat ukur sampai berasap.'],
  /* 100 */ ['MAKSIMAL 100%! Juara dunia {n}, tidak ada yang bisa menandingi. Selamat (atau turut berduka).', 'PECAH! {n}-nya tembus batas alat ukur. Sudah layak dapat piala.'],
]

// ── animasi loading ──
const SPIN = ['◐', '◓', '◑', '◒']
const STATUS = ['Memindai data', 'Mengukur level', 'Menganalisis aura', 'Menghitung skor', 'Membandingkan dengan database', 'Hampir selesai', 'Finalisasi hasil']
const bar = (p, w = 12) => { const f = Math.round(p / 100 * w); return '█'.repeat(f) + '░'.repeat(w - f) }
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)

// langkah persen yang naik acak (tidak rata) supaya terasa hidup, selalu berakhir 100
function steps() {
  const out = []; let p = 0
  while (p < 100) { p = Math.min(100, p + 6 + Math.floor(Math.random() * 15)); out.push(p) }
  if (out[out.length - 1] !== 100) out.push(100)
  return out
}

const busy = new Set() // satu animasi per pengguna agar tidak numpuk / kena spam edit
const ALIASES = TRAITS.map(t => 'cek' + t.key)
const MENU = TRAITS.filter(t => !t.hide).map(t => 'cek' + t.key)   // varian ejaan lain tetap jalan, tapi tidak memenuhi menu

module.exports = {
  name: 'cek',
  alias: ALIASES,
  category: 'fun',
  // tampil di All Menu: satu per sifat (cekkacung, cekcantik, ...)
  menu: MENU,
  desc: 'Cek sifat dengan loading animasi: cek jahat, cek kacung, cek cantik, cek ganteng, cek bodoh, dll',
  run: async ({ sock, m, reply, text, args, command, prefix }) => {
    // ".cek kacung" -> sifat dari argumen pertama ; ".cekkacung" -> dari nama command
    let key = command === 'cek' ? (args[0] || '').toLowerCase() : command.slice(3)
    const rest = command === 'cek' ? args.slice(1).join(' ') : text

    if (!key || !BY_KEY[key]) {
      const good = TRAITS.filter(t => t.good).map(t => t.key), bad = TRAITS.filter(t => !t.good).map(t => t.key)
      const head = key ? `Sifat "${key}" tidak ada.\n\n` : ''
      return reply(`${head}*CEK SIFAT*\nContoh: ${prefix}cek kacung  atau  ${prefix}cekkacung\nBisa tag orang: ${prefix}cekcantik @user (atau reply pesannya)\n\n*Sifat bagus:*\n${good.join(', ')}\n\n*Sifat buruk:*\n${bad.join(', ')}`)
    }
    const trait = BY_KEY[key]

    if (busy.has(m.sender)) return reply('Tunggu hasil cek sebelumnya selesai dulu ya.')
    busy.add(m.sender)

    const t = targets(m, rest)[0]
    const who = t || m.sender
    const mentions = [who]
    const label = t && t !== m.sender ? tag(t) : 'mu'              // "kekacungan@tag" / "kekacunganmu"
    const sep = label === 'mu' ? '' : ' '
    const title = `${trait.noun}${sep}${label}`                         // kekacunganmu  /  kekacungan @tag
    const NN = cap(title)

    try {
      try { await sock.sendPresenceUpdate('composing', m.chat) } catch {}
      const seq = steps()
      const frame = (p, i) => `*CEK ${trait.key.toUpperCase()}*\n\n${SPIN[i % SPIN.length]} ${STATUS[Math.min(STATUS.length - 1, Math.floor(p / 100 * STATUS.length))]}...\n\n${bar(p)} *${p}%*\n\n_Mengukur ${title}_`

      let sent = await sock.sendMessage(m.chat, { text: frame(0, 0), mentions }, { quoted: m })
      let canEdit = true
      for (let i = 0; i < seq.length; i++) {
        await sleep(750 + Math.floor(Math.random() * 350))
        try { await sock.sendMessage(m.chat, { text: frame(seq[i], i + 1), edit: sent.key, mentions }) } catch { canEdit = false; break }
      }

      // ── hasil: random 0-100, teks sesuai tingkatan ──
      const p = Math.floor(Math.random() * 101)
      const line = pick((trait.good ? GOOD_TXT : BAD_TXT)[tierOf(p)]).replace(/\{n\}/g, trait.noun)
      const result = `*CEK ${trait.key.toUpperCase()}*\n\n${bar(p)} *${p}%*\n\nTingkat ${title}: *${p}%*\n\n${line}\n\n_Hanya hiburan, jangan baper._`

      await sleep(600)
      if (canEdit) {
        try { await sock.sendMessage(m.chat, { text: result, edit: sent.key, mentions }); return }
        catch {}
      }
      await sock.sendMessage(m.chat, { text: result, mentions }, { quoted: m })
    } catch (e) {
      console.log('[cek]', e.message)
      reply('Gagal menjalankan cek: ' + e.message)
    } finally {
      try { await sock.sendPresenceUpdate('paused', m.chat) } catch {}
      busy.delete(m.sender)
    }
  },
}
