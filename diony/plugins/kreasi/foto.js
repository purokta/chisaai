/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Alat foto lokal (sharp): kirim/reply gambar lalu pakai perintahnya.
//   .resize <lebar>x<tinggi>  .kompres [1-100]  .bulat  .hd  .watermark <teks>  .polaroid [teks]  .putarfoto [derajat]  .balikfoto  .kabur [1-30]
//   .terang [-100..100]  .warnafoto  .persegi  (efek artistik ada di .efek)
const sharp = require('../../lib/sharp.js')
const L = require('../../lib/stickerlib'), K = require('../../lib/kreasi'), K2 = require('../../lib/kreasi2')
const MAX_PIXELS = 40e6

const INFO = {
  resize: ['.resize <lebar>x<tinggi>', 'ubah ukuran (mis. 800x600; satu sisi saja juga boleh: 800x)'],
  kompres: ['.kompres [kualitas 1-100]', 'perkecil ukuran file (bawaan 60)'],
  bulat: ['.bulat', 'potong jadi lingkaran (PNG transparan, cocok foto profil)'],
  hd: ['.hd [2|3]', 'perbesar 2x atau 3x dan pertajam'],
  watermark: ['.watermark <teks>', 'tempel teks miring berulang di seluruh foto'],
  polaroid: ['.polaroid [teks]', 'bingkai foto polaroid dengan keterangan'],
  putarfoto: ['.putarfoto [derajat]', 'putar foto (bawaan 90)'],
  balikfoto: ['.balikfoto [v]', 'balik kiri-kanan, atau atas-bawah dengan v'],
  kabur: ['.kabur [1-30]', 'blur foto'],
  terang: ['.terang [-100..100]', 'atur kecerahan'],
  warnafoto: ['.warnafoto', 'ambil 6 warna dominan dari foto beserta kode hex'],
  persegi: ['.persegi', 'potong tengah jadi kotak 1:1'],
}
const CMDS = Object.keys(INFO)

async function image(m) {
  const media = L.pickMedia(m)
  if (!media || !['image', 'sticker'].includes(media.kind)) return null
  const buf = await L.download(media)
  return buf && buf.length ? buf : null
}
const open = (buf) => sharp(buf, { failOn: 'none', limitInputPixels: MAX_PIXELS }).rotate()

