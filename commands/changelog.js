// .changelog — riwayat update bot. Sumber: CHANGELOG.md (tiap "## versi — tanggal" = satu rilis)
const fs = require('fs')
const path = require('path')

const FILE = path.join(__dirname, '..', 'CHANGELOG.md')
const version = () => {
  try { return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')).version } catch { return '?' }
}

function parse() {
  let raw = ''
  try { raw = fs.readFileSync(FILE, 'utf8') } catch { return [] }
  return raw.split(/^## /m).map(s => s.trim()).filter(Boolean).map(block => {
    const [head, ...rest] = block.split('\n')
    return { head: head.trim(), ver: (head.match(/^[0-9][0-9a-z.]*/i) || [''])[0], body: rest.map(l => l.trimEnd()).filter(Boolean).join('\n') }
  })
}

module.exports = {
  name: 'changelog',
  aliases: ['versi', 'riwayat'],
  category: 'Info',
  usage: '[versi | semua]',
  desc: 'Lihat riwayat update bot',
  async run(ctx) {
    const list = parse()
    const p = ctx.prefix
    if (!list.length) return ctx.reply(`📜 *Changelog*\nVersi sekarang: *v${version()}*\n(CHANGELOG.md tidak ditemukan)`)
    const a = (ctx.args[0] || '').toLowerCase().replace(/^v/, '')
    if (a === 'semua' || a === 'all') {
      return ctx.reply(`📜 *Riwayat update* (sekarang v${version()})\n\n` + list.map(r => `• v${r.head}`).join('\n') + `\n\nDetail: ${p}changelog <versi>`)
    }
    if (a) {
      const r = list.find(x => x.ver === a || x.ver.startsWith(a))
      if (!r) return ctx.reply(`Versi "${a}" tidak ada. Lihat daftar: ${p}changelog semua`)
      return ctx.reply(`📜 *v${r.head}*\n${r.body}`)
    }
    const top = list.slice(0, 3)
    await ctx.reply(`📜 *Update terbaru* (v${version()})\n\n` + top.map(r => `*v${r.head}*\n${r.body}`).join('\n\n') + `\n\n${p}changelog semua • ${p}changelog <versi>`)
  }
}
