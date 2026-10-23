// Perintah sistem (khusus owner, tersembunyi dari menu): #update dan #restart
const { execFile } = require('child_process')
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const version = () => {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version
  } catch {
    return '?'
  }
}
const supervised = () => !!process.env.CHISA_SUPERVISED

module.exports = [
  {
    name: 'restart',
    hidden: true,
    ownerOnly: true,
    desc: 'Mulai ulang bot',
    async run(ctx) {
      if (!supervised()) {
        return ctx.reply('Bot dijalankan tanpa start.sh, jadi tidak bisa restart sendiri.\nMatikan (Ctrl+C) lalu jalankan: npm start')
      }
      await ctx.reply('🔄 Memulai ulang bot...')
      setTimeout(() => process.exit(2), 1500)
    }
  },
  {
    name: 'update',
    hidden: true,
    ownerOnly: true,
    desc: 'Update bot dari link zip di settings.js (update.url)',
    async run(ctx) {
      const url = ctx.config.update?.url
      if (!url) {
        return ctx.reply(
          '⚙️ Link update belum diisi.\n\n' +
            'Cara 1 (tanpa link): kirim zip baru ke HP, lalu di Termux:\n  cd ~/chisa-ai && bash update.sh\n\n' +
            'Cara 2: isi update.url di settings.js dengan link unduh zip (mis. repo GitHub kamu), restart bot, lalu kirim #update lagi.'
        )
      }
      await ctx.react('⏳')
      await ctx.reply('⬇️ Mengunduh & memasang update...')
      const before = version()
      const log = await new Promise((resolve, reject) => {
        execFile('bash', [path.join(ROOT, 'update.sh'), url], { cwd: ROOT, timeout: 10 * 60 * 1000, maxBuffer: 1 << 24 }, (err, stdout, stderr) => {
          if (err) {
            err.userMessage = 'Update gagal: ' + String(stderr || stdout || err.message).trim().split('\n').slice(-3).join(' | ').slice(0, 300)
            return reject(err)
          }
          resolve(stdout)
        })
      })
      const after = version()
      await ctx.react('✅')
      if (supervised()) {
        await ctx.reply(`✅ Update selesai: v${before} → v${after}\n🔄 Memulai ulang bot...`)
        setTimeout(() => process.exit(2), 1500)
      } else {
        await ctx.reply(`✅ Update selesai: v${before} → v${after}\nMatikan bot (Ctrl+C) lalu jalankan lagi: npm start`)
      }
      return log
    }
  }
]
