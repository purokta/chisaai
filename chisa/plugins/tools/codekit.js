/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Coding Toolkit (v4.13): chmod, httpstatus, mime, port, baseconv, hmac, jsontots, jsonget, cidr, semver,
// gitcheat, gitignore, curl2fetch, cronnext, unicode, sqlfmt. Semua berjalan lokal, tanpa API eksternal.
const crypto = require('crypto')
const { B } = require('../../lib/style')

const CMDS = ['chmod', 'httpstatus', 'mime', 'port', 'baseconv', 'hmac', 'jsontots', 'jsonget', 'cidr', 'semver', 'gitcheat', 'gitignore', 'curl2fetch', 'cronnext', 'unicode', 'sqlfmt']
const FENCE = '```'
const code = (s) => FENCE + '\n' + s + '\n' + FENCE
const src = (text, m) => String(text || (m && m.quoted && (m.quoted.text || m.quoted.caption)) || '').trim()

// ───────────── chmod ─────────────
const RWX = ['---', '--x', '-w-', '-wx', 'r--', 'r-x', 'rw-', 'rwx']
const PERM_ID = (d) => [d & 4 ? 'baca' : null, d & 2 ? 'tulis' : null, d & 1 ? 'eksekusi' : null].filter(Boolean).join(' + ') || 'tanpa akses'
function chmodNumToSym(num) {
  const s = num.length === 4 ? +num[0] : 0, d = num.slice(-3).split('').map(Number)
  let sym = d.map(x => RWX[x]).join('').split('')
  if (s & 4) sym[2] = sym[2] === 'x' ? 's' : 'S'
  if (s & 2) sym[5] = sym[5] === 'x' ? 's' : 'S'
  if (s & 1) sym[8] = sym[8] === 'x' ? 't' : 'T'
  return { sym: sym.join(''), s, d }
}
function chmodSymToNum(sym) {
  if (!/^[-rwxsStT]{9}$/.test(sym)) return null
  let s = 0; const dig = [0, 0, 0]
  for (let i = 0; i < 9; i++) {
    const c = sym[i], g = (i / 3) | 0, pos = i % 3
    const want = ['r', 'w', 'x'][pos]
    if (c === '-' || c === 'S' || c === 'T') { if (c === 'S') s |= 4; if (c === 'T') s |= 1; if (c === 'S' && g === 1) { s = s & ~4 | 2 } continue }
    if (pos === 2 && 'sSt'.includes(c)) { dig[g] += 1; if (c === 's') s |= g === 0 ? 4 : 2; if (c === 't') s |= 1; continue }
    if (c !== want) return null
    dig[g] += { r: 4, w: 2, x: 1 }[c]
  }
  return { s, d: dig }
}
function doChmod(arg) {
  const a = String(arg || '').trim().replace(/^[-dl]?(?=[-rwxsStT]{9}$)/, '')
  if (/^[0-7]{3,4}$/.test(a)) {
    const { sym, s, d } = chmodNumToSym(a)
    return [`${B('CHMOD')} ${a}`, `Simbolik : ${sym}`, `Pemilik  : ${PERM_ID(d[0])}`, `Grup     : ${PERM_ID(d[1])}`, `Lainnya  : ${PERM_ID(d[2])}`,
      s ? `Bit khusus: ${[s & 4 ? 'setuid' : '', s & 2 ? 'setgid' : '', s & 1 ? 'sticky' : ''].filter(Boolean).join(', ')}` : '', `\nContoh: chmod ${a} namafile`].filter(x => x !== '').join('\n')
  }
  if (/^[-rwxsStT]{9}$/.test(a)) {
    const r = chmodSymToNum(a); if (!r) return null
    const num = (r.s ? r.s : '') + r.d.join('')
    return [`${B('CHMOD')} ${a}`, `Angka    : ${num}`, `Pemilik  : ${PERM_ID(r.d[0])}`, `Grup     : ${PERM_ID(r.d[1])}`, `Lainnya  : ${PERM_ID(r.d[2])}`, `\nContoh: chmod ${num} namafile`].join('\n')
  }
  return null
}

