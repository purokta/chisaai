/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Buku Snippet pribadi — simpan potongan kode, tampilkan lagi sebagai blok kode native.
//   .snip simpan <nama> [bahasa] <kode>  (atau reply kode)   .snip <nama>   .snip daftar
//   .snip hapus <nama>    .snip ubahnama <lama> <baru>     .snip cari <kata>
// Disimpan per pengguna di lib/database/snippet.json (isi snippet milik sendiri; tidak dibagikan ke orang lain).
const CB = require('../codeblock'), db = require('../jsondb')('snippet'), { B } = require('../style')

const MAX_PER_USER = 40, MAX_LEN = 12000
const RESERVED = new Set(['kode', 'code', 'file', 'info', 'contoh', 'tabel', 'cekjs', 'cekjson', 'rapi', 'mini', 'urut', 'rilis', 'unduh', 'repo', 'buat', 'ambil', 'lihat', 'proyek', 'isizip', 'npm', 'regex', 'beda', 'diff', 'simpan', 'save', 'tambah', 'hapus', 'del', 'delete', 'daftar', 'list', 'cari', 'search', 'ubahnama', 'rename', 'bantuan', 'help'])
const key = (n) => String(n || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 30)
const mine = (uid) => (db.data[uid] = db.data[uid] || {})
const quotedText = (m) => (m.quoted && (m.quoted.text || m.quoted.caption || m.quoted.conversation)) || ''

