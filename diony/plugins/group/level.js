/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Level grup — SATU SISTEM dengan RPG. Setiap pesan memberi sedikit EXP (jeda 60 detik per orang).
// Level, rank, dan EXP selalu diambil dari karakter RPG, jadi kartu canvas, notif naik level, dan profil PASTI sama.
// Yang belum punya karakter RPG tetap dihitung XP obrolannya (sistem lama) dan diajak .rpgstart.
//   .level [@user]        kartu level + progres        .lbgrup   papan peringkat grup
//   .levelup <on|off>     (admin) umumkan naik level   .resetlevel (admin) kosongkan XP obrolan grup ini
const DB = require('../../lib/jsondb')('level'), K = require('../../lib/praktis')
const RC = require('../../lib/rpgctx'), R = RC.R, UI = require('../../lib/rpgui'), { G, fmt } = UI
const S = require('../../lib/settingsdb')

// sistem lama (hanya untuk yang belum punya karakter RPG)
const need = (lv) => 100 * lv * lv
const levelOf = (xp) => Math.floor(Math.sqrt(Math.max(0, xp) / 100))
const g = (chat) => (DB.data[chat] = DB.data[chat] || { on: true, u: {} })
const name = (jid) => '@' + String(jid).split('@')[0]
const last = new Map()
const when = () => new Date().toLocaleDateString('id-ID', { timeZone: S.get('timezone'), day: 'numeric', month: 'short', year: 'numeric' })
// skor urut papan peringkat: karakter RPG dinilai dari level lalu EXP; yang belum punya RPG di bawahnya
const score = (j, xp) => { const r = R.get(j); return r ? [1, r.level, r.exp] : [0, levelOf(xp), xp] }
const cmp = (a, b) => { for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return b[i] - a[i]; return 0 }

