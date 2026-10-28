/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Reputasi: +1 per hari ke teman, papan peringkat
const K = require('../../lib/praktis'), { B } = require('../../lib/style')
const tag = (j) => '@' + String(j).split('@')[0]
module.exports = {
  name: 'rep', alias: ['reputasi', 'toprep', 'cekrep'], category: 'praktis', noLimit: true, cmds: ['rep', 'toprep'],
  desc: 'Beri +1 reputasi ke teman (1x sehari) dan lihat peringkat reputasi',
  run: async ({ sock, m, command, prefix, reply }) => {
    const say = (text, mentions = []) => sock.sendMessage(m.chat, { text, mentions }, { quoted: m })
    if (command === 'toprep') {
      const top = Object.entries(K.all()).filter(([, v]) => v.repPoint > 0).sort((a, b) => b[1].repPoint - a[1].repPoint).slice(0, 10)
      if (!top.length) return reply(`Belum ada yang punya reputasi. Mulai dengan ${prefix}rep @teman`)
      return say(`✦ ${B('PERINGKAT REPUTASI')}\n\n` + top.map(([j, v], i) => `${['🥇', '🥈', '🥉'][i] || `${i + 1}.`} ${tag(j)} — *${v.repPoint}* ★`).join('\n'), top.map(([j]) => j))
    }
    const target = K.mentions(m)[0] || (m.quoted && m.quoted.sender) || null
    if (!target) return say(`✦ ${B('REPUTASI')}\n\n${B('Reputasimu')} : ${K.get(m.sender, 'repPoint', 0)}\n${B('Jatah hari ini')} : ${K.get(m.sender, 'repGiven', '') === K.dayKey() ? 'sudah dipakai' : 'tersedia'}\n\n┣ ${prefix}rep @user : beri +1\n┗ ${prefix}toprep : peringkat`)
    if (target === m.sender) return reply('Tidak bisa memberi reputasi ke diri sendiri.')
    if (K.get(m.sender, 'repGiven', '') === K.dayKey()) return reply('Kamu sudah memberi reputasi hari ini. Coba lagi besok!')
    const next = K.get(target, 'repPoint', 0) + 1
    K.set(target, 'repPoint', next); K.set(m.sender, 'repGiven', K.dayKey())
    const why = String(m.text || '').replace(/^\S+\s*/, '').replace(/@\d+/g, '').trim().slice(0, 100)
    return say(`✦ ${tag(m.sender)} memberi +1 reputasi ke ${tag(target)}!${why ? `\n┗ _${why}_` : ''}\n\n${B('Reputasi')} ${tag(target)} : *${next}*`, [m.sender, target])
  },
}
