// Pengaturan owner: ban / limit / backup
const limits = require('../lib/limits')
const backup = require('../lib/backup')
const group = require('../lib/group')

const mask = n => (n.length > 6 ? n.slice(0, 4) + '****' + n.slice(-3) : n)
const mb = n => (n / 1024).toFixed(0) + ' KB'

function targetNums(ctx) {
  const out = group.targets(ctx).map(limits.numOf)
  return out.length ? out : []
}

module.exports = [
  {
    name: 'ban',
    category: 'Owner',
    ownerOnly: true,
    usage: '@orang',
    desc: 'Blokir pengguna dari bot',
    async run(ctx) {
      const t = targetNums(ctx)
      if (!t.length) return ctx.reply(`Tag / reply / tulis nomornya.\nContoh: ${ctx.prefix}ban 08123456789`)
      const mine = new Set([limits.numOf(ctx.sock.user?.id), limits.numOf(ctx.config.owner.number)])
      const ok = t.filter(n => !mine.has(n))
      ok.forEach(limits.ban)
      await ctx.reply(ok.length ? `🚫 ${ok.map(mask).join(', ')} diblokir dari bot.` : 'Owner / bot tidak bisa diblokir.')
    }
  },
  {
    name: 'unban',
    category: 'Owner',
    ownerOnly: true,
    usage: '@orang',
    desc: 'Buka blokir pengguna',
    async run(ctx) {
      const t = targetNums(ctx)
      if (!t.length) return ctx.reply(`Tag / reply / tulis nomornya.\nContoh: ${ctx.prefix}unban 08123456789`)
      t.forEach(limits.unban)
      await ctx.reply(`✅ ${t.map(mask).join(', ')} dibuka blokirnya.`)
    }
  },
  {
    name: 'banlist',
    category: 'Owner',
    ownerOnly: true,
    hidden: true,
    desc: 'Daftar pengguna yang diblokir',
    async run(ctx) {
      const b = [...limits.bannedSet()]
      await ctx.reply(b.length ? '🚫 *DIBLOKIR*\n' + b.map(n => '• ' + mask(n)).join('\n') : 'Tidak ada yang diblokir.')
    }
  },
  {
    name: 'limit',
    category: 'Lainnya',
    desc: 'Sisa jatah pemakaian hari ini',
    async run(ctx) {
      if (ctx.isOwner || ctx.isVip) return ctx.reply('♾️ Kamu tanpa batas.')
      const max = limits.dailyLimit()
      if (max <= 0) return ctx.reply('♾️ Tidak ada batas pemakaian.')
      const used = limits.usageOf(limits.numOf(ctx.sender))
      await ctx.reply(`📊 Limit hari ini: *${Math.max(0, max - used)}* tersisa dari ${max}\nReset jam 00:00 WIB.`)
    }
  },
  {
    name: 'setlimit',
    category: 'Owner',
    ownerOnly: true,
    usage: '<jumlah>',
    desc: 'Atur batas perintah per hari (0 = tanpa batas)',
    async run(ctx) {
      const n = Number(ctx.args[0])
      if (ctx.args[0] !== undefined && Number.isInteger(n) && n >= 0) ctx.db.set('limitDaily', n)
      const now = limits.dailyLimit()
      await ctx.reply(`📊 Batas harian: *${now > 0 ? now + ' perintah/orang' : 'tanpa batas'}*\nUbah: ${ctx.prefix}setlimit 50  (owner & VIP selalu bebas)`)
    }
  },
  {
    name: 'backup',
    category: 'Owner',
    ownerOnly: true,
    desc: 'Simpan cadangan login (session) ke Download',
    async run(ctx) {
      await ctx.react('⏳')
      const r = await backup.run()
      await ctx.reply(`✅ Backup tersimpan (${mb(r.size)}):\n${r.file}\n\nFile ini berisi login bot, simpan baik-baik dan jangan dibagikan.\nPulihkan: bash restore.sh`)
    }
  }
]
