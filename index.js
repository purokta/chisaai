require('./lib/quiet')
require('./lib/node18-compat').install()
const pino = require('pino')
const readline = require('readline')
const config = require('./config')
const loader = require('./lib/loader')
const plug = require('./lib/chisaplug')
const handler = require('./lib/handler')
const { loadBaileys } = require('./lib/baileys')
const { cleanTmp } = require('./lib/ffmpeg')
const reminders = require('./lib/reminders')
try { require('./lib/ytbanner').start() } catch (e) { console.log('[ytbanner]', e?.message || e) }
const db = require('./lib/db')
const status = require('./lib/status')
const assets = require('./lib/assets')
const group = require('./lib/group')
const backup = require('./lib/backup')
const polls = require('./lib/polls')
const { log, banner } = require('./lib/log')
const telegram = require('./lib/telegram')
const dashboard = require('./lib/dashboard')
if (!require('./lib/lock').acquire()) process.exit(0)

const ask = q =>
  new Promise(res => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    rl.question(q, a => {
      rl.close()
      res(a)
    })
  })

let pairNumber = process.env.CHISA_PAIR_NUMBER ? require('./config').normalizeNumber(process.env.CHISA_PAIR_NUMBER) : null // versi APK: nomor dari aplikasi
const sentIds = new Set()

// Simpan pesan terakhir supaya WhatsApp bisa minta kirim ulang (mencegah "Waiting for this message")
const store = new Map()
const remember = (key, message) => {
  if (!key?.id || !message) return
  store.set(key.id, message)
  if (store.size > 800) store.delete(store.keys().next().value)
}
const retryCache = new Map()
const retryCounter = {
  get: k => retryCache.get(k),
  set: (k, v) => retryCache.set(k, v),
  del: k => retryCache.delete(k),
  flushAll: () => retryCache.clear()
}

async function start() {
  const B = await loadBaileys()
  const { state, saveCreds } = await B.useMultiFileAuthState('session')
  const { version } = await B.fetchLatestBaileysVersion().catch(() => ({}))

  const sock = B.makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    auth: state,
    printQRInTerminal: false,
    // PENTING: nama platform harus salah satu yang dikenal WhatsApp (Ubuntu/Windows/macOS). Nama kustom membuat pairing code ditolak ("Couldn't link device").
    browser: ['Ubuntu', 'Chrome', '20.0.04'],
    markOnlineOnConnect: false,
    syncFullHistory: false,
    generateHighQualityLinkPreview: false,
    shouldSyncHistoryMessage: () => false,
    msgRetryCounterCache: retryCounter,
    getMessage: async key => store.get(key?.id),
    // metadata grup dari cache sendiri: balasan di grup tidak menunggu WhatsApp tiap pesan
    cachedGroupMetadata: async jid => group.forBaileys(sock, jid)
  })
  sock.ev.on('groups.update', us => { for (const u of us || []) if (u?.id) group.invalidate(u.id) })

  // dipakai pengirim yang melewati sendMessage (mis. memakai ulang media banner)
  sock.trackSent = (key, message) => {
    remember(key, message)
    if (key?.id) {
      sentIds.add(key.id)
      setTimeout(() => sentIds.delete(key.id), 5 * 60 * 1000)
    }
  }

  // catat ID pesan yang dikirim bot supaya tidak dibalas lagi
  const rawSend = sock.sendMessage.bind(sock)
  sock.sendMessage = async (...args) => {
    const res = await rawSend(...args)
    remember(res?.key, res?.message)
    const id = res?.key?.id
    if (id) {
      sentIds.add(id)
      setTimeout(() => sentIds.delete(id), 5 * 60 * 1000)
    }
    return res
  }

  // ---- login pakai nomor (pairing code), tanpa QR ----
  if (!sock.authState.creds.registered) {
    if (!pairNumber) {
      pairNumber = config.normalizeNumber(await ask('Nomor WA bot (contoh 628123456789): '))
    }
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(pairNumber)
        console.log('\nKODE PAIRING:', code?.match(/.{1,4}/g)?.join('-'), '\n')
        console.log('WhatsApp > Perangkat tertaut > Tautkan perangkat > Tautkan dengan nomor telepon')
      } catch (e) {
        console.log('Gagal minta kode pairing:', e.message)
      }
    }, 3000)
  }

  sock.ev.on('creds.update', saveCreds)
  welcomeHandler(sock)

  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'open') {
      log.ok(`${config.botName} v${require('./package.json').version} terhubung • ${loader.list().length} perintah`)
      dashboard.set('wa', 'on')
      dashboard.start()
      reminders.attach(sock)
      warmUp()
      backup.startAuto()
    }
    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode
      if (code === B.DisconnectReason.loggedOut) {
        dashboard.set('wa', 'down')
        log.err('Logout. Hapus folder "session" lalu jalankan ulang.')
      } else {
        dashboard.set('wa', 'down')
        log.warn('Koneksi terputus, menyambung ulang...')
        setTimeout(start, 3000)
      }
    }
  })

  const download = async (node, type) => {
    const stream = await B.downloadContentFromMessage(node, type)
    const chunks = []
    for await (const c of stream) chunks.push(c)
    return Buffer.concat(chunks)
  }

  const env = { download, sentIds, reload: () => loader.load() }

  // pilihan polling (menu) -> dijalankan sebagai perintah oleh pemilihnya
  sock.ev.on('messages.update', updates => {
    polls
      .onUpdates(updates, {
        aggregate: B.getAggregateVotesInPollMessage,
        getMessage: async key => store.get(key.id),
        run: ({ chat, voter, command }) => {
          const isGroup = chat.endsWith('@g.us')
          const m = {
            key: { remoteJid: chat, fromMe: false, id: 'POLL' + Date.now() + Math.random().toString(36).slice(2, 6), ...(isGroup ? { participant: voter } : {}) },
            message: { conversation: command },
            messageTimestamp: Math.floor(Date.now() / 1000),
            pushName: ''
          }
          return handler.handle(sock, m, env)
        }
      })
      .catch(e => console.log('[poll] error:', e?.message || e))
  })

  sock.ev.on('messages.upsert', ({ messages, type }) => {
    if (type !== 'notify') return
    for (const m of messages) {
      remember(m.key, m.message)
      handler.handle(sock, m, env).catch(e => console.log('[handler] error:', e?.message || e))
    }
  })
}

