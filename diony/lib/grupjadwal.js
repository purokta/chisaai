/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Penjadwal buka/tutup grup otomatis (dipanggil index.js saat koneksi terbuka). Data: GG.get(chat).jadwal = { open:'06:00', close:'22:00', last:{open:'2026-10-08'} }
const GG = require('./grupdb'), S = require('./settingsdb')
const WINDOW = 5   // menit toleransi bila bot sempat mati tepat di menit jadwal
function nowParts() {
  const tz = S.get('timezone') || 'Asia/Jakarta', d = new Date()
  const hm = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(d)
  const [h, mi] = hm.split(':').map(Number)
  return { min: (h % 24) * 60 + mi, day: new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(d) }
}
const toMin = (t) => { const x = String(t || '').match(/^(\d{1,2})[:.](\d{2})$/); if (!x || +x[1] > 23 || +x[2] > 59) return null; return +x[1] * 60 + +x[2] }
const norm = (t) => { const mn = toMin(t); return mn === null ? null : String(Math.floor(mn / 60)).padStart(2, '0') + ':' + String(mn % 60).padStart(2, '0') }

async function tick(sock) {
  if (!sock || !sock.user) return
  const { min, day } = nowParts()
  for (const [chat, g] of Object.entries(GG.all())) {
    const j = g.jadwal; if (!j || g.ban) continue
    for (const kind of ['open', 'close']) {
      const at = toMin(j[kind]); if (at === null) continue
      j.last = j.last || {}
      if (j.last[kind] === day || min < at || min - at > WINDOW) continue
      j.last[kind] = day; GG.save()
      try {
        await sock.groupSettingUpdate(chat, kind === 'open' ? 'not_announcement' : 'announcement')
        await sock.sendMessage(chat, { text: kind === 'open' ? `Grup dibuka otomatis (${j.open}). Silakan ngobrol kembali.` : `Grup ditutup otomatis (${j.close}). Hanya admin yang bisa mengirim pesan.` })
      } catch (e) { console.log('[jadwalgrup]', chat, e.message) }
    }
  }
}
function start(sock) {
  if (global.__jadwalTimer) clearInterval(global.__jadwalTimer)
  global.__jadwalTimer = setInterval(() => tick(sock).catch(e => console.log('[jadwalgrup]', e.message)), 30000)
  if (global.__jadwalTimer.unref) global.__jadwalTimer.unref()
}
module.exports = { start, tick, toMin, norm, nowParts }
