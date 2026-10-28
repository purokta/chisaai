/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Daftar tugas pribadi: .todo add/done/del/edit/clear/list (disimpan per pengguna)
const K = require('../../lib/praktis'), { B } = require('../../lib/style')
module.exports = {
  name: 'todo', alias: ['tugas', 'tugasku', 'todolist'], category: 'praktis', noLimit: true, cmds: ['todo'],
  desc: 'Daftar tugas pribadi: .todo add <tugas> • done <no> • del <no> • edit <no> <teks> • clear',
  run: async ({ m, args, prefix, reply }) => {
    const list = K.get(m.sender, 'todo', []), sub = (args[0] || 'list').toLowerCase(), no = parseInt(args[1], 10)
    const ok = () => no >= 1 && no <= list.length
    const save = () => K.set(m.sender, 'todo', list)
    if (['add', 'tambah', 'baru'].includes(sub)) {
      let t = args.slice(1).join(' ').trim().slice(0, 120); if (!t) return reply(`✕ Tulis tugasnya.\nContoh: ${prefix}todo add Bayar listrik !`)
      if (list.length >= 40) return reply('✕ Maksimal 40 tugas. Hapus yang selesai dengan ' + prefix + 'todo clear')
      const hi = /!\s*$/.test(t); t = t.replace(/\s*!\s*$/, '')
      list.push({ t, d: 0, hi, at: K.dayKey() }); save()
      return reply(`✦ Ditambahkan: *${t}*${hi ? ' (penting)' : ''}\n_Total ${list.length} tugas_`)
    }
    if (['done', 'selesai', 'cek'].includes(sub)) { if (!ok()) return reply('✕ Nomor tidak valid.'); list[no - 1].d = list[no - 1].d ? 0 : 1; save(); return reply(list[no - 1].d ? `◆ Selesai: *${list[no - 1].t}*` : `◇ Dibuka lagi: *${list[no - 1].t}*`) }
    if (['del', 'hapus'].includes(sub)) { if (!ok()) return reply('✕ Nomor tidak valid.'); const [r] = list.splice(no - 1, 1); save(); return reply(`Dihapus: *${r.t}*`) }
    if (sub === 'edit') { const t = args.slice(2).join(' ').trim().slice(0, 120); if (!ok() || !t) return reply(`Format: ${prefix}todo edit <no> <teks baru>`); list[no - 1].t = t; save(); return reply('Diperbarui.') }
    if (['clear', 'bersih'].includes(sub)) { const n = list.filter(x => x.d).length; K.set(m.sender, 'todo', list.filter(x => !x.d)); return reply(`${n} tugas selesai dibersihkan.`) }
    if (!list.length) return reply(`${B('TODO')}\nBelum ada tugas.\nTambah: ${prefix}todo add <tugas>   (akhiri dengan ! untuk penting)`)
    const done = list.filter(x => x.d).length
    return reply(`${B('TODO')}  ${K.bar(done / list.length)} ${done}/${list.length}\n━━━━━━━━━━━━━━━━━━━━\n` + list.map((x, i) => `${x.d ? '◆' : '◇'} ${i + 1}. ${x.d ? '~' + x.t + '~' : x.t}${x.hi && !x.d ? ' ★' : ''}`).join('\n') + `\n\n_${prefix}todo done <no> • del <no> • clear_`)
  },
}