// Siapkan di belakang layar supaya #menu langsung cepat: cuaca, thumbnail, voice note
let warmTimer = null
function warmUp() {
  const go = async () => {
    try { await status.weather() } catch {}
    try { const t = assets.thumbnail(); if (t) await assets.thumbJpeg(t) } catch {}
    try { const m = assets.music(); if (m) await assets.voiceNote(m) } catch {}
  }
  go()
  if (!warmTimer) warmTimer = setInterval(() => status.weather().catch(() => {}), 10 * 60 * 1000)
}

// welcome / pamit di grup (hidupkan dengan #welcome on)
function welcomeHandler(sock) {
  sock.ev.on('group-participants.update', async ev => {
    group.invalidate(ev.id)
    try {
      if (!db.get('welcome', {})[ev.id] || !['add', 'remove'].includes(ev.action)) return
      const ids = (ev.participants || []).map(p => (typeof p === 'string' ? p : p.id || p.phoneNumber)).filter(Boolean)
      if (!ids.length) return
      const md = await sock.groupMetadata(ev.id).catch(() => null)
      const tag = ids.map(i => '@' + i.split('@')[0].split(':')[0]).join(' ')
      const text =
        ev.action === 'add'
          ? `👋 Selamat datang ${tag} di *${md?.subject || 'grup'}*!\nBaca deskripsi grup ya.`
          : `👋 Sampai jumpa ${tag}.`
      await sock.sendMessage(ev.id, { text, mentions: ids })
    } catch (e) {
      console.log('[welcome] gagal:', e?.message || e)
    }
  })
}

process.on('uncaughtException', e => console.log('[uncaught]', e?.message || e))
process.on('unhandledRejection', e => console.log('[unhandled]', e?.message || e))

banner(require('./package.json').version)
log.info(`${loader.load()} perintah dimuat`)
{
  setImmediate(() => {
    try {
      const s = plug.boot()
      log.info(`Fitur tambahan siap: ${s.byName.size} perintah / ${s.plugins.length} plugin${s.failed.length ? ` (${s.failed.length} gagal)` : ''}`)
    } catch (e) { log.err('Fitur tambahan gagal dimuat: ' + (e?.message || e)) }
  })
}
cleanTmp()
if (config.whatsapp?.enabled !== false) start()
else log.info('WhatsApp dimatikan (whatsapp.enabled = false)')

// Telegram berjalan bersamaan dengan WhatsApp kalau token diisi di settings.js
telegram
  .start({ handler, env: { sentIds, reload: () => loader.load() } })
  .then(t => {
    if (!t) return
    dashboard.set('tg', 'on')
    if (config.whatsapp?.enabled === false) dashboard.start()
    reminders.attach(t.sock)
    warmUp()
    backup.startAuto()
  })
  .catch(e => log.err('Telegram: ' + (e?.message || e)))
