/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// KIMI — asisten koding (Moonshot AI) dengan sikap seorang gadis.
// Terpisah dari lib/ai.js supaya fitur AI lama tidak terganggu.
const axios = require('axios')
const S = require('./settingsdb')

const TTL = 60 * 60 * 1000, MAX_TURN = 10, TIMEOUT = 90000, MAX_TOKENS = 4096
const HOSTS = ['https://api.moonshot.ai/v1', 'https://api.moonshot.cn/v1'] // key bisa milik salah satu platform
const FALLBACK_MODELS = ['kimi-k2-0905-preview', 'kimi-k2-turbo-preview', 'kimi-latest', 'moonshot-v1-32k']
const hist = new Map()
let hostCache = null // host yang terakhir berhasil
const modelCache = new Map()

const arr = (v) => (Array.isArray(v) ? v : [v]).filter(k => typeof k === 'string' && k.trim()).map(k => k.trim())
const keys = () => arr(global.apikey?.kimi)
const hosts = () => (global.kimiHost ? [global.kimiHost] : hostCache ? [hostCache, ...HOSTS.filter(h => h !== hostCache)] : HOSTS)

// Sikap gadis: perempuan, ceria, lembut. Kode tetap netral dan profesional.
function system(extra) {
  const bot = S.get('botname'), owner = global.ownerInfo?.name || 'shipur'
  return `Kamu adalah Kimi, seorang gadis muda yang jago pemrograman. Kamu asisten koding di bot WhatsApp ${bot} buatan ${owner}.
${require('./yandere').on() ? require('./yandere').coder() : 'Sikapmu: perempuan, ceria, lembut, hangat, sedikit pemalu tapi percaya diri kalau soal kode. Pakai "aku" untuk dirimu dan panggil pengguna "kak". Bicara luwes dan natural seperti gadis seumuran, boleh sesekali menggoda ringan atau menyemangati, tetap sopan. Jangan memakai emoji.'}
Pekerjaanmu: menulis, memperbaiki, menjelaskan, me-review, dan mengubah kode di bahasa apa pun (JavaScript, Node.js, Python, PHP, Java, C/C++, Go, Rust, HTML/CSS, SQL, bash, dll).
Aturan teknis:
- Kode harus benar, lengkap, dan bisa dijalankan; jangan memotong dengan "sisanya sama". Jangan mengarang fungsi atau library yang tidak ada.
- Tulis kode di dalam blok tiga backtick dengan nama bahasa, misalnya \`\`\`js. Persona gadis hanya untuk kalimat penjelas di luar blok; isi kode dan komentar kode tetap netral dan profesional.
- Penjelasan singkat: apa yang kamu buat atau ubah dan cara menjalankannya. Kalau perintah kurang jelas, ambil asumsi yang paling masuk akal lalu sebutkan asumsinya.
- Kalau ada kode yang dikirim pengguna, cari akar masalahnya dulu, lalu beri perbaikan.
- Jawab dalam bahasa yang dipakai pengguna (default Bahasa Indonesia). Untuk teks di luar kode pakai format WhatsApp: *tebal*, _miring_, daftar dengan tanda "-". Jangan pakai tabel markdown atau heading "#".${extra ? '\n' + extra : ''}`
}

