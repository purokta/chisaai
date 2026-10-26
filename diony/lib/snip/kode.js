/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Studio Kode — kirim kode sebagai BLOK KODE NATIVE WhatsApp (kotak "Lihat kode", ketuk → layar penuh berwarna).
//   .blokkode (alias .bkode) [bahasa] <kode>     atau reply pesan berisi kode        .kodefile (reply dokumen .js/.py/.json/dll)
//   .infokode <kode>          statistik kode                       .contoh [topik]  contoh/template kode siap pakai
//   .tabel <data>             tabel native (kolom dipisah | atau koma, baris dipisah ; atau enter)
const CB = require('../codeblock'), AJ = require('../ajaib'), { B } = require('../style')

const TEMPLATES = {
  plugin: ['javascript', 'Kerangka plugin Chisa AI (taruh di plugins/<kategori>/halo.js)', `module.exports = {
  name: 'halo', alias: ['hai'], category: 'tools', noLimit: true,
  desc: 'Contoh plugin sapaan',
  run: async ({ sock, m, args, prefix, reply }) => {
    const nama = args.join(' ') || 'kamu'
    // balasan biasa
    await reply(\`Halo \${nama}! Coba \${prefix}menu ya\`)
    // reaksi emoji ke pesan pengguna
    await sock.sendMessage(m.chat, { react: { text: '👋', key: m.key } })
  },
}`],
  kirim: ['javascript', 'Cara mengirim berbagai jenis pesan lewat sock.sendMessage', `// teks + kutip pesan pengguna
await sock.sendMessage(m.chat, { text: 'Halo!' }, { quoted: m })

// mention seseorang
await sock.sendMessage(m.chat, { text: \`Halo @\${m.sender.split('@')[0]}\`, mentions: [m.sender] }, { quoted: m })

// gambar dari URL, dengan caption
await sock.sendMessage(m.chat, { image: { url: 'https://example.com/a.jpg' }, caption: 'Ini gambarnya' }, { quoted: m })

// dokumen dari Buffer
await sock.sendMessage(m.chat, { document: Buffer.from('isi file'), fileName: 'catatan.txt', mimetype: 'text/plain' }, { quoted: m })`],
  fetch: ['javascript', 'Ambil data JSON dari API dengan axios + penanganan error', `const axios = require('axios')

async function ambilData(url) {
  try {
    const { data } = await axios.get(url, { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0 (Chisa AI)' } })
    return data
  } catch (e) {
    const status = e.response ? e.response.status : 'tanpa respons'
    throw new Error(\`Gagal mengambil \${url} (\${status})\`)
  }
}

ambilData('https://api.github.com/repos/nodejs/node').then(r => console.log(r.stargazers_count))`],
  retry: ['javascript', 'Coba ulang otomatis (retry) dengan jeda bertambah', `const tidur = (ms) => new Promise(r => setTimeout(r, ms))

async function coba(fn, kali = 3, jeda = 500) {
  let err
  for (let i = 0; i < kali; i++) {
    try { return await fn() } catch (e) { err = e; await tidur(jeda * 2 ** i) }
  }
  throw err
}

// pemakaian
const hasil = await coba(() => fetch('https://example.com/api').then(r => r.json()))`],
  regex: ['javascript', 'Pola regex yang sering dipakai', `const url   = /https?:\\/\\/[^\\s]+/gi
const email = /[\\w.+-]+@[\\w-]+\\.[\\w.-]+/g
const nomor = /(?:\\+62|62|0)8[1-9][0-9]{6,10}/g
const hari  = /\\b(\\d{1,2})[\\/.-](\\d{1,2})[\\/.-](\\d{4})\\b/

const teks = 'Hubungi budi@mail.com atau 081234567890, lihat https://example.com'
console.log(teks.match(url), teks.match(email), teks.match(nomor))`],
  express: ['javascript', 'Server HTTP mini dengan Express', `const express = require('express')
const app = express()
app.use(express.json())

app.get('/', (req, res) => res.json({ ok: true, waktu: new Date().toISOString() }))
app.post('/pesan', (req, res) => {
  const { teks } = req.body || {}
  if (!teks) return res.status(400).json({ error: 'teks wajib diisi' })
  res.json({ balasan: teks.toUpperCase() })
})

app.listen(3000, () => console.log('Jalan di http://localhost:3000'))`],
  python: ['python', 'Python: request HTTP + simpan JSON', `import json
import requests

def ambil(url):
    r = requests.get(url, timeout=15, headers={"User-Agent": "Mozilla/5.0"})
    r.raise_for_status()
    return r.json()

data = ambil("https://api.github.com/repos/python/cpython")
with open("hasil.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
print("Bintang:", data["stargazers_count"])`],
  termux: ['bash', 'Pasang Node.js & jalankan bot di Termux', `pkg update -y && pkg upgrade -y
pkg install -y nodejs-lts git ffmpeg
git clone <url-repo-bot> bot && cd bot
npm install
npm start`],
  sql: ['sql', 'SQL: tabel, isi data, dan kueri dasar', `CREATE TABLE pengguna (
  id INTEGER PRIMARY KEY,
  nama TEXT NOT NULL,
  poin INTEGER DEFAULT 0
);

INSERT INTO pengguna (nama, poin) VALUES ('Ani', 120), ('Budi', 95);

SELECT nama, poin FROM pengguna
WHERE poin > 100
ORDER BY poin DESC
LIMIT 10;`],
}
const TOPICS = Object.keys(TEMPLATES)

