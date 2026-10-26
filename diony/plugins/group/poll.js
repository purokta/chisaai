/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Polling grup: .poll <judul> | <opsi1> | <opsi2> ... [-30m]   .vote <no>   .hasilpoll   .tutuppoll
const P = require('../../lib/polldb'), { B } = require('../../lib/style')

module.exports = {
  name: 'poll', alias: ['polling', 'vote', 'voting', 'unvote', 'hasilpoll', 'cekpoll', 'pollresult', 'tutuppoll', 'endpoll', 'closepoll'],
  category: 'group', cmds: ['poll', 'vote', 'hasilpoll', 'tutuppoll'], menu: ['poll', 'vote', 'unvote', 'hasilpoll', 'tutuppoll'],
  desc: 'Polling grup: buat pemungutan suara, vote, lihat hasil, dan tutup',
  group: true,
  run: async ({ sock, m, reply, text, command, prefix, isAdmins, isCreator }) => {
    const gid = m.chat, send = (t, mentions = []) => sock.sendMessage(gid, { text: t, mentions }, { quoted: m })

    // ── hasil ──
    if (['hasilpoll', 'cekpoll', 'pollresult'].includes(command)) {
      const p = P.get(gid)
      if (!p) return reply(`Belum ada polling di grup ini.\nBuat dengan: ${prefix}poll Judul | Opsi 1 | Opsi 2`)
      return send(P.render(p, prefix, B), [p.creator])
    }

    // ── vote / unvote ──
    if (['vote', 'voting', 'unvote'].includes(command)) {
      const p = P.get(gid)
      if (!p || p.closed) return reply(`Tidak ada polling aktif.${p ? ` Lihat hasil terakhir: ${prefix}hasilpoll` : ''}`)
      if (command === 'unvote') return reply(P.unvote(gid, m.sender) ? '✦ Suaramu ditarik.' : 'Kamu belum memberi suara.')
      const n = parseInt(String(text).trim(), 10)
      if (!n || n < 1 || n > p.options.length) return send(`${P.render(p, prefix, B)}\n\n_Nomor tidak valid. Contoh: ${prefix}vote 1_`, [p.creator])
      const r = P.vote(gid, m.sender, n - 1)
      if (!r) return reply('Polling sudah ditutup.')
      const msg = r === 'same' ? 'Kamu sudah memilih opsi itu.' : r === 'changed' ? 'suaramu dipindahkan ke' : 'suaramu tercatat untuk'
      return send(`✦ ${P.tag(m.sender)} ${r === 'same' ? 'sudah memilih opsi itu.' : `${msg} *${p.options[n - 1]}*`}\n_Lihat hasil: ${prefix}hasilpoll_`, [m.sender])
    }

    // ── tutup ──
    if (['tutuppoll', 'endpoll', 'closepoll'].includes(command)) {
      const cur = P.get(gid)
      if (!cur || cur.closed) return reply('Tidak ada polling aktif.')
      if (cur.creator !== m.sender && !isAdmins && !isCreator) return reply('Hanya pembuat polling atau admin yang bisa menutupnya.')
      const p = P.close(gid, m.sender)
      return send(P.render(p, prefix, B), [p.creator, m.sender])
    }

    // ── buat ──
    const { text: body, ms } = P.splitDuration(text)
    const parts = body.split(/\s*\|\s*/).map(s => s.trim()).filter(Boolean)
    if (parts.length < 1 + P.MIN_OPT) return reply(`${B('BUAT POLLING')}\nFormat: ${prefix}poll Judul | Opsi 1 | Opsi 2 | ...\nTambah batas waktu di akhir: -30m (menit), -2j (jam), -1d (hari; maks 7 hari)\n\nContoh:\n${prefix}poll Makan apa nanti? | Bakso | Nasi goreng | Mie ayam -1j\n\nMinimal ${P.MIN_OPT} dan maksimal ${P.MAX_OPT} opsi.`)
    const [title, ...opts] = parts
    if (opts.length > P.MAX_OPT) return reply(`Maksimal ${P.MAX_OPT} opsi.`)
    if (title.length > 100) return reply('Judul terlalu panjang (maks 100 karakter).')
    if (opts.some(o => o.length > 60)) return reply('Tiap opsi maksimal 60 karakter.')
    if (new Set(opts.map(o => o.toLowerCase())).size !== opts.length) return reply('Ada opsi yang kembar.')
    const p = P.create(gid, m.sender, title, opts, ms)
    if (!p) return reply(`Masih ada polling yang berjalan. Tutup dulu dengan ${prefix}tutuppoll atau lihat ${prefix}hasilpoll.`)
    return send(`${P.render(p, prefix, B)}\n\n_Dibuat oleh ${P.tag(m.sender)}_`, [m.sender])
  },
}