async function dominant(buf, n = 6) {
  const { data } = await open(buf).resize(64, 64, { fit: 'cover' }).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const bins = new Map()
  for (let i = 0; i < data.length; i += 3) {
    const r = data[i] >> 5, g = data[i + 1] >> 5, b = data[i + 2] >> 5, k = (r << 6) | (g << 3) | b
    const o = bins.get(k) || { n: 0, r: 0, g: 0, b: 0 }; o.n++; o.r += data[i]; o.g += data[i + 1]; o.b += data[i + 2]; bins.set(k, o)
  }
  const cols = [...bins.values()].sort((a, b) => b.n - a.n).map(o => [Math.round(o.r / o.n), Math.round(o.g / o.n), Math.round(o.b / o.n), o.n])
  const out = []
  for (const c of cols) { if (out.every(o => Math.hypot(o[0] - c[0], o[1] - c[1], o[2] - c[2]) > 48)) out.push(c); if (out.length >= n) break }
  return out.map(([r, g, b, c]) => ({ hex: '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join(''), pct: Math.round(c / (data.length / 3) * 100) }))
}
async function paletCard(list) {
  const w = 150 * list.length, H = 260
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${H}">${list.map((c, i) => `<rect x="${i * 150}" y="0" width="150" height="190" fill="${c.hex}"/><rect x="${i * 150}" y="190" width="150" height="70" fill="#fafafa"/><text x="${i * 150 + 75}" y="228" text-anchor="middle" font-family="DejaVu Sans Mono" font-weight="bold" font-size="22" fill="#222">${c.hex.toUpperCase()}</text><text x="${i * 150 + 75}" y="252" text-anchor="middle" font-family="Sans" font-size="16" fill="#777">${c.pct}%</text>`).join('')}</svg>`
  return sharp(Buffer.from(svg)).png().toBuffer()
}

module.exports = {
  name: 'foto', alias: CMDS, category: 'kreasi', cmds: CMDS,
  desc: 'Alat foto: resize, kompres, bulat, hd, watermark, polaroid, putarfoto, balikfoto, kabur, terang, warnafoto, persegi',
  run: async ({ sock, m, text, args, command, prefix, reply }) => {
    const cmd = CMDS.includes(command) ? command : String(args[0] || '').toLowerCase()
    const rest = CMDS.includes(command) ? args : args.slice(1)
    if (!CMDS.includes(cmd)) return reply(`📷 *ALAT FOTO*\n\n> Kirim atau reply sebuah foto, lalu pakai salah satu:\n\n${CMDS.map(c => `> *${INFO[c][0].replace('.', prefix)}* — ${INFO[c][1]}`).join('\n')}`)
    const arg = rest.join(' ').trim()
    const buf = await image(m).catch(() => null)
    if (!buf) return reply(`📷 Kirim atau reply sebuah *foto* dengan ${prefix}${cmd}${INFO[cmd][0].slice(cmd.length + 1)}\n\n_${INFO[cmd][1]}_`)
    try {
      const send = (img, cap, doc) => sock.sendMessage(m.chat, doc ? { document: img, mimetype: 'image/png', fileName: `${cmd}.png`, caption: cap } : { image: img, caption: cap }, { quoted: m })
      const meta = await open(buf).metadata()
      if (cmd === 'resize') {
        const mm = /^(\d{0,5})\s*[x×*]\s*(\d{0,5})$/i.exec(arg)
        if (!mm || (!mm[1] && !mm[2])) return reply(`Format: ${prefix}resize 800x600  (atau 800x  /  x600)`)
        const w = mm[1] ? Math.min(5000, +mm[1]) : null, h = mm[2] ? Math.min(5000, +mm[2]) : null
        const out = await open(buf).resize(w, h, { fit: w && h ? 'fill' : 'inside' }).jpeg({ quality: 92 }).toBuffer()
        const o = await sharp(out).metadata(); return send(out, `📐 Ukuran baru: ${o.width}x${o.height}`)
      }
      if (cmd === 'kompres') {
        const q = Math.min(100, Math.max(1, parseInt(arg) || 60)), out = await open(buf).jpeg({ quality: q, mozjpeg: true }).toBuffer()
        return send(out, `🗜️ Kualitas ${q}: ${(buf.length / 1024).toFixed(0)} KB → ${(out.length / 1024).toFixed(0)} KB (${Math.round((1 - out.length / buf.length) * 100)}% lebih kecil)`)
      }
      if (cmd === 'bulat' || cmd === 'persegi') {
        const s = Math.min(meta.width, meta.height, 1024)
        let img = await open(buf).resize(s, s, { fit: 'cover' }).ensureAlpha().png().toBuffer()
        if (cmd === 'bulat') img = await sharp(img).composite([{ input: Buffer.from(`<svg width="${s}" height="${s}"><circle cx="${s / 2}" cy="${s / 2}" r="${s / 2}"/></svg>`), blend: 'dest-in' }]).png().toBuffer()
        return send(img, cmd === 'bulat' ? '⭕ Foto bulat (PNG transparan)' : '⬛ Potongan persegi', cmd === 'bulat')
      }
      if (cmd === 'hd') {
        const f = arg === '3' ? 3 : 2, w = Math.min(4096, meta.width * f), out = await open(buf).resize({ width: w, kernel: 'lanczos3' }).sharpen({ sigma: 1.1, m1: 1.2, m2: 2 }).modulate({ saturation: 1.06 }).png().toBuffer()
        return send(out, `✨ Diperbesar ${f}x (${w}px lebar) dan dipertajam`, true)
      }
      if (cmd === 'watermark') {
        if (!arg) return reply(`Tulis teksnya. Contoh: ${prefix}watermark © Budi`)
        const { width: W, height: H } = meta, fs = Math.max(20, Math.round(Math.min(W, H) / 14)), t = arg.slice(0, 40).replace(/[<&>]/g, '')
        const rows = [], stepY = fs * 3.4, stepX = Math.max(fs * (t.length * 0.62 + 3), 180)
        for (let y = -H; y < H * 2; y += stepY) for (let x = -W, k = 0; x < W * 2; x += stepX, k++) rows.push(`<text x="${x + (Math.round(y / stepY) % 2 ? stepX / 2 : 0)}" y="${y}">${t}</text>`)
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><g transform="rotate(-28 ${W / 2} ${H / 2})" font-family="Sans" font-weight="bold" font-size="${fs}" fill="#ffffff" fill-opacity="0.38" stroke="#000" stroke-opacity="0.2" stroke-width="1">${rows.join('')}</g></svg>`
        return send(await open(buf).composite([{ input: Buffer.from(svg) }]).jpeg({ quality: 92 }).toBuffer(), '©️ Watermark ditempel')
      }
      if (cmd === 'polaroid') {
        const S = 900, ph = await open(buf).resize(S, S, { fit: 'cover' }).toBuffer(), pad = 50, H = S + pad * 2 + 170
        const cap = (arg || '').slice(0, 60), parts = [{ input: ph, left: pad, top: pad }]
        if (cap) { const t = await K.textBox(cap, S, 120, { color: '#333333', font: 'Serif Italic' }); parts.push(await K.centered(t, pad, S + pad + 20, S, 120)) }
        const frame = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${S + pad * 2}" height="${H}"><rect width="100%" height="100%" fill="#fbfaf5"/></svg>`)
        const out = await sharp(frame).composite(parts).png().toBuffer()
        return send(await sharp({ create: { width: S + pad * 2 + 120, height: H + 120, channels: 4, background: '#d9d4c7' } }).composite([{ input: await sharp(out).rotate(-3, { background: '#00000000' }).toBuffer(), gravity: 'centre' }]).png().toBuffer(), '🖼️ Polaroid', true)
      }
      if (cmd === 'putarfoto') {
        const d = Number.isFinite(parseInt(arg)) ? parseInt(arg) : 90
        return send(await open(buf).rotate(d, { background: '#00000000' }).png().toBuffer(), `🔄 Diputar ${d}°`, true)
      }
      if (cmd === 'balikfoto') return send(await (/^v/i.test(arg) ? open(buf).flip() : open(buf).flop()).jpeg({ quality: 92 }).toBuffer(), '↔️ Dibalik')
      if (cmd === 'kabur') { const s = Math.min(30, Math.max(1, parseFloat(arg) || 8)); return send(await open(buf).blur(s).jpeg({ quality: 90 }).toBuffer(), `🌫️ Blur ${s}`) }
      if (cmd === 'terang') {
        const v = Math.min(100, Math.max(-100, parseInt(arg) || 25))
        return send(await open(buf).modulate({ brightness: 1 + v / 100 }).jpeg({ quality: 92 }).toBuffer(), `💡 Kecerahan ${v > 0 ? '+' : ''}${v}`)
      }
      if (cmd === 'warnafoto') {
        const list = await dominant(buf)
        return send(await paletCard(list), '🎨 Warna dominan:\n' + list.map(c => `${c.hex.toUpperCase()} (${c.pct}%)`).join('\n'))
      }
    } catch (e) { console.log('[foto]', cmd, e.message); reply('❌ Gagal memproses foto: ' + e.message) }
  },
}
