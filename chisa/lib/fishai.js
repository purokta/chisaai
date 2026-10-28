/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Klien Fish Audio (fish.audio): TTS, daftar suara, kloning suara, dan preferensi suara per pengguna.
// API key: global.apikey.fishaudio (string atau array; kalau satu habis kredit / kena limit, otomatis pindah ke berikutnya).
// Opsional di config.js: global.fishModel = "s2.1-pro" (header "model" untuk TTS).
const axios = require('axios')
const AJ = require('./ajaib')

const BASE = 'https://api.fish.audio'
const FREE_MODEL = 's2.1-pro-free'
const db = AJ.store('fishai.json', { users: {} })
const arr = (v) => (Array.isArray(v) ? v : [v]).filter(k => typeof k === 'string' && k.trim()).map(k => k.trim())
const keys = () => arr(global.apikey && global.apikey.fishaudio)
const hasKey = () => keys().length > 0
const ID_RE = /^[0-9a-f]{32}$/i

const errText = (e) => {
  let d = e.response && e.response.data
  if (d && (Buffer.isBuffer(d) || d instanceof ArrayBuffer)) { try { d = JSON.parse(Buffer.from(d).toString('utf8')) } catch { d = Buffer.from(d).toString('utf8') } }
  const msg = (d && (d.message || d.detail || d.error)) || (typeof d === 'string' ? d : '') || e.message
  return `${e.response ? e.response.status + ' ' : ''}${String(typeof msg === 'string' ? msg : JSON.stringify(msg)).slice(0, 160)}`
}

// jalankan fn(key) dengan semua key bergantian; pindah key hanya untuk 401/402/403/429
async function withKeys(fn) {
  const ks = keys(); if (!ks.length) { const e = new Error('API key Fish Audio belum diisi (global.apikey.fishaudio di config.js)'); e.noKey = true; throw e }
  let last
  for (const k of ks) {
    try { return await fn(k) } catch (e) {
      last = e; const st = e.response && e.response.status
      if (![401, 402, 403, 429].includes(st)) break
    }
  }
  const e = new Error(errText(last)); e.status = last.response && last.response.status; throw e
}

// ── TTS ──  hasil: Buffer mp3
async function tts({ text, voice, speed, model }) {
  text = String(text || '').trim(); if (!text) throw new Error('teks kosong')
  const body = { text: text.slice(0, 1500), format: 'mp3', mp3_bitrate: 128, latency: 'normal' }
  if (voice) body.reference_id = voice
  const sp = Number(speed); if (sp && sp !== 1) body.prosody = { speed: Math.min(2, Math.max(0.5, sp)), volume: 0 }
  const call = (key, mdl) => axios.post(BASE + '/v1/tts', body, {
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', ...(mdl ? { model: mdl } : {}) },
    responseType: 'arraybuffer', timeout: 90000, maxContentLength: 50 * 1048576,
  })
  const mdl = model || global.fishModel || ''
  return withKeys(async (key) => {
    try { return Buffer.from((await call(key, mdl)).data) } catch (e) {
      // kredit habis di model berbayar -> coba model gratis sekali
      if (e.response && e.response.status === 402 && mdl !== FREE_MODEL) return Buffer.from((await call(key, FREE_MODEL)).data)
      throw e
    }
  })
}

// ── ASR bawaan Fish (cadangan; utama lewat lib/stt.js) ──
async function asr(buf, ext, language) {
  const FD = require('form-data')
  const send = (key, mdl) => { const f = new FD(); f.append('audio', buf, { filename: 'audio.' + (ext || 'mp3') }); if (language) f.append('language', language); f.append('ignore_timestamps', 'true')
    return axios.post(BASE + '/v1/asr', f, { headers: { ...f.getHeaders(), Authorization: 'Bearer ' + key, ...(mdl ? { model: mdl } : {}) }, timeout: 120000, maxBodyLength: Infinity }) }
  const r = await withKeys(async (key) => { try { return await send(key, 'transcribe-1-pro') } catch (e) { if ([400, 404, 422].includes(e.response && e.response.status)) return await send(key, '') ; throw e } })
  return String((r.data && r.data.text) || '').replace(/<\|[^|>]+\|>/g, '').trim()
}

