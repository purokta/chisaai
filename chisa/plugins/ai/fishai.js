/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// FISH AI — SATU perintah untuk semuanya (pengubah suara AI berbasis Fish Audio, fish.audio)
//   .fishai                     reply voice note/audio/video -> suaranya diganti suara AI pilihan (isi ucapan tetap)
//   .fishai <teks>              tanpa reply = teks jadi suara   (.fishai 2 <teks> = pakai suara nomor 2)
//   .fishai cari <kata> [bhs]   cari suara publik        .fishai pilih <no|id> [nama]  pilih & simpan suara
//   .fishai suaraku             daftar suaramu           .fishai hapus <no>            hapus suara
//   .fishai speed <0.5-2>       kecepatan bicara         .fishai klon <nama>           (premium) kloning suara dari audio yang di-reply
//   .fishai status              (owner) cek API key      .fishai bantuan               panduan
// Perintah lama (.fishtts .fishvoice .fishpilih .fishku .fishhapus .fishspeed .fishclone .fishstatus) tetap jalan sebagai alias tersembunyi,
// tetapi di menu All hanya tampil satu: .fishai
const { B } = require('../../lib/style'), AJ = require('../../lib/ajaib'), FISH = require('../../lib/fishai'), STT = require('../../lib/stt')

const CMDS = ['fishai']
const LEGACY = ['fishtts', 'fishvoice', 'fishpilih', 'fishku', 'fishclone', 'fishhapus', 'fishspeed', 'fishstatus']
// kata sub-perintah: .fishai <kata> ...  -> perintah internal
const SUB = { tts: 'fishtts', say: 'fishtts', bicara: 'fishtts', cari: 'fishvoice', search: 'fishvoice', pilih: 'fishpilih', set: 'fishpilih', suaraku: 'fishku', list: 'fishku', daftar: 'fishku',
  hapus: 'fishhapus', del: 'fishhapus', speed: 'fishspeed', kecepatan: 'fishspeed', klon: 'fishclone', clone: 'fishclone', status: 'fishstatus', cek: 'fishstatus', bantuan: 'help', help: 'help', menu: 'help' }
const ALIAS = { voicechanger: 'fishai', ubahsuaraai: 'fishai', aivoice: 'fishai', fishsay: 'fishtts', aitts: 'fishtts', cariaisuara: 'fishvoice', fishcari: 'fishvoice', fishset: 'fishpilih', fishsuara: 'fishku', fishcek: 'fishstatus', fishdel: 'fishhapus' }
const extOf = (mime) => /ogg|opus/.test(mime) ? 'ogg' : /mpeg|mp3/.test(mime) ? 'mp3' : /mp4|m4a|aac/.test(mime) ? (mime.startsWith('video') ? 'mp4' : 'm4a') : /wav/.test(mime) ? 'wav' : /webm/.test(mime) ? 'webm' : 'bin'
const react = (sock, m, t) => sock.sendMessage(m.chat, { react: { text: t, key: m.key } }).catch(() => {})
const mp3ToVoice = (buf) => AJ.runFF(buf, 'mp3', 'ogg', ['-vn', '-c:a', 'libopus', '-b:a', '48k', '-vbr', 'on', '-f', 'ogg'])
const fail = (e, reply, isCreator, tag) => {
  console.log('[' + tag + ']', e.message)
  if (e.noKey) return reply(isCreator ? '✕ ' + e.message + '\n_Daftar di fish.audio, buat API key, lalu isi `fishaudio` di global.apikey._' : '✕ Fitur Fish AI belum diaktifkan oleh owner.')
  if (e.status === 402) return reply('✕ Kredit Fish Audio habis. Hubungi owner untuk isi saldo.')
  return reply(`✕ ${e.message}`)
}
// "[suara] sisa" -> { voice, rest } ; token pertama dianggap suara bila cocok dengan daftar tersimpan / ID
function splitVoice(uid, args) {
  const v = FISH.find(uid, args[0]); if (v) return { voice: v, rest: args.slice(1) }
  return { voice: null, rest: args }
}
const defVoice = (uid) => FISH.user(uid).voice
const guide = (p) => `${B('FISH AI')} — pengubah suara AI (satu perintah)
${p}fishai   (reply voice note)  → suara diganti suara AI, isi sama
${p}fishai <teks>   → teks jadi suara   (${p}fishai 2 <teks> = suara no.2)
${p}fishai cari <kata> [bahasa]   cari suara (contoh: ${p}fishai cari anime id)
${p}fishai pilih <no|id> [nama]   pilih & simpan suara
${p}fishai suaraku   daftar suaramu   •   ${p}fishai hapus <no>
${p}fishai speed <0.5-2>   kecepatan bicara
${p}fishai klon <nama>   (premium) kloning suara dari audio yang di-reply
${p}fishai status   (owner) cek API key`