// ───────────── HTTP status ─────────────
const HTTP = {
  100: ['Continue', 'Server menerima awal permintaan; klien boleh lanjut mengirim body.'], 101: ['Switching Protocols', 'Server setuju pindah protokol (mis. WebSocket).'],
  200: ['OK', 'Permintaan berhasil.'], 201: ['Created', 'Resource baru berhasil dibuat (umum untuk POST).'], 202: ['Accepted', 'Diterima, tetapi diproses nanti (asinkron).'], 204: ['No Content', 'Berhasil, tidak ada isi untuk dikembalikan.'], 206: ['Partial Content', 'Sebagian isi dikirim (range request / unduhan sebagian).'],
  301: ['Moved Permanently', 'Alamat pindah permanen; mesin pencari ikut memperbarui.'], 302: ['Found', 'Pindah sementara ke alamat lain.'], 304: ['Not Modified', 'Cache masih valid, tidak ada isi baru.'], 307: ['Temporary Redirect', 'Pindah sementara, metode HTTP dipertahankan.'], 308: ['Permanent Redirect', 'Pindah permanen, metode HTTP dipertahankan.'],
  400: ['Bad Request', 'Permintaan salah format / parameter tidak valid.'], 401: ['Unauthorized', 'Belum login / kredensial tidak ada atau salah.'], 403: ['Forbidden', 'Sudah dikenali tetapi tidak punya izin.'], 404: ['Not Found', 'Alamat atau resource tidak ditemukan.'], 405: ['Method Not Allowed', 'Metode HTTP (GET/POST/...) tidak diizinkan untuk alamat ini.'], 406: ['Not Acceptable', 'Server tidak bisa menghasilkan format yang diminta header Accept.'], 408: ['Request Timeout', 'Klien terlalu lama mengirim permintaan.'], 409: ['Conflict', 'Bentrok dengan keadaan resource (mis. data duplikat / versi lama).'], 410: ['Gone', 'Resource sudah dihapus permanen.'], 413: ['Payload Too Large', 'Isi permintaan melebihi batas ukuran server.'], 415: ['Unsupported Media Type', 'Content-Type tidak didukung.'], 418: ['I\'m a teapot', 'Lelucon RFC 1918/2324: server adalah teko, menolak menyeduh kopi.'], 422: ['Unprocessable Entity', 'Format benar tetapi isi gagal validasi.'], 429: ['Too Many Requests', 'Terkena rate limit; tunggu lalu coba lagi (lihat header Retry-After).'],
  500: ['Internal Server Error', 'Server mengalami error tak terduga.'], 501: ['Not Implemented', 'Server belum mendukung fitur / metode ini.'], 502: ['Bad Gateway', 'Gateway/proxy menerima respons tidak valid dari server hulu.'], 503: ['Service Unavailable', 'Server sedang sibuk / maintenance.'], 504: ['Gateway Timeout', 'Server hulu terlalu lama menjawab.'],
}
const HTTP_CLASS = { 1: 'Informasi', 2: 'Berhasil', 3: 'Pengalihan', 4: 'Kesalahan klien', 5: 'Kesalahan server' }
function doHttp(a) {
  a = String(a || '').trim().toLowerCase()
  if (/^\d{3}$/.test(a)) {
    const h = HTTP[+a]; if (!h) return /^[1-5]/.test(a) ? `${B('HTTP ' + a)}\nKode ini tidak ada di daftar umum, kelasnya: ${HTTP_CLASS[a[0]]}.` : null
    return `${B('HTTP ' + a)} — ${h[0]}\nKelas: ${HTTP_CLASS[a[0]]}\n${h[1]}`
  }
  if (/^[1-5]xx$/.test(a)) return `${B('HTTP ' + a)} — ${HTTP_CLASS[a[0]]}\n` + Object.keys(HTTP).filter(k => k[0] === a[0]).map(k => `${k}  ${HTTP[k][0]}`).join('\n')
  if (a) { const hit = Object.keys(HTTP).filter(k => HTTP[k][0].toLowerCase().includes(a) || HTTP[k][1].toLowerCase().includes(a)); if (hit.length) return `${B('HTTP')} cocok untuk "${a}":\n` + hit.slice(0, 12).map(k => `${k}  ${HTTP[k][0]}`).join('\n') }
  return null
}

// ───────────── MIME & port ─────────────
const MIME = { html: 'text/html', css: 'text/css', js: 'text/javascript', mjs: 'text/javascript', json: 'application/json', xml: 'application/xml', txt: 'text/plain', csv: 'text/csv', md: 'text/markdown', pdf: 'application/pdf', zip: 'application/zip', gz: 'application/gzip', tar: 'application/x-tar', '7z': 'application/x-7z-compressed', rar: 'application/vnd.rar', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml', ico: 'image/x-icon', avif: 'image/avif', mp3: 'audio/mpeg', ogg: 'audio/ogg', wav: 'audio/wav', opus: 'audio/opus', m4a: 'audio/mp4', mp4: 'video/mp4', webm: 'video/webm', mkv: 'video/x-matroska', mov: 'video/quicktime', woff: 'font/woff', woff2: 'font/woff2', ttf: 'font/ttf', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', apk: 'application/vnd.android.package-archive', wasm: 'application/wasm', yaml: 'application/yaml', yml: 'application/yaml', sh: 'application/x-sh', ts: 'video/mp2t', vcf: 'text/vcard', ics: 'text/calendar' }
const PORTS = { 20: 'FTP data', 21: 'FTP', 22: 'SSH / SFTP', 23: 'Telnet', 25: 'SMTP (kirim email)', 53: 'DNS', 67: 'DHCP server', 80: 'HTTP', 110: 'POP3', 123: 'NTP (waktu)', 143: 'IMAP', 161: 'SNMP', 389: 'LDAP', 443: 'HTTPS', 465: 'SMTPS', 587: 'SMTP submission (STARTTLS)', 636: 'LDAPS', 993: 'IMAPS', 995: 'POP3S', 1433: 'Microsoft SQL Server', 1521: 'Oracle DB', 2049: 'NFS', 2181: 'ZooKeeper', 2375: 'Docker (tanpa TLS)', 3000: 'Dev server Node / React / Grafana', 3306: 'MySQL / MariaDB', 3389: 'RDP (Remote Desktop)', 4200: 'Angular dev server', 5000: 'Flask / dev server', 5173: 'Vite dev server', 5432: 'PostgreSQL', 5672: 'RabbitMQ (AMQP)', 5900: 'VNC', 6379: 'Redis', 8000: 'Django / dev server', 8080: 'HTTP alternatif / proxy', 8443: 'HTTPS alternatif', 9000: 'PHP-FPM / SonarQube', 9090: 'Prometheus', 9200: 'Elasticsearch', 11211: 'Memcached', 25565: 'Minecraft', 27017: 'MongoDB' }
function doMime(a) {
  a = String(a || '').trim().toLowerCase().replace(/^\./, '')
  if (!a) return null
  if (a.includes('/')) { const e = Object.keys(MIME).filter(k => MIME[k] === a); return e.length ? `${B('MIME')} ${a}\nEkstensi: ${e.map(x => '.' + x).join(' ')}` : null }
  return MIME[a] ? `${B('MIME')} .${a}\n${MIME[a]}` : null
}
function doPort(a) {
  a = String(a || '').trim().toLowerCase()
  if (/^\d{1,5}$/.test(a)) { const n = +a; return n > 65535 ? null : PORTS[n] ? `${B('PORT')} ${n}\n${PORTS[n]}` : `${B('PORT')} ${n}\nTidak ada di daftar umum. ${n < 1024 ? 'Port sistem (0-1023, biasanya butuh hak admin).' : n < 49152 ? 'Port terdaftar / aplikasi (1024-49151).' : 'Port dinamis / sementara (49152-65535).'}` }
  if (a) { const h = Object.keys(PORTS).filter(k => PORTS[k].toLowerCase().includes(a)); if (h.length) return `${B('PORT')} cocok untuk "${a}":\n` + h.slice(0, 15).map(k => `${k}  ${PORTS[k]}`).join('\n') }
  return null
}

