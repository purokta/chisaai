/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .snip — SATU perintah untuk semua fitur kode (Studio Kode). Sub-perintah:
//   kode • file • info • contoh • tabel          tampilkan kode / tabel sebagai blok native WhatsApp ("Lihat kode")
//   cekjs • cekjson • rapi • mini • urut         periksa & rapikan JS/JSON (kode tidak pernah dijalankan)
//   simpan • <nama> • daftar • cari • ubahnama • hapus   buku snippet pribadi
//   rilis • unduh • repo                         GitHub: rilis terbaru, unduh aset, baca file repo
//   buat • ambil • lihat • proyek • isizip       berkas: kode→file, URL→file, zip proyek, isi zip
//   npm • regex • beda                           alat dev: info paket npm, uji regex, bandingkan kode
// Modul: lib/snip/{kode,cek,github,berkas,store}.js • tampilan native: lib/codeblock.js
const CB = require('../../lib/codeblock')
const MODS = { kode: require('../../lib/snip/kode'), cek: require('../../lib/snip/cek'), gh: require('../../lib/snip/github'), berkas: require('../../lib/snip/berkas'), store: require('../../lib/snip/store') }
// sub-perintah → [modul, nama perintah internal]
const MAP = {
  kode: ['kode', 'blokkode'], code: ['kode', 'blokkode'], file: ['kode', 'kodefile'], info: ['kode', 'infokode'], contoh: ['kode', 'contoh'], tabel: ['kode', 'tabel'],
  cekjs: ['cek', 'cekjs'], cekjson: ['cek', 'cekjson'], rapi: ['cek', 'jsonrapi'], mini: ['cek', 'jsonmini'], urut: ['cek', 'urutkunci'],
  rilis: ['gh', 'ghrelease'], unduh: ['gh', 'ghunduh'], repo: ['gh', 'ghkode'],
  buat: ['berkas', 'kodebuat'], ambil: ['berkas', 'ambilfile'], lihat: ['berkas', 'lihaturl'], proyek: ['berkas', 'projekzip'], isizip: ['berkas', 'isizip'],
  npm: ['berkas', 'npminfo'], regex: ['berkas', 'ujiregex'], beda: ['berkas', 'bedakode'], diff: ['berkas', 'bedakode'],
}
module.exports = {
  name: 'snip', alias: [], category: 'tools', noLimit: true, cmds: ['snip'],
  desc: 'Studio Kode (satu perintah): blok kode native "Lihat kode", tabel, cek JS/JSON, snippet pribadi, GitHub, buat file/zip, ambil file dari URL, npm, regex, diff',
  run: async (ctx) => {
    const raw = CB.rawArgs(ctx)
    const m = raw.match(/^\s*(\S+)[ \t]*\n?([\s\S]*)$/)
    const sub = m ? m[1].toLowerCase() : ''
    const hit = MAP[sub]
    if (!hit) return MODS.store.run(ctx)            // simpan / daftar / cari / <nama snippet> / bantuan
    const rest = m[2] || '', cmd = hit[1], prefix = ctx.prefix || '.'
    const args = rest.trim() ? rest.trim().split(/ +/) : []
    return MODS[hit[0]].run({ ...ctx, command: cmd, body: prefix + cmd + (rest ? ' ' + rest : ''), budy: prefix + cmd + (rest ? ' ' + rest : ''), args, text: args.join(' '), q: args.join(' ') })
  },
}
