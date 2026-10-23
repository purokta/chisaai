// ============================================================
//  PENGATURAN KAMU
//  File ini disalin otomatis jadi settings.js saat bot pertama jalan.
//  settings.js TIDAK akan tertimpa saat update. Edit settings.js (bukan file ini),
//  lalu restart bot (Ctrl+C, npm start).
// ============================================================
module.exports = {
  owner: {
    name: 'shipur',
    number: '085746960982', // boleh format 08xx atau 628xx
    about: 'Pembuat & pemilik CHISA-AI',
    tiktok: 'dzzhipur' // ditampilkan di profil owner (nomor owner disembunyikan)
  },

  // VIP: tetap dilayani saat mode SELF (#self / #private). Bisa juga ditambah lewat chat: #vip add 08xxx
  vip: [{ name: 'VIP 1', number: '+62 857-3030-1386' }],

  // Kalau owner/VIP tidak dikenali di grup: ketik #myid, lalu tempel angka LID-nya di sini
  ownerLids: [],

  sticker: { pack: 'shipur-chisaai', author: 'CHISA-AI' }

  // ---- Opsional: API key gratis supaya AI lebih stabil ----
  // ai: {
  //   pollinationsKey: 'KEY_DARI_enter.pollinations.ai',
  //   openai: { baseUrl: 'https://api.groq.com/openai/v1', apiKey: 'KEY', model: 'llama-3.1-8b-instant' }
  // },

  // ---- Opsional: link zip untuk perintah #update lewat WhatsApp ----
  // update: { url: 'https://github.com/USERNAME/REPO/archive/refs/heads/main.zip' },

  // ---- Opsional: menu (thumbnail & musik ada di folder assets/custom/) ----
  // menu: { thumbnail: true, music: true, city: 'Bandung' }, // city = kota untuk cuaca di menu
  // prayer: { city: 'Bandung', country: 'Indonesia' }, // kota bawaan #sholat
}
