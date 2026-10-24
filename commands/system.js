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
    name: 'stop',
    aliases: ['matikan', 'shutdown'],
    category: 'Owner',
    ownerOnly: true,
    desc: 'Matikan bot (jalankan lagi: npm start)',
    async run(ctx) {
      await ctx.reply('🛑 Bot dimatikan.\nNyalakan lagi di Termux: cd ~/chisa-ai && npm start')
      setTimeout(() => process.exit(0), 1500)
    }
  },
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
    name: 'deploy',
    aliases: ['push', 'gitpush'],
    category: 'Owner',
    hidden: true,
    ownerOnly: true,
    usage: '[pesan commit] [paksa]',
    desc: 'Push kode bot ke GitHub (repo di settings.js → github)',
    async run(ctx) {
      const gh = ctx.config.github || {}
      if (!gh.token && !process.env.GITHUB_TOKEN) {
        return ctx.reply(
          '⚙️ Token GitHub belum diisi.\n\n1. Buat token: github.com/settings/tokens/new (centang "repo")\n2. Di Termux: nano ~/chisa-ai/settings.js lalu tambahkan\n   github: { token: \'ghp_xxxx\' },\n3. #restart, lalu kirim #deploy lagi.\n\n⚠️ Jangan kirim token lewat chat.'
        )
      }
      let args = [...ctx.args]
      const force = args[args.length - 1]?.toLowerCase() === 'paksa'
      if (force) args.pop()
      const msg = args.join(' ').slice(0, 120)
      await ctx.react('⏳')
      const out = await new Promise((resolve, reject) => {
        const a = [path.join(ROOT, 'deploy.sh'), msg || '']
        if (force) a.push('paksa')
        execFile('bash', a, { cwd: ROOT, timeout: 5 * 60 * 1000, maxBuffer: 1 << 24 }, (err, stdout, stderr) => {
          const scrub = t => String(t || '').split(gh.token || '\u0000').join('***').trim()
          if (err) {
            err.userMessage = 'Deploy gagal: ' + scrub(stderr || stdout || err.message).split('\n').slice(-3).join(' | ').slice(0, 300)
            return reject(err)
          }
          resolve(scrub(stdout))
        })
      })
      await ctx.react('✅')
      await ctx.reply('🚀 ' + out.split('\n').slice(-1)[0])
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
