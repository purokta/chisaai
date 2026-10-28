/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// WhatsApp Toolkit (v4.13): wame, vcard, readmore, formatwa, tpl, ekstrak, bersihchat, statchat.
// Semua berjalan lokal, tanpa API eksternal.
const K = require('../../lib/praktis')
const { B } = require('../../lib/style')

const CMDS = ['wame', 'vcard', 'readmore', 'formatwa', 'tpl', 'ekstrak', 'bersihchat', 'statchat']
const FENCE = '```'
const src = (text, m) => String(text || (m && m.quoted && (m.quoted.text || m.quoted.caption)) || '').trim()
const MORE = String.fromCharCode(8206).repeat(4001)   // trik "Baca selengkapnya" WhatsApp

// 08123456789 / +62 812-3456-789 / 8123456789 -> 628123456789
function normNumber(raw) {
  let d = String(raw || '').replace(/[^\d]/g, '')
  if (!d) return null
  if (d.startsWith('00')) d = d.slice(2)
  else if (d.startsWith('0')) d = '62' + d.slice(1)
  else if (d.startsWith('8')) d = '62' + d
  return d.length >= 8 && d.length <= 15 ? d : null
}

// Markdown -> format WhatsApp
function toWaFormat(text) {
  const blocks = []
  let s = String(text).replace(/```[\s\S]*?```/g, (x) => { blocks.push(x); return `\u0001${blocks.length - 1}\u0002` })
  s = s.replace(/^#{1,6}\s+(.+)$/gm, '\u0003$1\u0004')                       // judul -> tebal
    .replace(/\*\*(.+?)\*\*/g, '\u0003$1\u0004').replace(/__(.+?)__/g, '\u0003$1\u0004')   // **tebal** / __tebal__
    .replace(/(^|[^*\w])\*(?!\s)([^*\n]+?)\*(?!\w)/g, '$1_$2_')                // *miring* -> _miring_
    .replace(/~~(.+?)~~/g, '~$1~')                                           // ~~coret~~
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '$1 ($2)')             // [teks](url)
    .replace(/^\s*[-*+]\s+/gm, '• ')                                         // butir
    .replace(/\u0003/g, '*').replace(/\u0004/g, '*')
  return s.replace(/\u0001(\d+)\u0002/g, (_, i) => blocks[+i])
}

// ───────────── template pesan ─────────────
const BUILTIN_VARS = ['tanggal', 'hari', 'jam']
const varsOf = (body) => [...new Set([...body.matchAll(/\{([a-z0-9_]+)\}/gi)].map(x => x[1].toLowerCase()))].filter(v => !BUILTIN_VARS.includes(v))
function fillTpl(body, values) {
  const now = new Date(), names = varsOf(body)
  const map = { tanggal: K.fmtTanggal(K.dayKey(now)), hari: K.HARI[new Date(K.dayKey(now) + 'T00:00:00Z').getUTCDay()], jam: new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false }).format(now).replace('.', ':') + ' WIB' }
  names.forEach((n, i) => { map[n] = values[i] !== undefined && values[i] !== '' ? values[i] : `{${n}}` })
  return body.replace(/\{([a-z0-9_]+)\}/gi, (x, k) => map[k.toLowerCase()] !== undefined ? map[k.toLowerCase()] : x)
}

