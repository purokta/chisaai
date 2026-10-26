/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Kit teks tambahan: slugify, caesar/rot47, titlecase, frekuensi huruf, balik kata, kapitalisasi,
// snake/camel/kebab case, panjang teks, acak huruf, hapus vokal, ganti huruf, leetspeak, morse, biner, akronim, vokal/konsonan.
const { B } = require('../../lib/style')

const CMDS = ['slugify', 'caesarenc', 'rot47', 'titlecase', 'frekuensihuruf', 'balikkata', 'hurufkapital', 'snakecase', 'camelcase', 'kebabcase', 'panjangteks', 'acakhuruf', 'hapusvokal', 'gantihuruf', 'leetspeak', 'morsekode', 'teksbiner', 'akronim', 'hitungvokal', 'hitungkonsonan']

const MORSE = { a: '.-', b: '-...', c: '-.-.', d: '-..', e: '.', f: '..-.', g: '--.', h: '....', i: '..', j: '.---', k: '-.-', l: '.-..', m: '--', n: '-.', o: '---', p: '.--.', q: '--.-', r: '.-.', s: '...', t: '-', u: '..-', v: '...-', w: '.--', x: '-..-', y: '-.--', z: '--..', 0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.' }
const MORSE_REV = Object.fromEntries(Object.entries(MORSE).map(([k, v]) => [v, k]))
const LEET = { a: '4', e: '3', i: '1', o: '0', s: '5', t: '7', g: '9', b: '8' }
const words = (s) => String(s).trim().split(/\s+/).filter(Boolean)
const shuffleStr = (s) => { const a = s.split(''); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]] } return a.join('') }