// ── daftar suara publik ──
async function searchVoices({ title, language, size = 8 }) {
  const params = { page_size: size, page_number: 1, sort_by: 'score' }
  if (title) params.title = title
  if (language) params.language = language
  const r = await withKeys((key) => axios.get(BASE + '/model', { params, headers: { Authorization: 'Bearer ' + key }, timeout: 30000 }))
  return ((r.data && r.data.items) || []).map(x => ({ id: x._id, name: String(x.title || 'tanpa nama').slice(0, 60), langs: (x.languages || []).slice(0, 3).join(','), author: x.author && (x.author.nickname || x.author.name) || '' }))
}

// ── kloning suara (privat) ──
async function createVoice({ title, audio, ext, text }) {
  const FD = require('form-data')
  const r = await withKeys((key) => { const f = new FD()
    f.append('type', 'tts'); f.append('title', String(title).slice(0, 60)); f.append('train_mode', 'fast'); f.append('visibility', 'private'); f.append('enhance_audio_quality', 'true')
    f.append('voices', audio, { filename: 'voice.' + (ext || 'mp3') }); if (text) f.append('texts', String(text).slice(0, 1000))
    return axios.post(BASE + '/model', f, { headers: { ...f.getHeaders(), Authorization: 'Bearer ' + key }, timeout: 180000, maxBodyLength: Infinity }) })
  const id = r.data && r.data._id; if (!id) throw new Error('Fish tidak mengembalikan ID suara')
  return id
}
async function deleteVoice(id) { await withKeys((key) => axios.delete(`${BASE}/model/${id}`, { headers: { Authorization: 'Bearer ' + key }, timeout: 30000 })) }
async function ping() { const r = await withKeys((key) => axios.get(BASE + '/model', { params: { page_size: 1, self: true }, headers: { Authorization: 'Bearer ' + key }, timeout: 20000 })); return (r.data && r.data.total) ?? 0 }

// ── preferensi per pengguna: { voice:{id,name}, saved:[{id,name,own}], speed } ──
const user = (uid) => { const d = db.get(); d.users = d.users || {}; return d.users[uid] || (d.users[uid] = { voice: null, saved: [], speed: 1 }) }
const save = () => db.save()
function remember(uid, v, makeDefault = true) {
  const u = user(uid), i = u.saved.findIndex(s => s.id === v.id)
  if (i >= 0) u.saved[i] = { ...u.saved[i], ...v }; else u.saved.push(v)
  if (u.saved.length > 15) u.saved = u.saved.filter(s => s.own || s.id === (u.voice && u.voice.id)).concat(u.saved.filter(s => !s.own)).slice(-15)
  if (makeDefault) u.voice = { id: v.id, name: v.name }
  save(); return u
}
const setSpeed = (uid, s) => { user(uid).speed = s; save() }
function forget(uid, id) { const u = user(uid); u.saved = u.saved.filter(s => s.id !== id); if (u.voice && u.voice.id === id) u.voice = u.saved[0] ? { id: u.saved[0].id, name: u.saved[0].name } : null; save() }
// cari suara tersimpan lewat nomor / nama / id; null jika tidak ada
function find(uid, token) {
  if (!token) return null; const u = user(uid), t = String(token).trim()
  if (/^\d{1,2}$/.test(t) && u.saved[Number(t) - 1]) return u.saved[Number(t) - 1]
  const byName = u.saved.find(s => s.name.toLowerCase() === t.toLowerCase()); if (byName) return byName
  if (ID_RE.test(t)) return u.saved.find(s => s.id === t) || { id: t, name: t.slice(0, 8) }
  return null
}

// ── hasil pencarian terakhir (sementara) supaya .fishpilih <no> bisa merujuk ──
const lastSearch = new Map()
const setLast = (uid, list) => { lastSearch.set(uid, { at: Date.now(), list }) }
const getLast = (uid) => { const l = lastSearch.get(uid); return l && Date.now() - l.at < 15 * 60 * 1000 ? l.list : null }

module.exports = { hasKey, tts, asr, searchVoices, createVoice, deleteVoice, ping, user, remember, setSpeed, forget, find, setLast, getLast, errText, ID_RE }
