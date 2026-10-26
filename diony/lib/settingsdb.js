/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Penyimpan setting [LIVE]: default dari config.js + override di lib/database/settings.json
const fs = require('fs')
const path = require('path')
const FILE = path.join(global.dionyData, 'settings.json')

const META = { // tipe + deskripsi tiap key (dipakai .setting dan .set)
  botname:['str','Nama bot'], footer:['str','Footer pesan'], language:['enum:id,en','Bahasa'], timezone:['str','Zona waktu, mis. Asia/Jakarta'],
  mode:['enum:public,self','Mode bot'], maintenance:['bool','Mode maintenance (hanya owner)'],
  onlygroup:['bool','Hanya aktif di grup'], onlyprivate:['bool','Hanya aktif di chat pribadi'],
  noprefix:['bool','Owner boleh pakai perintah tanpa prefix (user biasa tetap pakai prefix)'], cooldown:['num','Jeda antar perintah (detik)'], limitfree:['num','Limit command harian user Free (0 = tanpa batas)'], limitprem:['num','Limit command harian user Premium (0 = tanpa batas)'],
  autoread:['bool','Auto baca pesan'], autotyping:['bool','Efek mengetik'], autorecording:['bool','Efek merekam'],
  alwaysonline:['bool','Selalu online'], autoreadsw:['bool','Auto lihat status'], autobio:['bool','Bio otomatis'],
  anticall:['bool','Tolak panggilan'],
  welcome:['bool','Kartu sambutan member baru'], goodbye:['bool','Kartu member keluar'],
  adminnotif:['bool','Kartu otomatis promote / demote admin'], wajibdaftar:['bool','Wajib daftar (captcha + owner) untuk memakai bot'],
  antilink:['bool','Anti link grup WA'], antitoxic:['bool','Anti kata kasar'],
  antidelete:['enum:off,chat','Pulihkan pesan ditarik (off/chat)'], antiviewonce:['enum:off,chat','Buka pesan sekali-lihat (off/chat)'],
  menustyle:['enum:video,canvas,button,text','Gaya menu (video = thumbnail video + tombol link)'], menuuptime:['bool','Uptime di menu'],
  menuaudio:['bool','Kirim audio di bawah menu'], menusingle:['bool','.menu & .allmenu dikirim sebagai SATU pesan (media + isi + tombol). off = cara lama (beberapa pesan)'],
  menuinfo:['bool','Blok INFO LIVE (cuaca, waktu WIB/WITA/WIT, Hijriah) di bawah thumbnail menu'], menucity:['str','Kota default cuaca di menu (bila pengguna belum .setkota)'],
  menucarousel:['enum:off,showcase,kategori','Carousel ikut .menu (off / showcase = cards.json / kategori = kartu per kategori)'],
  aiprovider:['enum:auto,groq,gemini','Penyedia AI'], aipersona:['enum:ramah,santai,formal,otaku,yandere','Gaya bicara AI'], aimemory:['bool','AI ingat percakapan'],
  imgprovider:['enum:auto,gemini,firefly,kyyz','Penyedia gambar .toanime .tochibi .gimg .editgambar (auto = Gemini lalu cadangan Firefly / Kyyz)'],
  figprovider:['enum:auto,live3d,firefly,kyyz','Penyedia .tofigure (auto = live3d lalu cadangan Firefly / Kyyz)'],
  itsmecard:['bool','Kartu sapaan + tombol di bawah video .itsme'],
  quotebiz:['bool','Header balasan bot = Chisa AI + centang biru (bukan teks pesan user)'],
  gaya:['enum:kuno,emoji','Gaya tampilan: kuno (hieroglif) atau emoji'],
  packname:['str','Packname sticker'], author:['str','Author sticker'],
}

let over = {}
try { over = JSON.parse(fs.readFileSync(FILE, 'utf8')) } catch { over = {} }

function def() { return global.settingsDefault || {} }
function get(k) { return k in over ? over[k] : def()[k] }
function all() { const o = {}; for (const k of Object.keys(def())) o[k] = get(k); return o }
function save() { try { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(over, null, 2)) } catch (e) { console.log('[settings] gagal simpan:', e.message) } }

// kembalikan { ok, value } atau { ok:false, msg }
function parse(k, raw) {
  const m = META[k]; if (!m) return { ok: false, msg: `Key "${k}" tidak dikenal. Ketik .setting untuk daftar.` }
  const t = m[0], r = String(raw ?? '').trim()
  if (t === 'bool') {
    if (/^(on|true|1|ya|aktif|nyala)$/i.test(r)) return { ok: true, value: true }
    if (/^(off|false|0|tidak|mati|matikan)$/i.test(r)) return { ok: true, value: false }
    return { ok: false, msg: 'Pakai on / off.' }
  }
  if (t === 'num') { const n = Number(r); return Number.isFinite(n) && n >= 0 && n <= 3600 ? { ok: true, value: n } : { ok: false, msg: 'Isi angka 0-3600.' } }
  if (t.startsWith('enum:')) { const o = t.slice(5).split(','); return o.includes(r.toLowerCase()) ? { ok: true, value: r.toLowerCase() } : { ok: false, msg: 'Pilihan: ' + o.join(' / ') } }
  return r ? { ok: true, value: r.slice(0, 80) } : { ok: false, msg: 'Nilai tidak boleh kosong.' }
}
function set(k, raw) { const p = parse(k, raw); if (!p.ok) return p; over[k] = p.value; save(); return p }
function reset(k) { if (k) delete over[k]; else over = {}; save() }

module.exports = { get, all, set, reset, parse, META }