// ───────────── baseconv ─────────────
const DIG = '0123456789abcdefghijklmnopqrstuvwxyz'
function parseBase(str, base) {
  const s = str.toLowerCase().replace(/_/g, ''); if (!s) return null
  let n = 0n; const b = BigInt(base)
  for (const c of s) { const v = DIG.indexOf(c); if (v < 0 || v >= base) return null; n = n * b + BigInt(v) }
  return n
}
const toBase = (n, base) => n.toString(base)
function doBase(args) {
  let [num, from, to] = args; if (!num) return null
  let neg = false; if (num.startsWith('-')) { neg = true; num = num.slice(1) }
  const pre = { '0x': 16, '0b': 2, '0o': 8 }[num.slice(0, 2).toLowerCase()]
  if (pre && !from) { from = String(pre); num = num.slice(2) } else if (pre && +from === pre) num = num.slice(2)
  const f = from ? +from : 10
  if (!Number.isInteger(f) || f < 2 || f > 36) return null
  const n = parseBase(num, f); if (n === null) return null
  const sg = neg ? '-' : ''
  if (to) { const t = +to; if (!Number.isInteger(t) || t < 2 || t > 36) return null; return `${B('BASIS')}\n${sg}${num} (basis ${f}) = *${sg}${toBase(n, t)}* (basis ${t})` }
  return `${B('BASIS')} ${sg}${num} (basis ${f})\nBiner (2)   : ${sg}${toBase(n, 2)}\nOktal (8)   : ${sg}${toBase(n, 8)}\nDesimal (10): ${sg}${toBase(n, 10)}\nHeks (16)   : ${sg}${toBase(n, 16).toUpperCase()}\nBasis 36    : ${sg}${toBase(n, 36)}`
}

// ───────────── jsontots & jsonget ─────────────
const KEY_OK = /^[A-Za-z_$][\w$]*$/
const pascal = (s) => String(s).replace(/[^A-Za-z0-9]+(.)?/g, (_, c) => (c || '').toUpperCase()).replace(/^./, c => c.toUpperCase()).replace(/^(\d)/, '_$1') || 'Item'
function jsonToTs(value, rootName = 'Root') {
  const out = [], used = new Set()
  const uniq = (n) => { let x = n, i = 2; while (used.has(x)) x = n + i++; used.add(x); return x }
  function shape(objs, name) {
    const nm = uniq(name), keys = new Map()
    objs.forEach(o => { for (const k of Object.keys(o)) { if (!keys.has(k)) keys.set(k, []); keys.get(k).push(o[k]) } })
    const lines = []
    for (const [k, vals] of keys) {
      const opt = vals.length < objs.length, key = KEY_OK.test(k) ? k : JSON.stringify(k)
      lines.push(`  ${key}${opt ? '?' : ''}: ${typeOf(vals, pascal(k))};`)
    }
    out.push(`interface ${nm} {\n${lines.join('\n')}\n}`)
    return nm
  }
  function typeOf(vals, name) {
    const types = new Set(), objs = [], arrs = []
    for (const v of vals) {
      if (v === null) types.add('null')
      else if (Array.isArray(v)) arrs.push(...v), types.add('__arr__')
      else if (typeof v === 'object') objs.push(v)
      else types.add(typeof v)
    }
    if (objs.length) types.add(shape(objs, name))
    if (types.has('__arr__')) {
      types.delete('__arr__')
      const el = arrs.length ? typeOf(arrs, name.endsWith('s') ? name.slice(0, -1) || name : name + 'Item') : 'unknown'
      types.add(el.includes(' | ') ? `(${el})[]` : `${el}[]`)
    }
    return [...types].join(' | ') || 'unknown'
  }
  if (Array.isArray(value)) { const el = value.length ? typeOf(value, rootName + 'Item') : 'unknown'; out.push(`type ${uniq(rootName)} = ${el.includes(' | ') ? `(${el})[]` : el + '[]'};`) }
  else if (value && typeof value === 'object') shape([value], rootName)
  else out.push(`type ${rootName} = ${value === null ? 'null' : typeof value};`)
  return out.reverse().join('\n\n')
}
function jsonPath(obj, path) {
  const parts = []; path.replace(/\[(\d+)\]|\[["']([^"']+)["']\]|([^.\[\]]+)/g, (_, i, q, k) => { parts.push(i !== undefined ? +i : q !== undefined ? q : k); return '' })
  let cur = obj
  for (const p of parts) { if (cur === null || cur === undefined || typeof cur !== 'object' || !(p in Object(cur))) return { found: false }; cur = cur[p] }
  return { found: true, value: cur }
}

