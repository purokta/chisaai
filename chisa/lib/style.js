/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// GAYA KUNO: huruf tebal serif (Mathematical Bold) + hieroglif Mesir; emoji otomatis diganti/dihapus
const S = require('./settingsdb')

// A-Z a-z 0-9 -> Mathematical Bold (𝐀𝐛𝟏). Karakter lain tidak diubah.
// judul tebal gaya WhatsApp (*teks*) — ciri khas Chisa AI
const B = (t) => { const x = String(t ?? '').replace(/\*/g, '').trim(); return x ? `*${x}*` : '' }
// teks biasa (ASCII) tanpa hieroglif: dipakai di gambar canvas yang fontnya belum tentu ada hieroglif
const plain = (t) => String(t ?? '').normalize('NFKC').replace(/[\u{13000}-\u{1342F}]/gu, '').replace(/\s+/g, ' ').trim()

// ── pemetaan emoji -> hieroglif / simbol teks. Yang tidak ada di sini dihapus. ──
const G = { eye: '✦', ankh: '✦', scarab: '✦', sun: '✦', lion: '✦', owl: '✦', falcon: '✦', town: '✦', offering: '✦', water: '✦', sky: '✦', cobra: '✦', bird: '✦', house: '✦', plant: '✦', star: '✦' }
const MAP = {}
const put = (glyph, list) => { for (const e of Array.from(list.replace(/\s/g, ''))) MAP[e] = glyph }
put(G.eye, '🔮👁👤🧿🔍📖🤖🙏')               // pengetahuan / identitas / penglihatan
put(G.ankh, '✅❤💖💚💗💞♥🆕🆙🏥🧬🫀')          // hidup / berhasil / sehat
put(G.scarab, '🎴🎟🎁🌟✨💎⭐🎉🔷🔹🍀🎰🎭')        // keberuntungan / koleksi / hadiah
put(G.sun, '⏳⏰⏱🕐🕑🕒📅🗓☀🌤⛅🌞🕰')          // waktu / hari
put(G.lion, '⚔🗡🛡💪🏆👑🪓🏹🔪💥🥊🔨⚒🪖👹')        // kekuatan / pertempuran
put(G.owl, '📜📋🧠📊🔄📈🎓📝🧮📒🔐')          // ilmu / catatan
put(G.falcon, '🧭🗺🏃⚡💨🌐📍📏🚀➡')           // perjalanan / kecepatan
put(G.town, '🏯🏰🏘🏪🏨🏕🏟🏖🛖🕌⛪')            // tempat / bangunan
put(G.offering, '💰🛒🛍💱💼💳🏦')             // uang / perdagangan
put(G.water, '💧🌧🌦⛲🎣🌊')                  // air
put(G.sky, '🌌🌙🌠☁🌫🌓')                   // langit
put(G.cobra, '☠💀⚠😈👿🩸🐍💔')               // bahaya
put(G.plant, '🌿🌲🍃')
put(G.bird, '🦅🐦')
put('✕', '❌🚫⛔✖')
put('◆', '🔴🔶'); put('◇', '🟠🟡🔸')
put('→', '➡️'); put('←', '⬅'); put('↳', '↳'); put('·', '▫◦⬜⬛')
put('𝐈', '🥇'); put('𝐈𝐈', '🥈'); put('𝐈𝐈𝐈', '🥉')
put('✦', '♥'); put('◦', '♡')
const KEEP = new Set(['★', '☆', '©', '®', '™', '→', '←', '↳', '➤', '◆', '◇', '✕', '·', '◦', '↩', '✦', '❖', '※'])

const RE = /(\p{Extended_Pictographic}|\p{Emoji_Modifier_Base})(\uFE0F|\u20E3|\p{Emoji_Modifier})*/gu
// ubah teks ke gaya kuno
function ancientize(text) {
  if (typeof text !== 'string' || !text) return text
  return text.replace(/♡/g, '◦').replace(/\uFE0F|\u20E3/g, '').replace(/[\u{1F3FB}-\u{1F3FF}\u200D]/gu, '').replace(/\p{Extended_Pictographic}( ?)/gu, (m, sp, off, str) => {
    const e = m.replace(/ $/, '')
    if (MAP[e]) return MAP[e] + sp
    if (KEEP.has(e)) return m
    return ''                                  // emoji tanpa pemetaan dihapus (beserta satu spasi sesudahnya)
  })
}
const on = () => { try { return S.get('gaya') !== 'emoji' } catch { return true } }
const fx = (t) => (on() ? ancientize(t) : t)
// ubah isi pesan Baileys (text/caption/footer saja; reaksi emoji dibiarkan)
function content(c) {
  if (!c || typeof c !== 'object' || !on()) return c
  const o = { ...c }
  for (const k of ['text', 'caption', 'footer', 'title', 'body']) if (typeof o[k] === 'string') o[k] = ancientize(o[k])
  return o
}
// potong berdasarkan karakter (bukan unit UTF-16) supaya huruf tebal/hieroglif tidak rusak
const cut = (t, n) => { const a = Array.from(String(t ?? '')); return a.length > n ? a.slice(0, n - 1).join('') + '…' : a.join('') }
module.exports = { cut, B, plain, G, ancientize, fx, content, MAP, on }
