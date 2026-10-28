/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// AI GAMBAR (Gemini) — foto jadi anime / chibi, buat gambar dari teks, dan edit gambar dengan instruksi.
//   .toanime [gaya] [catatan]   reply / kirim foto → ilustrasi anime   (gaya: ghibli, shinkai, manga, retro, webtoon)
//   .tochibi [gaya] [catatan]   reply / kirim foto → karakter chibi    (gaya: stiker, 3d, pastel)
//   .gimg <deskripsi>           buat gambar dari teks (opsi --wide --tall --square); bila ada foto = EDIT foto itu
//   .editgambar <instruksi>     edit foto dengan kata-kata (wajib ada foto)
// Mesin: lib/gemimg.js (Gemini, key dari config.js). Error dilempar ke handler → jatah limit otomatis dikembalikan.
const { B } = require('../../lib/style'), AJ = require('../../lib/ajaib'), G = require('../../lib/gemimg'), IP = require('../../lib/imgprov')

const MAX = 10 * 1024 * 1024, COOLDOWN = 15000
const last = new Map(), busy = new Set()

const NO_TEXT = 'Do not add any text, captions, logos or watermarks.'
const ANIME = {
  base: 'Redraw the provided photo as a high-quality anime illustration. Preserve the identity of every subject: face shape, hairstyle and hair color, skin tone, outfit, accessories, pose, expression, composition and overall background layout. Use clean line art, cel shading, large expressive anime eyes with detailed highlights, smooth gradients and vibrant colors in a polished modern anime key-visual look. Turn the background into a painted anime background that matches the scene.',
  gaya: {
    ghibli: 'Style: soft hand-painted, Studio Ghibli-inspired look with warm natural colors, gentle brush texture and lush watercolor-like backgrounds.',
    shinkai: 'Style: Makoto Shinkai-inspired cinematic look with luminous skies, dramatic lighting, lens flares and extremely detailed backgrounds.',
    manga: 'Style: black-and-white manga page look with confident ink linework, screentone shading and high contrast. No color.',
    retro: 'Style: 1990s retro anime cel look with slightly grainy film texture and muted nostalgic colors.',
    webtoon: 'Style: Korean webtoon (manhwa) look with sleek thin lines, soft gradient shading and a glossy, fashionable finish.',
  },
}
const CHIBI = {
  base: 'Transform the subject(s) in the provided photo into a cute chibi (super-deformed) illustration. Keep the identity cues: hairstyle and hair color, skin tone, simplified facial features, outfit, accessories, colors, pose and expression. Proportions: oversized head about half of the body height, tiny body, short limbs, large glossy expressive eyes, small nose and mouth. Clean bold outlines, soft cel shading, vibrant colors, full body visible. If there are several people, make each one a chibi and keep their arrangement. Use a simple cute background that matches the mood of the original photo.',
  gaya: {
    stiker: 'Style: die-cut sticker design. Plain solid white background, thick white outline around the character, flat colors, no scenery, centered composition.',
    '3d': 'Style: 3D-rendered chibi figure look, like a premium collectible toy or Pixar-like render, soft studio lighting, glossy materials, clean neutral background.',
    pastel: 'Style: soft pastel kawaii illustration with a dreamy color palette, blush cheeks, sparkles and a gentle gradient background.',
  },
}
const flagKey = (o, k) => (o[k] ? k : null)
const EDIT_NOTE = 'Edit the provided image exactly as instructed. Keep everything that is not mentioned unchanged: the same people, faces, pose, composition and quality. Instruction: '

