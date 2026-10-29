// Kompatibilitas Android (nodejs-mobile): Node-nya dibangun tanpa ICU penuh, jadi regex \p{...} (properti Unicode) ditolak.
// Modul ini menulis ulang \p{...} menjadi rentang karakter biasa saat berkas dimuat. Hanya aktif kalau \p{...} memang tidak didukung.
const Module = require('module')

const EP = '\\u00A9\\u00AE\\u203C\\u2049\\u2122\\u2139\\u2194-\\u21AA\\u231A-\\u23FF\\u24C2\\u25AA-\\u25FE\\u2600-\\u27BF\\u2934\\u2935\\u2B05-\\u2B55\\u3030\\u303D\\u3297\\u3299\\u{1F000}-\\u{1FAFF}'
const L = 'A-Za-z\\u00AA\\u00B5\\u00BA\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02C1\\u0370-\\u03FF\\u0400-\\u052F\\u0531-\\u0587\\u05D0-\\u05EA\\u0620-\\u064A\\u0671-\\u06D3\\u0904-\\u0939\\u0E01-\\u0E30\\u1E00-\\u1FFF\\u3040-\\u30FF\\u3400-\\u4DBF\\u4E00-\\u9FFF\\uAC00-\\uD7AF\\uFF21-\\uFF3A\\uFF41-\\uFF5A'
const MAP = {
  L, Letter: L, Alphabetic: L, Alpha: L,
  Lu: 'A-Z\\u00C0-\\u00D6\\u00D8-\\u00DE\\u0391-\\u03A9\\u0410-\\u042F', Uppercase: 'A-Z\\u00C0-\\u00D6\\u00D8-\\u00DE\\u0391-\\u03A9\\u0410-\\u042F',
  Ll: 'a-z\\u00DF-\\u00F6\\u00F8-\\u00FF\\u03B1-\\u03C9\\u0430-\\u044F', Lowercase: 'a-z\\u00DF-\\u00F6\\u00F8-\\u00FF\\u03B1-\\u03C9\\u0430-\\u044F',
  N: '0-9\\u00B2\\u00B3\\u00B9\\u00BC-\\u00BE\\u0660-\\u0669\\u06F0-\\u06F9\\u0966-\\u096F\\uFF10-\\uFF19',
  Nd: '0-9\\u0660-\\u0669\\u06F0-\\u06F9\\u0966-\\u096F\\uFF10-\\uFF19',
  M: '\\u0300-\\u036F\\u0483-\\u0489\\u0591-\\u05BD\\u064B-\\u065F\\u0900-\\u0903\\u093A-\\u094F\\u1AB0-\\u1AFF\\u1DC0-\\u1DFF\\u20D0-\\u20FF\\uFE00-\\uFE0F\\uFE20-\\uFE2F',
  P: '!-#%-*,-\\/:;?@\\[-\\]_{}\\u00A1\\u00A7\\u00AB\\u00B6\\u00B7\\u00BB\\u00BF\\u2010-\\u2027\\u2030-\\u205E\\u3001-\\u3003',
  S: '$+<->^`|~\\u00A2-\\u00A6\\u00A8\\u00A9\\u00AC\\u00AE-\\u00B1\\u00B4\\u00D7\\u00F7\\u20A0-\\u20BF\\u2100-\\u214F\\u2190-\\u23FF\\u2500-\\u27BF\\u{1F000}-\\u{1FAFF}',
  Z: ' \\u00A0\\u1680\\u2000-\\u200A\\u2028\\u2029\\u202F\\u205F\\u3000', Zs: ' \\u00A0\\u1680\\u2000-\\u200A\\u202F\\u205F\\u3000',
  Extended_Pictographic: EP, ExtPict: EP,
  Emoji: EP + '\\u{1F1E6}-\\u{1F1FF}', Emoji_Presentation: '\\u231A\\u231B\\u23E9-\\u23EC\\u23F0\\u23F3\\u25FD\\u25FE\\u2614\\u2615\\u2648-\\u2653\\u267F\\u2693\\u26A1\\u26AA\\u26AB\\u26BD\\u26BE\\u26C4\\u26C5\\u26CE\\u26D4\\u26EA\\u26F2\\u26F3\\u26F5\\u26FA\\u26FD\\u2705\\u270A\\u270B\\u2728\\u274C\\u274E\\u2753-\\u2755\\u2757\\u2795-\\u2797\\u27B0\\u27BF\\u2B1B\\u2B1C\\u2B50\\u2B55\\u{1F000}-\\u{1FAFF}',
  Emoji_Modifier_Base: '\\u261D\\u26F9\\u270A-\\u270D\\u{1F385}\\u{1F3C2}-\\u{1F3CC}\\u{1F442}-\\u{1F4AA}\\u{1F574}-\\u{1F596}\\u{1F645}-\\u{1F64F}\\u{1F6A3}\\u{1F6B4}-\\u{1F6C0}\\u{1F90C}-\\u{1F9DD}',
  Emoji_Modifier: '\\u{1F3FB}-\\u{1F3FF}', Emoji_Component: '#*0-9\\u200D\\u20E3\\uFE0F\\u{1F1E6}-\\u{1F1FF}\\u{1F3FB}-\\u{1F3FF}',
  Regional_Indicator: '\\u{1F1E6}-\\u{1F1FF}'
}

function supported() {
  try { new RegExp('\\p{Extended_Pictographic}\\p{L}', 'u'); return true } catch { return false }
}

/** tulis ulang \p{X} / \P{X}; di dalam [...] disisipkan rentangnya, di luar dibungkus [...] */
function transform(src) {
  if (!src.includes('\\p{') && !src.includes('\\P{')) return src
  return src.replace(/\\([pP])\{([^}]+)\}/g, (m, kind, name, off) => {
    const key = name.replace(/^(General_Category|gc|Script|sc|Script_Extensions|scx)=/, '')
    const set = MAP[key]
    if (!set) return m
    const ls = src.lastIndexOf('\n', off) + 1
    const before = src.slice(ls, off)
    let depth = 0
    for (let i = 0; i < before.length; i++) {
      const c = before[i]
      if (c === '\\') { i++; continue }
      if (c === '[') depth = 1
      else if (c === ']') depth = 0
    }
    if (depth) return kind === 'p' ? set : m // \P di dalam kelas tidak bisa dipetakan
    return kind === 'p' ? `[${set}]` : `[^${set}]`
  })
}

function install(force) {
  if (!force && supported()) return false
  const orig = Module.prototype._compile
  Module.prototype._compile = function (content, filename) {
    return orig.call(this, transform(content), filename)
  }
  return true
}

module.exports = { install, transform, supported, MAP }
