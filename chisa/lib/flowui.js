/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Kerangka tampilan bersama untuk fitur laporan (.osint, .jejak, dst):
//   1) pesan loading dengan bar + teks yang DIEDIT tiap langkah  2) di 100% pesan dihapus
//   3) video thumbnail terpisah (MP4 di folder, dikirim gifPlayback = tampil sebagai GIF)
//   4) kartu HTML berisi tabel saja + teks penjelasan digabung dalam satu pesan
const fs = require('fs'), path = require('path')
const HC = require('./htmlcard')
const E = HC.escapeHtml
const sleep = (ms) => new Promise(r => setTimeout(r, ms))
const MEDIA = path.join(__dirname, 'media')
const firstVid = (dir) => { try { const f = fs.readdirSync(dir).filter(x => /\.(mp4|mov|mkv|webm|gif)$/i.test(x)).sort()[0]; return f ? path.join(dir, f) : null } catch { return null } }

const CSS = `*{margin:0;padding:0;box-sizing:border-box}html,body{background:transparent;color:#e9ecf3;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif}
.w{padding:12px 8px}.h{font-size:15px;font-weight:800;margin:14px 2px 6px;letter-spacing:.4px}.s{font-size:10.5px;color:#9aa3b5;margin:0 2px 6px}
.sc{overflow-x:auto;border:1px solid #2b303b;border-radius:10px;background:#14171d}table{border-collapse:collapse;width:100%;min-width:480px;font-size:11.5px}
th{background:#20242d;color:#c9d1e3;text-align:left;padding:7px 8px;font-weight:700;white-space:nowrap}td{padding:6px 8px;border-top:1px solid #232834;vertical-align:top;word-break:break-word}
tr:nth-child(even) td{background:#171a21}.n{text-align:right;white-space:nowrap}
.OK,.AMAN,.ADA,.PEMILIK{color:#22c55e;font-weight:800}.INFO,.CUKUP{color:#60a5fa;font-weight:800}.WASPADA,.TIDAKPASTI{color:#f59e0b;font-weight:800}.RISIKO,.TINGGI,.RENTAN{color:#f97316;font-weight:800}.KRITIS,.BAHAYA,.TIDAKADA{color:#ef4444;font-weight:800}`
const tbl = (head, rows, min) => `<div class="sc"><table${min ? ` style="min-width:${min}px"` : ''}><thead><tr>${head.map(h => `<th>${E(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => (c && typeof c === 'object') ? `<td class="${c.c || ''}">${E(c.t)}</td>` : `<td>${E(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`
const cls = (t, c) => ({ t: String(t), c: c || String(t).replace(/\s+/g, '') })

// sections: [{ h: 'Judul', note?: 'catatan kecil', head: [...], rows: [[...]], min?: 480 }]
function renderSections(title, sections, max) {
  max = max || 20000
  const build = (secs) => _build(title, secs)
  let secs = sections, h = build(secs)
  for (let k = 0; k < 8 && h.length > max; k++) {   // kartu kebesaran tidak tampil di WhatsApp: pangkas baris terpanjang
    secs = secs.map(s => s.rows.length > 4 ? { ...s, rows: s.rows.slice(0, Math.max(3, Math.floor(s.rows.length * 0.7))), note: (s.note ? s.note + ' ' : '') + '(sebagian baris dipangkas agar muat)' } : s)
    h = build(secs)
  }
  return h
}
function _build(title, sections) {
  return `<style>${CSS}</style><div class="w"><div class="h">${E(title)}</div>` + sections.map((s, i) =>
    `<div class="h">${['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][i] || i + 1}. ${E(s.h)}</div>${s.note ? `<div class="s">${E(s.note)}</div>` : ''}${s.rows.length ? tbl(s.head, s.rows, s.min) : '<div class="s">Tidak ada data.</div>'}`).join('') + '</div>'
}

const bar = (p) => '█'.repeat(Math.round(p / 10)) + '░'.repeat(10 - Math.round(p / 10))

// o: { title, label, steps: [[persen, teks], ...], work: async () => ({ html, text }), media: [namaFolderMedia] }
async function run(sock, m, o) {
  let key = null
  const frame = (p, s) => `✦ ${o.title}\n━━━━━━━━━━━━━━━━━━━━\n${o.label}\n\n[${bar(p)}] ${p}%\n${s}${'.'.repeat(p % 3 + 1)}`
  const edit = async (t) => { try { await sock.sendMessage(m.chat, { text: t, edit: key }) } catch {} }
  const del = async () => { if (key) { await sock.sendMessage(m.chat, { delete: key }).catch(() => {}); key = null } }
  const sent = await sock.sendMessage(m.chat, { text: frame(0, 'Memulai') }, { quoted: m }); key = sent.key
  let result, err
  const job = Promise.resolve().then(o.work).then(r => { result = r }, e => { err = e })
  for (const [p, s] of o.steps) { await edit(frame(p, s)); await sleep(900) }
  await job
  if (err) { await del(); throw err }
  await edit(frame(100, 'Selesai')); await sleep(800); await del()

  try {   // video thumbnail terpisah -> tampil sebagai GIF. Satu file saja untuk semua laporan (ringan)
    const vdir = path.join(MEDIA, 'menu', 'video'), one = path.join(vdir, 'thumbnail-grupstatistic.mp4')
    const src = fs.existsSync(one) ? one : firstVid(vdir)
    if (src) await sock.sendMessage(m.chat, { video: await require('./menuui').gifVideo(src), gifPlayback: true, caption: `✦ ${o.title}` }, { quoted: m })
  } catch (e) { console.log('[flowui] gif:', e.message) }

  console.log('[flowui] ukuran kartu:', result.html.length, 'byte')
  try { await sock.relayMessage(m.chat, HC.buildRichHtmlPayload(result.html, String(result.text).slice(0, 1100)), {}) }
  catch (e) {
    console.log('[flowui] kartu:', e.message)
    await sock.sendMessage(m.chat, { text: result.text }, { quoted: m })
    await sock.sendMessage(m.chat, { text: 'Kartu tabel gagal dikirim. Fitur ini butuh WhatsApp versi terbaru.' })
  }
}
module.exports = { run, renderSections, tbl, cls, CSS, sleep }
