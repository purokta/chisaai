/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .telepati — bot "membaca pikiranmu"
//   .telepati angka   -> pikirkan angka 1-63, jawab ya/tidak untuk 6 kartu, bot menyebut angkamu
//   .telepati 1089    -> trik hitung yang SELALU berakhir di angka yang sama
//   .telepati hewan   -> pikirkan seekor hewan; bot menebak lewat pertanyaan ya/tidak.
//                        Kalau salah, bot BELAJAR hewan & pertanyaan baru dari kamu (pengetahuan dipakai semua pengguna)
//   .telepati stop    -> hentikan sesi  •  .telepati reset (owner) -> kembalikan otak hewan ke awal
const { B } = require('../../lib/style'), AJ = require('../../lib/ajaib')

const DB = AJ.store('telepati.json', null)
const SEED = () => ({
  tree: { q: 'Apakah hewan itu hidup di dalam air?',
    y: { q: 'Apakah dia mamalia (menyusui anaknya)?', y: { a: 'lumba-lumba' }, n: { a: 'ikan' } },
    n: { q: 'Apakah dia bisa terbang?',
      y: { q: 'Apakah dia aktif di malam hari dan tidur menggantung?', y: { a: 'kelelawar' }, n: { a: 'burung' } },
      n: { q: 'Apakah dia sering dipelihara di rumah?',
        y: { q: 'Apakah dia suka mengeong?', y: { a: 'kucing' }, n: { a: 'anjing' } },
        n: { q: 'Apakah tubuhnya sangat besar dan berbelalai?', y: { a: 'gajah' },
          n: { q: 'Apakah dia tidak berkaki dan melata?', y: { a: 'ular' },
            n: { q: 'Apakah dia pemakan daging yang buas?', y: { a: 'harimau' }, n: { a: 'kelinci' } } } } } } },
  stats: { play: 0, win: 0, learned: 0 } })
const db = () => { if (!DB.get() || !DB.get().tree) DB.set(SEED()); return DB.get() }
const countLeaves = (n) => (n.a !== undefined ? 1 : countLeaves(n.y) + countLeaves(n.n))

const sessions = new Map(), IDLE = 180e3
const keyOf = (m) => `${m.chat}|${m.sender}`
const stop = (k) => { const s = sessions.get(k); if (s) clearTimeout(s.tm); sessions.delete(k) }
function arm(sock, m, k, s) { clearTimeout(s.tm); s.tm = setTimeout(() => { if (sessions.get(k) === s) { sessions.delete(k); sock.sendMessage(m.chat, { text: '✦ Telepati terputus karena kamu diam terlalu lama. Mulai lagi kapan saja.' }).catch(() => {}) } }, IDLE); sessions.set(k, s) }

const YES = new Set(['ya', 'y', 'iya', 'yes', 'yup', 'betul', 'benar', 'ok', 'oke', 'ada', 'yoi', 'yap', 'iyaa', 'iyah'])
const NO = new Set(['tidak', 't', 'no', 'n', 'bukan', 'enggak', 'nggak', 'gak', 'ga', 'ndak', 'nope', 'engga', 'tdk', 'tak', 'ngga'])
const yn = (s) => { const x = String(s || '').trim().toLowerCase().replace(/[^a-z]/g, ''); return YES.has(x) ? true : NO.has(x) ? false : null }

// ── KARTU ANGKA (kode biner) ──
const card = (bit) => { const a = []; for (let n = 1; n <= 63; n++) if (n & (1 << bit)) a.push(n); return a }
const showCard = (i) => `${B('KARTU ' + (i + 1) + ' / 6')}\n${card(i).join('  ')}\n\nAdakah angkamu di kartu ini? *ya* / *tidak*`

// ── 1089 ──
const T1089 = (p) => `✦ ${B('TRIK 1089')}\n\nIkuti dalam hati (jangan kirim apa-apa):\n1. Pilih angka *3 digit* yang digitnya berbeda dan tidak berurutan sama (mis. 8-4-2, bukan 111).\n2. Balik urutannya, lalu *kurangkan* yang besar dengan yang kecil.\n3. Balik hasilnya (kalau hanya 2 digit, anggap ada angka 0 di depan, mis. 099 → 990).\n4. *Jumlahkan* hasil langkah 2 dan hasil langkah 3.\n\nSudah? Aku tahu hasilnya tanpa kamu beri tahu…\nKetik *${p}telepati 1089 buka* untuk melihat tebakanku.`
const OPEN1089 = `✦ Hasilnya *1089*, bukan?\n\nBeginilah caranya: selisih angka dan baliknya selalu kelipatan 99, dan bila dibalik lalu dijumlahkan, hasilnya selalu 1089. Ini sifat matematika, bukan sihir… atau memang sihir yang berpakaian matematika.`

function ask(sess) {
  const n = sess.node
  if (n.a !== undefined) { sess.stage = 'confirm'; return `Aku tahu! Kamu memikirkan *${n.a}*, kan? (ya/tidak)` }
  sess.stage = 'ask'; sess.n++
  return `${B('Pertanyaan ' + sess.n)}\n${n.q} (ya/tidak)`
}
const okText = (t, max) => { const s = String(t || '').replace(/\s+/g, ' ').trim(); return s.length >= 2 && s.length <= max && !/https?:|www\.|\.com|@|[<>{}\\|]|[\u200B-\u200F\u202A-\u202E]/i.test(s) ? s : null }