module.exports = {
  
  run: async (ctx) => {
    const { sock, m, prefix, reply } = ctx
    const P = prefix || '.', uid = m.sender
    const raw = CB.rawArgs(ctx)
    const first = (raw.match(/^\s*(\S+)/) || [])[1] || ''
    const sub = first.toLowerCase()
    const rest = raw.replace(/^\s*\S+[ \t]*\n?/, '')
    const box = mine(uid)

    if (!sub || sub === 'bantuan' || sub === 'help') return reply(`${B('SNIP — STUDIO KODE')}
Semua fitur kode ada di satu perintah: ${P}snip <menu>

${B('Tampilkan kode (kotak "Lihat kode")')}
${P}snip kode [bahasa] <kode>   (atau reply pesan kode)
${P}snip file      reply dokumen kode
${P}snip info <kode>   statistik kode
${P}snip contoh [topik]   template kode siap pakai
${P}snip tabel <data>   tabel native

${B('Periksa & rapikan (kode tidak dijalankan)')}
${P}snip cekjs <kode>    ${P}snip cekjson <json>
${P}snip rapi [2|4|tab] <json>    ${P}snip mini <json>    ${P}snip urut <json>

${B('Buku snippet pribadi')} (${Object.keys(box).length}/${MAX_PER_USER})
${P}snip simpan <nama> [bahasa] <kode>  (atau reply)
${P}snip <nama>    ${P}snip daftar    ${P}snip cari <kata>
${P}snip ubahnama <lama> <baru>    ${P}snip hapus <nama>

${B('GitHub')}
${P}snip rilis <pemilik/repo>    info rilis terbaru + aset
${P}snip unduh <pemilik/repo> [no]    unduh aset rilis
${P}snip repo <pemilik/repo> <path>    baca file / folder repo

${B('Berkas')}
${P}snip buat <nama.js> <kode>    ubah kode jadi file dokumen (atau reply)
${P}snip ambil <url> [nama]    unduh file dari URL
${P}snip lihat <url>    tampilkan file teks dari URL sebagai kode
${P}snip proyek <nama>    beberapa file (=== path) → satu .zip
${P}snip isizip [path]    reply .zip → daftar isi / buka satu file

${B('Alat dev')}
${P}snip npm <paket>    info paket npm
${P}snip regex /pola/g <teks>    uji regex
${P}snip beda    bandingkan dua kode`)

    if (sub === 'daftar' || sub === 'list') {
      const names = Object.keys(box).sort()
      if (!names.length) return reply(`📭 Belum ada snippet. Mulai dengan ${P}snip simpan <nama> <kode>`)
      return CB.sendTable(sock, m, { intro: `🗂️ *Snippet kamu* (${names.length}/${MAX_PER_USER})`, rows: [['Nama', 'Bahasa', 'Baris'], ...names.map(n => [n, CB.langTitle(box[n].lang), String(box[n].code.split('\n').length)])], outro: `Lihat: ${P}snip <nama>` })
    }

    if (sub === 'simpan' || sub === 'save' || sub === 'tambah') {
      const nm = key((rest.match(/^\s*(\S+)/) || [])[1])
      if (nm && RESERVED.has(nm)) return reply(`✕ Nama *${nm}* dipakai sub-perintah. Pilih nama lain.`)
      if (!nm) return reply(`✕ Beri nama snippet.\nContoh: ${P}snip simpan halo js\nconsole.log('halo')`)
      let body = rest.replace(/^\s*\S+[ \t]*\n?/, '')
      let lang = null
      if (/```/.test(body)) { const f = CB.unfence(body); body = f.code; lang = f.lang } else { const sp = CB.splitLang(body); body = sp.code; lang = sp.lang }
      if (!body.trim()) { const q = quotedText(m); if (/```/.test(q)) { const f = CB.unfence(q); body = f.code; lang = lang || f.lang } else body = q }
      body = body.replace(/\r\n/g, '\n').replace(/^\n+|\s+$/g, '')
      if (!body) return reply('✕ Tidak ada kode untuk disimpan. Tulis kode setelah nama, atau reply pesan berisi kode.')
      if (body.length > MAX_LEN) return reply(`✕ Snippet terlalu panjang (maks ${MAX_LEN} karakter).`)
      if (!box[nm] && Object.keys(box).length >= MAX_PER_USER) return reply(`✕ Batas ${MAX_PER_USER} snippet tercapai. Hapus yang tidak dipakai: ${P}snip hapus <nama>`)
      const baru = !box[nm]
      box[nm] = { lang: lang || CB.detectLang(body), code: body, t: Date.now() }
      db.save()
      return reply(`✅ Snippet *${nm}* ${baru ? 'disimpan' : 'diperbarui'} (${CB.langTitle(box[nm].lang)}, ${body.split('\n').length} baris).\nTampilkan: ${P}snip ${nm}`)
    }

    if (sub === 'hapus' || sub === 'del' || sub === 'delete') {
      const nm = key(rest.trim().split(/\s+/)[0])
      if (!nm || !box[nm]) return reply('✕ Snippet tidak ditemukan.')
      delete box[nm]; db.save(); return reply(`🗑️ Snippet *${nm}* dihapus.`)
    }

    if (sub === 'ubahnama' || sub === 'rename') {
      const [a, b] = rest.trim().split(/\s+/).map(key)
      if (!a || !b) return reply(`Format: ${P}snip ubahnama <lama> <baru>`)
      if (!box[a]) return reply('✕ Snippet lama tidak ditemukan.')
      if (box[b]) return reply('✕ Nama baru sudah dipakai.')
      box[b] = box[a]; delete box[a]; db.save(); return reply(`✅ *${a}* → *${b}*`)
    }

    if (sub === 'cari' || sub === 'search') {
      const w = rest.trim().toLowerCase(); if (!w) return reply(`Format: ${P}snip cari <kata>`)
      const hit = Object.keys(box).filter(n => n.includes(w) || box[n].code.toLowerCase().includes(w)).sort().slice(0, 20)
      if (!hit.length) return reply(`🔍 Tidak ada snippet yang memuat "${w}".`)
      return reply(`🔍 ${B('HASIL CARI')} "${w}"\n${hit.map(n => `• ${n} (${CB.langTitle(box[n].lang)})`).join('\n')}\n\nLihat: ${P}snip <nama>`)
    }

    const nm = key(first)
    const s = box[nm]
    if (!s) return reply(`✕ Snippet *${first}* tidak ada. Lihat daftar: ${P}snip daftar`)
    return CB.sendCode(sock, m, { intro: `🗂️ *${nm}* — ${CB.langTitle(s.lang)}, ${s.code.split('\n').length} baris`, code: s.code, lang: s.lang, react: '🗂️' })
  },
}
