/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .tarot [pertanyaan] — tarik 3 kartu Major Arcana (masa lalu • kini • depan). Hiburan semata; hasil konsisten per orang per hari per pertanyaan
const { B } = require('../../lib/style'), K = require('../../lib/praktis')
const KARTU = [
  ['0 • Si Bodoh (The Fool)', 'awal baru, spontanitas, berani melompat', 'ceroboh, ragu, belum siap'],
  ['I • Penyihir (The Magician)', 'kemampuan, fokus, sumber daya cukup', 'tipu daya, bakat tak terpakai'],
  ['II • Pendeta Wanita (High Priestess)', 'intuisi, rahasia, mendengar batin', 'mengabaikan firasat, informasi tersembunyi'],
  ['III • Permaisuri (The Empress)', 'kelimpahan, kasih sayang, kreativitas', 'terlalu bergantung, kreativitas macet'],
  ['IV • Kaisar (The Emperor)', 'struktur, kepemimpinan, stabilitas', 'kaku, mengatur berlebihan'],
  ['V • Pemuka Agama (Hierophant)', 'tradisi, bimbingan, nilai bersama', 'menentang aturan, ingin jalan sendiri'],
  ['VI • Kekasih (The Lovers)', 'pilihan penting, hubungan, keselarasan nilai', 'ketidakcocokan, ragu memilih'],
  ['VII • Kereta Perang (The Chariot)', 'tekad, kemenangan lewat disiplin', 'kehilangan arah, agresif'],
  ['VIII • Kekuatan (Strength)', 'keberanian lembut, sabar, pengendalian diri', 'ragu pada diri sendiri, mudah marah'],
  ['IX • Pertapa (The Hermit)', 'merenung, mencari makna, menyendiri sejenak', 'terlalu menarik diri, kesepian'],
  ['X • Roda Nasib (Wheel of Fortune)', 'perubahan siklus, peluang datang', 'kemunduran sementara, melawan arus'],
  ['XI • Keadilan (Justice)', 'kejujuran, sebab-akibat, keputusan adil', 'tidak adil, menghindari tanggung jawab'],
  ['XII • Orang Tergantung (Hanged Man)', 'sudut pandang baru, menunggu dengan sadar', 'menunda tanpa arah, pengorbanan sia-sia'],
  ['XIII • Kematian (Death)', 'akhir yang membuka babak baru (bukan kematian harfiah)', 'sulit melepas, takut berubah'],
  ['XIV • Keseimbangan (Temperance)', 'moderasi, harmoni, jalan tengah', 'berlebihan, tidak seimbang'],
  ['XV • Iblis (The Devil)', 'keterikatan, kebiasaan yang mengekang', 'melepaskan diri, sadar akan rantai'],
  ['XVI • Menara (The Tower)', 'guncangan mendadak, kebenaran terungkap', 'menghindari kehancuran, perubahan ditunda'],
  ['XVII • Bintang (The Star)', 'harapan, pemulihan, ketenangan', 'putus asa, kehilangan kepercayaan'],
  ['XVIII • Bulan (The Moon)', 'ilusi, ketidakpastian, perasaan samar', 'kebingungan mereda, rahasia terbuka'],
  ['XIX • Matahari (The Sun)', 'sukacita, keberhasilan, energi positif', 'optimisme berlebihan, kebahagiaan tertunda'],
  ['XX • Penghakiman (Judgement)', 'panggilan untuk bangkit, evaluasi diri', 'ragu pada panggilan, menyalahkan diri'],
  ['XXI • Dunia (The World)', 'penyelesaian, pencapaian utuh', 'hampir selesai, butuh penutupan'],
]
const hash = (s) => { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) } return h >>> 0 }
const rng = (seed) => () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296 }
module.exports = {
  name: 'tarot', alias: ['kartutarot', 'tarik3'], category: 'fun', noLimit: true, cmds: ['tarot'],
  desc: 'Tarik 3 kartu tarot Major Arcana (masa lalu, kini, depan) untuk hiburan',
  run: async ({ m, text, reply }) => {
    const q = String(text || '').trim().slice(0, 120), r = rng(hash(`${m.sender}|${K.dayKey()}|${q.toLowerCase()}`)), idx = []
    while (idx.length < 3) { const i = Math.floor(r() * KARTU.length); if (!idx.includes(i)) idx.push(i) }
    const pos = ['Masa lalu', 'Masa kini', 'Masa depan']
    let t = `✦ ${B('TAROT')}${q ? `\n_"${q}"_` : ''}\n\n`
    idx.forEach((i, n) => { const rev = r() < 0.35, [nm, up, rv] = KARTU[i]; t += `${B(pos[n])} — *${nm}*${rev ? ' (terbalik)' : ''}\n   ${rev ? rv : up}\n\n` })
    return reply(t + '_Hiburan dan bahan refleksi saja, bukan ramalan pasti. Keputusan penting tetap kamu yang pegang._')
  },
}
