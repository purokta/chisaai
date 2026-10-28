/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Fitur ANIME (info, bukan unduhan) — data dari Jikan API (MyAnimeList), gratis & legal.
//   .anime <judul>          detail lengkap + poster + tempat nonton resmi
//   .animecari <judul>      daftar hasil pencarian (10 teratas)
//   .animetop               10 anime rating tertinggi
//   .animemusim             anime yang sedang tayang musim ini
//   .animejadwal [hari]     jadwal tayang (senin..minggu, default hari ini)
//   .animerandom            rekomendasi acak
const { jikan } = require('../../lib/jikan')
const ST = require('../../lib/style')
const LINE = '━━━━━━━━━━━━━━━━━━━━'

const HARI = { senin: 'monday', selasa: 'tuesday', rabu: 'wednesday', kamis: 'thursday', jumat: 'friday', "jum'at": 'friday', sabtu: 'saturday', minggu: 'sunday', ahad: 'sunday' }
const HARI_ID = { monday: 'Senin', tuesday: 'Selasa', wednesday: 'Rabu', thursday: 'Kamis', friday: 'Jumat', saturday: 'Sabtu', sunday: 'Minggu' }
const todayEn = () => ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date(Date.now() + 7 * 3600e3).getUTCDay()]   // WIB

const names = (a) => (a || []).map(x => x.name).join(', ') || '-'
const title = (a) => a.title_english || a.title
const fmtNum = (n) => Number(n || 0).toLocaleString('id-ID')
const STATUS = { 'Finished Airing': 'Selesai tayang', 'Currently Airing': 'Sedang tayang', 'Not yet aired': 'Belum tayang' }
const line = (a, i) => `${i + 1}. *${title(a)}*\n   ${a.type || '?'} • ${a.episodes ? a.episodes + ' eps' : '? eps'} • ⭐ ${a.score || '-'} • ID ${a.mal_id}`

function clip(t, n) { t = String(t || '').replace(/\[Written by MAL Rewrite\]/gi, '').trim(); return t.length > n ? t.slice(0, n).replace(/\s+\S*$/, '') + '…' : t }

async function detail(a, full) {
  const sin = clip(a.synopsis, 700) || 'Belum ada sinopsis.'
  const stream = ((full && full.streaming) || []).map(s => `${s.name}: ${s.url}`).slice(0, 4)
  return [
    ST.B(title(a).toUpperCase()), LINE,
    a.title_japanese ? `Judul JP : ${a.title_japanese}` : '',
    `Tipe      : ${a.type || '-'} • ${a.episodes || '?'} eps • ${a.duration || '-'}`,
    `Status    : ${STATUS[a.status] || a.status || '-'}`,
    `Tayang    : ${(a.aired && a.aired.string) || '-'}${a.season ? ' (' + a.season + ' ' + a.year + ')' : ''}`,
    `Skor      : ⭐ ${a.score || '-'} (${fmtNum(a.scored_by)} voting) • Peringkat #${a.rank || '-'}`,
    `Genre     : ${names([...(a.genres || []), ...(a.themes || [])])}`,
    `Studio    : ${names(a.studios)}`,
    `Rating    : ${a.rating || '-'}`, '', '*Sinopsis*', sin, '',
    stream.length ? '*Nonton resmi*\n' + stream.join('\n') : '',
    `\nMyAnimeList: ${a.url}`, `_Sumber: Jikan / MyAnimeList_`,
  ].join('\n').replace(/\n{3,}/g, '\n\n')
}

