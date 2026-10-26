/*
 * DIONYSUSMD | © Pix
 * Character profile helper: public metadata only; no private API or access-control bypass.
 * Commands: .cai <character> <message> | .cai search <query> | .cai import <public URL> | .cai info | .cai reset
 */
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const ai = require('../../lib/ai')
const { B } = require('../../lib/style')
const DB_FILE = path.join(global.dionyData, 'characterai.json')
const LINE = '━━━━━━━━━━━━━━━━━━━━'
const MAX_PROFILE = 3500
const MAX_HISTORY = 8
const clean = (s, n = 500) => String(s || '').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d)).replace(/\s+/g, ' ').trim().slice(0, n)
function read() { try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) } catch { return { profiles: {}, active: {}, history: {} } } }
function write(db) { fs.mkdirSync(path.dirname(DB_FILE), { recursive: true }); fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)) }
function safeUrl(raw) {
  let u
  try { u = new URL(raw) } catch { return null }
  if (u.protocol !== 'https:' || !['character.ai', 'www.character.ai', 'beta.character.ai'].includes(u.hostname)) return null
  if (!/^\/(chat|c)\//i.test(u.pathname) && !/^\/chat\//i.test(u.pathname)) return null
  u.hash = ''; return u.toString()
}
async function getPublicPage(url) {
  // Ambil satu halaman publik dengan batas ukuran/waktu. Tidak memakai cookie login, token, atau endpoint privat.
  const r = await axios.get(url, { timeout: 12000, maxContentLength: 1_500_000, maxBodyLength: 1_500_000, responseType: 'text', headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CHISAPublicProfile/1.0)', Accept: 'text/html,application/xhtml+xml' }, validateStatus: s => s >= 200 && s < 500 })
  if (r.status === 401 || r.status === 403 || r.status === 429) throw new Error(`Halaman publik tidak bisa diakses (HTTP ${r.status}). Bot tidak akan melewati proteksi situs.`)
  if (r.status >= 400) throw new Error(`Halaman membalas HTTP ${r.status}.`)
  return String(r.data || '').slice(0, 1_500_000)
}
function meta(html, prop) {
  const esc = prop.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  let m = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${esc}["'][^>]+content=["']([^"']*)["'][^>]*>`, 'i'))
  if (!m) m = html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${esc}["'][^>]*>`, 'i'))
  return m ? clean(m[1], 1200) : ''
}
function extract(html, url) {
  let title = meta(html, 'og:title') || meta(html, 'twitter:title')
  if (!title) title = clean((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1], 180)
  let description = meta(html, 'og:description') || meta(html, 'description') || meta(html, 'twitter:description')
  // Structured data is public page metadata; use only if available.
  if (!description) {
    const ld = (html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i) || [])[1]
    if (ld) { try { const j = JSON.parse(ld); description = clean(j.description || j.characterDescription || '', 1200); title = title || clean(j.name, 180) } catch {} }
  }
  const image = meta(html, 'og:image')
  return { title: clean(title || 'Karakter Character.AI', 180), description: clean(description || 'Deskripsi tidak tersedia pada metadata publik.', 1200), image, url, importedAt: Date.now() }
}
async function searchPublic(q) {
  const url = 'https://html.duckduckgo.com/html/?q=' + encodeURIComponent('site:character.ai/chat ' + q)
  const r = await axios.get(url, { timeout: 12000, maxContentLength: 1_000_000, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CHISAPublicSearch/1.0)', Accept: 'text/html' } })
  const html = String(r.data || '')
  const out = [], seen = new Set()
  // Search-engine results only; validate every link as a public Character.AI character URL.
  for (const m of html.matchAll(/class=["'][^"']*result__a[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    let href = clean(m[1], 1500)
    try { const parsed = new URL(href, 'https://html.duckduckgo.com'); if (parsed.hostname.includes('duckduckgo.com') && parsed.searchParams.has('uddg')) href = decodeURIComponent(parsed.searchParams.get('uddg')) } catch {}
    const safe = safeUrl(href)
    if (!safe || seen.has(safe)) continue
    seen.add(safe); out.push({ url: safe, title: clean(m[2], 150) }); if (out.length >= 6) break
  }
  return out
}
module.exports = {
  name: 'cai', alias: ['characterai', 'csearch', 'cimport', 'cchat', 'creset'], category: 'ai', noLimit: false,
  cmds: ['cai', 'csearch', 'cimport', 'cchat', 'creset'],
  desc: 'Karakter publik: .cai <nama karakter> <pesan> | search <nama> | import <URL> | info | reset',
  run: async ({ m, text, command, prefix, reply, sock }) => {
    const sender = m.sender || m.key?.participant || m.chat
    const cmd = String(command || 'cai').toLowerCase()
    let sub = cmd === 'csearch' ? 'search' : cmd === 'cimport' ? 'import' : cmd === 'cchat' ? 'chat' : cmd === 'creset' ? 'reset' : ''
    let arg = String(text || '').trim()
    if (!sub) { const mm = arg.match(/^(search|cari|import|impor|chat|ngobrol|info|reset|ganti)\b\s*/i); if (mm) { sub = mm[1].toLowerCase(); arg = arg.slice(mm[0].length).trim() } }
    const db = read(); db.profiles ||= {}; db.active ||= {}; db.history ||= {}
    // One-line mode: .cai <character name> <message>. Match only profiles already imported.
    let oneLineMessage = ''
    if (!sub && arg) {
      const split = arg.match(/^(\S(?:.*?))\s+([\s\S]+)$/)
      if (split) {
        const requested = split[1].trim().toLowerCase()
        oneLineMessage = split[2].trim()
        const entries = Object.entries(db.profiles)
        const found = entries.find(([, p]) => String(p.title || '').trim().toLowerCase() === requested)
          || entries.find(([, p]) => String(p.title || '').trim().toLowerCase().startsWith(requested))
        if (found) { db.active[sender] = found[0]; sub = 'chat'; arg = oneLineMessage }
        else return reply(`Karakter *${split[1].trim()}* belum diimpor.\nCari dulu: ${prefix}cai search ${split[1].trim()}\nLalu impor URL hasilnya: ${prefix}cai import <URL>\nSetelah itu gunakan satu command: ${prefix}cai ${split[1].trim()} halo`)
      }
    }
    if (!sub || ['info'].includes(sub)) {
      const active = db.profiles[db.active[sender]]
      return reply(`${B('CHISA AI × CHARACTER.AI')}
${LINE}
Cari karakter publik, simpan metadata yang terlihat, lalu ngobrol memakai persona karakter dengan AI yang sudah dikonfigurasi di bot.

- ${prefix}cai search <nama karakter>
- ${prefix}cai import <URL profil publik>
- ${prefix}cai <nama karakter> <pesan> (satu command)
- ${prefix}cai info
- ${prefix}cai reset

${active ? `Karakter aktif: *${active.title}*` : 'Belum ada karakter aktif. Impor profil publik terlebih dahulu.'}

_Catatan: hanya metadata publik yang dapat diakses. Tidak mengambil chat privat, cookie login, atau endpoint internal C.AI._`)
    }
    if (['search', 'cari'].includes(sub)) {
      if (!arg || arg.length > 100) return reply(`Contoh: ${prefix}cai search Gojo Satoru`)
      await reply('Mencari hasil publik…')
      try {
        const results = await searchPublic(arg)
        if (!results.length) return reply('Belum menemukan tautan profil publik yang cocok. Coba kata kunci lain atau gunakan URL profil publik dengan perintah import.')
        return reply(`${B('HASIL PENCARIAN KARAKTER')}
${LINE}
${results.map((x, i) => `${i + 1}. *${x.title || 'Karakter publik'}*\n${x.url}\nImpor: ${prefix}cai import ${x.url}`).join('\n\n')}

_Hasil berasal dari mesin pencari; akses profil tetap mengikuti ketersediaan situs._`)
      } catch (e) { return reply(`Pencarian gagal: ${clean(e.message, 180)}\nCoba impor URL profil publik secara langsung.`) }
    }
    if (['import', 'impor'].includes(sub)) {
      const url = safeUrl(arg)
      if (!url) return reply(`Masukkan URL profil karakter publik Character.AI yang valid.\nContoh: ${prefix}cai import https://character.ai/chat/...\n
Bot hanya membaca halaman publik dan tidak melewati login atau proteksi akses.`)
      try {
        await reply('Membaca metadata publik karakter…')
        const html = await getPublicPage(url), profile = extract(html, url)
        if (/just a moment|verify you are human|captcha/i.test(html) && !profile.description) throw new Error('Situs meminta verifikasi. Impor otomatis dihentikan; tidak ada upaya melewati proteksi.')
        const id = url
        db.profiles[id] = { ...profile, description: profile.description.slice(0, MAX_PROFILE) }
        db.active[sender] = id; db.history[sender] = []
        write(db)
        return reply(`${B('KARAKTER BERHASIL DIIMPOR')}
${LINE}
Nama: *${profile.title}*
Deskripsi: ${profile.description}
${profile.image ? `Gambar: ${profile.image}\n` : ''}Sumber: ${profile.url}

Karakter ini sekarang aktif untuk chat kamu.
Gunakan satu command: ${prefix}cai ${profile.title} halo
Ganti karakter: ${prefix}cai import <URL lain>

_Import menyimpan metadata publik saja; ini bukan impor chat atau model internal Character.AI._`)
      } catch (e) { return reply(`Impor gagal: ${clean(e.message, 220)}`) }
    }
    if (['chat', 'ngobrol'].includes(sub)) {
      if (!arg) return reply(`Contoh: ${prefix}cai chat Hai, siapa namamu?`)
      const id = db.active[sender], profile = db.profiles[id]
      if (!profile) return reply(`Belum ada karakter aktif.\n1. ${prefix}cai search <nama>\n2. ${prefix}cai import <URL profil publik>`)
      if (arg.length > 1800) return reply('Pesan terlalu panjang (maksimal 1800 karakter).')
      const hist = Array.isArray(db.history[sender]) ? db.history[sender].slice(-MAX_HISTORY) : []
      const context = hist.map(t => `${t.role === 'assistant' ? profile.title : 'Pengguna'}: ${t.content}`).join('\n')
      const sys = `Kamu memainkan persona karakter fiksi berdasarkan metadata publik berikut. Ini adalah simulasi roleplay mandiri, bukan model resmi Character.AI.\nNama: ${profile.title}\nDeskripsi publik: ${profile.description}\nSumber profil: ${profile.url}\nIkuti gaya dan latar karakter secara kreatif tanpa mengklaim sebagai layanan resmi. Jangan mengarang detail profil sebagai fakta. Jawab natural, bahasa Indonesia kecuali pengguna memakai bahasa lain. Format WhatsApp, maksimal sekitar 1200 karakter.`
      const prompt = `${context ? `Riwayat percakapan terakhir:\n${context}\n\n` : ''}Pesan pengguna: ${arg}`
      try {
        await sock?.sendPresenceUpdate?.('composing', m.chat).catch(() => {})
        const result = await ai.ask({ uid: `cai:${sender}`, text: prompt, sys, memory: false, noPersona: true })
        const answer = String(result.text || '').slice(0, 4500)
        db.history[sender] = [...hist, { role: 'user', content: arg.slice(0, 1000) }, { role: 'assistant', content: answer.slice(0, 1200) }].slice(-MAX_HISTORY * 2)
        write(db)
        return reply(`*${profile.title}*\n\n${answer}\n\n_${prefix}cai reset untuk menghapus sesi_`)
      } catch (e) { return reply(`Chat AI gagal. Periksa konfigurasi API AI bot.\n${clean(e.message, 180)}`) }
    }
    if (['reset', 'ganti'].includes(sub)) {
      delete db.active[sender]; delete db.history[sender]; write(db)
      return reply('Sesi karakter kamu sudah direset. Profil tersimpan tetap ada; impor karakter lain untuk mengganti.')
    }
    return reply(`Perintah tidak dikenal. Ketik ${prefix}cai info untuk melihat panduan.`)
  }
}
