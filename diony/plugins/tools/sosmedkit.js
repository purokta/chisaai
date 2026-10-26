/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Social Media Toolkit (v4.19): hashtag, buatcaption, hook, judulvideo, bikinbio, cekpanjang, utas, spasicaption, engagement, ukuranpost, rencanakonten.
// Semua berjalan lokal, tanpa API eksternal dan tanpa dependensi baru.
const { B } = require('../../lib/style')

const CMDS = ['hashtag', 'buatcaption', 'hook', 'judulvideo', 'bikinbio', 'cekpanjang', 'utas', 'spasicaption', 'engagement', 'ukuranpost', 'rencanakonten']
const src = (text, m) => String(text || (m && m.quoted && (m.quoted.text || m.quoted.caption)) || '').trim()
const pick = (a) => a[Math.floor(Math.random() * a.length)]
const shuffle = (a) => { const x = a.slice(); for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [x[i], x[j]] = [x[j], x[i]] } return x }
const cut = (s, n) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s)
const len = (s) => Array.from(String(s)).length                       // hitung per karakter (emoji = 1), bukan per UTF-16
const num = (s) => { const n = parseFloat(String(s || '').replace(/\./g, '').replace(',', '.')); return Number.isFinite(n) ? n : NaN }
const id = (n, d = 2) => n.toLocaleString('id-ID', { maximumFractionDigits: d })

// ───────────── batas platform (bisa berubah sewaktu-waktu; cek aplikasinya bila mepet) ─────────────
const LIMITS = {
  'Instagram caption': 2200, 'Instagram bio': 150, 'Instagram komentar': 2200,
  'TikTok caption': 4000, 'TikTok bio': 80,
  'X / Twitter post': 280, 'X bio': 160,
  'Threads post': 500, 'Threads bio': 150,
  'YouTube judul': 100, 'YouTube deskripsi': 5000,
  'Facebook post': 63206, 'LinkedIn post': 3000,
  'WhatsApp status teks': 700, 'WhatsApp info/bio': 139,
}
const SIZES = {
  'IG feed persegi': '1080×1080 (1:1)', 'IG feed potret': '1080×1350 (4:5)', 'IG story / Reels': '1080×1920 (9:16)',
  'TikTok': '1080×1920 (9:16)', 'YouTube video': '1920×1080 (16:9)', 'YouTube Shorts': '1080×1920 (9:16)',
  'YouTube thumbnail': '1280×720 (16:9)', 'YouTube banner': '2560×1440 (area aman tengah 1546×423)',
  'X post': '1600×900 (16:9)', 'Facebook post': '1200×630 (1.91:1)', 'LinkedIn post': '1200×627 (1.91:1)',
  'Foto profil': '320×320 (1:1, tampil bulat)', 'WhatsApp status': '1080×1920 (9:16)',
}

