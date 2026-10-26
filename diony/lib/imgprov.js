/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// lib/imgprov.js — pemilih penyedia gambar untuk .toanime .tochibi .tofigure .gimg .editgambar
//
// Penyedia:  gemini (bawaan, config.js apikey.gemini/google) • live3d (bawaan .tofigure, tanpa key)
//            firefly • kyyz  → adapter GENERIK: alamat & format request diisi di config.js (global.imgApi).
//            .tofigure auto: live3d → gemini → firefly/kyyz (gemini sebagai cadangan stabil).
// Pilih:     .set imgprovider auto|gemini|firefly|kyyz     (anime, chibi, gimg, editgambar)
//            .set figprovider auto|live3d|gemini|firefly|kyyz  (tofigure)
//            auto = urutan bawaan, lalu cadangan ke penyedia lain yang sudah terisi.
// Key:       config.js apikey.firefly / apikey.kyyz, atau lewat chat: .apikey set firefly <key>
//            (disimpan di lib/database/apikeys.json, menimpa config.js; array = dirotasi bila 401/403/429).
//
// Bentuk global.imgApi.<nama> (semua opsional kecuali url):
//   url      alamat endpoint (boleh memuat {key} {prompt} {id})        method  'POST' (bawaan) | 'GET'
//   auth     { in:'header'|'bearer'|'query'|'body', name:'x-api-key' }  → di mana key diletakkan
//   send     'json' (bawaan) | 'form' | 'urlencoded' | 'query'          body / query / headers  → objek; nilai boleh berisi:
//            {prompt} {aspect} {key} {image}=base64 {dataurl} {imageurl}=diunggah ke catbox dll {file}=berkas (send:'form')
//            Nilai yang hanya berisi satu placeholder kosong (mis. {image} saat buat-gambar-dari-teks) otomatis dibuang.
//   result   jalur hasil di JSON, mis. 'data.url' / 'result.0.image' (array = coba satu-satu). Hasil boleh URL, data:URL, atau base64.
//            Bila respons langsung berupa gambar (image/*), tidak perlu result.
//   error    jalur pesan error di JSON (opsional)
//   poll     untuk API asinkron: { id:'data.task_id', url:'https://.../status/{id}', method:'GET', status:'data.status',
//            done:['success',2], fail:['failed',3], result:'data.image', every:4000, max:150000 }
const fs = require('fs'), path = require('path')
const axios = require('axios')

const FILE = path.join(global.dionyData, 'apikeys.json')
const CUSTOM = ['firefly', 'kyyz']
const ORDER = { image: ['gemini', 'firefly', 'kyyz'], figure: ['live3d', 'gemini', 'firefly', 'kyyz'] }
const SETTING = { image: 'imgprovider', figure: 'figprovider' }

const arr = (v) => (Array.isArray(v) ? v : [v]).filter(k => typeof k === 'string' && k.trim() && !/^ISI_/i.test(k.trim())).map(k => k.trim())
const sleep = (ms) => new Promise(r => setTimeout(r, ms))
const mkErr = (code, message, details) => { const e = new Error(message); e.code = code; if (details) e.details = details; return e }

// ── penyimpanan key / url dari chat ──
let store = {}
try { store = JSON.parse(fs.readFileSync(FILE, 'utf8')) } catch { store = {} }
store.keys = store.keys || {}; store.urls = store.urls || {}
const save = () => { try { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(store, null, 2)) } catch (e) { console.log('[imgprov] gagal simpan:', e.message) } }
const known = (n) => CUSTOM.includes(String(n).toLowerCase())

function keys(name) {
  const own = arr(store.keys[name] || [])
  return own.length ? own : arr(global.apikey && global.apikey[name])
}
function cfg(name) {
  const c = (global.imgApi && global.imgApi[name]) || {}, url = store.urls[name] || c.url || ''
  return { ...c, url: /^ISI_/i.test(url) ? '' : url }
}
const missing = (name) => {
  const out = []; if (!cfg(name).url) out.push('alamat API'); if (!keys(name).length) out.push('API key'); return out
}
const configured = (name) => !missing(name).length

