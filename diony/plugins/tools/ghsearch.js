/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// GitHub: cari + unduh
//   .ghsearch <kata>            cari repositori (urut bintang). Boleh pakai kualifier GitHub: language:js stars:>100 user:nama
//   .ghsearch user <kata>       cari pengguna / organisasi
//   .ghdl <no|repo|url> [cabang]            unduh repo sebagai .zip   (no = nomor dari hasil .ghsearch terakhir)
//   .ghdl file <no|repo> <path> [cabang]    unduh SATU file apa adanya (url .../blob/cabang/path juga bisa)
// Rilis & aset rilis tetap lewat .snip rilis / .snip unduh. Hanya data publik; GITHUB_TOKEN (env) opsional untuk menaikkan batas laju.
// Token TIDAK dikirim ke server unduhan (redirect ditangani manual).
const axios = require('axios')
const { B } = require('../../lib/style')

const MAX_FILE = 50 * 1024 * 1024, MAX_REPO_KB = 200 * 1024, COOLDOWN = 15000, TTL = 20 * 60 * 1000
const last = new Map(), memo = new Map()
const REPO_RE = /^[A-Za-z0-9_.-]{1,100}\/[A-Za-z0-9_.-]{1,100}$/
const UA = 'Mozilla/5.0 (Chisa AI-Bot)'
const api = () => ({ 'User-Agent': UA, Accept: 'application/vnd.github+json', ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}) })
const size = (b) => b >= 1048576 ? (b / 1048576).toFixed(2) + ' MB' : b >= 1024 ? (b / 1024).toFixed(1) + ' KB' : b + ' B'
const num = (n) => Number(n || 0).toLocaleString('id-ID')
const cut = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s }
const tgl = (s) => String(s || '').slice(0, 10) || '-'
const safeSeg = (s) => String(s || '').replace(/[^A-Za-z0-9_.-]/g, '_')
const key = (m) => `${m.chat}|${m.sender}`
const MIME = { zip: 'application/zip', json: 'application/json', pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', mp3: 'audio/mpeg', mp4: 'video/mp4', html: 'text/html', css: 'text/css', md: 'text/markdown', csv: 'text/csv', txt: 'text/plain', js: 'text/javascript', ts: 'text/plain', py: 'text/x-python', java: 'text/plain', c: 'text/plain', cpp: 'text/plain', go: 'text/plain', rs: 'text/plain', sh: 'text/x-shellscript', yml: 'text/yaml', yaml: 'text/yaml', xml: 'application/xml' }
const mimeOf = (n) => MIME[String(n).split('.').pop().toLowerCase()] || 'application/octet-stream'

// "o/r", "https://github.com/o/r", ".../tree/cabang/...", ".../blob/cabang/path"
function parseRef(s) {
  s = String(s || '').trim().replace(/[<>]/g, '')
  const u = s.match(/github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:\/(blob|tree)\/([^/\s]+)\/?(\S*))?(?:[?#]\S*)?$/i)
  if (u) return { repo: `${u[1]}/${u[2]}`, kind: u[3] || null, branch: u[4] ? decodeURIComponent(u[4]) : null, path: u[5] ? decodeURIComponent(u[5]) : '' }
  return { repo: s, kind: null, branch: null, path: '' }
}
// "3" → repo dari hasil pencarian terakhir
function resolveRepo(m, s) {
  if (/^\d{1,2}$/.test(String(s || '').trim())) {
    const h = memo.get(key(m)); if (!h || Date.now() - h.at > TTL) return { err: 'Daftar hasil sudah kedaluwarsa. Cari lagi dengan .ghsearch, atau tulis nama repo lengkap (pemilik/repo).' }
    const r = h.repos[Number(s) - 1]; if (!r) return { err: `Nomor ${s} tidak ada (1–${h.repos.length}).` }
    return { ref: { repo: r, kind: null, branch: null, path: '' } }
  }
  const ref = parseRef(s); if (!REPO_RE.test(ref.repo)) return { err: 'Format repo: pemilik/nama-repo, tautan GitHub, atau nomor dari .ghsearch.' }
  return { ref }
}
const apiErr = (e) => {
  const st = e.response && e.response.status
  if (st === 404) return 'Repo / file / cabang tidak ditemukan (atau repo privat).'
  if (st === 403 || st === 429) return 'Batas permintaan GitHub tercapai. Coba lagi beberapa menit lagi (owner bisa mengisi GITHUB_TOKEN).'
  if (st === 422) return 'Kata kunci pencarian tidak valid.'
  if (e.code === 'ECONNABORTED') return 'GitHub terlalu lama merespons.'
  if (e.code === 'ETOOBIG') return `Berkas melebihi batas ${size(MAX_FILE)} lewat bot.`
  return 'Gagal menghubungi GitHub.'
}

// ikuti 1 redirect (api.github.com → codeload) TANPA membawa token
async function getBinary(url, withAuth) {
  const base = { responseType: 'arraybuffer', timeout: 180000, maxContentLength: MAX_FILE + 1024, maxBodyLength: MAX_FILE + 1024, validateStatus: (s) => s < 400 }
  const r1 = await axios.get(url, { ...base, headers: withAuth ? api() : { 'User-Agent': UA }, maxRedirects: 0, validateStatus: (s) => s < 400 })
  if (r1.status >= 300 && r1.headers.location) {
    if (!/^https:\/\/(codeload\.github\.com|raw\.githubusercontent\.com|objects\.githubusercontent\.com)\//.test(r1.headers.location)) throw new Error('redirect tidak dikenal')
    return (await axios.get(r1.headers.location, { ...base, headers: { 'User-Agent': UA } })).data
  }
  return r1.data
}

async function search(m, q, users) {
  const url = users ? 'https://api.github.com/search/users' : 'https://api.github.com/search/repositories'
  const { data } = await axios.get(url, { params: users ? { q, per_page: 10 } : { q, sort: 'stars', order: 'desc', per_page: 10 }, headers: api(), timeout: 20000 })
  return data
}

module.exports = {
  name: 'ghsearch', alias: ['ghdl', 'carigithub', 'ghcari', 'unduhrepo', 'gitclone'], category: 'tools', cmds: ['ghsearch', 'ghdl'], noLimit: false,
  desc: 'GitHub: cari repositori / pengguna, lalu unduh repo (.zip) atau satu file lewat .ghdl',
  parseRef, resolveRepo, _memo: memo,
  run: async ({ sock, m, command, args, prefix, reply }) => {
    const P = prefix || '.'
    const react = (e) => sock.sendMessage(m.chat, { react: { text: e, key: m.key } }).catch(() => {})
    const isDl = ['ghdl', 'unduhrepo', 'gitclone'].includes(command)
    try {
      // ───────── CARI ─────────
      if (!isDl) {
        const sub = String(args[0] || '').toLowerCase(), users = sub === 'user' || sub === 'pengguna'
        const q = (users ? args.slice(1) : args).join(' ').trim()
        if (!q) return reply(`${B('GHSEARCH')}\nCari repo : ${P}ghsearch whatsapp bot\nFilter    : ${P}ghsearch bot language:javascript stars:>500\nPengguna  : ${P}ghsearch user torvalds\n\nUnduh hasilnya: ${P}ghdl <no>   atau   ${P}ghdl file <no> <path>`)
        if (q.length > 200) return reply('✕ Kata kunci maksimal 200 karakter.')
        react('🕕')
        const data = await search(m, q, users)
        const items = data.items || []
        if (!items.length) { react('❌'); return reply(`✕ Tidak ada hasil untuk "${cut(q, 60)}".`) }
        if (users) {
          const L = items.map((u, i) => `${i + 1}. *${u.login}* (${u.type === 'Organization' ? 'org' : 'user'})\n${u.html_url}`)
          react('✅'); return reply(`${B('PENGGUNA GITHUB')}\n🔎 ${cut(q, 60)}  •  ${num(data.total_count)} hasil\n\n${L.join('\n\n')}\n\nLihat profil & repo: ${P}github <nama>`)
        }
        memo.set(key(m), { at: Date.now(), repos: items.map(r => r.full_name) })
        const L = items.map((r, i) => `${i + 1}. *${r.full_name}*\n⭐ ${num(r.stargazers_count)}  🍴 ${num(r.forks_count)}  •  ${r.language || '-'}  •  upd ${tgl(r.pushed_at)}${r.archived ? '  •  diarsipkan' : ''}\n${cut(r.description, 110) || '_tanpa deskripsi_'}`)
        react('✅')
        return reply(`${B('HASIL GITHUB')}\n🔎 ${cut(q, 60)}  •  ${num(data.total_count)} repo\n\n${L.join('\n\n')}\n\n⬇️ Unduh zip : ${P}ghdl <no>\n📄 Satu file : ${P}ghdl file <no> <path>\n🏷️ Rilis      : ${P}snip rilis <repo>`)
      }

      // ───────── UNDUH ─────────
      const fileMode = String(args[0] || '').toLowerCase() === 'file'
      const rest = fileMode ? args.slice(1) : args
      if (!rest.length) return reply(`${B('GHDL')}\nUnduh repo (.zip)  : ${P}ghdl <no|pemilik/repo> [cabang]\nUnduh satu file    : ${P}ghdl file <no|pemilik/repo> <path> [cabang]\nContoh:\n${P}ghdl nodejs/node\n${P}ghdl 2\n${P}ghdl file nodejs/node README.md\n${P}ghdl https://github.com/nodejs/node/blob/main/LICENSE\n\n_Nomor diambil dari hasil ${P}ghsearch terakhir. Maks ${size(MAX_FILE)}._`)
      const rr = resolveRepo(m, rest[0]); if (rr.err) return reply(`✕ ${rr.err}`)
      const ref = rr.ref, repo = ref.repo
      const urlFile = ref.kind === 'blob' && ref.path
      const wantFile = fileMode || !!urlFile
      let path = '', branch = ''
      if (wantFile) {
        path = String(urlFile ? ref.path : rest[1] || '').replace(/^\/+|\/+$/g, '')
        branch = (urlFile ? ref.branch : rest[2]) || ''
        if (!path) return reply(`✕ Sebutkan path file.\nContoh: ${P}ghdl file ${repo} README.md`)
        if (path.split('/').some(x => x === '..' || x === '.')) return reply('✕ Path tidak valid.')
      } else branch = ref.branch || rest[1] || ''
      if (branch && (!/^[\w./@+-]{1,100}$/.test(branch) || branch.includes('..') || /^[/.-]|\/$|\/\//.test(branch))) return reply('✕ Nama cabang / tag tidak valid.')

      const now = Date.now(), prev = last.get(m.sender) || 0
      if (now - prev < COOLDOWN) { react('⏳'); return reply(`⏳ Tunggu ${Math.ceil((COOLDOWN - (now - prev)) / 1000)} detik sebelum unduhan berikutnya.`) }
      last.set(m.sender, now)
      react('🕕')

      if (wantFile) {
        const enc = path.split('/').map(encodeURIComponent).join('/')
        const { data } = await axios.get(`https://api.github.com/repos/${repo}/contents/${enc}${branch ? `?ref=${encodeURIComponent(branch)}` : ''}`, { headers: api(), timeout: 20000 })
        if (Array.isArray(data)) { react('❌'); return reply(`✕ "${path}" adalah folder. Untuk satu folder gunakan unduh repo penuh: ${P}ghdl ${repo}\nIsi folder: ${P}snip repo ${repo} ${path}`) }
        if (data.type !== 'file' || !data.download_url) { react('❌'); return reply('✕ Item ini bukan file yang bisa diunduh (submodule / symlink).') }
        if (data.size > MAX_FILE) { react('❌'); return reply(`✕ ${data.name} berukuran ${size(data.size)} (maks ${size(MAX_FILE)}).\nUnduh manual: ${data.download_url}`) }
        let buf
        if (data.encoding === 'base64' && data.content) buf = Buffer.from(data.content, 'base64')
        else buf = Buffer.from(await getBinary(data.download_url, false))
        await sock.sendMessage(m.chat, { document: buf, fileName: data.name, mimetype: mimeOf(data.name), caption: `📄 ${repo}/${data.path}\n📦 ${size(buf.length)}` }, { quoted: m })
        react('✅'); return
      }

      // repo → zip
      const meta = (await axios.get(`https://api.github.com/repos/${repo}`, { headers: api(), timeout: 20000 })).data
      if (meta.size > MAX_REPO_KB) { react('❌'); return reply(`✕ Repo ${meta.full_name} sangat besar (~${size(meta.size * 1024)}). Batas lewat bot ${size(MAX_FILE)} untuk zip.\nKloning manual: git clone ${meta.clone_url}`) }
      const ref2 = branch || meta.default_branch
      await reply(`⬇️ Mengunduh *${meta.full_name}* (${ref2}) — repo ±${size(meta.size * 1024)}…`)
      const buf = Buffer.from(await getBinary(`https://api.github.com/repos/${repo}/zipball/${encodeURIComponent(ref2).replace(/%2F/g, '/')}`, true))
      if (buf.length > MAX_FILE) { react('❌'); return reply(`✕ Zip ${size(buf.length)} melebihi batas ${size(MAX_FILE)}.`) }
      const fileName = `${safeSeg(meta.name)}-${safeSeg(ref2)}.zip`
      await sock.sendMessage(m.chat, { document: buf, fileName, mimetype: 'application/zip', caption: `📦 ${meta.full_name} @ ${ref2}\n⭐ ${num(meta.stargazers_count)}  •  ${size(buf.length)}${meta.license && meta.license.spdx_id && meta.license.spdx_id !== 'NOASSERTION' ? `  •  ${meta.license.spdx_id}` : ' •  lisensi: cek repo'}\n${meta.html_url}` }, { quoted: m })
      react('✅')
    } catch (e) {
      react('❌')
      console.log('[ghsearch]', command, e.message)
      return reply(`✕ ${apiErr(e)}`)
    }
  },
}
