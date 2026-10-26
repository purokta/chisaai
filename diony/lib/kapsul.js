/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// KAPSUL WAKTU: pesan tersegel yang dikirim bot ke masa depan (hari sampai 10 tahun). Tersimpan di disk, tahan restart.
const AJ = require('./ajaib'), D = require('./daily')
const DB = AJ.store('kapsul.json', [])
const list = () => DB.get()
const MAXPER = 20
const mkId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5)

// "7hari" "2minggu" "3bulan" "1tahun" "30menit" "2jam" atau tanggal 2027-01-01 / 01-01-2027 -> epoch ms | { error }
function parseWhen(tok, K) {
  const s = String(tok || '').toLowerCase(), now = Date.now(); let m
  if ((m = s.match(/^(\d{1,4})(menit|jam|hari|minggu|bulan|tahun)$/))) {
    const n = +m[1], u = m[2]
    if (u === 'menit' || u === 'jam') return { at: now + n * (u === 'menit' ? 6e4 : 36e5) }
    const t = D.now(); let y = t.y, mo = t.m, d = t.d
    if (u === 'hari') d += n; else if (u === 'minggu') d += n * 7; else if (u === 'bulan') mo += n; else y += n
    const dt = new Date(Date.UTC(y, mo - 1, d)); return { at: D.zonedToUtc(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate(), 7, 0) }
  }
  const key = K.parseTanggal(s)
  if (key) return { at: D.zonedToUtc(+key.slice(0, 4), +key.slice(5, 7), +key.slice(8, 10), 7, 0) }
  return { error: 'Format waktu: 7hari, 2minggu, 3bulan, 1tahun, atau tanggal 2027-01-01' }
}
function add(rec) { const r = { id: mkId(), made: Date.now(), tries: 0, ...rec }; list().push(r); DB.save(); return r }
const forUser = (jid) => list().filter(r => r.owner === jid).sort((a, b) => a.at - b.at)
function remove(jid, idx) { const r = forUser(jid)[idx - 1]; if (!r) return null; DB.set(list().filter(x => x.id !== r.id)); DB.save(); return r }

let timer = null
function start(sock) {
  if (timer) clearInterval(timer)
  const tick = async () => {
    const due = list().filter(r => r.at <= Date.now()); if (!due.length) return
    for (const r of due) {
      const ago = Math.max(1, Math.round((Date.now() - r.made) / 864e5)), who = r.owner.split('@')[0]
      const head = r.group ? `✦ *KAPSUL WAKTU TERBUKA*\nDisegel @${who} ${ago} hari lalu untuk grup ini:\n\n` : `✦ *KAPSUL WAKTU TERBUKA*\nKamu menyegel pesan ini ${ago} hari lalu untuk dirimu hari ini:\n\n`
      try { await sock.sendMessage(r.chat, { text: `${head}“${r.text}”\n\n— dari dirimu di masa lalu`, mentions: [r.owner] }); DB.set(list().filter(x => x.id !== r.id)); DB.save() }
      catch (e) { r.tries++; if (r.tries >= 5) { DB.set(list().filter(x => x.id !== r.id)) } DB.save(); console.log('[kapsul]', e.message) }
    }
  }
  timer = setInterval(tick, 30000); tick().catch(() => {})
}
module.exports = { parseWhen, add, forUser, remove, start, MAXPER, list }
