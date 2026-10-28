/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Hiburan grup: truth, dare, ship, cek khodam, rate
const { targets, tag } = require('../../lib/grouputil')
const ST = require('../../lib/style')

const TRUTH = ['Hal paling memalukan yang pernah kamu alami di depan umum?', 'Siapa orang terakhir yang kamu stalk di sosmed?', 'Kebohongan terbesar yang pernah kamu ucapkan?', 'Kebiasaan aneh apa yang kamu sembunyikan dari orang lain?', 'Pernah suka sama teman sendiri? Siapa?', 'Barang apa yang paling kamu sesali pernah dibeli?', 'Hal apa yang paling kamu takutkan diam-diam?', 'Kapan terakhir kali kamu menangis, dan kenapa?', 'Chat apa di HP-mu yang paling tidak ingin dibaca orang lain?', 'Apa rahasia kecil yang belum pernah kamu ceritakan ke grup ini?', 'Siapa di grup ini yang paling sering kamu bicarakan di belakang (yang baik-baik saja)?', 'Mimpi teraneh apa yang pernah kamu alami?', 'Kalau bisa mengulang satu hari, hari yang mana?', 'Apa nama panggilan masa kecilmu yang paling memalukan?', 'Hal paling nekat yang pernah kamu lakukan demi seseorang?']
const DARE = ['Kirim voice note menyanyikan lagu apa saja, 10 detik!', 'Ganti foto profilmu jadi foto hewan pilihan grup selama 1 jam.', 'Tulis pantun gombal untuk admin grup ini.', 'Kirim stiker paling aneh yang kamu punya.', 'Ketik pesan berikutnya tanpa huruf A.', 'Ceritakan lelucon, kalau tidak ada yang tertawa kamu ulang.', 'Kirim selfie wajah konyol (boleh ditutup stiker).', 'Panggil semua anggota dengan awalan "Kak" selama 10 menit.', 'Tulis 5 hal yang kamu syukuri hari ini.', 'Tirukan suara hewan lewat voice note.', 'Bilang "aku paling ganteng/cantik sedunia" ke grup ini 3 kali.', 'Kirim quotes paling lebay buatanmu sendiri.', 'Ganti nama WhatsApp-mu jadi "Budak Grup" selama 30 menit.', 'Kirim emoji favoritmu tanpa penjelasan, lalu biarkan grup menebak artinya.', 'Puji orang terakhir yang chat di grup dengan 3 kalimat.']
const KHODAM = [['Macan Putih', 'Berwibawa, tapi tidurnya lama.'], ['Kuntilanak Online', 'Muncul tiap sinyal bagus.'], ['Naga Wi-Fi', 'Kuat kalau dekat router.'], ['Pocong Rebahan', 'Sakti, tapi malas bergerak.'], ['Garuda Diskon', 'Terbang tinggi saat ada promo.'], ['Kucing Oren Penjaga Warung', 'Cuek tapi dicintai semua orang.'], ['Genderuwo Healing', 'Suka liburan di tempat sepi.'], ['Dewa Mabar', 'Selalu ready, jarang menang.'], ['Kuda Lumping Lembur', 'Tak kenal lelah demi gaji.'], ['Ular Sanca Deadline', 'Melilit saat tugas menumpuk.'], ['Siluman Kopi', 'Kekuatan penuh setelah jam 10 pagi.'], ['Burung Hantu Begadang', 'Aktif jam 2 pagi, bingung kenapa.'], ['Singa Paket Data', 'Menggeram tiap kuota menipis.'], ['Tuyul Receh', 'Rajin mengumpulkan uang kembalian.'], ['Harimau Jawa Sunyi', 'Pendiam, sekali bicara semua diam.']]
const RATE = ['kegantengan', 'kecantikan', 'kecerdasan', 'kejombloan', 'kegabutan', 'kebucinan', 'kemalasan', 'ketampanan']

const hash = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) } return Math.abs(h >>> 0) }
const pick = (a) => a[Math.floor(Math.random() * a.length)]
const bar = (p) => '█'.repeat(Math.round(p / 10)) + '░'.repeat(10 - Math.round(p / 10))
const H = (t) => `${ST.B(t)}\n━━━━━━━━━━━━━━━━━━━━\n`
const shipNote = (p) => p >= 90 ? 'Jodoh sejati, tinggal tanggal.' : p >= 70 ? 'Cocok banget, jangan disia-siakan.' : p >= 50 ? 'Lumayan, perlu usaha bersama.' : p >= 30 ? 'Masih jauh, tapi bukan mustahil.' : 'Lebih baik berteman dulu.'

module.exports = {
  name: 'truth', alias: ['dare', 'tod', 'ship', 'jodoh', 'khodam', 'cekkhodam', 'rate', 'seberapa'],
  category: 'fun', cmds: ['truth', 'dare', 'ship', 'khodam', 'rate'],
  desc: 'Hiburan grup: truth, dare, ship pasangan, cek khodam, dan rate',
  run: async ({ sock, m, reply, text, command, prefix, pushName }) => {
    const send = (t, mentions = []) => sock.sendMessage(m.chat, { text: t, mentions }, { quoted: m })
    if (command === 'truth') return reply(H('TRUTH') + pick(TRUTH))
    if (command === 'dare') return reply(H('DARE') + pick(DARE))
    if (command === 'tod') return reply(H(Math.random() < 0.5 ? 'TRUTH' : 'DARE') + pick([...TRUTH, ...DARE]))
    if (['ship', 'jodoh'].includes(command)) {
      let t = targets(m, text)
      if (t.length === 1) t.unshift(m.sender)
      if (t.length < 2) return reply(`Tandai dua orang.\nContoh: ${prefix}ship @a @b  (atau reply satu orang untuk dipasangkan denganmu)`)
      const [a, b] = t.slice(0, 2), p = hash([a, b].sort().join('|')) % 101
      return send(`${H('SHIP')}${tag(a)} + ${tag(b)}\n\n${bar(p)} *${p}%*\n${shipNote(p)}`, [a, b])
    }
    if (['khodam', 'cekkhodam'].includes(command)) {
      const t = targets(m, text)[0], who = t || m.sender, label = t ? tag(t) : (pushName ? pushName : tag(m.sender))
      const kh = KHODAM[hash(who) % KHODAM.length]
      return send(`${H('CEK KHODAM')}Khodam ${label}:\n*${kh[0]}*\n_${kh[1]}_\n\n_Hanya hiburan._`, [who])
    }
    // rate
    const topic = RATE.find(r => text.toLowerCase().includes(r))
    const t = targets(m, text)[0] || m.sender
    const what = topic || RATE[hash(t + new Date().toDateString()) % RATE.length]
    const p = hash(t + what + new Date().toDateString()) % 101
    return send(`${H('RATE')}Tingkat ${what} ${tag(t)}\n\n${bar(p)} *${p}%*\n\n_Berubah tiap hari. Hanya hiburan._\n_Pilihan: ${RATE.join(', ')}_`, [t])
  },
}
