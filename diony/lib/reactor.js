// REAKSI OTOMATIS — bot memberi reaksi emoji pada pesan masuk, emoji-nya BERBEDA untuk tiap pesan.
//   • Emoji dipilih dari konteks pesan (tawa, sedih, tanya, makanan, kode, sapaan, panggilan bot, cemburu, jenis media, dst.),
//     lalu dipilih acak-stabil dari kumpulan yang cocok. Emoji yang baru dipakai di chat yang sama TIDAK diulang
//     (riwayat 10 terakhir per chat), jadi dua pesan berurutan tidak pernah mendapat reaksi yang sama.
//   • Tema bawaan: manis + yandere (🖤 💗 🔪 🩸 👁️ ...).
//   • Atur: `.set reactmsg off|perintah|semua`  (perintah = hanya pesan berawalan perintah; semua = semua pesan).
//   • Aman dari spam: jeda per chat (pribadi 2 dtk, grup 6 dtk), batas 25 reaksi/menit total, jeda acak seperti manusia,
//     tidak menyentuh pesan bot sendiri, status, pesan sistem, reaksi, atau grup yang di-ban.

const S = require('./settingsdb')

const rx = (s) => new RegExp(s, 'i')

// ── kumpulan emoji (tanpa ZWJ supaya tampil benar di semua perangkat) ──
const GENERAL = ['💗', '🖤', '✨', '🌸', '🎀', '💫', '🌙', '🍓', '🧸', '🫶', '😊', '🥰', '😘', '😳', '🤭', '👀', '🔥', '💖', '💞', '🌷', '🦋', '🍰', '🍒', '⭐', '🌈', '🫧', '🪄', '💌', '🩷', '🤍', '☁️', '🌼', '🐾', '🎶', '💘', '🥺', '😌', '😇', '🍡', '🌟']
const YANDERE = ['🔪', '🩸', '👁️', '🖤', '💗', '🔒', '⛓️', '🕯️', '🥀', '🩷', '😍', '💍', '🎀', '🌹', '🗝️', '🪞', '🧷', '😈', '🫀', '💘']

