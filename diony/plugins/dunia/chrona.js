/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// CHRONA — Penjaga Kalender: tanggal (kartu canvas), libur, hitung hari, umur
const D = require('../../lib/daily'), NU = require('../../lib/npcutil'), P = require('../../lib/profiledb')
const card = require('../../lib/daycard')
const MON = { jan: 1, januari: 1, feb: 2, februari: 2, mar: 3, maret: 3, apr: 4, april: 4, mei: 5, jun: 6, juni: 6, jul: 7, juli: 7, agu: 8, agt: 8, agustus: 8, sep: 9, sept: 9, september: 9, okt: 10, oktober: 10, nov: 11, november: 11, des: 12, desember: 12 }
const dim = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate()
const rel = (n) => n === 0 ? 'hari ini' : n === 1 ? 'besok' : n === -1 ? 'kemarin' : n > 0 ? `${n} hari lagi` : `${-n} hari lalu`
const span = (n) => { n = Math.abs(n); const w = Math.floor(n / 7), d = n % 7; return n >= 7 ? `${n} hari (${w} minggu${d ? ' ' + d + ' hari' : ''})` : `${n} hari` }
function workdays(a, b) { let c = 0, s = a, e = b; if (diffSign(a, b) < 0) [s, e] = [b, a]; for (let n = D.diffDays(s, e), i = 1; i <= n; i++) { const x = D.addDays(s, i); if (D.isWorkday(x)) c++ } return c }
const diffSign = (a, b) => Math.sign(D.diffDays(a, b))
const withDow = (o) => ({ ...o, dow: D.dowOf(o.y, o.m, o.d) })
const info = (o) => { const h = D.hijri(o), w = D.weton(o); return `${D.fmtDate(withDow(o))}\n${h.text} • ${w.hari} ${w.pasaran} (neptu ${w.neptu})` }

function age(b, t) {
  let y = t.y - b.y, m = t.m - b.m, d = t.d - b.d
  if (d < 0) { m--; d += dim(t.m === 1 ? t.y - 1 : t.y, t.m === 1 ? 12 : t.m - 1) }
  if (m < 0) { y--; m += 12 }
  return { y, m, d }
}

