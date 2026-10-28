/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// WEREWOLF — game sosial 5-20 pemain di grup. Aksi malam lewat CHAT PRIBADI ke bot, voting siang di grup.
//   GRUP   : .wwcreate • .wwjoin • .wwleave • .wwstart (host) • .wwplayers • .wwvote <no|0> • .wwlanjut (host) • .wwstop • .wwroles • .wwhelp
//   PRIBADI: .wwkill <no> (werewolf) • .wwcek <no> (seer) • .wwjaga <no> (guardian) • .wwheal / .wwracun <no> / .wwskip (witch) • .wwshoot <no> (hunter)
// Role: Werewolf, Warga, Seer, Guardian, Hunter (>=6 pemain), Witch (>=7 pemain). Pemenang mendapat gold & EXP RPG (maks 6 game/hari).
// Catatan: game disimpan di memori — kalau bot restart, game yang sedang berjalan hilang.
const R = require('../../lib/rpg')

const MIN = 5, MAX = 20
const T = { lobby: 300000, night: 60000, witch: 25000, hunter: 30000, talk: 60000, vote: 45000 }   // ms (bisa diubah saat pengujian)
const DAILY_REWARD_CAP = 6

const ROLE = {
  werewolf: { n: 'Werewolf', e: '🐺', team: 'wolf', d: 'Tiap malam, bersama sesama werewolf pilih satu warga untuk dimangsa (.wwkill <no> di chat pribadi).' },
  villager: { n: 'Warga', e: '🧑‍🌾', team: 'vil', d: 'Tak punya kekuatan khusus. Cari werewolf lewat diskusi dan voting siang hari.' },
  seer: { n: 'Seer (Peramal)', e: '🔮', team: 'vil', d: 'Tiap malam periksa satu pemain: werewolf atau bukan (.wwcek <no> di chat pribadi).' },
  guardian: { n: 'Guardian', e: '🛡️', team: 'vil', d: 'Tiap malam lindungi satu pemain (boleh diri sendiri) dari serangan werewolf. Tidak boleh orang yang sama 2 malam beruntun (.wwjaga <no>).' },
  hunter: { n: 'Hunter (Pemburu)', e: '🏹', team: 'vil', d: 'Saat kamu mati, kamu bisa menembak satu pemain pilihanmu (.wwshoot <no>).' },
  witch: { n: 'Witch (Penyihir)', e: '🧪', team: 'vil', d: 'Punya 1 ramuan penyembuh (.wwheal) dan 1 racun (.wwracun <no>), masing-masing sekali seumur game. Maks 1 aksi per malam.' },
}
const games = new Map()    // chat -> game
const inGame = new Map()   // jid -> chat
const tag = (j) => '@' + j.split('@')[0]
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const k = Math.floor(Math.random() * (i + 1));[a[i], a[k]] = [a[k], a[i]] } return a }

function makeRoles(n) {
  const wolves = n >= 16 ? 4 : n >= 12 ? 3 : n >= 8 ? 2 : 1
  const roles = Array(wolves).fill('werewolf'); roles.push('seer', 'guardian')
  if (n >= 6) roles.push('hunter'); if (n >= 7) roles.push('witch')
  while (roles.length < n) roles.push('villager')
  return shuffle(roles)
}

// ── util game ──
const P = (g, jid) => g.players.find(p => p.jid === jid)
const num = (g, p) => g.players.indexOf(p) + 1
const alive = (g) => g.players.filter(p => p.alive)
const byNum = (g, s) => { const n = parseInt(s); return n >= 1 && n <= g.players.length ? g.players[n - 1] : null }
const roster = (g, onlyAlive) => g.players.filter(p => !onlyAlive || p.alive).map(p => `${p.alive ? '▫️' : '💀'} ${num(g, p)}. ${tag(p.jid)}${p.alive ? '' : ` _(${ROLE[p.role].n})_`}`).join('\n')
const dmList = (g, ps) => ps.map(p => `${num(g, p)}. ${p.name}`).join('\n')

