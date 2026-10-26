/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Data referensi Indonesia (offline): operator seluler dari prefix, kode plat nomor, kode bank untuk transfer.
// Data bersifat panduan umum: nomor bisa sudah pindah operator, wilayah plat/kode bank dapat berubah — selalu cek sumber resmi untuk urusan penting.
//   .operator <nomor> • .plat <kode|wilayah> • .kodebank [nama|kode]
const { B } = require('../../lib/style')
const OP = { Telkomsel: '0811 0812 0813 0821 0822 0823 0851 0852 0853', Indosat: '0814 0815 0816 0855 0856 0857 0858', XL: '0817 0818 0819 0859 0877 0878', Axis: '0831 0832 0833 0838', Tri: '0895 0896 0897 0898 0899', Smartfren: '0881 0882 0883 0884 0885 0886 0887 0888 0889' }
const PREFIX = {}; for (const [o, ps] of Object.entries(OP)) for (const p of ps.split(' ')) PREFIX[p] = o
const PLAT = { A: 'Banten (Serang, Tangerang Kab., dll)', B: 'DKI Jakarta, Depok, Bekasi, Tangerang (Jabodetabek)', D: 'Bandung & sekitarnya', E: 'Cirebon, Indramayu, Majalengka, Kuningan', F: 'Bogor, Cianjur, Sukabumi', T: 'Karawang, Purwakarta, Subang', Z: 'Garut, Sumedang, Tasikmalaya, Ciamis', H: 'Semarang & sekitarnya', G: 'Pekalongan, Tegal, Brebes, Batang', K: 'Pati, Kudus, Jepara, Blora', R: 'Banyumas, Purwokerto, Cilacap', AA: 'Kedu (Magelang, Purworejo, Temanggung)', AB: 'DI Yogyakarta', AD: 'Surakarta (Solo), Sukoharjo, Klaten', AE: 'Madiun, Ngawi, Magetan', AG: 'Kediri, Blitar, Tulungagung', L: 'Surabaya', M: 'Madura', N: 'Malang, Pasuruan, Probolinggo', P: 'Besuki (Jember, Banyuwangi, Situbondo)', S: 'Bojonegoro, Lamongan, Tuban, Mojokerto', W: 'Sidoarjo, Gresik', BL: 'Aceh', BB: 'Tapanuli (Sumut bagian barat)', BK: 'Medan & Sumatera Utara', BA: 'Sumatera Barat', BM: 'Riau', BP: 'Kepulauan Riau (Batam, Tanjungpinang)', BH: 'Jambi', BG: 'Sumatera Selatan', BN: 'Kepulauan Bangka Belitung', BD: 'Bengkulu', BE: 'Lampung', KB: 'Kalimantan Barat', KH: 'Kalimantan Tengah', DA: 'Kalimantan Selatan', KT: 'Kalimantan Timur', KU: 'Kalimantan Utara', DK: 'Bali', DR: 'Lombok (NTB)', EA: 'Sumbawa (NTB)', DH: 'NTT (Kupang, Timor)', EB: 'Flores (NTT)', ED: 'Sumba (NTT)', DD: 'Sulawesi Selatan', DC: 'Sulawesi Barat', DT: 'Sulawesi Tenggara', DN: 'Sulawesi Tengah', DM: 'Gorontalo', DB: 'Sulawesi Utara (Manado)', DL: 'Kep. Sangihe & Talaud (Sulut)', DE: 'Maluku', DG: 'Maluku Utara', DS: 'Papua' }
const BANK = [['BRI', '002'], ['Mandiri', '008'], ['BNI', '009'], ['Danamon', '011'], ['Permata', '013'], ['BCA', '014'], ['Maybank', '016'], ['Panin', '019'], ['CIMB Niaga', '022'], ['UOB', '023'], ['OCBC NISP', '028'], ['Citibank', '031'], ['Standard Chartered', '050'], ['DBS', '046'], ['HSBC', '087'], ['BJB', '110'], ['Bank DKI', '111'], ['BPD Jateng', '113'], ['BPD Jatim', '114'], ['BPD Bali', '129'], ['Muamalat', '147'], ['BTN', '200'], ['BTPN / Jenius', '213'], ['Mega', '426'], ['BSI (Bank Syariah Indonesia)', '451'], ['Neo Commerce', '490'], ['SeaBank', '535'], ['Bank Jago', '542'], ['Allo Bank', '567']]
const norm = (n) => { let d = String(n || '').replace(/[^\d+]/g, ''); if (d.startsWith('+62')) d = '0' + d.slice(3); else if (d.startsWith('62')) d = '0' + d.slice(2); else if (d.startsWith('8')) d = '0' + d; return d }
module.exports = {
  name: 'indodata', alias: ['operator', 'plat', 'kodebank', 'cekoperator', 'platnomor'], category: 'tools', noLimit: true, cmds: ['operator', 'plat', 'kodebank'],
  desc: 'Referensi Indonesia offline: operator seluler dari nomor, kode plat kendaraan, kode bank transfer',
  run: async ({ m, command, args, prefix, reply }) => {
    const q = args.join(' ').trim()
    if (command === 'operator' || command === 'cekoperator') {
      const d = norm(q || (m.quoted && (m.quoted.text || m.quoted.caption)) || ''); if (!/^08\d{8,12}$/.test(d)) return reply(`📱 ${B('CEK OPERATOR')}\n${prefix}operator 081234567890\n${prefix}operator +62 857-1234-5678`)
      const op = PREFIX[d.slice(0, 4)]
      return reply(`📱 ${B('CEK OPERATOR')}\n┣ Nomor    : ${d.replace(/^0/, '+62 ').replace(/(\d{3})(\d{4})(\d+)$/, '$1-$2-$3')}\n┣ Prefix   : ${d.slice(0, 4)}\n┗ Operator : *${op || 'tidak dikenali'}*\n_Berdasarkan prefix awal. Nomor bisa sudah dipindah operator (portabilitas)._`)
    }
    if (command === 'plat' || command === 'platnomor') {
      if (!q) return reply(`🚗 ${B('KODE PLAT NOMOR')}\n${prefix}plat B\n${prefix}plat AB\n${prefix}plat bandung  _(cari nama wilayah)_`)
      const code = q.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2)
      if (/^[a-z]{1,2}$/i.test(q.replace(/\s/g, '')) && PLAT[code]) return reply(`🚗 ${B('KODE PLAT')} ${code}\n${PLAT[code]}`)
      const hits = Object.entries(PLAT).filter(([, v]) => v.toLowerCase().includes(q.toLowerCase())).slice(0, 12)
      return reply(hits.length ? `🚗 ${B('KODE PLAT')} — "${q}"\n${hits.map(([k, v]) => `*${k}* — ${v}`).join('\n')}` : `✕ "${q}" tidak ditemukan. Contoh: ${prefix}plat B • ${prefix}plat bali`)
    }
    if (!q) return reply(`🏦 ${B('KODE BANK')} (transfer antarbank)\n${BANK.slice(0, 14).map(([n, c]) => `${c} — ${n}`).join('\n')}\n\n_Cari: ${prefix}kodebank jago • ${prefix}kodebank 014 • ${prefix}kodebank semua_`)
    const list = /^(semua|all)$/i.test(q) ? BANK : BANK.filter(([n, c]) => n.toLowerCase().includes(q.toLowerCase()) || c === q.replace(/\D/g, '').padStart(3, '0') && /\d/.test(q))
    return reply(list.length ? `🏦 ${B('KODE BANK')}\n${list.map(([n, c]) => `${c} — ${n}`).join('\n')}\n_Panduan umum; cek aplikasi bank/penerima untuk kepastian._` : `✕ Bank "${q}" tidak ada di daftar. Coba ${prefix}kodebank semua`)
  },
}
