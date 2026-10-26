/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// FITUR MUSTAHIL — kumpulan perintah hiburan yang 100% tidak mungkin & tidak masuk akal (murni candaan, tanpa API, tanpa AI).
//   .teleport <tujuan>      .kloning [@user]        .dimensi              .sulap <A> jadi <B>     .tambahumur
//   .hapusingatan [@user]   .pinjamiq @user <angka> .nolgravitasi         .tukarjiwa @user        .gandakanuang <jumlah>
//   .ubahcuaca <cuaca>      .bangkitkan <benda>     .bicarahewan <hewan> <teks>   .paspor         .hentikanwaktu [detik]
// Semua balasan dikirim di chat tempat perintah dipakai (tidak pernah mengirim chat pribadi otomatis).
const { B } = require('../../lib/style'), AJ = require('../../lib/ajaib')

const num = (j) => String(j || '').split('@')[0].split(':')[0]
const pick = (arr, r = Math.random) => arr[Math.floor(r() * arr.length)]
const rint = (a, b, r = Math.random) => a + Math.floor(r() * (b - a + 1))
const pct = (r = Math.random) => rint(1, 100, r)
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: (global.settingsDefault && global.settingsDefault.timezone) || 'Asia/Jakarta' })
const seeded = (...parts) => AJ.rng(parts.join('|'))
const target = (m) => (m.mentionedJid && m.mentionedJid[0]) || (m.quoted && m.quoted.sender) || null
const tag = (j) => '@' + num(j)
const NOTE = '\n\n_Fitur hiburan. Semua ini mustahil dan tidak benar-benar terjadi._'
const head = (t) => `✦ ${B(t)}\n━━━━━━━━━━━━━━━━━━━━\n`

