/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// CHISA MENU REGISTRY — satu-satunya sumber kategori, nama tampilan, penempatan fitur, dan permission untuk SEMUA tampilan menu.
//
//   .menu / .menu <kategori>   → lib/menuui.js  → registry.js
//   .allmenu / .allmenu detail → plugins/main/cmdlist.js + lib/catalog.js → registry.js
//   .diag menu / npm run check:menu → registry.audit()
//
// Prinsip:
//   • Daftar command TIDAK ditulis ulang di sini. Command diambil dari plugin yang benar-benar termuat (lib/pluginloader.js)
//     dan perintah bawaan Chisa.js; registry hanya menentukan kategori, sub-bagian, dan nama tampilan.
//   • Nama tampilan (title) tidak mengubah command teknis. Command & alias lama tetap berjalan persis seperti sebelumnya.
//   • Permission (owner / dev / premium / admin) dibaca dari flag plugin, lalu boleh ditimpa di sini bila pengecekannya ada di dalam plugin.
//   • Plugin baru yang belum dipetakan tetap muncul (kategori mengikuti folder, lihat FOLDER_DEFAULT) dan dilaporkan oleh audit().
const pl = require('./pluginloader')

// ───────────────────────── KATEGORI ─────────────────────────
// owner:true → disembunyikan dari pengguna biasa. aliases = nama lama / sebutan lain yang diterima oleh `.menu <nama>`.
const CATEGORIES = [
  { id: 'general',      title: 'GENERAL',                  summary: 'Navigasi, profil, limit, tautan resmi, dan perintah umum',
    aliases: ['dasar', 'umum', 'main', 'info', 'bantuan', 'help', 'akun', 'livemenu'] },
  { id: 'ai',           title: 'AI & INTELLIGENCE',        summary: 'Asisten AI, penulisan, penglihatan, suara, dan karakter AI',
    aliases: ['intelligence', 'kimi', 'fish', 'fishai', 'ocr', 'imagine', 'stt', 'npc', 'karakter', 'persona', 'kecerdasan'] },
  { id: 'media',        title: 'MEDIA & CREATIVE',         summary: 'Stiker, desain gambar, efek foto dan suara, musik, dan studio kreatif',
    aliases: ['creative', 'sticker', 'stiker', 'brat', 'kreasi', 'gambar', 'desain', 'foto', 'musik', 'music', 'efek'] },
  { id: 'download',     title: 'DOWNLOAD & SEARCH',        summary: 'Unduh media, cari lagu / video / gambar, referensi web, anime',
    aliases: ['dl', 'unduh', 'downloader', 'search', 'cari', 'pencarian', 'anime', 'manga', 'wiki', 'play'] },
  { id: 'group',        title: 'GROUP MANAGEMENT',         summary: 'Anggota, moderasi, pengumuman, pengaturan grup, dan saluran WhatsApp',
    aliases: ['grup', 'gc', 'admin', 'moderasi', 'saluran', 'channel', 'ch', 'penjaga', 'guard'] },
  { id: 'daily',        title: 'DAILY INFO',               summary: 'Kalender, salat, cuaca, gempa, kurs, kripto, berita, dan Al-Quran',
    aliases: ['dunia', 'harian', 'sehari', 'hari', 'daily', 'cuaca', 'salat', 'kalender', 'religi', 'faith'] },
  { id: 'productivity', title: 'PRODUCTIVITY & AUTOMATION', summary: 'Pengingat, jadwal, kapsul waktu, tugas, habit, catatan, dan keuangan pribadi',
    aliases: ['automation', 'otomatis', 'otomasi', 'planner', 'ekstra', 'praktis', 'produktivitas', 'reminder', 'pengingat', 'baru', 'bonus', 'keuangan'] },
  { id: 'tools',        title: 'TOOLS & UTILITIES',        summary: 'Kalkulator, konversi, teks, QR, PDF, jaringan, dan alat bantu web',
    aliases: ['tool', 'alat', 'utilitas', 'utility', 'utilities', 'konversi', 'kalkulator', 'pdf', 'qr'] },
  { id: 'games',        title: 'GAMES & ENTERTAINMENT',    summary: 'Game cepat, kartu live arcade, hiburan sosial, dan fitur ajaib',
    aliases: ['game', 'fun', 'hiburan', 'cek', 'live', 'kartu', 'arcade', 'ajaib', 'magis', 'sihir', 'mustahil', 'seru'] },
  { id: 'rpg',          title: 'RPG ISEKAI',               summary: 'Karakter, petualangan, ekonomi, party, clan, dan kota guild',
    aliases: ['guild', 'kota', 'isekai', 'town', 'clan', 'petualangan'] },
  { id: 'hosting',      title: 'PANEL & HOSTING',          summary: 'Jualan panel Pterodactyl: paket, akun pembeli, admin panel, dan peran reseller',
    aliases: ['chisapanel', 'jualpanel', 'panelstore', 'pterodactyl', 'cpanel', 'reseller', 'server', 'dpanel'] },
  { id: 'system',       title: 'SYSTEM & DEVELOPER',       summary: 'Diagnostik runtime, pemeriksaan plugin, backup, keamanan, dan alat developer',
    aliases: ['sys', 'diag', 'developer', 'dev-tools', 'devtools', 'diagnostik', 'backup', 'shield'] },
  { id: 'owner',        title: 'OWNER & ADMIN',            summary: 'Pengaturan bot, akses, siaran, analitik, dan panel Dev (khusus pemilik)', owner: true,
    aliases: ['owner', 'pemilik', 'setting', 'pengaturan', 'panel', 'report', 'intel', 'analitik', 'devpanel', 'dev'] },
]

// folder plugin → kategori bila plugin BELUM dipetakan di FEATURES (jaring pengaman; audit() tetap melaporkannya)
const FOLDER_DEFAULT = { main: 'general', ai: 'ai', npc: 'ai', sticker: 'media', kreasi: 'media', unduh: 'download', anime: 'download', group: 'group', saluran: 'group', dunia: 'daily', ekstra: 'productivity', praktis: 'tools', tools: 'tools', fun: 'games', live: 'games', ajaib: 'games', rpg: 'rpg', system: 'system', owner: 'owner', panel: 'hosting' }

// ───────────────────────── PERINTAH BAWAAN (case di Chisa.js, bukan plugin) ─────────────────────────
const BUILTINS = [
  { name: 'menu',     alias: ['help'],                 cmds: ['menu'],     desc: 'Menu utama: profil, status, dan daftar kategori', builtin: true },
  { name: 'sc',       alias: ['script', 'getsc'],      cmds: ['sc'],       desc: 'Info script dan website', builtin: true },
  { name: 'public',   alias: [],                       cmds: ['public'],   desc: 'Mode publik: semua orang boleh memakai bot', builtin: true, owner: true },
  { name: 'self',     alias: [],                       cmds: ['self'],     desc: 'Mode self: hanya owner yang dilayani', builtin: true, owner: true },
  { name: 'addowner', alias: ['addown'],               cmds: ['addowner'], desc: 'Tambah owner', builtin: true, owner: true },
  { name: 'delowner', alias: ['delown'],               cmds: ['delowner'], desc: 'Hapus owner', builtin: true, owner: true },
]