module.exports = {
  name: 'fishai', alias: Object.keys(ALIAS).concat(LEGACY), category: 'ai', noLimit: false, cmds: CMDS,
  desc: 'Fish AI: ubah suara voice note jadi suara AI, teks jadi suara, cari & kloning suara',
  run: async ({ sock, m, args: argv, command, prefix, reply, isCreator, isPremium }) => {
    let args = argv, cmd = ALIAS[command] || command; const uid = m.sender
    if (cmd === 'fishai' && args[0] && SUB[String(args[0]).toLowerCase()]) { cmd = SUB[String(args[0]).toLowerCase()]; args = args.slice(1) }
    if (cmd === 'help') return reply(guide(prefix))
    if (!FISH.hasKey() && cmd !== 'fishku' && cmd !== 'fishspeed' && cmd !== 'fishhapus') {
      return reply(isCreator ? `✕ API key Fish Audio belum diisi.\nIsi \`fishaudio: "KEY"\` di global.apikey (config.js). Daftar & ambil key di fish.audio.` : '✕ Fitur Fish AI belum diaktifkan oleh owner.')
    }

    // ───────── status (owner)
    if (cmd === 'fishstatus') {
      if (!isCreator) return reply(global.mess.owner)
      try { const n = await FISH.ping(); return reply(`${B('FISH AI')}\n✓ Key valid\nSuara privat di akun: ${n}\nModel TTS: ${global.fishModel || 'bawaan Fish'}`) } catch (e) { return fail(e, reply, true, 'fishstatus') }
    }

    // ───────── daftar suaraku
    if (cmd === 'fishku') {
      const u = FISH.user(uid)
      if (!u.saved.length) return reply(`Belum ada suara tersimpan.\nCari: ${prefix}fishai cari <kata kunci>\nlalu pilih: ${prefix}fishai pilih <no>`)
      const rows = u.saved.map((s, i) => `${u.voice && u.voice.id === s.id ? '✓' : '◇'} ${i + 1}. ${s.name}${s.own ? ' (klonmu)' : ''}`).join('\n')
      return reply(`${B('SUARAKU')}\n${rows}\n\nKecepatan: ${u.speed}x\n_Pakai: ${prefix}fishai pilih <no> • pakai sekali: ${prefix}fishai <no>_`)
    }

    // ───────── kecepatan
    if (cmd === 'fishspeed') {
      const s = parseFloat(String(args[0] || '').replace(',', '.'))
      if (!(s >= 0.5 && s <= 2)) return reply(`Isi kecepatan 0.5 sampai 2.\nContoh: ${prefix}fishai speed 1.2 (sekarang ${FISH.user(uid).speed}x)`)
      FISH.setSpeed(uid, s)
      return reply(`✓ Kecepatan bicara diatur ke ${s}x.`)
    }

    // ───────── hapus
    if (cmd === 'fishhapus') {
      const v = FISH.find(uid, args[0]); if (!v || !FISH.user(uid).saved.some(s => s.id === v.id)) return reply(`Pilih dari ${prefix}fishai suaraku.\nContoh: ${prefix}fishai hapus 2`)
      try { if (v.own && FISH.hasKey()) await FISH.deleteVoice(v.id).catch(e => { if (!/404/.test(e.message)) throw e }) } catch (e) { return fail(e, reply, isCreator, 'fishhapus') }
      FISH.forget(uid, v.id); return reply(`✓ Suara "${v.name}" dihapus${v.own ? ' (termasuk dari akun Fish)' : ''}.`)
    }

    // ───────── cari
    if (cmd === 'fishvoice') {
      if (!args.length) return reply(`Contoh:\n${prefix}fishai cari anime\n${prefix}fishai cari narator id\n${prefix}fishai cari female en\n\n_Bahasa opsional di akhir: id, en, ja, zh, ko, dll._`)
      let language = ''; const a = args.slice(); if (a.length > 1 && /^[a-z]{2}(-[A-Za-z]{2})?$/.test(a[a.length - 1])) language = a.pop().toLowerCase()
      react(sock, m, '🕕')
      try {
        const list = await FISH.searchVoices({ title: a.join(' '), language, size: 8 })
        if (!list.length) { react(sock, m, '❌'); return reply('Tidak ada suara yang cocok. Coba kata kunci lain.') }
        FISH.setLast(uid, list); react(sock, m, '✅')
        return reply(`${B('HASIL SUARA')}\n` + list.map((v, i) => `${i + 1}. ${v.name}${v.langs ? ' [' + v.langs + ']' : ''}${v.author ? ' • ' + v.author : ''}`).join('\n') + `\n\n_Pilih: ${prefix}fishai pilih <no> [nama]_`)
      } catch (e) { react(sock, m, '❌'); return fail(e, reply, isCreator, 'fishvoice') }
    }

    // ───────── pilih / simpan
    if (cmd === 'fishpilih') {
      const t = args[0]; if (!t) return reply(`Contoh:\n${prefix}fishai pilih 2   (dari hasil ${prefix}fishai cari terakhir)\n${prefix}fishai pilih <id 32 karakter> Nama\n${prefix}fishai pilih 1   (dari ${prefix}fishai suaraku)`)
      const saved = FISH.find(uid, t), last = FISH.getLast(uid)
      if (/^\d{1,2}$/.test(t) && last && last[Number(t) - 1]) {
        // angka merujuk hasil pencarian bila baru saja mencari (≤15 menit), selain itu daftar tersimpan
        const v = last[Number(t) - 1], name = args.slice(1).join(' ').trim() || v.name
        FISH.remember(uid, { id: v.id, name: name.slice(0, 40) }); FISH.setLast(uid, [])
        return reply(`✓ Suara aktif: ${name}\nCoba: reply voice note dengan ${prefix}fishai`)
      }
      if (saved && FISH.user(uid).saved.some(s => s.id === saved.id)) { FISH.remember(uid, saved); return reply(`✓ Suara aktif: ${saved.name}`) }
      if (FISH.ID_RE.test(t)) { const name = args.slice(1).join(' ').trim() || 'suara-' + t.slice(0, 6); FISH.remember(uid, { id: t, name: name.slice(0, 40) }); return reply(`✓ Suara aktif: ${name}`) }
      return reply(`Tidak ketemu. Cari dulu dengan ${prefix}fishai cari <kata>, atau lihat ${prefix}fishai suaraku.`)
    }

    // ───────── kloning suara
    if (cmd === 'fishclone') {
      if (!isPremium && !isCreator) return reply(global.mess.premium)
      const name = args.join(' ').trim(); if (!name) return reply(`Reply voice note / audio (10-60 detik, satu pembicara, bersih dari musik) dengan:\n${prefix}fishai klon <nama suara>\n\n_Gunakan hanya suaramu sendiri atau dengan izin pemilik suara._`)
      const media = AJ.pickNode(m, ['audio', 'video']); if (!media) return reply('Reply voice note / audio sumber suaranya.')
      if (Number(media.node.seconds) > 120) return reply('✕ Maksimal 2 menit; 10-60 detik sudah cukup.')
      if (Number(media.node.seconds) && Number(media.node.seconds) < 5) return reply('✕ Terlalu pendek, minimal sekitar 10 detik.')
      const u = FISH.user(uid); if (!isCreator && u.saved.filter(s => s.own).length >= 5) return reply(`✕ Batas 5 suara klon. Hapus dulu dengan ${prefix}fishai hapus <no>.`)
      react(sock, m, '🕕')
      try {
        const src = await AJ.download(media), mp3 = await AJ.runFF(src, extOf(media.mime), 'mp3', ['-vn', '-t', '90', '-ac', '1', '-ar', '44100', '-b:a', '128k', '-f', 'mp3'])
        const id = await FISH.createVoice({ title: name, audio: mp3, ext: 'mp3' })
        FISH.remember(uid, { id, name: name.slice(0, 40), own: true }); react(sock, m, '✅')
        return reply(`✓ Suara "${name}" dikloning & jadi suara aktifmu.\nCoba: ${prefix}fishai halo, ini suara baruku`)
      } catch (e) { react(sock, m, '❌'); return fail(e, reply, isCreator, 'fishclone') }
    }

    // ───────── teks -> suara  /  voice changer
    const u = FISH.user(uid)
    const speak = async (voice, text) => {
      if (text.length > 800) return reply('✕ Maksimal 800 karakter.')
      react(sock, m, '🕕')
      try {
        const mp3 = await FISH.tts({ text, voice: (voice || u.voice || {}).id, speed: u.speed }), out = await mp3ToVoice(mp3)
        await sock.sendMessage(m.chat, { audio: out, mimetype: 'audio/ogg; codecs=opus', ptt: true }, { quoted: m }); react(sock, m, '✅')
        if (!(voice || u.voice)) reply(`_Belum memilih suara, jadi memakai suara acak. Pilih: ${prefix}fishai cari <kata>_`)
      } catch (e) { react(sock, m, '❌'); return fail(e, reply, isCreator, 'fishtts') }
    }
    const quotedText = () => (m.quoted && (m.quoted.text || m.quoted.caption) || '').trim()
    const { voice, rest } = splitVoice(uid, args)
    if (cmd === 'fishtts') {
      const text = rest.join(' ').trim() || quotedText()
      if (!text) return reply(`Contoh: ${prefix}fishai halo semuanya\n${prefix}fishai 2 selamat pagi (suara nomor 2 di ${prefix}fishai suaraku)\n\n${guide(prefix)}`)
      return speak(voice, text)
    }

    // fishai
    const media = AJ.pickNode(m, ['audio', 'video'])
    if (!media) {
      const text = rest.join(' ').trim() || quotedText()
      return text ? speak(voice, text) : reply(guide(prefix))   // tanpa media: teks langsung jadi suara
    }
    if (Number(media.node.seconds) > 180) return reply('✕ Durasi maksimal 3 menit.')
    if (Number(media.node.fileLength) > 25 * 1024 * 1024) return reply('✕ Ukuran file maksimal 25 MB.')
    react(sock, m, '🕕')
    try {
      const src = await AJ.download(media), mp3 = await AJ.runFF(src, extOf(media.mime), 'mp3', ['-vn', '-t', '180', '-ac', '1', '-ar', '16000', '-b:a', '48k', '-f', 'mp3'])
      const tr = await STT.transcribe(mp3, 'mp3').catch(e => { throw new Error('Gagal membaca ucapan: ' + e.message) })
      const text = tr.text.replace(/\s+/g, ' ').trim(); if (!text) throw new Error('Tidak ada ucapan yang terdeteksi.')
      const v = voice || u.voice
      const out = await mp3ToVoice(await FISH.tts({ text: text.slice(0, 1500), voice: v && v.id, speed: u.speed }))
      await sock.sendMessage(m.chat, { audio: out, mimetype: 'audio/ogg; codecs=opus', ptt: true }, { quoted: m }); react(sock, m, '✅')
      return reply(`${B('FISH AI')} • ${v ? v.name : 'suara acak'}\n_${text.slice(0, 300)}${text.length > 300 ? '…' : ''}_${v ? '' : `\n\nPilih suara: ${prefix}fishai cari <kata>`}`)
    } catch (e) { react(sock, m, '❌'); return fail(e, reply, isCreator, 'fishai') }
  },
}
