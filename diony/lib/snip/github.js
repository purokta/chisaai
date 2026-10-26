/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Alat GitHub — rilis, unduh aset rilis, dan lihat isi file repositori sebagai blok kode native.
//   .ghrelease <pemilik/repo>             info rilis terbaru + daftar aset (tabel native) + catatan rilis (blok kode)
//   .ghunduh <pemilik/repo> [no|nama]     unduh aset rilis & kirim sebagai dokumen (default: aset no.1)
//   .ghkode <pemilik/repo> <path> [cabang]  isi file → blok kode; jika path folder → daftar isinya
// Hanya membaca data publik lewat api.github.com (GITHUB_TOKEN di env, jika ada, dipakai untuk menaikkan batas laju).
const axios = require('axios')
const CB = require('../codeblock'), { B } = require('../style')

const MAX_ASSET = 50 * 1024 * 1024, MAX_FILE = 300 * 1024, COOLDOWN = 15000
const last = new Map()
const REPO_RE = /^[A-Za-z0-9_.-]{1,100}\/[A-Za-z0-9_.-]{1,100}$/
const hdr = () => ({ 'User-Agent': 'Mozilla/5.0 (Chisa AI-Bot)', Accept: 'application/vnd.github+json', ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}) })
const size = (b) => b >= 1048576 ? (b / 1048576).toFixed(2) + ' MB' : b >= 1024 ? (b / 1024).toFixed(1) + ' KB' : b + ' B'
const tgl = (s) => { try { return new Date(s).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'short', year: 'numeric' }) } catch { return String(s || '-') } }

