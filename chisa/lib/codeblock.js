/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// 𓂀 CHISA — Blok kode & tabel NATIVE WhatsApp (rich response), BUKAN kartu HTML.
// Tampil sebagai kotak "Javascript kode  <>  Lihat kode"; jika diketuk, kode terbuka di layar penuh
// dengan pewarnaan sintaks (kata kunci biru, method oranye, string hijau, angka merah, komentar abu-abu).
//
//   const CB = require('./codeblock')
//   await CB.sendCode(sock, m, { intro: 'Ini kodenya sayang~', code, lang: 'javascript' })
//   await CB.sendTable(sock, m, { intro, title, rows: [['Nama','Umur'], ['Ani','20']] })
//   await CB.sendRich(sock, m, [{ text: '...' }, { code, lang }, { table: { rows } }])   // gabungan beberapa bagian
//
// Bila WhatsApp/versi menolak format ini, otomatis jatuh ke teks biasa dengan ``` (tidak pernah diam).
'use strict'

const DEFAULT_BOT_JID = '867051314767696@bot'
const KAPABILITAS = [34, 58, 29, 1, 67, 60, 55, 8]
const MAX_CODE = 30000          // batas aman karakter kode dalam satu blok

// AIRichResponseSubMessageType
const SUB = { TEXT: 2, TABLE: 4, CODE: 5 }
// AIRichResponseCodeHighlightType
const HL = { DEFAULT: 0, KEYWORD: 1, METHOD: 2, STRING: 3, NUMBER: 4, COMMENT: 5 }

// ───────────────────────── bahasa ─────────────────────────
const LANG_NAMES = {
  javascript: 'javascript', js: 'javascript', mjs: 'javascript', cjs: 'javascript', node: 'javascript', jsx: 'javascript',
  typescript: 'typescript', ts: 'typescript', tsx: 'typescript',
  json: 'json', jsonc: 'json',
  python: 'python', py: 'python',
  bash: 'bash', sh: 'bash', shell: 'bash', zsh: 'bash', termux: 'bash',
  html: 'html', xml: 'html', svg: 'html', css: 'css', scss: 'css',
  java: 'java', kotlin: 'kotlin', kt: 'kotlin', c: 'c', cpp: 'cpp', 'c++': 'cpp', cs: 'csharp', csharp: 'csharp',
  go: 'go', golang: 'go', rust: 'rust', rs: 'rust', php: 'php', ruby: 'ruby', rb: 'ruby', swift: 'swift',
  sql: 'sql', yaml: 'yaml', yml: 'yaml', md: 'markdown', markdown: 'markdown', lua: 'lua', dart: 'dart',
  txt: 'text', text: 'text', plain: 'text', log: 'text', ini: 'text', env: 'text',
}
const LANG_TITLE = { javascript: 'Javascript', typescript: 'Typescript', json: 'JSON', python: 'Python', bash: 'Bash', html: 'HTML', css: 'CSS', java: 'Java', kotlin: 'Kotlin', c: 'C', cpp: 'C++', csharp: 'C#', go: 'Go', rust: 'Rust', php: 'PHP', ruby: 'Ruby', swift: 'Swift', sql: 'SQL', yaml: 'YAML', markdown: 'Markdown', lua: 'Lua', dart: 'Dart', text: 'Teks' }
const normLang = (l) => LANG_NAMES[String(l || '').toLowerCase().trim()] || null
const isLang = (l) => !!normLang(l)
const langTitle = (l) => LANG_TITLE[normLang(l) || 'text'] || 'Teks'
const EXT_LANG = (name) => normLang(String(name || '').split('.').pop())

