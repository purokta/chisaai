/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .grupstatistic — pusat statistik grup (khusus owner, dipakai di dalam grup). Semua fitur grup digabung di sini.
//   .grupstatistic                    laporan lengkap (ringkasan, komposisi pesan, keamanan, admin/kudeta, member, log)
//   .grupstatistic keamanan           pemeriksaan keamanan + saran tindakan
//   .grupstatistic admin              rekam aksi tiap admin, alasan skor kudeta, cara baca skor
//   .grupstatistic member [halaman]   detail semua member per halaman (12 per halaman)
//   .grupstatistic jam                aktivitas per jam, per hari dalam seminggu, 14 hari terakhir
//   .grupstatistic log                log peristiwa grup (promote, demote, kick, join, ubah pengaturan)
//   .grupstatistic jejak <@orang>     profil lengkap satu orang (sifat, jam aktif, online/offline, aksi admin)
//   .grupstatistic antikudeta on|auto|off|status   penjaga kudeta admin
//   .grupstatistic reset              hapus data statistik grup ini, mulai merekam dari nol
// Tampilan: loading diedit -> dihapus -> GIF thumbnail (lib/media/menu/video/thumbnail-grupstatistic.mp4)
//           -> kartu HTML tabel + penjelasan digabung dalam satu pesan.
const FL = require('../../lib/flowui'), GS = require('../../lib/grupstat'), GU = require('../../lib/grouputil'), AK = require('../../lib/antikudeta')

const busy = new Set()
const STEPS = [[12, 'Membaca data grup'], [28, 'Memeriksa pengaturan keamanan'], [46, 'Menghitung waktu online dan offline'], [64, 'Memeriksa admin yang berpotensi mengkudeta'], [82, 'Menyusun profil sifat member'], [94, 'Merangkai tabel']]
const TITLE = { '': 'GRUP STATISTIK', keamanan: 'KEAMANAN GRUP', admin: 'ADMIN DAN KUDETA', member: 'DETAIL MEMBER', jam: 'AKTIVITAS GRUP', log: 'LOG PERISTIWA', jejak: 'JEJAK ANGGOTA' }
const HELP = (p) => `✦ GRUP STATISTIK\n━━━━━━━━━━━━━━━━━━━━\n${p}grupstatistic  (laporan lengkap)\n${p}grupstatistic keamanan\n${p}grupstatistic admin\n${p}grupstatistic member [halaman]\n${p}grupstatistic jam\n${p}grupstatistic log\n${p}grupstatistic jejak @orang\n${p}grupstatistic antikudeta on | auto | off\n${p}grupstatistic reset`