// ───────────────────────── FITUR: kategori, sub-bagian, nama tampilan ─────────────────────────
// f(kategori, sub, judul, 'plugin1 plugin2', { only:[cmd], except:[cmd], perm, show:[cmd], rows:[[cmd, judul, perm?]], collapsed, desc })
//   only/except : pecah satu plugin ke beberapa fitur per command · perm: 'owner'|'dev'|'premium'|'admin' (menimpa flag plugin)
//   show        : daftar command yang ditampilkan (default: semua command plugin) · collapsed: varian lain sengaja tidak ditampilkan
//   rows        : satu baris per command dengan judul sendiri (dipakai .diag)
const FEATURES = []
const f = (cat, sub, title, plugins, o = {}) => FEATURES.push({ cat, sub, title, plugins: String(plugins).trim().split(/\s+/), ...o })

// ── GENERAL ──
f('general', 'Navigation', 'Main Menu', 'menu')
f('general', 'Navigation', 'Command Explorer', 'allmenu', { show: ['allmenu', 'allmenu detail'] })
f('general', 'Navigation', 'Live Card Index', 'livemenu')
f('general', 'Navigation', 'Chisa AI Dashboard', 'chisa', { desc: 'Satu command utama (.chisa) untuk semua fitur baru: Protocol Lab, DMSG, Event Monitor, dll.' })
f('general', 'Account', 'User Profile', 'profile')
f('general', 'Account', 'Daily Limit', 'limit', { only: ['limit'] })
f('general', 'Account', 'Registration', 'daftar')
f('general', 'Account', 'AFK Status', 'afk')
f('general', 'Account', 'Reputation', 'rep')
f('general', 'Utility', 'View-Once Opener', 'rvo')
f('general', 'Information', 'Latency Check', 'ping')
f('general', 'Information', 'Carousel Cards', 'carousel')
f('general', 'Information', 'Round Video (Itsme)', 'itsme', { desc: 'Kirim video bulat (video note) dari assets/itsme/' })
f('general', 'Information', 'Owner Contact', 'owner')
f('general', 'Information', 'Official Links', 'link')
f('general', 'Information', 'Source & Website', 'sc')
f('general', 'Information', 'Credits', 'tqto')

// ── AI & INTELLIGENCE ──
f('ai', 'Assistants', 'AI Assistant', 'ai', { only: ['ai', 'aiclear'] })
f('ai', 'Assistants', 'AI Agent (animasi alur)', 'agent')
f('ai', 'Assistants', 'Language Translator', 'ai', { only: ['translate'] })
f('ai', 'Assistants', 'Text Summarizer', 'ai', { only: ['ringkas'] })
f('ai', 'Assistants', 'Kimi Coding Assistant', 'kimi')
f('ai', 'Assistants', 'Duck.ai (browser)', 'duckai')
f('ai', 'Assistants', 'Dion (Yandere AI, tanpa prefix)', 'dion', { perm: 'owner', desc: 'Gadis yandere asisten AI pribadi. Khusus owner, hanya TANPA prefix: ketik "dion <pesan>".' })
f('ai', 'Writing & Language', 'Writing Toolkit', 'parafrase')
f('ai', 'Writing & Language', 'Creative Writer', 'cerita')
f('ai', 'Vision & Audio', 'Vision & OCR', 'ocr')
f('ai', 'Vision & Audio', 'Speech to Text', 'stt')
f('ai', 'Vision & Audio', 'AI Image Generator', 'imagine')
f('ai', 'Vision & Audio', 'Fish AI Voice Studio', 'fishai')
f('ai', 'Characters', 'AI Personas', 'npc', { extra: ['aiko', 'mira', 'kuro', 'hana', 'sakura', 'takeshi', 'luna', 'rex', 'bangdev', 'kakek', 'hikari', 'narator', 'tomo', 'joko', 'rina', 'duit', 'chrona', 'bilal', 'kumo', 'alma', 'gorun', 'mimi', 'elaine', 'rin', 'zora', 'jack', 'noa'] })
f('ai', 'Characters', 'Character.AI Public Import & Chat', 'cai')

// ── MEDIA & CREATIVE ──
f('media', 'Sticker Studio', 'Sticker Studio', 's swm smeme ttp qc outline', { show: ['s', 'wm', 'smeme', 'ttp', 'attp', 'qc', 'outline'], collapsed: true })
f('media', 'Sticker Studio', 'Brat Generator', 'brat bratimg bratgreen bratwhite brathd bratvid bratvid2 bratwarna bratanime bratcewek bratgojo bratgojovid bratvermeil bratvermeilvid bratbahlil bratpatrick bratsquidward', { extra: ['bratbiru', 'bratungu', 'bratmerah', 'bratkuning', 'bratoren', 'bratmint', 'bratcoklat', 'bratkrem'] })
f('media', 'Image & Design', 'Photo Editor', 'foto')
f('media', 'Social Edit Studio', 'Photo Social Edit (fitpost, filter, teks meme, bingkai, puzzle feed, thumbnail, kartu kutipan)', 'studioedit', { only: ['fitpost', 'filter', 'teksfoto', 'bingkai', 'puzzle', 'thumbnail', 'quotepost'] })
f('media', 'Social Edit Studio', 'Video Social Edit (potong, kecepatan, mundur, bisu, ulang, rasio story, ambil frame)', 'studioedit', { only: ['potongvideo', 'kecepatan', 'mundur', 'bisu', 'loopvid', 'fitvid', 'framevideo'] })
f('media', 'CapCut & Alight Motion Studio', 'Template Edit CapCut (vlog, glitch, zoompulse, retrotape, cinematic, dreamy, shake, flash, mirror, noir, velocity)', 'capcutam', { only: ['capcut'] })
f('media', 'CapCut & Alight Motion Studio', 'Preset Alight Motion + resep manual (shake, rgb, swing, echo, bounce, pixel, invert, blur, fisheye, flicker)', 'capcutam', { only: ['presetam'] })
f('media', 'CapCut & Alight Motion Studio', 'Color Correction foto & video (pink, teal, vintage, bright, moody, golden, cool, pastel, drama, matcha) + Teks Animasi Video', 'capcutam', { only: ['ccam', 'teksvid'] })
f('media', 'Image & Design', 'Code & Quote Cards', 'carbon')
f('media', 'Image & Design', 'iPhone Quote', 'iqc')
f('media', 'Image & Design', 'AI Figurine', 'tofigure')
f('media', 'Image & Design', 'AI Anime, Chibi & Edit (Gemini)', 'toanime')
f('media', 'Image & Design', 'Logo Maker', 'logo')
f('media', 'Image & Design', 'Handwriting Generator', 'tulis')
f('media', 'Image & Design', 'Greeting Cards', 'ucapan')
f('media', 'Image & Design', 'Business Card', 'kartunama')
f('media', 'Image & Design', 'Wallpaper Generator', 'wallpaper')
f('media', 'Image & Design', 'Name Generator', 'namagen')
f('media', 'Effects & Audio', 'Photo Effects', 'efek', { show: ['efek', 'sketsa', 'pixel', 'glitch', 'neon', 'kartun', 'lukisan', 'noir', 'vintage', 'negatif', 'cermin', 'ascii'] })
f('media', 'Effects & Audio', 'Generative Art', 'seni')
f('media', 'Effects & Audio', 'Voice Effects', 'suara')
f('media', 'Effects & Audio', 'Melody Player', 'nada')
f('media', 'Effects & Audio', 'Media Converter', 'toimg')
f('media', 'Effects & Audio', 'Round Video Maker', 'vnote')
f('media', 'Music', 'Chisa AI Music', 'chisamusik dmp3')
f('media', 'Interactive Studios', 'Paint Studio', 'paintlive')
f('media', 'Interactive Studios', 'Piano Studio', 'pianolive')