// Tebak bahasa dari isi kode
function detectLang(code) {
  const c = String(code || '')
  const t = c.trim()
  if (/^[{[]/.test(t)) { try { JSON.parse(t); return 'json' } catch {} }
  if (/^#!.*\b(ba|z)?sh\b/m.test(c) || /^\s*(sudo |apt |pkg |npm |pnpm |yarn |git |cd |ls |mkdir |curl |wget |chmod |echo )/m.test(c)) return 'bash'
  if (/^\s*<(!doctype|html|head|body|div|span|script|style|svg)\b/i.test(c)) return 'html'
  if (/^\s*(def |class \w+(\(.*\))?:|from \w[\w.]* import |import \w+$|print\()/m.test(c) && !/[;{}]\s*$/m.test(c)) return 'python'
  if (/^\s*(SELECT|INSERT INTO|UPDATE|DELETE FROM|CREATE TABLE|ALTER TABLE)\b/im.test(c)) return 'sql'
  if (/\b(const|let|var|function|async|await|require\(|module\.exports|=>|console\.log|import .* from)\b/.test(c)) return 'javascript'
  if (/^\s*(package main|func |fn |use std|#include|public static void|using System)/m.test(c)) return /package main|func /.test(c) ? 'go' : /fn |use std/.test(c) ? 'rust' : /#include/.test(c) ? 'cpp' : /using System/.test(c) ? 'csharp' : 'java'
  return 'text'
}

// Buang pagar ```bahasa ... ``` bila ada. Hasil: { lang, code }
function unfence(raw) {
  let s = String(raw ?? '').replace(/\r\n/g, '\n')
  const m = s.match(/^\s*```([\w+#.-]*)[ \t]*\n?([\s\S]*?)\n?```\s*$/)
  if (m) return { lang: normLang(m[1]) || null, code: m[2] }
  const m2 = s.match(/```([\w+#.-]*)[ \t]*\n([\s\S]*?)(?:\n```|$)/)
  if (m2) return { lang: normLang(m2[1]) || null, code: m2[2] }
  return { lang: null, code: s }
}

// ───────────────────────── pewarna sintaks ─────────────────────────
const KW = {
  js: 'const let var function async await return if else for while do switch case break continue try catch finally throw new class extends import export from default typeof instanceof in of delete void yield static get set this null undefined true false super with debugger enum interface type implements public private protected readonly as',
  py: 'def class return if elif else for while break continue try except finally raise import from as with lambda pass yield global nonlocal assert del in is not and or None True False async await self print',
  bash: 'if then else elif fi for while do done case esac function in return export local echo cd ls sudo apt pkg npm git node python curl wget mkdir rm cp mv cat grep chmod exit source',
  c: 'if else for while do switch case break continue return struct enum union typedef static const void int long short char float double unsigned signed sizeof class public private protected new delete this null nullptr true false namespace using template typename virtual override final abstract interface extends implements import package try catch finally throw throws fun val var when object fn let mut match impl trait use pub mod crate func go defer chan select range string bool byte',
  sql: 'select from where insert into values update set delete create table alter drop add column primary key foreign references join inner left right outer on group by order having limit offset as and or not null is in like between distinct union all index unique default count sum avg min max',
  ruby: 'def end class module if elsif else unless while until for in do begin rescue ensure return yield require include extend self nil true false and or not then case when puts',
  php: 'function class public private protected static return if else elseif foreach for while echo require include namespace use new try catch throw null true false array isset empty',
  yaml: 'true false null yes no on off',
  lua: 'function end if then else elseif for while do repeat until return local nil true false and or not in break',
}
const kwRe = (list) => `\\b(?:${list.trim().split(/\s+/).join('|')})\\b`
const RULES = {
  js: { cmt: String.raw`\/\/[^\n]*|\/\*[\s\S]*?\*\/`, str: String.raw`"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|` + '`(?:\\\\[\\s\\S]|[^`\\\\])*`', kw: kwRe(KW.js) },
  json: { cmt: String.raw`\/\/[^\n]*|\/\*[\s\S]*?\*\/`, str: String.raw`"(?:\\.|[^"\\\n])*"`, kw: kwRe('true false null'), noMethod: true },
  py: { cmt: String.raw`#[^\n]*`, str: String.raw`"""[\s\S]*?"""|'''[\s\S]*?'''|[rbfRBF]{0,2}"(?:\\.|[^"\\\n])*"|[rbfRBF]{0,2}'(?:\\.|[^'\\\n])*'`, kw: kwRe(KW.py) },
  bash: { cmt: String.raw`#[^\n]*`, str: String.raw`"(?:\\.|[^"\\])*"|'[^']*'`, kw: kwRe(KW.bash), noMethod: true },
  c: { cmt: String.raw`\/\/[^\n]*|\/\*[\s\S]*?\*\/`, str: String.raw`"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'`, kw: kwRe(KW.c) },
  sql: { cmt: String.raw`--[^\n]*|\/\*[\s\S]*?\*\/`, str: String.raw`'(?:''|[^'])*'|"(?:\\.|[^"\\\n])*"`, kw: kwRe(KW.sql), ci: true },
  ruby: { cmt: String.raw`#[^\n]*`, str: String.raw`"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'`, kw: kwRe(KW.ruby) },
  php: { cmt: String.raw`\/\/[^\n]*|#[^\n]*|\/\*[\s\S]*?\*\/`, str: String.raw`"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'`, kw: kwRe(KW.php) },
  yaml: { cmt: String.raw`#[^\n]*`, str: String.raw`"(?:\\.|[^"\\\n])*"|'[^'\n]*'`, kw: kwRe(KW.yaml), noMethod: true },
  lua: { cmt: String.raw`--\[\[[\s\S]*?\]\]|--[^\n]*`, str: String.raw`"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'`, kw: kwRe(KW.lua) },
  html: { cmt: String.raw`<!--[\s\S]*?-->`, str: String.raw`"[^"\n]*"|'[^'\n]*'`, kw: String.raw`<\/?[A-Za-z][\w:-]*|\/?>`, noMethod: true },
  css: { cmt: String.raw`\/\*[\s\S]*?\*\/`, str: String.raw`"[^"\n]*"|'[^'\n]*'`, kw: String.raw`@[\w-]+|[.#][A-Za-z_-][\w-]*(?=[^{}]*\{)`, noMethod: true },
}
const RULE_OF = { javascript: 'js', typescript: 'js', json: 'json', python: 'py', bash: 'bash', html: 'html', css: 'css', java: 'c', kotlin: 'c', c: 'c', cpp: 'c', csharp: 'c', go: 'c', rust: 'c', swift: 'c', dart: 'c', sql: 'sql', ruby: 'ruby', php: 'php', yaml: 'yaml', lua: 'lua' }
const NUM = String.raw`\b0x[0-9a-fA-F]+\b|\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?n?\b`
const _cache = {}
function ruleFor(lang) {
  const key = RULE_OF[normLang(lang)]
  if (!key) return null
  if (!_cache[key]) {
    const r = RULES[key]
    const parts = [`(${r.cmt})`, `(${r.str})`, `(${r.kw})`, `(${NUM})`]
    if (!r.noMethod) parts.push(String.raw`([A-Za-z_$][\w$]*)(?=\s*\()`)
    _cache[key] = new RegExp(parts.join('|'), r.ci ? 'gi' : 'g')
  }
  return _cache[key]
}

// → [{ highlightType, codeContent }] (token bersebelahan yang sama digabung)
function highlight(code, lang) {
  const text = String(code ?? '')
  const rx = ruleFor(lang)
  if (!rx) return [{ highlightType: HL.DEFAULT, codeContent: text }]
  const out = []
  const push = (t, c) => { if (!c) return; const last = out[out.length - 1]; if (last && last.highlightType === t) last.codeContent += c; else out.push({ highlightType: t, codeContent: c }) }
  const ORDER = [HL.COMMENT, HL.STRING, HL.KEYWORD, HL.NUMBER, HL.METHOD]
  rx.lastIndex = 0
  let pos = 0, mt
  while ((mt = rx.exec(text))) {
    if (mt[0] === '') { rx.lastIndex++; continue }
    if (mt.index > pos) push(HL.DEFAULT, text.slice(pos, mt.index))
    let type = HL.DEFAULT
    for (let i = 0; i < ORDER.length; i++) if (mt[i + 1] !== undefined) { type = ORDER[i]; break }
    push(type, mt[0]); pos = mt.index + mt[0].length
  }
  if (pos < text.length) push(HL.DEFAULT, text.slice(pos))
  return out
}

// ───────────────────────── pembangun pesan ─────────────────────────
function buildSub(part) {
  if (part.code !== undefined) {
    let code = String(part.code)
    if (code.length > MAX_CODE) code = code.slice(0, MAX_CODE) + '\n… (dipotong, terlalu panjang)'
    const lang = normLang(part.lang) || detectLang(code)
    return { messageType: SUB.CODE, codeMetadata: { codeLanguage: lang, codeBlocks: highlight(code, lang) } }
  }
  if (part.table) {
    const rows = (part.table.rows || []).map((r, i) => ({ items: r.map(x => String(x ?? '')), isHeading: i === 0 && part.table.header !== false }))
    return { messageType: SUB.TABLE, tableMetadata: { title: part.table.title || '', rows } }
  }
  return { messageType: SUB.TEXT, messageText: String(part.text ?? '') }
}

function buildPayload(parts, opts = {}) {
  const q = require('./dquote').quoteOf(opts.quoted)
  const qCtx = q && q.message ? { stanzaId: q.key.id, participant: q.key.participant || q.sender, remoteJid: q.chat, quotedMessage: q.message } : {}
  return {
    messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2, botMetadata: { capabilityMetadata: { capabilities: KAPABILITAS } } },
    botForwardedMessage: {
      message: {
        richResponseMessage: {
          messageType: 1,
          submessages: parts.map(buildSub),
          contextInfo: { forwardingScore: 1, isForwarded: true, forwardedAiBotMessageInfo: { botJid: DEFAULT_BOT_JID }, forwardOrigin: 4, ...qCtx },
        },
      },
    },
  }
}

// teks cadangan bila rich response gagal
function fallbackText(parts) {
  return parts.map(p => {
    if (p.code !== undefined) return '```' + (normLang(p.lang) || '') + '\n' + String(p.code).slice(0, 3500) + '\n```'
    if (p.table) return (p.table.title ? `*${p.table.title}*\n` : '') + (p.table.rows || []).map(r => r.join(' │ ')).join('\n')
    return String(p.text ?? '')
  }).filter(Boolean).join('\n\n')
}

async function sendRich(sock, m, parts, opts = {}) {
  parts = (Array.isArray(parts) ? parts : [parts]).filter(Boolean)
  try {
    if (typeof sock.relayMessage !== 'function') throw new Error('relayMessage tidak tersedia')
    await sock.relayMessage(m.chat, buildPayload(parts, { quoted: opts.quote === false ? null : m }), {})
    if (opts.react) { try { await sock.sendMessage(m.chat, { react: { text: opts.react, key: m.key } }) } catch {} }
    return true
  } catch (err) {
    console.error('[CODEBLOCK] gagal kirim rich response:', err && err.message)
    try { await sock.sendMessage(m.chat, { text: fallbackText(parts) }, { quoted: m }) } catch {}
    return false
  }
}

const sendCode = (sock, m, { intro, code, lang, outro, react } = {}) =>
  sendRich(sock, m, [intro ? { text: intro } : null, { code, lang }, outro ? { text: outro } : null], { react })
const sendTable = (sock, m, { intro, title, rows, outro, react } = {}) =>
  sendRich(sock, m, [intro ? { text: intro } : null, { table: { title, rows } }, outro ? { text: outro } : null], { react })

// Ambil argumen MENTAH dari pesan (spasi/indentasi/baris baru dipertahankan). ctx.args sudah memadatkan spasi,
// jadi tidak cocok untuk kode. Hasil: teks setelah kata perintah.
function rawArgs(ctx) {
  let s = String((ctx && (ctx.body || ctx.budy)) || '').replace(/\r\n/g, '\n').replace(/^\s+/, '')
  const pf = ctx && ctx.prefix
  if (pf && s.startsWith(pf)) s = s.slice(pf.length)
  s = s.replace(/^\S+/, '')
  if (!String((ctx && (ctx.body || ctx.budy)) || '').trim()) return String((ctx && ctx.text) || '')
  return s.replace(/^[ \t]*\n?/, '').replace(/\s+$/, '')
}
// "js  kode..." → { lang:'javascript', code:'kode...' }; tanpa nama bahasa → lang null
function splitLang(raw) {
  const m = String(raw || '').match(/^(\S+)(?:[ \t]*\n|[ \t]+)([\s\S]*)$/)
  if (m && isLang(m[1]) && m[2].trim()) return { lang: normLang(m[1]), code: m[2] }
  return { lang: null, code: String(raw || '') }
}

// Pecah jawaban AI bermarkdown (teks + ```bahasa ... ```) jadi bagian-bagian rich response.
// Tidak ada pagar kode → [] (pemanggil cukup membalas teks biasa).
function splitAnswer(raw) {
  const src = String(raw ?? '').replace(/\r\n/g, '\n'), segs = []
  if (!/```/.test(src)) return segs
  let pos = 0
  for (const mt of src.matchAll(/```([\w+#.-]*)[ \t]*\n([\s\S]*?)(?:```|$)/g)) {
    const before = src.slice(pos, mt.index).trim()
    if (before) segs.push({ text: before })
    const code = mt[2].replace(/\n+$/, '')
    if (code.trim()) segs.push({ code, lang: normLang(mt[1]) || detectLang(code) })
    pos = mt.index + mt[0].length
  }
  const tail = src.slice(pos).trim()
  if (tail) segs.push({ text: tail })
  return segs
}

// Kirim jawaban AI: bila berisi kode → blok native "Lihat kode"; return true (sudah terkirim, native ATAU teks cadangan).
// Return false bila tidak ada kode / dimatikan (global.codeNative = false) → pemanggil membalas seperti biasa.
async function sendAnswer(sock, m, raw, opts = {}) {
  if (global.codeNative === false) return false
  const segs = splitAnswer(raw)
  if (!segs.some(x => x.code !== undefined) || segs.length > 40) return false
  await sendRich(sock, m, segs, opts)
  return true
}

module.exports = { rawArgs, splitLang, HL, SUB, normLang, isLang, langTitle, detectLang, unfence, highlight, buildPayload, buildSub, fallbackText, sendRich, splitAnswer, sendAnswer, sendCode, sendTable, EXT_LANG, MAX_CODE }
