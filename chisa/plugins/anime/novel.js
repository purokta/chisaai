/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .novel — baca novel / buku domain publik (Project Gutenberg) di chat + unduh EPUB (termasuk ilustrasi), PDF, atau TXT untuk offline.
//   .novel <judul / penulis> [--en|--id|--fr...]   cari           .novel <no>             detail + sampul
//   .novel baca [no] [hal]   baca di chat (±3500 huruf / halaman)  .novel lanjut           lanjut bacaan terakhir
//   .novel unduh [no] [epub|pdf|txt]               epub = paling lengkap (gambar & ilustrasi ikut)
const L = require('../../lib/bacalib'), K = require('../../lib/praktis'), { B } = require('../../lib/style')
const LINE = '━━━━━━━━━━━━━━━━━━━━', TTL = 60 * 60 * 1000
const sess = new Map(), busy = new Set()
const get = (jid) => { const s = sess.get(jid); if (s && Date.now() - s.t < TTL) { s.t = Date.now(); return s } sess.delete(jid); return null }
const put = (jid, patch) => { const s = get(jid) || { t: Date.now() }; Object.assign(s, patch, { t: Date.now() }); sess.set(jid, s); if (sess.size > 500) sess.delete(sess.keys().next().value); return s }
const fmtN = (n) => Number(n || 0).toLocaleString('id-ID')
const by = (b) => b.authors.slice(0, 2).join(' & ') || 'Anonim'
const langs = (b) => b.langs.map(l => L.langName(l)).join(', ') || '-'

async function sendCover(sock, m, url, caption) {
  try { const r = await L.getBuf(url, 2 * 1024 * 1024, { tries: 2, timeout: 15000 }); if (L.isImg(r.buffer)) return await sock.sendMessage(m.chat, { image: r.buffer, caption }, { quoted: m }) } catch {}
  return sock.sendMessage(m.chat, { text: caption }, { quoted: m })
}
const current = async (ctx, no) => {
  const s = get(ctx.m.sender)
  if (no) { if (!s || !s.results) return null; const b = s.results[no - 1]; if (!b) return null; put(ctx.m.sender, { book: b }); return b }
  if (s && s.book) return s.book
  return null
}
async function resolveBook(ctx, no) {
  let b = await current(ctx, no); if (b) return b
  const last = K.get(ctx.m.sender, 'novel', null)
  if (!no && last) { b = await L.novelGet(last.id); if (b) { put(ctx.m.sender, { book: b }); return b } }
  return null
}

async function doSearch(ctx, q, lang) {
  const { m, reply, prefix } = ctx, r = await L.novelSearch(q, lang)
  if (!r.list.length) return reply(`✕ Tidak ada buku bertemu "${q}"${lang ? ' (' + L.langName(lang) + ')' : ''}.\nCoba judul/penulis lain, atau bahasa Inggris (--en). Koleksi berbahasa Indonesia di Gutenberg sangat sedikit.`)
  put(m.sender, { results: r.list, book: null })
  const rows = r.list.map((b, i) => `${i + 1}. *${b.title}*\n   ${by(b)} • ${langs(b)} • ⬇ ${fmtN(b.downloads)}`)
  return reply(`${B('HASIL NOVEL')}\n${LINE}\n${rows.join('\n')}\n${LINE}\nPilih: *${prefix}novel <no>*   _(sumber: Project Gutenberg, domain publik)_`)
}
async function doPick(ctx, no) {
  const { sock, m, reply, prefix } = ctx, s = get(m.sender)
  if (!s || !s.results) return reply(`Belum ada hasil pencarian. Cari dulu: ${prefix}novel <judul>`)
  const b = s.results[no - 1]; if (!b) return reply(`✕ Nomor tidak valid (1-${s.results.length}).`)
  put(m.sender, { book: b })
  const cap = [B(b.title.toUpperCase().slice(0, 90)), LINE, `Penulis : ${by(b)}`, `Bahasa  : ${langs(b)}`, b.subjects.length ? `Subjek  : ${b.subjects.map(x => L.clip(x, 40)).join('; ')}` : '', `Unduhan : ⬇ ${fmtN(b.downloads)}`,
    b.summary ? '\n' + L.clip(b.summary, 420) : '', '', `*Baca di chat:* ${prefix}novel baca`, `*Simpan offline (+gambar):* ${prefix}novel unduh epub`, `_PDF: ${prefix}novel unduh pdf • TXT: ${prefix}novel unduh txt_`, `_${b.page}_`].filter(l => l !== '').join('\n')
  return sendCover(sock, m, b.cover, cap)
}
async function doRead(ctx, no, hal) {
  const { m, reply, prefix } = ctx, b = await resolveBook(ctx, no); if (!b) return reply(`Pilih buku dulu: ${prefix}novel <judul>, lalu ${prefix}novel <no>`)
  const t = await L.novelText(b), total = t.pages.length
  if (!total) return reply('✕ Teks buku ini tidak tersedia. Coba unduh epub.')
  const p = Math.min(Math.max(1, hal || 1), total)
  K.set(m.sender, 'novel', { id: b.id, title: b.title, page: p, total })
  const nav = p < total ? `Lanjut: *${prefix}novel baca ${p + 1}*  •  *${prefix}novel lanjut*` : 'Tamat ✦'
  return reply(`${B(b.title.slice(0, 60).toUpperCase())}\n_Halaman ${p}/${total}_\n${LINE}\n${t.pages[p - 1]}\n${LINE}\n${nav}\nSimpan offline: ${prefix}novel unduh epub`)
}
async function doContinue(ctx) {
  const { m, reply, prefix } = ctx, last = K.get(m.sender, 'novel', null)
  if (!last) return reply(`Belum ada riwayat baca. Mulai: ${prefix}novel <judul>`)
  const s = get(m.sender); if (!s || !s.book || s.book.id !== last.id) { const b = await L.novelGet(last.id); if (!b) return reply('✕ Buku terakhir tidak ditemukan lagi.'); put(m.sender, { book: b }) }
  if (last.page >= last.total) return reply(`Kamu sudah tamat *${last.title}* ✦\nCari buku lain: ${prefix}novel <judul>`)
  return doRead(ctx, 0, last.page + 1)
}
async function doDownload(ctx, no, fmt) {
  const { sock, m, reply, prefix } = ctx, b = await resolveBook(ctx, no); if (!b) return reply(`Pilih buku dulu: ${prefix}novel <judul>, lalu ${prefix}novel <no>`)
  await reply(`⏳ Menyiapkan *${b.title}* (${fmt.toUpperCase()})…`)
  let buf, mime, note
  if (fmt === 'epub') { buf = await L.novelEpub(b); mime = 'application/epub+zip'; note = '_EPUB: buka dengan Google Play Books, Apple Books, Moon+ Reader, Librera. Ilustrasi bawaan buku ikut tersimpan._' }
  else if (fmt === 'pdf') { buf = await L.novelPdf(b); mime = 'application/pdf'; note = '_PDF teks polos + sampul. Untuk ilustrasi / huruf non-Latin, pakai epub._' }
  else { const t = await L.novelText(b); buf = Buffer.from(t.raw, 'utf8'); mime = 'text/plain'; note = '_TXT polos tanpa gambar._' }
  if (buf.length > 95 * 1024 * 1024) return reply('✕ Berkas terlalu besar untuk dikirim lewat WhatsApp.')
  K.set(m.sender, 'novel', { ...(K.get(m.sender, 'novel', {})), id: b.id, title: b.title })
  return sock.sendMessage(m.chat, { document: buf, mimetype: mime, fileName: `${L.slug(b.title)}.${fmt}`, caption: `${B('NOVEL OFFLINE')}\n${b.title}\n${by(b)} • ${(buf.length / 1048576).toFixed(1)} MB\n${note}\n_Sumber: Project Gutenberg (domain publik)._` }, { quoted: m })
}