module.exports = {
  name: 'animecari', alias: ['animecari', 'carianime', 'animetop', 'topanime', 'animemusim', 'animenow', 'animejadwal', 'jadwalanime', 'animerandom', 'randomanime'],
  category: 'anime', cmds: ['animecari', 'animetop', 'animemusim', 'animejadwal', 'animerandom'], noLimit: false,
  desc: 'Info anime: cari, detail, top, musim ini, jadwal tayang (data MyAnimeList)',
  run: async ({ sock, m, reply, text, prefix, command }) => {
    const q = String(text || '').trim()
    const send = async (a, full) => {
      const cap = await detail(a, full), img = a.images && a.images.jpg && (a.images.jpg.large_image_url || a.images.jpg.image_url)
      if (img) { try { return await sock.sendMessage(m.chat, { image: { url: img }, caption: cap }, { quoted: m }) } catch {} }
      return reply(cap)
    }
    try {
      // ── top ──
      if (['animetop', 'topanime'].includes(command)) {
        const { data } = await jikan('/top/anime', { limit: 10, sfw: true })
        return reply(`${ST.B('TOP ANIME')}\n${LINE}\n${(data || []).map(line).join('\n')}\n\n_Detail: ${prefix}anime <judul>_`)
      }
      // ── musim ini ──
      if (['animemusim', 'animenow'].includes(command)) {
        const { data } = await jikan('/seasons/now', { limit: 15, sfw: true, filter: 'tv' })
        const rows = (data || []).filter((x, i, arr) => arr.findIndex(y => y.mal_id === x.mal_id) === i).slice(0, 15)
        return reply(`${ST.B('ANIME MUSIM INI')}\n${LINE}\n${rows.map(line).join('\n') || 'Tidak ada data.'}\n\n_Detail: ${prefix}anime <judul>_`)
      }
      // ── jadwal ──
      if (['animejadwal', 'jadwalanime'].includes(command)) {
        const day = q ? HARI[q.toLowerCase()] : todayEn()
        if (!day) return reply(`Hari tidak dikenal.\nContoh: ${prefix}animejadwal senin`)
        const { data } = await jikan('/schedules', { filter: day, limit: 20, sfw: true })
        const rows = (data || []).filter((x, i, arr) => arr.findIndex(y => y.mal_id === x.mal_id) === i).slice(0, 15)
        const jam = (a) => (a.broadcast && a.broadcast.time) ? a.broadcast.time + ' JST' : '-'
        return reply(`${ST.B('JADWAL ANIME ' + HARI_ID[day].toUpperCase())}\n${LINE}\n${rows.map((a, i) => `${i + 1}. *${title(a)}*\n   ⏰ ${jam(a)} • ⭐ ${a.score || '-'}`).join('\n') || 'Tidak ada jadwal.'}\n\n_Jam dalam JST (WIB + 2 jam)._`)
      }
      // ── random ──
      if (['animerandom', 'randomanime'].includes(command)) {
        for (let i = 0; i < 4; i++) {   // ulang bila kena konten dewasa
          const { data } = await jikan('/random/anime', { sfw: true })
          if (data && !/Rx|R\+/.test(String(data.rating || '')) ) return send(data)
        }
        return reply('Gagal mengambil anime acak, coba lagi.')
      }
      // ── cari / detail ──
      if (!q) return reply(`${ST.B('ANIME')}\n${LINE}\n${prefix}anime <judul>       detail + poster\n${prefix}animecari <judul>  hasil pencarian\n${prefix}animetop            top 10 rating\n${prefix}animemusim          tayang musim ini\n${prefix}animejadwal [hari]  jadwal tayang\n${prefix}animerandom         rekomendasi acak\n\nContoh: ${prefix}anime frieren`)
      const { data } = await jikan('/anime', { q, limit: 10, sfw: true, order_by: 'popularity', sort: 'asc' })
      if (!data || !data.length) return reply(`Anime "${q}" tidak ditemukan.`)
      if (['animecari', 'carianime'].includes(command)) return reply(`${ST.B('HASIL: ' + q.toUpperCase())}\n${LINE}\n${data.map(line).join('\n')}\n\n_Detail: ${prefix}anime <judul>_`)
      let full = null
      try { full = (await jikan(`/anime/${data[0].mal_id}/full`)).data } catch {}
      return send(full || data[0], full)
    } catch (e) { console.log('[anime]', e.message); return reply('Gagal mengambil data anime: ' + e.message + '\n_Coba lagi sebentar lagi._') }
  },
}