const TELE_DIM = ['dimensi kaus kaki hilang', 'ruang tunggu antar-galaksi (antreannya 4.000 tahun)', 'dalam mimpi seekor kucing', 'balik ke titik awal tapi menghadap kiri', 'dapur rumah nenek di tahun 1987 versi paralel', 'dalam grup WhatsApp keluarga yang tidak pernah sepi', 'ujung pelangi (isinya parkir berbayar)', 'bagian dalam awan, ternyata cuma uap', 'warung di dasar Samudra Pasifik, tutup', 'sinyal 1 bar yang selama ini kamu cari']
const KLON_CACAT = ['malas bangun pagi (lebih parah dari aslinya)', 'bisa tidur sambil berdiri', 'hanya mau makan mi instan', 'terus bilang "5 menit lagi"', 'selalu menjawab "terserah"', 'ketawa sendiri tanpa sebab', 'mudah lupa bawa dompet', 'suka mengganti topik di tengah kalimat', 'membalas chat 3 hari kemudian', 'jago debat sama diri sendiri']
const DIM_VERSI = ['Presiden Dunia yang kerjanya cuma ganti wallpaper', 'kucing oranye yang punya 9 gedung', 'koki bintang lima yang alergi dapur', 'astronot yang takut ketinggian', 'penyanyi dangdut intergalaksi', 'satpam di museum yang isinya cuma satu kursi', 'penjual es teh di Mars (laris)', 'raja yang kerajaannya cuma satu RT', 'detektif yang selalu menemukan dirinya sendiri', 'dewa yang kuota internetnya tinggal 50 MB', 'pemain gitar di konser batu', 'pemilik toko yang menjual hari Senin (tidak laku)']
const BENDA_HIDUP = ['langsung bangun lalu minta gaji', 'bangkit, melihat sekeliling, lalu minta maaf karena sudah lama mati', 'hidup sebentar, menari, kemudian tidur lagi', 'bangkit dan langsung mengeluh soal harga di zaman sekarang', 'hidup tapi hanya bisa bilang "hmm"', 'bangkit, lalu ternyata dia sudah punya cicilan', 'hidup 3 detik dan menanyakan wifi']
const CUACA_HASIL = ['awan-awan setuju, tapi mau lembur dulu', 'langit menjawab "nanti saya pikirkan"', 'awan sudah memproses, tinggal menunggu persetujuan matahari', 'hujan cokelat turun di tepat satu rumah, rumah tetanggamu', 'gagal: BMKG tidak bisa dihubungi karena sedang rapat', 'berhasil! Tapi hanya di atas kepalamu saja, selama 4 detik']
const UANG_GAGAL = ['mesin penggandaan meledak jadi konfeti', 'uang berhasil jadi dua, tapi dua-duanya bernilai setengah', 'uangmu pindah ke dimensi di mana rupiah jadi sayur', 'penggandaan sukses, lalu pajak dunia gaib memotong semuanya', 'dompetmu menolak dengan alasan "belum waktunya"', 'uang malah jadi uang mainan Monopoli']
const TUKAR_AKIBAT = ['{a} sekarang takut kecoa, {b} sekarang jago bahasa asing', '{a} mendadak suka bangun jam 4 pagi, {b} mendadak suka rebahan', '{a} jadi pintar masak, {b} jadi ahli membakar air', '{a} jadi sangat sabar, {b} jadi mudah panik lihat notifikasi', '{a} dan {b} sama-sama bingung dengan tangannya sendiri', '{a} jadi bijak, {b} jadi tukang meme']
const HEWAN = {
  kucing: ['meong', 'meooong', 'mrrrow', 'prrr'], anjing: ['guk', 'gukguk', 'wuf', 'grrr'], ayam: ['kukuruyuk', 'petok', 'kok kok', 'cip cip'], sapi: ['moooo', 'mooo', 'mooh'], bebek: ['kwek', 'kwek kwek', 'kuak'], kambing: ['mbeee', 'mbek', 'meeek'], katak: ['kung', 'kurr kurr', 'kwok'], singa: ['groaar', 'rawr', 'graah'], burung: ['cuit', 'cit cit', 'kicau'], lebah: ['bzzz', 'bzz bzz', 'ngiing'], ular: ['ssss', 'sssh', 'hsss'], babi: ['oink', 'ngok', 'oink oink'], domba: ['mbeek', 'baaa', 'mbee'], kuda: ['hihihi', 'ngiiik', 'hii'], monyet: ['uuk', 'ooh ooh', 'ak ak'],
}
const BICARA_ARTI = ['(Artinya: "tolong ambilkan makanan, sekarang.")', '(Artinya: "tadi pagi saya sudah makan, tapi saya lupa.")', '(Artinya: "kamu siapa? ... ya sudah, tetap kasih makan.")', '(Artinya: "saya sebenarnya paham semua gosip di rumah ini.")', '(Artinya: "tolong jangan bilang siapa-siapa.")', '(Artinya: "wifi di sini lemot.")']


