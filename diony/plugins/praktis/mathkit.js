/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Kit matematika: prima, faktor, fpb, kpk, fibonacci, faktorial
const { B } = require('../../lib/style')
const gcd = (a, b) => { a = BigInt(a); b = BigInt(b); while (b) [a, b] = [b, a % b]; return a }
function factorize(n) { const f = new Map(); let x = n; for (let p = 2; p * p <= x; p += p === 2 ? 1 : 2) while (x % p === 0) { f.set(p, (f.get(p) || 0) + 1); x /= p } if (x > 1) f.set(x, (f.get(x) || 0) + 1); return f }
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹', sup = (n) => [...String(n)].map(d => SUP[d]).join('')
const CMDS = ['prima', 'faktor', 'fpb', 'kpk', 'fibonacci', 'faktorial']
module.exports = {
  name: 'mathkit', alias: CMDS, category: 'praktis', noLimit: true, cmds: CMDS,
  desc: 'Matematika: bilangan prima, faktorisasi, FPB, KPK, Fibonacci, faktorial',
  run: async ({ args, command, prefix, reply }) => {
    const nums = args.map(x => Number(x.replace(/[.,]/g, '')))
    const help = `✦ ${B('MATH KIT')}\n┣ ${prefix}prima 97\n┣ ${prefix}faktor 360\n┣ ${prefix}fpb 48 18\n┣ ${prefix}kpk 4 6 10\n┣ ${prefix}fibonacci 15\n┗ ${prefix}faktorial 10`
    if (!CMDS.includes(command) || !nums.length || nums.some(x => !Number.isSafeInteger(x) || x < 0)) return reply(help)
    const n = nums[0]
    if (command === 'prima') {
      if (n > 1e12) return reply('✕ Maksimal 1.000.000.000.000.')
      const f = factorize(n), prime = n > 1 && f.size === 1 && [...f.values()][0] === 1
      return reply(prime ? `✦ *${n.toLocaleString('id-ID')}* adalah bilangan *prima*.` : `✕ *${n.toLocaleString('id-ID')}* bukan bilangan prima.\n${B('Pembagi terkecil')} : ${n < 2 ? '-' : Math.min(...f.keys())}`)
    }
    if (command === 'faktor') {
      if (n < 2 || n > 1e12) return reply('✕ Masukkan angka 2 – 1.000.000.000.000.')
      const str = [...factorize(n)].map(([b, e]) => e > 1 ? `${b}${sup(e)}` : `${b}`).join(' × '), d = []
      for (let i = 1; i * i <= n; i++) if (n % i === 0) { d.push(i); if (i !== n / i) d.push(n / i) }
      d.sort((a, b) => a - b)
      return reply(`✦ ${B('FAKTORISASI PRIMA')}\n\n${n.toLocaleString('id-ID')} = *${str}*\n\n${B('Jumlah pembagi')} : ${d.length}\n${d.length <= 40 ? d.join(', ') : d.slice(0, 40).join(', ') + ', …'}`)
    }
    if (command === 'fpb' || command === 'kpk') {
      if (nums.length < 2 || nums.length > 10 || nums.some(x => x === 0)) return reply(`✕ Beri 2–10 bilangan bulat positif.\nContoh: ${prefix}${command} 12 18`)
      let g = BigInt(nums[0]), l = BigInt(nums[0]); for (const x of nums.slice(1)) { g = gcd(g, x); l = l / gcd(l, x) * BigInt(x) }
      return reply(`✦ *${command.toUpperCase()}* dari ${nums.join(', ')} = *${command === 'fpb' ? g : l}*`)
    }
    if (command === 'fibonacci') {
      if (n < 1 || n > 300) return reply('✕ Pilih jumlah suku 1 – 300.')
      let x = 0n, y = 1n; const seq = []; for (let i = 0; i < n; i++) { seq.push(x);[x, y] = [y, x + y] }
      return reply(`✦ ${B('FIBONACCI')} (${n} suku)\n\n${n <= 40 ? seq.join(', ') : seq.slice(0, 20).join(', ') + ', …'}\n\nSuku ke-${n}: *${seq[n - 1]}*`)
    }
    if (n > 1000) return reply('✕ Maksimal 1000.')
    let r = 1n; for (let i = 2n; i <= BigInt(n); i++) r *= i
    const s = r.toString()
    return reply(`✦ *${n}!* = ${s.length > 120 ? s.slice(0, 60) + '…' + s.slice(-30) : s}\n\n${s.length} digit${s.length > 120 ? ' (ditampilkan sebagian)' : ''}`)
  },
}
