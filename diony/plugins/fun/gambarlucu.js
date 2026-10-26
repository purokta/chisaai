/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Hiburan gambar acak: .meme  .kucing  .anjing  .pokemon <nama|id>   (semua gratis tanpa API key)
const axios = require('axios'), { B } = require('../../lib/style')
const CMDS = ['meme', 'kucing', 'anjing', 'pokemon']
const ALIAS = { memeacak: 'meme', randommeme: 'meme', cat: 'kucing', kucingacak: 'kucing', dog: 'anjing', anjingacak: 'anjing', poke: 'pokemon', pokedex: 'pokemon' }
const LINE = '━━━━━━━━━━━━━━━━━━━━'
const TIPE = { normal: 'Normal', fire: 'Api', water: 'Air', electric: 'Listrik', grass: 'Rumput', ice: 'Es', fighting: 'Bertarung', poison: 'Racun', ground: 'Tanah', flying: 'Terbang', psychic: 'Psikis', bug: 'Serangga', rock: 'Batu', ghost: 'Hantu', dragon: 'Naga', dark: 'Gelap', steel: 'Baja', fairy: 'Peri' }
const cap1 = (s) => String(s).replace(/(^|-)([a-z])/g, (_, a, b) => (a ? ' ' : '') + b.toUpperCase())
module.exports = {
  name: 'gambarlucu', alias: Object.keys(ALIAS).concat(CMDS), category: 'fun', cmds: CMDS, noLimit: false,
  desc: 'Gambar acak: meme, kucing, anjing, dan info Pokémon',
  run: async ({ sock, m, text, command, prefix, reply }) => {
    const cmd = ALIAS[command] || command, q = String(text || '').trim().toLowerCase()
    const send = (url, caption) => sock.sendMessage(m.chat, { image: { url }, caption }, { quoted: m })
    try {
      if (cmd === 'meme') {
        const { data } = await axios.get('https://meme-api.com/gimme', { timeout: 15000 })
        if (data.nsfw || !data.url) return reply('Dapat meme yang kurang pantas, coba lagi.')
        return send(data.url, `${B(data.title.slice(0, 120))}\n_r/${data.subreddit}_`)
      }
      if (cmd === 'kucing') { const { data } = await axios.get('https://api.thecatapi.com/v1/images/search', { timeout: 15000 }); return send(data[0].url, '🐱 Meong~') }
      if (cmd === 'anjing') { const { data } = await axios.get('https://dog.ceo/api/breeds/image/random', { timeout: 15000 }); return send(data.message, '🐶 Guk guk!') }
      // pokemon
      const key = q.replace(/\s+/g, '-') || String(1 + Math.floor(Math.random() * 1025))
      const p = await axios.get(`https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(key)}`, { timeout: 15000 }).then(r => r.data).catch(e => { if (e.response && e.response.status === 404) return null; throw e })
      if (!p) return reply(`Pokémon "${q}" tidak ditemukan.\nContoh: ${prefix}pokemon pikachu  •  ${prefix}pokemon 25  •  ${prefix}pokemon (acak)`)
      const st = Object.fromEntries(p.stats.map(s => [s.stat.name, s.base_stat])), bar = (v) => '█'.repeat(Math.round(Math.min(v, 160) / 16)) + '░'.repeat(10 - Math.round(Math.min(v, 160) / 16))
      const cap = [`${B('#' + p.id + ' ' + cap1(p.name).toUpperCase())}`, LINE, `Tipe   : ${p.types.map(t => TIPE[t.type.name] || t.type.name).join(' / ')}`, `Tinggi : ${p.height / 10} m   Berat: ${p.weight / 10} kg`, `Skill  : ${p.abilities.map(a => cap1(a.ability.name)).join(', ')}`, '',
        `HP   ${bar(st.hp)} ${st.hp}`, `ATK  ${bar(st.attack)} ${st.attack}`, `DEF  ${bar(st.defense)} ${st.defense}`, `SpA  ${bar(st['special-attack'])} ${st['special-attack']}`, `SpD  ${bar(st['special-defense'])} ${st['special-defense']}`, `SPD  ${bar(st.speed)} ${st.speed}`].join('\n')
      const art = (p.sprites.other && p.sprites.other['official-artwork'] && p.sprites.other['official-artwork'].front_default) || p.sprites.front_default
      return art ? send(art, cap) : reply(cap)
    } catch (e) { console.log('[gambarlucu]', cmd, e.message); return reply('Gagal: ' + e.message + '\n_Coba lagi sebentar lagi._') }
  },
}