module.exports = {
  name: 'telepati', alias: ['bacapikiran', 'sihir', 'mindread'], category: 'ajaib', noLimit: true, cmds: ['telepati'],
  desc: 'Bot membaca pikiranmu: tebak angka 1-63, trik 1089, dan tebak hewan yang bisa belajar sendiri',
  run: async ({ sock, m, args, prefix, isCreator, reply }) => {
    const k = keyOf(m), sub = (args[0] || '').toLowerCase(), D = db()
    if (sub === 'stop' || sub === 'berhenti') { const had = sessions.has(k); stop(k); return reply(had ? 'Sesi telepati dihentikan.' : 'Tidak ada sesi yang berjalan.') }
    if (sub === 'reset') { if (!isCreator) return reply(global.mess ? global.mess.owner : 'Khusus owner.'); DB.set(SEED()); DB.save(); return reply('✦ Otak hewan dikembalikan ke pengaturan awal.') }
    if (sub === 'angka') {
      const s = { mode: 'angka', i: 0, sum: 0 }; arm(sock, m, k, s)
      return reply(`✦ ${B('BACA ANGKA')}\nPikirkan *satu angka dari 1 sampai 63*. Jangan sebut. Aku akan menunjukkan 6 kartu; jawab *ya* bila angkamu ada di kartu itu, *tidak* bila tidak.\n\n${showCard(0)}`)
    }
    if (sub === '1089') return reply(args[1] === 'buka' ? OPEN1089 : T1089(prefix))
    if (sub === 'hewan') {
      D.stats.play++; DB.save()
      const s = { mode: 'hewan', node: D.tree, parent: null, side: null, n: 0, stage: 'ask' }; arm(sock, m, k, s)
      return reply(`✦ ${B('TEBAK HEWAN')}\nPikirkan *seekor hewan*, rahasiakan. Jawab pertanyaanku dengan *ya* atau *tidak*.\nPengetahuanku: ${countLeaves(D.tree)} hewan (makin sering dimainkan makin pintar). Berhenti: ${prefix}telepati stop\n\n${ask(s)}`)
    }
    return reply(`✦ ${B('TELEPATI')}\nAku akan "membaca pikiranmu".\n\n${prefix}telepati angka   : tebak angka 1-63 (6 kartu)\n${prefix}telepati 1089     : trik hitung yang selalu sampai ke angka yang sama\n${prefix}telepati hewan    : tebak hewan; kalau salah, aku belajar dari kamu\n\nStatistik otak hewan: ${countLeaves(D.tree)} hewan dikenal • ${D.stats.play} permainan • ${D.stats.win} tebakan benar • ${D.stats.learned} hewan dipelajari dari pemain`)
  },
  before: async ({ sock, m, budy, reply }) => {
    const k = keyOf(m), s = sessions.get(k); if (!s || !budy || budy.length > 120) return false
    const D = db()
    if (s.mode === 'angka') {
      const v = yn(budy); if (v === null) return false
      if (v) s.sum += 1 << s.i
      s.i++
      if (s.i < 6) { arm(sock, m, k, s); await reply(showCard(s.i)); return true }
      stop(k)
      if (!s.sum) { await reply('Hm, kamu menjawab *tidak* untuk semua kartu. Angka 1-63 pasti muncul di salah satu kartu, jadi kamu memikirkan 0 atau angka di luar jangkauan. Coba lagi: .telepati angka'); return true }
      await reply(`✦ Sebentar… aku menangkap gelombang pikiranmu…\n\nKamu memikirkan angka *${s.sum}*!\n\n_Triknya: tiap kartu mewakili satu bit biner (1, 2, 4, 8, 16, 32). Aku tinggal menjumlahkan angka pertama di setiap kartu yang kamu iyakan._`)
      return true
    }
    // ── hewan ──
    if (s.stage === 'ask' || s.stage === 'confirm') {
      const v = yn(budy); if (v === null) return false
      if (s.stage === 'ask') {
        s.parent = s.node; s.side = v ? 'y' : 'n'; s.node = s.node[s.side]
        arm(sock, m, k, s); await reply(ask(s)); return true
      }
      if (v) { D.stats.win++; DB.save(); stop(k); await reply(`✦ Tentu saja! Hanya butuh ${s.n} pertanyaan.\n_Main lagi: .telepati hewan_`); return true }
      s.stage = 'name'; arm(sock, m, k, s)
      await reply('Aku menyerah… Hewan apa yang kamu pikirkan? (ketik namanya)'); return true
    }
    if (s.stage === 'name') {
      const name = okText(budy, 30); if (!name || !/^[\p{L}\p{N} '-]+$/u.test(name)) { await reply('Tulis nama hewannya saja (huruf, maks 30 karakter).'); return true }
      s.newName = name.toLowerCase(); s.stage = 'q'; arm(sock, m, k, s)
      await reply(`Tulis *satu pertanyaan ya/tidak* yang jawabannya *YA* untuk *${s.newName}* tetapi *TIDAK* untuk *${s.node.a}*.\nContoh: Apakah dia punya belang?`); return true
    }
    if (s.stage === 'q') {
      let q = okText(budy, 90); if (!q || q.length < 8) { await reply('Pertanyaannya terlalu pendek/aneh. Tulis pertanyaan ya/tidak yang jelas (8-90 huruf, tanpa tautan).'); return true }
      q = q.replace(/[?？]+$/, '').trim(); q = q.charAt(0).toUpperCase() + q.slice(1) + '?'
      if (countLeaves(D.tree) >= 2000) { stop(k); await reply('Otakku sudah penuh, tidak bisa belajar lagi. Terima kasih sudah bermain!'); return true }
      const node = { q, y: { a: s.newName }, n: { a: s.node.a } }
      if (s.parent) s.parent[s.side] = node; else D.tree = node
      D.stats.learned++; DB.save(); stop(k)
      await reply(`✦ Terima kasih! Sekarang aku tahu *${s.newName}* dan cara membedakannya dari *${node.n.a}*. Otakku: ${countLeaves(D.tree)} hewan.`); return true
    }
    return false
  },
}
