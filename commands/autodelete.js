// #autodelete — atur berapa lama pesan bot dihapus otomatis (WhatsApp & Telegram)
const ad = require('../lib/autodel')

module.exports = [{
  name: 'autodelete',
  aliases: ['autodel', 'hapusotomatis', 'setdelete'],
  category: 'Owner',
  ownerOnly: true,
  usage: '[wa|tg] <30s|10m|1j|off> | menu|semua',
  desc: 'Atur waktu hapus otomatis pesan bot',
  async run(ctx) {
    const a = ctx.args.map(x => x.toLowerCase())
    const show = () => {
      const c = ad.load()
      return `🗑️ *HAPUS OTOMATIS*\n• WhatsApp : ${ad.fmt(c.wa)} (${c.scope === 'all' ? 'semua balasan bot' : 'hanya menu'})\n• Telegram : ${ad.fmt(c.tg)} (${c.tgScope === 'menu' ? 'pesan sementara + menu' : 'hanya pesan sementara ⏳🔎'})\n\n` +
        `Contoh:\n${ctx.prefix}autodelete 30m  → keduanya 30 menit\n${ctx.prefix}autodelete wa 10m\n${ctx.prefix}autodelete tg 2j\n${ctx.prefix}autodelete wa off\n` +
        `${ctx.prefix}autodelete semua  → WhatsApp: hapus semua balasan bot\n${ctx.prefix}autodelete menu  → WhatsApp: hanya menu\n${ctx.prefix}autodelete tg menu  → Telegram: menu ikut dihapus\n${ctx.prefix}autodelete tg sementara  → Telegram: hanya ⏳🔎 (bawaan)\n\nSatuan: s/detik, m/menit (bawaan), j/jam. Maks 7 hari.`
    }
    if (!a.length) return ctx.reply(show())
    if (['tg', 'telegram'].includes(a[0]) && ['menu', 'sementara'].includes(a[1])) { ad.set({ tgScope: a[1] === 'menu' ? 'menu' : 'temp' }); return ctx.reply('✅ Telegram: ' + (a[1] === 'menu' ? 'menu & pesan bertombol ikut dihapus.' : 'hanya pesan sementara (⏳🔎) yang dihapus; menu, lagu, gacha tetap.') + '\n\n' + show()) }
    if (a[0] === 'semua' || a[0] === 'all') { ad.set({ scope: 'all' }); return ctx.reply('✅ WhatsApp: semua balasan bot akan dihapus otomatis.\n\n' + show()) }
    if (a[0] === 'menu') { ad.set({ scope: 'menu' }); return ctx.reply('✅ WhatsApp: hanya pesan menu yang dihapus otomatis.\n\n' + show()) }
    let targets = ['wa', 'tg'], val = a[0]
    if (['wa', 'whatsapp', 'tg', 'telegram'].includes(a[0])) { targets = [/^w/.test(a[0]) ? 'wa' : 'tg']; val = a[1] }
    const s = ad.parse(val)
    if (s === null) return ctx.reply('❌ Durasi tidak dikenal.\n\n' + show())
    const patch = {}
    for (const t of targets) patch[t] = s
    ad.set(patch)
    await ctx.reply(`✅ Diatur: ${targets.map(t => (t === 'wa' ? 'WhatsApp' : 'Telegram')).join(' & ')} → ${ad.fmt(s)}\n\n` + show())
  }
}]