// ───────────── ekstrak ─────────────
const EXTRACT = {
  link: (t) => (t.match(/\bhttps?:\/\/[^\s<>"')\]]+|\bwww\.[^\s<>"')\]]+/gi) || []).map(x => x.replace(/[.,;:!?]+$/, '')),
  email: (t) => t.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || [],
  nomor: (t) => (t.match(/(?:\+|\b)(?:62|0)[\s-]?8\d{1,3}(?:[\s-]?\d{2,4}){2,3}\b/g) || []).map(x => x.replace(/[\s-]/g, '')),
  hashtag: (t) => t.match(/#[\p{L}\p{N}_]+/gu) || [],
  mention: (t) => (t.match(/(?<![\w.])@[\p{L}\p{N}_.]+/gu) || []).map(x => x.replace(/\.+$/, '')),
  angka: (t) => t.match(/(?<![\d-])-?\d+(?:[.,]\d+)?(?![\d-])/g) || [],
}

// ───────────── analisis ekspor chat ─────────────
const TS = '\\[?(\\d{1,2})[\\/.](\\d{1,2})[\\/.](\\d{2,4}),?\\s+\\d{1,2}[.:]\\d{2}(?:[.:]\\d{2})?(?:\\s?[APap]\\.?[Mm]\\.?)?\\]?\\s*-?\\s*'
const LINE_RE = new RegExp('^' + TS)
const NAME_RE = new RegExp('^' + TS + '([^:\\n]{1,60}?):\\s?(.*)$')
function parseChat(text) {
  const rows = []
  for (const line of String(text).split(/\r?\n/)) {
    const mm = line.match(NAME_RE)
    if (mm) rows.push({ name: mm[4].trim(), text: mm[5] })
    else if (LINE_RE.test(line)) continue                       // baris sistem (mis. "X bergabung")
    else if (rows.length && line.trim()) rows[rows.length - 1].text += '\n' + line
  }
  return rows
}
const STOP = new Set('yang dan di ke dari ini itu aku kamu kita dia ya iya tidak nggak gak ga udah sudah dong deh sih aja saja untuk dengan juga pada nya lah kok the a to of and in is'.split(' '))

module.exports = {
  name: 'wakit', alias: CMDS, category: 'tools', noLimit: true, cmds: CMDS,
  desc: 'WhatsApp Toolkit: wame, vcard, readmore, formatwa, tpl (template pesan), ekstrak, bersihchat, statchat',
  normNumber, toWaFormat, fillTpl, varsOf, EXTRACT, parseChat, MORE,
  run: async ({ sock, m, text, args, command, prefix, reply, sender }) => {
    const t = src(text, m), U = (c) => `${prefix}${c}`
    const who = (m && m.sender) || sender || 'anon'
    switch (command) {
      case 'wame': {
        const num = normNumber(args[0]), msg = args.slice(1).join(' ')
        if (!num) return reply(`${B('LINK WA.ME')}\n${U('wame 08123456789')}\n${U('wame 08123456789 Halo, saya mau tanya soal pesanan')}\n_Nomor 08xx / +62 / 62 otomatis diubah ke format internasional._`)
        return reply(`${B('LINK WA.ME')}\nhttps://wa.me/${num}${msg ? '?text=' + encodeURIComponent(msg) : ''}`)
      }
      case 'vcard': {
        const [nama, nomor, org, email] = String(text || '').split('|').map(x => x.trim())
        const num = normNumber(nomor)
        if (!nama || !num) return reply(`${B('KARTU KONTAK')}\n${U('vcard Budi Santoso|08123456789')}\n${U('vcard Budi|08123456789|Toko Maju|budi@mail.com')}\n_Format: nama|nomor|organisasi|email (dua terakhir opsional)._`)
        const esc = (x) => String(x).replace(/[\\;,]/g, (c) => '\\' + c).replace(/\n/g, ' ')
        const vcard = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${esc(nama)}`, org ? `ORG:${esc(org)}` : '', `TEL;type=CELL;type=VOICE;waid=${num}:+${num}`, email ? `EMAIL:${esc(email)}` : '', 'END:VCARD'].filter(Boolean).join('\n')
        return sock.sendMessage(m.chat, { contacts: { displayName: nama, contacts: [{ vcard }] } }, { quoted: m })
      }
      case 'readmore': {
        const [a, ...rest] = String(text || '').split('|'), b = rest.join('|').trim()
        if (!a.trim() || !b) return reply(`${B('BACA SELENGKAPNYA')}\n${U('readmore Judul yang terlihat|Isi yang tersembunyi')}\n_Teks setelah tanda | baru tampil setelah penerima menekan "Baca selengkapnya". Salin hasilnya lalu kirim ke chat tujuan._`)
        return reply(a.trim() + MORE + b)
      }
      case 'formatwa': {
        if (!t) return reply(`${B('FORMAT TEKS WHATSAPP')}\n*tebal*  →  *tebal*\n_miring_  →  _miring_\n~coret~  →  ~coret~\n${FENCE}monospasi${FENCE}\n\`kode satu baris\`\n> kutipan (awal baris)\n• butir: awali baris dengan "* " atau "- "\n1. daftar angka\n\nUbah tulisan Markdown (ChatGPT, README) jadi format WhatsApp: balas teksnya dengan ${U('formatwa')}`)
        return reply(toWaFormat(t))
      }
      case 'tpl': {
        const db = K.get(who, 'tpl', {}), sub = (args[0] || '').toLowerCase()
        const help = `${B('TEMPLATE PESAN')}\n${U('tpl simpan tagihan Halo {nama}, tagihan {jumlah} jatuh tempo {tanggal}.')}\n${U('tpl pakai tagihan Budi|Rp250.000')}  (isi {variabel} sesuai urutan)\n${U('tpl lihat tagihan')} • ${U('tpl daftar')} • ${U('tpl hapus tagihan')}\n_Variabel otomatis: {tanggal} {hari} {jam}. Maksimal 30 template, 1000 huruf._`
        if (sub === 'simpan') {
          const name = (args[1] || '').toLowerCase(), body = args.slice(2).join(' ').trim() || (m && m.quoted && m.quoted.text) || ''
          if (!/^[a-z0-9_]{1,20}$/.test(name) || !body) return reply(help)
          if (body.length > 1000) return reply(`${B('TEMPLATE PESAN')}\nIsi terlalu panjang (maks 1000 huruf).`)
          if (!db[name] && Object.keys(db).length >= 30) return reply(`${B('TEMPLATE PESAN')}\nBatas 30 template tercapai. Hapus dulu dengan ${U('tpl hapus <nama>')}.`)
          db[name] = body; K.set(who, 'tpl', db)
          const v = varsOf(body); return reply(`${B('TEMPLATE PESAN')}\nTemplate *${name}* tersimpan.${v.length ? `\nVariabel: ${v.map(x => '{' + x + '}').join(' ')}\nPakai: ${U('tpl pakai ' + name + ' ' + v.map(() => 'isi').join('|'))}` : ''}`)
        }
        if (sub === 'pakai') {
          const name = (args[1] || '').toLowerCase(); if (!db[name]) return reply(`${B('TEMPLATE PESAN')}\nTemplate "${name}" tidak ada. Lihat ${U('tpl daftar')}.`)
          const vals = args.slice(2).join(' ').split('|').map(x => x.trim())
          return reply(fillTpl(db[name], vals))
        }
        if (sub === 'lihat') { const name = (args[1] || '').toLowerCase(); return reply(db[name] ? `${B('TEMPLATE')} ${name}\n${db[name]}` : `${B('TEMPLATE PESAN')}\nTemplate "${name}" tidak ada.`) }
        if (sub === 'hapus') { const name = (args[1] || '').toLowerCase(); if (!db[name]) return reply(`${B('TEMPLATE PESAN')}\nTemplate "${name}" tidak ada.`); delete db[name]; K.set(who, 'tpl', db); return reply(`${B('TEMPLATE PESAN')}\nTemplate *${name}* dihapus.`) }
        if (sub === 'daftar') { const ks = Object.keys(db); return reply(ks.length ? `${B('TEMPLATE PESAN')} (${ks.length})\n` + ks.map(k => `• ${k}${varsOf(db[k]).length ? '  — ' + varsOf(db[k]).map(x => '{' + x + '}').join(' ') : ''}`).join('\n') : `${B('TEMPLATE PESAN')}\nBelum ada template.\n\n` + help) }
        return reply(help)
      }
      case 'ekstrak': {
        const kind = (args[0] || '').toLowerCase(), isKind = Object.keys(EXTRACT).includes(kind)
        const body = isKind ? (String(text || '').slice(String(text || '').indexOf(args[0]) + args[0].length).trim() || (m && m.quoted && (m.quoted.text || m.quoted.caption)) || '') : ''
        if (!isKind || !body) return reply(`${B('EKSTRAK DARI TEKS')}\n${U('ekstrak link <teks>')} atau balas pesan lalu ${U('ekstrak link')}\nJenis: ${Object.keys(EXTRACT).join(', ')}`)
        const out = [...new Set(EXTRACT[kind](body))]
        return reply(out.length ? `${B('EKSTRAK ' + kind.toUpperCase())} (${out.length})\n` + out.slice(0, 60).map((x, i) => `${i + 1}. ${x}`).join('\n') : `${B('EKSTRAK ' + kind.toUpperCase())}\nTidak ada ${kind} yang ditemukan.`)
      }
      case 'bersihchat': {
        const polos = (args[0] || '').toLowerCase() === 'polos'
        const body = polos ? (String(text || '').replace(/^\s*polos\b/i, '').trim() || (m && m.quoted && m.quoted.text) || '') : t
        if (!body) return reply(`${B('BERSIHKAN EKSPOR CHAT')}\nBalas teks ekspor chat WhatsApp dengan ${U('bersihchat')} (buang tanggal/jam, nama tetap)\n${U('bersihchat polos')}  → buang nama juga, hanya isi pesan`)
        const rows = parseChat(body)
        if (!rows.length) return reply(`${B('BERSIHKAN EKSPOR CHAT')}\nFormat ekspor WhatsApp tidak dikenali (contoh: 12/10/26 10.30 - Budi: halo).`)
        const out = rows.map(r => polos ? r.text : `${r.name}: ${r.text}`).join('\n')
        return reply(out.length > 3500 ? out.slice(0, 3500) + `\n_...dipotong, ${out.length - 3500} huruf lagi._` : out)
      }
      case 'statchat': {
        const rows = parseChat(t)
        if (!rows.length) return reply(`${B('STATISTIK CHAT')}\nBalas teks ekspor chat WhatsApp dengan ${U('statchat')}.\n_Ekspor lewat: Info chat → Ekspor chat → Tanpa media. Salin isi berkas .txt ke chat ini._`)
        const per = new Map(), words = new Map()
        for (const r of rows) {
          const p = per.get(r.name) || { n: 0, w: 0 }; p.n++; const ws = r.text.toLowerCase().match(/[\p{L}]{3,}/gu) || []; p.w += ws.length; per.set(r.name, p)
          for (const w of ws) if (!STOP.has(w)) words.set(w, (words.get(w) || 0) + 1)
        }
        const top = [...per.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 8)
        const tw = [...words.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
        return reply(`${B('STATISTIK CHAT')}\n${rows.length} pesan dari ${per.size} orang\n\n${B('Paling aktif')}\n` + top.map(([n, p], i) => `${i + 1}. ${n} — ${p.n} pesan (${(p.n / rows.length * 100).toFixed(1).replace('.', ',')}%), rata-rata ${(p.w / p.n).toFixed(1).replace('.', ',')} kata`).join('\n') + (tw.length ? `\n\n${B('Kata terbanyak')}\n` + tw.map(([w, c]) => `${w} (${c})`).join(', ') : ''))
      }
    }
  },
}