// ── DOWNLOAD & SEARCH ──
f('download', 'Downloader', 'Media Downloader', 'dl')
f('download', 'Downloader', 'TikTok Downloader', 'tiktok')
f('download', 'Downloader', 'Music & Video Finder', 'play')
f('download', 'Downloader', 'Music & Video Finder (Kartu HTML)', 'play2')
f('download', 'Downloader', 'Channel Media Sender', 'playch', { perm: 'premium' })
f('download', 'Social Downloader', 'Instagram Downloader', 'igdl')
f('download', 'Social Downloader', 'Facebook Downloader', 'fbdl')
f('download', 'Social Downloader', 'X / Twitter Downloader', 'twdl')
f('download', 'Social Downloader', 'Pinterest Downloader', 'pinterestdl')
f('download', 'Social Downloader', 'Threads Downloader', 'threadsdl')
f('download', 'Social Downloader', 'Pixiv Downloader', 'pixivdl')
f('download', 'Social Downloader', 'RedNote Downloader', 'rednotedl')
f('download', 'Social Downloader', 'Douyin Downloader', 'douyindl')
f('download', 'Social Downloader', 'Bilibili Downloader', 'bilibilidl')
f('download', 'Music Downloader', 'Spotify Downloader', 'spotifydl')
f('download', 'Music Downloader', 'Apple Music Downloader', 'applemusicdl')
f('download', 'Music Downloader', 'Bandcamp Downloader', 'bandcampdl')
f('download', 'Live Search Cards', 'YouTube Live', 'ytlive')
f('download', 'Live Search Cards', 'Spotify Live', 'spotifylive')
f('download', 'Live Search Cards', 'Pinterest Live', 'pinlive')
f('download', 'Profile & Reference', 'Instagram Profile Card', 'igstalk')
f('download', 'Profile & Reference', 'Instagram Lookup', 'instalookupai')
f('download', 'Profile & Reference', 'Wikipedia & Dictionary', 'wiki')
f('download', 'Profile & Reference', 'GitHub, NPM & Country Lookup', 'webtools', { only: ['github', 'npm', 'negara'] })
f('download', 'Profile & Reference', 'Web Search (Google)', 'gsearch')
f('download', 'Profile & Reference', 'GitHub Search & Download', 'ghsearch')
f('download', 'Anime & Manga', 'Anime Database', 'anime')
f('download', 'Anime & Manga', 'Anime Explorer', 'animeplus')
f('download', 'Anime & Manga', 'Anime Images & Scene Finder', 'animeextra')
f('download', 'Anime & Manga', 'Baca Manga & Unduh Offline', 'bacamanga')
f('download', 'Anime & Manga', 'Baca Novel & Unduh Offline', 'novel')

// ── GROUP MANAGEMENT ──
f('group', 'Members', 'Member Control', 'kick')
f('group', 'Members', 'Join Requests', 'listreq')
f('group', 'Members', 'Inactive Members', 'cekinaktif')
f('group', 'Members', 'Warning System', 'warn')
f('group', 'Moderation', 'Group Guard', 'antilink')
f('group', 'Moderation', 'Anti Spam', 'antispam')
f('group', 'Messaging', 'Mention Tools', 'tagall')
f('group', 'Messaging', 'Group Notes', 'note')
f('group', 'Messaging', 'Auto Responder', 'addrespon')
f('group', 'Messaging', 'DMSG Message Manager', 'dmsg', { desc: 'Validasi target, cek izin, hapus pesan yang di-reply (revoke-for-everyone resmi WhatsApp)' })
f('group', 'Messaging', 'Group Rules', 'rules')
f('group', 'Messaging', 'Group Status', 'swgc')
f('group', 'Group Settings', 'Group Settings', 'group')
f('group', 'Group Settings', 'Disappearing Messages & Group Photo', 'ephemeral')
f('group', 'Group Settings', 'Welcome & Goodbye', 'setwelcome')
f('group', 'Group Settings', 'Auto Greeting', 'greet')
f('group', 'Group Settings', 'Open / Close Scheduler', 'jadwalbuka')
f('group', 'Engagement', 'Group Levels', 'level')
f('group', 'Engagement', 'Activity Ranking', 'topchat')
f('group', 'Engagement', 'Group Poll', 'poll')
f('group', 'Engagement', 'Birthday Board', 'ultah')
f('group', 'Engagement', 'Attendance', 'absen')
f('group', 'Engagement', 'Giveaway', 'giveaway')
f('group', 'Engagement', 'Member Randomizer', 'acakmember')
f('group', 'Engagement', 'Duty Roster', 'piket')
f('group', 'Engagement', 'Group Dues', 'iuran')
f('group', 'Engagement', 'Team Tags', 'tim')
f('group', 'Engagement', 'Meeting Minutes', 'notulen')
f('group', 'Engagement', 'Group Scoreboard', 'papan')
f('group', 'Insights', 'Group Statistics', 'grupstatistic')
f('group', 'WhatsApp Channel', 'Channel Inspector', 'idch')
f('group', 'WhatsApp Channel', 'Channel Actions', 'followch', { perm: 'premium' })
f('group', 'WhatsApp Channel', 'Channel Status', 'swch', { perm: 'premium' })

