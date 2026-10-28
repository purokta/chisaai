/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Al-Qur'an & Asmaul Husna.
//   .quran <surah> [ayat | awal-akhir]   mis. .quran yasin 1-5 • .quran 2:255 • .quran 112   (teks Arab + terjemahan Indonesia)
//   .surah [nama|no]      daftar 114 surah / info satu surah        .ayatacak   satu ayat acak
//   .asmaulhusna [no|nama]  99 nama Allah beserta artinya
// Sumber teks: api.alquran.cloud (gratis, tanpa key). Maks 10 ayat sekali kirim.
const axios = require('axios'), { B } = require('../../lib/style')
const S = `Al-Fatihah:7|Al-Baqarah:286|Ali 'Imran:200|An-Nisa:176|Al-Ma'idah:120|Al-An'am:165|Al-A'raf:206|Al-Anfal:75|At-Taubah:129|Yunus:109|Hud:123|Yusuf:111|Ar-Ra'd:43|Ibrahim:52|Al-Hijr:99|An-Nahl:128|Al-Isra:111|Al-Kahf:110|Maryam:98|Ta Ha:135|Al-Anbiya:112|Al-Hajj:78|Al-Mu'minun:118|An-Nur:64|Al-Furqan:77|Asy-Syu'ara:227|An-Naml:93|Al-Qasas:88|Al-'Ankabut:69|Ar-Rum:60|Luqman:34|As-Sajdah:30|Al-Ahzab:73|Saba:54|Fatir:45|Ya Sin:83|As-Saffat:182|Sad:88|Az-Zumar:75|Ghafir:85|Fussilat:54|Asy-Syura:53|Az-Zukhruf:89|Ad-Dukhan:59|Al-Jasiyah:37|Al-Ahqaf:35|Muhammad:38|Al-Fath:29|Al-Hujurat:18|Qaf:45|Az-Zariyat:60|At-Tur:49|An-Najm:62|Al-Qamar:55|Ar-Rahman:78|Al-Waqi'ah:96|Al-Hadid:29|Al-Mujadilah:22|Al-Hasyr:24|Al-Mumtahanah:13|As-Saff:14|Al-Jumu'ah:11|Al-Munafiqun:11|At-Tagabun:18|At-Talaq:12|At-Tahrim:12|Al-Mulk:30|Al-Qalam:52|Al-Haqqah:52|Al-Ma'arij:44|Nuh:28|Al-Jinn:28|Al-Muzzammil:20|Al-Muddassir:56|Al-Qiyamah:40|Al-Insan:31|Al-Mursalat:50|An-Naba:40|An-Nazi'at:46|'Abasa:42|At-Takwir:29|Al-Infitar:19|Al-Mutaffifin:36|Al-Insyiqaq:25|Al-Buruj:22|At-Tariq:17|Al-A'la:19|Al-Gasyiyah:26|Al-Fajr:30|Al-Balad:20|Asy-Syams:15|Al-Lail:21|Ad-Duha:11|Asy-Syarh:8|At-Tin:8|Al-'Alaq:19|Al-Qadr:5|Al-Bayyinah:8|Az-Zalzalah:8|Al-'Adiyat:11|Al-Qari'ah:11|At-Takasur:8|Al-'Asr:3|Al-Humazah:9|Al-Fil:5|Quraisy:4|Al-Ma'un:7|Al-Kausar:3|Al-Kafirun:6|An-Nasr:3|Al-Masad:5|Al-Ikhlas:4|Al-Falaq:5|An-Nas:6`.split('|').map((x, i) => { const [n, a] = x.split(':'); return { no: i + 1, n, a: +a } })
const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '').replace(/^al|^an|^as|^at|^ar|^ad|^az|^asy/, '')
const FULL = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '')
const ALT = { yasin: 36, yaasiin: 36, kahfi: 18, kursi: 2, mulk: 67, waqiah: 56, rahman: 55, ikhlas: 112, falaq: 113, nas: 114, fatihah: 1, kautsar: 108, kausar: 108, tabarak: 67, taha: 20, sajdah: 32, insan: 76, dhuha: 93, duha: 93, tin: 95, nasr: 110, lahab: 111, masad: 111, asr: 103, ashr: 103, quraish: 106, kafirun: 109, maun: 107, fil: 105, humazah: 104, takatsur: 102, takasur: 102, qariah: 101, adiyat: 100, zalzalah: 99, bayyinah: 98, qadr: 97, alaq: 96, syarh: 94, insyirah: 94, lail: 92, syams: 91, balad: 90, fajr: 89, ghasyiyah: 88, gasyiyah: 88, ala: 87, tariq: 86, buruj: 85 }
function findSurah(x) {
  const t = String(x || '').trim(); if (/^\d{1,3}$/.test(t)) return S[+t - 1] || null
  const k = FULL(t); if (!k) return null
  if (ALT[k]) return S[ALT[k] - 1]
  return S.find(s => FULL(s.n) === k) || S.find(s => norm(s.n) === norm(t) && norm(t)) || S.find(s => FULL(s.n).includes(k) && k.length >= 3) || null
}
// parse "36:1-5" | "yasin 1-5" | "2 255" | "112"
function parse(text) {
  let t = String(text || '').trim(); if (!t) return null
  let m = t.match(/^(\d{1,3}):(\d{1,3})(?:\s*[-–]\s*(\d{1,3}))?$/); let sur, a, b
  if (m) { sur = S[+m[1] - 1]; a = +m[2]; b = m[3] ? +m[3] : a }
  else {
    m = t.match(/^(.*?)[\s:]+(\d{1,3})(?:\s*[-–]\s*(\d{1,3}))?$/)
    if (m && findSurah(m[1])) { sur = findSurah(m[1]); a = +m[2]; b = m[3] ? +m[3] : a } else { sur = findSurah(t); a = null }
  }
  if (!sur) return null
  if (a !== null && (a < 1 || b < a || b > sur.a)) return { sur, err: `Surah ${sur.n} hanya punya ${sur.a} ayat.` }
  return { sur, a, b }
}
async function fetchAyat(sur, a, b) {
  const { data } = await axios.get(`https://api.alquran.cloud/v1/surah/${sur.no}/editions/quran-uthmani,id.indonesian`, { timeout: 20000 })
  const [ar, id] = data.data
  return ar.ayahs.filter(x => x.numberInSurah >= a && x.numberInSurah <= b).map((x, i) => ({ n: x.numberInSurah, ar: x.text.replace(/^بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ\s*/, sur.no === 1 ? '$&' : ''), id: (id.ayahs.find(y => y.numberInSurah === x.numberInSurah) || {}).text || '' }))
}
const AH = `Ar-Rahman:Maha Pengasih|Ar-Rahim:Maha Penyayang|Al-Malik:Maha Merajai|Al-Quddus:Maha Suci|As-Salam:Maha Memberi Kesejahteraan|Al-Mu'min:Maha Memberi Keamanan|Al-Muhaimin:Maha Mengatur|Al-'Aziz:Maha Perkasa|Al-Jabbar:Maha Kuasa|Al-Mutakabbir:Maha Megah|Al-Khaliq:Maha Pencipta|Al-Bari':Maha Melepaskan|Al-Musawwir:Maha Membentuk Rupa|Al-Gaffar:Maha Pengampun|Al-Qahhar:Maha Memaksa|Al-Wahhab:Maha Pemberi Karunia|Ar-Razzaq:Maha Pemberi Rezeki|Al-Fattah:Maha Pembuka Rahmat|Al-'Alim:Maha Mengetahui|Al-Qabid:Maha Menyempitkan|Al-Basit:Maha Melapangkan|Al-Khafid:Maha Merendahkan|Ar-Rafi':Maha Meninggikan|Al-Mu'izz:Maha Memuliakan|Al-Muzill:Maha Menghinakan|As-Sami':Maha Mendengar|Al-Basir:Maha Melihat|Al-Hakam:Maha Menetapkan|Al-'Adl:Maha Adil|Al-Latif:Maha Lembut|Al-Khabir:Maha Mengenal|Al-Halim:Maha Penyantun|Al-'Azim:Maha Agung|Al-Gafur:Maha Pengampun|Asy-Syakur:Maha Pembalas Budi|Al-'Ali:Maha Tinggi|Al-Kabir:Maha Besar|Al-Hafiz:Maha Memelihara|Al-Muqit:Maha Pemberi Kecukupan|Al-Hasib:Maha Membuat Perhitungan|Al-Jalil:Maha Luhur|Al-Karim:Maha Pemurah|Ar-Raqib:Maha Mengawasi|Al-Mujib:Maha Mengabulkan|Al-Wasi':Maha Luas|Al-Hakim:Maha Bijaksana|Al-Wadud:Maha Mengasihi|Al-Majid:Maha Mulia|Al-Ba'is:Maha Membangkitkan|Asy-Syahid:Maha Menyaksikan|Al-Haqq:Maha Benar|Al-Wakil:Maha Memelihara Urusan|Al-Qawiy:Maha Kuat|Al-Matin:Maha Kokoh|Al-Waliy:Maha Melindungi|Al-Hamid:Maha Terpuji|Al-Muhsi:Maha Menghitung|Al-Mubdi':Maha Memulai|Al-Mu'id:Maha Mengembalikan|Al-Muhyi:Maha Menghidupkan|Al-Mumit:Maha Mematikan|Al-Hayy:Maha Hidup|Al-Qayyum:Maha Berdiri Sendiri|Al-Wajid:Maha Menemukan|Al-Majid:Maha Mulia|Al-Wahid:Maha Esa|Al-Ahad:Maha Tunggal|As-Samad:Maha Dibutuhkan|Al-Qadir:Maha Kuasa|Al-Muqtadir:Maha Berkuasa|Al-Muqaddim:Maha Mendahulukan|Al-Mu'akhkhir:Maha Mengakhirkan|Al-Awwal:Maha Awal|Al-Akhir:Maha Akhir|Az-Zahir:Maha Nyata|Al-Batin:Maha Tersembunyi|Al-Wali:Maha Memerintah|Al-Muta'ali:Maha Tinggi|Al-Barr:Maha Dermawan|At-Tawwab:Maha Penerima Tobat|Al-Muntaqim:Maha Penyiksa|Al-'Afuww:Maha Pemaaf|Ar-Ra'uf:Maha Pengasih|Malikul Mulk:Penguasa Kerajaan|Zul Jalali wal Ikram:Pemilik Kebesaran dan Kemuliaan|Al-Muqsit:Maha Adil|Al-Jami':Maha Mengumpulkan|Al-Ganiy:Maha Kaya|Al-Mugni:Maha Memberi Kekayaan|Al-Mani':Maha Mencegah|Ad-Darr:Maha Pemberi Mudarat|An-Nafi':Maha Pemberi Manfaat|An-Nur:Maha Bercahaya|Al-Hadi:Maha Pemberi Petunjuk|Al-Badi':Maha Pencipta Tiada Banding|Al-Baqi:Maha Kekal|Al-Warith:Maha Pewaris|Ar-Rasyid:Maha Pandai|As-Sabur:Maha Sabar`.split('|').map(x => x.split(':'))
module.exports = {
  name: 'surah', alias: ['surah', 'ayatacak', 'asmaulhusna', 'asmaul'], category: 'dunia', cmds: ['surah', 'ayatacak', 'asmaulhusna'], noLimit: true,
  desc: 'Al-Qur\'an (Arab + terjemahan): .quran yasin 1-5 • .surah • .ayatacak • .asmaulhusna',
  run: async ({ sock, m, command, text, prefix, reply }) => {
    if (['asmaulhusna', 'asmaul'].includes(command)) {
      const t = String(text || '').trim()
      if (/^\d+$/.test(t)) { const x = AH[+t - 1]; return x ? reply(`${B('ASMAUL HUSNA')} #${t}\n━━━━━━━━━━━━━━━━━━━━\n*${x[0]}*\n${x[1]}`) : reply('Nomor 1–99.') }
      if (t) { const hit = AH.map((x, i) => [x, i + 1]).filter(([x]) => FULL(x[0]).includes(FULL(t)) || FULL(x[1]).includes(FULL(t))).slice(0, 8); if (hit.length) return reply(hit.map(([x, i]) => `${i}. *${x[0]}* — ${x[1]}`).join('\n')) }
      return reply(`${B('ASMAUL HUSNA')}\n━━━━━━━━━━━━━━━━━━━━\n` + AH.map((x, i) => `${i + 1}. ${x[0]} — ${x[1]}`).join('\n') + `\n\n_${prefix}asmaulhusna <no|kata> untuk satu nama_`)
    }
    if (command === 'surah' && !text) return reply(`${B('DAFTAR SURAH')}\n━━━━━━━━━━━━━━━━━━━━\n` + S.map(s => `${s.no}. ${s.n} (${s.a})`).join('\n') + `\n\n_${prefix}quran <surah> [ayat]  mis. ${prefix}quran yasin 1-5_`)
    try {
      if (command === 'ayatacak') {
        let n = Math.floor(Math.random() * 6236), sur = S.find(s => (n -= s.a) < 0), a = n + sur.a + 1
        const [x] = await fetchAyat(sur, a, a); if (!x) throw new Error('ayat tidak ditemukan'); return reply(`${B('AYAT ACAK')}\n━━━━━━━━━━━━━━━━━━━━\n${x.ar}\n\n_${x.id}_\n\n— QS ${sur.n}: ${a}`)
      }
      const p = parse(text)
      if (!p) return reply(`${B('AL-QUR\'AN')}\nContoh:\n${prefix}quran yasin 1-5\n${prefix}quran 2:255\n${prefix}quran alfatihah\n${prefix}surah  (daftar surah)`)
      if (p.err) return reply(p.err)
      if (p.a === null) return reply(`${B(p.sur.n.toUpperCase())}\nSurah ke-${p.sur.no} • ${p.sur.a} ayat\n\nBaca: ${prefix}quran ${p.sur.no} 1-${Math.min(5, p.sur.a)}`)
      if (p.b - p.a + 1 > 10) p.b = p.a + 9
      const xs = await fetchAyat(p.sur, p.a, p.b); if (!xs.length) throw new Error('ayat tidak ditemukan')
      return reply(`${B('QS ' + p.sur.n.toUpperCase())} (${p.sur.no}) : ${p.a}${p.b > p.a ? '–' + p.b : ''}\n━━━━━━━━━━━━━━━━━━━━\n` + xs.map(x => `${x.ar} ﴾${x.n}﴿\n_${x.id}_`).join('\n\n') + (p.b < p.sur.a ? `\n\n_Lanjut: ${prefix}quran ${p.sur.no} ${p.b + 1}-${Math.min(p.b + 10, p.sur.a)}_` : ''))
    } catch (e) { console.log('[quran]', e.message); return reply('Gagal mengambil ayat: ' + e.message) }
  },
}
module.exports._t = { S, AH, parse, findSurah }
