/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// KAPSUL WAKTU — kirim pesan ke dirimu di masa depan. Pesan tersegel: isinya tidak bisa dibaca sampai hari yang ditentukan.
//   .kapsul 1tahun Semoga kamu sudah jadi dokter     (7hari, 2minggu, 3bulan, 1tahun, atau 2027-01-01; terkirim pukul 07:00)
//   .kapsulgrup 6bulan <pesan>   (admin) kapsul untuk seluruh grup
//   .kapsulku   daftar kapsulmu (tanpa isi)   •  .kapsulbatal <no>
const K = require('../../lib/praktis'), C = require('../../lib/kapsul'), D = require('../../lib/daily'), { B } = require('../../lib/style')
const fmt = (at) => { const p = D.parts(new Date(at)); return `${p.d} ${K.BULAN[p.m - 1]} ${p.y}` }
module.exports = {
  name: 'kapsul', alias: ['kapsulgrup', 'kapsulku', 'kapsulbatal', 'timecapsule'], category: 'ajaib', noLimit: true, cmds: ['kapsul', 'kapsulgrup', 'kapsulku', 'kapsulbatal'],
  desc: 'Kapsul waktu: kirim pesan tersegel ke masa depan (sampai 10 tahun), terkirim otomatis',
  run: async ({ m, args, text, command, prefix, isGroup, isAdmins, isCreator, reply }) => {
    if (command === 'kapsulku') {
      const l = C.forUser(m.sender); if (!l.length) return reply(`Kamu belum punya kapsul. Buat: ${prefix}kapsul 1tahun <pesan>`)
      return reply(`✦ ${B('KAPSUL TERSEGEL')} (${l.length}/${C.MAXPER})\n\n` + l.map((r, i) => `${i + 1}. ${r.group ? '[grup] ' : ''}terbuka *${fmt(r.at)}* (${Math.max(0, Math.ceil((r.at - Date.now()) / 864e5))} hari lagi)`).join('\n') + `\n\n_Isi pesan disegel. Batalkan: ${prefix}kapsulbatal <no>_`)
    }
    if (command === 'kapsulbatal') { const r = C.remove(m.sender, parseInt(args[0], 10)); return reply(r ? '✦ Kapsul dibatalkan dan isinya dihapus.' : `Nomor tidak ada. Lihat ${prefix}kapsulku`) }
    const grp = command === 'kapsulgrup'
    if (grp && !isGroup) return reply('Kapsul grup hanya bisa dibuat di dalam grup.')
    if (grp && !isAdmins && !isCreator) return reply('Hanya admin yang boleh membuat kapsul grup.')
    const when = args[0], msg = args.slice(1).join(' ').trim()
    if (!when || !msg) return reply(`✦ ${B('KAPSUL WAKTU')}\nSegel pesan untuk dibuka di masa depan.\n\n${prefix}kapsul 1tahun Semoga kamu sudah sukses\n${prefix}kapsul 2027-01-01 Selamat tahun baru!\n${prefix}kapsulgrup 6bulan <pesan>  (admin, untuk grup)\n\nSatuan: menit, jam, hari, minggu, bulan, tahun (maks 10 tahun). Terkirim pukul 07:00.\nLihat: ${prefix}kapsulku`)
    if (msg.length > 1000) return reply('✕ Pesan maksimal 1000 karakter.')
    const w = C.parseWhen(when, K); if (w.error) return reply(`✕ ${w.error}`)
    if (w.at < Date.now() + 50000) return reply('✕ Waktunya harus di masa depan.')
    if (w.at > Date.now() + 3660 * 864e5) return reply('✕ Maksimal 10 tahun ke depan.')
    if (C.forUser(m.sender).length >= C.MAXPER) return reply(`✕ Kapsulmu sudah ${C.MAXPER} (batas). Batalkan salah satu dulu.`)
    C.add({ owner: m.sender, chat: m.chat, group: grp, text: msg, at: w.at })
    return reply(`✦ Kapsul tersegel.\nTerbuka: *${fmt(w.at)}* pukul 07:00${grp ? ' di grup ini' : ' di chat ini (dengan mention kamu)'}.\n_Isinya tidak akan ditampilkan lagi sampai hari itu. Pastikan kamu pernah chat dengan bot agar pesan bisa masuk._`)
  },
}