function setKey(name, key, add) {
  name = String(name).toLowerCase(); if (!known(name)) return false
  const cur = add ? arr(store.keys[name] || []) : []
  store.keys[name] = [...new Set([...cur, String(key).trim()])]; save(); return true
}
function delKey(name) { name = String(name).toLowerCase(); if (!known(name)) return false; delete store.keys[name]; save(); return true }
function setUrl(name, url) {
  name = String(name).toLowerCase(); if (!known(name)) return false
  if (url) store.urls[name] = String(url).trim(); else delete store.urls[name]
  save(); return true
}
const mask = (k) => (k.length <= 8 ? '••••' : k.slice(0, 4) + '…' + k.slice(-3))

function status() {
  const S = require('./settingsdb')
  const rows = ['gemini', ...CUSTOM].map(n => {
    if (n === 'gemini') { const ks = require('./gemimg').keys(); return { name: n, ok: ks.length > 0, keys: ks.map(mask), note: ks.length ? '' : 'API key belum diisi' } }
    const ks = keys(n), m = missing(n), c = cfg(n)
    return { name: n, ok: !m.length, keys: ks.map(mask), url: c.url, note: m.length ? 'belum ada ' + m.join(' & ') : '', own: arr(store.keys[n] || []).length > 0 }
  })
  return { rows, imgprovider: S.get('imgprovider') || 'auto', figprovider: S.get('figprovider') || 'auto' }
}

// ── adapter generik ──
const get = (o, p) => String(p || '').split('.').filter(Boolean).reduce((a, k) => (a == null ? a : a[k]), o)
const DROP = Symbol('drop')
function fill(v, ctx) {
  if (typeof v === 'string') {
    const one = v.match(/^\{(\w+)\}$/)
    if (one) { const x = ctx[one[1]]; return x === undefined || x === '' || x === null ? DROP : x }
    return v.replace(/\{(\w+)\}/g, (_, n) => (Buffer.isBuffer(ctx[n]) ? '' : String(ctx[n] ?? '')))
  }
  if (Array.isArray(v)) return v.map(x => fill(x, ctx)).filter(x => x !== DROP)
  if (v && typeof v === 'object' && !Buffer.isBuffer(v)) {
    const o = {}; for (const [k, x] of Object.entries(v)) { const r = fill(x, ctx); if (r !== DROP) o[k] = r } return o
  }
  return v
}
const strip = (o) => (o === DROP ? {} : o)

function placeKey(c, key, req) {
  const a = c.auth || { in: 'header', name: 'x-api-key' }, n = a.name || 'x-api-key'
  if (a.in === 'bearer') req.headers.Authorization = 'Bearer ' + key
  else if (a.in === 'query') req.params[n] = key
  else if (a.in === 'body') req.bodyExtra[n] = key
  else req.headers[n] = key
}

async function upload(buf, mime) {
  const hosts = require('../plugins/tools/tourl').HOSTS
  const ext = /png/.test(mime) ? 'png' : 'jpg'; let last
  for (const h of hosts) { try { const u = await h.up(buf, 'foto.' + ext, mime); if (u) return u } catch (e) { last = e } }
  throw mkErr('fail', 'Gagal mengunggah foto ke layanan penampung sementara' + (last ? ': ' + last.message : ''))
}

