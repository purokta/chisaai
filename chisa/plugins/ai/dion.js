/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// DION — gadis yandere, asisten AI pribadi. KHUSUS OWNER dan HANYA TANPA PREFIX.
//   dion <pesan>            → tanya apa saja / ngoding / terjemah / ringkas / menulis / ide (reply pesan atau kirim foto juga bisa)
//   dion reset              → hapus ingatan percakapan
//   reply balasan Dion      → lanjut ngobrol tanpa mengetik "dion" lagi (5 menit setelah Dion bicara)
// Bila diketik dengan prefix (.dion) atau oleh non-owner, Chisa.js (noPrefixOnly) tidak membalas apa pun.
const dion = require('../../lib/dion')

const sleep = (ms) => new Promise(r => setTimeout(r, ms))
const lastTalk = new Map()        // chat -> waktu terakhir Dion bicara (untuk lanjut lewat reply)
const FOLLOW_MS = 5 * 60 * 1000
const typing = (sock, m) => sock.sendPresenceUpdate('composing', m.chat).catch(() => {})
const RESET = new Set(['reset', 'clear', 'lupa', 'lupakan', 'hapus', 'ulang'])

// antrian per chat: pesan beruntun dijawab BERURUTAN (tidak saling tumpang tindih / mengacaukan ingatan)
const queues = new Map()
const enqueue = (chat, fn) => { const prev = queues.get(chat) || Promise.resolve(); const next = prev.catch(() => {}).then(fn); queues.set(chat, next); next.finally(() => { if (queues.get(chat) === next) queues.delete(chat) }).catch(() => {}); return next }
// indikator "mengetik..." tetap menyala selama Dion berpikir (WA mematikannya sendiri tiap beberapa detik)
async function withTyping(sock, m, fn) {
  const tick = () => sock.sendPresenceUpdate('composing', m.chat).catch(() => {})
  tick(); const t = setInterval(tick, 6000)
  try { return await fn() } finally { clearInterval(t); sock.sendPresenceUpdate('paused', m.chat).catch(() => {}) }
}
// satu kali coba ulang untuk gangguan sesaat (limit / timeout penyedia AI)
async function retry(fn) { try { return await fn() } catch (e) { await sleep(1500); return fn().catch(() => { throw e }) } }
// jawaban panjang dipecah di batas paragraf / baris agar tidak terpotong WhatsApp
function chunks(text, max = 3500) {
  const out = []; let rest = String(text || '').trim()
  while (rest.length > max) { let cut = rest.lastIndexOf('\n\n', max); if (cut < max * 0.5) cut = rest.lastIndexOf('\n', max); if (cut < max * 0.5) cut = rest.lastIndexOf(' ', max); if (cut < 1) cut = max; out.push(rest.slice(0, cut).trim()); rest = rest.slice(cut).trim() }
  if (rest) out.push(rest); return out
}
async function say(ctx, text) { const parts = chunks(text); for (let i = 0; i < parts.length; i++) { if (i === 0) await ctx.reply(parts[i]); else await ctx.sock.sendMessage(ctx.m.chat, { text: parts[i] }) } }


const fail = (e, ctx) => {
  console.log('[dion]', e.message, e.details || '')
  return ctx.reply(`Hiks... Dion lagi nggak bisa jawab nih, kak. Coba lagi sebentar ya~ 🥺${e.details && e.details.length ? '\n\n_Detail:_\n' + e.details.slice(0, 3).map(x => '- ' + x).join('\n') : '\n\n_' + e.message + '_'}`)
}

async function talkNow(ctx, text) {
  const { sock, m, reply } = ctx
  const quoted = (m.quoted && (m.quoted.text || m.quoted.caption)) || ''
  const AJ = require('../../lib/ajaib')
  const media = (() => { try { return AJ.pickNode(m, ['image']) } catch { return null } })()
  lastTalk.set(m.chat, Date.now())

  if (!text && !quoted && !media) return reply(dion.greet())
  await typing(sock, m)

  // foto + pertanyaan → Dion melihat gambar
  if (media) {
    if (Number(media.node.fileLength) > 15 * 1024 * 1024) return reply('Gambarnya kegedean, kak (maks 15 MB)~ 🥺')
    // permintaan EDIT gambar ("ganti latar jadi pantai") tetap lewat pembuat gambar bawaan bila ada
    try { const IG = require('../kreasi/aigambar'), it = IG.intent(text, true); if (it) return IG.chat(ctx, it) } catch (e) { console.log('[dion gambar intent]', e.message) }
    try {
      const img = await AJ.download(media)
      const r = await retry(() => dion.vision({ image: img, mime: String(media.mime || 'image/jpeg').split(';')[0], prompt: text || 'Jelaskan isi gambar ini secara singkat dan jelas. Jika ada teks penting, sebutkan.' }))
      return say(ctx, r.text)
    } catch (e) { return fail(e, ctx) }
  }

  // permintaan membuat gambar lewat obrolan ("buatkan gambar ...")
  if (text) { try { const IG = require('../kreasi/aigambar'), it = IG.intent(text, false); if (it) return IG.chat(ctx, it) } catch (e) { console.log('[dion gambar intent]', e.message) } }

  try {
    const prompt = text && quoted ? `Konteks (pesan yang dibalas):\n"""${quoted.slice(0, 6000)}"""\n\nPermintaan: ${text}` : (text || `Tolong tanggapi pesan ini:\n"""${quoted.slice(0, 6000)}"""`)
    const r = await retry(() => dion.ask({ jid: m.sender, text: prompt }))
    // jawaban berisi kode → blok kode native WhatsApp ("Lihat kode"); bila gagal → teks biasa
    try { if (await require('../../lib/codeblock').sendAnswer(sock, m, r.text)) return } catch (e) { console.log('[dion codeblock]', e.message) }
    return say(ctx, r.text)
  } catch (e) { return fail(e, ctx) }
}

const talk = (ctx, text) => enqueue(ctx.m.chat, () => withTyping(ctx.sock, ctx.m, () => talkNow(ctx, text)))

module.exports = {
  name: 'dion', alias: ['dionreset', 'dionclear'], category: 'ai', cmds: ['dion'],
  desc: 'Dion, gadis yandere asisten AI pribadi (khusus owner, tanpa prefix)',
  owner: true, noLimit: true, noPrefixOnly: true,

  run: async (ctx) => {
    const { m, reply, args, command } = ctx
    if (command === 'dionreset' || command === 'dionclear' || (args.length === 1 && RESET.has(args[0].toLowerCase()))) {
      dion.clear(m.sender); return reply('Oke kak... ingatan kita sudah Dion hapus. Tapi perasaan Dion nggak ikut terhapus, lho~ 🖤')
    }
    return talk(ctx, ctx.text)
  },

  // lanjut ngobrol: owner membalas (reply) pesan bot sesaat setelah Dion bicara → tanpa perlu mengetik "dion"
  before: async (ctx) => {
    const { m, budy, isCreator } = ctx
    if (!isCreator || !budy || !m.quoted || !m.quoted.key || !m.quoted.key.fromMe) return false
    if (Date.now() - (lastTalk.get(m.chat) || 0) > FOLLOW_MS) return false
    if ((global.prefixList || []).some(p => budy.trim().startsWith(p))) return false
    const first = budy.trim().split(/\s+/)[0].toLowerCase()
    if (require('../../lib/pluginloader').get(first)) return false   // kata pertama adalah command lain → biarkan jalur perintah
    try { await talk({ ...ctx, text: budy.trim(), args: budy.trim().split(/ +/) }, budy.trim()) } catch (e) { console.log('[dion follow]', e.message) }
    return true
  },
}