async function say(g, text, mentions) { try { await g.sock.sendMessage(g.chat, { text, mentions: mentions || g.players.map(p => p.jid) }) } catch (e) { console.log('[ww] gagal kirim grup', e.message) } }
async function dm(g, jid, text) { try { await g.sock.sendMessage(jid, { text }); return true } catch (e) { console.log('[ww] gagal DM', jid, e.message); return false } }
function timer(g, ms, fn) {
  const gen = ++g.gen; clearTimeout(g.timer)
  g.timer = setTimeout(() => { if (g.gen === gen && games.get(g.chat) === g) Promise.resolve(fn()).catch(e => console.log('[ww] timer', e.message)) }, ms)
}
const kill = (g, p) => { p.alive = false }

function winner(g) {
  const al = alive(g), w = al.filter(p => p.role === 'werewolf').length, o = al.length - w
  return w === 0 ? 'vil' : w >= o ? 'wolf' : null
}

// ── siklus game ──
async function startGame(g) {
  g.state = 'starting'
  const roles = makeRoles(g.players.length)
  g.players.forEach((p, i) => { p.role = roles[i]; p.alive = true })
  g.witch = { heal: true, poison: true }; g.lastGuard = null; g.day = 0
  const wolves = g.players.filter(p => p.role === 'werewolf'), failed = []
  for (const p of g.players) {
    const r = ROLE[p.role]
    let msg = `${r.e} *PERANMU: ${r.n.toUpperCase()}*\n${r.d}\n\nGame di grup *${g.title}* — total ${g.players.length} pemain.`
    if (p.role === 'werewolf') msg += `\n\n🐺 Rekan werewolf: ${wolves.filter(w => w !== p).map(w => `${num(g, w)}. ${w.name}`).join(', ') || '(kamu sendirian)'}`
    if (!(await dm(g, p.jid, msg))) failed.push(p)
  }
  const cnt = {}; g.players.forEach(p => cnt[p.role] = (cnt[p.role] || 0) + 1)
  await say(g, `🐺 *WEREWOLF DIMULAI!*\n━━━━━━━━━━━━━━━━━━━━\n${roster(g)}\n\n*Komposisi:* ${Object.entries(cnt).map(([k, v]) => `${ROLE[k].e} ${ROLE[k].n} x${v}`).join(' • ')}\nPeran dikirim lewat *chat pribadi* ke bot.${failed.length ? `\n\n⚠️ Gagal DM: ${failed.map(p => tag(p.jid)).join(' ')} — chat pribadi bot dulu, lalu tanya peranmu dengan *.wwrole*.` : ''}`)
  return startNight(g)
}

async function startNight(g) {
  g.state = 'night'; g.day++
  g.night = { wolfVotes: {}, seer: null, guard: null, done: new Set() }
  g.victim = null
  const al = alive(g), wolves = al.filter(p => p.role === 'werewolf')
  await say(g, `🌙 *MALAM KE-${g.day}*\nDesa terlelap... Werewolf, Seer, dan Guardian: cek *chat pribadi* bot sekarang (${Math.round(T.night / 1000)} detik).\n\n*Hidup (${al.length}):*\n${roster(g, true)}`)
  g.need = new Set()
  const others = al.filter(p => p.role !== 'werewolf')
  for (const w of wolves) { g.need.add(w.jid); await dm(g, w.jid, `🐺 *MALAM ${g.day} — pilih mangsa*\n${dmList(g, others)}\n\nBalas: *.wwkill <no>*${wolves.length > 1 ? '\n(suara terbanyak dari para werewolf yang menentukan)' : ''}`) }
  const seer = al.find(p => p.role === 'seer'); if (seer) { g.need.add(seer.jid); await dm(g, seer.jid, `🔮 *MALAM ${g.day} — periksa siapa?*\n${dmList(g, al.filter(p => p !== seer))}\n\nBalas: *.wwcek <no>*`) }
  const gd = al.find(p => p.role === 'guardian'); if (gd) { g.need.add(gd.jid); await dm(g, gd.jid, `🛡️ *MALAM ${g.day} — lindungi siapa?*\n${dmList(g, al.filter(p => p.jid !== g.lastGuard))}\n\nBalas: *.wwjaga <no>*${g.lastGuard ? '\n(tidak boleh orang yang sama seperti semalam)' : ''}`) }
  timer(g, T.night, () => endStage1(g))
}
const checkStage1 = (g) => { if (g.state === 'night' && g.need.size === 0) endStage1(g) }