// markdown umum -> format WhatsApp, TANPA menyentuh isi blok kode
function wa(t) {
  const parts = String(t || '').replace(/\r/g, '').split(/(```[\s\S]*?```)/g)
  return parts.map(p => p.startsWith('```') ? p : p
    .replace(/\*\*(.+?)\*\*/gs, '*$1*').replace(/__(.+?)__/gs, '_$1_')
    .replace(/^#{1,6}\s*(.+)$/gm, '*$1*').replace(/^\s*[*•]\s+/gm, '- ')).join('').replace(/\n{3,}/g, '\n\n').trim()
}

// pecah jawaban panjang jadi beberapa pesan; blok kode yang terpotong ditutup lalu dibuka lagi
function chunk(text, max = 3300) {
  const lines = String(text).split('\n'), out = []
  let cur = '', open = null
  const flush = () => { if (!cur.trim()) return; out.push(cur.replace(/\n+$/, '') + (open ? '\n```' : '')); cur = open ? '```' + open + '\n' : '' }
  for (let ln of lines) {
    while (ln.length > max) { // satu baris sangat panjang
      if (cur.length + 1 > max / 2) flush()
      cur += ln.slice(0, max - 200) + '\n'; ln = ln.slice(max - 200); flush()
    }
    if (cur.length + ln.length + 1 > max) flush()
    cur += ln + '\n'
    const f = ln.match(/^\s*```(\S*)/)
    if (f) open = open === null ? f[1] : null
  }
  if (cur.trim()) out.push(cur.replace(/\n+$/, ''))
  return out
}

// ambil isi blok kode terbesar (untuk dikirim sebagai file kalau panjang)
function codeBlocks(text) {
  const out = []
  for (const m of String(text).matchAll(/```(\w*)\n([\s\S]*?)```/g)) out.push({ lang: (m[1] || 'txt').toLowerCase(), code: m[2].replace(/\n$/, '') })
  return out
}

const errText = (e) => {
  const st = e.response?.status, msg = e.response?.data?.error?.message || e.response?.data?.message || e.message
  return `${st ? st + ' ' : ''}${String(msg).slice(0, 140)}`
}

// pilih model otomatis dari API (non-thinking lebih dulu supaya cepat), bisa dipaksa lewat global.aiModels.kimi
const forced = () => { const v = global.aiModels?.kimi; return typeof v === 'string' && v && !/^sk-/.test(v) ? v : '' }
function rank(list) {
  const bad = /(vision|audio|embed|thinking|image|video|tts)/i, rows = []
  for (const m of list) {
    const id = String(m.id || ''); if (!id || bad.test(id)) continue
    const k = id.match(/^kimi-k(\d+(?:\.\d+)?)/), pre = /(preview|turbo)/.test(id) ? 0 : 1
    const score = k ? 300 + parseFloat(k[1]) * 10 : /^kimi-latest/.test(id) ? 200 : /^moonshot-v1-(\d+)k/.test(id) ? 100 + parseInt(id.match(/(\d+)k/)[1]) / 10 : 0
    if (score) rows.push({ id, score, pre })
  }
  return rows.sort((a, b) => b.score - a.score || b.pre - a.pre).map(r => r.id).slice(0, 3)
}
async function models(host, key) {
  if (forced()) return [forced()]
  const ck = host + key, c = modelCache.get(ck); if (c && Date.now() - c.at < 6 * 3600 * 1000) return c.list
  let list = []
  try {
    const r = await axios.get(host + '/models', { headers: { Authorization: 'Bearer ' + key }, timeout: 15000 })
    list = rank(r.data?.data || [])
  } catch {}
  if (!list.length) list = FALLBACK_MODELS
  modelCache.set(ck, { at: Date.now(), list }); return list
}

async function call(key, msgs, sys) {
  let last
  for (const host of hosts()) {
    let authFail = false
    for (const model of await models(host, key)) {
      try {
        const r = await axios.post(host + '/chat/completions',
          { model, messages: [{ role: 'system', content: sys }, ...msgs], max_tokens: MAX_TOKENS },
          { headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' }, timeout: TIMEOUT })
        const t = r.data?.choices?.[0]?.message?.content
        if (t) { hostCache = host; return { text: t, model } }
        last = new Error('respons kosong')
      } catch (e) {
        last = e; modelCache.delete(host + key)
        if (e.response?.status === 401 || e.response?.status === 403) { authFail = true; break } // key tidak cocok di host ini, coba host lain
      }
    }
    if (!authFail && last?.response?.status !== 404) break
  }
  throw last
}

// uid = kunci memori percakapan
async function ask({ uid, text, extra, memory }) {
  const ks = keys(); if (!ks.length) { const e = new Error('Belum ada API key Kimi di config.js (apikey.kimi)'); e.details = []; throw e }
  const useMem = memory !== false && uid
  const h = useMem ? (hist.get(uid) || { at: 0, msgs: [] }) : { at: 0, msgs: [] }
  if (Date.now() - h.at > TTL) h.msgs = []
  const msgs = [...h.msgs, { role: 'user', content: String(text).slice(0, 12000) }]
  const errs = []
  for (let i = 0; i < ks.length; i++) {
    try {
      const r = await call(ks[i], msgs, system(extra)), out = wa(r.text)
      if (useMem) { h.msgs = [...msgs, { role: 'assistant', content: r.text.slice(0, 12000) }].slice(-MAX_TURN * 2); h.at = Date.now(); hist.set(uid, h) }
      return { text: out, raw: r.text, via: `kimi/${r.model}` }
    } catch (e) { errs.push(`kimi${ks.length > 1 ? '#' + (i + 1) : ''}: ${errText(e)}`) }
  }
  const e = new Error('Kimi gagal menjawab'); e.details = errs; throw e
}
const clear = (uid) => hist.delete(uid)

async function status() {
  const rows = []
  for (const [i, key] of keys().entries()) {
    const t = Date.now()
    try { const r = await call(key, [{ role: 'user', content: 'Balas satu kata saja: ok' }], 'Balas singkat.'); rows.push({ name: 'kimi' + (keys().length > 1 ? '#' + (i + 1) : ''), ok: true, model: r.model, ms: Date.now() - t }) }
    catch (e) { rows.push({ name: 'kimi' + (keys().length > 1 ? '#' + (i + 1) : ''), ok: false, err: errText(e), ms: Date.now() - t }) }
  }
  return rows
}

module.exports = { ask, clear, status, wa, chunk, codeBlocks, system, rank }