// ───────────── cidr ─────────────
const ipToInt = (ip) => { const p = ip.split('.'); if (p.length !== 4 || p.some(x => !/^\d{1,3}$/.test(x) || +x > 255)) return null; return (((+p[0] << 24) | (+p[1] << 16) | (+p[2] << 8) | +p[3]) >>> 0) }
const intToIp = (n) => [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.')
function doCidr(a) {
  const m = String(a || '').trim().match(/^(\d{1,3}(?:\.\d{1,3}){3})\/(\d{1,2})$/); if (!m) return null
  const ip = ipToInt(m[1]), p = +m[2]; if (ip === null || p > 32) return null
  const mask = p === 0 ? 0 : (0xFFFFFFFF << (32 - p)) >>> 0, net = (ip & mask) >>> 0, bc = (net | (~mask >>> 0)) >>> 0
  const total = 2 ** (32 - p), hosts = p >= 31 ? total : total - 2
  const first = p >= 31 ? net : net + 1, last = p >= 31 ? bc : bc - 1
  const o = ip >>> 24, priv = o === 10 || (o === 172 && ((ip >>> 16) & 255) >= 16 && ((ip >>> 16) & 255) <= 31) || (o === 192 && ((ip >>> 16) & 255) === 168)
  return [`${B('CIDR')} ${m[1]}/${p}`, `Netmask    : ${intToIp(mask)}`, `Wildcard   : ${intToIp(~mask >>> 0)}`, `Network    : ${intToIp(net)}`, `Broadcast  : ${intToIp(bc)}`, `Host pertama: ${intToIp(first)}`, `Host terakhir: ${intToIp(last)}`, `Total alamat: ${total.toLocaleString('id-ID')}`, `Host layak : ${hosts.toLocaleString('id-ID')}`, `Jenis      : ${priv ? 'privat (RFC 1918)' : o === 127 ? 'loopback' : 'publik / lainnya'}`].join('\n')
}

// ───────────── semver ─────────────
function parseVer(s) {
  const m = String(s || '').trim().replace(/^v/i, '').match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/); if (!m) return null
  return { M: +m[1], m: +m[2], p: +m[3], pre: m[4] ? m[4].split('.') : [] }
}
function cmpPre(a, b) {
  if (!a.length && !b.length) return 0; if (!a.length) return 1; if (!b.length) return -1
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] === undefined) return -1; if (b[i] === undefined) return 1
    const an = /^\d+$/.test(a[i]), bn = /^\d+$/.test(b[i])
    if (an && bn) { if (+a[i] !== +b[i]) return +a[i] < +b[i] ? -1 : 1 } else if (an) return -1; else if (bn) return 1; else if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1
  }
  return 0
}
function cmpVer(a, b) { for (const k of ['M', 'm', 'p']) if (a[k] !== b[k]) return a[k] < b[k] ? -1 : 1; return cmpPre(a.pre, b.pre) }
function satisfies(v, range) {
  const r = String(range).trim(), m = r.match(/^(\^|~|>=|<=|>|<|=)?\s*v?(\d+(?:\.\d+){0,2}(?:-[0-9A-Za-z.-]+)?)$/); if (!m) return null
  const parts = m[2].split('-')[0].split('.').map(Number); while (parts.length < 3) parts.push(0)
  const base = parseVer(parts.join('.') + (m[2].includes('-') ? '-' + m[2].split('-').slice(1).join('-') : '')), ver = parseVer(v); if (!base || !ver) return null
  const op = m[1] || '='; const given = m[2].split('-')[0].split('.').length
  const c = cmpVer(ver, base)
  if (op === '=') return given === 3 ? c === 0 : (ver.M === base.M && (given < 2 || ver.m === base.m))
  if (op === '>') return c > 0; if (op === '>=') return c >= 0; if (op === '<') return c < 0; if (op === '<=') return c <= 0
  if (c < 0) return false
  if (op === '~') return ver.M === base.M && ver.m === base.m
  // ^ : kunci digit non-nol pertama
  if (base.M > 0) return ver.M === base.M
  if (base.m > 0) return ver.M === 0 && ver.m === base.m
  return ver.M === 0 && ver.m === 0 && ver.p === base.p
}
const fmtVer = (v) => `${v.M}.${v.m}.${v.p}${v.pre.length ? '-' + v.pre.join('.') : ''}`
function doSemver(args, prefix) {
  const help = `${B('SEMVER')}\n${prefix}semver bandingkan 1.2.3 1.10.0\n${prefix}semver naik 1.2.3 minor   (major | minor | patch)\n${prefix}semver cek ^1.2.0 1.5.3   (rentang: ^ ~ >= > <= < =)`
  const sub = (args[0] || '').toLowerCase()
  if (['bandingkan', 'banding', 'cmp'].includes(sub)) {
    const a = parseVer(args[1]), b = parseVer(args[2]); if (!a || !b) return help
    const c = cmpVer(a, b); return `${B('SEMVER')}\n${fmtVer(a)} ${c < 0 ? '<' : c > 0 ? '>' : '='} ${fmtVer(b)}\n${c === 0 ? 'Versi sama.' : (c < 0 ? fmtVer(b) : fmtVer(a)) + ' lebih baru.'}`
  }
  if (['naik', 'bump'].includes(sub)) {
    const a = parseVer(args[1]), t = (args[2] || '').toLowerCase(); if (!a || !['major', 'minor', 'patch'].includes(t)) return help
    const n = t === 'major' ? { M: a.M + 1, m: 0, p: 0, pre: [] } : t === 'minor' ? { M: a.M, m: a.m + 1, p: 0, pre: [] } : { M: a.M, m: a.m, p: a.pre.length ? a.p : a.p + 1, pre: [] }
    return `${B('SEMVER')}\n${fmtVer(a)} → *${fmtVer(n)}* (${t})`
  }
  if (['cek', 'satisfies', 'range'].includes(sub)) {
    const ok = satisfies(args[2], args[1]); if (ok === null) return help
    return `${B('SEMVER')}\n${args[2]} ${ok ? 'MEMENUHI' : 'TIDAK memenuhi'} rentang ${args[1]}`
  }
  return help
}

