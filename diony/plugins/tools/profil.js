/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .getpp [@user|reply|nomor]  ambil foto profil      .getbio [@user|reply|nomor]  ambil bio / info
// Tanpa target = profil dirimu sendiri.
const { targets } = require('../../lib/grouputil'), ST = require('../../lib/style'), S = require('../../lib/settingsdb')
module.exports = {
  name: 'getpp', alias: ['pp', 'fotoprofil', 'getbio', 'bio', 'cekbio'], category: 'tools', cmds: ['getpp', 'getbio'], noLimit: true,
  desc: 'Ambil foto profil dan bio seseorang (mention, reply, atau nomor)',
  run: async ({ sock, m, reply, text, command }) => {
    const jid = targets(m, text)[0] || m.sender, num = jid.split('@')[0]
    if (['getbio', 'bio', 'cekbio'].includes(command)) {
      try {
        let r = await sock.fetchStatus(jid); r = Array.isArray(r) ? r[0] : r
        const st = r && (r.status && r.status.status !== undefined ? r.status : r), bio = st && st.status, at = st && (st.setAt || st.setAT)
        if (!bio) return reply('Bio kosong atau disembunyikan.')
        const when = at ? new Date(at).toLocaleDateString('id-ID', { timeZone: S.get('timezone'), day: 'numeric', month: 'long', year: 'numeric' }) : '-'
        return sock.sendMessage(m.chat, { text: `${ST.B('BIO')}\n━━━━━━━━━━━━━━━━━━━━\n${ST.B('Nomor')} : @${num}\n${ST.B('Bio')}   : ${bio}\n${ST.B('Diatur')} : ${when}`, mentions: [jid] }, { quoted: m })
      } catch { return reply('Bio tidak bisa diambil (disembunyikan atau nomor tidak terdaftar).') }
    }
    try {
      const url = await sock.profilePictureUrl(jid, 'image')
      return sock.sendMessage(m.chat, { image: { url }, caption: `${ST.B('FOTO PROFIL')}\n@${num}`, mentions: [jid] }, { quoted: m })
    } catch { return reply('Foto profil tidak ada atau disembunyikan.') }
  },
}
