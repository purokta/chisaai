/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// ANIME PLUS — fitur anime lanjutan (data Jikan / MyAnimeList, gratis & legal, konten dewasa disaring)
//   .animekarakter <nama>      profil karakter + pengisi suara + anime asalnya
//   .manga <judul>             detail manga/manhwa/novel ringan     .mangatop  10 manga rating tertinggi
//   .animeupcoming             anime yang akan tayang
//   .animegenre [genre]        daftar genre / 10 anime terbaik dari satu genre (boleh nama Indonesia)
//   .animerekomendasi <judul>  "kalau suka ini, coba ini" (rekomendasi komunitas MAL)
//   .animetrailer <judul>      link trailer resmi
//   .animeepisode <judul> [hal] daftar episode + tanggal tayang
//   .animeseiyuu <nama>        profil pengisi suara + peran terkenalnya
//   .animebandingkan A | B     adu dua anime (skor, peringkat, populer, episode)
//   .animelist [tambah|selesai|hapus]  daftar tontonan pribadimu
const { jikan, sleep } = require('../../lib/jikan'), ST = require('../../lib/style'), AJ = require('../../lib/ajaib')
const LINE = '━━━━━━━━━━━━━━━━━━━━'
const CMDS = ['animekarakter', 'manga', 'mangatop', 'animeupcoming', 'animegenre', 'animerekomendasi', 'animetrailer', 'animeepisode', 'animeseiyuu', 'animebandingkan', 'animelist']
const ALIAS = { karakteranime: 'animekarakter', animechar: 'animekarakter', character: 'animekarakter', komik: 'manga', carimanga: 'manga', topmanga: 'mangatop', animenext: 'animeupcoming', animemendatang: 'animeupcoming',
  genreanime: 'animegenre', animemirip: 'animerekomendasi', rekomendasianime: 'animerekomendasi', traileranime: 'animetrailer', animeeps: 'animeepisode', episodeanime: 'animeepisode',
  seiyuu: 'animeseiyuu', pengisisuara: 'animeseiyuu', vsanime: 'animebandingkan', bandinganime: 'animebandingkan', watchlist: 'animelist', tontonanku: 'animelist' }
const db = AJ.store('animelist.json', { users: {} })
const GENRE_ID = { aksi: 'Action', petualangan: 'Adventure', komedi: 'Comedy', drama: 'Drama', fantasi: 'Fantasy', horor: 'Horror', misteri: 'Mystery', romantis: 'Romance', romansa: 'Romance', olahraga: 'Sports',
  'sci-fi': 'Sci-Fi', scifi: 'Sci-Fi', fiksiilmiah: 'Sci-Fi', supranatural: 'Supernatural', 'slice of life': 'Slice of Life', sliceoflife: 'Slice of Life', thriller: 'Suspense', suspense: 'Suspense', ecchi: 'Ecchi' }

const title = (a) => (a && (a.title_english || a.title)) || '?'
const fmt = (n) => Number(n || 0).toLocaleString('id-ID')
const names = (a) => (a || []).map(x => x.name).join(', ') || '-'
const clip = (t, n) => { t = String(t || '').replace(/\[Written by MAL Rewrite\]/gi, '').replace(/\r/g, '').trim(); return t.length > n ? t.slice(0, n).replace(/\s+\S*$/, '') + '…' : t }
const img = (a) => a && a.images && ((a.images.jpg && (a.images.jpg.large_image_url || a.images.jpg.image_url)) || (a.images.webp && a.images.webp.image_url))
const adult = (a) => /Rx|R\+/.test(String(a && a.rating || ''))
const line = (a, i) => `${i + 1}. *${title(a)}*\n   ${a.type || '?'} • ${a.episodes || a.chapters ? (a.episodes ? a.episodes + ' eps' : a.chapters + ' ch') : '?'} • ⭐ ${a.score || '-'} • ID ${a.mal_id}`
const dedupe = (rows) => (rows || []).filter((x, i, arr) => arr.findIndex(y => y.mal_id === x.mal_id) === i)

const findAnime = async (q) => { const { data } = await jikan('/anime', { q, limit: 5, sfw: true, order_by: 'popularity', sort: 'asc' }); return (data || []).find(a => !adult(a)) || null }

