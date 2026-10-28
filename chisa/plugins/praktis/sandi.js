/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Encode / decode: base64, hex, biner, url, rot13, caesar, balik
const K = require('../../lib/praktis'), { B } = require('../../lib/style')
const caesar = (t, k) => t.replace(/[a-z]/gi, c => { const b = c <= 'Z' ? 65 : 97; return String.fromCharCode(((c.charCodeAt(0) - b + k) % 26 + 26) % 26 + b) })
const M = {
  base64: { enc: t => Buffer.from(t, 'utf8').toString('base64'), dec: t => { const s = t.replace(/\s/g, ''); if (!/^[A-Za-z0-9+/_-]*={0,2}$/.test(s)) throw new Error('bukan base64'); return Buffer.from(s, 'base64').toString('utf8') } },
  hex: { enc: t => Buffer.from(t, 'utf8').toString('hex'), dec: t => { const s = t.replace(/\s|0x/g, ''); if (!/^([0-9a-f]{2})+$/i.test(s)) throw new Error('bukan hex'); return Buffer.from(s, 'hex').toString('utf8') } },
  biner: { enc: t => [...Buffer.from(t, 'utf8')].map(b => b.toString(2).padStart(8, '0')).join(' '), dec: t => { const p = t.trim().split(/\s+/); if (!p.every(x => /^[01]{8}$/.test(x))) throw new Error('bukan biner 8-bit'); return Buffer.from(p.map(x => parseInt(x, 2))).toString('utf8') } },
  url: { enc: t => encodeURIComponent(t), dec: t => decodeURIComponent(t) },
  rot13: { enc: t => caesar(t, 13), dec: t => caesar(t, 13) },
  balik: { enc: t => [...t].reverse().join(''), dec: t => [...t].reverse().join('') },
}
module.exports = {
  name: 'sandi', alias: ['encode', 'decode', 'enkripsi', 'dekripsi'], category: 'praktis', noLimit: true, cmds: ['encode', 'decode'],
  desc: 'Encode/decode teks: base64, hex, biner, url, rot13, caesar, balik',
  run: async ({ m, args, command, prefix, reply }) => {
    const mode = ['decode', 'dekripsi'].includes(command) ? 'dec' : 'enc'
    let method = (args[0] || '').toLowerCase(); const rest = args.slice(1).join(' ') || K.quotedText(m)
    const help = `✦ ${B('SANDI')}\n${prefix}encode base64 halo\n${prefix}decode base64 aGFsbw==\n\n${B('Metode')} : base64, hex, biner, url, rot13, balik, caesar<n> (mis. caesar3)\n_Bisa membalas pesan sebagai teks._`
    if (!method || !rest) return reply(help)
    if (rest.length > 3000) return reply('✕ Teks terlalu panjang (maks 3000 karakter).')
    let out; const cm = method.match(/^caesar(-?\d{1,2})?$/)
    if (cm) { const k = cm[1] ? parseInt(cm[1], 10) : 3; out = caesar(rest, mode === 'enc' ? k : -k); method = `caesar (geser ${k})` }
    else if (M[method]) { try { out = M[method][mode](rest) } catch (e) { return reply(`✕ Gagal ${mode === 'dec' ? 'decode' : 'encode'}: ${e.message || 'input tidak valid'}.`) } }
    else return reply(help)
    return reply(`✦ ${B(mode === 'enc' ? 'ENCODE' : 'DECODE')} — ${method.toUpperCase()}\n\n${out}`)
  },
}