async function endStage1(g) {
  if (g.state !== 'night') return
  g.state = 'witch'
  // tentukan korban: suara terbanyak, seri → acak
  const tally = {}; for (const v of Object.values(g.night.wolfVotes)) tally[v] = (tally[v] || 0) + 1
  const top = Math.max(0, ...Object.values(tally)), cands = Object.keys(tally).filter(k => tally[k] === top)
  g.victim = cands.length ? cands[Math.floor(Math.random() * cands.length)] : null
  g.night.heal = false; g.night.poison = null
  const w = alive(g).find(p => p.role === 'witch')
  if (w && (g.witch.heal || g.witch.poison)) {
    const v = g.victim && P(g, g.victim), opts = []
    if (g.witch.heal && v) opts.push('*.wwheal* — selamatkan korban')
    if (g.witch.poison) opts.push('*.wwracun <no>* — racuni pemain')
    opts.push('*.wwskip* — tidak melakukan apa-apa')
    await dm(g, w.jid, `🧪 *MALAM ${g.day} — giliran Witch*\n${v ? `Werewolf menyerang *${num(g, v)}. ${v.name}* malam ini.` : 'Werewolf tidak menyerang siapa pun malam ini.'}\n\nPilihanmu (1 aksi saja):\n${opts.join('\n')}${g.witch.poison ? `\n\n${dmList(g, alive(g).filter(p => p !== w))}` : ''}`)
    g.need = new Set([w.jid])
    return timer(g, T.witch, () => resolveNight(g))
  }
  return resolveNight(g)
}

async function resolveNight(g) {
  if (!['witch', 'night'].includes(g.state)) return
  g.state = 'dawn'; clearTimeout(g.timer); g.gen++
  const deaths = []
  const v = g.victim && P(g, g.victim)
  if (v && v.alive && g.night.guard !== v.jid && !g.night.heal) { kill(g, v); deaths.push({ p: v, by: 'diterkam werewolf' }) }
  if (g.night.poison) { const t = P(g, g.night.poison); if (t && t.alive) { kill(g, t); deaths.push({ p: t, by: 'keracunan' }) } }
  g.lastGuard = g.night.guard
  let msg = `☀️ *PAGI HARI KE-${g.day}*\n`
  msg += deaths.length ? deaths.map(d => `💀 ${tag(d.p.jid)} ditemukan tewas (${d.by}). Perannya: ${ROLE[d.p.role].e} *${ROLE[d.p.role].n}*`).join('\n') : '🕊️ Malam ini tenang — *tidak ada korban*.'
  await say(g, msg)
  return afterDeaths(g, deaths.map(d => d.p), () => startDay(g))
}

// hunter yang mati menembak; cek pemenang; lanjut
async function afterDeaths(g, dead, cont) {
  let w = winner(g); if (w) return endGame(g, w)
  const hunter = dead.find(p => p.role === 'hunter')
  if (hunter) {
    g.state = 'hunter'; g.pendingHunter = hunter
    const targets = alive(g)
    await dm(g, hunter.jid, `🏹 *KAMU MATI — tembakan terakhir!*\n${dmList(g, targets)}\n\nBalas *.wwshoot <no>* dalam ${Math.round(T.hunter / 1000)} detik.`)
    await say(g, `🏹 ${tag(hunter.jid)} adalah *Hunter*! Ia mengangkat busurnya untuk tembakan terakhir...`)
    g.afterHunter = cont
    return timer(g, T.hunter, () => hunterDone(g, null))
  }
  return cont()
}
async function hunterDone(g, target) {
  if (g.state !== 'hunter') return
  const h = g.pendingHunter; g.pendingHunter = null; clearTimeout(g.timer); g.gen++
  const cont = g.afterHunter; g.afterHunter = null
  if (target && target.alive) {
    kill(g, target)
    await say(g, `🏹 Anak panah ${tag(h.jid)} menembus ${tag(target.jid)}! Perannya: ${ROLE[target.role].e} *${ROLE[target.role].n}*`)
    const w = winner(g); if (w) return endGame(g, w)
  } else await say(g, `🏹 ${tag(h.jid)} gagal membidik — panah tak terlepas.`)
  return cont()
}