// ── DAILY INFO ──
f('daily', 'Daily Briefing', 'Daily Briefing', 'harini', { only: ['harini', 'setkota', 'setlahir'] })
f('daily', 'Calendar & Time', 'Calendar', 'tanggal')
f('daily', 'Calendar & Time', 'World Clock', 'jam')
f('daily', 'Calendar & Time', 'Date Explorer', 'mesinwaktu')
f('daily', 'Calendar & Time', 'Sky Map & Moon', 'langit')
f('daily', 'Calendar & Time', 'Hijri Calendar', 'hijri')
f('daily', 'Calendar & Time', 'Weton & Zodiac', 'weton')
f('daily', 'Weather & Alerts', 'Weather', 'cuaca')
f('daily', 'Weather & Alerts', 'Earthquake Monitor', 'gempa')
f('daily', 'Markets & News', 'Currency Rates', 'kurs')
f('daily', 'Markets & News', 'Crypto Prices', 'kripto')
f('daily', 'Markets & News', 'News Feed', 'berita')
f('daily', 'Markets & News', 'Web Scraper', 'scrapekit')
f('daily', 'Faith & Worship', 'Prayer Times', 'salat')
f('daily', 'Faith & Worship', 'Al-Quran', 'quran')
f('daily', 'Faith & Worship', 'Worship Tracker', 'ibadah')
f('daily', 'Faith & Worship', 'Digital Tasbih', 'tasbih')
f('daily', 'Faith & Worship', 'Zakat Calculator', 'zakat')

// ── PRODUCTIVITY & AUTOMATION ──
f('productivity', 'Reminders & Scheduling', 'Reminders', 'harini', { only: ['ingatkan', 'pengingat', 'hapuspengingat'] })
f('productivity', 'Reminders & Scheduling', 'Time Capsule', 'kapsul')
f('productivity', 'Reminders & Scheduling', 'Event Countdown', 'countdown')
f('productivity', 'Reminders & Scheduling', 'Weekly Schedule', 'jadwal')
f('productivity', 'Reminders & Scheduling', 'Bill Reminder', 'tagihan')
f('productivity', 'Tasks & Focus', 'To-Do List', 'todo')
f('productivity', 'Tasks & Focus', 'Notes Card', 'catatanlive')
f('productivity', 'Tasks & Focus', 'Pomodoro Timer', 'pomodoro')
f('productivity', 'Tasks & Focus', 'Focus Timer Card', 'pomolive')
f('productivity', 'Tasks & Focus', 'Stopwatch', 'stopwatch')
f('productivity', 'Tasks & Focus', 'Habit Tracker', 'habit')
f('productivity', 'Tasks & Focus', 'Mood Journal', 'mood')
f('productivity', 'Tasks & Focus', 'Private Diary', 'diary')
f('productivity', 'Tasks & Focus', 'Personal Dashboard', 'dasbor')
f('productivity', 'Tasks & Focus', 'Snippet Vault', 'simpan')
f('productivity', 'Personal Finance', 'Wallet Ledger', 'dompet')
f('productivity', 'Personal Finance', 'Debt Ledger', 'utang')
f('productivity', 'Personal Finance', 'Savings Goals', 'target')
f('productivity', 'Personal Finance', 'Shopping List', 'belanja')
f('productivity', 'Personal Finance', 'Subscription Tracker', 'langganan')
f('productivity', 'Personal Finance', 'Wishlist & Saving', 'wishlist')
f('productivity', 'Small Business', 'Mini Cashier', 'kasir')
f('productivity', 'Small Business', 'Stock Keeper', 'stok')
f('productivity', 'Planning', 'Priority Matrix', 'prioritas')
f('productivity', 'Planning', 'Vehicle Service Log', 'servis')
f('productivity', 'Learning', 'Flashcards', 'hafal')
f('productivity', 'Learning', 'Reading Tracker', 'buku')

// ── TOOLS & UTILITIES ──
f('tools', 'Calculators', 'Calculator', 'hitung')
f('tools', 'Calculators', 'Math Kit', 'mathkit')
f('tools', 'Calculators', 'Percent & Statistics', 'persen')
f('tools', 'Calculators', 'Geometry', 'luas')
f('tools', 'Calculators', 'Unit Converter', 'konv')
f('tools', 'Calculators', 'Number to Words', 'terbilang')
f('tools', 'Calculators', 'Health Calculators', 'bmi')
f('tools', 'Calculators', 'Date Calculator', 'umur')
f('tools', 'Finance Calculators', 'Split Bill', 'patungan')
f('tools', 'Finance Calculators', 'Loan Simulator', 'cicilan')
f('tools', 'Finance Calculators', 'Discount Calculator', 'diskon')
f('tools', 'Finance Calculators', 'THR & Profit', 'thr')
f('tools', 'Finance Calculators', 'Savings & Business', 'nabung')
f('tools', 'Finance Calculators', 'Trip Cost', 'bensin')
f('tools', 'Finance Calculators', 'Income Tax (PPh 21)', 'pph21')
f('tools', 'Finance Calculators', 'Overtime Pay', 'lembur')
f('tools', 'Calculators', 'Color Contrast (WCAG)', 'kontras')
f('tools', 'Finance Calculators', 'Unit Price Comparison', 'bandingharga')
f('tools', 'Finance Calculators', 'Electricity Cost', 'listrik')
f('tools', 'Calculators', 'Statistics Dataset', 'statdata')
f('tools', 'Calculators', 'Matrix Calculator', 'matriks')
f('tools', 'Calculators', 'GPA & Grade Calculator', 'ipk')
f('tools', 'Calculators', 'Due Date (HPL)', 'hpl')
f('tools', 'Calculators', 'Kitchen Conversions', 'takaran')
f('tools', 'Calculators', 'Travel Packing List', 'packing')
f('tools', 'Calculators', 'Extra Calculators (Root, Power, Log, Trig)', 'kalkulatorplus', { show: ['akarkuadrat', 'pangkatn', 'logaritma', 'trigon', 'rangkinghitung', 'mingguke', 'suhuconv', 'kecepatanconv', 'durasiformat'] })
f('tools', 'Finance Calculators', 'Interest, Margin, ROI & Break-even', 'financekit2', { show: ['bungahitung', 'diskonberjenjang', 'rasiokeuangan', 'hitungbep', 'margincalc', 'roicalc', 'simpledeposito'] })
f('tools', 'Calculators', 'Health Calculators Plus (Calories, BMR, Water, Sleep)', 'financekit2', { only: ['hitungkalori', 'hitungbmr', 'hitungairminum', 'hitungolahraga', 'hitungtidur'], show: ['hitungkalori', 'hitungbmr', 'hitungairminum', 'hitungolahraga', 'hitungtidur'] })
f('tools', 'Calculators', 'Distance & Travel Speed', 'financekit2', { only: ['jarakdua', 'estimasiwaktu', 'kecepatanrata'], show: ['jarakdua', 'estimasiwaktu', 'kecepatanrata'] })
f('tools', 'Identity & Lookup', 'Academic Grade & Format Validator', 'academickit')
f('tools', 'Text & Encoding', 'Text Toolkit', 'enc64')
f('tools', 'Text & Encoding', 'Encoder & Decoder', 'sandi')
f('tools', 'Text & Encoding', 'Text Analysis', 'teksinfo')
f('tools', 'WhatsApp Tools', 'Bot Usage Notice', 'inf')
f('tools', 'Text & Encoding', 'List Tools', 'listtools')
f('tools', 'Text & Encoding', 'Fancy Text', 'fancy')
f('tools', 'Text & Encoding', 'Lorem Ipsum', 'lorem')
f('tools', 'Text & Encoding', 'Hidden Messages', 'sembunyi')
f('tools', 'Text & Encoding', 'Text Operations (Case, Cipher, Morse, Binary)', 'textops')
f('tools', 'Text & Encoding', 'Encoding & Hash Kit (URL, Base32/58, SHA-256, UUID)', 'encodekit')
f('tools', 'Web & Network', 'Website Screenshot & Short Link', 'webtools', { only: ['ssweb', 'shortlink'] })
f('tools', 'Web & Network', 'Network Inspector', 'dns')
f('tools', 'Web & Network', 'Link Unshortener', 'unshorten')
f('tools', 'Web & Network', 'Media to URL (Upload)', 'tourl')
f('tools', 'Web & Network', 'Website & SSL Checker', 'webplus')
f('tools', 'Documents & Codes', 'PDF Maker', 'topdf')
f('tools', 'Documents & Codes', 'QR Generator', 'qr')
f('tools', 'Documents & Codes', 'WiFi QR', 'qrwifi')
f('tools', 'Documents & Codes', 'Color Tools', 'warna')
f('tools', 'Documents & Codes', 'Alight Motion Premium (Magic Link)', 'ampremium')
f('tools', 'Identity & Lookup', 'ID & Group Info', 'idgc')
f('tools', 'Identity & Lookup', 'Profile Photo & Bio', 'getpp')
f('tools', 'Interactive Cards', 'Scientific Calculator Card', 'calclive')
f('tools', 'Interactive Cards', 'Unit Converter Card', 'konverterlive')
f('tools', 'Interactive Cards', 'Quick Tools Card', 'toolslive')
f('tools', 'Interactive Cards', 'Generator Card', 'generatorlive', { show: ['generatorlive', 'passgen', 'dadu'], collapsed: true })

