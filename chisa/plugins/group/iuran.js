/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .iuran — iuran/kas grup: admin membuka periode & menandai lunas, semua orang bisa lihat siapa yang belum bayar
const K = require('../../lib/praktis'), { B } = require('../../lib/style'), E = require('../../lib/ekstra'), { tag } = require('../../lib/grouputil')
module.exports = {
  name: 'iuran', alias: ['kasgrup', 'tagihangrup', 'tunggakan'], category: 'group', noLimit: true, group: true, cmds: ['iuran'],
  desc: 'Iuran grup: admin buka periode, tandai lunas, tagih yang belum bayar; semua bisa cek status',
  run: async function (c) {
    const { m, sock, args, prefix, reply, groupMetadata } = c, p = prefix + 'iuran', sub = (args[0] || '').toLowerCase(), s = K.get(m.chat, 'iuran', null)
    const parts = (groupMetadata && groupMetadata.participants || []).map(x => x.id).filter(id => id !== (sock.user && sock.user.id))
    const admin = () => { if (!E.isAdmin(c)) { reply(global.mess?.admin || 'Khusus admin grup.'); return false } return true }
    const target = () => { const mn = K.mentions(m); if (mn.length) return mn; const q = m.quoted && (m.quoted.sender || m.quoted.participant); return q ? [q] : [] }
    const wajib = () => parts.filter(id => !(s.kecuali || []).includes(id))
    if (sub === 'mulai' || sub === 'buka') {
      if (!admin()) return; const nom = K.parseNominal(args[1]), title = args.slice(2).join(' ').trim().slice(0, 60)
      if (!(nom > 0) || !title) return reply(`✕ Format: ${p} mulai <nominal> <judul>\nContoh: ${p} mulai 20rb Kas Oktober`)
      if (s && !s.tutup) return reply(`Periode *${s.title}* masih berjalan. Tutup dulu: ${p} tutup`)
      K.set(m.chat, 'iuran', { title, nom, lunas: {}, kecuali: [], tutup: false, mulai: Date.now() }); return reply(`✦ ${B('IURAN DIBUKA')}\n*${title}* — ${K.rupiah(nom)} per orang\n_Admin menandai pembayaran dengan ${p} lunas @orang_`)
    }
    if (!s) return reply(`✦ ${B('IURAN')}\nBelum ada iuran.\nAdmin: ${p} mulai <nominal> <judul>`)
    if (['lunas', 'batal', 'kecuali'].includes(sub)) {
      if (!admin()) return; if (s.tutup) return reply('Periode sudah ditutup.'); const t = target(); if (!t.length) return reply(`✕ Mention orangnya atau balas pesannya.\nContoh: ${p} ${sub} @nama`)
      for (const id of t) { if (sub === 'lunas') s.lunas[id] = Date.now(); else if (sub === 'batal') delete s.lunas[id]; else if (!s.kecuali.includes(id)) s.kecuali.push(id) }
      K.set(m.chat, 'iuran', s); return sock.sendMessage(m.chat, { text: `✦ ${sub === 'lunas' ? 'Lunas' : sub === 'batal' ? 'Dibatalkan' : 'Dikecualikan'}: ${t.map(tag).join(', ')}`, mentions: t }, { quoted: m })
    }
    if (sub === 'tutup') { if (!admin()) return; s.tutup = true; K.set(m.chat, 'iuran', s) }
    const w = wajib(), lunas = w.filter(id => s.lunas[id]), belum = w.filter(id => !s.lunas[id])
    if (sub === 'tagih') { if (!admin()) return; if (!belum.length) return reply('Semua sudah lunas.'); return sock.sendMessage(m.chat, { text: `✦ ${B('PENGINGAT IURAN')} — ${s.title}\n${K.rupiah(s.nom)} per orang. Belum bayar:\n\n` + belum.map(id => '◇ ' + tag(id)).join('\n'), mentions: belum }, { quoted: m }) }
    const top = Math.max(0, w.length)
    let t = `✦ ${B('IURAN')} — ${s.title}${s.tutup ? ' _(ditutup)_' : ''}\n${K.bar(top ? lunas.length / top : 0)} ${lunas.length}/${top} lunas\n┣ Nominal : ${K.rupiah(s.nom)}/orang\n┣ Terkumpul : *${K.rupiah(lunas.length * s.nom)}*\n┗ Kurang : ${K.rupiah(belum.length * s.nom)}\n`
    if (belum.length) t += `\n${B('Belum bayar')} (${belum.length})\n` + belum.slice(0, 40).map(id => '◇ ' + tag(id)).join('\n') + (belum.length > 40 ? `\n… dan ${belum.length - 40} lainnya` : '')
    else t += '\n✦ Semua sudah lunas!'
    return sock.sendMessage(m.chat, { text: t + (s.tutup ? '' : `\n\n_Admin: ${p} lunas @orang • tagih • kecuali @orang • tutup_`), mentions: belum.slice(0, 40) }, { quoted: m })
  },
}
