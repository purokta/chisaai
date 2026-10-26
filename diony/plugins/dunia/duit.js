/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// KAK DUIT — kurs mata uang (open.er-api.com, gratis tanpa key, update harian)
const axios = require('axios'), NU = require('../../lib/npcutil')
let cache = { at: 0, d: null }
const ALIAS = { dolar: 'USD', dollar: 'USD', euro: 'EUR', rupiah: 'IDR', rp: 'IDR', yen: 'JPY', ringgit: 'MYR', riyal: 'SAR', pound: 'GBP', poundsterling: 'GBP', yuan: 'CNY', rmb: 'CNY', won: 'KRW', baht: 'THB', dirham: 'AED', sgd: 'SGD', singapura: 'SGD' }
const POP = ['USD', 'EUR', 'SGD', 'MYR', 'JPY', 'SAR', 'AUD', 'GBP', 'CNY', 'KRW']
async function rates() {
  if (cache.d && Date.now() - cache.at < 3600000) return cache.d
  const r = await axios.get('https://open.er-api.com/v6/latest/USD', { timeout: 12000 })
  if (!r.data || r.data.result !== 'success') throw new Error('respons kurs tidak valid')
  cache = { at: Date.now(), d: r.data }; return r.data
}
const code = (s) => { s = String(s || '').toLowerCase().replace(/[^a-z]/g, ''); return ALIAS[s] || s.toUpperCase() }
const num = (n) => { const a = Math.abs(n); return n.toLocaleString('id-ID', { maximumFractionDigits: a >= 100 ? 0 : a >= 1 ? 2 : 6 }) }
const amt = (s) => { s = String(s).replace(/[^\d.,]/g, ''); if (!s) return NaN; if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '').replace(',', '.'); else if (s.includes(',')) s = s.replace(',', '.'); else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, ''); return parseFloat(s) }

module.exports = {
  name: 'kurs',
  alias: ['currency', 'konversiuang', 'tukaruang', 'matauang'],
  category: 'dunia',
  cmds: ['kurs'],
  desc: 'Kurs & konversi mata uang (Kak Duit)',
  run: async ({ m, args, prefix, reply }) => {
    const jid = m.sender, head = NU.head('duit', jid)
    let d; try { d = await rates() } catch (e) { console.log('[kurs]', e.message); return reply(`${head}\n\nServer kurs sedang tidak bisa dihubungi. Coba lagi nanti ya.`) }
    const R = d.rates, upd = (d.time_last_update_utc || '').replace(/ \+0000$/, ' UTC').slice(0, 25)
    const words = args.filter(a => !/^(ke|to|ke:|=|->|jadi|dalam)$/i.test(a)), n = words.find(w => /^[\d.,]+$/.test(w)), cur = words.filter(w => w !== n).map(code)
    if (!words.length) {
      const idr = R.IDR; return reply(`${head}\n\n*KURS KE RUPIAH*\n\n` + POP.map(c => `• 1 ${c} = *Rp${num(idr / R[c])}*`).join('\n') + `\n\n_Diperbarui ${upd}. Kurs tengah, bukan kurs jual/beli bank._\nContoh: ${prefix}kurs 100 usd idr  |  ${prefix}kurs 50000 idr jpy${NU.bump(jid, 'duit', 2)}`)
    }
    const from = cur[0], to = cur[1] || (from === 'IDR' ? 'USD' : 'IDR'), a = n ? amt(n) : 1
    if (!R[from] || !R[to]) return reply(`${head}\n\nKode mata uang tidak dikenal: ${[from, to].filter(c => !R[c]).join(', ')}.\nContoh kode: USD, EUR, IDR, JPY, SGD, MYR, SAR, GBP, CNY, KRW`)
    if (!Number.isFinite(a) || a <= 0 || a > 1e12) return reply('Jumlah tidak valid.')
    const out = a * R[to] / R[from], one = R[to] / R[from]
    return reply(`${head}\n\n*KONVERSI MATA UANG*\n\n💱 ${num(a)} ${from} = *${num(out)} ${to}*\n\n1 ${from} = ${num(one)} ${to}\n1 ${to} = ${num(1 / one)} ${from}\n\n_Diperbarui ${upd}. Kurs tengah; kurs bank/money changer bisa berbeda._${NU.bump(jid, 'duit', 2)}`)
  },
}