// ── GAMES & ENTERTAINMENT ──
f('games', 'Quick Games', 'Quick Picks (Suit, Dice, Coin)', 'suit')
f('games', 'Quick Games', 'Guessing Games', 'tebak')
f('games', 'Quick Games', 'Hangman', 'hangman')
f('games', 'Quick Games', 'Flag Quiz', 'tebakbendera')
f('games', 'Quick Games', 'Color Quiz', 'tebakwarna')
f('games', 'Quick Games', 'Shape Counting', 'hitungbenda')
f('games', 'Quick Games', 'Mastermind', 'mastermind')
f('games', 'Quick Games', 'Who Am I', 'siapakahaku')
f('games', 'Quick Games', 'Typing Race', 'cepatketik')
f('games', 'Quick Games', 'Tic Tac Toe', 'ttt')
f('games', 'Quick Games', 'Connect Four vs Bot', 'c4')
f('games', 'Quick Games', 'Nim vs Bot', 'nim')
f('games', 'Quick Games', 'Sudoku', 'sudoku')
f('games', 'Quick Games', 'Battleship vs Bot', 'kapal')
f('games', 'Quick Games', 'Quiz', 'kuis')
f('games', 'Quick Games', 'Anagram', 'anagram')
f('games', 'Quick Games', 'Math Rush', 'mathrush')
f('games', 'Quick Games', 'Word Chain', 'sambungkata')
f('games', 'Quick Games', 'Game Leaderboard', 'topgame')
f('games', 'Casino & Cards', 'Slot Machine', 'slot')
f('games', 'Casino & Cards', 'Hi-Lo', 'hilo')
f('games', 'Casino & Cards', 'Blackjack', 'bj')
f('games', 'Casino & Cards', 'Bullet Roulette', 'roulette')
f('games', 'Party', 'Werewolf', 'werewolf', { extra: ['wwkill', 'wwcek', 'wwjaga', 'wwheal', 'wwracun', 'wwskip', 'wwshoot', 'wwrole'] })
f('games', 'Social Fun', 'Trait Checker', 'cek', { show: ['cek'], collapsed: true })
f('games', 'Social Fun', 'Random Member Picker', 'siapa')
f('games', 'Social Fun', 'Time Oracle', 'kapan')
f('games', 'Social Fun', 'Truth, Dare & Match', 'truth')
f('games', 'Social Fun', 'Roast & Would You Rather', 'roast')
f('games', 'Social Fun', 'Random Quotes', 'fakta')
f('games', 'Social Fun', 'Random Images', 'gambarlucu')
f('games', 'Social Fun', 'Idea & Decision Picker', 'ide')
f('games', 'Magic & Novelty', 'Mind Reader', 'telepati')
f('games', 'Magic & Novelty', 'Impossible Features', 'mustahil')
f('games', 'Magic & Novelty', 'Style Mimic', 'tiru')
f('games', 'Live Arcade Cards', 'Arcade Hub', 'games')
f('games', 'Live Arcade Cards', 'Classic Arcade Cards', 'breakoutlive dinolive flappylive gamelive geodashlive memorylive mineslive tetrislive typinglive wordlelive rodalive destroylive')
f('games', 'Live Arcade Cards', 'Chisa AI RPG Card', 'chisalive')

// ── RPG ISEKAI ──
f('rpg', 'Character', 'Character & Rank', 'rpgstart')
f('rpg', 'Character', 'Skills', 'skills')
f('rpg', 'Character', 'Titles & Rebirth', 'gelar')
f('rpg', 'Character', 'Achievements', 'achievement')
f('rpg', 'Character', 'Daily Quests', 'quest')
f('rpg', 'Adventure', 'Hunting & Gathering', 'hunt')
f('rpg', 'Adventure', 'Expedition', 'expedisi')
f('rpg', 'Adventure', 'PvP & World Boss', 'duel')
f('rpg', 'Adventure', 'Guild Master AI', 'guildmaster')
f('rpg', 'Economy', 'Economy & Equipment', 'daily')
f('rpg', 'Economy', 'Guild Bank', 'bank')
f('rpg', 'Economy', 'Player Market', 'pasar')
f('rpg', 'Economy', 'Gambling', 'coinflip')
f('rpg', 'Economy', 'Companion Gacha', 'summon')
f('rpg', 'Economy', 'Farm', 'kebun')
f('rpg', 'Economy', 'Kitchen', 'cook')
f('rpg', 'Economy', 'Beast Market', 'pasarbudak')
f('rpg', 'Social', 'Party', 'party')
f('rpg', 'Social', 'Clan', 'clancreate', { extra: ['clan', 'clanbio'] })
f('rpg', 'Social', 'Clan Raid', 'clanraid')
f('rpg', 'Guild Town', 'Guild Town NPCs', 'town')