// ───────────── git ─────────────
const GIT = {
  dasar: ['Perintah dasar', ['git init                    # buat repo baru', 'git clone <url>             # salin repo', 'git status                  # lihat perubahan', 'git add <file> | git add .  # tandai untuk commit', 'git commit -m "pesan"       # simpan perubahan', 'git diff [--staged]         # lihat selisih']],
  branch: ['Cabang', ['git branch                  # daftar cabang', 'git switch -c <nama>         # buat + pindah cabang', 'git switch <nama>          # pindah cabang', 'git branch -d <nama>       # hapus cabang (sudah merge)', 'git merge <cabang>         # gabungkan ke cabang aktif']],
  undo: ['Batalkan / perbaiki', ['git restore <file>           # buang perubahan file', 'git restore --staged <file>  # batal add', 'git commit --amend           # ubah commit terakhir', 'git revert <hash>            # commit pembatal (aman untuk shared)', 'git reset --soft HEAD~1      # batal commit, perubahan tetap', 'git reset --hard HEAD~1      # batal commit + BUANG perubahan (hati-hati)', 'git reflog                   # cari commit yang "hilang"']],
  remote: ['Remote', ['git remote -v                       # lihat remote', 'git remote add origin <url>          # tambah remote', 'git fetch                           # ambil tanpa merge', 'git pull --rebase                   # ambil + rebase', 'git push -u origin <cabang>         # push pertama kali', 'git push --force-with-lease         # force push lebih aman']],
  stash: ['Simpan sementara', ['git stash push -m "catatan"   # simpan perubahan', 'git stash list                  # daftar stash', 'git stash pop                   # kembalikan + hapus', 'git stash apply stash@{0}       # kembalikan, stash tetap', 'git stash drop stash@{0}        # hapus stash']],
  log: ['Riwayat', ['git log --oneline --graph --all   # ringkas + grafik', 'git log -p <file>                    # riwayat perubahan file', 'git show <hash>                     # isi satu commit', 'git blame <file>                    # siapa mengubah baris apa', 'git shortlog -sn                    # jumlah commit per orang']],
  tag: ['Tag / rilis', ['git tag v1.0.0                  # tag ringan', 'git tag -a v1.0.0 -m "rilis"      # tag beranotasi', 'git push origin --tags           # kirim semua tag', 'git tag -d v1.0.0                # hapus tag lokal']],
  rebase: ['Rebase', ['git rebase main                  # pindahkan cabang ke atas main', 'git rebase -i HEAD~3              # rapikan 3 commit terakhir', 'git rebase --continue | --abort   # lanjut / batal saat konflik', 'git cherry-pick <hash>            # ambil satu commit']],
  konflik: ['Selesaikan konflik', ['git status                      # lihat file konflik', '# edit file, hapus penanda <<<<<<< ======= >>>>>>>', 'git add <file>                   # tandai selesai', 'git commit | git rebase --continue', 'git merge --abort                # batalkan merge']],
  config: ['Konfigurasi', ['git config --global user.name "Nama"', 'git config --global user.email "me@mail.com"', 'git config --global init.defaultBranch main', 'git config --global alias.st status', 'git config --list']],
}
const GITIGNORE = {
  node: 'node_modules/\nnpm-debug.log*\nyarn-error.log*\n.pnpm-store/\ndist/\nbuild/\ncoverage/\n.env\n.env.*\n!.env.example',
  python: '__pycache__/\n*.py[cod]\n.venv/\nvenv/\n*.egg-info/\ndist/\nbuild/\n.pytest_cache/\n.ipynb_checkpoints/\n.env',
  java: '*.class\n*.jar\n*.war\ntarget/\nbuild/\n.gradle/\nout/\n*.log',
  php: 'vendor/\n.env\n*.log\ncomposer.phar\n.phpunit.result.cache',
  laravel: 'vendor/\nnode_modules/\n.env\n.env.backup\nstorage/*.key\n/public/hot\n/public/storage\n/storage/logs/*\n.phpunit.result.cache',
  go: '*.exe\n*.test\n*.out\nvendor/\nbin/\n.env',
  rust: 'target/\nCargo.lock\n**/*.rs.bk',
  dotnet: 'bin/\nobj/\n*.user\n*.suo\n.vs/\npackages/',
  android: '*.apk\n*.aab\nbuild/\n.gradle/\nlocal.properties\n.idea/\n*.iml\ncaptures/',
  unity: '[Ll]ibrary/\n[Tt]emp/\n[Oo]bj/\n[Bb]uild/\n[Ll]ogs/\n*.csproj\n*.sln\nUserSettings/',
  vscode: '.vscode/*\n!.vscode/settings.json\n!.vscode/extensions.json',
  idea: '.idea/\n*.iml',
  macos: '.DS_Store\n.AppleDouble\n.LSOverride\n._*',
  windows: 'Thumbs.db\nehthumbs.db\nDesktop.ini\n$RECYCLE.BIN/',
  env: '.env\n.env.local\n.env.*.local\n*.pem\n*.key',
}

