/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Penjaga kudeta grup. Memantau event admin: kalau satu admin dalam waktu singkat menurunkan banyak admin,
// mengeluarkan banyak anggota, atau mengangkat banyak admin sekaligus, bot membunyikan alarm.
// Mode "auto" (bot harus admin): pelaku diturunkan dari admin dan admin korban dipulihkan.
// Pemilik grup (superadmin) tidak pernah dianggap pelaku. Data: lib/database/antikudeta.json
const fs = require('fs'), path = require('path')
const J = require('./jid')
const FILE = path.join(global.chisaData, 'antikudeta.json')
const read = () => { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')) } catch { return {} } }
const write = (o) => { try { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(o, null, 2)) } catch (e) { console.log('[antikudeta] gagal simpan:', e.message) } }
const getMode = (gid) => (read()[gid] || {}).mode || 'off'
const setMode = (gid, mode) => { const d = read(); if (mode === 'off') delete d[gid]; else d[gid] = { mode, at: Date.now() }; write(d) }

const LIMIT = { demote: [2, 180e3], kick: [5, 120e3], promote: [3, 180e3] }   // [jumlah, jendela ms]
const hist = new Map(), cool = new Map()
const num = (j) => J.phone(j) || String(j || '').split('@')[0].split(':')[0]
const idOf = (x) => J.pnOf(x)

async function handle(sock, ev) {
  if (!ev || !ev.id || !ev.author) return
  const mode = getMode(ev.id); if (mode === 'off') return
  const kind = ev.action === 'demote' ? 'demote' : ev.action === 'promote' ? 'promote' : ev.action === 'remove' ? 'kick' : null; if (!kind) return
  const by = idOf(ev.authorPn || ev.author), me = sock.decodeJid(sock.user.id)
  if (J.botIds(sock).includes(J.strip(by)) || num(by) === num(me)) return
  const tos = (ev.participants || []).map(idOf).filter(t => num(t) !== num(by))
  if (!tos.length) return
  const k = ev.id + '|' + num(by) + '|' + kind, now = Date.now(), [lim, win] = LIMIT[kind]
  const arr = (hist.get(k) || []).filter(x => now - x.t < win); for (const t of tos) arr.push({ t: now, to: t }); hist.set(k, arr)
  if (arr.length < lim) return
  if (now - (cool.get(k) || 0) < 120e3) return
  cool.set(k, now)
  const meta = await sock.groupMetadata(ev.id).catch(() => null); if (!meta) return
  const find = (j) => J.findParticipant(meta, j)
  const actor = find(by); if (actor && actor.admin === 'superadmin') return   // pemilik sah
  const botP = J.findParticipant(meta, ...J.botIds(sock)), botAdmin = !!(botP && botP.admin)
  const label = { demote: `menurunkan ${arr.length} admin`, kick: `mengeluarkan ${arr.length} anggota`, promote: `mengangkat ${arr.length} admin baru` }[kind]
  const victims = [...new Set(arr.map(x => x.to))]
  let act = ''
  if (mode === 'auto' && botAdmin && actor && actor.admin) {
    try { await sock.groupParticipantsUpdate(ev.id, [actor.id], 'demote'); act += `\nTindakan: @${num(by)} diturunkan dari admin.` } catch { act += '\nTindakan: gagal menurunkan pelaku.' }
    if (kind === 'demote') { try { await sock.groupParticipantsUpdate(ev.id, victims.map(v => (find(v) || { id: v }).id), 'promote'); act += '\nAdmin yang diturunkan dipulihkan.' } catch { act += '\nGagal memulihkan admin.' } }
    if (kind === 'promote') { try { await sock.groupParticipantsUpdate(ev.id, victims.map(v => (find(v) || { id: v }).id), 'demote'); act += '\nAdmin baru yang diangkat dibatalkan.' } catch {} }
  } else if (mode === 'auto' && !botAdmin) act = '\nBot bukan admin, tidak bisa menindak. Jadikan bot admin agar mode auto bekerja.'
  const owners = (global.owner || []).map(v => String(v).replace(/\D/g, '') + '@s.whatsapp.net')
  const mentions = [by, ...owners, ...victims].filter(Boolean)
  const txt = `✦ PERINGATAN KUDETA\n━━━━━━━━━━━━━━━━━━━━\n@${num(by)} baru saja ${label} dalam waktu singkat.\nKorban: ${victims.slice(0, 6).map(v => '@' + num(v)).join(' ')}${act}\n\nOwner bot dan pemilik grup, mohon periksa.`
  await sock.sendMessage(ev.id, { text: txt, mentions }).catch(() => {})
}
module.exports = { handle, getMode, setMode }
