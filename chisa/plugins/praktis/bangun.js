/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// RUMUS BANGUN: .luas  .keliling  .volume  → pilih bangun, isi ukuran, bot hitung + tampilkan rumusnya.
//   contoh: .luas lingkaran 7   •   .luas trapesium 6 10 4   •   .keliling persegipanjang 8 5   •   .volume tabung 7 10
const { B } = require('../../lib/style')
const P = Math.PI
const T = {
  luas: {
    persegi: [['sisi'], (s) => s * s, 's × s'], persegipanjang: [['panjang', 'lebar'], (p, l) => p * l, 'p × l'],
    segitiga: [['alas', 'tinggi'], (a, t) => a * t / 2, '½ × a × t'], lingkaran: [['jari-jari'], (r) => P * r * r, 'π × r²'],
    trapesium: [['sisi sejajar a', 'sisi sejajar b', 'tinggi'], (a, b, t) => (a + b) * t / 2, '½ × (a+b) × t'], jajargenjang: [['alas', 'tinggi'], (a, t) => a * t, 'a × t'],
    belahketupat: [['diagonal 1', 'diagonal 2'], (d, e) => d * e / 2, '½ × d₁ × d₂'], layanglayang: [['diagonal 1', 'diagonal 2'], (d, e) => d * e / 2, '½ × d₁ × d₂'],
  },
  keliling: {
    persegi: [['sisi'], (s) => 4 * s, '4 × s'], persegipanjang: [['panjang', 'lebar'], (p, l) => 2 * (p + l), '2 × (p+l)'],
    segitiga: [['sisi a', 'sisi b', 'sisi c'], (a, b, c) => a + b + c, 'a + b + c'], lingkaran: [['jari-jari'], (r) => 2 * P * r, '2 × π × r'],
  },
  volume: {
    kubus: [['sisi'], (s) => s ** 3, 's³'], balok: [['panjang', 'lebar', 'tinggi'], (p, l, t) => p * l * t, 'p × l × t'],
    tabung: [['jari-jari', 'tinggi'], (r, t) => P * r * r * t, 'π × r² × t'], kerucut: [['jari-jari', 'tinggi'], (r, t) => P * r * r * t / 3, '⅓ × π × r² × t'],
    bola: [['jari-jari'], (r) => 4 / 3 * P * r ** 3, '4/3 × π × r³'], limas: [['luas alas', 'tinggi'], (la, t) => la * t / 3, '⅓ × luas alas × t'],
  },
}
const SHAPE_ALIAS = { kotak: 'persegi', bujursangkar: 'persegi', persegipanjang: 'persegipanjang', pp: 'persegipanjang', 'persegi-panjang': 'persegipanjang', bulat: 'lingkaran', circle: 'lingkaran', kubuss: 'kubus', balokk: 'balok', silinder: 'tabung', kerucutt: 'kerucut', sphere: 'bola', layang: 'layanglayang', 'layang-layang': 'layanglayang', rhombus: 'belahketupat', 'belah-ketupat': 'belahketupat' }
const f = (n) => String(Number(n.toFixed(4)))

module.exports = {
  name: 'luas', alias: ['keliling', 'volume', 'bangun', 'rumusbangun'], category: 'praktis', cmds: ['luas', 'keliling', 'volume'], noLimit: true,
  desc: 'Hitung luas, keliling, volume bangun datar & ruang beserta rumusnya',
  run: async ({ reply, args, prefix, command }) => {
    const kind = ['luas', 'keliling', 'volume'].includes(command) ? command : null
    const table = kind ? T[kind] : null
    const list = (k) => `*${k}*: ${Object.keys(T[k]).join(', ')}`
    const help = `${B('RUMUS BANGUN')}\n${kind ? list(kind) : [list('luas'), list('keliling'), list('volume')].join('\n')}\n\nContoh:\n• ${prefix}luas lingkaran 7\n• ${prefix}luas trapesium 6 10 4\n• ${prefix}keliling persegipanjang 8 5\n• ${prefix}volume tabung 7 10`
    if (!table) return reply(help)
    let shape = String(args[0] || '').toLowerCase().replace(/\s+/g, ''); shape = Object.prototype.hasOwnProperty.call(SHAPE_ALIAS, shape) ? SHAPE_ALIAS[shape] : shape
    const row = Object.prototype.hasOwnProperty.call(table, shape) ? table[shape] : null; if (!row) return reply(args[0] ? `Bangun "${args[0]}" tidak ada untuk ${kind}.\n\n${help}` : help)
    const nums = args.slice(1).map(x => Number(String(x).replace(',', '.')))
    if (nums.length < row[0].length || nums.slice(0, row[0].length).some(n => !Number.isFinite(n) || n < 0)) return reply(`${shape} butuh ${row[0].length} ukuran: ${row[0].join(', ')}\nContoh: ${prefix}${kind} ${shape} ${row[0].map((_, i) => 5 + i * 2).join(' ')}`)
    const v = nums.slice(0, row[0].length)
    return reply(`${B(kind.toUpperCase() + ' ' + shape.toUpperCase())}\n${row[0].map((n, i) => `${n} = ${f(v[i])}`).join('\n')}\n\nRumus : ${row[2]}\nHasil : *${f(row[1](...v))}*${kind === 'luas' ? ' satuan²' : kind === 'volume' ? ' satuan³' : ' satuan'}`)
  },
}