// ───────────── curl2fetch ─────────────
function tokenize(s) {
  const out = []; let cur = '', q = null, has = false
  s = s.replace(/\\\r?\n/g, ' ')
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (q) { if (c === q) q = null; else if (c === '\\' && q === '"' && i + 1 < s.length) cur += s[++i]; else cur += c }
    else if (c === '"' || c === "'") { q = c; has = true }
    else if (/\s/.test(c)) { if (cur || has) { out.push(cur); cur = ''; has = false } }
    else if (c === '\\' && i + 1 < s.length) cur += s[++i]
    else cur += c
  }
  if (cur || has) out.push(cur)
  return out
}
function curlToFetch(cmd) {
  const t = tokenize(String(cmd).trim()); if (!t.length || t[0].toLowerCase() !== 'curl') return null
  let url = '', method = '', body = null; const headers = {}
  for (let i = 1; i < t.length; i++) {
    const a = t[i], next = () => t[++i]
    if (a === '-X' || a === '--request') method = (next() || '').toUpperCase()
    else if (a === '-H' || a === '--header') { const h = next() || '', k = h.indexOf(':'); if (k > 0) headers[h.slice(0, k).trim()] = h.slice(k + 1).trim() }
    else if (['-d', '--data', '--data-raw', '--data-binary', '--data-ascii'].includes(a)) body = (body === null ? '' : body + '&') + (next() || '')
    else if (a === '--json') { body = next() || ''; headers['Content-Type'] = headers['Content-Type'] || 'application/json'; headers['Accept'] = headers['Accept'] || 'application/json' }
    else if (a === '-u' || a === '--user') headers['Authorization'] = 'Basic ' + Buffer.from(next() || '').toString('base64')
    else if (a === '-A' || a === '--user-agent') headers['User-Agent'] = next() || ''
    else if (a === '-I' || a === '--head') method = 'HEAD'
    else if (a === '--url') url = next() || ''
    else if (/^https?:\/\//i.test(a)) url = a
    else if (/^-[A-Za-z]$/.test(a) && ['-o', '-e', '-b', '-w', '-m'].includes(a)) i++
  }
  if (!url) return null
  method = method || (body !== null ? 'POST' : 'GET')
  const opt = []
  if (method !== 'GET') opt.push(`  method: ${JSON.stringify(method)}`)
  if (Object.keys(headers).length) opt.push(`  headers: ${JSON.stringify(headers, null, 4).replace(/\n/g, '\n  ')}`)
  if (body !== null) opt.push(`  body: ${JSON.stringify(body)}`)
  return `const res = await fetch(${JSON.stringify(url)}${opt.length ? `, {\n${opt.join(',\n')}\n}` : ''});\nconst data = await res.text();\nconsole.log(res.status, data);`
}

// ───────────── cronnext ─────────────
const CRON_RANGE = [[0, 59], [0, 23], [1, 31], [1, 12], [0, 7]]
function parseCronField(f, [lo, hi]) {
  const set = new Set()
  for (const part of f.split(',')) {
    const m = part.match(/^(\*|\d+(?:-\d+)?)(?:\/(\d+))?$/); if (!m) return null
    const step = m[2] ? +m[2] : 1; if (!step) return null
    let a, b
    if (m[1] === '*') { a = lo; b = hi } else if (m[1].includes('-')) { [a, b] = m[1].split('-').map(Number) } else { a = +m[1]; b = m[2] ? hi : a }
    if (a < lo || b > hi || a > b) return null
    for (let v = a; v <= b; v += step) set.add(v)
  }
  return set
}
function nextRuns(expr, from = new Date(), n = 5) {
  const f = String(expr).trim().split(/\s+/); if (f.length !== 5) return null
  const sets = f.map((x, i) => parseCronField(x, CRON_RANGE[i])); if (sets.some(s => !s)) return null
  if (sets[4].has(7)) sets[4].add(0)
  const domStar = f[2] === '*', dowStar = f[4] === '*'
  const OFF = 7 * 3600e3, out = []
  let t = Math.floor(from.getTime() / 60000) * 60000 + 60000
  const limit = t + 366 * 86400e3 * 4
  while (out.length < n && t < limit) {
    const d = new Date(t + OFF), mo = d.getUTCMonth() + 1
    if (!sets[3].has(mo)) { t = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1) - OFF; continue }
    const dom = sets[2].has(d.getUTCDate()), dow = sets[4].has(d.getUTCDay())
    const dayOk = domStar && dowStar ? true : domStar ? dow : dowStar ? dom : (dom || dow)
    if (!dayOk) { t = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1) - OFF; continue }
    if (!sets[1].has(d.getUTCHours())) { t = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours() + 1) - OFF; continue }
    if (sets[0].has(d.getUTCMinutes())) out.push(t)
    t += 60000
  }
  return out
}
const fmtWib = (ms) => new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', weekday: 'long', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(ms).replace(/\./g, ':') + ' WIB'