// ───────────── hashtag ─────────────
const GENERIC = {
  umum: ['fyp', 'explore', 'viral', 'trending', 'indonesia', 'foryou'],
  video: ['reels', 'reelsindonesia', 'shorts', 'tiktokindonesia', 'videoviral'],
  foto: ['photooftheday', 'instagood', 'aesthetic', 'fotografi', 'instadaily'],
}
const STOPW = new Set('yang dan di ke dari ini itu aku kamu kita dia ya tidak untuk dengan juga pada atau the a to of and in is for on at my your'.split(' '))
const tagify = (w) => String(w).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9_]/g, '')
function makeHashtags(topic, { max = 20 } = {}) {
  const words = [...new Set(String(topic).split(/[\s,;|]+/).map(tagify).filter(w => w.length >= 3 && !STOPW.has(w)))].slice(0, 6)
  if (!words.length) return []
  const out = []
  const add = (t) => { t = tagify(t); if (t.length >= 3 && t.length <= 30 && !out.includes(t)) out.push(t) }
  words.forEach(add)
  if (words.length >= 2) { add(words.join('')); for (let i = 0; i < words.length - 1; i++) add(words[i] + words[i + 1]) }
  for (const w of words.slice(0, 3)) for (const suf of ['indonesia', 'id', 'daily', 'lovers', 'community', 'tips', 'ideas']) add(w + suf)
  for (const w of words.slice(0, 2)) add('love' + w)
  const generic = shuffle([...GENERIC.umum, ...GENERIC.video, ...GENERIC.foto])
  for (const g of generic) { if (out.length >= max) break; add(g) }
  return out.slice(0, max)
}
const cleanTags = (text) => [...new Set((String(text).match(/#[\p{L}\p{N}_]+/gu) || []).map(x => x.toLowerCase()))]

// ───────────── caption / hook / judul / bio ─────────────
const CAPTION = {
  santai: ['{t} hari ini 😌 ada yang sama?', 'Tentang {t}: sederhana tapi bikin senyum.', 'Lagi {t}, jangan ganggu dulu ya ✌️', '{t}. Cukup. Titik.', 'Hari yang biasa, tapi {t} bikin jadi lumayan.'],
  estetik: ['{t} — momen kecil, rasa yang besar.', 'Di antara riuh, ada {t} yang menenangkan.', 'Simpan {t} baik-baik di ingatan.', 'Pelan-pelan menikmati {t}.', '{t}, dan dunia terasa lebih lembut.'],
  jualan: ['✨ {t} READY! Stok terbatas, siapa cepat dia dapat.', 'Cari {t}? Udah ketemu di sini. Cek harga lewat DM 📩', '{t} kualitas oke, harga ramah. Yuk order sebelum kehabisan!', 'PROMO {t} minggu ini! Tanya-tanya dulu boleh, klik link di bio 🔗', 'Yang nunggu {t} — akhirnya restock! Amankan sekarang.'],
  motivasi: ['Mulai dari {t}, selesaikan sedikit demi sedikit.', 'Kamu nggak harus sempurna di {t}, cukup konsisten.', 'Tiap langkah kecil di {t} tetap hitungan maju.', '{t} nggak akan nunggu kamu siap. Mulai aja.', 'Hasil {t} dimulai dari keputusan hari ini.'],
  lucu: ['Aku: mau hemat. Juga aku: {t} 🤡', 'Rencana awal bukan {t}, tapi ya sudahlah.', '{t} itu kayak mantan: susah dilupain, gampang bikin pengeluaran.', 'Ekspektasi vs realita {t}… jangan dibahas 😭', 'Katanya {t} cuma sebentar. Ini sudah 3 jam.'],
}
const CTA = ['Setuju? Tulis di komentar 👇', 'Simpan biar nggak lupa 📌', 'Kirim ke teman yang perlu lihat ini 📲', 'Menurutmu gimana? 💬', 'Follow untuk konten lainnya ✨']
const HOOKS = [
  '{t}: 3 hal yang nggak pernah dikasih tahu orang.', 'Berhenti scroll kalau kamu tertarik soal {t}.', 'Aku salah soal {t} selama bertahun-tahun, ini yang berubah.', 'Cara paling gampang mulai {t} dalam 30 detik.',
  'Kesalahan umum soal {t} yang bikin hasilnya nggak maksimal.', 'Kalau aku mulai {t} dari nol lagi, ini yang kulakukan pertama.', 'Jangan mulai {t} sebelum nonton ini.', 'Semua orang bahas {t}, tapi cuma sedikit yang tahu ini.',
  'Rahasia kecil {t} yang jarang dibahas.', '{t} bikin repot? Coba cara ini.', 'Detik ke-3 ini yang menentukan {t} kamu berhasil atau nggak.', 'POV: akhirnya paham {t} setelah lama bingung.',
]
const TITLES = [
  '{T}: Panduan Lengkap untuk Pemula', '7 Kesalahan {T} yang Wajib Kamu Hindari', 'Cara {T} dalam 10 Menit (Beneran Gampang)', '{T} — Yang Nggak Pernah Diceritakan', 'Aku Coba {T} Selama 30 Hari, Hasilnya?',
  'Kenapa {T} Penting Banget Sekarang', '{T} vs Cara Lama: Mana yang Lebih Baik?', 'Tips {T} untuk Hasil Maksimal', '{T}: Dari Nol Sampai Bisa', 'Rahasia {T} yang Jarang Dibahas',
]
const BIO_ICONS = ['✨', '📍', '🎯', '💼', '🎧', '📷', '☕', '🌙', '🔗', '💌']
function makeBios(parts) {
  const p = parts.map(x => x.trim()).filter(Boolean).slice(0, 5); if (!p.length) return []
  const mk = (sep, deco) => { const s = p.map((x, i) => (deco ? BIO_ICONS[i % BIO_ICONS.length] + ' ' : '') + x).join(sep); return s }
  return [mk(' | ', false), mk(' • ', false), mk('\n', true), mk(' ✦ ', false)]
}

// ───────────── utas (thread) ─────────────
function splitThread(text, max = 270) {
  const clean = String(text).replace(/\r/g, '').trim(); if (!clean) return []
  const budget = max - 8                                               // sisakan ruang untuk penomoran "(10/10)"
  const units = clean.split(/\n{2,}/).flatMap(par => par.match(/[^.!?\n]+[.!?]+["')\]]*\s*|[^.!?\n]+$/g) || [par]).map(s => s.trim()).filter(Boolean)
  const chunks = []; let cur = ''
  const push = () => { if (cur.trim()) chunks.push(cur.trim()); cur = '' }
  for (let u of units) {
    while (len(u) > budget) {                                          // kalimat panjang: potong di spasi
      const arr = Array.from(u); let i = budget; while (i > budget * 0.5 && arr[i] !== ' ') i--
      if (arr[i] !== ' ') i = budget
      if (cur) push(); chunks.push(arr.slice(0, i).join('').trim()); u = arr.slice(i).join('').trim()
    }
    if (len(cur) + len(u) + (cur ? 1 : 0) > budget) push()
    cur += (cur ? ' ' : '') + u
  }
  push()
  const n = chunks.length
  return n === 1 ? chunks : chunks.map((c, i) => `${c} (${i + 1}/${n})`)
}

// ───────────── spasi caption ─────────────
const BLANK = '\u2800'                                                  // braille blank: tidak dibuang aplikasi saat baris kosong
const spaceCaption = (t) => String(t).replace(/\r/g, '').split('\n').map(l => (l.trim() === '' ? BLANK : l)).join('\n')

// ───────────── engagement ─────────────
function engagement({ likes = 0, comments = 0, shares = 0, saves = 0, base }) {
  const total = likes + comments + shares + saves
  const er = base > 0 ? total / base * 100 : NaN
  return { total, er }
}
function erLabel(er) {
  if (!Number.isFinite(er)) return ''
  return er >= 6 ? 'sangat tinggi' : er >= 3 ? 'tinggi' : er >= 1 ? 'wajar / rata-rata' : 'rendah'
}

// ───────────── rencana konten ─────────────
const PILLARS = [
  ['Edukasi', 'Tips singkat tentang {n}'], ['Hiburan', 'Meme / momen lucu seputar {n}'], ['Behind the scene', 'Proses di balik {n}'], ['Testimoni', 'Cerita atau hasil nyata dari {n}'],
  ['Interaksi', 'Polling / tanya jawab soal {n}'], ['Promosi halus', 'Ajakan mencoba {n} dengan cerita singkat'], ['Inspirasi', 'Kutipan atau cerita motivasi tentang {n}'],
  ['Mitos vs fakta', 'Bongkar salah kaprah seputar {n}'], ['Before–after', 'Perbandingan sebelum dan sesudah dalam {n}'], ['Rekomendasi', 'Daftar pilihan favorit terkait {n}'],
]
const FORMATS = ['Reels / video pendek', 'Carousel', 'Foto tunggal + caption', 'Story + stiker interaktif', 'Live / Q&A singkat']
function contentPlan(niche, days) {
  const pillars = shuffle(PILLARS)
  return Array.from({ length: days }, (_, i) => { const [p, d] = pillars[i % pillars.length]; return { day: i + 1, pillar: p, idea: d.replace('{n}', niche), fmt: FORMATS[i % FORMATS.length] } })
}

module.exports = {
  name: 'sosmedkit', alias: CMDS, category: 'tools', noLimit: true, cmds: CMDS,
  desc: 'Social Media Toolkit: hashtag, buatcaption, hook, judulvideo, bikinbio, cekpanjang, utas, spasicaption, engagement, ukuranpost, rencanakonten',
  makeHashtags, cleanTags, makeBios, splitThread, spaceCaption, engagement, erLabel, contentPlan, LIMITS, SIZES, CAPTION, HOOKS, TITLES, len,
  run: async ({ text, args, command, prefix, reply, m }) => {
    const U = (c) => `${prefix}${c}`, t = src(text, m)
    switch (command) {
      case 'hashtag': {
        if (/^(bersih|rapikan)\b/i.test(t)) {
          const tags = cleanTags(t.replace(/^\S+\s*/, ''))
          return reply(tags.length ? `${B('HASHTAG BERSIH')} (${tags.length})\n${tags.join(' ')}` : `${B('HASHTAG BERSIH')}\n${U('hashtag bersih <teks berisi #tag>')} atau balas pesan lalu ${U('hashtag bersih')}.`)
        }
        const tags = makeHashtags(t)
        if (!tags.length) return reply(`${B('HASHTAG')}\n${U('hashtag kopi susu')}\n${U('hashtag bersih <teks>')}  → rapikan & hapus hashtag dobel\n_Tulis topik atau beberapa kata kunci; bot meracik kombinasi + tagar umum untuk jangkauan._`)
        return reply(`${B('HASHTAG')} (${tags.length})\n${tags.map(x => '#' + x).join(' ')}\n\n_Instagram membolehkan hingga 30 hashtag, tapi 5–15 yang relevan biasanya cukup. Cek ulang agar tidak ada tagar yang dibatasi._`)
      }
      case 'buatcaption': {
        const styles = Object.keys(CAPTION), first = (args[0] || '').toLowerCase()
        const style = styles.includes(first) ? first : null, topic = (style ? args.slice(1) : args).join(' ').trim()
        if (!topic) return reply(`${B('CAPTION')}\n${U('buatcaption liburan di pantai')}\n${U('buatcaption jualan sepatu lokal')}\nGaya: ${styles.join(', ')} (tanpa gaya = campur)`)
        const pool = style ? CAPTION[style] : Object.values(CAPTION).flat()
        const list = shuffle(pool).slice(0, 4).map((c, i) => `${i + 1}. ${c.replace(/\{t\}/g, topic)}`)
        return reply(`${B('CAPTION' + (style ? ' ' + style.toUpperCase() : ''))}\n${list.join('\n\n')}\n\n${B('Ajakan (CTA)')}\n${shuffle(CTA).slice(0, 2).join('\n')}`)
      }
      case 'hook': {
        if (!t) return reply(`${B('HOOK 3 DETIK')}\n${U('hook cara belajar desain')}\n_Kalimat pembuka Reels / TikTok / Shorts agar penonton berhenti scroll._`)
        return reply(`${B('HOOK 3 DETIK')}\n` + shuffle(HOOKS).slice(0, 6).map((h, i) => `${i + 1}. ${h.replace(/\{t\}/g, t)}`).join('\n'))
      }
      case 'judulvideo': {
        if (!t) return reply(`${B('JUDUL VIDEO')}\n${U('judulvideo belajar fotografi')}\n_Rumus judul YouTube (maks 100 huruf) — pilih yang paling pas._`)
        const T = t.replace(/\b\p{L}/gu, c => c.toUpperCase())
        return reply(`${B('JUDUL VIDEO')}\n` + shuffle(TITLES).slice(0, 6).map((h, i) => { const r = h.replace(/\{T\}/g, T); return `${i + 1}. ${r}${len(r) > 100 ? ' ⚠️ >100' : ''}` }).join('\n'))
      }
      case 'bikinbio': {
        const parts = String(text || '').split(/[|,;]+/).map(x => x.trim()).filter(Boolean)
        if (!parts.length) return reply(`${B('BIO GENERATOR')}\n${U('bikinbio Desainer grafis | Pecinta kopi | Jakarta')}\n_Pisahkan dengan | atau koma, maksimal 5 bagian. Hasil dihitung terhadap batas bio Instagram (150)._`)
        const bios = makeBios(parts)
        return reply(`${B('BIO GENERATOR')}\n` + bios.map((b, i) => `${i + 1}.\n${b}\n_${len(b)}/150 huruf${len(b) > 150 ? ' — terlalu panjang untuk IG' : ''}_`).join('\n\n'))
      }
      case 'cekpanjang': {
        if (!t) return reply(`${B('CEK PANJANG TEKS')}\nBalas / tulis teksmu: ${U('cekpanjang <teks>')}\n_Dibandingkan dengan batas karakter tiap platform._`)
        const n = len(t), words = (t.match(/\S+/g) || []).length
        const rows = Object.entries(LIMITS).map(([k, lim]) => `${n <= lim ? '✅' : '❌'} ${k}: ${n}/${lim}${n > lim ? ` (lebih ${n - lim})` : ''}`)
        return reply(`${B('CEK PANJANG TEKS')}\n${n} karakter • ${words} kata • ${t.split(/\r?\n/).length} baris\n\n${rows.join('\n')}\n\n_Batas platform bisa berubah; periksa aplikasinya bila angkanya mepet._`)
      }
      case 'utas': {
        if (!t) return reply(`${B('PEMECAH UTAS')}\nBalas teks panjang dengan ${U('utas')} (atau ${U('utas <teks>')}).\n_Dipecah per kalimat jadi bagian ≤ 270 huruf lengkap dengan nomor (1/n) untuk X / Threads._`)
        const parts = splitThread(t)
        if (parts.length > 25) return reply(`${B('PEMECAH UTAS')}\nTeks menghasilkan ${parts.length} bagian (maks 25). Pendekkan dulu.`)
        return reply(`${B('PEMECAH UTAS')} (${parts.length} bagian)\n\n` + parts.map(p => p).join('\n\n— — —\n\n'))
      }
      case 'spasicaption': {
        if (!t) return reply(`${B('SPASI CAPTION')}\nBalas / tulis caption dengan baris kosong: ${U('spasicaption <caption>')}\n_Baris kosong diganti karakter tak terlihat supaya jarak antar paragraf tidak hilang di Instagram / TikTok. Salin hasilnya._`)
        return reply(spaceCaption(t))
      }
      case 'engagement': {
        const v = args.map(num)
        if (v.length < 2 || v.slice(0, 2).some(x => !Number.isFinite(x))) return reply(`${B('ENGAGEMENT RATE')}\n${U('engagement <like> <komen> <share> <simpan> <followers>')}\nContoh: ${U('engagement 320 14 8 21 5400')}\nMinimal: ${U('engagement <like> <komen> <followers>')}\n_Rumus: (like + komen + share + simpan) ÷ followers × 100. Ganti followers dengan jumlah views untuk ER per tayangan._`)
        let likes, comments, shares = 0, saves = 0, base
        if (v.length === 3) [likes, comments, base] = v
        else if (v.length === 4) [likes, comments, shares, base] = v
        else [likes, comments, shares, saves, base] = v
        if (![likes, comments, shares, saves, base].every(x => Number.isFinite(x) && x >= 0) || base <= 0) return reply(`${B('ENGAGEMENT RATE')}\nAngka harus ≥ 0 dan followers / views harus lebih dari 0.`)
        const r = engagement({ likes, comments, shares, saves, base })
        return reply(`${B('ENGAGEMENT RATE')}\nInteraksi: ${id(r.total, 0)} (like ${id(likes, 0)} • komen ${id(comments, 0)} • share ${id(shares, 0)} • simpan ${id(saves, 0)})\nPembagi: ${id(base, 0)}\n\n*ER = ${id(r.er)}%* — ${erLabel(r.er)}\n_Patokan kasar: <1% rendah, 1–3% wajar, 3–6% tinggi, >6% sangat tinggi. Tiap platform & ukuran akun berbeda._`)
      }
      case 'ukuranpost': {
        const q = t.toLowerCase(), rows = Object.entries(SIZES).filter(([k]) => !q || k.toLowerCase().includes(q))
        if (!rows.length) return reply(`${B('UKURAN POST')}\nTidak ada platform "${t}". Coba: instagram, tiktok, youtube, x, facebook, linkedin, whatsapp.`)
        return reply(`${B('UKURAN POST')}\n${rows.map(([k, s]) => `• ${k}: ${s}`).join('\n')}\n\n_Atur otomatis lewat ${U('fitpost <ukuran>')} (reply foto)._`)
      }
      case 'rencanakonten': {
        const dayArg = args.find(a => /^\d{1,2}$/.test(a)), days = Math.min(14, Math.max(1, parseInt(dayArg) || 7))
        const niche = args.filter(a => a !== dayArg).join(' ').trim()
        if (!niche) return reply(`${B('RENCANA KONTEN')}\n${U('rencanakonten kopi 7')}\n${U('rencanakonten toko baju thrift 14')}\n_Kalender ide konten 1–14 hari; pilar & format diputar agar tidak monoton._`)
        const plan = contentPlan(niche, days)
        return reply(`${B('RENCANA KONTEN')} — ${niche} (${days} hari)\n` + plan.map(p => `Hari ${p.day} • ${p.pillar} • ${p.fmt}\n  ${p.idea}`).join('\n'))
      }
    }
  },
}
