/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// AI PIX — Groq + Gemini dengan fallback otomatis, memori percakapan, format WhatsApp
const axios = require('axios')
const S = require('./settingsdb')

const TTL = 30 * 60 * 1000, MAX_TURN = 8, TIMEOUT = 30000
const hist = new Map()
const PERSONA = {
  ramah:  'Gaya bicaramu hangat, sopan, dan membantu.',
  santai: 'Gaya bicaramu santai ala teman dekat (gue/lo boleh), singkat dan to the point.',
  formal: 'Gaya bicaramu formal, rapi, dan profesional.',
  otaku:  'Gaya bicaramu ceria ala karakter anime, sesekali pakai ungkapan seperti "sugoi" atau "yosh", tapi tetap jelas dan membantu.',
  yandere: 'Gaya bicaramu manis, posesif, dan cemburuan ala gadis yandere (fiksi, lucu), tapi tetap jelas dan membantu.',
}

const arr = (v) => (Array.isArray(v) ? v : [v]).filter(k => typeof k === 'string' && k.trim()).map(k => k.trim())
const keys = () => ({
  groq: arr(global.apikey?.groq),
  gemini: [...new Set([...arr(global.apikey?.google), ...arr(global.apikey?.gemini)])],
})
// pengaman: nama model tidak boleh berupa API key (salah tempel di settings)
const looksLikeKey = (v) => typeof v === 'string' && (/^(gsk_|AIza|AQ\.|sk-|vcp_|cov_|obs-)/.test(v) || (v.length >= 16 && !/[-.:/]/.test(v)) || (v.length > 40 && !/^(llama|gemini|gpt|mixtral|gemma|qwen|deepseek)/i.test(v)))
const modelOf = (v, fallback) => (v && !looksLikeKey(v) ? v : fallback)

const FORMAT = 'Format untuk WhatsApp: *tebal*, _miring_, daftar dengan tanda "-". Jangan pakai tabel markdown atau heading "#". Jangan mengarang fakta.'
function system(extra, override, noPersona) {
  const YA = require('./yandere'), ya = !noPersona && YA.on()
  if (override) return ya ? `${YA.tool(override)}\n${FORMAT}` : `${override}\n${FORMAT}`
  const bot = S.get('botname'), owner = global.ownerInfo?.name || 'shipur'
  if (ya) return `${YA.full(bot, owner)}\nJawab dalam bahasa yang dipakai pengguna (default Bahasa Indonesia).\n${FORMAT} Jika menulis kode, tulis LENGKAP sampai selesai (tanpa "..."), taruh di blok \`\`\`bahasa ... \`\`\` (sebutkan nama bahasanya).${extra ? '\n' + extra : ''}`
  return `Kamu adalah ${bot}, asisten WhatsApp buatan ${owner}. ${PERSONA[S.get('aipersona')] || PERSONA.ramah}
Jawab dalam bahasa yang dipakai pengguna (default Bahasa Indonesia). Pertanyaan sederhana dijawab ringkas. Permintaan kode atau penjelasan teknis dijawab LENGKAP dan utuh: tulis seluruh kode sampai selesai (tanpa "...", tanpa "dan seterusnya", tanpa kerangka kosong), lalu beri penjelasan singkat cara pakainya.
Format untuk WhatsApp: *tebal*, _miring_, daftar dengan tanda "-". Jangan pakai tabel markdown atau heading "#". Jika menulis kode, taruh di blok \`\`\`bahasa ... \`\`\` (sebutkan nama bahasanya). Jangan mengarang fakta; kalau tidak tahu, bilang tidak tahu.${extra ? '\n' + extra : ''}`
}