module.exports = {
  name: 'tanggal',
  alias: ['kalender', 'calendar', 'date', 'libur', 'harilibur', 'hitunghari'],   // countdown/selisih/tambahhari/umur/usia dimiliki plugin ekstra (countdown, umur) sejak versi lama; alias dobel dihapus v4.7.6
  category: 'dunia',
  cmds: ['tanggal', 'libur', 'hitunghari'],
  desc: 'Kalender bergambar, libur nasional, hitung hari, umur (Chrona)',
  run: async ({ sock, m, command, args, text, prefix, reply }) => {
    const jid = m.sender, t = D.now(), today = { y: t.y, m: t.m, d: t.d }
    const done = (body, n = 2) => reply(`${NU.head('chrona', jid)}\n\n${body}${NU.bump(jid, 'chrona', n)}`)

    // ── KALENDER (CANVAS) ──
    if (['tanggal', 'kalender', 'calendar', 'date'].includes(command)) {
      let y = t.y, mo = t.m
      for (const a of args.map(x => x.toLowerCase())) {
        let q
        if ((q = a.match(/^(\d{4})[-/](\d{1,2})$/))) { y = +q[1]; mo = +q[2] }
        else if (/^\d{4}$/.test(a)) y = +a
        else if (MON[a]) mo = MON[a]
        else if (/^\d{1,2}$/.test(a) && +a >= 1 && +a <= 12) mo = +a
        else if (a === 'depan' || a === 'next') { mo++; if (mo > 12) { mo = 1; y++ } }
        else if (a === 'lalu' || a === 'prev') { mo--; if (mo < 1) { mo = 12; y-- } }
      }
      if (mo < 1 || mo > 12 || y < 1900 || y > 2100) return reply(`Contoh: ${prefix}tanggal  |  ${prefix}tanggal maret 2027  |  ${prefix}tanggal 2027-08  |  ${prefix}tanggal depan`)
      const img = await card.calendarCard({ y, m: mo, today, botname: require('../../lib/settingsdb').get('botname') })
      const cur = y === t.y && mo === t.m, h = D.holidayOn(today), nx = D.nextHolidays(today, 1)[0]
      const cap = cur
        ? `${NU.head('chrona', jid)}\n\n${info(today)}\nMinggu ke-${D.isoWeek(today)} • hari ke-${D.dayOfYear(today)} dari ${D.isLeap(t.y) ? 366 : 365}\n${h ? `Hari ini: *${h.n}*\n` : ''}${nx && !h ? `Libur berikutnya: ${nx.n} (${rel(nx.in)})\n` : ''}\n_Hijriah perkiraan (±1 hari). Coba: ${prefix}tanggal maret 2027_`
        : `${NU.head('chrona', jid)}\n\nKalender ${D.MONTHS[mo - 1]} ${y}\n_Libur: ${prefix}libur  |  Hitung hari: ${prefix}hitunghari <tgl>_`
      await sock.sendMessage(m.chat, { image: img, caption: cap + NU.bump(jid, 'chrona', 2) }, { quoted: m }); return
    }

    // ── LIBUR ──
    if (['libur', 'harilibur'].includes(command)) {
      const a = (args[0] || '').toLowerCase(); let list, title
      if (/^\d{4}$/.test(a)) { list = D.HOLIDAYS.filter(h => h.d.startsWith(a)).map(h => ({ ...h, date: h.d, y: +h.d.slice(0, 4), m: +h.d.slice(5, 7), d: +h.d.slice(8), in: D.diffDays(today, { y: +h.d.slice(0, 4), m: +h.d.slice(5, 7), d: +h.d.slice(8) }) })); title = `Libur & cuti bersama ${a}` }
      else if (MON[a]) { const yr = +args[1] || t.y; list = D.HOLIDAYS.filter(h => h.d.startsWith(`${yr}-${D.pad(MON[a])}`)).map(h => ({ ...h, y: yr, m: MON[a], d: +h.d.slice(8), in: D.diffDays(today, { y: yr, m: MON[a], d: +h.d.slice(8) }) })); title = `Libur ${D.MONTHS[MON[a] - 1]} ${yr}` }
      else { list = D.nextHolidays(today, 7, 'all'); title = 'Libur mendatang' }
      if (!list.length) return done(`Belum ada data libur untuk itu. Data tersedia sampai ${D.HOL_LAST}.`)
      return done(`*${title.toUpperCase()}*\n\n` + list.map(h => `${h.t === 'libur' ? '🔴' : '🟠'} *${h.d} ${D.MONTHS[h.m - 1].slice(0, 3)} ${h.y}* (${D.DAYS[D.dowOf(h.y, h.m, h.d)]})\n    ${h.n}${h.in >= 0 ? ` — ${rel(h.in)}` : ''}`).join('\n') + `\n\n🔴 libur nasional  🟠 cuti bersama\n_Sumber: SKB 3 Menteri. Data sampai ${D.HOL_LAST}. Contoh: ${prefix}libur 2027 | ${prefix}libur agustus_`)
    }

    // ── HITUNG HARI ──
    if (['hitunghari', 'countdown', 'selisih'].includes(command)) {
      const a = D.takeDate(text, today); if (!a.date) return reply(`Contoh:\n${prefix}hitunghari 17-08-2027  (dari hari ini)\n${prefix}selisih 01-01-2026 31-12-2026  (dua tanggal)\nFormat: dd-mm-yyyy, yyyy-mm-dd, atau "17 agustus 2027".`)
      const b = D.takeDate(a.rest, today), from = b.date ? a.date : today, to = b.date || a.date, n = D.diffDays(from, to)
      const wd = workdays(from, to)
      return done(`*${b.date ? 'SELISIH TANGGAL' : 'HITUNG MUNDUR'}*\n\n${b.date ? `Dari: ${D.fmtDate(withDow(from))}\n` : ''}${b.date ? 'Ke  : ' : 'Tanggal: '}${D.fmtDate(withDow(to))}\n\n⏳ *${n === 0 ? 'Hari yang sama' : n > 0 ? span(n) + (b.date ? '' : ' lagi') : span(n) + (b.date ? ' sebelumnya' : ' yang lalu')}*\n💼 Hari kerja: ${wd} (tanpa Sabtu, Minggu, dan libur)\n\n${info(to)}`)
    }
    if (command === 'tambahhari') {
      const n = parseInt(args[0]); if (!Number.isFinite(n) || Math.abs(n) > 36500) return reply(`Contoh: ${prefix}tambahhari 100  |  ${prefix}tambahhari -30  |  ${prefix}tambahhari 45 17-08-2026`)
      const base = D.takeDate(args.slice(1).join(' '), today).date || today, r = D.addDays(base, n)
      return done(`*${n >= 0 ? '+' : ''}${n} hari dari ${D.fmtDate(withDow(base))}*\n\n➡️ ${info(r)}\n${D.holidayOn(r) ? `🔴 Bertepatan dengan: ${D.holidayOn(r).n}` : ''}`)
    }

    // ── UMUR ──
    if (['umur', 'usia'].includes(command)) {
      const b = D.takeDate(text, today).date || (P.get(jid).bday ? D.parseDate(P.get(jid).bday) : null)
      if (!b) return reply(`Contoh: ${prefix}umur 31-01-2000\nSimpan tanggal lahir supaya tak perlu mengetik lagi: ${prefix}setlahir 31-01-2000`)
      if (D.diffDays(b, today) < 0) return reply('Tanggal lahir itu ada di masa depan 😄')
      const a = age(b, today), total = D.diffDays(b, today)
      let nb = D.parseDate(`${b.d}-${b.m}-${t.y}`) || { y: t.y, m: 2, d: 28, dow: 0 }; if (D.diffDays(today, nb) < 0) nb = D.parseDate(`${b.d}-${b.m}-${t.y + 1}`) || { y: t.y + 1, m: 2, d: 28 }
      const z = D.zodiak(b), s = D.shio(b), w = D.weton(b), nd = D.diffDays(today, nb)
      return done(`*UMUR KAMU*\n\n🎂 Lahir: ${D.fmtDate(withDow(b))}\n📈 *${a.y} tahun ${a.m} bulan ${a.d} hari*\n🗓️ Sudah menjalani ${total.toLocaleString('id-ID')} hari (± ${Math.floor(total / 7).toLocaleString('id-ID')} minggu)\n🎉 Ulang tahun berikutnya: ${nd === 0 ? '*HARI INI! Selamat ulang tahun!*' : rel(nd)} (${D.fmtDate(withDow(nb))})\n\n✨ Zodiak ${z.name} • Shio ${s.name}${s.edge ? '*' : ''} • Weton ${w.hari} ${w.pasaran}${s.edge ? '\n_*lahir Jan–Feb: shio mengikuti Imlek, bisa berbeda_' : ''}`)
    }
  },
}