// ── SYSTEM & DEVELOPER ──
f('system', 'Diagnostics', 'Runtime Diagnostics', 'diag', { rows: [
  ['diag', 'Runtime Diagnostics'], ['diag events', 'Event Monitor'], ['diag plugins', 'Plugin Inspector'], ['diag protocol', 'Protocol Report'],
  ['diag selftest', 'Core Diagnostics'], ['diag backup', 'Vault Health'], ['diag menu', 'Menu Registry Audit'],
  ['diag errors', 'Error Log', 'owner'], ['diag snapshot', 'Manual Snapshot', 'owner'],
] })
f('system', 'Diagnostics', 'Bot Status', 'botstat', { only: ['botstat', 'listowner'], perm: 'owner' })
f('system', 'Diagnostics', 'AI Provider Status', 'aistatus')
f('system', 'Diagnostics', 'Downloader Engine Status', 'dlstatus')
f('system', 'Backup & Security', 'Backup Manager', 'backup', { rows: [
  ['backup', 'Backup Manager'], ['backup now', 'Create Snapshot'], ['backup list', 'Snapshot List'], ['backup verify', 'Verify Backups'], ['backup send', 'Send Snapshot'], ['backup restore', 'Restore Snapshot'],
] })
f('system', 'Backup & Security', 'Chisa AI Shield', 'shield')
f('system', 'Developer Utilities', 'Developer Toolkit', 'devtools')
f('system', 'Developer Utilities', 'Web Hosting (Vercel)', 'vercel', { perm: 'premium' })
f('system', 'Developer Utilities', 'Snippet Relay', 'crm')

// ── OWNER & ADMIN ──
f('owner', 'Bot Settings', 'Settings Panel', 'setting')
f('owner', 'Bot Settings', 'Image Provider Keys (Firefly / Kyyz)', 'apikey')
f('owner', 'Bot Settings', 'Access Mode', 'public self')
f('owner', 'Access Control', 'Ban Manager', 'ban')
f('owner', 'Access Control', 'Registration Approvals', 'acc')
f('owner', 'Access Control', 'Owner Manager', 'addowner delowner')
f('owner', 'Access Control', 'Premium Manager', 'dev', { only: ['premium', 'listprem'], perm: 'owner', extra: ['addprem', 'delprem'] })
f('owner', 'Access Control', 'Limit Manager', 'limit', { only: ['resetlimit', 'listlimit'], perm: 'owner' })
f('owner', 'Access Control', 'Group Ban', 'botstat', { only: ['banchat', 'unbanchat', 'listbanchat'], perm: 'owner' })
f('owner', 'Broadcast & Groups', 'Group & Broadcast Control', 'listgc')
f('owner', 'Broadcast & Groups', 'Remote Actions', 'botstat', { only: ['leavegc', 'pesan', 'resetgrupset'], perm: 'owner' })
f('owner', 'Privacy Guard', 'Message Guard', 'antidelete')
f('owner', 'Analytics', 'Owner Panel', 'panel')
f('owner', 'Analytics', 'Owner Access Dashboard', 'owneraccess')
f('owner', 'Analytics', 'Analytics Report', 'report')
f('owner', 'Investigation', 'OSINT Lookup', 'osint')
f('owner', 'Dev Console', 'Dev Panel (Economy, Level, Items)', 'dev', { perm: 'dev' })

// ── PANEL & HOSTING (jualan panel Pterodactyl) ──
f('hosting', 'Gerbang', 'Chisa AI Panel (dasbor animasi)', 'chisapanel', { only: ['chisapanel'], desc: 'Gerbang jualan panel: animasi pembuka, kartu dasbor (peran, status server, kapasitas), dan menu tombol. Subperintah: skip, status, cara, paket.' })
f('hosting', 'Gerbang', 'Daftar Paket & Tutorial', 'chisapanel', { only: ['ramlist', 'tutorial'] })
f('hosting', 'Penjualan', 'Buat Panel untuk Pembeli', 'panelsell', { except: ['createadmin', 'createadmin2'], desc: 'Buat akun + server sesuai paket di config. Format: .<paket> username,nomor (atau reply pembeli). Server 2: .srv2<paket>. Khusus Reseller Panel ke atas.' })
f('hosting', 'Penjualan', 'Akun Admin Panel', 'panelsell', { only: ['createadmin', 'createadmin2'], desc: '.createadmin username,nomor (alias .cadmin) khusus PT Panel / Owner Panel / owner bot. .createadmin2 untuk server 2 (owner bot).' })
f('hosting', 'Peran Penjual', 'Kelola Peran Panel', 'panelrole', { desc: 'Reseller < Admin < PT < Owner Panel. Tambah: .addresellerp .addadminp .addptp .addownp • Cabut: .delresellerp .deladminp .delptp .delownp • Daftar: .listseller' })
f('hosting', 'Kelola Panel', 'Kelola Isi Panel', 'panelmanage', { desc: 'Daftar user/server/admin, hapus user/server, suspend/unsuspend, dan buat server manual. Tambah angka 2 di akhir (mis. .listusr2) untuk server 2.' })

// ── v4.8.0: FITUR BARU + FITUR PASIF (hidup tanpa command) ──
// Fitur pasif dikelola lewat satu command (.pasif); tiap baris di bawah = satu fitur pasif yang bisa dinyalakan/dimatikan per chat.
f('productivity', 'Passive Automation', 'Passive Control Center', 'pasif', { desc: 'Fitur yang hidup tanpa command, KHUSUS GRUP. .pasif = daftar & status • .pasif <fitur> on|off • .pasif semua on|off • .pasif master on|off (owner)', rows: [
  ['pasif salam', 'Auto Salam & Sapaan (pasif)'], ['pasif botmention', 'Respon Dipanggil (pasif)'], ['pasif autohitung', 'Kalkulator Otomatis: ketik 12*5+3 (pasif)'],
  ['pasif linkhint', 'Petunjuk Unduh Tautan (pasif)'], ['pasif unmask', 'Pembuka Link Pendek (pasif)'], ['pasif autosticker', 'Auto Stiker (pasif)'],
  ['pasif autoreact', 'Reaksi Otomatis (pasif)'], ['pasif milestone', 'Milestone Grup (pasif)'],
  ['pasif antivirtex', 'Anti Virtex (pasif)', 'admin'], ['pasif antiulang', 'Anti Pesan Berulang (pasif)', 'admin'], ['pasif antitagmassal', 'Anti Tag Massal (pasif)', 'admin'],
  ['pasif antipromo', 'Anti Promosi (pasif)', 'admin'], ['pasif jagadata', 'Penjaga Data Pribadi NIK/Kartu (pasif)', 'admin'], ['pasif anticaps', 'Pengingat Huruf Kapital (pasif)', 'admin'],
  ['pasif master', 'Saklar Induk Fitur Pasif', 'owner'],
] })
f('group', 'Insights', 'Group Summary', 'ringkasgrup')
f('games', 'Social Fun', 'Tanya Bot', 'apakah')
f('games', 'Social Fun', 'Tarot Reading', 'tarot')
f('games', 'Social Fun', 'Icebreaker & Riddles', 'topik')
f('tools', 'Decision & Random', 'Spin, Draw & Team Splitter', 'acakan')
f('tools', 'Text & Encoding', 'Text Lab', 'baristeks')
f('tools', 'Code Studio', 'Snip — Code Studio', 'snip')
f('tools', 'Code Studio', 'Coding Toolkit (chmod, HTTP, CIDR, SemVer, Git, cURL, Cron, SQL)', 'codekit')
f('tools', 'WhatsApp Tools', 'WhatsApp Toolkit (wa.me, vCard, Read More, Templates, Chat Stats)', 'wakit')
f('tools', 'Social Media Tools', 'Social Media Toolkit (hashtag, caption, hook, judul, bio, utas, ER, rencana konten)', 'sosmedkit')
f('tools', 'Web & Network', 'URL Parser & User-Agent Reader', 'utilkit', { only: ['urlparse', 'ua'] })
f('tools', 'Location & Distance', 'Distance & Coordinates (jarak kota, DMS ⇄ desimal)', 'utilkit', { only: ['jarak', 'koordinat'] })
f('tools', 'Calculators', 'Fractions & Roots (pecahan, akar)', 'utilkit', { only: ['pecahan', 'akar'] })
f('tools', 'Calculators', 'Download Time & Aspect Ratio (estunduh, rasio)', 'utilkit', { only: ['estunduh', 'rasio'] })
f('tools', 'Time & Zones', 'Indonesia Time Zones & Time Progress (WIB/WITA/WIT, progres)', 'utilkit', { only: ['wibwita', 'progres'] })
f('tools', 'Identity & Lookup', 'Indonesia Reference Data', 'indodata')
f('tools', 'Finance Calculators', 'Restaurant Bill Splitter', 'tip')
f('tools', 'Calculators', 'Running Pace', 'pace')
f('tools', 'Calculators', 'Date Info', 'harike')

