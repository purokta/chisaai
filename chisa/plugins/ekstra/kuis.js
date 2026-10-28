/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .kuis — kuis pilihan ganda 6 kategori. Jawab dengan huruf A/B/C/D langsung di chat; satu kesempatan per orang.
const { B } = require('../../lib/style'), E = require('../../lib/ekstra')
// [pertanyaan, jawaban benar, [3 pengecoh]]
const Q = {
  umum: [
    ['Planet terbesar di tata surya adalah?', 'Jupiter', ['Saturnus', 'Neptunus', 'Uranus']],
    ['Ibu kota Australia adalah?', 'Canberra', ['Sydney', 'Melbourne', 'Perth']],
    ['Hewan darat tercepat di dunia adalah?', 'Cheetah', ['Singa', 'Kuda', 'Macan tutul']],
    ['Berapa jumlah sisi pada segi enam?', '6', ['5', '7', '8']],
    ['Warna apa yang dihasilkan dari campuran biru dan kuning?', 'Hijau', ['Ungu', 'Oranye', 'Cokelat']],
    ['Berapa hari dalam satu tahun kabisat?', '366', ['365', '364', '367']],
    ['Benua terkecil di dunia adalah?', 'Australia', ['Eropa', 'Antartika', 'Amerika Selatan']],
  ],
  sains: [
    ['Rumus kimia air adalah?', 'H2O', ['CO2', 'O2', 'NaCl']],
    ['Gas yang paling banyak di atmosfer Bumi adalah?', 'Nitrogen', ['Oksigen', 'Karbon dioksida', 'Hidrogen']],
    ['Satuan gaya dalam sistem SI adalah?', 'Newton', ['Joule', 'Watt', 'Pascal']],
    ['Planet terdekat dari Matahari adalah?', 'Merkurius', ['Venus', 'Mars', 'Bumi']],
    ['Tulang terpanjang pada tubuh manusia adalah?', 'Tulang paha (femur)', ['Tulang kering', 'Tulang lengan atas', 'Tulang belakang']],
    ['Proses tumbuhan membuat makanan dengan bantuan cahaya disebut?', 'Fotosintesis', ['Respirasi', 'Transpirasi', 'Fermentasi']],
    ['Unsur kimia dengan simbol Fe adalah?', 'Besi', ['Emas', 'Perak', 'Fluorin']],
    ['Jumlah kromosom pada sel tubuh manusia normal adalah?', '46', ['23', '44', '48']],
    ['Kecepatan cahaya di ruang hampa sekitar?', '300.000 km/detik', ['150.000 km/detik', '30.000 km/detik', '3.000.000 km/detik']],
    ['Organ yang memompa darah ke seluruh tubuh adalah?', 'Jantung', ['Paru-paru', 'Hati', 'Ginjal']],
  ],
  geografi: [
    ['Gunung tertinggi di dunia (dari permukaan laut) adalah?', 'Everest', ['K2', 'Kilimanjaro', 'Fuji']],
    ['Sungai terpanjang di Indonesia adalah?', 'Kapuas', ['Musi', 'Mahakam', 'Barito']],
    ['Danau vulkanik terbesar di Indonesia adalah?', 'Toba', ['Singkarak', 'Poso', 'Maninjau']],
    ['Ibu kota Turki adalah?', 'Ankara', ['Istanbul', 'Izmir', 'Antalya']],
    ['Ibu kota Kanada adalah?', 'Ottawa', ['Toronto', 'Vancouver', 'Montreal']],
    ['Ibu kota Brasil adalah?', 'Brasilia', ['Rio de Janeiro', 'Sao Paulo', 'Salvador']],
    ['Samudra terluas di dunia adalah?', 'Pasifik', ['Atlantik', 'Hindia', 'Arktik']],
    ['Negara terluas di dunia berdasarkan wilayah adalah?', 'Rusia', ['Kanada', 'Tiongkok', 'Amerika Serikat']],
    ['Selat yang memisahkan Pulau Sumatra dan Semenanjung Malaya adalah?', 'Selat Malaka', ['Selat Sunda', 'Selat Bali', 'Selat Makassar']],
  ],
  sejarah: [
    ['Proklamasi kemerdekaan Indonesia dibacakan pada tahun?', '1945', ['1942', '1949', '1950']],
    ['Presiden pertama Republik Indonesia adalah?', 'Soekarno', ['Soeharto', 'Mohammad Hatta', 'B.J. Habibie']],
    ['Candi Buddha terbesar di dunia yang ada di Magelang adalah?', 'Borobudur', ['Prambanan', 'Mendut', 'Sewu']],
    ['Kerajaan Hindu tertua di Indonesia adalah?', 'Kutai', ['Majapahit', 'Sriwijaya', 'Mataram']],
    ['Sumpah Pemuda diikrarkan pada tahun?', '1928', ['1908', '1945', '1930']],
    ['Tokoh Majapahit yang terkenal dengan Sumpah Palapa adalah?', 'Gajah Mada', ['Hayam Wuruk', 'Raden Wijaya', 'Airlangga']],
    ['Piramida Giza terletak di negara?', 'Mesir', ['Meksiko', 'Sudan', 'Irak']],
    ['Revolusi Prancis dimulai pada tahun?', '1789', ['1689', '1815', '1848']],
  ],
  teknologi: [
    ['Kepanjangan CPU adalah?', 'Central Processing Unit', ['Central Program Utility', 'Computer Power Unit', 'Core Processing Update']],
    ['HTML termasuk jenis bahasa?', 'Markup', ['Pemrograman prosedural', 'Basis data', 'Mesin']],
    ['Perusahaan Microsoft didirikan oleh Bill Gates dan?', 'Paul Allen', ['Steve Jobs', 'Larry Page', 'Elon Musk']],
    ['Bahasa pemrograman yang lambangnya ular adalah?', 'Python', ['Java', 'Ruby', 'Rust']],
    ['Satu byte terdiri dari berapa bit?', '8', ['4', '16', '10']],
    ['Kepanjangan WWW adalah?', 'World Wide Web', ['World Web Wire', 'Wide World Web', 'Web World Wide']],
    ['Sistem operasi ponsel buatan Google adalah?', 'Android', ['iOS', 'Symbian', 'HarmonyOS']],
    ['Bilangan biner hanya menggunakan angka?', '0 dan 1', ['1 dan 2', '0 sampai 9', '0 dan 2']],
    ['Mana yang BUKAN format gambar?', 'MP3', ['PNG', 'JPG', 'GIF']],
  ],
  budaya: [
    ['Alat musik tradisional Jawa dari logam yang dimainkan beramai-ramai adalah?', 'Gamelan', ['Angklung', 'Sasando', 'Kolintang']],
    ['Rumah adat Minangkabau disebut?', 'Rumah Gadang', ['Joglo', 'Tongkonan', 'Honai']],
    ['Senjata tradisional khas Jawa berlekuk-lekuk adalah?', 'Keris', ['Rencong', 'Mandau', 'Badik']],
    ['Tari Saman berasal dari daerah?', 'Aceh', ['Bali', 'Papua', 'Sumatra Barat']],
    ['Kesenian Reog berasal dari?', 'Ponorogo', ['Banyuwangi', 'Cirebon', 'Solo']],
    ['Makanan khas Padang yang terkenal mendunia adalah?', 'Rendang', ['Gudeg', 'Papeda', 'Rawon']],
    ['Angklung berasal dari daerah?', 'Jawa Barat', ['Jawa Timur', 'Bali', 'Lampung']],
    ['Batik diakui UNESCO sebagai warisan budaya pada tahun?', '2009', ['1999', '2005', '2015']],
    ['Pakaian tradisional Jepang disebut?', 'Kimono', ['Hanbok', 'Cheongsam', 'Sari']],
  ],
}
const games = new Map(), L = ['A', 'B', 'C', 'D'], TIME = 30e3
const end = (chat) => { const g = games.get(chat); if (g) clearTimeout(g.tm); games.delete(chat) }
const show = (g) => `${B('KUIS')} • ${g.cat}\n━━━━━━━━━━━━━━━━━━━━\n*${g.q}*\n\n${g.opts.map((o, i) => `${L[i]}. ${o}`).join('\n')}\n\nBalas huruf *A/B/C/D* (30 detik, satu kesempatan per orang)`
module.exports = {
  name: 'kuis', alias: ['quiz', 'trivia', 'kuisnyerah'], category: 'ekstra', noLimit: true, cmds: ['kuis', 'kuisnyerah'],
  desc: 'Kuis pilihan ganda: .kuis [umum|sains|geografi|sejarah|teknologi|budaya], jawab A/B/C/D',
  run: async ({ sock, m, args, command, prefix, reply }) => {
    const g = games.get(m.chat)
    if (command === 'kuisnyerah') { if (!g) return reply('Tidak ada kuis berjalan.'); end(m.chat); return reply(`Kuis dihentikan. Jawabannya: *${L[g.ans]}. ${g.opts[g.ans]}*`) }
    if (g) return reply(show(g))
    const keys = Object.keys(Q), cat = keys.includes((args[0] || '').toLowerCase()) ? args[0].toLowerCase() : E.rnd(keys), [q, ok, bad] = E.rnd(Q[cat])
    const opts = E.shuffle([ok, ...bad]), ng = { q, cat, opts, ans: opts.indexOf(ok), tried: new Set() }
    ng.tm = setTimeout(() => { if (games.get(m.chat) === ng) { games.delete(m.chat); sock.sendMessage(m.chat, { text: `Waktu habis! Jawabannya: *${L[ng.ans]}. ${ng.opts[ng.ans]}*` }).catch(() => {}) } }, TIME)
    games.set(m.chat, ng)
    return reply(show(ng) + `\n_Kategori: ${keys.join(', ')}_`)
  },
  before: async ({ m, budy, reply }) => {
    const g = games.get(m.chat); if (!g || !budy) return false
    const t = budy.trim().toUpperCase().replace(/[.)]$/, ''); if (!/^[A-D]$/.test(t) || g.tried.has(m.sender)) return false
    g.tried.add(m.sender)
    if (L.indexOf(t) !== g.ans) { await reply(`✕ ${m.pushName || 'Kamu'}: ${t} salah. Yang lain masih bisa menjawab!`); return true }
    end(m.chat); const sc = E.addScore(m.sender, m.pushName, 10, 'kuis')
    await reply(`✦ *${m.pushName || 'Kamu'}* benar! *${L[g.ans]}. ${g.opts[g.ans]}*\n+10 poin (total ${sc.pts})\n_Lagi: .kuis • .topgame_`)
    return true
  },
}