// ───────────── unicode ─────────────
function doUnicode(t) {
  t = String(t || '').trim(); if (!t) return null
  const cp = t.match(/^(?:U\+|\\u|0x)([0-9a-f]{1,6})$/i)
  if (cp) { const n = parseInt(cp[1], 16); if (n > 0x10FFFF || (n >= 0xD800 && n <= 0xDFFF)) return null; t = String.fromCodePoint(n) }
  const chars = Array.from(t).slice(0, 12)
  const rows = chars.map(c => { const n = c.codePointAt(0), u8 = [...Buffer.from(c)].map(b => b.toString(16).padStart(2, '0')).join(' '), u16 = c.length === 2 ? `${c.charCodeAt(0).toString(16)} ${c.charCodeAt(1).toString(16)}` : n.toString(16).padStart(4, '0'); return `${c.trim() ? c : '␣'}  U+${n.toString(16).toUpperCase().padStart(4, '0')}  desimal ${n}  UTF-8: ${u8}  UTF-16: ${u16}${n > 0xFFFF ? ' (surrogate pair)' : ''}` })
  return `${B('UNICODE')}\n${rows.join('\n')}${Array.from(t).length > 12 ? '\n_...hanya 12 karakter pertama._' : ''}\n\nPanjang: ${Array.from(t).length} karakter • ${Buffer.byteLength(t)} byte UTF-8`
}

// ───────────── sqlfmt ─────────────
const SQL_KW = ['select', 'distinct', 'from', 'where', 'group by', 'order by', 'having', 'limit', 'offset', 'join', 'inner join', 'left join', 'right join', 'full join', 'cross join', 'left outer join', 'right outer join', 'on', 'and', 'or', 'not', 'in', 'is', 'null', 'as', 'union', 'union all', 'insert into', 'values', 'update', 'set', 'delete from', 'create table', 'alter table', 'drop table', 'between', 'like', 'exists', 'case', 'when', 'then', 'else', 'end', 'asc', 'desc', 'count', 'sum', 'avg', 'min', 'max']
const SQL_BREAK = ['select', 'from', 'where', 'group by', 'order by', 'having', 'limit', 'offset', 'union all', 'union', 'insert into', 'values', 'update', 'set', 'delete from', 'left outer join', 'right outer join', 'left join', 'right join', 'inner join', 'full join', 'cross join', 'join']
function formatSql(sql) {
  const strs = []; let s = String(sql).replace(/'(?:[^']|'')*'|"(?:[^"]|"")*"|`[^`]*`/g, x => { strs.push(x); return `\u0001${strs.length - 1}\u0002` })
  s = s.replace(/\s+/g, ' ').trim().replace(/\s*,\s*/g, ', ').replace(/\s*;\s*/g, ';')
  for (const k of SQL_KW.slice().sort((a, b) => b.length - a.length)) s = s.replace(new RegExp(`\\b${k.replace(/ /g, '\\s+')}\\b(?!\\()`, 'gi'), k.toUpperCase())
  s = s.replace(/\b(COUNT|SUM|AVG|MIN|MAX)\s*\(/gi, (_, f) => f.toUpperCase() + '(')
  const brk = SQL_BREAK.slice().sort((x, y) => y.length - x.length).map(k => k.toUpperCase().replace(/ /g, '\\s+')).join('|')
  s = s.replace(new RegExp(`\\s+(?=(?:${brk})\\b)`, 'g'), '\n').replace(/\b(LEFT|RIGHT|INNER|FULL|CROSS|OUTER)\s*\n\s*(?=(?:OUTER\s+)?JOIN\b)/g, '$1 ').replace(/^\n/, '')
  let inWhere = false
  s = s.split('\n').map(line => { if (/^(WHERE|HAVING)\b/.test(line)) inWhere = true; else if (/^[A-Z]/.test(line) && !/^(AND|OR)\b/.test(line)) inWhere = false; return inWhere ? line.replace(/ (AND|OR) /g, '\n  $1 ') : line }).join('\n')
  return s.replace(/\u0001(\d+)\u0002/g, (_, i) => strs[+i])
}