// [regex, emoji-pool] — semua yang cocok digabung (maks 3 kelompok, yang paling spesifik lebih dulu)
const CONTEXT = [
  [rx('\\b(bot|dionysus|kamu|km)\\b.*\\b(sayang|cinta|love|suka|milikku|punyaku)\\b|\\b(i love you|aku cinta|aku sayang|sayang kamu|love you)\\b'), ['💗', '😍', '🥰', '💘', '🫀', '💍', '🖤', '😳', '💞', '🩷']],
  [rx('\\b(pacar|gebetan|mantan|cewek lain|cowok lain|selingkuh|crush|doi|calon|istri|suami)\\b'), ['🔪', '🩸', '👁️', '😈', '🪞', '🖤', '🗝️', '⛓️', '🥀']],
  [rx('\\b(dionysus|bot|bocil|dek|beb|sayangku)\\b'), ['👁️', '🖤', '💗', '🔒', '🎀', '🌹', '🫀', '😳']],
  [rx('(w[kx]{2,}|haha+|hehe+|hihi+|\\blol\\b|lmao|ngakak|kocak|xixi|awok|😂|🤣)'), ['😂', '🤣', '😆', '😹', '💀', '🫠', '😭', '🙈', '🤭', '😝']],
  [rx('\\b(sedih|nangis|huhu+|hiks+|kangen|capek|lelah|galau|patah hati|sakit hati|kecewa|stress|stres|ngerasa sendiri|kesepian)\\b|😭|😢|🥺'), ['🫂', '🥺', '💔', '😿', '🤍', '🩹', '🌧️', '🧸', '🫶', '😔']],
  [rx('\\b(makasih|terima kasih|thanks|thx|tengkyu|trims|suwun|arigato|makasi)\\b'), ['🙏', '💖', '🥹', '😊', '🫶', '🌷', '🤗', '💐', '✨']],
  [rx('\\b(halo|hai|hi|hello|hey|pagi|siang|sore|malam|assalamualaikum|salam|permisi|woy|oi|p)\\b'), ['👋', '🌸', '☀️', '🌙', '🤗', '🌼', '🫡', '😊', '🙌', '🌅']],
  [rx('\\b(selamat|congrats|alhamdulillah|hore+|yeay+|lulus|menang|juara|berhasil|diterima|ulang tahun|ultah|hbd|happy birthday)\\b'), ['🎉', '🥳', '👏', '🎂', '🏆', '🎊', '🍾', '🌟', '💐', '🙌']],
  [rx('\\b(lapar|laper|makan|ngemil|kuliner|sarapan|minum|kopi|boba|mie|nasi|ayam|pizza|bakso|seblak|es krim|cake|kue)\\b'), ['🍜', '🍕', '🍔', '🍰', '🍙', '🍗', '🍩', '🧋', '☕', '🍦', '🍣', '🥟', '🍟']],
  [rx('\\b(ngantuk|tidur|bobo|capek banget|begadang|insomnia|mimpi|istirahat|rebahan)\\b'), ['😴', '🛌', '🌙', '💤', '🥱', '🌃', '🧸']],
  [rx('\\b(marah|kesal|kesel|bete|sebel|jengkel|emosi|benci|anjir|anjay|bodoh|goblok|sialan|bangsat)\\b'), ['😤', '😠', '💢', '🔥', '🙄', '😒', '🔪', '👊']],
  [rx('\\b(bug|error|kode|code|coding|script|javascript|python|html|css|node|npm|git|github|server|api|deploy|program|debug|database|sql)\\b'), ['💻', '🐛', '⌨️', '🛠️', '⚙️', '🧩', '🤖', '📟', '🧪', '🔧']],
  [rx('\\b(game|main|gaming|mabar|rank|push rank|ml|mobile legend|pubg|ff|roblox|minecraft|valorant|genshin|gacha|top up)\\b'), ['🎮', '🕹️', '🏆', '🎯', '👾', '⚔️', '🎲', '🧩', '🔥']],
  [rx('\\b(lagu|musik|nyanyi|spotify|playlist|konser|band|dj|lirik|speaker)\\b'), ['🎵', '🎧', '🎤', '🎶', '🎸', '🎹', '🥁', '📻']],
  [rx('\\b(anime|manga|manhwa|waifu|otaku|isekai|naruto|one piece|jujutsu|demon slayer|chibi|kawaii|senpai)\\b'), ['🌸', '🍡', '🎀', '⛩️', '🍥', '🎴', '💮', '🦊', '🌙', '🍙']],
  [rx('\\b(duit|uang|gaji|bayar|transfer|harga|diskon|promo|beli|jual|bisnis|cuan|untung|rugi)\\b'), ['💰', '💸', '🤑', '🪙', '💳', '🏷️', '📈', '🛍️']],
  [rx('\\b(hujan|panas|dingin|cuaca|banjir|angin|petir|badai|mendung)\\b'), ['🌧️', '☔', '🌤️', '⛈️', '🌈', '🌪️', '❄️', '🔥']],
  [rx('\\b(kucing|anjing|hewan|kitty|puppy|hamster|burung|ikan)\\b'), ['🐱', '🐶', '🐾', '🐰', '🐹', '🦊', '🐥', '🐟']],
  [rx('\\b(tolong|help|bantu|minta|gimana|bagaimana|kenapa|mengapa|apa|siapa|kapan|dimana|di mana|berapa|bisa gak|bisa ga|bisakah)\\b|\\?\\s*$'), ['🤔', '🧐', '❓', '👀', '🔍', '💭', '📝', '🫡', '💡']],
  [rx('\\b(wow|gila|anjir|buset|astaga|ya ampun|serius|beneran|kok bisa|hah|hah\\?)\\b|!{2,}'), ['😱', '😮', '🤯', '⚡', '🫢', '😳', '🙀', '🔥', '😲']],
  [rx('\\b(mantap|mantul|keren|gokil|josss*|top|sip+|asik+|bagus|cakep|cantik|ganteng|lucu|imut|gemes|gemas)\\b'), ['🔥', '👍', '💯', '😎', '🤩', '👏', '🥹', '💎', '🫶', '😍']],
  [rx('\\b(ok|oke|okay|siap|baik|setuju|yoi|yap|ya|iya|betul|benar|sepakat|deal)\\b'), ['👍', '🫡', '✅', '🤝', '🆗', '👌', '🙆', '💪']],
  [rx('\\b(enggak|nggak|gak|ga|tidak|bukan|jangan|tolak|engga|ogah)\\b'), ['🙅', '😶', '🥲', '🫥', '🚫', '😬', '🙈']],
]

