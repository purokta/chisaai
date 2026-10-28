/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Alat analisis teks:
//   .teksinfo <teks|reply>          jumlah kata/karakter/kalimat/paragraf, waktu baca, kata terbanyak
//   .bandingteks <A> | <B>          tingkat kemiripan dua teks (0–100%) + selisih kata
//   .cekpass <kata sandi>           perkiraan kekuatan kata sandi (diproses lokal, TIDAK disimpan; sebaiknya jangan pakai sandi aslimu)
const { B } = require('../../lib/style'), K = require('../../lib/praktis')
const L = '━━━━━━━━━━━━━━━━━━━━'
const STOP = new Set('yang dan di ke dari ini itu untuk dengan pada adalah juga atau tidak akan sudah saya kamu kita mereka dia ada ke the of and to a in is for on it that with as be at by an are was this from not have'.split(' '))
const words = (t) => (String(t).toLowerCase().match(/[\p{L}\p{N}']+/gu) || [])
function stats(t) {
  const w = words(t), sent = (String(t).match(/[^.!?\n]+[.!?]*/g) || []).filter(s => s.trim()).length, para = String(t).split(/\n\s*\n/).filter(s => s.trim()).length
  const freq = {}; for (const x of w) if (x.length > 2 && !STOP.has(x) && !/^\d+$/.test(x)) freq[x] = (freq[x] || 0) + 1
  const top = Object.entries(freq).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 5)
  return { chars: String(t).length, nospace: String(t).replace(/\s/g, '').length, words: w.length, uniq: new Set(w).size, sent, para, top, min: w.length / 200 }
}
function lev(a, b) {
  if (a.length > b.length) [a, b] = [b, a]; let prev = Array.from({ length: a.length + 1 }, (_, i) => i)
  for (let j = 1; j <= b.length; j++) { const cur = [j]; for (let i = 1; i <= a.length; i++) cur[i] = Math.min(prev[i] + 1, cur[i - 1] + 1, prev[i - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur }
  return prev[a.length]
}
function similarity(a, b) {
  const x = String(a).toLowerCase().replace(/\s+/g, ' ').trim(), y = String(b).toLowerCase().replace(/\s+/g, ' ').trim()
  if (!x && !y) return { char: 100, word: 100 }
  const char = x.length * y.length > 4e6 ? 0 : Math.round((1 - lev(x, y) / Math.max(x.length, y.length)) * 100)
  const A = new Set(words(x)), Bw = new Set(words(y)), inter = [...A].filter(v => Bw.has(v)).length, uni = new Set([...A, ...Bw]).size
  return { char, word: uni ? Math.round(inter / uni * 100) : 100, onlyA: [...A].filter(v => !Bw.has(v)).slice(0, 8), onlyB: [...Bw].filter(v => !A.has(v)).slice(0, 8) }
}
const COMMON = ['password', 'qwerty', '123456', '12345678', 'iloveyou', 'admin', 'letmein', 'welcome', 'abc123', 'kucing', 'sayang', 'bismillah', 'rahasia', 'indonesia', 'anjing']
function passStrength(p) {
  let pool = 0; if (/[a-z]/.test(p)) pool += 26; if (/[A-Z]/.test(p)) pool += 26; if (/\d/.test(p)) pool += 10; if (/[^A-Za-z0-9]/.test(p)) pool += 33
  let bits = p.length * Math.log2(pool || 1); const notes = []
  const low = p.toLowerCase()
  const core = low.replace(/[^a-z]/g, '')
  if (COMMON.some(c => low === c || core === c || new RegExp('^' + c + '\\d*$').test(low))) { bits = Math.min(bits, 20); notes.push('sandi ini sangat umum dipakai') }
  else if (COMMON.some(c => low.includes(c))) { bits -= 12; notes.push('mengandung kata umum, hindari kata kamus yang mudah ditebak') }
  if (/(.)\1{2,}/.test(p)) { bits -= 8; notes.push('ada karakter berulang') }
  if (/(0123|1234|2345|3456|4567|5678|6789|abcd|bcde|cdef|qwer|asdf|zxcv)/i.test(p)) { bits -= 10; notes.push('ada urutan mudah ditebak') }
  if (p.length < 8) notes.push('terlalu pendek (minimal 12 disarankan)')
  if (!/[A-Z]/.test(p) || !/[a-z]/.test(p)) notes.push('campurkan huruf besar & kecil')
  if (!/\d/.test(p)) notes.push('tambahkan angka'); if (!/[^A-Za-z0-9]/.test(p)) notes.push('tambahkan simbol')
  bits = Math.max(0, Math.round(bits))
  const lvl = bits < 28 ? ['SANGAT LEMAH', 1] : bits < 40 ? ['LEMAH', 2] : bits < 60 ? ['SEDANG', 3] : bits < 80 ? ['KUAT', 4] : ['SANGAT KUAT', 5]
  const secs = Math.pow(2, bits) / 1e10   // asumsi 10 miliar tebakan/detik (serangan offline)
  const crack = secs < 1 ? 'seketika' : secs < 60 ? Math.round(secs) + ' detik' : secs < 3600 ? Math.round(secs / 60) + ' menit' : secs < 86400 ? Math.round(secs / 3600) + ' jam' : secs < 3.15e7 ? Math.round(secs / 86400) + ' hari' : secs < 3.15e9 ? Math.round(secs / 3.15e7) + ' tahun' : 'jutaan tahun lebih'
  return { bits, lvl: lvl[0], n: lvl[1], crack, notes }
}
module.exports = {
  name: 'teksinfo', alias: ['analisisteks', 'infoteks', 'bandingteks', 'samateks', 'cekpass', 'cekpassword', 'cekkatasandi'], category: 'tools', cmds: ['teksinfo', 'bandingteks', 'cekpass'], noLimit: true,
  desc: 'Analisis teks: .teksinfo <teks> • .bandingteks A | B • .cekpass <sandi>',
  run: async ({ m, command, text, prefix, reply }) => {
    const quoted = K.quotedText(m)
    if (['cekpass', 'cekpassword', 'cekkatasandi'].includes(command)) {
      const p = String(text || '').trim(); if (!p) return reply(`${B('CEK SANDI')}\nContoh: ${prefix}cekpass Biru#Laut_Senja_2026\n_Dihitung lokal & tidak disimpan. Jangan kirim sandi aslimu di grup; hapus pesannya setelah dicek._`)
      const r = passStrength(p.slice(0, 128))
      return reply(`${B('KEKUATAN SANDI')}\n${L}\nPanjang : ${p.length} karakter\nKekuatan: *${r.lvl}*  ${'█'.repeat(r.n * 2)}${'░'.repeat(10 - r.n * 2)}\nEntropi : ±${r.bits} bit\nTebak offline: ${r.crack}\n${r.notes.length ? '\nSaran:\n' + r.notes.map(n => '· ' + n).join('\n') : '\n✦ Tidak ada kelemahan jelas.'}\n\n_Tips: frasa sandi panjang (4 kata acak) lebih kuat dan mudah diingat._`)
    }
    if (['bandingteks', 'samateks'].includes(command)) {
      let a, b; const parts = String(text || '').split('|')
      if (parts.length >= 2) { a = parts[0]; b = parts.slice(1).join('|') } else if (quoted && text) { a = quoted; b = text }
      if (!a || !b || !a.trim() || !b.trim()) return reply(`${B('BANDING TEKS')}\n${prefix}bandingteks teks pertama | teks kedua\natau reply sebuah pesan lalu ${prefix}bandingteks <teks pembanding>`)
      const r = similarity(a.slice(0, 2000), b.slice(0, 2000))
      return reply(`${B('KEMIRIPAN TEKS')}\n${L}\nKemiripan karakter : *${r.char}%*\nKemiripan kata     : *${r.word}%*\n${r.onlyA.length ? '\nHanya di A: ' + r.onlyA.join(', ') : ''}${r.onlyB.length ? '\nHanya di B: ' + r.onlyB.join(', ') : ''}`)
    }
    const t = (text || quoted || '').trim(); if (!t) return reply(`${B('STATISTIK TEKS')}\n${prefix}teksinfo <teks>\natau reply sebuah pesan lalu ${prefix}teksinfo`)
    const s = stats(t), mnt = s.min < 1 ? Math.max(1, Math.round(s.min * 60)) + ' detik' : s.min.toFixed(1) + ' menit'
    return reply(`${B('STATISTIK TEKS')}\n${L}\nKarakter : ${s.chars} (${s.nospace} tanpa spasi)\nKata     : *${s.words}* (${s.uniq} unik)\nKalimat  : ${s.sent}\nParagraf : ${s.para}\nWaktu baca : ±${mnt}\n${s.top.length ? '\nKata terbanyak:\n' + s.top.map(([w, n]) => `· ${w} ×${n}`).join('\n') : ''}`)
  },
}
module.exports._t = { stats, similarity, passStrength }