async function startDay(g) {
  g.state = 'talk'
  await say(g, `🗣️ *DISKUSI* (${Math.round(T.talk / 1000)} detik)\nDebatlah! Siapa yang mencurigakan?\n\n*Hidup (${alive(g).length}):*\n${roster(g, true)}\n\n_Host bisa percepat dengan *.wwlanjut*_`)
  timer(g, T.talk, () => startVote(g))
}
async function startVote(g) {
  if (g.state !== 'talk') return
  g.state = 'vote'; g.votes = {}
  await say(g, `🗳️ *VOTING* (${Math.round(T.vote / 1000)} detik)\nGantung satu pemain: *.wwvote <no>*  •  tidak memilih: *.wwvote 0*\n\n${roster(g, true)}`)
  timer(g, T.vote, () => resolveVote(g))
}
async function resolveVote(g) {
  if (g.state !== 'vote') return
  g.state = 'tally'; clearTimeout(g.timer); g.gen++
  const tally = {}; for (const v of Object.values(g.votes)) if (v !== 0) tally[v] = (tally[v] || 0) + 1
  const top = Math.max(0, ...Object.values(tally)), cands = Object.keys(tally).filter(k => tally[k] === top)
  const lines = Object.entries(tally).sort((a, b) => b[1] - a[1]).map(([j, n]) => `• ${tag(j)} — ${n} suara`)
  let dead = []
  if (!cands.length || cands.length > 1) {
    await say(g, `🗳️ *HASIL VOTING*\n${lines.join('\n') || '_tidak ada suara_'}\n\n${cands.length > 1 ? '⚖️ Suara seri — tak ada yang digantung.' : '🤷 Tak ada yang dipilih — tak ada yang digantung.'}`)
  } else {
    const t = P(g, cands[0]); kill(g, t); dead = [t]
    await say(g, `🗳️ *HASIL VOTING*\n${lines.join('\n')}\n\n⚖️ ${tag(t.jid)} digantung warga! Perannya: ${ROLE[t.role].e} *${ROLE[t.role].n}*`)
  }
  return afterDeaths(g, dead, () => startNight(g))
}

async function endGame(g, side) {
  g.state = 'end'; clearTimeout(g.timer); g.gen++
  const wolfWin = side === 'wolf', winners = g.players.filter(p => (ROLE[p.role].team === 'wolf') === wolfWin)
  const n = g.players.length, rewards = []
  for (const p of winners) {
    const u = R.get(p.jid); if (!u) continue
    const d = R.today(); u.ww = u.ww && u.ww.d === d ? u.ww : { d, n: 0 }
    if (u.ww.n >= DAILY_REWARD_CAP) { rewards.push(`${p.name}: (batas hadiah harian tercapai)`); continue }
    u.ww.n++
    const surv = p.alive ? 1.2 : 1, gold = Math.floor((250 + 40 * n) * surv), ex = R.addExp(u, Math.floor((80 + 15 * n) * surv), { raw: true }); u.gold += gold
    rewards.push(`${p.name}: +${R.fmt(gold)} gold, +${R.fmt(ex.amt)} EXP${ex.up ? ` ⬆Lv.${ex.lvl}` : ''}`)
  }
  R.save()
  await say(g, `🏆 *${wolfWin ? '🐺 PARA WEREWOLF MENANG!' : '🏘️ DESA MENANG! Semua werewolf musnah.'}*\n━━━━━━━━━━━━━━━━━━━━\n*Peran semua pemain:*\n${g.players.map(p => `${p.alive ? '▫️' : '💀'} ${num(g, p)}. ${tag(p.jid)} — ${ROLE[p.role].e} ${ROLE[p.role].n}`).join('\n')}${rewards.length ? `\n\n🎁 *Hadiah pemenang (pemain RPG):*\n${rewards.join('\n')}` : ''}\n\n_Main lagi: .wwcreate_`)
  cleanup(g)
}
function cleanup(g) { clearTimeout(g.timer); g.gen++; for (const p of g.players) if (inGame.get(p.jid) === g.chat) inGame.delete(p.jid); if (games.get(g.chat) === g) games.delete(g.chat) }

const HELP = (p) => `🐺 *WEREWOLF*\n━━━━━━━━━━━━━━━━━━━━\n*Cara main*\n1. Di grup: ${p}wwcreate → semua ${p}wwjoin (min ${MIN}, maks ${MAX})\n2. Host: ${p}wwstart → peran dikirim lewat *chat pribadi* bot\n3. *Malam*: werewolf memangsa, seer memeriksa, guardian melindungi (aksi lewat chat pribadi bot)\n4. *Siang*: diskusi lalu ${p}wwvote <no> di grup untuk menggantung tersangka\n5. Desa menang jika semua werewolf mati; werewolf menang jika jumlahnya ≥ sisa warga.\n\n*Perintah grup:* ${p}wwcreate ${p}wwjoin ${p}wwleave ${p}wwstart ${p}wwplayers ${p}wwvote ${p}wwlanjut ${p}wwstop ${p}wwroles\n*Perintah pribadi:* ${p}wwkill ${p}wwcek ${p}wwjaga ${p}wwheal ${p}wwracun ${p}wwskip ${p}wwshoot ${p}wwrole`