const decode = (buf) => buf.toString('utf8')
const looksBinary = (buf) => { const n = Math.min(buf.length, 4000); let z = 0; for (let i = 0; i < n; i++) if (buf[i] === 0) z++; return z > 0 }

function stats(code, lang) {
  const lines = code.split('\n'), nonEmpty = lines.filter(l => l.trim()).length
  const longest = lines.reduce((a, l) => Math.max(a, l.length), 0)
  const cmt = (code.match(/^\s*(\/\/|#|--)/gm) || []).length + (code.match(/\/\*/g) || []).length
  const fn = (code.match(/\bfunction\b|=>|\bdef\s+\w+|\bfunc\s+\w+|\bfn\s+\w+/g) || []).length
  const imp = (code.match(/^\s*(import\b|from\s+\S+\s+import\b|const\s+.*=\s*require\()/gm) || []).length
  const todo = (code.match(/\b(TODO|FIXME|HACK|XXX)\b/g) || []).length
  const asyncN = (code.match(/\basync\b|\bawait\b/g) || []).length
  return { lines: lines.length, nonEmpty, chars: code.length, bytes: Buffer.byteLength(code), longest, cmt, fn, imp, todo, asyncN, lang }
}

function parseTable(raw) {
  let lines = raw.replace(/\r/g, '').split('\n').map(s => s.trim()).filter(Boolean)
  let title = ''
  if (lines[0] && /^#/.test(lines[0])) { title = lines.shift().replace(/^#+\s*/, '') }
  if (lines.length === 1 && lines[0].includes(';')) lines = lines[0].split(';').map(s => s.trim()).filter(Boolean)
  const sep = lines.some(l => l.includes('|')) ? '|' : ','
  let rows = lines.map(l => l.split(sep).map(c => c.trim()))
  rows = rows.slice(0, 30).map(r => r.slice(0, 8))
  const w = Math.max(0, ...rows.map(r => r.length))
  rows = rows.map(r => Array.from({ length: w }, (_, i) => r[i] ?? ''))
  return { title, rows }
}

module.exports = {
  name: 'blokkode', alias: ['bkode', 'kodeblok', 'codeblock', 'kodefile', 'infokode', 'contoh', 'tabel'], category: 'tools', noLimit: true,
  cmds: ['blokkode', 'kodefile', 'infokode', 'contoh', 'tabel'],
  desc: 'Studio Kode: kirim kode sebagai blok kode native WhatsApp (ketuk "Lihat kode"), info kode, contoh kode, tabel native',
  run: async (ctx) => {
    const { sock, m, command, prefix, reply } = ctx
    const raw = CB.rawArgs(ctx)
    const quoted = (m.quoted && (m.quoted.text || m.quoted.caption || m.quoted.conversation)) || ''
    const P = prefix || '.'

    if (command === 'contoh') {
      const t = (raw.trim().split(/\s+/)[0] || '').toLowerCase()
      if (!t || !TEMPLATES[t]) {
        return reply(`${B('CONTOH KODE')}\nKetik ${P}snip contoh <topik>:\n${TOPICS.map(x => `• ${x} — ${TEMPLATES[x][1]}`).join('\n')}`)
      }
      const [lang, ket, code] = TEMPLATES[t]
      return CB.sendCode(sock, m, { intro: `📚 *${ket}*`, code, lang, react: '📚' })
    }

    if (command === 'tabel') {
      const src = raw.trim() || quoted.trim()
      if (!src) return reply(`${B('TABEL')}\nKolom dipisah | atau koma. Baris dipisah ; atau baris baru. Baris pertama = judul kolom.\n\n${P}snip tabel Nama|Poin;Ani|120;Budi|95\n\nJudul tabel (opsional): baris pertama diawali #\n${P}snip tabel\n# Skor Lomba\nNama,Poin\nAni,120`)
      const { title, rows } = parseTable(src)
      if (rows.length < 1 || !rows[0].length) return reply('✕ Data tabel kosong.')
      return CB.sendTable(sock, m, { title, rows, intro: title ? `📊 *${title}*` : '📊 *Tabel*', react: '📊' })
    }

    if (command === 'kodefile') {
      const media = AJ.pickNode(m, ['document'])
      if (!media) return reply(`${B('KODE DARI FILE')}\nReply sebuah dokumen kode (.js .py .json .html .css .sh .sql .txt dll) dengan ${P}snip file`)
      const name = String(media.node.fileName || 'file'), size = Number(media.node.fileLength || 0)
      if (size > 400 * 1024) return reply('✕ File terlalu besar (maks 400 KB).')
      let buf; try { buf = await AJ.download(media) } catch (e) { return reply('✕ Gagal mengunduh file.') }
      if (looksBinary(buf)) return reply('✕ File ini bukan teks/kode (berisi data biner).')
      let code = decode(buf).replace(/\r\n/g, '\n'), cut = false
      if (code.length > CB.MAX_CODE) { code = code.slice(0, CB.MAX_CODE); cut = true }
      const lang = CB.EXT_LANG(name) || CB.detectLang(code)
      return CB.sendCode(sock, m, { intro: `📄 *${name}* — ${code.split('\n').length} baris${cut ? ' (dipotong, file terlalu panjang)' : ''}`, code, lang, react: '📄' })
    }

    // kode / infokode: ambil dari argumen, atau dari pesan yang di-reply
    let src = raw, lang = null
    const f = CB.unfence(src)
    if (/```/.test(src)) { src = f.code; lang = f.lang } else { const sp = CB.splitLang(src); src = sp.code; lang = sp.lang }
    if (!src.trim() && quoted.trim()) {
      const fq = CB.unfence(quoted)
      src = /```/.test(quoted) ? fq.code : quoted
      lang = lang || (/```/.test(quoted) ? fq.lang : null)
      if (raw.trim() && CB.isLang(raw.trim())) lang = CB.normLang(raw.trim())
    }
    if (!src.trim()) {
      return reply(`${B(command === 'infokode' ? 'INFO KODE' : 'BLOK KODE')}\nKirim kode sebagai kotak "Lihat kode" bawaan WhatsApp:\n\n${P}snip kode js\nconsole.log('halo')\n\n• Bahasa: js ts json py bash html css sql java kotlin c cpp go rust php yaml dll (boleh dikosongkan, dideteksi otomatis)\n• Atau reply pesan berisi kode: ${P}snip kode  /  ${P}snip kode py\n• Dokumen kode: reply file lalu ${P}snip file\n• Contoh siap pakai: ${P}snip contoh`)
    }
    src = src.replace(/\r\n/g, '\n').replace(/^\n+|\s+$/g, '')
    lang = lang || CB.detectLang(src)

    if (command === 'infokode') {
      const s = stats(src, lang)
      return reply(`🧾 ${B('INFO KODE')}\n┣ Bahasa    : ${CB.langTitle(lang)}\n┣ Baris     : ${s.lines} (${s.nonEmpty} berisi)\n┣ Karakter  : ${s.chars} (${s.bytes} byte)\n┣ Terpanjang: ${s.longest} karakter/baris\n┣ Fungsi    : ~${s.fn}\n┣ Import    : ${s.imp}\n┣ Async/await: ${s.asyncN}\n┣ Komentar  : ${s.cmt}\n┗ TODO/FIXME: ${s.todo}`)
    }
    const title = `💻 *${CB.langTitle(lang)}* — ${src.split('\n').length} baris. Ketuk *Lihat kode* untuk membukanya.`
    return CB.sendCode(sock, m, { intro: title, code: src, lang, react: '💻' })
  },
}
