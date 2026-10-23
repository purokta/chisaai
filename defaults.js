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
  menu: { style: 'teks', thumbnail: true, music: true, city: 'Jakarta', timezone: 'Asia/Jakarta', tzLabel: 'WIB' },

  weather: {},
  prayer: { city: 'Jakarta', country: 'Indonesia' },

  search: { results: 5 },
  enhance: { maxSide: 2048 },

  // Isi link zip kalau mau #update lewat WhatsApp (mis. link unduh zip repo GitHub kamu)
  update: { url: '' },

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