module.exports = {
  name: 'novel', alias: ['bacanovel', 'ebook', 'gutenberg', 'bukudigital', 'novelread'], category: 'anime', cmds: ['novel'],
  desc: 'Baca novel domain publik di chat + unduh EPUB (ilustrasi ikut) / PDF / TXT: .novel <judul> • <no> • baca • unduh epub',
  run: async (ctx) => {
    const { m, args, prefix, reply } = ctx, p = prefix + 'novel'
    const a = []; let lang = null, fmt = null
    for (const x of args) { const l = x.toLowerCase(); if (/^--[a-z]{2}$/.test(l)) lang = l.slice(2); else if (/^(epub|pdf|txt)$/.test(l) && args[0] && /^(unduh|download|dl|simpan|offline)$/i.test(args[0])) fmt = l; else a.push(x) }
    const sub = (a[0] || '').toLowerCase()
    if (!a.length) return reply([B('BACA NOVEL'), LINE, `${p} <judul / penulis> [--en|--id]  — cari`, `${p} <no>  — detail + sampul`, `${p} baca [no] [halaman]  — baca di chat`, `${p} lanjut  — lanjut bacaan terakhir`, `${p} unduh [no] [epub|pdf|txt]  — simpan offline`, '', `Contoh: ${p} alice in wonderland`, `        ${p} sherlock holmes`, '_Sumber Project Gutenberg: puluhan ribu buku domain publik, banyak berilustrasi (lewat EPUB)._'].join('\n'))
    if (busy.has(m.sender)) return reply('⏳ Proses sebelumnya masih berjalan, tunggu selesai dulu.')
    busy.add(m.sender)
    try {
      if (/^\d{1,2}$/.test(sub) && a.length === 1) return await doPick(ctx, +sub)
      if (['baca', 'read', 'buka'].includes(sub)) { const n = a.slice(1).map(Number).filter(Number.isFinite); return n.length >= 2 ? await doRead(ctx, n[0], n[1]) : await doRead(ctx, 0, n[0]) }
      if (['lanjut', 'continue', 'terakhir'].includes(sub)) return await doContinue(ctx)
      if (['unduh', 'download', 'dl', 'simpan', 'offline'].includes(sub)) { const n = parseInt(a[1], 10); return await doDownload(ctx, n >= 1 ? n : 0, fmt || 'epub') }
      return await doSearch(ctx, a.join(' ').slice(0, 100), lang)
    } catch (e) {
      console.log('[novel]', e.message)
      return reply(e.code === 'ETOOBIG' ? '✕ Berkas terlalu besar untuk diambil.' : '✕ Gagal: ' + e.message)
    } finally { busy.delete(m.sender) }
  },
}
