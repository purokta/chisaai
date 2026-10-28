/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .tofigure — foto karakter jadi figurin skala 1/7 (diport dari Furina, tanpa dependency baru).
//   Kirim / reply foto dengan .tofigure. Memakai layanan editor gambar live3d.io (pihak ketiga, bisa berubah sewaktu-waktu).
//   Jika gagal, error dilempar ke handler sehingga jatah limit otomatis dikembalikan.
const axios = require('axios'), crypto = require('crypto'), FormData = require('form-data')
const { B } = require('../../lib/style'), AJ = require('../../lib/ajaib'), IP = require('../../lib/imgprov'), G = require('../../lib/gemimg')

const PROMPT = `Using the model, create a 1/7 scale commercialized figurine of the characters in the picture, in a realistic style, in a real environment. The figurine is placed on a computer desk. The figurine has a round transparent acrylic base, with no text on the base. The content on the computer screen is the ZBrush modeling process of this figurine. Next to the computer screen is a BANDAI-style toy packaging box printed with the original artwork. The packaging features two-dimensional flat illustrations`
const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCwlO+boC6cwRo3UfXVBadaYwcX
0zKS2fuVNY2qZ0dgwb1NJ+/Q9FeAosL4ONiosD71on3PVYqRUlL5045mvH2K9i8b
AFVMEip7E6RMK6tKAAif7xzZrXnP1GZ5Rijtqdgwh+YmzTo39cuBCsZqK9oEoeQ3
r/myG9S+9cR5huTuFQIDAQAB
-----END PUBLIC KEY-----`
const API = 'https://app-v1.live3d.io/aitools', ORIGIN = '8f3f0c7387123ae0', MAX = 10 * 1024 * 1024, COOLDOWN = 20000, MAX_WAIT = 150000
const last = new Map()

const rnd = (n) => { const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'; let s = ''; for (let i = 0; i < n; i++) s += c[crypto.randomInt(c.length)]; return s }
// AES-128-CBC, kunci = IV = string 16 karakter (setara CryptoJS.AES dengan kunci UTF-8), hasil base64
const aesenc = (data, key) => { const k = Buffer.from(key, 'utf8'), c = crypto.createCipheriv('aes-128-cbc', k, k); return Buffer.concat([c.update(data, 'utf8'), c.final()]).toString('base64') }
const rsaenc = (data) => crypto.publicEncrypt({ key: PUBLIC_KEY, padding: crypto.constants.RSA_PKCS1_PADDING }, Buffer.from(data, 'utf8')).toString('base64')
function headers(fp) {
  const i = rnd(16), s = rsaenc(i), now = Date.now()
  return {
    'User-Agent': 'Mozilla/5.0', Accept: 'application/json, text/plain, */*', 'Accept-Language': 'id,en-US;q=0.9,en;q=0.8',
    origin: 'https://live3d.io', referer: 'https://live3d.io/',
    'theme-version': '83EmcUoQTUv50LhNx0VrdcK8rcGexcP35FcZDcpgWsAXEyO4xqL5shCY6sFIWB2Q',
    fp, fp1: aesenc(`aifaceswap:${fp}`, i), 'x-guide': s,
    'x-sign': aesenc(`aifaceswap:1H5tRtzsBkqXcaJ:${now}:${rnd(8)}:${s}`, i), 'x-code': String(now),
  }
}
const sleep = (ms) => new Promise(r => setTimeout(r, ms))

async function edit(buf, mime) {
  const fp = crypto.randomBytes(16).toString('hex')
  const form = new FormData()
  form.append('file', buf, { filename: 'foto.' + (/png/.test(mime) ? 'png' : 'jpg'), contentType: mime })
  form.append('fn_name', 'demo-image-editor'); form.append('request_from', '9'); form.append('origin_from', ORIGIN)
  const up = await axios.post(`${API}/upload-img`, form, { headers: { ...headers(fp), ...form.getHeaders() }, timeout: 60000, maxBodyLength: Infinity })
  const path = up.data && up.data.data && up.data.data.path
  if (!path) throw new Error('unggah gambar ditolak layanan')
  const job = await axios.post(`${API}/of/create`, {
    fn_name: 'demo-image-editor', call_type: 3,
    input: { model: 'nano_banana_2', source_images: [path], prompt: PROMPT, aspect_radio: 'auto', request_from: 9 },
    request_from: 9, origin_from: ORIGIN,
  }, { headers: { ...headers(fp), 'Content-Type': 'application/json' }, timeout: 60000 })
  const task = job.data && job.data.data && job.data.data.task_id
  if (!task) throw new Error('tugas gagal dibuat')
  const t0 = Date.now()
  while (Date.now() - t0 < MAX_WAIT) {
    await sleep(4000)
    const r = await axios.post(`${API}/of/check-status`, { task_id: task, fn_name: 'demo-image-editor', call_type: 3, request_from: 9, origin_from: ORIGIN },
      { headers: { ...headers(fp), 'Content-Type': 'application/json' }, timeout: 30000 })
    const d = r.data && r.data.data
    if (d && d.status === 2 && d.result_image) return 'https://temp.live3d.io/' + d.result_image
    if (d && d.status > 2) throw new Error('layanan gagal memproses gambar')
  }
  throw new Error('waktu habis, coba lagi nanti')
}

module.exports = {
  name: 'tofigure', alias: ['jadifigure', 'figurin', 'figure'], category: 'kreasi', cmds: ['tofigure'], noLimit: false,
  desc: 'Ubah foto karakter jadi figurin skala 1/7 di meja komputer (AI)',
  run: async ({ sock, m, prefix, reply }) => {
    const media = AJ.pickNode(m, ['image'])
    if (!media) return reply(`${B('TO FIGURE')}\nKirim atau reply foto dengan ${prefix || '.'}tofigure\nFoto karakter diubah jadi figurin skala 1/7 lengkap dengan kotak kemasan.`)
    if (Number(media.node.fileLength || 0) > MAX) return reply('✕ Ukuran foto maksimal 10 MB.')
    const now = Date.now(), prev = last.get(m.sender) || 0
    if (now - prev < COOLDOWN) return reply(`⏳ Tunggu ${Math.ceil((COOLDOWN - (now - prev)) / 1000)} detik lagi.`)
    last.set(m.sender, now)
    sock.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {})
    try {
      const buf = await AJ.download(media)
      if (!buf || !buf.length) throw new Error('foto gagal diunduh dari WhatsApp')
      if (buf.length > MAX) return reply('✕ Ukuran foto maksimal 10 MB.')
      const mime = String(media.mime || 'image/jpeg').split(';')[0]
      // penyedia: auto = live3d dulu, lalu Gemini (lebih stabil), lalu Firefly/Kyyz bila terisi
      // .set figprovider live3d|gemini|firefly|kyyz untuk paksa satu penyedia
      const out = await IP.dispatch('figure', { prompt: PROMPT, image: buf, mime }, {
        live3d: async (r) => ({ url: await edit(r.image, r.mime) }),
        gemini: async (r) => G.edit({ prompt: r.prompt, image: r.image, mime: r.mime }),
      })
      await sock.sendMessage(m.chat, { image: out.buffer || { url: out.url }, caption: `${B('TO FIGURE')}\nFigurin skala 1/7 selesai.` }, { quoted: m })
      sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {})
    } catch (e) {
      last.delete(m.sender)
      sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {})
      throw e
    }
  },
}
