// Konfigurasi runtime untuk fitur tambahan (diadaptasi dari paket Chisa), dengan identitas CHISA AI.
// Nilai identitas diambil dari config Chisa (settings.js) — jangan diisi manual di sini.
const path = require('path')
const cfg = require('../config')

const num = v => String(v || '').replace(/\D/g, '')
const bot = cfg.botName || 'CHISA-AI'

// nama lama folder/kunci pengaturan (hanya untuk memindahkan data & pengaturan pengguna lama)
const OLD = ['di', 'ony'].join('')

global.namaown = cfg.owner?.name || 'shipur'
global.owner = [num(cfg.owner?.number)].filter(Boolean)
global.dev = num(cfg.owner?.number)
global.sessionName = 'session'
global.prefixList = cfg.prefixes
global.noPrefixDeny = ['kick', 'remove', 'add', 'promote', 'demote', 'ban', 'unban', 'broadcast', 'public', 'self', 'restore']
global.codeNative = false
global.agentMode = 'card'
global.aiMaxTokens = 4096
global.aiMaxTokensCode = 8192
global.aiMaxChars = 24000
global.suggestUnknown = false
global.botname = bot

global.settingsDefault = {
  imgprovider: 'auto', figprovider: 'auto',
  botname: bot, version: require('../package.json').version, footer: 'Kuchiba Chisa By Shipur', language: 'id',
  timezone: cfg.menu?.timezone || 'Asia/Jakarta',
  mode: 'public', maintenance: false, onlygroup: false, onlyprivate: false, noprefix: true,
  limitfree: 0, limitprem: 0, cooldown: 0,
  autoread: false, autotyping: false, autorecording: false, alwaysonline: false, autoreadsw: false, autobio: false, anticall: false,
  welcome: false, goodbye: false, adminnotif: false, wajibdaftar: false, antilink: false, antitoxic: false,
  antidelete: 'off', antiviewonce: 'off',
  menustyle: 'text', menuuptime: true, menuaudio: false, itsmecard: false, menusingle: true, menuinfo: true,
  menucity: cfg.menu?.city || 'Jakarta', menucarousel: 'off',
  aiprovider: 'auto', aipersona: 'ramah', aimemory: true,
  gaya: 'emoji', quotebiz: false,
  packname: cfg.sticker?.packName || 'shipur-chisaai', author: cfg.sticker?.author || '@sipurse',
}
global.mess = {
  wait: '⏳ Tunggu sebentar...', success: '✅ Berhasil!', error: '❌ Terjadi kesalahan.', owner: '*Khusus owner!*',
  premium: '*Fitur ini khusus user premium.*', group: '*Perintah ini hanya bisa dipakai di grup.*',
  private: '*Perintah ini hanya bisa dipakai di chat pribadi.*', admin: '*Perintah ini khusus admin grup.*',
  botAdmin: '*Jadikan bot admin dulu.*', maintenance: '🛠️ Bot sedang maintenance.', limitHabis: '🚫 Limit habis.',
  cooldown: '⏱️ Tunggu %s detik lagi.', banned: '🚫 Kamu diblokir dari bot ini.',
  onlyGroup: 'Hanya aktif di grup.', onlyPrivate: 'Hanya aktif di chat pribadi.',
}
global.welcomeText = 'Halo @user 👋\nSelamat datang di *@group*!\nMember ke-@count.'
global.goodbyeText = 'Sampai jumpa @user 👋'
global.promoteText = '🎖️ Selamat @user, kamu sekarang *admin* di *@group*!'
global.demoteText = '📉 @user tidak lagi menjadi admin di *@group*.'
global.toxicWords = ['anjing', 'babi', 'bangsat', 'kontol', 'memek', 'goblok', 'tolol']
global.bioText = `${bot} • aktif @uptime`
global.links = { website: cfg.github?.repoUrl || '', group: '', channel: '', saweria: '', telegram: '' }
global.ownerInfo = { brand: bot, name: global.namaown, number: '', display: '', dana: '' }
global.tqto = ['Kuchiba Chisa By Shipur', 'Fitur tambahan: diadaptasi dari paket CHISA']
global.aiModels = { groq: 'llama-3.3-70b-versatile', groqFast: 'llama-3.1-8b-instant', gemini: ['gemini-2.0-flash'], kimi: '' }
global.fishModel = ''
global.botDesc = { intro: `${bot} — Kuchiba Chisa By Shipur.`, points: [] }
// API key opsional (fitur tertentu butuh). Isi lewat settings.js -> chisa.apikey
global.apikey = Object.assign({
  gemini: '', google: '', groq: '', kimi: '', lolhuman: '', neoxr: '', fgsi: '', betabotz: '', covenant: '', onlym: '',
  obscura: '', firefly: '', kyyz: '', cuki: '', fishaudio: '', openai: '', lainnya: '', vercel: '',
}, cfg[OLD]?.apikey || {}, cfg.chisa?.apikey || {})
global.imgApi = { firefly: { url: '' }, kyyz: { url: '' } }
global.panel = { plans: {}, store: { terms: [] } }
global.shield = { enabled: false }
global.chisaRoot = __dirname

// folder data fitur tambahan: ikut folder data/ milik Chisa (aman saat update, ikut backup)
const fs = require('fs')
global.chisaData = path.join(__dirname, '..', 'data', 'chisa')
try { // pindahkan data lama (versi sebelum 3.3.0) supaya tidak hilang
  const oldDir = path.join(__dirname, '..', 'data', OLD)
  if (fs.existsSync(oldDir) && !fs.existsSync(global.chisaData)) fs.renameSync(oldDir, global.chisaData)
} catch {}
try { fs.mkdirSync(global.chisaData, { recursive: true }) } catch {}