module.exports = {
  name: 'animeplus', alias: Object.keys(ALIAS).concat(CMDS), category: 'anime', cmds: CMDS, noLimit: false,
  desc: 'Anime lanjutan: karakter, manga, genre, rekomendasi, trailer, episode, seiyuu, bandingkan, watchlist',
  run: async ({ sock, m, reply, text, prefix, command }) => {
    const cmd = ALIAS[command] || command, q = String(text || '').trim()
    const sendImg = async (url, cap) => { if (url) { try { return await sock.sendMessage(m.chat, { image: { url }, caption: cap }, { quoted: m }) } catch {} } return reply(cap) }
    const need = (usage, ex) => reply(`${ST.B(usage.toUpperCase())}\n${LINE}\nContoh: ${prefix}${ex}`)
    try {
      // ───────── karakter
      if (cmd === 'animekarakter') {
        if (!q) return need('animekarakter <nama>', 'animekarakter Frieren')
        const { data } = await jikan('/characters', { q, limit: 5, order_by: 'favorites', sort: 'desc' })
        const c0 = data && data[0]; if (!c0) return reply(`Karakter "${q}" tidak ditemukan.`)
        let c = c0; try { c = (await jikan(`/characters/${c0.mal_id}/full`)).data || c0 } catch {}
        const an = (c.anime || []).slice(0, 4).map(x => `${title(x.anime)} (${x.role})`)
        const va = (c.voices || []).filter(v => v.language === 'Japanese').slice(0, 2).map(v => v.person.name)
        const cap = [ST.B(String(c.name).toUpperCase()), LINE, c.name_kanji ? `Kanji     : ${c.name_kanji}` : '', (c.nicknames || []).length ? `Panggilan : ${c.nicknames.slice(0, 4).join(', ')}` : '',
          `Favorit   : ❤ ${fmt(c.favorites)}`, an.length ? `Anime     : ${an.join('; ')}` : '', va.length ? `Seiyuu    : ${va.join(', ')}` : '', '', clip(c.about, 650) || 'Belum ada deskripsi.', `\nMyAnimeList: ${c.url}`].filter(x => x !== '').join('\n')
        return sendImg(img(c), cap)
      }
      // ───────── manga
      if (cmd === 'manga') {
        if (!q) return need('manga <judul>', 'manga one piece')
        const { data } = await jikan('/manga', { q, limit: 5, sfw: true, order_by: 'popularity', sort: 'asc' })
        const a = (data || []).find(x => !adult(x)); if (!a) return reply(`Manga "${q}" tidak ditemukan.`)
        const ST_ = { Finished: 'Tamat', Publishing: 'Masih terbit', 'On Hiatus': 'Hiatus', Discontinued: 'Dihentikan', 'Not yet published': 'Belum terbit' }
        const cap = [ST.B(title(a).toUpperCase()), LINE, a.title_japanese ? `Judul JP : ${a.title_japanese}` : '', `Tipe      : ${a.type || '-'} • ${a.chapters || '?'} chapter • ${a.volumes || '?'} volume`,
          `Status    : ${ST_[a.status] || a.status || '-'}`, `Terbit    : ${(a.published && a.published.string) || '-'}`, `Skor      : ⭐ ${a.score || '-'} (${fmt(a.scored_by)} voting) • Peringkat #${a.rank || '-'}`,
          `Genre     : ${names([...(a.genres || []), ...(a.themes || [])])}`, `Pengarang : ${names(a.authors)}`, '', '*Sinopsis*', clip(a.synopsis, 650) || 'Belum ada sinopsis.', `\nMyAnimeList: ${a.url}`].filter(x => x !== '').join('\n')
        return sendImg(img(a), cap)
      }
      if (cmd === 'mangatop') {
        const { data } = await jikan('/top/manga', { limit: 10, sfw: true })
        return reply(`${ST.B('TOP MANGA')}\n${LINE}\n${(data || []).map(line).join('\n')}\n\n_Detail: ${prefix}manga <judul>_`)
      }
      // ───────── akan tayang
      if (cmd === 'animeupcoming') {
        const { data } = await jikan('/seasons/upcoming', { limit: 20, sfw: true, filter: 'tv' })
        const rows = dedupe(data).slice(0, 15)
        return reply(`${ST.B('ANIME AKAN TAYANG')}\n${LINE}\n${rows.map((a, i) => `${i + 1}. *${title(a)}*\n   ${a.type || '?'} • ${(a.aired && a.aired.string) || 'jadwal belum pasti'} • ID ${a.mal_id}`).join('\n') || 'Belum ada data.'}\n\n_Detail: ${prefix}anime <judul>_`)
      }
      // ───────── genre
      if (cmd === 'animegenre') {
        const g = await jikan('/genres/anime', { filter: 'genres' }), list = (g.data || [])
        if (!q) return reply(`${ST.B('GENRE ANIME')}\n${LINE}\n${list.map(x => x.name).join(' • ')}\n\n_Pilih: ${prefix}animegenre <genre> — contoh ${prefix}animegenre komedi_`)
        const key = q.toLowerCase().replace(/\s+/g, ' '), want = (GENRE_ID[key] || GENRE_ID[key.replace(/\s/g, '')] || q).toLowerCase()
        const hit = list.find(x => x.name.toLowerCase() === want) || list.find(x => x.name.toLowerCase().includes(want))
        if (!hit) return reply(`Genre "${q}" tidak dikenal. Lihat daftar: ${prefix}animegenre`)
        const { data } = await jikan('/anime', { genres: hit.mal_id, order_by: 'score', sort: 'desc', min_score: 7, limit: 12, sfw: true, type: 'tv' })
        return reply(`${ST.B('TERBAIK: ' + hit.name.toUpperCase())}\n${LINE}\n${dedupe(data).filter(a => !adult(a)).slice(0, 10).map(line).join('\n') || 'Tidak ada data.'}\n\n_Detail: ${prefix}anime <judul>_`)
      }
      // ───────── judul → butuh anime
      if (['animerekomendasi', 'animetrailer', 'animeepisode'].includes(cmd)) {
        const uses = { animerekomendasi: 'animerekomendasi naruto', animetrailer: 'animetrailer frieren', animeepisode: 'animeepisode attack on titan 2' }
        let query = q, page = 1
        if (cmd === 'animeepisode') { const mt = q.match(/^(.*\S)\s+(\d{1,2})$/); if (mt) { query = mt[1]; page = Number(mt[2]) } }
        if (!query) return need(cmd + ' <judul>', uses[cmd])
        const a = await findAnime(query); if (!a) return reply(`Anime "${query}" tidak ditemukan.`)
        if (cmd === 'animerekomendasi') {
          const { data } = await jikan(`/anime/${a.mal_id}/recommendations`), rows = (data || []).slice(0, 8)
          if (!rows.length) return reply(`Belum ada rekomendasi untuk *${title(a)}*.`)
          return reply(`${ST.B('MIRIP ' + title(a).toUpperCase())}\n${LINE}\n${rows.map((r, i) => `${i + 1}. *${title(r.entry)}*\n   👍 ${r.votes} suara • ID ${r.entry.mal_id}`).join('\n')}\n\n_Detail: ${prefix}anime <judul>_`)
        }
        if (cmd === 'animetrailer') {
          const full = (await jikan(`/anime/${a.mal_id}/full`)).data || a, t = full.trailer
          const url = t && (t.url || (t.youtube_id && 'https://youtu.be/' + t.youtube_id))
          if (!url) return reply(`Trailer *${title(a)}* belum tersedia di MAL.`)
          return sendImg(img(a), `${ST.B('TRAILER')} — ${title(a)}\n${url}`)
        }
        // episode: 15 per halaman
        const per = 15, apiPage = Math.floor(((page - 1) * per) / 100) + 1, off = ((page - 1) * per) % 100
        const r = await jikan(`/anime/${a.mal_id}/episodes`, { page: apiPage }), all = r.data || []
        const rows = all.slice(off, off + per)
        if (!rows.length) return reply(page > 1 ? `Halaman ${page} kosong.` : `Daftar episode *${title(a)}* belum tersedia.`)
        const more = all.length > off + per || (r.pagination && r.pagination.has_next_page)
        return reply(`${ST.B('EPISODE ' + title(a).toUpperCase())}\n${LINE}\n${rows.map(e => `${e.mal_id}. ${clip(e.title, 60)}${e.aired ? ' • ' + String(e.aired).slice(0, 10) : ''}`).join('\n')}\n${more ? `\n_Lanjut: ${prefix}animeepisode ${query} ${page + 1}_` : ''}`)
      }
      // ───────── seiyuu
      if (cmd === 'animeseiyuu') {
        if (!q) return need('animeseiyuu <nama>', 'animeseiyuu Kana Hanazawa')
        const { data } = await jikan('/people', { q, limit: 3, order_by: 'favorites', sort: 'desc' })
        const p0 = data && data[0]; if (!p0) return reply(`Seiyuu "${q}" tidak ditemukan.`)
        let p = p0; try { p = (await jikan(`/people/${p0.mal_id}/full`)).data || p0 } catch {}
        const roles = (p.voices || []).filter(v => v.role === 'Main').slice(0, 6).map(v => `• ${v.character.name} — ${title(v.anime)}`)
        const cap = [ST.B(String(p.name).toUpperCase()), LINE, p.given_name || p.family_name ? `Nama      : ${[p.given_name, p.family_name].filter(Boolean).join(' ')}` : '', p.birthday ? `Lahir     : ${String(p.birthday).slice(0, 10)}` : '',
          `Favorit   : ❤ ${fmt(p.favorites)}`, '', roles.length ? '*Peran utama*\n' + roles.join('\n') : '', '', clip(p.about, 450), `\nMyAnimeList: ${p.url}`].filter(x => x !== '').join('\n')
        return sendImg(img(p), cap)
      }
      // ───────── bandingkan
      if (cmd === 'animebandingkan') {
        const parts = q.split(/\s*(?:\||\bvs\b)\s*/i).map(s => s.trim()).filter(Boolean)
        if (parts.length < 2) return need('animebandingkan <A> | <B>', 'animebandingkan naruto | bleach')
        const [x, y] = await Promise.all([findAnime(parts[0]), (async () => { await sleep(400); return findAnime(parts[1]) })()])
        if (!x || !y) return reply(`Tidak ketemu: ${!x ? parts[0] : parts[1]}`)
        const win = (a, b, hi = true) => (a == null || b == null || a === b) ? ['', ''] : ((hi ? a > b : a < b) ? ['✓ ', ''] : ['', '✓ '])
        const row = (lab, a, b, hi) => { const [wa, wb] = win(a, b, hi); return `${lab}\n  ${wa}${a ?? '-'}   |   ${wb}${b ?? '-'}` }
        return reply([ST.B('ADU ANIME'), LINE, `A: *${title(x)}*`, `B: *${title(y)}*`, '',
          row('⭐ Skor', x.score, y.score, true), row('🏆 Peringkat (kecil = bagus)', x.rank, y.rank, false), row('🔥 Popularitas (kecil = populer)', x.popularity, y.popularity, false),
          row('👥 Anggota MAL', x.members, y.members, true), row('📺 Episode', x.episodes, y.episodes, true), '', `Genre A: ${names(x.genres)}`, `Genre B: ${names(y.genres)}`, '', '_✓ = unggul di kategori itu_'].join('\n'))
      }
      // ───────── watchlist pribadi
      if (cmd === 'animelist') {
        const D = db.get(), me = (D.users[m.sender] = D.users[m.sender] || []), sub = (q.split(/\s+/)[0] || '').toLowerCase(), arg = q.split(/\s+/).slice(1).join(' ').trim()
        if (['tambah', 'add', 'simpan'].includes(sub)) {
          if (!arg) return need('animelist tambah <judul>', 'animelist tambah frieren')
          if (me.length >= 50) return reply('Daftar penuh (maks 50). Hapus dulu: ' + prefix + 'animelist hapus <no>')
          const a = await findAnime(arg); if (!a) return reply(`Anime "${arg}" tidak ditemukan.`)
          if (me.some(x => x.id === a.mal_id)) return reply(`*${title(a)}* sudah ada di daftarmu.`)
          me.push({ id: a.mal_id, title: title(a), done: false }); db.save()
          return reply(`✓ *${title(a)}* masuk daftar tontonanmu (#${me.length}).`)
        }
        if (['selesai', 'done', 'tamat', 'hapus', 'del', 'delete'].includes(sub)) {
          const i = Number(arg) - 1; if (!(i >= 0 && me[i])) return reply(`Nomor tidak valid. Lihat daftar: ${prefix}animelist`)
          if (['hapus', 'del', 'delete'].includes(sub)) { const [r] = me.splice(i, 1); db.save(); return reply(`✓ *${r.title}* dihapus dari daftar.`) }
          me[i].done = !me[i].done; db.save(); return reply(`✓ *${me[i].title}* ditandai ${me[i].done ? 'sudah selesai ditonton' : 'belum selesai'}.`)
        }
        if (!me.length) return reply(`${ST.B('DAFTAR TONTONANKU')}\n${LINE}\nMasih kosong.\n${prefix}animelist tambah <judul>`)
        const todo = me.map((x, i) => [x, i]).filter(([x]) => !x.done), done = me.map((x, i) => [x, i]).filter(([x]) => x.done)
        return reply(`${ST.B('DAFTAR TONTONANKU')}\n${LINE}\n${todo.length ? '*Mau ditonton*\n' + todo.map(([x, i]) => `${i + 1}. ${x.title}`).join('\n') : ''}${done.length ? '\n\n*Sudah selesai*\n' + done.map(([x, i]) => `${i + 1}. ✓ ${x.title}`).join('\n') : ''}\n\n_${prefix}animelist tambah <judul> • selesai <no> • hapus <no>_`)
      }
    } catch (e) { console.log('[animeplus]', e.message); return reply('Gagal mengambil data anime: ' + e.message + '\n_Coba lagi sebentar lagi._') }
  },
}