module.exports = {
  name: 'grupstatistic', alias: ['grupstat', 'statgrup', 'gcstat'], category: 'group', owner: true, group: true, noLimit: true,
  desc: 'Statistik lengkap grup: keamanan, online/offline, kudeta admin, sifat member, jejak, antikudeta',
  run: async ({ sock, m, args, prefix, reply, isBotAdmins }) => {
    const sub = (args[0] || '').toLowerCase(), rest = args.slice(1).join(' ')
    const kind = ['semua', 'full', 'lengkap'].includes(sub) ? '' : (sub === 'akudeta' ? 'antikudeta' : sub)

    if (kind === 'bantuan' || kind === 'help') return reply(HELP(prefix))
    if (kind === 'reset') return reply(GS.reset(m.chat) ? '✦ Data statistik grup ini direset. Perekaman dimulai dari nol.' : 'Belum ada data di grup ini.')
    if (kind === 'antikudeta') {
      const a = (args[1] || 'status').toLowerCase(), cur = AK.getMode(m.chat)
      if (a === 'on' || a === 'auto' || a === 'off') {
        if (a === 'auto' && !isBotAdmins) return reply('Mode auto butuh bot berstatus admin. Jadikan bot admin dulu, atau pakai mode on (alarm saja).')
        AK.setMode(m.chat, a)
        return reply(a === 'off' ? '✦ Penjaga kudeta dimatikan.' : `✦ Penjaga kudeta aktif (${a === 'auto' ? 'auto: alarm + tindakan' : 'alarm saja'}).\nPemicu: satu admin menurunkan 2 admin, mengeluarkan 5 anggota, atau mengangkat 3 admin dalam 2-3 menit. Pemilik grup tidak pernah dianggap pelaku.`)
      }
      return reply(`✦ Penjaga kudeta: *${cur}*\n\n${prefix}grupstatistic antikudeta on    alarm saja\n${prefix}grupstatistic antikudeta auto  alarm + pelaku diturunkan + korban dipulihkan (bot harus admin)\n${prefix}grupstatistic antikudeta off   matikan`)
    }
    if (!(kind in TITLE)) return reply(HELP(prefix))

    let target = null
    if (kind === 'jejak') {
      const t = GU.targets(m, rest)[0]; if (!t) return reply(`Reply / mention orangnya.\nContoh: ${prefix}grupstatistic jejak @orang`)
      target = GS.norm(t)
    }
    if (busy.has(m.chat)) return reply('Statistik grup ini sedang disusun, tunggu sebentar.')
    busy.add(m.chat)
    try {
      const meta = await sock.groupMetadata(m.chat).catch(() => null)
      if (!meta) return reply('Gagal membaca data grup. Coba lagi sebentar.')
      const name = meta.subject || 'Grup'
      await FL.run(sock, m, {
        title: TITLE[kind], label: kind === 'jejak' ? `${GS.nameOf(target)} | ${name}` : name, steps: STEPS,
        work: async () => {
          const a = GS.analyze(m.chat, meta, sock), H = `\n\nMenu rincian: ${prefix}grupstatistic bantuan`
          let sections, text
          if (kind === '') { sections = GS.sectionsFull(a); text = GS.renderText(a) }
          else if (kind === 'keamanan') {
            sections = GS.sectionsKeamanan(a); const bad = a.sec.filter(r => r[1] === 'RISIKO' || r[1] === 'WASPADA')
            text = `✦ KEAMANAN GRUP : ${name}\n━━━━━━━━━━━━━━━━━━━━\nSkor ${a.score}/100 (${a.grade}). ${bad.length ? bad.length + ' temuan: ' + bad.map(r => r[0].toLowerCase()).slice(0, 5).join('; ') + '.' : 'Tidak ada temuan yang menonjol.'} Kolom Saran di tabel berisi langkah perbaikan.${H}`
          } else if (kind === 'admin') {
            sections = GS.sectionsAdmin(a); const top = a.admins.filter(x => x.role !== 'superadmin').slice(0, 3)
            text = `✦ ADMIN DAN KUDETA : ${name}\n━━━━━━━━━━━━━━━━━━━━\n${a.admins.length} admin. ${top.length ? 'Skor tertinggi: ' + top.map(x => `${GS.nameOf(x.jid)} (${x.score}, ${x.level})`).join(', ') + '.' : 'Tidak ada admin selain pemilik.'} Pemilik grup tidak bisa diturunkan admin lain, jadi dinilai kebal. Skor dihitung dari rekam aksi yang bot lihat sejak mulai merekam.${H}`
          } else if (kind === 'member') {
            const r = GS.sectionsMember(a, parseInt(args[1], 10) || 1); sections = r.sections
            text = `✦ DETAIL MEMBER : ${name}\n━━━━━━━━━━━━━━━━━━━━\nHalaman ${r.p} dari ${r.pages} (${a.members.length} anggota, urut jumlah pesan). Ketik ${prefix}grupstatistic member ${Math.min(r.pages, r.p + 1)} untuk halaman berikutnya.\nSifat hanya perkiraan dari kebiasaan chat.`
          } else if (kind === 'jam') {
            sections = GS.sectionsJam(a)
            text = `✦ AKTIVITAS GRUP : ${name}\n━━━━━━━━━━━━━━━━━━━━\n${a.peakH >= 0 ? `Paling ramai jam ${String(a.peakH).padStart(2, '0')}:00. ` : ''}${a.dmx ? `Hari paling ramai ${GS.HARI[a.dow.indexOf(a.dmx)]}. ` : ''}${a.last7} pesan dalam 7 hari terakhir, rata-rata ${Math.round(a.total / a.nDays)} per hari.${H}`
          } else if (kind === 'log') {
            sections = GS.sectionsLog(a)
            text = `✦ LOG PERISTIWA : ${name}\n━━━━━━━━━━━━━━━━━━━━\n${a.g.events.length} peristiwa terekam. Yang bertanda "tidak terpantau" terjadi saat bot tidak melihat, terdeteksi dari perbandingan daftar admin.${H}`
          } else {
            const j = GS.sectionsJejak(a, target); if (!j) throw new Error('Orang itu bukan anggota grup ini')
            sections = j.sections
            text = `✦ JEJAK ANGGOTA\n━━━━━━━━━━━━━━━━━━━━\n${GS.nameOf(target)} (${j.role}) di ${name}: ${j.me.u ? j.me.u.n + ' pesan' : 'belum ada pesan terekam'}. Sifat: ${j.me.traits.join(', ')}.${j.ad && j.ad.level !== 'AMAN' && j.ad.level !== 'PEMILIK' ? ` Risiko kudeta ${j.ad.level} (${j.ad.score}).` : ''}\nSifat hanyalah perkiraan dari kebiasaan chat, bukan penilaian pasti.`
          }
          return { html: FL.renderSections((TITLE[kind] || 'GRUP') + ' | ' + name, sections), text }
        },
      })
    } catch (e) { console.log('[grupstat]', e); reply('Gagal menyusun statistik: ' + e.message) }
    finally { busy.delete(m.chat) }
  },
}
