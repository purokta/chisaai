/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .suara <efek> — ubah suara pada voice note / audio / video yang di-reply (butuh ffmpeg)
//   efek: tupai, raksasa, robot, alien, gema, gua, balik, nightcore, slowed, telepon, bass, paduan, retro, cepat, lambat, megafon, wanita, pria
const { B } = require('../../lib/style'), AJ = require('../../lib/ajaib')

const SR = 'aresample=44100'
const EFEK = {
  tupai: ['suara cempreng seperti tupai', `${SR},asetrate=44100*1.55,${SR},atempo=0.6452`],
  raksasa: ['suara berat seperti raksasa', `${SR},asetrate=44100*0.72,${SR},atempo=1.3889`],
  robot: ['suara robot', `afftfilt=real='hypot(re,im)*sin(0)':imag='hypot(re,im)*cos(0)':win_size=512:overlap=0.75`],
  alien: ['suara makhluk asing bergetar', 'vibrato=f=12:d=0.7,tremolo=f=30:d=0.5'],
  gema: ['bergema seperti di lembah', 'aecho=0.8:0.88:700|1100:0.45|0.3'],
  gua: ['bergaung seperti di dalam gua', 'aecho=0.8:0.9:40|70|110|200:0.4|0.35|0.3|0.25'],
  balik: ['diputar mundur', 'areverse'],
  nightcore: ['lebih cepat dan tinggi (nightcore)', `${SR},asetrate=44100*1.25,${SR}`],
  slowed: ['lebih lambat dan dalam (slowed)', `${SR},asetrate=44100*0.85,${SR}`],
  telepon: ['suara dari telepon / radio jadul', 'highpass=f=450,lowpass=f=3200,acompressor=threshold=0.1:ratio=6,volume=1.6'],
  bass: ['bass menggelegar', 'bass=g=18,acompressor=threshold=0.2:ratio=4'],
  paduan: ['seperti dinyanyikan banyak orang (chorus)', 'chorus=0.7:0.9:55|60|40:0.4|0.32|0.3:0.25|0.4|0.3:2|2.3|1.3'],
  cepat: ['bicara 1,5x lebih cepat (nada tetap)', 'atempo=1.5'],
  lambat: ['bicara lebih lambat 0,75x (nada tetap)', 'atempo=0.75'],
  megafon: ['lewat pengeras suara / megafon', 'highpass=f=600,lowpass=f=3800,acompressor=threshold=0.05:ratio=10,volume=2'],
  wanita: ['nada lebih tinggi seperti suara wanita', `${SR},asetrate=44100*1.2,${SR},atempo=0.8333`],
  pria: ['nada lebih rendah seperti suara pria', `${SR},asetrate=44100*0.85,${SR},atempo=1.1765`],
  retro: ['suara game 8-bit', `aresample=8000,acrusher=bits=6:mode=log:aa=0:mix=1,${SR}`],
}
const extOf = (mime) => /ogg|opus/.test(mime) ? 'ogg' : /mpeg|mp3/.test(mime) ? 'mp3' : /mp4|m4a|aac/.test(mime) ? (mime.startsWith('video') ? 'mp4' : 'm4a') : /wav/.test(mime) ? 'wav' : /webm/.test(mime) ? 'webm' : 'bin'

module.exports = {
  name: 'suara', alias: ['ubahsuara', 'efeksuara', 'voicefx'], category: 'ajaib', noLimit: true, cmds: ['suara'],
  desc: 'Ubah suara voice note/audio/video jadi tupai, raksasa, robot, gua, nightcore, dll (reply audio)',
  run: async ({ sock, m, args, prefix, reply }) => {
    const name = (args[0] || '').toLowerCase(), e = EFEK[name]
    const list = Object.entries(EFEK).map(([k, v]) => `◇ ${k} : ${v[0]}`).join('\n')
    if (!e) return reply(`✦ ${B('UBAH SUARA')}\nReply voice note / audio / video dengan:\n${prefix}suara <efek>\n\n${list}\n\n_Contoh: ${prefix}suara robot_`)
    const media = AJ.pickNode(m, ['audio', 'video'])
    if (!media) return reply(`Reply sebuah voice note, audio, atau video dengan ${prefix}suara ${name}`)
    if (Number(media.node.seconds) > 300) return reply('✕ Durasi maksimal 5 menit.')
    if (Number(media.node.fileLength) > 25 * 1024 * 1024) return reply('✕ Ukuran file maksimal 25 MB.')
    sock.sendMessage(m.chat, { react: { text: '🕕', key: m.key } }).catch(() => {})
    try {
      const src = await AJ.download(media), asVoice = media.kind === 'video' || media.node.ptt === true
      const base = ['-vn', '-t', '180', '-af', e[1]]
      const out = asVoice ? await AJ.runFF(src, extOf(media.mime), 'ogg', [...base, '-c:a', 'libopus', '-b:a', '48k', '-vbr', 'on', '-f', 'ogg'])
        : await AJ.runFF(src, extOf(media.mime), 'mp3', [...base, '-b:a', '128k', '-f', 'mp3'])
      if (!out || !out.length) throw new Error('hasil kosong')
      await sock.sendMessage(m.chat, asVoice ? { audio: out, mimetype: 'audio/ogg; codecs=opus', ptt: true } : { audio: out, mimetype: 'audio/mpeg', ptt: false, fileName: `suara_${name}.mp3` }, { quoted: m })
      sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {})
    } catch (err) {
      console.log('[suara]', err.message); sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } }).catch(() => {})
      return reply(`✕ Gagal mengubah suara.\n_${err.message}_\nPastikan ffmpeg terpasang di server.`)
    }
  },
  _internals: { EFEK },
}
