/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .konv <angka> <dari> <ke>   →  panjang, berat, volume, luas, kecepatan, data, waktu, suhu
//   contoh: .konv 100 km mil   •   .konv 36.6 c f   •   .konv 5 gb mb   •   .konv 10 kg   (.konversi = kartu live)  (tanpa tujuan = tampil semua satuan sejenis)
const { B } = require('../../lib/style')
const G = {
  panjang: { mm: 0.001, cm: 0.01, m: 1, km: 1000, inch: 0.0254, ft: 0.3048, yd: 0.9144, mil: 1609.344, nmi: 1852 },
  berat: { mg: 1e-6, g: 0.001, kg: 1, kuintal: 100, ton: 1000, oz: 0.028349523125, lb: 0.45359237 },
  volume: { ml: 0.001, l: 1, m3: 1000, gal: 3.785411784, cup: 0.2365882365, sdm: 0.0147867648, sdt: 0.00492892159 },
  luas: { cm2: 1e-4, m2: 1, km2: 1e6, ha: 1e4, acre: 4046.8564224, ft2: 0.09290304 },
  kecepatan: { 'm/s': 1, 'km/jam': 1 / 3.6, mph: 0.44704, knot: 0.514444 },
  data: { bit: 1 / 8, byte: 1, kb: 1024, mb: 1024 ** 2, gb: 1024 ** 3, tb: 1024 ** 4 },
  waktu: { detik: 1, menit: 60, jam: 3600, hari: 86400, minggu: 604800, bulan: 2629800, tahun: 31557600 },
}
const ALIAS = { meter: 'm', kilometer: 'km', milimeter: 'mm', centimeter: 'cm', inci: 'inch', in: 'inch', feet: 'ft', kaki: 'ft', yard: 'yd', mile: 'mil', mi: 'mil', miles: 'mil',
  gram: 'g', kilogram: 'kg', miligram: 'mg', pound: 'lb', lbs: 'lb', ons: 'oz', liter: 'l', litre: 'l', mililiter: 'ml', gallon: 'gal', sendok: 'sdm', 'm²': 'm2', 'km²': 'km2', hektar: 'ha',
  'km/h': 'km/jam', kmh: 'km/jam', kph: 'km/jam', kpj: 'km/jam', mps: 'm/s', kb: 'kb', kilobyte: 'kb', megabyte: 'mb', gigabyte: 'gb', terabyte: 'tb', sec: 'detik', s: 'detik', detik: 'detik', min: 'menit', mnt: 'menit', hour: 'jam', h: 'jam', day: 'hari', d: 'hari', week: 'minggu', month: 'bulan', year: 'tahun', thn: 'tahun',
  celsius: 'c', '°c': 'c', fahrenheit: 'f', '°f': 'f', kelvin: 'k', reamur: 'r', '°r': 'r' }
const TEMP = ['c', 'f', 'k', 'r']
const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k)
const norm = (u) => { u = String(u || '').toLowerCase().trim(); return own(ALIAS, u) ? ALIAS[u] : u }
const groupOf = (u) => TEMP.includes(u) ? 'suhu' : Object.keys(G).find(g => own(G[g], u))
const toC = (v, u) => u === 'c' ? v : u === 'f' ? (v - 32) * 5 / 9 : u === 'k' ? v - 273.15 : v * 5 / 4
const fromC = (c, u) => u === 'c' ? c : u === 'f' ? c * 9 / 5 + 32 : u === 'k' ? c + 273.15 : c * 4 / 5
const num = (n) => { if (!Number.isFinite(n)) return '∞'; const a = Math.abs(n); if (a !== 0 && (a >= 1e12 || a < 1e-6)) return n.toExponential(4); return String(Number(n.toPrecision(10))).replace(/(\.\d*?[1-9])0+$/, '$1'); }
const conv = (v, f, t, g) => g === 'suhu' ? fromC(toC(v, f), t) : v * G[g][f] / G[g][t]

module.exports = {
  name: 'konv', alias: ['convert', 'suhu', 'ubahsatuan', 'konvsatuan'], category: 'praktis', cmds: ['konv'], noLimit: true,
  desc: 'Konversi satuan: panjang, berat, volume, luas, kecepatan, data, waktu, suhu',
  run: async ({ reply, args, prefix, command }) => {
    let a = args.filter(w => !/^(ke|to|ke->|->|=)$/i.test(w))
    // dukung "100km" (angka menempel di satuan)
    if (a[0] && /^-?[\d.,]+[a-z°/²]+$/i.test(a[0])) { const mm = a[0].match(/^(-?[\d.,]+)(.+)$/); a = [mm[1], mm[2], ...a.slice(1)] }
    const help = `${B('KONVERSI SATUAN')}\nContoh:\n• ${prefix}konv 100 km mil\n• ${prefix}konv 36.6 c f\n• ${prefix}konv 5 gb mb\n• ${prefix}konv 10 kg  (lihat semua satuan berat)\n\nKelompok: ${[...Object.keys(G), 'suhu'].join(', ')}\nSatuan berat: ${Object.keys(G.berat).join(' ')}\nSatuan panjang: ${Object.keys(G.panjang).join(' ')}`
    if (a.length < 2) return reply(help)
    const v = Number(String(a[0]).replace(',', '.')); if (!Number.isFinite(v)) return reply(`Angka tidak valid.\n\n${help}`)
    const f = norm(a[1]), g = groupOf(f); if (!g) return reply(`Satuan "${a[1]}" tidak dikenal.\n\n${help}`)
    if (!a[2]) {
      const units = g === 'suhu' ? TEMP : Object.keys(G[g])
      return reply(`${B(g.toUpperCase())}\n${num(v)} ${f} =\n` + units.filter(u => u !== f).map(u => `• ${num(conv(v, f, u, g))} ${u}`).join('\n'))
    }
    const t = norm(a[2]); if (groupOf(t) !== g) return reply(g === 'suhu' || groupOf(t) ? `Satuan tidak sejenis: ${f} (${g}) tidak bisa diubah ke ${t} (${groupOf(t) || '?'}).` : `Satuan tujuan "${a[2]}" tidak dikenal.\n\n${help}`)
    return reply(`${B('KONVERSI')} (${g})\n${num(v)} ${f} = *${num(conv(v, f, t, g))} ${t}*`)
  },
}
