/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Auto-respon grup: bot membalas otomatis bila ada pesan yang SAMA PERSIS dengan kata pemicu (tanpa prefix).
//   .addrespon <pemicu> | <balasan> (admin)   .delrespon <pemicu> (admin)   .listrespon
const fs = require('fs'), path = require('path'), { B } = require('../../lib/style')
const FILE = path.join(global.chisaData, 'respon.json')
let cache = null
const read = () => { if (cache) return cache; try { cache = JSON.parse(fs.readFileSync(FILE, 'utf8')) } catch { cache = {} } return cache }
const write = () => { try { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(cache || {}, null, 2)) } catch (e) { console.log('[respon] gagal simpan:', e.message) } }
const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim()
const lastHit = new Map()   // anti-spam: satu pemicu hanya sekali per 10 detik per grup

module.exports = {
  name: 'addrespon', alias: ['delrespon', 'listrespon', 'autorespon'], category: 'group', group: true, noLimit: true, cmds: ['addrespon', 'delrespon', 'listrespon'],
  desc: 'Auto-respon grup: .addrespon <pemicu> | <balasan>, .delrespon <pemicu>, .listrespon (admin untuk ubah)',
  before: async ({ sock, m, budy, isGroup }) => {
    if (!isGroup || !budy || budy.length > 80) return false
    const g = read()[m.chat]; if (!g) return false
    const k = norm(budy), r = g[k]; if (!r) return false
    const id = m.chat + '|' + k, now = Date.now(); if (now - (lastHit.get(id) || 0) < 10000) return false
    lastHit.set(id, now)
    await sock.sendMessage(m.chat, { text: r.t }, { quoted: m }).catch(() => {}); return false   // false: pesan tetap diproses hook lain
  },
  run: async ({ m, text, command, prefix, reply, isAdmins, isOwner }) => {
    const db = read(), g = db[m.chat] || (db[m.chat] = {})
    if (command === 'listrespon' || command === 'autorespon') {
      const ks = Object.keys(g); if (!ks.length) return reply(`Belum ada auto-respon.\nAdmin: ${prefix}addrespon halo | Halo juga!`)
      return reply(`${B('AUTO-RESPON')}\n${ks.map(k => `◇ ${k}  →  ${g[k].t.slice(0, 40)}${g[k].t.length > 40 ? '…' : ''}`).join('\n')}`)
    }
    if (!isAdmins && !isOwner) return reply(global.mess.admin)
    if (command === 'delrespon') { const k = norm(text); if (!g[k]) return reply('Pemicu itu tidak ada. Lihat ' + prefix + 'listrespon'); delete g[k]; write(); return reply(`Auto-respon "${k}" dihapus.`) }
    const i = text.indexOf('|'); const k = norm(i < 0 ? '' : text.slice(0, i)), t = (i < 0 ? '' : text.slice(i + 1)).trim()
    if (!k || !t) return reply(`Contoh:\n${prefix}addrespon p | Assalamualaikum!\n${prefix}addrespon jadwal piket | Cek ${prefix}note jadwal\n\n_Pemicu harus sama persis dengan pesan (tanpa prefix), maksimal 80 karakter._`)
    if (/^[.!#/]/.test(k)) return reply('✕ Pemicu tidak boleh diawali prefix perintah.')
    if (!g[k] && Object.keys(g).length >= 40) return reply('✕ Maksimal 40 auto-respon per grup.')
    g[k] = { t: t.slice(0, 1000), by: m.sender }; write(); return reply(`✦ Auto-respon aktif: "${k}"`)
  },
}