// ───────────────────────── MESIN REGISTRY ─────────────────────────
const catById = Object.fromEntries(CATEGORIES.map((c, i) => [c.id, { ...c, no: i + 1 }]))
const menuCmds = (p) => (Array.isArray(p.menu) && p.menu.length ? p.menu : Array.isArray(p.cmds) && p.cmds.length ? p.cmds : [p.name])
const headOf = (c) => String(c).trim().split(/\s+/)[0].toLowerCase()
const dedupe = (a) => [...new Set(a)]

function allPlugins() { return [...pl.list(), ...BUILTINS.map(b => ({ ...b, category: 'main' }))] }
// plugin/bawaan pemilik sebuah command (command yang sama dipakai dua plugin → pemenangnya yang dipakai pluginloader)
function ownerOf(c) {
  const k = headOf(c), p = pl.get(k)
  if (p) return p
  return BUILTINS.find(b => b.name === k || b.alias.includes(k)) || null
}
function permOf(p, feat, cmd) {
  const rows = feat && feat.rows && cmd ? feat.rows.find(r => r[0] === cmd) : null
  if (rows && rows[2]) return rows[2]
  if (feat && feat.perm) return feat.perm
  if (p.dev) return 'dev'
  if (p.owner) return 'owner'
  if (p.premium) return 'premium'
  if (p.admin) return 'admin'
  return null
}

// membangun model dari plugin yang sedang termuat. cache singkat supaya .menu tidak membangun ulang tiap pesan, otomatis batal bila jumlah plugin berubah.
let _cache = null
function build(force) {
  const plugins = allPlugins(), sig = plugins.length + ':' + plugins.map(p => p.name).join(',').length
  if (!force && _cache && _cache.sig === sig && Date.now() - _cache.at < 5000) return _cache.model
  const feats = [...FEATURES.filter(x => x.only), ...FEATURES.filter(x => !x.only)].map(x => ({ ...x, cmds: [], aliases: [], plugs: new Set() }))
  const issues = { unmapped: [], unresolved: [], hiddenByShow: [], conflicts: [], missingHandler: [] }
  const assigned = new Map()   // command → fitur
  const fallback = {}          // plugin yang belum dipetakan → fitur otomatis

  for (const p of plugins) {
    const cmds = dedupe(menuCmds(p).map(c => String(c).toLowerCase()))
    for (const c of cmds) {
      const own = ownerOf(c)
      if (!own) { issues.unresolved.push(`${p.name}: .${c} tidak terdaftar`); continue }
      if (own !== p && !(own.name === p.name)) continue   // alias dipakai plugin lain (konflik lama): tampil di pemenangnya saja
      let feat = feats.find(x => x.plugins.includes(p.name) && (!x.only || x.only.includes(c)) && (!x.except || !x.except.includes(c)))
      if (!feat) {
        const cat = catById[p.menuCat] ? p.menuCat : (FOLDER_DEFAULT[p.menuCat || p.category] || 'general')
        if (!fallback[p.name]) { fallback[p.name] = { cat, sub: 'Other', title: p.name.charAt(0).toUpperCase() + p.name.slice(1), plugins: [p.name], cmds: [], aliases: [], plugs: new Set(), auto: true }; feats.push(fallback[p.name]); issues.unmapped.push(p.name) }
        feat = fallback[p.name]
      }
      feat.cmds.push({ cmd: c, perm: permOf(p, feat, c), plugin: p })
      feat.plugs.add(p)
      assigned.set(c, feat)
    }
  }
  // command yang ada & terdaftar tetapi belum tercantum di daftar `cmds` plugin: ditambahkan lewat `extra` (eksplisit) atau otomatis bila terdokumentasi di lib/catalog.js
  const addCmd = (feat, c, why) => {
    const own = ownerOf(c)
    if (!own || !feat.plugs.has(own) && !feat.plugins.includes(own.name)) { issues.unresolved.push(`${feat.title}: .${c} (${why}) tidak mengarah ke plugin fitur ini`); return }
    if (assigned.has(c)) return
    feat.cmds.push({ cmd: c, perm: permOf(own, feat, c), plugin: own }); feat.plugs.add(own); assigned.set(c, feat); if (feat.show && !feat.show.map(headOf).includes(c)) feat.show.push(c)
  }
  for (const x of feats) for (const c of (x.extra || [])) addCmd(x, c, 'extra')
  try {
    for (const k of require('./catalog').documented()) {
      const own = ownerOf(k); if (!own || assigned.has(k)) continue
      const feat = feats.find(x => x.cmds.length && x.plugs.has(own)); if (feat) addCmd(feat, k, 'katalog')
    }
  } catch (e) { issues.unresolved.push('katalog tidak terbaca: ' + e.message) }
  const model = { categories: [], issues, total: 0, features: feats, aliasTotal: 0 }
  for (const x of feats) {
    if (!x.cmds.length) continue
    const first = x.plugs.values().next().value
    x.desc = x.desc || (first && first.desc) || ''
    x.aliases = dedupe([...x.plugs].flatMap(p => (p.alias || []).map(a => String(a).toLowerCase()).filter(a => ownerOf(a) === p))).filter(a => !assigned.has(a))
    model.aliasTotal += x.aliases.length
    x.perm = x.perm || (x.cmds.every(c => c.perm === x.cmds[0].perm) ? x.cmds[0].perm : null)
    if (x.rows) { for (const r of x.rows) { const o = ownerOf(r[0]); if (!o || !x.plugs.has(o)) issues.unresolved.push(`${x.title}: baris .${r[0]} tidak mengarah ke plugin fitur ini`) } }
    if (x.show) {
      for (const s of x.show) { const o = ownerOf(s); if (!o || !x.plugs.has(o)) issues.unresolved.push(`${x.title}: .${s} tidak mengarah ke plugin fitur ini`) }
      if (!x.collapsed) { const sh = new Set(x.show.map(headOf)); const hid = x.cmds.filter(c => !sh.has(c.cmd)).map(c => c.cmd); if (hid.length) issues.hiddenByShow.push(`${x.title}: ${hid.join(', ')}`) }
    }
  }
  // fitur yang menunjuk plugin tidak ada → peringatan (mis. plugin dihapus)
  const names = new Set(plugins.map(p => p.name))
  for (const x of FEATURES) for (const n of x.plugins) if (!names.has(n)) issues.missingHandler.push(`${x.title}: plugin "${n}" tidak termuat`)
  for (const c of CATEGORIES) {
    const cat = { ...catById[c.id], features: feats.filter(x => x.cat === c.id && x.cmds.length), subs: [] }
    const order = []
    for (const x of cat.features) if (!order.includes(x.sub)) order.push(x.sub)
    cat.subs = order.map(name => ({ name, features: cat.features.filter(x => x.sub === name) }))
    cat.count = cat.features.reduce((n, x) => n + x.cmds.length, 0); cat.aliasCount = cat.features.reduce((n, x) => n + x.aliases.length, 0)
    model.categories.push(cat); model.total += cat.count
  }
  // konflik alias (nama sama dipakai >1 plugin)
  const seen = new Map()
  for (const p of plugins) for (const k of [p.name, ...(p.alias || [])]) { const key = String(k).toLowerCase(); if (seen.has(key) && seen.get(key) !== p.name) issues.conflicts.push(`${key}: ${seen.get(key)} / ${p.name}`); else seen.set(key, p.name) }
  model.assigned = assigned
  _cache = { sig, at: Date.now(), model }
  return model
}

