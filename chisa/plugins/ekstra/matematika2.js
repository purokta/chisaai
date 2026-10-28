/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Kit hitung tambahan: .persen .statistik .kuadrat .romawi .basis
const { B } = require('../../lib/style'), { num } = require('../../lib/ekstra')
const f = (n) => Number.isInteger(n) ? n.toLocaleString('id-ID') : (Math.round(n * 1e6) / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 6 })
const ROM = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]
const toRom = (n) => { let s = ''; for (const [v, r] of ROM) while (n >= v) { s += r; n -= v } return s }
const fromRom = (s) => { let n = 0, i = 0; for (const [v, r] of ROM) while (s.startsWith(r, i)) { n += v; i += r.length } return i === s.length ? n : NaN }
const med = (s) => { const k = s.length, h = k >> 1; return k % 2 ? s[h] : (s[h - 1] + s[h]) / 2 }

const CMD = {
  persen: ({ args, p }) => {
    const [a, kw, b] = [num(args[0]), (args[1] || '').toLowerCase(), num(args[2])]
    if (!(Number.isFinite(a) && Number.isFinite(b))) return `${B('PERSEN')}\n┣ ${p}persen 20 dari 500    → 20% dari 500\n┣ ${p}persen 30 adalah 120  → 30 itu berapa persen dari 120\n┣ ${p}persen 50 jadi 75     → perubahan 50 ke 75\n┣ ${p}persen 100 naik 20    → 100 naik 20%\n┗ ${p}persen 100 turun 20   → 100 turun 20%`
    if (kw === 'dari') return `${f(a)}% dari ${f(b)} = *${f(a / 100 * b)}*`
    if (kw === 'adalah') return b === 0 ? '✕ Pembagi tidak boleh nol.' : `${f(a)} adalah *${f(a / b * 100)}%* dari ${f(b)}`
    if (kw === 'jadi') return a === 0 ? '✕ Nilai awal tidak boleh nol.' : `Dari ${f(a)} menjadi ${f(b)}: ${b >= a ? 'naik' : 'turun'} *${f(Math.abs((b - a) / a * 100))}%* (selisih ${f(b - a)})`
    if (kw === 'naik') return `${f(a)} naik ${f(b)}% = *${f(a * (1 + b / 100))}* (tambah ${f(a * b / 100)})`
    if (kw === 'turun') return `${f(a)} turun ${f(b)}% = *${f(a * (1 - b / 100))}* (kurang ${f(a * b / 100)})`
    return '✕ Kata kunci: dari, adalah, jadi, naik, turun.'
  },
  statistik: ({ text, p }) => {
    const v = text.split(/[\s,;]+/).filter(Boolean).map(num)
    if (v.length < 2 || v.some(x => !Number.isFinite(x))) return `${B('STATISTIK')}\nContoh: ${p}statistik 7 8 9 6 10 8\n_Minimal 2 angka, pisahkan spasi atau koma._`
    if (v.length > 500) return '✕ Maksimal 500 angka.'
    const s = [...v].sort((a, b) => a - b), n = v.length, sum = v.reduce((a, b) => a + b, 0), mean = sum / n
    const cnt = {}; for (const x of v) cnt[x] = (cnt[x] || 0) + 1; const mx = Math.max(...Object.values(cnt)), modus = Object.keys(cnt).filter(k => cnt[k] === mx)
    const ss = v.reduce((a, x) => a + (x - mean) ** 2, 0), lo = s.slice(0, n >> 1), hi = s.slice((n + 1) >> 1)
    return `${B('STATISTIK')} (${n} data)\n┣ Jumlah   : ${f(sum)}\n┣ Rata-rata: ${f(mean)}\n┣ Median   : ${f(med(s))}\n┣ Modus    : ${mx === 1 ? 'tidak ada' : modus.map(f).join(', ') + ` (${mx}x)`}\n┣ Min / Max: ${f(s[0])} / ${f(s[n - 1])}\n┣ Rentang  : ${f(s[n - 1] - s[0])}\n┣ Q1 / Q3  : ${f(med(lo))} / ${f(med(hi))}\n┣ Simpangan baku (populasi): ${f(Math.sqrt(ss / n))}\n┗ Simpangan baku (sampel)  : ${f(Math.sqrt(ss / (n - 1)))}`
  },
  kuadrat: ({ args, p }) => {
    const [a, b, c] = args.slice(0, 3).map(num)
    if (![a, b, c].every(Number.isFinite) || a === 0) return `${B('PERSAMAAN KUADRAT')}\nax² + bx + c = 0\nContoh: ${p}kuadrat 1 -5 6\n_a tidak boleh 0._`
    const D = b * b - 4 * a * c, vx = -b / (2 * a), vy = a * vx * vx + b * vx + c
    let t = `${B('PERSAMAAN KUADRAT')}\n${f(a)}x² ${b < 0 ? '-' : '+'} ${f(Math.abs(b))}x ${c < 0 ? '-' : '+'} ${f(Math.abs(c))} = 0\n\n┣ Diskriminan (D) : ${f(D)}\n`
    if (D > 0) t += `┣ x₁ = *${f((-b + Math.sqrt(D)) / (2 * a))}*\n┣ x₂ = *${f((-b - Math.sqrt(D)) / (2 * a))}*\n`
    else if (D === 0) t += `┣ x = *${f(vx)}* (akar kembar)\n`
    else t += `┣ x₁ = *${f(vx)} + ${f(Math.sqrt(-D) / (2 * Math.abs(a)))}i*\n┣ x₂ = *${f(vx)} - ${f(Math.sqrt(-D) / (2 * Math.abs(a)))}i*\n┣ (akar kompleks, tidak memotong sumbu x)\n`
    return t + `┗ Titik puncak: (${f(vx)}, ${f(vy)}) — parabola ${a > 0 ? 'membuka ke atas' : 'membuka ke bawah'}`
  },
  romawi: ({ args, p }) => {
    const a = (args[0] || '').toUpperCase()
    if (/^\d+$/.test(a)) { const n = +a; return n >= 1 && n <= 3999 ? `${n} = *${toRom(n)}*` : '✕ Rentang 1 - 3999.' }
    if (/^[IVXLCDM]+$/.test(a)) { const n = fromRom(a); return Number.isNaN(n) || toRom(n) !== a ? '✕ Angka romawi tidak valid.' : `${a} = *${n}*` }
    return `${B('ANGKA ROMAWI')}\nContoh: ${p}romawi 2026  atau  ${p}romawi MMXXVI`
  },
  basis: ({ args, p }) => {
    const [s, from, to] = [(args[0] || '').toLowerCase(), parseInt(args[1], 10), parseInt(args[2], 10)]
    if (!s || !(from >= 2 && from <= 36 && to >= 2 && to <= 36)) return `${B('KONVERSI BASIS')}\nFormat: ${p}basis <angka> <dari> <ke>\nContoh: ${p}basis 255 10 16  (desimal → heksa)\n       ${p}basis ff 16 2   (heksa → biner)\n_Basis 2-36, bilangan bulat._`
    const digits = '0123456789abcdefghijklmnopqrstuvwxyz'.slice(0, from)
    if (s.length > 40 || ![...s].every(c => digits.includes(c))) return `✕ "${s}" bukan bilangan basis ${from} yang valid.`
    let n = 0n; for (const c of s) n = n * BigInt(from) + BigInt(digits.indexOf(c))
    return `${s.toUpperCase()} (basis ${from}) = *${n.toString(to).toUpperCase()}* (basis ${to})\n_Desimal: ${n.toString()}_`
  },
}
module.exports = {
  name: 'persen', alias: ['statistik', 'stat2', 'kuadrat', 'romawi', 'basis', 'angkaromawi', 'rataan'], category: 'ekstra', noLimit: true, cmds: ['persen', 'statistik', 'kuadrat', 'romawi', 'basis'],
  desc: 'Kit hitung: .persen .statistik .kuadrat .romawi .basis',
  run: async ({ command, args, text, prefix, reply }) => {
    const map = { stat2: 'statistik', angkaromawi: 'romawi', rataan: 'statistik' }, k = map[command] || command
    return reply(CMD[k]({ args, text, p: prefix }))
  },
}