module.exports = {
  name: 'codekit', alias: CMDS, category: 'tools', noLimit: true, cmds: CMDS,
  desc: 'Coding Toolkit: chmod, httpstatus, mime, port, baseconv, hmac, jsontots, jsonget, cidr, semver, gitcheat, gitignore, curl2fetch, cronnext, unicode, sqlfmt',
  // diekspor agar bisa diuji langsung
  chmodNumToSym, chmodSymToNum, doChmod, doHttp, doMime, doPort, doBase, jsonToTs, jsonPath, doCidr, parseVer, cmpVer, satisfies, curlToFetch, nextRuns, doUnicode, formatSql, GIT, GITIGNORE, tokenize,
  run: async ({ m, text, args, command, prefix, reply }) => {
    const t = src(text, m)
    const usage = (title, lines) => reply(`${B(title)}\n${lines.join('\n')}`)
    const U = (c) => `${prefix}${c}`
    switch (command) {
      case 'chmod': { const r = doChmod(args[0]); return reply(r || `${B('CHMOD')}\n${U('chmod 755')}   → rwxr-xr-x\n${U('chmod rw-r--r--')}   → 644\n_Angka 3-4 digit oktal atau 9 karakter simbolik._`) }
      case 'httpstatus': { const r = doHttp(args[0] || ''); return reply(r || `${B('HTTP STATUS')}\n${U('httpstatus 404')}  • ${U('httpstatus 5xx')}  • ${U('httpstatus timeout')}\n\nKelas: 1xx informasi • 2xx berhasil • 3xx pengalihan • 4xx salah klien • 5xx salah server`) }
      case 'mime': { const r = doMime(args[0]); return reply(r || `${B('MIME TYPE')}\n${U('mime png')}  → image/png\n${U('mime application/json')}  → ekstensi .json\nTersedia ${Object.keys(MIME).length} ekstensi umum.`) }
      case 'port': { const r = doPort(args.join(' ')); return reply(r || `${B('PORT JARINGAN')}\n${U('port 5432')}  → PostgreSQL\n${U('port redis')}  → 6379\nTersedia ${Object.keys(PORTS).length} port umum.`) }
      case 'baseconv': { const r = doBase(args); return reply(r || `${B('KONVERSI BASIS')}\n${U('baseconv 255')}  → biner, oktal, heks\n${U('baseconv ff 16 2')}  → heks ke biner\n${U('baseconv 0b1010')}\n_Basis 2 sampai 36, angka sebesar apa pun._`) }
      case 'hmac': {
        const algo = (args[0] || '').toLowerCase(), key = args[1], msg = args.slice(2).join(' ') || (m && m.quoted && (m.quoted.text || '')) || ''
        if (!['md5', 'sha1', 'sha256', 'sha512'].includes(algo) || !key || !msg) return usage('HMAC', [`${U('hmac sha256 kuncirahasia pesan yang ditandatangani')}`, 'Algoritma: md5, sha1, sha256, sha512. Kunci = satu kata (tanpa spasi).'])
        return reply(`${B('HMAC-' + algo.toUpperCase())}\n${crypto.createHmac(algo, key).update(msg).digest('hex')}\n\n_Jangan kirim kunci rahasia asli ke chat publik._`)
      }
      case 'jsontots': {
        if (!t) return usage('JSON → TYPESCRIPT', [`${U('jsontots {"id":1,"nama":"Budi","tag":["a"]}')}`, '_Atau reply pesan JSON dengan_ ' + U('jsontots')])
        let v; try { v = JSON.parse(t) } catch (e) { return reply(`${B('JSON → TYPESCRIPT')}\nJSON tidak valid: ${e.message}`) }
        return reply(code(jsonToTs(v)))
      }
      case 'jsonget': {
        const path = args[0], raw = String(text || '').slice(String(text || '').indexOf(args[0] || '') + (args[0] || '').length).trim() || (m && m.quoted && m.quoted.text) || ''
        if (!path || !raw) return usage('JSON GET', [`${U('jsonget data.users[0].nama {"data":{"users":[{"nama":"Budi"}]}}')}`, '_Atau reply pesan JSON: ' + U('jsonget data.users[0].nama') + '_'])
        let v; try { v = JSON.parse(raw) } catch (e) { return reply(`${B('JSON GET')}\nJSON tidak valid: ${e.message}`) }
        const r = jsonPath(v, path); return reply(r.found ? `${B('JSON GET')} ${path}\n${typeof r.value === 'object' ? code(JSON.stringify(r.value, null, 2)) : String(r.value)}` : `${B('JSON GET')}\nPath "${path}" tidak ditemukan.`)
      }
      case 'cidr': { const r = doCidr(args[0]); return reply(r || `${B('CIDR')}\n${U('cidr 192.168.1.10/24')}\n_Hitung netmask, network, broadcast, rentang host._`) }
      case 'semver': return reply(doSemver(args, prefix))
      case 'gitcheat': {
        const k = (args[0] || '').toLowerCase()
        if (GIT[k]) return reply(`${B('GIT — ' + GIT[k][0].toUpperCase())}\n${code(GIT[k][1].join('\n'))}`)
        return reply(`${B('GIT CHEATSHEET')}\nTopik: ${Object.keys(GIT).join(', ')}\nContoh: ${U('gitcheat undo')}`)
      }
      case 'gitignore': {
        const ks = args.map(x => x.toLowerCase()).filter(x => GITIGNORE[x])
        if (!ks.length) return reply(`${B('.GITIGNORE')}\nTemplate: ${Object.keys(GITIGNORE).join(', ')}\nContoh: ${U('gitignore node vscode macos')}`)
        return reply(code(ks.map(k => `# ${k}\n${GITIGNORE[k]}`).join('\n\n')))
      }
      case 'curl2fetch': {
        if (!t) return usage('CURL → FETCH', [`${U("curl2fetch curl -X POST https://api.contoh.com/data -H 'Content-Type: application/json' -d '{\"a\":1}'")}`])
        const r = curlToFetch(t); return reply(r ? code(r) : `${B('CURL → FETCH')}\nPerintah curl tidak terbaca. Pastikan diawali kata curl dan memuat URL http(s).`)
      }
      case 'cronnext': {
        const expr = args.slice(0, 5).join(' '), n = Math.min(10, Math.max(1, parseInt(args[5]) || 5))
        const r = args.length >= 5 ? nextRuns(expr, new Date(), n) : null
        if (!r) return usage('CRON BERIKUTNYA', [`${U('cronnext */15 * * * *')}`, `${U('cronnext 0 9 * * 1-5 8')}  (8 jadwal berikutnya)`, 'Format 5 kolom: menit jam tanggal bulan hari. Waktu dalam WIB.'])
        return reply(`${B('CRON')} ${expr}\n` + (r.length ? r.map((x, i) => `${i + 1}. ${fmtWib(x)}`).join('\n') : 'Tidak ada jadwal dalam 4 tahun ke depan.'))
      }
      case 'unicode': { const r = doUnicode(t); return reply(r || `${B('UNICODE')}\n${U('unicode 😀')}  • ${U('unicode U+1F600')}\n_Titik kode, UTF-8, UTF-16._`) }
      case 'sqlfmt': { if (!t) return usage('SQL FORMAT', [`${U('sqlfmt select a,b from t where x=1 and y=2 order by a')}`]); return reply(code(formatSql(t))) }
    }
  },
}