// viewer = { isOwner, isDev } → model yang sudah disaring. Fitur khusus owner/dev tidak tampil bagi pengguna biasa; kategori kosong disembunyikan.
// viewer kosong (audit) → semuanya.
const canSee = (perm, v) => !v || !perm || (perm === 'owner' ? !!(v.isOwner || v.isDev) : perm === 'dev' ? !!v.isDev : true)
function view(model, viewer) {
  const cats = []
  for (const c of model.categories) {
    if (c.owner && viewer && !(viewer.isOwner || viewer.isDev)) continue
    const features = c.features.map(x => {
      const cmds = x.cmds.filter(k => canSee(k.perm, viewer))
      if (!cmds.length) return null
      const rows = x.rows ? x.rows.filter(r => canSee(r[2] || x.perm, viewer)) : null
      return { ...x, cmds, rows }
    }).filter(Boolean)
    if (!features.length) continue
    const order = []; for (const x of features) if (!order.includes(x.sub)) order.push(x.sub)
    cats.push({ ...c, aliasCount: features.reduce((n, x) => n + x.aliases.length, 0), features, subs: order.map(name => ({ name, features: features.filter(x => x.sub === name) })), count: features.reduce((n, x) => n + x.cmds.length, 0) })
  }
  return { categories: cats, total: cats.reduce((n, c) => n + c.count, 0), aliasTotal: cats.reduce((n, c) => n + c.features.reduce((a, x) => a + x.aliases.length, 0), 0), featureTotal: cats.reduce((n, c) => n + c.features.length, 0), issues: model.issues }
}

// "ai", "2", "AI & Intelligence", "dunia" (nama lama) → id kategori atau null
function resolveCategory(input, v) {
  const k = String(input || '').toLowerCase().trim().replace(/[^a-z0-9& ]+/g, '').replace(/\s+/g, ' ')
  if (!k) return null
  const cats = v.categories
  if (/^\d{1,2}$/.test(k)) { const c = cats[Number(k) - 1]; return c ? c.id : null }
  for (const c of cats) if (c.id === k || c.title.toLowerCase() === k || c.title.toLowerCase().replace(/ & /g, ' ') === k || c.title.toLowerCase().split(' & ')[0] === k) return c.id
  for (const c of cats) if (c.aliases.includes(k)) return c.id
  return null
}

// cari fitur dari satu command / alias (untuk .menu <command> dan saran)
function findFeature(cmd, model) {
  const p = ownerOf(cmd); if (!p) return null
  const k = headOf(cmd), m = model || build()
  return m.features.find(x => x.plugs.has(p) && x.cmds.some(c => c.cmd === k)) || m.features.find(x => x.plugs.has(p)) || null
}

// saran untuk command yang tidak dikenal: awalan sama atau selisih ≤ 2 huruf. Mengembalikan maks n nama command (bukan alias).
function lev(a, b) { const m = [...Array(a.length + 1)].map((_, i) => [i, ...Array(b.length).fill(0)]); for (let j = 1; j <= b.length; j++) m[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return m[a.length][b.length] }
function suggest(cmd, n = 3) {
  const k = String(cmd || '').toLowerCase(); if (k.length < 2) return []
  const pool = new Set([...(pl.names ? pl.names() : []), ...BUILTINS.flatMap(b => [b.name, ...b.alias])])
  const scored = []
  for (const name of pool) { if (name.length < 3 || name === k) continue; { const pp = pl.get && pl.get(name); if (pp && pp.noPrefixOnly) continue } const d = lev(k, name); const pre = k.length >= 3 && (name.startsWith(k) || k.startsWith(name)); if (d <= (k.length <= 4 ? 1 : 2) || pre) scored.push([pre && d > 2 ? 2 : d, name]) }
  return scored.sort((a, b) => a[0] - b[0] || a[1].length - b[1].length).slice(0, n).map(x => x[1])
}

// ringkasan kesehatan registry untuk .diag menu dan npm run check:menu
function audit() {
  const m = build(true), i = m.issues
  const dupInFeatures = []; const seen = new Map()
  for (const x of m.features) for (const c of x.cmds) { if (seen.has(c.cmd) && seen.get(c.cmd) !== x) dupInFeatures.push(`${c.cmd}: ${seen.get(c.cmd).title} / ${x.title}`); else seen.set(c.cmd, x) }
  const emptyCats = m.categories.filter(c => !c.count).map(c => c.id)
  return { categories: m.categories.length, features: m.features.filter(x => x.cmds.length).length, commands: m.total, aliases: m.aliasTotal, plugins: allPlugins().length, ...i, duplicates: dupInFeatures, emptyCats }
}

module.exports = { CATEGORIES, FEATURES, BUILTINS, FOLDER_DEFAULT, build, view, resolveCategory, findFeature, suggest, audit, ownerOf, headOf, menuCmds, canSee }
