/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Pemeriksa & perapi kode — TIDAK PERNAH menjalankan kode, hanya mengompilasi/mengurai.
//   .cekjs <kode>            periksa sintaks JavaScript (tunjukkan baris & kolom error)
//   .cekjson <json>          periksa JSON (tunjukkan posisi error)
//   .jsonrapi [2|4|tab] <json>   rapikan JSON       .jsonmini <json>   padatkan JSON
//   .urutkunci <json>        urutkan semua kunci objek A→Z
const vm = require('vm')
const CB = require('../codeblock'), { B } = require('../style')

const getSrc = (ctx) => {
  const { m } = ctx
  let raw = CB.rawArgs(ctx)
  const q = (m.quoted && (m.quoted.text || m.quoted.caption || m.quoted.conversation)) || ''
  return { raw, q }
}
const strip = (s) => (/```/.test(s) ? CB.unfence(s).code : s).replace(/\r\n/g, '\n')

// Periksa sintaks JS tanpa menjalankan. Coba sebagai skrip biasa, lalu sebagai isi fungsi async (top-level await),
// lalu dengan sintaks ESM (import/export) dinetralkan.
function checkJs(code) {
  const tryCompile = (src, offset) => {
    try { new vm.Script(src, { filename: 'kode.js' }); return null } catch (e) {
      const st = String(e.stack || '')
      const ln = st.match(/^kode\.js:(\d+)/m)
      const lines = st.split('\n')
      const i = lines.findIndex(l => /^kode\.js:\d+/.test(l))
      const caret = i >= 0 ? lines[i + 2] || '' : ''
      const col = caret.indexOf('^')
      return { msg: String(e.message), line: ln ? Math.max(1, Number(ln[1]) - offset) : null, col: col >= 0 ? col + 1 : null }
    }
  }
  let e1 = tryCompile(code, 0); if (!e1) return { ok: true, mode: 'skrip biasa' }
  const esm = code.replace(/^(\s*)export\s+default\s+/gm, '$1').replace(/^(\s*)export\s+(?=(async\s+)?(function|class|const|let|var)\b)/gm, '$1')
    .replace(/^\s*import\s[^\n;]*?from\s*['"][^'"]+['"];?[ \t]*$/gm, (s) => ' '.repeat(s.length)).replace(/^\s*import\s*['"][^'"]+['"];?[ \t]*$/gm, (s) => ' '.repeat(s.length))
  const wrapped = '(async () => {' + esm + '\n})'
  const e2 = tryCompile(wrapped, 0)
  if (!e2) return { ok: true, mode: esm !== code ? 'modul ESM (import/export)' : 'async / top-level await' }
  // laporkan error paling informatif: dari kode asli, kecuali itu error khas ESM/await
  if (/import statement|Unexpected token 'export'|await is only valid|Cannot use import/.test(e1.msg)) e1 = e2
  return { ok: false, ...e1 }
}

function frame(code, line, col) {
  const L = code.split('\n'), a = Math.max(1, line - 2), b = Math.min(L.length, line + 2), w = String(b).length
  const out = []
  for (let i = a; i <= b; i++) {
    out.push(`${String(i).padStart(w)} │ ${L[i - 1]}`)
    if (i === line && col) out.push(`${' '.repeat(w)} │ ${' '.repeat(Math.max(0, col - 1))}^`)
  }
  return out.join('\n')
}

// Penelusur JSON kecil: mencari posisi galat pertama bila pesan bawaan Node tidak menyebut posisi (Node 22+).
function locateJson(src) {
  let i = 0; const n = src.length
  const bad = (msg) => { const e = new Error(msg); e.pos = i; throw e }
  const ws = () => { while (i < n && /\s/.test(src[i])) i++ }
  const str = () => { i++; while (i < n && src[i] !== '"') { if (src[i] === '\\') i++; else if (src[i] === '\n') bad('String tidak ditutup'); i++ } if (i >= n) bad('String tidak ditutup'); i++ }
  const val = () => {
    ws(); const c = src[i]
    if (c === '{') { i++; ws(); if (src[i] === '}') { i++; return } for (;;) { ws(); if (src[i] !== '"') bad('Diharapkan nama properti berkutip ganda'); str(); ws(); if (src[i] !== ':') bad("Diharapkan ':'"); i++; val(); ws(); if (src[i] === ',') { i++; continue } if (src[i] === '}') { i++; return } bad("Diharapkan ',' atau '}'") } }
    if (c === '[') { i++; ws(); if (src[i] === ']') { i++; return } for (;;) { val(); ws(); if (src[i] === ',') { i++; continue } if (src[i] === ']') { i++; return } bad("Diharapkan ',' atau ']'") } }
    if (c === '"') return str()
    const m = src.slice(i).match(/^(-?\d+(\.\d+)?([eE][+-]?\d+)?|true|false|null)/)
    if (m) { i += m[0].length; return }
    bad(i >= n ? 'JSON berakhir terlalu cepat' : `Karakter tak terduga '${c}'`)
  }
  try { val(); ws(); if (i < n) bad(`Karakter berlebih '${src[i]}'`) } catch (e) { if (e.pos !== undefined) return { pos: e.pos, msg: e.message }; throw e }
  return null
}
function jsonErr(src, e) {
  let msg = String(e.message), pos = null
  const mp = msg.match(/position (\d+)/), ml = msg.match(/line (\d+) column (\d+)/)
  if (ml) return { msg, line: Number(ml[1]), col: Number(ml[2]) }
  if (mp) pos = Number(mp[1])
  else if (src.length <= 200000) { const f = locateJson(src); if (f) { pos = f.pos; msg = `${f.msg} (${msg.replace(/, ".*$/, '')})` } }
  if (pos == null) return { msg, line: null, col: null }
  const before = src.slice(0, pos).split('\n')
  return { msg, line: before.length, col: before[before.length - 1].length + 1 }
}
const sortKeys = (v) => Array.isArray(v) ? v.map(sortKeys) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort((a, b) => a.localeCompare(b)).map(k => [k, sortKeys(v[k])])) : v

module.exports = {
  name: 'kodecek', alias: ['cekjs', 'cekjson', 'jsonrapi', 'jsonmini', 'urutkunci'], category: 'tools', noLimit: true,
  cmds: ['cekjs', 'cekjson', 'jsonrapi', 'jsonmini', 'urutkunci'],
  desc: 'Periksa sintaks JS/JSON (tanpa menjalankan), rapikan, padatkan, dan urutkan kunci JSON',
  run: async (ctx) => {
    const { sock, m, command, prefix, reply } = ctx
    const P = prefix || '.'
    const { raw, q } = getSrc(ctx)
    let src = strip(raw)
    let indent = 2
    if (/^(jsonrapi)$/.test(command)) {
      const mm = src.match(/^\s*(2|4|8|tab)\b[ \t]*\n?/i)
      if (mm) { indent = mm[1].toLowerCase() === 'tab' ? '\t' : Number(mm[1]); src = src.slice(mm[0].length) }
    }
    if (!src.trim() && q) src = strip(q)
    if (!src.trim()) {
      const ex = { cekjs: `${P}snip cekjs\nconst a = (1 + \nconsole.log(a)`, cekjson: `${P}snip cekjson {"a":1,"b":[1,2,}`, jsonrapi: `${P}snip rapi 4 {"a":1,"b":[1,2]}`, jsonmini: `${P}snip mini {"a": 1,\n "b": [1, 2]}`, urutkunci: `${P}snip urut {"z":1,"a":{"y":2,"b":3}}` }
      return reply(`${B(command.toUpperCase())}\n${ex[command] || ex.cekjs}\n_Atau reply pesan berisi kode/JSON. Kode tidak pernah dijalankan._`)
    }
    src = src.replace(/^\n+|\s+$/g, '')

    if (command === 'cekjs') {
      const r = checkJs(src)
      if (r.ok) return reply(`✅ ${B('SINTAKS JS VALID')}\nTerbaca sebagai: ${r.mode}\n${src.split('\n').length} baris. _Hanya sintaks yang diperiksa; kode tidak dijalankan._`)
      const intro = `❌ *Sintaks error*${r.line ? ` — baris ${r.line}${r.col ? `, kolom ${r.col}` : ''}` : ''}\n${r.msg}`
      return r.line ? CB.sendRich(sock, m, [{ text: intro }, { code: frame(src, r.line, r.col), lang: 'text' }], { react: '❌' }) : reply(intro)
    }

    let obj
    try { obj = JSON.parse(src) } catch (e) {
      const r = jsonErr(src, e)
      const intro = `❌ *JSON tidak valid*${r.line ? ` — baris ${r.line}, kolom ${r.col}` : ''}\n${r.msg}`
      return r.line ? CB.sendRich(sock, m, [{ text: intro }, { code: frame(src, r.line, r.col), lang: 'text' }], { react: '❌' }) : reply(intro)
    }
    if (command === 'cekjson') {
      const t = Array.isArray(obj) ? `array (${obj.length} item)` : obj && typeof obj === 'object' ? `objek (${Object.keys(obj).length} kunci)` : typeof obj
      return reply(`✅ ${B('JSON VALID')}\nTipe akar: ${t}\nUkuran: ${Buffer.byteLength(src)} byte`)
    }
    if (command === 'jsonmini') {
      const out = JSON.stringify(obj)
      return CB.sendCode(sock, m, { intro: `🗜️ *JSON dipadatkan* — ${Buffer.byteLength(src)} → ${Buffer.byteLength(out)} byte`, code: out, lang: 'json', react: '🗜️' })
    }
    if (command === 'urutkunci') {
      return CB.sendCode(sock, m, { intro: '🔤 *Kunci JSON diurutkan A→Z*', code: JSON.stringify(sortKeys(obj), null, 2), lang: 'json', react: '🔤' })
    }
    return CB.sendCode(sock, m, { intro: '✨ *JSON dirapikan*', code: JSON.stringify(obj, null, indent), lang: 'json', react: '✨' })
  },
}
