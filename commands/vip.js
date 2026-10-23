// VIP: orang yang tetap dilayani saat mode SELF. Khusus owner.
//   #vip add 0857xxxx   (atau reply / tag orangnya)
//   #vip del 0857xxxx
//   #vip list
const mask = n => (n.length > 8 ? n.slice(0, 4) + '••••' + n.slice(-3) : n)

function targetNumber(ctx, from) {
  const jid = ctx.quotedSender || ctx.mentioned[0]
  if (jid) return jid.split('@')[0].split(':')[0].replace(/\D/g, '')
  return ctx.config.normalizeNumber(ctx.args.slice(from).join(''))
}

async function run(ctx, sub, from) {
  const label = ctx.config.vipLabel
  const saved = ctx.db.get('vip', [])

  if (sub === 'add' || sub === 'tambah') {
    const num = targetNumber(ctx, from)
    if (num.length < 9) return ctx.reply(`Tulis nomornya, contoh:\n${ctx.prefix}vip add 0857xxxxxxx\n(atau reply / tag orangnya)`)
    if (ctx.config.vip.some(v => v.number === num) || saved.includes(num)) return ctx.reply(`${mask(num)} sudah ${label}.`)
    ctx.db.set('vip', [...saved, num])
    return ctx.reply(`✅ ${mask(num)} sekarang ${label}.\nTetap dilayani saat mode ${ctx.config.modeLabels.private}.`)
  }

  if (sub === 'del' || sub === 'hapus' || sub === 'remove') {
    const num = targetNumber(ctx, from)
    if (ctx.config.vip.some(v => v.number === num)) {
      return ctx.reply(`${mask(num)} ada di settings.js, hapus dari sana (lalu restart bot).`)
    }
    if (!saved.includes(num)) return ctx.reply(`${mask(num)} tidak ada di daftar ${label}.`)
    ctx.db.set('vip', saved.filter(n => n !== num))
    return ctx.reply(`🗑️ ${mask(num)} dihapus dari ${label}.`)
  }

  const fixed = ctx.config.vip.map(v => `• ${v.name} — ${mask(v.number)} _(settings.js)_`)
  const dyn = saved.map(n => `• ${mask(n)}`)
  const all = [...fixed, ...dyn]
  await ctx.reply(
    `👥 *Daftar ${label}* (tetap dilayani saat mode ${ctx.config.modeLabels.private})\n\n` +
      (all.length ? all.join('\n') : 'Belum ada.') +
      `\n\nTambah: ${ctx.prefix}vip add 08xxx\nHapus : ${ctx.prefix}vip del 08xxx`
  )
}

module.exports = [
  {
    name: 'vip',
    category: 'Owner',
    ownerOnly: true,
    usage: 'add/del/list',
    desc: 'Atur VIP (tetap dilayani saat mode SELF)',
    run: ctx => run(ctx, (ctx.args[0] || 'list').toLowerCase(), 1)
  },
  { name: 'addvip', hidden: true, ownerOnly: true, desc: 'Tambah VIP', run: ctx => run(ctx, 'add', 0) },
  { name: 'delvip', hidden: true, ownerOnly: true, desc: 'Hapus VIP', run: ctx => run(ctx, 'del', 0) },
  { name: 'listvip', hidden: true, ownerOnly: true, desc: 'Daftar VIP', run: ctx => run(ctx, 'list', 0) }
]
