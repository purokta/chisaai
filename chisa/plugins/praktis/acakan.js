/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Alat acak & pengundian: roda keputusan, undi pemenang, bagi tim, urutan acak.
//   .spin a, b, c • .undi <n> a, b, c • .bagitim <jumlah> nama... • .urutan nama...   (di grup tanpa daftar → memakai anggota grup)
const { B } = require('../../lib/style')
const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] } return a }
const items = (s) => String(s || '').split(/[,\n|]/.test(s) ? /[,\n|]/ : /\s+/).map(x => x.trim()).filter(Boolean)
const dedupe = (a) => [...new Set(a)]

module.exports = {
  name: 'acakan', alias: ['spin', 'undi', 'bagitim', 'urutan'], category: 'praktis', noLimit: true, cmds: ['spin', 'undi', 'bagitim', 'urutan'],
  desc: 'Roda keputusan, undi pemenang, bagi tim, dan urutan acak',
  run: async ({ sock, m, command, text, args, prefix, reply, isGroup, groupMetadata }) => {
    const cmd = command === 'roda' ? 'spin' : command === 'acakan' ? 'spin' : command
    const members = () => ((groupMetadata && groupMetadata.participants) || []).map(p => p.id).filter(Boolean)
    const label = (x) => (/@(s\.whatsapp\.net|lid)$/.test(x) ? '@' + x.split('@')[0] : x)
    const send = (t, list) => sock.sendMessage(m.chat, { text: t, mentions: list.filter(x => /@(s\.whatsapp\.net|lid)$/.test(x)) }, { quoted: m })
    const needMsg = { spin: `${prefix}spin nasi goreng, mie ayam, bakso`, undi: `${prefix}undi 2 Ani, Budi, Citra, Dedi\n_Di grup, ${prefix}undi 2 memilih dari anggota._`, bagitim: `${prefix}bagitim 3 Ani Budi Citra Dedi Eka Fani\n_Di grup, ${prefix}bagitim 2 membagi anggota._`, urutan: `${prefix}urutan Ani, Budi, Citra` }

    if (cmd === 'undi' || cmd === 'bagitim') {
      const n = parseInt(args[0], 10); if (!(n >= 1)) return reply(`✦ ${B(cmd.toUpperCase())}\n${needMsg[cmd]}`)
      let list = dedupe(items(args.slice(1).join(' ') || (m.quoted && (m.quoted.text || m.quoted.caption)) || '')); if (!list.length && isGroup) list = members().slice(0, 200)
      if (!list.length) return reply(`✕ Daftar kosong.\n${needMsg[cmd]}`)
      if (cmd === 'undi') {
        if (n > list.length) return reply(`✕ Pemenang (${n}) lebih banyak dari peserta (${list.length}).`)
        const win = shuffle(list).slice(0, Math.min(n, 30))
        return send(`🎉 ${B('HASIL UNDIAN')}\nPeserta: ${list.length} • Pemenang: ${win.length}\n\n${win.map((w, i) => `${i + 1}. ${label(w)}`).join('\n')}`, win)
      }
      if (n < 2 || n > list.length || n > 20) return reply(`✕ Jumlah tim harus 2–${Math.min(20, list.length)} (peserta: ${list.length}).`)
      const teams = Array.from({ length: n }, () => []); shuffle(list).forEach((x, i) => teams[i % n].push(x))
      return send(`🧩 ${B('PEMBAGIAN TIM')}\n${list.length} peserta → ${n} tim\n\n${teams.map((t, i) => `*Tim ${i + 1}* (${t.length})\n${t.map(x => '• ' + label(x)).join('\n')}`).join('\n\n')}`, list)
    }
    const list = items(text || (m.quoted && (m.quoted.text || m.quoted.caption)) || '')
    if (cmd === 'spin') {
      if (list.length < 2) return reply(`✦ ${B('RODA KEPUTUSAN')}\n${needMsg.spin}`)
      return reply(`🎡 ${B('RODA KEPUTUSAN')}\n${list.slice(0, 20).map(x => '• ' + x).join('\n')}\n\n➤ Hasilnya: *${list[Math.floor(Math.random() * list.length)]}*`)
    }
    if (list.length < 2) return reply(`✦ ${B('URUTAN ACAK')}\n${needMsg.urutan}`)
    return reply(`🔀 ${B('URUTAN ACAK')}\n${shuffle(list).slice(0, 40).map((x, i) => `${i + 1}. ${x}`).join('\n')}`)
  },
}
