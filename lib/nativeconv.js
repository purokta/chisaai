// Konverter gambar bawaan aplikasi Android (BotService membuka server lokal 127.0.0.1): dipakai karena ffmpeg diblokir Android.
// Env CHISA_CONV = "http://127.0.0.1:PORT". Di luar aplikasi (Termux) tidak ada, dan ffmpeg dipakai seperti biasa.
const base = () => process.env.CHISA_CONV || ''
const available = () => !!base()

async function post(route, buffer, timeout = 30000) {
  const res = await fetch(base() + route, { method: 'POST', body: buffer, headers: { 'content-type': 'application/octet-stream' }, signal: AbortSignal.timeout(timeout) })
  if (!res.ok) throw new Error('konverter ' + res.status + ': ' + (await res.text().catch(() => '')).slice(0, 80))
  return Buffer.from(await res.arrayBuffer())
}
module.exports = {
  available,
  toWebp: buf => post('/webp', buf),        // gambar -> WebP 512x512 transparan (stiker)
  videoFrame: (buf, ms = 0) => post('/frame?t=' + ms, buf), // bingkai video -> PNG
  toPng: buf => post('/png', buf),          // WebP/JPEG/... -> PNG
  thumb: (buf, w = 480) => post('/jpeg?w=' + w, buf) // perkecil -> JPEG
}