module.exports = {
  name: 'werewolf',
  alias: ['ww', 'wwcreate', 'wwjoin', 'wwleave', 'wwstart', 'wwstop', 'wwplayers', 'wwhelp', 'wwroles', 'wwlanjut', 'wwvote', 'wwkill', 'wwcek', 'wwjaga', 'wwheal', 'wwracun', 'wwskip', 'wwshoot', 'wwrole', 'werewolfhelp'],
  category: 'fun', noLimit: true, cmds: ['wwcreate', 'wwjoin', 'wwstart', 'wwplayers', 'wwvote', 'wwhelp'],
  menu: ['wwcreate', 'wwjoin', 'wwleave', 'wwstart', 'wwplayers', 'wwvote', 'wwlanjut', 'wwstop', 'wwroles', 'wwhelp'],
  desc: 'Werewolf 5-20 pemain: .wwcreate, .wwjoin, .wwstart (aksi malam via chat pribadi)',
  T,   // diekspos untuk pengujian
  _games: games,
  run: async ({ sock, m, command: c0, args, prefix, reply, pushname, isGroup, isAdmins, isCreator }) => {
    const c = c0 === 'ww' ? ((args.shift() || 'wwhelp').toLowerCase().replace(/^(?!ww)/, 'ww')) : c0
    const me = m.sender, name = (pushname && pushname !== 'no name') ? pushname : me.split('@')[0]

    if (['wwhelp', 'werewolfhelp'].includes(c)) return reply(HELP(prefix))
    if (c === 'wwroles') return reply('🐺 *PERAN WEREWOLF*\n\n' + Object.values(ROLE).map(r => `${r.e} *${r.n}*\n${r.d}`).join('\n\n') + `\n\n_Komposisi: werewolf ${[[5, 1], [8, 2], [12, 3], [16, 4]].map(([n, w]) => `${w} (≥${n} pemain)`).join(', ')}; Hunter mulai 6 pemain, Witch mulai 7._`)

    // ── perintah GRUP ──
    if (['wwcreate', 'wwjoin', 'wwleave', 'wwstart', 'wwstop', 'wwplayers', 'wwvote', 'wwlanjut'].includes(c)) {
      if (!isGroup) return reply('Perintah ini dipakai di *grup*. Aksi malam (wwkill, wwcek, dll.) dipakai di chat pribadi bot.')
      let g = games.get(m.chat)

      if (c === 'wwcreate') {
        if (g) return reply(`Sudah ada game di grup ini (${g.state === 'lobby' ? 'lobi terbuka — ' + prefix + 'wwjoin' : 'sedang berjalan'}).`)
        if (inGame.has(me)) return reply('Kamu masih ada di game lain.')
        let title = 'grup ini'; try { title = (await sock.groupMetadata(m.chat)).subject || title } catch {}
        g = { chat: m.chat, sock, host: me, title, state: 'lobby', players: [{ jid: me, name, alive: true }], gen: 0, timer: null }
        games.set(m.chat, g); inGame.set(me, m.chat)
        timer(g, T.lobby, async () => { if (g.state === 'lobby') { await say(g, '⌛ Lobi werewolf ditutup karena tidak dimulai tepat waktu.'); cleanup(g) } })
        return sock.sendMessage(m.chat, { text: `🐺 *LOBI WEREWOLF DIBUKA* oleh ${tag(me)}\nMinimal ${MIN}, maksimal ${MAX} pemain.\n\nGabung: *${prefix}wwjoin*\nMulai (host): *${prefix}wwstart*\n_Lobi ditutup otomatis dalam ${Math.round(T.lobby / 60000)} menit._\n\n${roster(g)}`, mentions: [me] }, { quoted: m })
      }
      if (!g) return reply(`Tidak ada game di grup ini. Buat: ${prefix}wwcreate`)

      if (c === 'wwplayers') return sock.sendMessage(m.chat, { text: `🐺 *PEMAIN (${g.players.length})* — ${g.state === 'lobby' ? 'lobi' : `hari ke-${g.day}`}\n${roster(g)}`, mentions: g.players.map(p => p.jid) }, { quoted: m })
      if (c === 'wwjoin') {
        if (g.state !== 'lobby') return reply('Game sudah berjalan, tunggu ronde berikutnya.')
        if (P(g, me)) return reply('Kamu sudah bergabung.')
        if (inGame.has(me)) return reply('Kamu masih ada di game grup lain.')
        if (g.players.length >= MAX) return reply(`Pemain penuh (${MAX}).`)
        g.players.push({ jid: me, name, alive: true }); inGame.set(me, m.chat)
        return sock.sendMessage(m.chat, { text: `✅ ${tag(me)} bergabung (${g.players.length}/${MAX}).${g.players.length >= MIN ? `\nSudah cukup! Host bisa *${prefix}wwstart*.` : `\nButuh ${MIN - g.players.length} lagi.`}`, mentions: [me] }, { quoted: m })
      }
      if (c === 'wwleave') {
        if (g.state !== 'lobby') return reply('Game sudah berjalan — tidak bisa keluar. Host bisa menghentikan dengan .wwstop')
        if (!P(g, me)) return reply('Kamu tidak ada di lobi.')
        g.players = g.players.filter(p => p.jid !== me); inGame.delete(me)
        if (!g.players.length) { cleanup(g); return reply('Lobi kosong — dibubarkan.') }
        if (g.host === me) g.host = g.players[0].jid
        return sock.sendMessage(m.chat, { text: `👋 ${tag(me)} keluar. Host: ${tag(g.host)}`, mentions: [me, g.host] }, { quoted: m })
      }
      if (c === 'wwstop') {
        if (me !== g.host && !isAdmins && !isCreator) return reply('Hanya host / admin grup yang bisa menghentikan game.')
        await say(g, `🛑 Game werewolf dihentikan oleh ${tag(me)}.${g.state !== 'lobby' ? `\n\n*Peran:*\n${g.players.map(p => `${num(g, p)}. ${tag(p.jid)} — ${ROLE[p.role] ? ROLE[p.role].n : '-'}`).join('\n')}` : ''}`, g.players.map(p => p.jid))
        return cleanup(g)
      }
      if (c === 'wwstart') {
        if (g.state !== 'lobby') return reply('Game sudah berjalan.')
        if (me !== g.host && !isAdmins && !isCreator) return reply(`Hanya host (${tag(g.host)}) yang bisa memulai.`)
        if (g.players.length < MIN) return reply(`Pemain kurang (${g.players.length}/${MIN}).`)
        return startGame(g)
      }
      if (c === 'wwlanjut') {
        if (me !== g.host && !isAdmins && !isCreator) return reply('Hanya host / admin yang bisa mempercepat.')
        if (g.state !== 'talk') return reply('Hanya bisa saat fase diskusi.')
        return startVote(g)
      }
      if (c === 'wwvote') {
        if (g.state !== 'vote') return reply('Sekarang bukan waktu voting.')
        const p = P(g, me); if (!p || !p.alive) return reply('Hanya pemain yang masih hidup yang bisa memilih.')
        const arg = (args[0] || '').trim()
        if (arg === '0' || /^skip$/i.test(arg)) { g.votes[me] = 0 }
        else { const t = byNum(g, arg); if (!t || !t.alive) return reply(`Pilih nomor pemain yang hidup.\n${roster(g, true)}`); if (t === p) return reply('Tidak bisa memilih diri sendiri.'); g.votes[me] = t.jid }
        const done = Object.keys(g.votes).length, total = alive(g).length
        await sock.sendMessage(m.chat, { text: `🗳️ ${tag(me)} telah memilih (${done}/${total}).`, mentions: [me] }, { quoted: m })
        if (done >= total) return resolveVote(g)
        return
      }
    }

    // ── perintah PRIBADI (aksi malam) ──
    if (isGroup) return reply(`Perintah *${prefix}${c}* hanya di *chat pribadi* bot (supaya rahasia). Buka chat pribadi dengan bot lalu kirim ulang.`)
    const chat = inGame.get(me), g = chat && games.get(chat)
    if (!g) return reply('Kamu tidak sedang dalam game werewolf.')
    const p = P(g, me)
    if (c === 'wwrole') return reply(`${ROLE[p.role].e} Peranmu: *${ROLE[p.role].n}*\n${ROLE[p.role].d}${p.alive ? '' : '\n\n💀 Kamu sudah mati.'}`)
    if (!p.alive && c !== 'wwshoot') return reply('💀 Kamu sudah mati — jangan membocorkan informasi ke pemain hidup ya.')
    const tgt = byNum(g, args[0])

    if (c === 'wwkill') {
      if (p.role !== 'werewolf') return reply('Kamu bukan werewolf.')
      if (g.state !== 'night') return reply('Bukan waktu aksi malam.')
      if (!tgt || !tgt.alive || tgt.role === 'werewolf') return reply('Pilih nomor warga (bukan werewolf) yang masih hidup.')
      g.night.wolfVotes[me] = tgt.jid; g.need.delete(me); await reply(`🐺 Kamu memilih memangsa *${num(g, tgt)}. ${tgt.name}*.`)
      for (const w of g.players.filter(x => x.role === 'werewolf' && x.alive && x.jid !== me)) dm(g, w.jid, `🐺 ${p.name} memilih mangsa: *${num(g, tgt)}. ${tgt.name}*`)
      return checkStage1(g)
    }
    if (c === 'wwcek') {
      if (p.role !== 'seer') return reply('Kamu bukan seer.')
      if (g.state !== 'night') return reply('Bukan waktu aksi malam.')
      if (g.night.seer) return reply('Kamu sudah memeriksa malam ini.')
      if (!tgt || !tgt.alive || tgt === p) return reply('Pilih nomor pemain hidup selain dirimu.')
      g.night.seer = tgt.jid; g.need.delete(me)
      await reply(`🔮 Penglihatanmu tentang *${num(g, tgt)}. ${tgt.name}*: ${tgt.role === 'werewolf' ? '🐺 *WEREWOLF!*' : '✅ *Bukan werewolf.*'}`)
      return checkStage1(g)
    }
    if (c === 'wwjaga') {
      if (p.role !== 'guardian') return reply('Kamu bukan guardian.')
      if (g.state !== 'night') return reply('Bukan waktu aksi malam.')
      if (g.night.guard) return reply('Kamu sudah memilih malam ini.')
      if (!tgt || !tgt.alive) return reply('Pilih nomor pemain yang hidup.')
      if (tgt.jid === g.lastGuard) return reply('Tidak boleh melindungi orang yang sama 2 malam beruntun.')
      g.night.guard = tgt.jid; g.need.delete(me); await reply(`🛡️ Kamu melindungi *${num(g, tgt)}. ${tgt.name}* malam ini.`)
      return checkStage1(g)
    }
    if (['wwheal', 'wwracun', 'wwskip'].includes(c)) {
      if (p.role !== 'witch') return reply('Kamu bukan witch.')
      if (g.state !== 'witch') return reply('Belum giliranmu (tunggu DM dari bot setelah werewolf memilih).')
      if (c === 'wwskip') { await reply('🧪 Kamu memilih diam malam ini.'); return resolveNight(g) }
      if (c === 'wwheal') {
        if (!g.witch.heal) return reply('Ramuan penyembuhmu sudah habis.')
        if (!g.victim) return reply('Tidak ada korban yang bisa diselamatkan malam ini.')
        g.witch.heal = false; g.night.heal = true; await reply('🧪 Kamu menyelamatkan korban malam ini.'); return resolveNight(g)
      }
      if (!g.witch.poison) return reply('Racunmu sudah habis.')
      if (!tgt || !tgt.alive || tgt === p) return reply('Pilih nomor pemain hidup selain dirimu: .wwracun <no>')
      g.witch.poison = false; g.night.poison = tgt.jid; await reply(`🧪 Kamu meracuni *${num(g, tgt)}. ${tgt.name}*.`); return resolveNight(g)
    }
    if (c === 'wwshoot') {
      if (g.state !== 'hunter' || !g.pendingHunter || g.pendingHunter !== p) return reply('Tidak ada tembakan Hunter untukmu sekarang.')
      if (!tgt || !tgt.alive) return reply('Pilih nomor pemain yang masih hidup.')
      await reply(`🏹 Kamu menembak *${num(g, tgt)}. ${tgt.name}*.`); return hunterDone(g, tgt)
    }
    return reply(HELP(prefix))
  },
}
