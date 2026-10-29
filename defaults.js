// ============================================================
//  NILAI BAWAAN CHISA-AI (ikut diperbarui saat update)
//  JANGAN edit file ini. Ubah pengaturanmu di settings.js
// ============================================================
module.exports = {
  botName: 'CHISA-AI',

  owner: { name: 'owner', number: '', about: '', tiktok: '' },
  ownerLids: [],

  // Orang yang tetap dilayani saat mode SELF (selain owner). Isi lewat settings.js atau #vip add
  vip: [],
  vipLabel: 'VIP',
  modeLabels: { public: 'PUBLIC', private: 'SELF' },

  prefixes: ['!', '?', '/', '#', '$', '.'],
  displayPrefix: '.', // prefix yang ditampilkan di menu saat perintah diketik tanpa prefix (mis. "menu")

  sticker: { pack: 'shipur-chisaai', author: 'CHISA-AI' },

  autoReply: {
    enabled: true,
    groupNeedsMention: true, // di grup: hanya balas jika bot di-tag / di-reply / dipanggil "chisa ..."
    wakeWord: 'chisa',
    cooldownMs: 3000,
    maxHistory: 8
  },

  ai: {
    persona:
      'Kamu adalah CHISA-AI, asisten WhatsApp yang ramah, santai, dan pintar, dibuat oleh shipur. ' +
      'Balas dengan bahasa yang sama dengan pengguna (utamanya Bahasa Indonesia), singkat, jelas, dan natural seperti ngobrol di chat. ' +
      'Pakai emoji secukupnya. Jawab panjang hanya jika diminta.',
    pollinationsKey: process.env.POLLINATIONS_KEY || '',
    openai: {
      baseUrl: process.env.AI_BASE_URL || '',
      apiKey: process.env.AI_API_KEY || '',
      model: process.env.AI_MODEL || ''
    }
  },

  // Thumbnail & musik menu: ganti file di folder assets/ (lihat assets/README.txt)
  menu: { style: 'teks', tagline: 'Kuchiba Chisa By Shipur', thumbnail: true, banner: true, music: true, city: 'Jakarta', timezone: 'Asia/Jakarta', tzLabel: 'WIB' },

  weather: {},
  prayer: { city: 'Jakarta', country: 'Indonesia' },

  // batas pemakaian per orang per hari (owner & VIP bebas), jeda minimal antar perintah
  limit: { daily: 100, cooldownMs: 1200 },

  // inventory buah & EXP game
  rpg: { gameExp: 20, dropChance: 0.6, petikCooldownMin: 30, gacha: { cost: 200, maxPaid: 5, pitySSR: 50, pitySR: 10 } },

  // cadangan otomatis folder session (disimpan lokal di Download/chisa-backup)
  backup: { auto: true, everyHours: 24, keep: 5 },

  search: { results: 5 },
  enhance: { maxSide: 2048 },

  // Isi link zip kalau mau #update lewat WhatsApp (mis. link unduh zip repo GitHub kamu)
  update: { url: 'https://github.com/purokta/chisaai/archive/refs/heads/main.zip' }, // repo GitHub bot ini (username purokta, repo chisaai)

  // WhatsApp bisa dimatikan kalau kamu hanya mau Telegram
  whatsapp: { enabled: true },

  // Bot Telegram (token dari @BotFather). ownerIds/vipIds = ID angka Telegram (kirim /myid ke bot untuk tahu ID-mu)
  dashboard: true, // tampilan ala server di Termux setelah bot terhubung (false = log biasa)
  telegram: { token: '', ownerIds: [], vipIds: [], apiBase: 'https://api.telegram.org', autoDelete: true, menuDeleteSec: 3600, pressDeleteSec: 3600 },
  chisa: { apikey: {} }, // fitur tambahan: API key opsional (gemini, groq, dll)

  // Untuk #deploy (push kode ke GitHub). Isi token di settings.js, JANGAN di sini.
  github: { user: 'purokta', repo: 'chisaai', branch: 'main', token: '' },

  downloader: {
    maxMB: 60,
    timeoutMs: 25000,
    ytdlp: 'yt-dlp',
    providers: {
      instagram: ['https://api.siputzx.my.id/api/d/igdl?url={url}'],
      facebook: ['https://api.siputzx.my.id/api/d/fbdl?url={url}'],
      youtube: ['https://api.siputzx.my.id/api/d/ytmp4?url={url}'],
      youtubeAudio: ['https://api.siputzx.my.id/api/d/ytmp3?url={url}']
    }
  }
}