// niat gambar dari chat biasa (.ai ...). Hasil { mode:'generate'|'edit', prompt } atau null
const GEN_RE = /^(?:tolong\s+|coba\s+)?(?:buat(?:kan|in)?|bikin(?:kan|in)?|generate|create|lukis(?:kan)?|gambar(?:kan)?|desain(?:kan)?)\s+(?:aku\s+|saya\s+|gue\s+)?(?:sebuah\s+|satu\s+)?(?:gambar|foto|ilustrasi|image|lukisan|poster|logo|wallpaper|ikon|icon|sketsa)\b/i
const EDIT_RE = /^(?:tolong\s+|coba\s+)?(?:edit|ubah(?:lah)?|ganti(?:lah)?|hapus(?:kan)?|tambah(?:kan)?|jadikan|buat(?:kan|in)?\s+(?:jadi|menjadi)|remove|change|add|replace|make|turn)\b/i
function intent(text, hasImage) {
  const t = String(text || '').trim(); if (!t) return null
  if (hasImage && (EDIT_RE.test(t) || GEN_RE.test(t))) return { mode: 'edit', prompt: EDIT_NOTE + t.slice(0, 600), shown: t }
  if (!hasImage && (GEN_RE.test(t) || /^gambarkan\s+\S/i.test(t))) return { mode: 'generate', prompt: t.slice(0, 600), shown: t }
  return null
}

// dipanggil dari .ai bila intent() cocok
const chat = (ctx, it) => handle(ctx, { title: it.mode === 'edit' ? 'EDIT GAMBAR' : 'GEMINI GAMBAR', prompt: it.prompt, needPhoto: it.mode === 'edit', done: `_${it.shown.slice(0, 160)}_`, usage: '' })

const react = (sock, m, t) => sock.sendMessage(m.chat, { react: { text: t, key: m.key } }).catch(() => {})

// inti: kerjakan satu permintaan gambar dan kirim hasilnya
// job: { title, prompt, aspect?, image?:{media}, needPhoto?, done:string }
async function handle({ sock, m, reply, prefix, isCreator }, job) {
  const media = AJ.pickNode(m, ['image'])
  if (job.needPhoto && !media) return reply(job.usage)
  if (media && Number(media.node.fileLength || 0) > MAX) return reply('✕ Ukuran foto maksimal 10 MB.')
  const now = Date.now(), prev = last.get(m.sender) || 0
  if (busy.has(m.sender)) return reply('⏳ Permintaan gambar sebelumnya masih diproses.')
  if (now - prev < COOLDOWN) return reply(`⏳ Tunggu ${Math.ceil((COOLDOWN - (now - prev)) / 1000)} detik lagi.`)
  last.set(m.sender, now); busy.add(m.sender)
  react(sock, m, '⏳')
  try {
    let image = null, mime
    if (media && job.useImage !== false) {
      image = await AJ.download(media)
      if (!image || !image.length) throw new Error('foto gagal diunduh dari WhatsApp')
      if (image.length > MAX) { last.delete(m.sender); return reply('✕ Ukuran foto maksimal 10 MB.') }
      mime = String(media.mime || 'image/jpeg').split(';')[0]
    }
    // penyedia dipilih lewat .set imgprovider (auto = Gemini dulu, lalu Firefly / Kyyz bila terisi)
    const out = await IP.dispatch('image', { prompt: job.prompt, image, mime, aspect: job.aspect }, {
      gemini: (r) => (r.image ? G.edit({ prompt: r.prompt, image: r.image, mime: r.mime }) : G.generate({ prompt: r.prompt, aspect: r.aspect })),
    })
    await sock.sendMessage(m.chat, { image: out.buffer, caption: `${B(job.title)}\n${job.done}` }, { quoted: m })
    react(sock, m, '✅')
  } catch (e) {
    last.delete(m.sender)
    react(sock, m, '❌')
    console.log('[aigambar]', e.code || '', e.message, e.details || '')
    if (e.code) { const x = new Error(e.message + (isCreator && e.details && e.details.length ? '\n' + e.details.slice(0, 3).join('\n') : '')); x.code = e.code; throw x }
    throw e
  } finally { busy.delete(m.sender) }
}

function styled(spec, args) {
  const g = (args[0] || '').toLowerCase(), key = spec.gaya[g] ? g : null
  const note = (key ? args.slice(1) : args).join(' ').trim().slice(0, 300)
  return { key, prompt: [spec.base, key && spec.gaya[key], note && `Extra request from the user: ${note}`, NO_TEXT].filter(Boolean).join(' ') }
}