const CMDS = {
  async teleport({ m, args, reply, prefix }) {
    const to = args.join(' ').trim().slice(0, 60); if (!to) return reply(`Contoh: ${prefix}teleport Bulan\nBot akan mencoba memindahkanmu ke sana (tentu saja mustahil).`)
    const ok = pct() > 92, got = ok ? to : pick(TELE_DIM)
    return reply(`${head('TELEPORT')}Tujuan : ${to}\nEnergi : ${rint(7, 100)}% • Koordinat tak terbaca\n${ok ? `✓ Berhasil sampai di *${to}*… tapi hanya dalam imajinasimu.` : `✕ Gagal. Kamu tersangkut di *${got}*.`}${NOTE}`)
  },
  async kloning({ m, reply }) {
    const t = target(m) || m.sender, r = pct(), c = pick(KLON_CACAT), c2 = pick(KLON_CACAT)
    return m.conn_send({ text: `${head('KLONING')}Subjek  : ${tag(t)}\nKemiripan : ${r}%\nStabil  : ${rint(1, 99)}%\nCacat 1 : ${c}\nCacat 2 : ${c2 === c ? 'tidak mau diklon lagi' : c2}\n\nSalinan lari ke arah dapur dan belum kembali.${NOTE}`, mentions: [t] })
  },
  async dimensi({ m, reply }) {
    const r = seeded('dimensi', m.sender, today()), dim = `D-${rint(1000, 9999, r)}`, v = pick(DIM_VERSI, r), s = pick(DIM_VERSI, r)
    return reply(`${head('KUNJUNGAN DIMENSI')}Kamu menembus portal ke *${dim}*.\nDi sana kamu adalah ${v}.\nTemanmu yang paling dekat di sana adalah ${s}.\nKesamaan dengan dunia asalmu: ${rint(1, 63, r)}%.\n_Hasil tetap untuk hari ini; besok portalnya pindah._${NOTE}`)
  },
  async sulap({ m, args, reply, prefix }) {
    const t = args.join(' '), mm = t.match(/^(.+?)\s+(?:jadi|menjadi|->|→)\s+(.+)$/i)
    if (!mm) return reply(`Contoh: ${prefix}sulap sendal jadi pesawat`)
    const a = mm[1].trim().slice(0, 40), b = mm[2].trim().slice(0, 40), ok = pct() > 80
    return reply(`${head('SULAP')}*Sim salabim!* ✨\n${ok ? `${a} berubah jadi ${b}… sekejap saja, lalu kembali jadi ${a} karena lupa bayar listrik.` : pick([`${a} malah berubah jadi ${a} yang sedikit lebih ngambek.`, `${a} menolak jadi ${b} dan minta kontrak tertulis.`, `${a} berubah jadi ${b} tapi hanya terlihat oleh kucing.`, `Pesulap pingsan. ${a} tetap ${a}.`])}${NOTE}`)
  },
  async tambahumur({ m, reply }) {
    const th = rint(1, 120), harga = rint(1, 9999) * 1000
    return reply(`${head('TAMBAH UMUR')}Paket: +${th} tahun\nHarga: Rp${harga.toLocaleString('id-ID')} (cicilan 36 bulan)\nStatus: ${pick(['ditolak, umurmu sedang tidak ada stok', 'berhasil, tetapi dihitungnya mulai tahun 3025', 'berhasil, hanya saja kamu hanya boleh memakainya hari Selasa', 'gagal: malaikat pencatat amal sedang istirahat siang'])}${NOTE}`)
  },
  async hapusingatan({ m, reply }) {
    const t = target(m) || m.sender, lupa = pick(['nama mantan', 'kata sandi WiFi rumah', 'cara bersin', 'alasan masuk ke ruangan ini', 'semua lirik lagu favorit', 'nama sendiri selama 3 detik', 'hutang kecil di warung'])
    return m.conn_send({ text: `${head('HAPUS INGATAN')}${tag(t)} sekarang lupa: *${lupa}*.\nEfek samping: ${pick(['ingat hal yang tidak pernah terjadi', 'mengaku jadi raja di dunia lain', 'lapar tapi tidak tahu kenapa', 'terus bertanya "tadi ngapain ya?"'])}${NOTE}`, mentions: [t] })
  },
  async pinjamiq({ m, args, reply, prefix }) {
    const t = target(m), n = parseInt(args.find((a) => /^\d{1,3}$/.test(a)) || '', 10)
    if (!t || !n) return reply(`Contoh: ${prefix}pinjamiq @teman 50\nMeminjam IQ dari orang lain (mustahil, IQ tidak bisa dipindah).`)
    const ok = pct() > 70
    return m.conn_send({ text: `${head('PINJAM IQ')}${tag(m.sender)} meminjam *${n} poin IQ* dari ${tag(t)}.\n${ok ? `Berhasil! Tapi IQ-nya basi karena tidak disimpan di kulkas.` : pick([`Gagal: ${tag(t)} ternyata memang tinggal sedikit.`, `Gagal: IQ-nya tersangkut dan malah balik ke ${tag(t)} dengan bunga 20%.`, 'Gagal: IQ tidak bisa dibawa lewat WhatsApp.'])}${NOTE}`, mentions: [m.sender, t] })
  },
  async nolgravitasi({ m, reply }) {
    const tinggi = rint(2, 300), lama = rint(3, 99)
    return reply(`${head('GRAVITASI NOL')}Gravitasi dimatikan selama ${lama} detik.\nKamu melayang setinggi ${tinggi} cm dan terus naik. Ponselmu ikut melayang, tapi sinyalnya tetap tertinggal di bawah.\n${pick(['Es tehmu membentuk bola di udara.', 'Kucingmu sudah di langit-langit, tidak mau turun.', 'Celanamu aman. Sandalmu tidak.', 'Semua remahan di meja ikut naik. Misteri hilangnya remah terpecahkan.'])}${NOTE}`)
  },
  async tukarjiwa({ m, reply, prefix }) {
    const t = target(m); if (!t) return reply(`Contoh: ${prefix}tukarjiwa @teman`)
    const txt = pick(TUKAR_AKIBAT).replace(/\{a\}/g, tag(m.sender)).replace(/\{b\}/g, tag(t))
    return m.conn_send({ text: `${head('TUKAR JIWA')}${tag(m.sender)} ⇄ ${tag(t)}\nDurasi: ${rint(1, 24)} jam (atau sampai ada yang sadar)\n${txt}${NOTE}`, mentions: [m.sender, t] })
  },
  async gandakanuang({ m, args, reply, prefix }) {
    const n = parseInt(String(args[0] || '').replace(/\D/g, ''), 10)
    if (!n) return reply(`Contoh: ${prefix}gandakanuang 100000\n(Penggandaan uang mustahil dan tidak pernah ada. Hati-hati dengan yang menawarkan sungguhan: itu penipuan.)`)
    return reply(`${head('GANDAKAN UANG')}Modal : Rp${n.toLocaleString('id-ID')}\nHasil : ${pick(UANG_GAGAL)}\nSaldo kini : Rp${Math.floor(n * (pct() / 100)).toLocaleString('id-ID')}\n\n⚠️ Ini candaan. Penggandaan uang di dunia nyata adalah penipuan.${NOTE}`)
  },
  async ubahcuaca({ args, reply, prefix }) {
    const w = args.join(' ').trim().slice(0, 40); if (!w) return reply(`Contoh: ${prefix}ubahcuaca salju`)
    return reply(`${head('UBAH CUACA')}Permintaan: *${w}*\n${pick(CUACA_HASIL)}\nPrakiraan akhir: ${pick(['cerah berawan, tapi hatimu mendung', 'hujan ringan di pikiran', 'berangin kencang ke arah tetangga', 'kabut tebal, mantan tidak terlihat'])}${NOTE}`)
  },
  async bangkitkan({ args, reply, prefix }) {
    const b = args.join(' ').trim().slice(0, 40); if (!b) return reply(`Contoh: ${prefix}bangkitkan sendal jepit\nMembangkitkan benda mati (mustahil).`)
    return reply(`${head('BANGKITKAN')}*${b}* ${pick(BENDA_HIDUP)}.\nUmur baru: ${rint(1, 999)} tahun • Mood: ${pick(['cemberut', 'sangat bersemangat', 'bingung', 'lapar'])}${NOTE}`)
  },
  async bicarahewan({ args, reply, prefix }) {
    const h = (args[0] || '').toLowerCase(), isi = args.slice(1).join(' ').trim().slice(0, 120)
    if (!HEWAN[h] || !isi) return reply(`Contoh: ${prefix}bicarahewan kucing aku lapar\nHewan: ${Object.keys(HEWAN).join(', ')}`)
    const out = isi.split(/\s+/).map((w) => pick(HEWAN[h]) + (w.length > 5 ? '!' : '')).join(' ')
    return reply(`${head('PENERJEMAH HEWAN')}Kamu → ${h}:\n${out}\n\n${pick(BICARA_ARTI)}${NOTE}`)
  },
  async hentikanwaktu({ m, args, reply }) {
    const d = Math.max(1, Math.min(600, parseInt(args[0], 10) || rint(5, 60))), jam = new Date().toLocaleTimeString('id-ID', { hour12: false })
    return reply(`${head('HENTIKAN WAKTU')}Waktu dihentikan selama *${d} detik*.\nJam sekarang : ${jam}\nJam setelah  : ${jam} (tidak berubah, sesuai rencana)\n${pick(['Tapi tagihanmu tetap berjalan.', 'Deadline tidak ikut berhenti. Sayang sekali.', 'Satu-satunya yang bergerak hanya kuota internetmu.', 'Kamu sempat mengambil napas, itu saja.'])}${NOTE}`)
  },
  async paspor({ sock, m, reply }) {
    const r = seeded('paspor', m.sender), nama = String(m.pushName || num(m.sender)).replace(/[^\p{L}\p{N} ._-]/gu, '').slice(0, 24) || 'Pelancong'
    const asal = pick(['Bumi (versi cadangan)', 'Planet Kentang', 'Nebula Warteg', 'Asteroid Rebahan', 'Galaksi Kopi Hitam', 'Bulan Sisi Gelap'], r)
    const visa = pick(['Visa Tak Terbatas (masa berlaku 1 detik)', 'Visa Wisata Antar Dimensi', 'Visa Tanpa Bagasi', 'Visa Khusus Pecinta Mi Instan'], r)
    const no = 'DX-' + rint(100000, 999999, r) + '-' + String.fromCharCode(65 + rint(0, 25, r))
    const exp = `${rint(1, 28, r)}/${rint(1, 12, r)}/${rint(3000, 9999, r)}`
    const E = AJ.esc
    const row = (y, k, v) => `<text x="60" y="${y}" font-size="20" fill="#d9b66b" font-family="sans-serif">${E(k)}</text><text x="270" y="${y}" font-size="26" fill="#f4ecd8" font-family="sans-serif">${E(v)}</text>`
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="520"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a1a4a"/><stop offset="1" stop-color="#0e0a1c"/></linearGradient></defs><rect width="900" height="520" rx="26" fill="url(#g)"/><rect x="14" y="14" width="872" height="492" rx="20" fill="none" stroke="#d9b66b" stroke-width="3"/><text x="450" y="78" text-anchor="middle" font-size="34" fill="#d9b66b" font-family="serif" letter-spacing="6">PASPOR ANTAR DIMENSI</text><text x="450" y="108" text-anchor="middle" font-size="18" fill="#9c8bc0" font-family="sans-serif">Republik Tak Terhingga • Chisa AI Immigration</text>${row(190, 'NAMA', nama)}${row(240, 'ASAL', asal)}${row(290, 'NOMOR', no)}${row(340, 'BERLAKU', 'sampai ' + exp)}${row(390, 'VISA', visa)}<text x="450" y="470" text-anchor="middle" font-size="16" fill="#7a6aa0" font-family="sans-serif">Dokumen hiburan — tidak sah di dimensi mana pun</text></svg>`
    try {
      const sharp = require('../../lib/sharp.js'), img = await sharp(Buffer.from(svg)).png().toBuffer()
      return sock.sendMessage(m.chat, { image: img, caption: `✦ Paspor antar dimensimu sudah terbit.${NOTE}` }, { quoted: m })
    } catch (e) { return reply(`${head('PASPOR')}Nama : ${nama}\nAsal : ${asal}\nNomor: ${no}\nBerlaku: sampai ${exp}\nVisa : ${visa}${NOTE}`) }
  },
}

const LIST = Object.keys(CMDS)
module.exports = {
  name: 'mustahil', alias: LIST, category: 'ajaib', noLimit: true, cmds: LIST, menu: LIST,
  desc: 'Fitur mustahil & tidak masuk akal (hiburan): teleport, kloning, dimensi, sulap, tukar jiwa, pinjam IQ, hentikan waktu, paspor antar dimensi, dll',
  run: async (ctx) => {
    const { sock, m, command, reply } = ctx
    const fn = CMDS[String(command).toLowerCase()]
    if (!fn) return reply(`✦ ${B('FITUR MUSTAHIL')}\n${LIST.map((c) => '◇ ' + ctx.prefix + c).join('\n')}${NOTE}`)
    m.conn_send = (content) => sock.sendMessage(m.chat, content, { quoted: m })
    try { return await fn(ctx) } catch (e) { console.log('[mustahil]', command, e.message); return reply('✕ Fitur mustahil ini gagal (padahal sudah mustahil dari awal).') }
  },
}