// markdown umum -> format WhatsApp. Blok kode ```...``` DILINDUNGI (tidak diubah) dan tidak dipotong di tengah.
const WA_CAP = () => Number(global.aiMaxChars) || 24000
function wa(t) {
  const keep = []
  let s = String(t || '').replace(/\r/g, '').replace(/```[\s\S]*?(?:```|$)/g, (b) => { keep.push(b); return `\u0000K${keep.length - 1}\u0000` })
  s = s.replace(/\*\*(.+?)\*\*/gs, '*$1*').replace(/__(.+?)__/gs, '_$1_')
    .replace(/^#{1,6}\s*(.+)$/gm, '*$1*').replace(/^\s*[*•]\s+/gm, '- ').replace(/\n{3,}/g, '\n\n').trim()
  s = s.replace(/\u0000K(\d+)\u0000/g, (_, i) => keep[+i])
  const cap = WA_CAP()
  if (s.length > cap) { s = s.slice(0, cap); if ((s.match(/```/g) || []).length % 2) s += '\n```' }
  return s
}

// batas token jawaban: permintaan kode/panjang diberi ruang besar (dulu tetap 1024 → jawaban terpotong/singkat)
const CODE_RE = /(kode|code|script|skrip|program|fungsi|function|class|html|css|javascript|\bjs\b|python|\bphp\b|java\b|kotlin|c\+\+|sql|bash|plugin|bot|website|web|aplikasi|app\b|game|buatkan|bikinin|bikin|buat|tulis|lengkap|detail|panjang|jelaskan)/i
const maxTok = (text) => {
  const base = Number(global.aiMaxTokens) || 4096, big = Number(global.aiMaxTokensCode) || 8192
  return CODE_RE.test(String(text || '').slice(-1500)) ? Math.max(base, big) : base
}

const errText = (e) => {
  const st = e.response?.status, msg = e.response?.data?.error?.message || e.response?.data?.message || e.message
  return `${st ? st + ' ' : ''}${String(msg).slice(0, 120)}`
}

// ── GROQ ──
async function callGroq(key, msgs, sys) {
  const mt = maxTok(msgs[msgs.length - 1]?.content)
  const models = [modelOf(global.aiModels?.groq, 'llama-3.3-70b-versatile'), modelOf(global.aiModels?.groqFast, 'llama-3.1-8b-instant')]
  let last
  for (const model of [...new Set(models)]) {
    try {
      const r = await axios.post('https://api.groq.com/openai/v1/chat/completions',
        { model, messages: [{ role: 'system', content: sys }, ...msgs], temperature: 0.7, max_tokens: mt },
        { headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' }, timeout: TIMEOUT })
      const t = r.data?.choices?.[0]?.message?.content
      if (t) return { text: t, model }
      last = new Error('respons kosong')
    } catch (e) { last = e; if (e.response?.status === 401 || e.response?.status === 403) break }
  }
  throw last
}

// ── GEMINI (model dipilih otomatis dari API supaya tahan perubahan nama model) ──
const modelCache = new Map()
function rank(list) {
  const bad = /(image|tts|live|embed|audio|robotics|computer|learnlm|thinking|vision|customtools|aqa|gemma|imagen|veo)/i
  const rows = []
  for (const m of list) {
    const name = String(m.name || '').replace('models/', '')
    if (!/^gemini-/.test(name) || bad.test(name) || !(m.supportedGenerationMethods || []).includes('generateContent')) continue
    const v = name.match(/^gemini-(\d+(?:\.\d+)?)-(flash-lite|flash|pro)/); if (!v) continue
    rows.push({ name, ver: parseFloat(v[1]), fam: { flash: 0, 'flash-lite': 1, pro: 2 }[v[2]], pre: /(preview|exp|-0\d{2}$)/.test(name) ? 1 : 0, alias: /-latest$/.test(name) ? 1 : 0 })
  }
  return rows.sort((a, b) => a.pre - b.pre || b.ver - a.ver || a.fam - b.fam || a.alias - b.alias).map(r => r.name).slice(0, 3)
}
async function geminiModels(key) {
  const configured = global.aiModels?.gemini
  if (Array.isArray(configured)) {
    const selected = configured.filter(v => typeof v === 'string' && v.trim() && !looksLikeKey(v)).map(v => v.trim())
    if (selected.length) return [...new Set(selected)]
  }
  if (modelOf(configured, '')) return [configured]
  const c = modelCache.get(key); if (c && Date.now() - c.at < 6 * 3600 * 1000) return c.list
  let list = []
  try {
    const r = await axios.get('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', { headers: { 'x-goog-api-key': key }, timeout: 15000 })
    list = rank(r.data?.models || [])
  } catch {}
  if (!list.length) list = ['gemini-2.5-flash', 'gemini-2.0-flash']
  modelCache.set(key, { at: Date.now(), list }); return list
}
async function callGemini(key, msgs, sys) {
  const mt = maxTok(msgs[msgs.length - 1]?.content)
  let last
  for (const model of await geminiModels(key)) {
    try {
      const r = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        systemInstruction: { parts: [{ text: sys }] },
        contents: msgs.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
        generationConfig: { temperature: 0.7, maxOutputTokens: mt },
      }, { headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' }, timeout: TIMEOUT })
      const t = (r.data?.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('')
      if (t) return { text: t, model }
      last = new Error('respons kosong/diblokir')
    } catch (e) { last = e; if (e.response?.status === 401 || e.response?.status === 403) break; modelCache.delete(key) }
  }
  throw last
}

// urutan percobaan sesuai setting
function chain() {
  const k = keys(), pv = S.get('aiprovider'), out = []
  const g = k.groq.map((key, i) => ({ name: 'groq' + (k.groq.length > 1 ? '#' + (i + 1) : ''), key, fn: callGroq })), m = k.gemini.map((key, i) => ({ name: 'gemini' + (k.gemini.length > 1 ? '#' + (i + 1) : ''), key, fn: callGemini }))
  if (pv === 'gemini') out.push(...m, ...g); else if (pv === 'groq') out.push(...g, ...m); else out.push(...g, ...m)
  return out
}

// uid = kunci memori; extra = tambahan system prompt; memory=false untuk sekali jalan
async function ask({ uid, text, extra, sys, memory, noPersona }) {
  const useMem = memory !== false && S.get('aimemory') && uid
  const h = useMem ? (hist.get(uid) || { at: 0, msgs: [] }) : { at: 0, msgs: [] }
  if (Date.now() - h.at > TTL) h.msgs = []
  const msgs = [...h.msgs, { role: 'user', content: String(text).slice(0, 12000) }]
  const errs = []
  for (const p of chain()) {
    try {
      const r = await p.fn(p.key, msgs, system(extra, sys, noPersona)), out = wa(r.text)
      if (useMem) { h.msgs = [...msgs, { role: 'assistant', content: out }].slice(-MAX_TURN * 2); h.at = Date.now(); hist.set(uid, h) }
      return { text: out, via: `${p.name}/${r.model}` }
    } catch (e) { errs.push(`${p.name}: ${errText(e)}`) }
  }
  const e = new Error(chain().length ? 'Semua penyedia AI gagal' : 'Belum ada API key AI di config.js'); e.details = errs; throw e
}
const clear = (uid) => hist.delete(uid)

// tes tiap penyedia (untuk .aistatus)
async function status() {
  const rows = []
  for (const p of chain()) {
    const t = Date.now()
    try { const r = await p.fn(p.key, [{ role: 'user', content: 'Balas satu kata saja: ok' }], 'Balas singkat.'); rows.push({ name: p.name, ok: true, model: r.model, ms: Date.now() - t }) }
    catch (e) { rows.push({ name: p.name, ok: false, err: errText(e), ms: Date.now() - t }) }
  }
  return rows
}

// ── VISION (Gemini): gambar + instruksi -> teks. Dipakai .ocr dan .lihat ──
async function vision({ image, mime = 'image/jpeg', prompt, sys }) {
  const ks = keys().gemini; if (!ks.length) throw new Error('Butuh API key Gemini di config.js')
  const errs = []
  for (const key of ks) {
    for (const model of await geminiModels(key)) {
      try {
        const r = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          systemInstruction: { parts: [{ text: sys || (() => { const base = 'Kamu pembaca gambar yang teliti. Jawab dalam bahasa pengguna (default Indonesia), ringkas, format WhatsApp (*tebal*, daftar "-"), tanpa heading "#".'; const YA = require('./yandere'); return YA.on() ? YA.tool(base) : base })() }] },
          contents: [{ role: 'user', parts: [{ inlineData: { mimeType: mime, data: Buffer.from(image).toString('base64') } }, { text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
        }, { headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' }, timeout: 60000 })
        const t = (r.data?.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('')
        if (t) return { text: wa(t), model }
        errs.push(`${model}: kosong/diblokir`)
      } catch (e) { errs.push(`${model}: ${errText(e)}`); if (e.response?.status === 401 || e.response?.status === 403) break }
    }
  }
  const e = new Error('Gemini gagal membaca gambar'); e.details = errs; throw e
}

module.exports = { ask, clear, status, wa, rank, system, looksLikeKey, modelOf, vision }
