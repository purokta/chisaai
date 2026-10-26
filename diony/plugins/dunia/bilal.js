/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// PAK BILAL — Penjaga Waktu Salat: jadwal salat & arah kiblat (hitung astronomi offline, metode Kemenag RI)
const D = require('../../lib/daily'), NU = require('../../lib/npcutil'), P = require('../../lib/profiledb'), G = require('../../lib/geo')

module.exports = {
  name: 'salat',
  alias: ['sholat', 'shalat', 'jadwalsalat', 'jadwalsholat', 'waktusalat', 'kiblat', 'qibla'],
  category: 'dunia',
  cmds: ['salat', 'kiblat'],
  desc: 'Jadwal salat & arah kiblat sesuai kota (Pak Bilal)',
  run: async ({ m, command, text, prefix, reply }) => {
    const jid = m.sender, q = text.trim() || P.get(jid).city
    if (!q) return reply(`${NU.head('bilal', jid)}\n\nSebutkan kotamu dulu ya.\nContoh: ${prefix}salat bandung\nSimpan kota default: ${prefix}setkota <kota>`)
    const c = await G.resolve(q)
    if (!c) return reply(`${NU.head('bilal', jid)}\n\nKota "${q}" tidak ditemukan. Coba nama kota/kabupaten lain, mis. ${prefix}salat surabaya`)

    if (['kiblat', 'qibla'].includes(command)) {
      const k = D.qibla(c.lat, c.lng)
      return reply(`${NU.head('bilal', jid)}\n\n*ARAH KIBLAT — ${c.name}*\n\n🧭 *${k.deg.toFixed(1)}°* dari Utara sejati (searah jarum jam)\n📍 Arah umum: ${k.dir}\n📏 Jarak ke Ka'bah: ± ${k.km.toLocaleString('id-ID')} km\n\nCara: buka kompas HP, hadapkan ke ${k.deg.toFixed(0)}°. Jauhkan dari logam/magnet, dan kalibrasi kompas dulu. Untuk akurasi tinggi, cocokkan dengan arah kiblat masjid terdekat.${NU.bump(jid, 'bilal', 2)}`)
    }
    const t = G.nowAt(c.tz), o = { y: t.y, m: t.m, d: t.d }, pt = D.prayerTimes(o, c.lat, c.lng, c.tz)
    const rows = [['Imsak', 'imsak'], ['Subuh', 'subuh'], ['Terbit', 'terbit'], ['Dhuha', 'dhuha'], ['Dzuhur', 'dzuhur'], ['Ashar', 'ashar'], ['Maghrib', 'maghrib'], ['Isya', 'isya']]
    const nowH = t.hh + t.mm / 60 + t.ss / 3600, wajib = ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya']
    let nxt = wajib.find(k => pt[k] > nowH), mins
    if (nxt) mins = (pt[nxt] - nowH) * 60; else { nxt = 'subuh'; mins = (24 - nowH + pt.subuh) * 60 }
    const zone = c.tz === 7 ? 'WIB' : c.tz === 8 ? 'WITA' : c.tz === 9 ? 'WIT' : `UTC${c.tz >= 0 ? '+' : ''}${c.tz}`
    const label = (k) => rows.find(r => r[1] === k)[0]
    const hj = D.hijri(o)
    return reply(`${NU.head('bilal', jid)}\n\n*JADWAL SALAT — ${c.name}*\n${D.fmtDate({ ...o, dow: t.dow })}\n${hj.text} (perkiraan)\n\n` + rows.map(([n, k]) => `${wajib.includes(k) ? '🕌' : '▫️'} ${n.padEnd(8)} *${D.hm(pt[k])}* ${zone}${k === nxt ? '  ⬅️ berikutnya' : ''}`).join('\n') + `\n\n⏳ ${label(nxt)} dalam *${D.dur(mins)}*\n\n_Perhitungan astronomi, metode Kemenag RI (Subuh 20°, Isya 18°, ihtiyath +2 menit). Bisa berbeda 1–2 menit dari jadwal resmi masjid/Kemenag; selalu utamakan jadwal setempat._${NU.bump(jid, 'bilal', 2)}`)
  },
}