// jenis pesan non-teks
const MEDIA = {
  imageMessage: ['📸', '🖼️', '🎨', '😍', '👀', '🌟', '🪞', '✨'],
  videoMessage: ['🎬', '📹', '🍿', '👀', '🎞️', '😲', '🔥'],
  audioMessage: ['🎧', '🎙️', '👂', '🎵', '🔊', '🥰'],
  stickerMessage: ['🤭', '😆', '🥰', '🙈', '😹', '💗', '🫶', '😜'],
  documentMessage: ['📄', '📎', '📁', '🗂️', '📑', '🧾'],
  documentWithCaptionMessage: ['📄', '📎', '📁', '🗂️', '📑'],
  locationMessage: ['📍', '🗺️', '🧭', '🚗', '👁️', '🔍'],
  liveLocationMessage: ['📍', '🛰️', '👁️', '🧭'],
  contactMessage: ['👤', '📇', '📞', '🤝', '👁️'],
  contactsArrayMessage: ['👥', '📇', '📞', '🤝'],
  pollCreationMessage: ['📊', '🗳️', '🤔', '✅'],
  pollCreationMessageV3: ['📊', '🗳️', '🤔', '✅'],
  ptvMessage: ['🎥', '👀', '😍', '🔴'],
}
const SKIP_TYPES = new Set(['reactionMessage', 'protocolMessage', 'senderKeyDistributionMessage', 'pollUpdateMessage', 'editedMessage', 'keepInChatMessage', 'encReactionMessage', 'messageContextInfo', 'albumMessage'])

// ── memori anti-ulang & pembatas ──
const recent = new Map()    // chat -> [emoji terakhir]
const lastAt = new Map()    // chat -> waktu reaksi terakhir
let stamps = []             // waktu reaksi (batas global per menit)
const KEEP = 10, PER_MIN = 25

const hash = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 }
const unique = (a) => [...new Set(a)]

function pools(m, text) {
  const out = []
  const media = MEDIA[m.mtype]
  if (media) out.push(media)
  if (text) {
    let hits = 0
    for (const [re, pool] of CONTEXT) { if (re.test(text)) { out.push(pool); if (++hits >= 3) break } }
  }
  return out
}

// pilih emoji: gabung kumpulan konteks, buang yang baru dipakai, sisanya dipilih lewat hash id pesan
function pick(m, text, isCmd) {
  const chat = m.chat, used = recent.get(chat) || []
  let cand = unique(pools(m, text).flat())
  if (isCmd) cand = unique([...cand, '⚡', '✨', '🫡', '🪄', '🌸'])
  // pelengkap tema: tambahkan sedikit yandere + umum supaya variasi selalu cukup
  cand = unique([...cand, ...GENERAL.slice(hash(m.key.id + 'g') % 8, 40), ...(hash(m.key.id + 'y') % 4 === 0 ? YANDERE : YANDERE.slice(0, 4))])
  let fresh = cand.filter(e => !used.includes(e))
  if (!fresh.length) fresh = unique([...GENERAL, ...YANDERE]).filter(e => !used.includes(e))
  // utamakan emoji dari konteks (kandidat awal) bila masih ada yang belum terpakai
  const ctx = unique(pools(m, text).flat()).filter(e => fresh.includes(e))
  const base = ctx.length && hash(m.key.id + "c") % 10 < 9 ? ctx : fresh
  const emoji = base[hash(m.key.id + (text || m.mtype)) % base.length]
  recent.set(chat, [...used, emoji].slice(-KEEP))
  return emoji
}

const textOf = (m) => String((m.text || (m.msg && (m.msg.caption || m.msg.text)) || '')).slice(0, 600)

// dipanggil dari index.js untuk tiap pesan masuk yang lolos Shield
async function maybe(sock, m, mek) {
  const mode = S.get('reactmsg')
  if (!mode || mode === 'off') return false
  if (!mek || !mek.key || mek.key.fromMe || !m || !m.chat || !m.mtype || SKIP_TYPES.has(m.mtype)) return false
  if (m.chat === 'status@broadcast' || /@(broadcast|newsletter)$/.test(m.chat)) return false
  if (mek.messageStubType != null) return false
  const isGroup = m.chat.endsWith('@g.us')
  const text = textOf(m)
  const prefixes = global.prefixList || ['.', '!', '#', '/']
  const isCmd = prefixes.some(p => text.startsWith(p) && text.length > p.length && /\S/.test(text[p.length]))
  if (mode === 'perintah' && !isCmd) return false
  try { if (isGroup && require('./grupdb').get(m.chat).ban) return false } catch {}
  // pembatas
  const now = Date.now(), gap = isGroup ? 6000 : 2000
  if (now - (lastAt.get(m.chat) || 0) < gap) return false
  stamps = stamps.filter(t => now - t < 60000)
  if (stamps.length >= PER_MIN) return false
  lastAt.set(m.chat, now); stamps.push(now)
  const emoji = pick(m, text, isCmd)
  // jeda acak 0,4-1,6 dtk supaya terlihat seperti manusia
  await new Promise(r => setTimeout(r, 400 + Math.floor(Math.random() * 1200)))
  const send = sock.rawSend || sock.sendMessage.bind(sock)
  await send(m.chat, { react: { text: emoji, key: mek.key } }).catch(() => {})
  return true
}

module.exports = { maybe, pick, pools, GENERAL, YANDERE, CONTEXT, MEDIA, _reset: () => { recent.clear(); lastAt.clear(); stamps = [] } }
