/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Alat teks cepat (semuanya offline). Teks bisa ditulis setelah perintah atau di-reply.
//   .enc64 / .dec64   base64          .hash [md5|sha1|sha256|sha512] <teks>
//   .pass [panjang]   kata sandi acak  .uuid
//   .balik  .besar  .kecil  .kapital   .rot13
//   .morse  .demorse  .biner  .debiner
//   .hitungkata       statistik teks
const crypto = require('crypto'), ST = require('../../lib/style')
const LINE = '━━━━━━━━━━━━━━━━━━━━'
const H = (t) => `${ST.B(t)}\n${LINE}\n`

const MORSE = { a: '.-', b: '-...', c: '-.-.', d: '-..', e: '.', f: '..-.', g: '--.', h: '....', i: '..', j: '.---', k: '-.-', l: '.-..', m: '--', n: '-.', o: '---', p: '.--.', q: '--.-', r: '.-.', s: '...', t: '-', u: '..-', v: '...-', w: '.--', x: '-..-', y: '-.--', z: '--..', 0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.', '.': '.-.-.-', ',': '--..--', '?': '..--..', '!': '-.-.--', '/': '-..-.', '-': '-....-', ':': '---...', '@': '.--.-.' }
const UNMORSE = Object.fromEntries(Object.entries(MORSE).map(([k, v]) => [v, k]))
const toMorse = (t) => String(t).toLowerCase().split(/\s+/).filter(Boolean).map(w => Array.from(w).map(c => MORSE[c]).filter(Boolean).join(' ')).join(' / ')
const fromMorse = (t) => String(t).trim().split(/\s*[\/|]\s*|\s{3,}/).map(w => w.trim().split(/\s+/).map(c => UNMORSE[c] || '?').join('')).join(' ')
const toBin = (t) => Array.from(Buffer.from(String(t), 'utf8')).map(b => b.toString(2).padStart(8, '0')).join(' ')
const fromBin = (t) => { const bytes = String(t).replace(/[^01]/g, '').match(/.{8}/g); if (!bytes) throw new Error('biner harus berkelompok 8 digit (0 dan 1)'); return Buffer.from(bytes.map(b => parseInt(b, 2))).toString('utf8') }
const rot13 = (t) => String(t).replace(/[a-z]/gi, c => String.fromCharCode((c <= 'Z' ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26))
const kapital = (t) => String(t).toLowerCase().replace(/(^|[\s\-("'])(\p{L})/gu, (_, a, b) => a + b.toUpperCase())
const PASS = { huruf: 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ', angka: '23456789', simbol: '!@#$%^&*-_=+?' }
function genPass(n) {
  const all = PASS.huruf + PASS.angka + PASS.simbol, out = [PASS.huruf, PASS.angka, PASS.simbol].map(s => s[crypto.randomInt(s.length)])
  while (out.length < n) out.push(all[crypto.randomInt(all.length)])
  for (let i = out.length - 1; i > 0; i--) { const j = crypto.randomInt(i + 1);[out[i], out[j]] = [out[j], out[i]] }   // acak urutan
  return out.join('')
}
function stats(t) {
  const s = String(t), words = s.trim() ? s.trim().split(/\s+/).length : 0
  return { karakter: Array.from(s).length, tanpaSpasi: Array.from(s.replace(/\s/g, '')).length, kata: words, baris: s.split('\n').length, kalimat: (s.match(/[^.!?]+[.!?]+/g) || (s.trim() ? [s] : [])).length, menit: Math.max(1, Math.round(words / 200)) }
}

const GROUPS = {
  enc64: ['enc64', 'base64', 'b64', 'tobase64'], dec64: ['dec64', 'debase64', 'frombase64'], hash: ['hash', 'md5', 'sha1', 'sha256', 'sha512'],
  pass: ['pass', 'password', 'genpass', 'katasandi'], uuid: ['uuid', 'guid'], balik: ['balik', 'reverse'], besar: ['besar', 'upper', 'kapslok'], kecil: ['kecil', 'lower'],
  kapital: ['kapital', 'title', 'hurufawal'], rot13: ['rot13'], morse: ['morse', 'tomorse'], demorse: ['demorse', 'frommorse'], biner: ['biner', 'binary'], debiner: ['debiner', 'debinary'], kata: ['hitungkata', 'wordcount', 'statteks'],
}
const kindOf = (c) => Object.keys(GROUPS).find(k => GROUPS[k].includes(c))

module.exports = {
  name: 'enc64', alias: Object.values(GROUPS).flat().filter(x => x !== 'enc64'),
  category: 'tools', cmds: ['enc64', 'dec64', 'hash', 'pass', 'uuid', 'balik', 'besar', 'kecil', 'kapital', 'rot13', 'morse', 'demorse', 'biner', 'debiner', 'hitungkata'], noLimit: true,
  desc: 'Alat teks offline: base64, hash, kata sandi acak, UUID, balik/besar/kecil, rot13, morse, biner, hitung kata',
  run: async ({ m, reply, text, command, prefix }) => {
    const kind = kindOf(command), input = String(text || '').trim() || String((m.quoted && m.quoted.text) || '').trim()
    try {
      if (kind === 'uuid') return reply(`${H('UUID')}\`\`\`${crypto.randomUUID()}\`\`\``)
      if (kind === 'pass') {
        const n = Math.min(64, Math.max(6, parseInt(input) || 16))
        return reply(`${H('KATA SANDI ACAK')}\`\`\`${genPass(n)}\`\`\`\nPanjang ${n} karakter (huruf besar-kecil, angka, simbol).\n_Dibuat di bot ini, tidak disimpan._`)
      }
      if (!input) return reply(`${H(kind ? command.toUpperCase() : 'ALAT TEKS')}Tulis teksnya setelah perintah atau reply pesan.\nContoh: ${prefix}${command} halo dunia`)
      if (kind === 'enc64') return reply(`${H('BASE64 (ENKODE)')}\`\`\`${Buffer.from(input, 'utf8').toString('base64')}\`\`\``)
      if (kind === 'dec64') {
        const clean = input.replace(/\s/g, '')
        if (!/^[A-Za-z0-9+/_-]+={0,2}$/.test(clean)) return reply('Itu bukan base64 yang valid.')
        return reply(`${H('BASE64 (DEKODE)')}${Buffer.from(clean.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')}`)
      }
      if (kind === 'hash') {
        const ALG = ['md5', 'sha1', 'sha256', 'sha512'], viaCmd = ALG.includes(command) ? command : null, w = input.split(/\s+/)[0].toLowerCase()
        const alg = viaCmd || (ALG.includes(w) ? w : 'sha256'), data = viaCmd || !ALG.includes(w) ? input : input.slice(w.length).trim()
        if (!data) return reply(`Tulis teks yang mau di-hash.\nContoh: ${prefix}hash sha256 halo`)
        return reply(`${H('HASH ' + alg.toUpperCase())}\`\`\`${crypto.createHash(alg).update(data).digest('hex')}\`\`\``)
      }
      if (kind === 'balik') return reply(`${H('TEKS DIBALIK')}${Array.from(input).reverse().join('')}`)
      if (kind === 'besar') return reply(input.toUpperCase())
      if (kind === 'kecil') return reply(input.toLowerCase())
      if (kind === 'kapital') return reply(kapital(input))
      if (kind === 'rot13') return reply(`${H('ROT13')}${rot13(input)}`)
      if (kind === 'morse') { const r = toMorse(input); return reply(r ? `${H('MORSE')}${r}\n\n_Spasi = pemisah huruf, garis miring = pemisah kata._` : 'Tidak ada karakter yang bisa dikonversi.') }
      if (kind === 'demorse') return reply(`${H('MORSE KE TEKS')}${fromMorse(input).toUpperCase()}`)
      if (kind === 'biner') return reply(`${H('TEKS KE BINER')}${toBin(input)}`)
      if (kind === 'debiner') return reply(`${H('BINER KE TEKS')}${fromBin(input)}`)
      if (kind === 'kata') {
        const s = stats(input)
        return reply(`${H('STATISTIK TEKS')}${ST.B('Karakter')}   : ${s.karakter} (${s.tanpaSpasi} tanpa spasi)\n${ST.B('Kata')}       : ${s.kata}\n${ST.B('Kalimat')}    : ${s.kalimat}\n${ST.B('Baris')}      : ${s.baris}\n${ST.B('Waktu baca')} : sekitar ${s.menit} menit`)
      }
    } catch (e) { return reply('Gagal: ' + e.message) }
  },
  _t: { toMorse, fromMorse, toBin, fromBin, rot13, kapital, genPass, stats },
}