module.exports = {
  name: 'toanime', category: 'kreasi', noLimit: false,
  alias: ['jadianime', 'tochibi', 'jadichibi', 'chibi', 'gimg', 'genimg', 'geminiimg', 'editgambar', 'editimg', 'aiedit'],
  cmds: ['toanime', 'tochibi', 'gimg', 'editgambar'],
  desc: 'Gemini: foto jadi anime / chibi, buat gambar dari teks, edit gambar dengan instruksi',
  intent, handle, chat,
  run: async (ctx) => {
    const { m, args, text, command, prefix } = ctx, P = prefix || '.'
    const c = String(command || '').toLowerCase()

    if (['toanime', 'jadianime'].includes(c)) {
      const s = styled(ANIME, args)
      return handle(ctx, {
        title: 'TO ANIME', prompt: s.prompt, needPhoto: true, done: `Versi anime${s.key ? ' gaya ' + s.key : ''} selesai.`,
        usage: `${B('TO ANIME')}\nKirim atau reply foto dengan ${P}toanime\n\nGaya (opsional): ${Object.keys(ANIME.gaya).join(' • ')}\nContoh:\n${P}toanime\n${P}toanime ghibli\n${P}toanime shinkai rambut jadi biru`,
      })
    }
    if (['tochibi', 'jadichibi', 'chibi'].includes(c)) {
      const s = styled(CHIBI, args)
      return handle(ctx, {
        title: 'TO CHIBI', prompt: s.prompt, needPhoto: true, done: `Versi chibi${s.key ? ' gaya ' + s.key : ''} selesai.`,
        usage: `${B('TO CHIBI')}\nKirim atau reply foto dengan ${P}tochibi\n\nGaya (opsional): ${Object.keys(CHIBI.gaya).join(' • ')}\nContoh:\n${P}tochibi\n${P}tochibi stiker\n${P}tochibi 3d pakai topi kucing`,
      })
    }
    if (['editgambar', 'editimg', 'aiedit'].includes(c)) {
      const p = String(text || '').trim()
      const usage = `${B('EDIT GAMBAR')}\nKirim atau reply foto dengan instruksi:\n${P}editgambar ganti baju jadi merah\n${P}editgambar hapus orang di belakang\n${P}editgambar ubah latar jadi pantai saat senja`
      if (!p) return ctx.reply(usage)
      return handle(ctx, { title: 'EDIT GAMBAR', prompt: EDIT_NOTE + p.slice(0, 600), needPhoto: true, usage, done: `_${p.slice(0, 160)}_` })
    }

    // .gimg / .genimg / .geminiimg — teks → gambar, atau EDIT bila ada foto
    const flags = [...String(text || '').matchAll(/--(\w+)/g)].map(x => x[1].toLowerCase()), p = String(text || '').replace(/--\w+/g, '').replace(/\s+/g, ' ').trim()
    const hasPhoto = !!AJ.pickNode(m, ['image'])
    if (!p) return ctx.reply(`${B('GEMINI GAMBAR')}\n*Buat gambar:*\n${P}gimg kucing astronaut di bulan, gaya anime\n${P}gimg poster konser jazz --tall\n\n*Edit foto:* kirim / reply foto + instruksi\n${P}gimg ganti latar jadi pantai\n\nOpsi ukuran: --wide  --tall  --square\nEdit langsung: ${P}editgambar • Jadi anime: ${P}toanime • Jadi chibi: ${P}tochibi`)
    if (p.length > 600) return ctx.reply('✕ Deskripsi maksimal 600 karakter.')
    const aspect = flagKey(G.ASPECT, flags.find(f => G.ASPECT[f]))
    return handle(ctx, { title: hasPhoto ? 'EDIT GAMBAR' : 'GEMINI GAMBAR', prompt: hasPhoto ? EDIT_NOTE + p : p, aspect, done: `_${p.slice(0, 160)}_` })
  },
}
