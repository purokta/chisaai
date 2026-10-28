/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .kripto [koin] — harga kripto (CoinGecko, gratis) dalam IDR & USD + perubahan 24 jam.  Tanpa argumen = 8 koin teratas
const axios = require('axios'), { B } = require('../../lib/style')
const LINE = '━━━━━━━━━━━━━━━━━━━━'
const TOP = ['bitcoin', 'ethereum', 'tether', 'binancecoin', 'solana', 'ripple', 'dogecoin', 'cardano']
const SYM = { btc: 'bitcoin', eth: 'ethereum', usdt: 'tether', bnb: 'binancecoin', sol: 'solana', xrp: 'ripple', doge: 'dogecoin', ada: 'cardano', ton: 'the-open-network', trx: 'tron', dot: 'polkadot', matic: 'matic-network', ltc: 'litecoin', shib: 'shiba-inu', avax: 'avalanche-2', link: 'chainlink', pepe: 'pepe' }
const rp = (n) => 'Rp' + Math.round(n).toLocaleString('id-ID')
const usd = (n) => '$' + (n >= 1 ? n.toLocaleString('en-US', { maximumFractionDigits: 2 }) : n.toPrecision(3))
const arrow = (c) => c == null ? '' : (c >= 0 ? '▲ +' : '▼ ') + c.toFixed(2) + '%'
module.exports = {
  name: 'kripto', alias: ['crypto', 'hargakripto', 'coin'], category: 'economy', cmds: ['kripto'], noLimit: false,
  desc: 'Harga kripto realtime (IDR & USD): .kripto, .kripto btc eth',
  run: async ({ text, prefix, reply }) => {
    const want = String(text || '').toLowerCase().split(/[\s,]+/).filter(Boolean).slice(0, 6).map(x => SYM[x] || x.replace(/[^a-z0-9-]/g, ''))
    const ids = want.length ? want : TOP
    try {
      const { data } = await axios.get('https://api.coingecko.com/api/v3/simple/price', { timeout: 15000, params: { ids: ids.join(','), vs_currencies: 'idr,usd', include_24hr_change: true } })
      const rows = ids.filter(i => data[i]).map(i => `*${i.toUpperCase().replace(/-/g, ' ')}*\n   ${rp(data[i].idr)}  •  ${usd(data[i].usd)}  ${arrow(data[i].usd_24h_change)}`)
      if (!rows.length) return reply(`Koin tidak dikenal.\nContoh: ${prefix}kripto btc eth sol`)
      return reply(`${B('HARGA KRIPTO')}\n${LINE}\n${rows.join('\n')}\n\n_Sumber: CoinGecko • bukan saran investasi_`)
    } catch (e) { console.log('[kripto]', e.message); return reply('Gagal mengambil harga: ' + (e.response && e.response.status === 429 ? 'batas permintaan tercapai, coba lagi semenit lagi' : e.message)) }
  },
}
