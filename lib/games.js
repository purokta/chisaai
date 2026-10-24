// Mesin game tebak-tebakan: satu game aktif per chat, jawaban dibaca dari chat biasa
const path = require('path')
const db = require('./db')
const fruit = require('./fruit')

const TIME = 60000
const POINT = 100
const active = new Map() // chatJid -> { type, answer, timer, hinted }

const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '')
const pick = a => a[Math.floor(Math.random() * a.length)]
const load = name => require(path.join(__dirname, '..', 'gamedata', name + '.json'))

const TYPES = {
  tebakkata: { title: 'Tebak Kata', file: 'tebakkata', q: x => ({ text: x.soal, answer: x.jawaban }) },
  asahotak: { title: 'Asah Otak', file: 'asahotak', q: x => ({ text: x.soal, answer: x.jawaban }) },
  caklontong: {
    title: 'Cak Lontong',
    file: 'caklontong',
    q: x => ({ text: x.soal, answer: x.jawaban, extra: x.deskripsi })
  },
  susunkata: {
    title: 'Susun Kata',
    file: 'susunkata',
    q: x => ({ text: `${x.soal}\nTipe: ${x.tipe}`, answer: x.jawaban })
  },
  tebakgambar: {
    title: 'Tebak Gambar',
    file: 'tebakgambar',
    q: x => ({ image: x.img, text: 'Gambar apa ini?', answer: x.jawaban, extra: x.deskripsi })
  },
  tebakbendera: {
    title: 'Tebak Bendera',
    file: 'tebakbendera',
    q: x => ({
      image: `https://flagcdn.com/w320/${String(x.flag).toLowerCase()}.png`,
      text: 'Bendera negara apa ini?',
      answer: x.name
    })
  }
}

async function start(ctx, type) {
  const t = TYPES[type]
  if (!t) throw new Error('Game tidak dikenal')
  if (active.has(ctx.jid)) {
    return ctx.reply(`Masih ada game berjalan di chat ini. Jawab dulu atau ketik *${ctx.prefix}nyerah*.`)
  }
  const q = t.q(pick(load(t.file)))
  const caption =
    `🎮 *${t.title.toUpperCase()}*\n\n${q.text}\n\n` +
    `⏱️ ${TIME / 1000} detik • ketik jawabanmu langsung\n` +
    `💡 *${ctx.prefix}hint* untuk petunjuk • *${ctx.prefix}nyerah* untuk menyerah`
  const game = { type, title: t.title, answer: q.answer, extra: q.extra, hinted: false }
  game.timer = setTimeout(async () => {
    if (active.get(ctx.jid) !== game) return
    active.delete(ctx.jid)
    try {
      await ctx.sock.sendMessage(ctx.jid, { text: `⏰ Waktu habis!\nJawabannya: *${game.answer}*${game.extra ? '\n' + game.extra : ''}` })
    } catch {}
  }, TIME)
  active.set(ctx.jid, game)
  try {
    if (q.image) await ctx.send({ image: { url: q.image }, caption })
    else await ctx.reply(caption)
  } catch (e) {
    clearTimeout(game.timer)
    active.delete(ctx.jid)
    throw e
  }
}

function addScore(ctx) {
  const all = db.get('scores', {})
  const who = String(ctx.sender).split('@')[0].split(':')[0]
  const g = (all[ctx.jid] ||= {})
  g[who] = (g[who] || 0) + POINT
  db.set('scores', all)
  return g[who]
}

async function check(ctx, text) {
  const game = active.get(ctx.jid)
  if (!game || ctx.fromMe) return false
  if (norm(text) !== norm(game.answer)) return false
  clearTimeout(game.timer)
  active.delete(ctx.jid)
  const total = addScore(ctx)
  const rw = fruit.reward(String(ctx.sender).split('@')[0].split(':')[0].replace(/\D/g, ''))
  const hadiah =
    `\n⭐ +${rw.exp} EXP` +
    (rw.drop ? `  ${rw.drop.emoji} dapat ${rw.drop.name}!` : '') +
    (rw.levelUp ? `\n🎉 *LEVEL UP!* Lv ${rw.from} → Lv ${rw.to}` : '')
  await ctx.sock.sendMessage(
    ctx.jid,
    {
      text:
        `✅ Benar! @${String(ctx.sender).split('@')[0].split(':')[0]} +${POINT} poin (total ${total})\n` +
        `Jawaban: *${game.answer}*${game.extra ? '\n' + game.extra : ''}${hadiah}`,
      mentions: [ctx.sender]
    },
    { quoted: ctx.m }
  )
  return true
}

function giveUp(ctx) {
  const game = active.get(ctx.jid)
  if (!game) return null
  clearTimeout(game.timer)
  active.delete(ctx.jid)
  return game
}

function hint(ctx) {
  const game = active.get(ctx.jid)
  if (!game) return null
  const a = String(game.answer)
  game.hinted = true
  return a.replace(/[A-Za-z0-9]/g, (c, i) => (i === 0 || i === a.length - 1 ? c : '_'))
}

function board(chatJid, n = 10) {
  const g = db.get('scores', {})[chatJid] || {}
  return Object.entries(g).sort((a, b) => b[1] - a[1]).slice(0, n)
}

module.exports = { TYPES, start, check, giveUp, hint, board, active }