module.exports = {
  name: 'level', alias: ['xp', 'rankgrup', 'kartulevel', 'lbgrup', 'peringkat', 'topxp', 'levelup', 'resetlevel'], category: 'group', group: true, noLimit: true,
  cmds: ['level', 'lbgrup', 'levelup', 'resetlevel'],
  desc: 'Level & rank grup (sama dengan RPG): .level, .lbgrup, .levelup on|off, .resetlevel',
  run: async (ctx) => {
    const { sock, m, command, args, prefix, reply, isAdmins, isOwner } = ctx
    const gr = g(m.chat)
    if (command === 'levelup') {
      if (!isAdmins && !isOwner) return reply(global.mess.admin)
      const v = (args[0] || '').toLowerCase(); if (!['on', 'off'].includes(v)) return UI.say(ctx, { glyph: G.ankh, title: 'Notif Naik Level', quote: [`Status: *${gr.on ? 'aktif' : 'mati'}*`], hint: `Ubah: ${prefix}levelup on | off` })
      gr.on = v === 'on'; DB.save(); return UI.say(ctx, { glyph: G.ankh, title: 'Notif Naik Level', quote: [`Pengumuman naik level *${gr.on ? 'diaktifkan' : 'dimatikan'}*`, 'EXP tetap dihitung.'] })
    }
    if (command === 'resetlevel') {
      if (!isAdmins && !isOwner) return reply(global.mess.admin)
      delete DB.data[m.chat]; DB.save(); return UI.say(ctx, { glyph: G.cobra, title: 'Reset Level', quote: ['XP obrolan grup ini dikosongkan.', 'Level karakter RPG tidak ikut terhapus.'] })
    }
    if (['lbgrup', 'peringkat', 'topxp'].includes(command)) {
      const rows = Object.entries(gr.u).sort((a, b) => cmp(score(a[0], a[1]), score(b[0], b[1]))).slice(0, 10)
      if (!rows.length) return reply('Belum ada XP di grup ini. Ayo ngobrol!')
      const medal = ['𝐈', '𝐈𝐈', '𝐈𝐈𝐈']
      return UI.say(ctx, { glyph: G.lion, title: 'Peringkat Level', sub: 'grup ini', mentions: rows.map(r => r[0]),
        quote: rows.map(([j, xp], i) => { const r = R.get(j); return `${medal[i] || (i + 1) + '.'} ${name(j)} — ${r ? `Lv *${r.level}* • Rank ${R.rankOf(r.level).tier} • ${fmt(r.exp)} EXP` : `Lv ${levelOf(xp)} • ${fmt(xp)} XP (belum RPG)`}` }),
        hint: `Level = level karakter RPG. Belum punya? ${prefix}rpgstart` })
    }
    const target = K.mentions(m)[0] || (m.quoted && m.quoted.sender) || m.sender
    const ru = R.get(target), xp = gr.u[target] || 0
    const rank = Object.entries(gr.u).filter(([j, v]) => cmp(score(j, v), score(target, xp)) < 0).length + 1
    if (ru) {
      // kartu canvas profil (level & rank dari RPG)
      const r = R.rankOf(ru.level), nr = R.nextRank(ru.level)
      const caption = UI.compose({ glyph: G.eye, title: 'Kartu Level', sub: ru.name, mentions: [target],
        quote: [`${name(target)}`, `Level *${ru.level}*  •  Rank *${r.tier}* (${r.name})`, `EXP ${fmt(ru.exp)} / ${fmt(R.expNeed(ru.level))}  ${K.bar(ru.exp / R.expNeed(ru.level), 12)}`, nr && `Rank berikutnya *${nr.tier}* di Lv.${nr.min}`, `Peringkat grup *#${rank}* dari ${Object.keys(gr.u).length}`] })
      try {
        const img = await RC.cardFor(sock, target, ru, ru.name, 'KARTU LEVEL', when())
        return await sock.sendMessage(m.chat, { image: img, caption, mentions: [target] }, { quoted: m })
      } catch (e) { console.log('[level card]', e.message); return sock.sendMessage(m.chat, { text: caption, mentions: [target] }, { quoted: m }) }
    }
    const lv = levelOf(xp), a = need(lv), b = need(lv + 1)
    return UI.say(ctx, { glyph: G.eye, title: 'Kartu Level', sub: 'belum punya karakter RPG', mentions: [target],
      quote: [name(target), `Level *${lv}*  •  XP ${fmt(xp)} / ${fmt(b)}`, `${K.bar((xp - a) / (b - a), 14)} ${Math.round((xp - a) / (b - a) * 100)}%`, `Peringkat grup *#${rank}* dari ${Object.keys(gr.u).length}`],
      hint: `Buat karakter dengan ${prefix}rpgstart agar level, rank & canvas-mu sama dengan RPG` })
  },
  before: async ({ sock, m, budy, isGroup }) => {
    if (!isGroup || !budy || budy.length < 2) return false
    const gr = g(m.chat), key = m.chat + m.sender, now = Date.now()
    if (now - (last.get(key) || 0) < 60000) return false
    last.set(key, now)
    const old = gr.u[m.sender] || 0, add = 5 + Math.floor(Math.random() * 11)
    gr.u[m.sender] = old + add; DB.save()
    const ru = R.get(m.sender)
    if (ru) {
      // pemain RPG: obrolan = EXP RPG (tanpa pengali hadiah, supaya tidak jadi celah farming)
      const ex = R.addExp(ru, add, { raw: true })
      if (ex.up && gr.on) {
        const ctx = { sock, m }, o = { glyph: G.ankh, title: 'Naik Level', sub: ru.name, mentions: [m.sender], tone: 'levelup', headline: 'Level Up!', ex, cardSub: `Selamat, ${ru.name}!`, log: ['Naik level lewat obrolan di grup'],
          quote: [`Selamat ${name(m.sender)}!`], chips: [{ l: 'Level', v: `Lv.${ex.lvl}`, c: '#fde047' }, { l: 'Rank', v: `${ex.rank.tier} (${ex.rank.name})`, c: ex.rank.color }, { l: 'Stat point', v: `+${ex.pts}`, c: '#34d399' }] }
        UI.send(ctx, ru, o).catch(() => {})
      }
      return false
    }
    const a = levelOf(old), b = levelOf(old + add)
    if (b > a && gr.on) UI.say({ sock, m }, { glyph: G.ankh, title: 'Naik Level', mentions: [m.sender], quote: [`Selamat ${name(m.sender)}! Naik ke *Level ${b}*`, 'Buat karakter RPG agar levelmu tampil di canvas & rank guild.'], hint: '.rpgstart' }).catch(() => {})
    return false   // jangan hentikan hook lain (game dll.)
  },
}