async function toImage(data, ctype) {
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(data)
  if (/^image\//i.test(ctype || '') || (buf[0] === 0xff && buf[1] === 0xd8) || (buf[0] === 0x89 && buf[1] === 0x50) || buf.slice(0, 4).toString() === 'RIFF') return buf
  return null
}
async function fromValue(v) {
  if (v && typeof v === 'object') v = v.url || v.image || v.base64 || v.b64_json || v.data
  if (typeof v !== 'string' || !v) return null
  if (/^https?:\/\//i.test(v)) { const r = await axios.get(v, { responseType: 'arraybuffer', timeout: 60000 }); return Buffer.from(r.data) }
  const b64 = v.replace(/^data:[^,]+,/, '')
  return /^[A-Za-z0-9+/=\s]{200,}$/.test(b64) ? Buffer.from(b64, 'base64') : null
}
async function extract(resp, paths) {
  for (const p of arr2(paths)) { const img = await fromValue(get(resp, p)); if (img) return img }
  return null
}
const arr2 = (p) => (Array.isArray(p) ? p : p ? [p] : [])

async function http(c, method, url, req, send, key) {
  const FormData = require('form-data'), h = { 'User-Agent': 'Mozilla/5.0 ChisaBot', ...req.headers }
  const o = { method, url, params: req.params, headers: h, responseType: 'arraybuffer', timeout: 120000, maxBodyLength: Infinity, validateStatus: () => true }
  const body = { ...req.body, ...req.bodyExtra }
  if (method !== 'GET' && Object.keys(body).length) {
    if (send === 'form') {
      const f = new FormData()
      for (const [k, v] of Object.entries(body)) { if (Buffer.isBuffer(v)) f.append(k, v, { filename: 'foto.jpg', contentType: 'image/jpeg' }); else f.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v)) }
      o.data = f; o.headers = { ...h, ...f.getHeaders() }
    } else if (send === 'urlencoded') { o.data = new URLSearchParams(Object.entries(body).map(([k, v]) => [k, String(v)])).toString(); o.headers = { ...h, 'Content-Type': 'application/x-www-form-urlencoded' } }
    else if (send !== 'query') { o.data = body; o.headers = { ...h, 'Content-Type': 'application/json' } }
  }
  if (send === 'query' || method === 'GET') o.params = { ...body, ...req.params }
  const r = await axios.request(o)
  return { status: r.status, ctype: String(r.headers && r.headers['content-type'] || ''), data: Buffer.from(r.data || '') }
}
const parseJson = (d) => { try { return JSON.parse(d.toString('utf8')) } catch { return null } }

// satu penyedia generik; req = { prompt, image:Buffer, mime, aspect } → { buffer }
async function callCustom(name, req) {
  const c = cfg(name), ks = keys(name), m = missing(name)
  if (m.length) throw mkErr('nokey', `Penyedia ${name} belum siap: ${m.join(' & ')} belum diisi. Isi lewat .apikey atau config.js (global.imgApi.${name}).`)
  const mime = req.mime || 'image/jpeg', raw = JSON.stringify(c)
  const ctx = { prompt: req.prompt, aspect: req.aspect || '' }
  if (req.image) {
    ctx.image = req.image.toString('base64'); ctx.dataurl = `data:${mime};base64,${ctx.image}`; ctx.file = req.image
    if (raw.includes('{imageurl}')) ctx.imageurl = await upload(req.image, mime)
  }
  const errs = []; let quota = false
  for (const key of ks) {
    ctx.key = key
    const r = { headers: {}, params: {}, bodyExtra: {}, body: strip(fill(c.body || { prompt: '{prompt}', image: '{dataurl}' }, ctx)) }
    Object.assign(r.params, strip(fill(c.query || {}, ctx))); Object.assign(r.headers, strip(fill(c.headers || {}, ctx)))
    placeKey(c, key, r)
    const method = String(c.method || 'POST').toUpperCase(), send = c.send || (method === 'GET' ? 'query' : 'json')
    let res
    try { res = await http(c, method, fill(c.url, ctx), r, send, key) } catch (e) { errs.push(`${name}: ${e.message}`); continue }
    if (res.status === 401 || res.status === 403 || res.status === 429) { errs.push(`${name}: HTTP ${res.status}`); if (res.status === 429) quota = true; continue }
    if (res.status >= 400) { const j = parseJson(res.data); throw mkErr('fail', `${name} menolak permintaan (HTTP ${res.status}): ${String((j && get(j, c.error)) || (j && (j.message || j.error)) || res.data.toString('utf8')).slice(0, 160)}`) }
    const direct = await toImage(res.data, res.ctype); if (direct) return { buffer: direct }
    const j = parseJson(res.data); if (!j) throw mkErr('fail', `${name}: respons bukan gambar maupun JSON`)
    let img = await extract(j, c.result)
    if (!img && c.poll) img = await poll(c, name, j, ctx, key)
    if (img) return { buffer: img }
    throw mkErr('noimage', `${name}: respons tidak memuat gambar${c.result ? '' : ' (isi "result" di global.imgApi.' + name + ')'}. ${String((c.error && get(j, c.error)) || j.message || j.error || '').slice(0, 160)}`)
  }
  throw mkErr(quota ? 'quota' : 'auth', quota ? `Jatah ${name} sedang habis. Coba lagi nanti atau tambah key lewat .apikey add ${name} <key>.` : `API key ${name} ditolak. Periksa key-nya (.apikey set ${name} <key>).`, errs)
}