module.exports = {
  name: 'textops', alias: CMDS, category: 'tools', noLimit: true, cmds: CMDS,
  desc: 'Kit teks: slugify, caesar, rot47, titlecase, morse, biner, leetspeak, dan lainnya',
  run: async ({ command, text, prefix, reply }) => {
    const t = String(text || '').trim()
    const help = (name, contoh) => reply(`${B(name.toUpperCase())}\nTulis teksnya.\nContoh: ${prefix}${command} ${contoh}`)
    if (!t && command !== 'akronim') return help(command, 'contoh teks')

    if (command === 'slugify') return reply(`${B('SLUGIFY')}\n${t.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || '-'}`)
    if (command === 'caesarenc') {
      const parts = t.split(/\s+/), shift = parseInt(parts[parts.length - 1], 10)
      const msg = Number.isFinite(shift) && parts.length > 1 ? parts.slice(0, -1).join(' ') : t
      const k = Number.isFinite(shift) && parts.length > 1 ? shift : 3
      const enc = [...msg].map(c => { if (/[a-z]/.test(c)) return String.fromCharCode((c.charCodeAt(0) - 97 + k % 26 + 26) % 26 + 97); if (/[A-Z]/.test(c)) return String.fromCharCode((c.charCodeAt(0) - 65 + k % 26 + 26) % 26 + 65); return c }).join('')
      return reply(`${B('CAESAR CIPHER')} (geser ${k})\nAsli   : ${msg}\nSandi  : ${enc}\n_Kirim ulang hasil dengan geser negatif (-${k}) untuk membalikkan._`)
    }
    if (command === 'rot47') {
      const enc = [...t].map(c => { const o = c.charCodeAt(0); return o >= 33 && o <= 126 ? String.fromCharCode(33 + (o + 14) % 94) : c }).join('')
      return reply(`${B('ROT47')}\n${enc}\n_Jalankan lagi hasilnya untuk mengembalikan ke teks asli._`)
    }
    if (command === 'titlecase') return reply(`${B('TITLE CASE')}\n${words(t).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')}`)
    if (command === 'frekuensihuruf') {
      const cnt = {}; for (const c of t.toLowerCase()) if (/[a-z]/.test(c)) cnt[c] = (cnt[c] || 0) + 1
      const rows = Object.entries(cnt).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      if (!rows.length) return reply('✕ Tidak ada huruf a-z dalam teks.')
      return reply(`${B('FREKUENSI HURUF')}\n${rows.map(([c, n]) => `${c} : ${n}`).join('\n')}`)
    }
    if (command === 'balikkata') return reply(`${B('BALIK KATA')}\n${words(t).reverse().join(' ')}`)
    if (command === 'hurufkapital') return reply(`${B('TOGGLE HURUF')}\n${[...t].map(c => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()).join('')}`)
    if (command === 'snakecase') return reply(`${B('SNAKE_CASE')}\n${words(t).join('_').toLowerCase()}`)
    if (command === 'camelcase') { const w = words(t).map(x => x.toLowerCase()); return reply(`${B('CAMELCASE')}\n${w[0] || ''}${w.slice(1).map(x => x.charAt(0).toUpperCase() + x.slice(1)).join('')}`) }
    if (command === 'kebabcase') return reply(`${B('KEBAB-CASE')}\n${words(t).join('-').toLowerCase()}`)
    if (command === 'panjangteks') { const noSpace = t.replace(/\s/g, ''); return reply(`${B('PANJANG TEKS')}\n┣ Karakter (termasuk spasi) : ${t.length}\n┣ Karakter (tanpa spasi)    : ${noSpace.length}\n┣ Kata                      : ${words(t).length}\n┗ Baris                     : ${t.split('\n').length}`) }
    if (command === 'acakhuruf') return reply(`${B('ACAK HURUF')}\n${words(t).map(shuffleStr).join(' ')}`)
    if (command === 'hapusvokal') return reply(`${B('HAPUS VOKAL')}\n${t.replace(/[aiueoAIUEO]/g, '')}`)
    if (command === 'gantihuruf') {
      const m = t.match(/^(.*?)\s*=\s*(\S)\s*>\s*(\S)$/) || t.match(/^(.+)\s+(\S)\s+(\S)$/)
      if (!m) return reply(`${B('GANTI HURUF')}\nFormat: ${prefix}gantihuruf <teks> <huruf-lama> <huruf-baru>\nContoh: ${prefix}gantihuruf halo dunia a 4`)
      const [, body, from, to] = m
      return reply(`${B('GANTI HURUF')}\n${body.split(from).join(to)}`)
    }
    if (command === 'leetspeak') return reply(`${B('LEETSPEAK')}\n${[...t.toLowerCase()].map(c => LEET[c] || c).join('')}`)
    if (command === 'morsekode') {
      if (/^[.\-\s/]+$/.test(t) && /[.\-]/.test(t)) {
        const out = t.split(/\s*\/\s*|\s{2,}/).map(w => w.split(/\s+/).map(code => MORSE_REV[code] || '').join('')).join(' ')
        return reply(`${B('MORSE → TEKS')}\n${out || '✕ Kode tidak dikenali.'}`)
      }
      const out = [...t.toLowerCase()].map(c => c === ' ' ? '/' : (MORSE[c] || '')).filter(Boolean).join(' ')
      return reply(`${B('TEKS → MORSE')}\n${out}`)
    }
    if (command === 'teksbiner') {
      if (/^[01\s]+$/.test(t)) { const out = t.trim().split(/\s+/).map(b => String.fromCharCode(parseInt(b, 2))).join(''); return reply(`${B('BINER → TEKS')}\n${out}`) }
      const out = [...t].map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ')
      return reply(`${B('TEKS → BINER')}\n${out}`)
    }
    if (command === 'akronim') {
      if (!t) return help('akronim', 'Gerakan Nasional Non Tunai')
      return reply(`${B('AKRONIM')}\n${words(t).map(w => w.charAt(0).toUpperCase()).join('')}`)
    }
    if (command === 'hitungvokal' || command === 'hitungkonsonan') {
      const vok = (t.match(/[aiueoAIUEO]/g) || []).length, kons = (t.match(/[a-zA-Z]/g) || []).length - vok
      return reply(`${B('HITUNG HURUF')}\n┣ Vokal    : ${vok}\n┗ Konsonan : ${kons}`)
    }
    return reply(help)
  },
}
