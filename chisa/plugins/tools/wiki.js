/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .wiki <topik> — ringkasan Wikipedia (id, cadangan en);  .kamus <kata> — arti kata bahasa Inggris (definisi + contoh)
const axios = require('axios'), { B } = require('../../lib/style')
const UA = { 'User-Agent': 'ChisaBot/3.3 (WhatsApp bot)', 'Accept': 'application/json' }
const get = (url, params) => axios.get(url, { params, headers: UA, timeout: 15000 }).then(r => r.data)

async function wiki(q, lang) {
  const s = await get(`https://${lang}.wikipedia.org/w/api.php`, { action: 'opensearch', search: q, limit: 1, namespace: 0, format: 'json' })
  const title = s && s[1] && s[1][0]; if (!title) return null
  const d = await get(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`)
  if (!d || !d.extract) return null
  return { title: d.title, desc: d.description || '', text: d.extract, url: (d.content_urls && d.content_urls.desktop && d.content_urls.desktop.page) || `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title)}`, thumb: d.thumbnail && d.thumbnail.source }
}

module.exports = {
  name: 'kamus', alias: ['kamus', 'dict', 'arti'], category: 'tools', cmds: ['kamus'],
  desc: 'Wikipedia ringkas (.wiki <topik>) dan kamus Inggris (.kamus <kata>)',
  run: async ({ sock, m, text, command, prefix, reply }) => {
    const q = (text || (m.quoted && (m.quoted.text || m.quoted.caption)) || '').trim().slice(0, 100)
    const isDict = ['kamus', 'dict', 'arti'].includes(command)
    if (!q) return reply(isDict ? `${B('KAMUS')}\nContoh: ${prefix}kamus serendipity\n_Arti kata bahasa Inggris dengan contoh kalimat._` : `${B('WIKIPEDIA')}\nContoh: ${prefix}wiki Candi Borobudur\n${prefix}wiki en Albert Einstein  (Wikipedia bahasa Inggris)`)
    try {
      if (isDict) {
        const word = q.split(/\s+/)[0].toLowerCase(), d = await get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`)
        const e = Array.isArray(d) && d[0]; if (!e) return reply(`Kata "${word}" tidak ditemukan. Kamus ini untuk bahasa Inggris.`)
        const ph = (e.phonetics || []).map(p => p.text).find(Boolean) || e.phonetic || ''
        const body = (e.meanings || []).slice(0, 3).map(mn => `*${mn.partOfSpeech}*\n` + (mn.definitions || []).slice(0, 2).map((x, i) => `${i + 1}. ${x.definition}${x.example ? `\n   _"${x.example}"_` : ''}`).join('\n')).join('\n\n')
        return reply(`${B(e.word.toUpperCase())}${ph ? '  ' + ph : ''}\n${body}\n\n_Terjemahkan: ${prefix}translate id <teks>_`)
      }
      let lang = 'id', topic = q; const mm = q.match(/^(id|en|ms|jv|su|ja|ar|nl|de|fr|es)\s+(.+)$/i); if (mm) { lang = mm[1].toLowerCase(); topic = mm[2] }
      let r = await wiki(topic, lang); if (!r && lang === 'id') { r = await wiki(topic, 'en'); if (r) lang = 'en' }
      if (!r) return reply(`Tidak ada artikel untuk "${topic}". Coba kata kunci lain.`)
      const cap = `${B(r.title)}${r.desc ? '\n_' + r.desc + '_' : ''}\n\n${r.text.slice(0, 1200)}${r.text.length > 1200 ? '…' : ''}\n\n${r.url}`
      if (r.thumb) { try { const img = await axios.get(r.thumb, { responseType: 'arraybuffer', headers: UA, timeout: 15000 }); return await sock.sendMessage(m.chat, { image: Buffer.from(img.data), caption: cap }, { quoted: m }) } catch {} }
      return reply(cap)
    } catch (e) { console.log('[wiki]', e.message); return reply(e.response && e.response.status === 404 ? 'Tidak ditemukan.' : '✕ Layanan sedang tidak bisa dijangkau. Coba lagi nanti.') }
  },
}
