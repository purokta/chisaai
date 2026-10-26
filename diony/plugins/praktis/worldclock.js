/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Jam dunia offline (Intl): .jam [kota]   |   .konversijam 15:00 jakarta tokyo
const { B } = require('../../lib/style')
const Z = { jakarta: 'Asia/Jakarta', wib: 'Asia/Jakarta', makassar: 'Asia/Makassar', wita: 'Asia/Makassar', jayapura: 'Asia/Jayapura', wit: 'Asia/Jayapura', singapura: 'Asia/Singapore', singapore: 'Asia/Singapore', kualalumpur: 'Asia/Kuala_Lumpur', bangkok: 'Asia/Bangkok', manila: 'Asia/Manila', tokyo: 'Asia/Tokyo', jepang: 'Asia/Tokyo', seoul: 'Asia/Seoul', beijing: 'Asia/Shanghai', hongkong: 'Asia/Hong_Kong', delhi: 'Asia/Kolkata', dubai: 'Asia/Dubai', mekah: 'Asia/Riyadh', riyadh: 'Asia/Riyadh', istanbul: 'Europe/Istanbul', kairo: 'Africa/Cairo', moskow: 'Europe/Moscow', london: 'Europe/London', paris: 'Europe/Paris', berlin: 'Europe/Berlin', amsterdam: 'Europe/Amsterdam', newyork: 'America/New_York', chicago: 'America/Chicago', losangeles: 'America/Los_Angeles', la: 'America/Los_Angeles', sydney: 'Australia/Sydney', auckland: 'Pacific/Auckland', utc: 'UTC', gmt: 'UTC' }
const DEFAULT = ['jakarta', 'makassar', 'jayapura', 'singapura', 'tokyo', 'dubai', 'mekah', 'london', 'paris', 'newyork', 'losangeles', 'sydney']
const zone = (s) => Z[String(s || '').toLowerCase().replace(/[\s_-]/g, '')]
const fmt = (d, tz) => new Intl.DateTimeFormat('id-ID', { timeZone: tz, weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).format(d).replace(/\./g, ':')
const gmt = (d, tz) => { const o = offset(tz, d) / 60000, s = o < 0 ? '-' : '+', a = Math.abs(o); return `UTC${s}${Math.floor(a / 60)}${a % 60 ? ':' + String(a % 60).padStart(2, '0') : ''}` }
function offset(tz, d) {   // ms: waktu lokal di zona - UTC
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(d).map(x => [x.type, x.value]))
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - Math.floor(+d / 1000) * 1000
}
function atLocal(tz, h, mi) {   // instan saat jam dinding di zona = h:mi (hari ini menurut zona itu)
  const now = new Date(), p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now).map(x => [x.type, x.value]))
  let t = Date.UTC(+p.year, +p.month - 1, +p.day, h, mi); t -= offset(tz, new Date(t)); t = Date.UTC(+p.year, +p.month - 1, +p.day, h, mi) - offset(tz, new Date(t))
  return new Date(t)
}

module.exports = {
  name: 'jam', alias: ['worldclock', 'jamdunia', 'konversijam', 'zonawaktu'], category: 'dunia', noLimit: true, cmds: ['jam', 'konversijam'],
  desc: 'Jam dunia (.jam [kota]) dan konversi jam antar kota (.konversijam 15:00 jakarta tokyo)',
  run: async ({ command, args, prefix, reply }) => {
    if (command === 'konversijam') {
      const mt = (args[0] || '').match(/^(\d{1,2})[:.](\d{2})$/), from = zone(args[1]), to = args.slice(2).map(zone)
      if (!mt || +mt[1] > 23 || +mt[2] > 59 || !from) return reply(`Format: ${prefix}konversijam <jam> <kota asal> [kota tujuan...]\nContoh: ${prefix}konversijam 15:00 jakarta tokyo london\nKota: ${Object.keys(Z).join(', ')}`)
      const d = atLocal(from, +mt[1], +mt[2]), list = to.filter(Boolean).length ? args.slice(2).filter(zone) : DEFAULT.slice(0, 6)
      return reply(`${B('KONVERSI JAM')}\n${args[0]} di ${args[1]} (${gmt(d, from)}) =\n` + list.map(c => `• ${c.padEnd(11)} ${fmt(d, zone(c))}  ${gmt(d, zone(c))}`).join('\n'))
    }
    const now = new Date(), q = args.filter(zone)
    if (args.length && !q.length) return reply(`Kota tidak dikenal.\nPilihan: ${Object.keys(Z).join(', ')}`)
    const list = q.length ? q : DEFAULT
    return reply(`${B('JAM DUNIA')}\n━━━━━━━━━━━━━━━━━━━━\n` + list.map(c => `• ${c.padEnd(11)} ${fmt(now, zone(c))}  ${gmt(now, zone(c))}`).join('\n'))
  },
}