async function poll(c, name, first, ctx, key) {
  const p = c.poll, id = get(first, p.id); if (!id) return null
  const t0 = Date.now(), pc = { ...ctx, id }, ok = arr2(p.done).map(String), bad = arr2(p.fail).map(String)
  while (Date.now() - t0 < (p.max || 150000)) {
    await sleep(p.every || 4000)
    const r = { headers: {}, params: {}, bodyExtra: {}, body: strip(fill(p.body || {}, pc)) }; placeKey(c, key, r)
    const method = String(p.method || 'GET').toUpperCase()
    const res = await http(c, method, fill(p.url, pc), r, p.send || (method === 'GET' ? 'query' : 'json'), key)
    const direct = await toImage(res.data, res.ctype); if (direct) return direct
    const j = parseJson(res.data); if (!j) continue
    const st = String(get(j, p.status))
    if (bad.includes(st)) throw mkErr('fail', `${name}: pembuatan gambar gagal (status ${st})`)
    if (!ok.length || ok.includes(st)) { const img = await extract(j, p.result || c.result); if (img) return img; if (ok.length) throw mkErr('noimage', `${name}: selesai tetapi tidak ada gambar`) }
  }
  throw mkErr('fail', `${name}: waktu habis menunggu hasil`)
}

// ── urutan & pemilihan ──
function order(kind) {
  const S = require('./settingsdb'), pick = String(S.get(SETTING[kind]) || 'auto').toLowerCase(), base = ORDER[kind]
  return pick !== 'auto' && base.includes(pick) ? [pick] : base
}

// builtins: { gemini: async(req)=>({buffer}), live3d: async(req)=>({url|buffer}) }
async function dispatch(kind, req, builtins) {
  const S = require('./settingsdb'), strict = String(S.get(SETTING[kind]) || 'auto').toLowerCase() !== 'auto'
  const list = order(kind); let first = null
  for (const n of list) {
    const isCustom = known(n)
    if (isCustom && !strict && !configured(n)) continue                       // auto: lewati yang belum diisi
    if (!isCustom && !builtins[n]) continue
    try { return { provider: n, ...(isCustom ? await callCustom(n, req) : await builtins[n](req)) } }
    catch (e) { first = first || e; console.log(`[imgprov] ${n} gagal:`, e.code || '', e.message); if (strict) break }
  }
  throw first || mkErr('nokey', 'Tidak ada penyedia gambar yang siap. Isi API key lewat .apikey atau config.js.')
}

module.exports = { dispatch, order, status, keys, cfg, missing, configured, setKey, delKey, setUrl, mask, known, callCustom, CUSTOM }