// terima "o/r", "https://github.com/o/r", ".../blob/cabang/path", ".../tree/cabang/path"
function parseRef(s) {
  s = String(s || '').trim().replace(/[<>]/g, '')
  const u = s.match(/github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:\/(?:blob|tree)\/([^/\s]+)\/?(\S*))?(?:[?#]\S*)?$/i)
  if (u) return { repo: `${u[1]}/${u[2]}`, branch: u[3] || null, path: u[4] ? decodeURIComponent(u[4]) : '' }
  return { repo: s, branch: null, path: '' }
}
const apiErr = (e) => {
  const st = e.response && e.response.status
  if (st === 404) return 'Repo/rilis/file tidak ditemukan (atau repo privat).'
  if (st === 403 || st === 429) return 'Batas permintaan GitHub tercapai. Coba lagi beberapa menit lagi.'
  if (e.code === 'ECONNABORTED') return 'GitHub terlalu lama merespons.'
  return 'Gagal menghubungi GitHub.'
}
async function getRelease(repo) {
  try { return (await axios.get(`https://api.github.com/repos/${repo}/releases/latest`, { headers: hdr(), timeout: 20000 })).data } catch (e) {
    if (!(e.response && e.response.status === 404)) throw e
    const list = (await axios.get(`https://api.github.com/repos/${repo}/releases?per_page=1`, { headers: hdr(), timeout: 20000 })).data
    if (!Array.isArray(list) || !list.length) { const err = new Error('tidak ada rilis'); err.noRelease = true; throw err }
    return list[0]
  }
}

module.exports = {
  name: 'ghtools', alias: ['ghrelease', 'ghunduh', 'ghkode', 'rilis'], category: 'tools', noLimit: true,
  cmds: ['ghrelease', 'ghunduh', 'ghkode'],
  desc: 'GitHub: info rilis terbaru, unduh aset rilis, dan baca file repo sebagai blok kode native',
  run: async ({ sock, m, command, args, prefix, reply }) => {
    const P = prefix || '.'
    const c = command === 'ghtools' ? 'ghrelease' : command === 'rilis' ? 'ghrelease' : command
    const ref = parseRef(args[0])
    if (!REPO_RE.test(ref.repo)) {
      const ex = { ghrelease: `${P}snip rilis fidzzcodex-me/skytrace`, ghunduh: `${P}snip unduh fidzzcodex-me/skytrace 1`, ghkode: `${P}snip repo nodejs/node lib/os.js\n${P}snip repo nodejs/node lib (daftar isi folder)` }[c]
      return reply(`${B(c.toUpperCase())}\nFormat repo: pemilik/nama-repo atau tautan GitHub.\n${ex}`)
    }
    const repo = ref.repo
    const react = (e) => sock.sendMessage(m.chat, { react: { text: e, key: m.key } }).catch(() => {})

    try {
      if (c === 'ghrelease' || c === 'ghunduh') {
        react('🕕')
        const rel = await getRelease(repo)
        const assets = Array.isArray(rel.assets) ? rel.assets : []

        if (c === 'ghrelease') {
          const rows = [['No', 'Aset', 'Ukuran', 'Unduh'], ...assets.slice(0, 20).map((a, i) => [String(i + 1), a.name, size(a.size), `${a.download_count}×`])]
          const intro = `🏷️ *${rel.name || rel.tag_name}*\n┣ Repo : ${repo}\n┣ Tag  : ${rel.tag_name}${rel.prerelease ? ' (pra-rilis)' : ''}\n┣ Rilis: ${tgl(rel.published_at || rel.created_at)}\n┗ Aset : ${assets.length}${rel.html_url ? `\n${rel.html_url}` : ''}`
          const parts = [{ text: intro }]
          if (assets.length) parts.push({ table: { title: 'Aset rilis', rows } })
          const notes = String(rel.body || '').replace(/\r\n/g, '\n').trim()
          if (notes) parts.push({ text: '📝 *Catatan rilis*' }, { code: notes.length > 3000 ? notes.slice(0, 3000) + '\n…' : notes, lang: 'markdown' })
          if (assets.length) parts.push({ text: `Unduh: ${P}snip unduh ${repo} <no>` })
          const ok = await CB.sendRich(sock, m, parts, { react: '🏷️' })
          return ok
        }

        // ghunduh
        if (!assets.length) { react('❌'); return reply(`✕ Rilis *${rel.tag_name}* di ${repo} tidak punya aset untuk diunduh.${rel.zipball_url ? `\nArsip sumber: ${rel.zipball_url}` : ''}`) }
        const sel = args.slice(1).join(' ').trim().toLowerCase()
        let asset = !sel ? assets[0] : /^\d+$/.test(sel) ? assets[Number(sel) - 1] : assets.find(a => a.name.toLowerCase().includes(sel))
        if (!asset) { react('❌'); return reply(`✕ Aset "${sel}" tidak ada. Lihat daftar: ${P}snip rilis ${repo}`) }
        const now = Date.now(), prev = last.get(m.sender) || 0
        if (now - prev < COOLDOWN) { react('⏳'); return reply(`⏳ Tunggu ${Math.ceil((COOLDOWN - (now - prev)) / 1000)} detik sebelum unduhan berikutnya.`) }
        if (asset.size > MAX_ASSET) { react('❌'); return reply(`✕ ${asset.name} berukuran ${size(asset.size)} (maks ${size(MAX_ASSET)} lewat bot).\nUnduh manual: ${asset.browser_download_url}`) }
        last.set(m.sender, now)
        await reply(`⬇️ Mengunduh *${asset.name}* (${size(asset.size)}) dari ${repo} ${rel.tag_name}…`)
        const res = await axios.get(asset.browser_download_url, { responseType: 'arraybuffer', timeout: 180000, maxContentLength: MAX_ASSET + 1024, maxBodyLength: MAX_ASSET + 1024, headers: { 'User-Agent': hdr()['User-Agent'] } })
        await sock.sendMessage(m.chat, { document: Buffer.from(res.data), fileName: asset.name, mimetype: asset.content_type || 'application/octet-stream', caption: `🏷️ ${repo} ${rel.tag_name}\n📦 ${asset.name} — ${size(asset.size)}` }, { quoted: m })
        react('✅')
        return
      }

      // ghkode
      react('🕕')
      const fromUrl = !!(ref.path || ref.branch)
      const path = String((fromUrl ? ref.path : args[1]) || '').replace(/^\/+|\/+$/g, '')
      const branch = (fromUrl ? ref.branch : args[2]) || ''
      if (path.split('/').some(x => x === '..')) return reply('✕ Path tidak valid.')
      const url = `https://api.github.com/repos/${repo}/contents/${path.split('/').filter(Boolean).map(encodeURIComponent).join('/')}${branch ? `?ref=${encodeURIComponent(branch)}` : ''}`
      const { data } = await axios.get(url, { headers: hdr(), timeout: 20000 })
      if (Array.isArray(data)) {
        const rows = [['Nama', 'Jenis', 'Ukuran'], ...data.sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'dir' ? -1 : 1)).slice(0, 40).map(x => [x.name, x.type === 'dir' ? 'folder' : 'file', x.type === 'dir' ? '-' : size(x.size)])]
        return CB.sendTable(sock, m, { intro: `📁 *${repo}/${path}*${data.length > 40 ? ` (40 dari ${data.length} item)` : ''}`, title: path || repo, rows, outro: `Buka file: ${P}snip repo ${repo} <path>`, react: '📁' })
      }
      if (data.type !== 'file') return reply('✕ Item ini bukan file teks.')
      if (data.size > MAX_FILE) return reply(`✕ File ${size(data.size)} terlalu besar (maks ${size(MAX_FILE)}).\n${data.html_url}`)
      let code = data.encoding === 'base64' ? Buffer.from(data.content || '', 'base64').toString('utf8') : String(data.content || '')
      if (code.includes('\u0000')) return reply('✕ File ini biner, bukan teks/kode.')
      code = code.replace(/\r\n/g, '\n')
      const cut = code.length > CB.MAX_CODE
      const lang = CB.EXT_LANG(data.name) || CB.detectLang(code)
      return CB.sendCode(sock, m, { intro: `📄 *${repo}/${data.path}* — ${size(data.size)}, ${code.split('\n').length} baris${cut ? ' (dipotong)' : ''}\n${data.html_url}`, code, lang, react: '📄' })
    } catch (e) {
      react('❌')
      console.log('[github]', c, repo, e.message)
      if (e.noRelease) return reply(`✕ ${repo} belum punya rilis.`)
      return reply(`✕ ${apiErr(e)}`)
    }
  },
}
