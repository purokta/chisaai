/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// BUDAK (Slave Contract) ala isekai: beli di pasar, jinakkan sesuai ras & skill jinak, lalu pasang / kerja / latih
const { R, need } = require('../../lib/rpgctx')
const S = require('../../lib/slave')
const B = require('../../lib/rpgbtn')
const fmt = R.fmt

const MAP = {
  pasarbudak: 'pasar', slavemarket: 'pasar', budakmarket: 'pasar', budak: 'pasar',
  belibudak: 'beli', buyslave: 'beli',
  budakku: 'list', slaves: 'list', mybudak: 'list', kandang: 'list',
  detailbudak: 'detail', infobudak: 'detail', slaveinfo: 'detail',
  jinakkan: 'jinak', tame: 'jinak', jinak: 'jinak',
  skilljinak: 'skill', tameskill: 'skill',
  ras: 'ras', daftarras: 'ras', racelist: 'ras',
  pasangbudak: 'pasang', setslave: 'pasang',
  kerjabudak: 'kerja', slavework: 'kerja',
  kerjasemua: 'kerjaall', workall: 'kerjaall',
  rawat: 'rawat', rawatbudak: 'rawat', feedslave: 'rawat',
  latih: 'latih', latihbudak: 'latih',
  lepasbudak: 'lepas', jualbudak: 'lepas', releaseslave: 'lepas',
  namabudak: 'nama', renameslave: 'nama',
}
const STATE = { liar: '🔗 Liar', jinak: '✅ Jinak' }
const bar = (c, m) => R.bar(c, m, 8)
const left = (ms) => R.dur(Math.max(1, Math.ceil(ms / 1000)))
const lab = (sl) => { const r = S.RACES[sl.race]; return `${r.e} *${sl.name}* (${r.n}) Lv.${sl.lv} [${r.rar}]` }
const short = (sl) => { const r = S.RACES[sl.race]; return `${r.e} ${sl.name} Lv.${sl.lv}` }
const row = (title, desc, id) => ({ title: String(title).slice(0, 24), description: String(desc).slice(0, 72), id })

module.exports = {
  name: 'pasarbudak',
  alias: Object.keys(MAP).filter(k => k !== 'pasarbudak'),
  category: 'rpg',
  cmds: ['pasarbudak', 'budakku', 'jinakkan', 'skilljinak', 'ras', 'kerjasemua', 'pasangbudak', 'rawat', 'latih', 'belibudak', 'lepasbudak'],
  desc: 'Budak ala isekai: beli di pasar, jinakkan sesuai ras & skill jinak, pasang jadi petarung, kerja, rawat, latih',
  run: async (ctx) => {
    const { m, args, prefix, command } = ctx
    const send = (text, o = {}) => B.send(ctx, text, o)
    const u = need(ctx); if (!u) return
    S.init(u)
    const cmd = MAP[command] || 'pasar', p = prefix
    const st = R.stats(u)
    const arg0 = args[0]

    const needSlave = (a) => {
      const sl = S.find(u, a)
      if (!sl) { send(`❓ Budak tidak ditemukan.\nLihat daftar: *${p}budakku*`, { quick: [['🧺 Budakku', 'budakku'], ['🏛️ Pasar', 'pasarbudak']] }); return null }
      return sl
    }
    const chanceTxt = (sl) => { const c = S.tameChance(u, sl, st), r = S.RACES[sl.race]; return `peluang jinak ~${c}% (skill min Lv.${r.need}${S.classBonus(u.cls, sl.race) ? ', class cocok ✨' : ''})` }

    // ───────── PASAR ─────────
    if (cmd === 'pasar') {
      const mk = S.market(R.db); R.save()
      const lines = mk.list.map((sl, i) => {
        const r = S.RACES[sl.race]
        return `*${i + 1}.* ${lab(sl)}\n   ${STATE[sl.state]}${sl.state === 'liar' ? ` — ${chanceTxt(sl)}` : ` • kesetiaan ${sl.loyal}`}\n   💰 ${fmt(sl.price)}g${i === mk.list.length - 1 ? '' : '\n'}`
      })
      const t = `🏛️ *PASAR BUDAK*\n_Stok berganti ${left(mk.until - Date.now())} lagi_\n\n💰 Gold: ${fmt(u.gold)} • 🎯 Skill Jinak Lv.${u.tame.lv} • 🏠 Kandang ${u.slaves.length}/${S.capacity(u)}\n\n${lines.length ? lines.join('\n') : '_Stok habis. Tunggu pasar diperbarui._'}\n\n🔗 *Liar* = murah tapi harus dijinakkan dulu.\n✅ *Jinak* = langsung patuh, harga ±1.8x.`
      const rows = mk.list.map((sl, i) => row(`${i + 1}. ${S.RACES[sl.race].e} ${sl.name} Lv.${sl.lv}`, `${S.RACES[sl.race].n} [${S.RACES[sl.race].rar}] • ${STATE[sl.state]} • ${fmt(sl.price)}g`, `${p}belibudak ${sl.uid}`))
      return send(t, { quick: [['🧺 Budakku', 'budakku'], ['🎯 Skill Jinak', 'skilljinak'], ['🧬 Daftar Ras', 'ras']], lists: rows.length ? [{ title: '🛒 Beli Budak', sections: [{ title: 'Stok Pasar', rows }] }] : [] })
    }

    // ───────── BELI ─────────
    if (cmd === 'beli') {
      const mk = S.market(R.db)
      const k = String(arg0 || '').toLowerCase()
      const sl = /^\d$/.test(k) ? mk.list[parseInt(k) - 1] : mk.list.find(x => x.uid === k)
      if (!arg0) return send(`Pilih budak dari pasar:\n*${p}belibudak <no>*`, { quick: [['🏛️ Pasar Budak', 'pasarbudak']] })
      if (!sl) return send('⚠️ Budak itu sudah terjual / pasar sudah diperbarui.', { quick: [['🏛️ Lihat Pasar', 'pasarbudak']] })
      if (u.slaves.length >= S.capacity(u)) return send(`🏠 Kandang penuh (${u.slaves.length}/${S.capacity(u)}). Naik level untuk menambah kapasitas, atau lepas budak lama.`, { quick: [['🧺 Budakku', 'budakku']] })
      if (u.gold < sl.price) return send(`💰 Gold kurang. Butuh ${fmt(sl.price)}g (kamu ${fmt(u.gold)}g).`, { quick: [['🏛️ Pasar', 'pasarbudak'], ['💼 Kerja', 'work'], ['⚔️ Hunt', 'hunt']] })
      u.gold -= sl.price
      mk.list = mk.list.filter(x => x !== sl)
      u.slaves.push(sl); R.save()
      const r = S.RACES[sl.race]
      const t = `📜 *KONTRAK DIBUAT!*\n${lab(sl)}\n_${r.desc}_\n\n💰 -${fmt(sl.price)}g • sisa ${fmt(u.gold)}g\n${sl.state === 'liar' ? `🔗 Dia masih *liar*. Jinakkan dulu — ${chanceTxt(sl)}` : `✅ Dia sudah patuh. Pasang sebagai petarung atau suruh bekerja.`}`
      return send(t, { quick: sl.state === 'liar' ? [['🔗 Jinakkan', `jinakkan ${sl.uid}`], ['🧺 Budakku', 'budakku'], ['🏛️ Pasar', 'pasarbudak']] : [['⭐ Pasang', `pasangbudak ${sl.uid}`], ['💼 Kerja', `kerjabudak ${sl.uid}`], ['🧺 Budakku', 'budakku']] })
    }

    // ───────── DAFTAR ─────────
    if (cmd === 'list') {
      if (!u.slaves.length) return send(`🧺 Kamu belum punya budak.\nBeli di *${p}pasarbudak* lalu jinakkan sesuai skill-mu.`, { quick: [['🏛️ Pasar Budak', 'pasarbudak'], ['🎯 Skill Jinak', 'skilljinak']] })
      const act = u.slaveActive
      const lines = u.slaves.map((sl, i) => `*${i + 1}.* ${act === sl.uid && sl.state === 'jinak' ? '⭐ ' : ''}${lab(sl)}\n   ${STATE[sl.state]}${sl.state === 'jinak' ? ` • ❤️ ${sl.loyal}/100` : ` • ${chanceTxt(sl)}`}`)
      const ready = u.slaves.filter(s => s.state === 'jinak' && Date.now() - (s.lastWork || 0) > 20 * 60000).length
      const t = `🧺 *BUDAK ${u.name.toUpperCase()}*\n🏠 ${u.slaves.length}/${S.capacity(u)} • 🎯 Skill Jinak Lv.${u.tame.lv} • 💼 Siap kerja: ${ready}\n\n${lines.join('\n\n')}`
      const rows = u.slaves.map((sl, i) => row(`${i + 1}. ${short(sl)}`, `${STATE[sl.state]} • ${S.RACES[sl.race].n}`, `${p}detailbudak ${sl.uid}`))
      const wild = u.slaves.some(s => s.state === 'liar')
      return send(t, { quick: [[wild ? '🔗 Jinakkan' : '🏛️ Pasar', wild ? 'jinakkan' : 'pasarbudak'], ['💼 Kerja Semua', 'kerjasemua'], ['🎯 Skill Jinak', 'skilljinak']], lists: [{ title: '⚙️ Kelola Budak', sections: [{ title: 'Pilih budak', rows }] }] })
    }

    // ───────── DETAIL ─────────
    if (cmd === 'detail') {
      const sl = needSlave(arg0); if (!sl) return
      const r = S.RACES[sl.race], s = S.statsOf(sl), k = S.loyalFactor(sl), pp = S.perkPct(sl)
      const perk = { atk: 'ATK ×1.3', def: 'DEF ×1.3', hp: 'HP ×1.3', exp: `EXP +${pp}%`, gold: `Gold +${pp}%` }[r.perk]
      const t = `${lab(sl)}${u.slaveActive === sl.uid && sl.state === 'jinak' ? ' ⭐' : ''}\n_${r.desc}_\n\n${STATE[sl.state]}${sl.state === 'jinak' ? ` • ❤️ Kesetiaan ${sl.loyal}/100 (${Math.round(k * 100)}% efektif)` : ''}\n✨ EXP ${bar(sl.exp, S.expNeed(sl.lv))} ${fmt(sl.exp)}/${fmt(S.expNeed(sl.lv))}\n⚔️ ATK ${fmt(s.atk)} • 🛡️ DEF ${fmt(s.def)} • ❤️ HP ${fmt(s.hp)}\n🎽 Bonus saat dipasang: ATK +${fmt(s.atk * k * S.BATTLE)} • DEF +${fmt(s.def * k * S.BATTLE)} • HP +${fmt(s.hp * k * S.BATTLE)}\n🎁 Keunggulan ras: ${perk}\n${sl.state === 'liar' ? `\n🔗 ${chanceTxt(sl)}${sl.fails ? `\n📈 Gagal ${sl.fails}x → +${sl.fails * 3}% (dia mulai terbiasa)` : ''}\n💧 Biaya MP: ${S.tameCost(sl.race)}` : ''}`
      const quick = sl.state === 'liar' ? [['🔗 Jinakkan', `jinakkan ${sl.uid}`], ['🧺 Budakku', 'budakku'], ['🏛️ Pasar', 'pasarbudak']]
        : [[u.slaveActive === sl.uid ? '⭐ Aktif' : '⭐ Pasang', `pasangbudak ${sl.uid}`], ['💼 Kerja', `kerjabudak ${sl.uid}`], ['💗 Rawat', `rawat ${sl.uid}`]]
      const more = [row('🏋️ Latih', `${fmt(150 + sl.lv * 60)}g • naik EXP budak`, `${p}latih ${sl.uid}`), row('🕊️ Lepas / Jual', `Dapat ${fmt(Math.floor(sl.price * (sl.state === 'jinak' ? 0.4 : 0.3)))}g`, `${p}lepasbudak ${sl.uid}`)]
      return send(t, { quick, lists: [{ title: '⚙️ Aksi Lain', sections: [{ title: sl.name, rows: more }] }] })
    }

    // ───────── JINAKKAN ─────────
    if (cmd === 'jinak') {
      if (!arg0) {
        const wild = u.slaves.filter(s => s.state === 'liar')
        if (!wild.length) return send(`Tidak ada budak liar di kandangmu.\nBeli di pasar: *${p}pasarbudak*`, { quick: [['🏛️ Pasar Budak', 'pasarbudak'], ['🧺 Budakku', 'budakku']] })
        const rows = wild.map(sl => row(`${short(sl)}`, `${S.RACES[sl.race].n} • peluang ~${S.tameChance(u, sl, st)}% • MP ${S.tameCost(sl.race)}`, `${p}jinakkan ${sl.uid}`))
        return send(`🔗 *BUDAK LIAR* (${wild.length})\nPilih yang mau dijinakkan.\n💧 MP kamu: ${fmt(u.mp)}/${fmt(st.maxmp)} • 🎯 Skill Jinak Lv.${u.tame.lv}`, { quick: [['🎯 Skill Jinak', 'skilljinak'], ['💊 Heal', 'heal'], ['🏛️ Pasar', 'pasarbudak']], lists: [{ title: '🔗 Pilih Budak Liar', sections: [{ title: 'Budak liar', rows }] }] })
      }
      const sl = needSlave(arg0); if (!sl) return
      if (sl.state === 'jinak') return send(`${lab(sl)} sudah jinak.`, { quick: [['⭐ Pasang', `pasangbudak ${sl.uid}`], ['💼 Kerja', `kerjabudak ${sl.uid}`], ['🧺 Budakku', 'budakku']] })
      const pre = S.tameChance(u, sl, st)
      if (pre < 30 && String(args[1] || '').toLowerCase() !== 'ya') return send(`⚠️ *PELUANG RENDAH* (~${pre}%)\n${lab(sl)} jauh di atas skill jinakmu (min Lv.${S.RACES[sl.race].need}, kamu Lv.${u.tame.lv}).\nJika gagal kamu terluka, dan ada kemungkinan *budak kabur*.\n\n_Naikkan skill dengan menjinakkan ras yang lebih mudah dulu._`, { quick: [['🔗 Tetap Jinakkan', `jinakkan ${sl.uid} ya`], ['🎯 Skill Jinak', 'skilljinak'], ['🧺 Budakku', 'budakku']] })
      const cdLeft = R.cooldown(u, 'tame', 40); if (cdLeft) return send(`⏳ Atur napas dulu, ${R.dur(cdLeft)} lagi.`, { quick: [['🔗 Coba lagi', `jinakkan ${sl.uid}`]] })
      const r = S.RACES[sl.race], cost = S.tameCost(sl.race)
      if (u.mp < cost) { delete u.cd.tame; return send(`💧 MP kurang untuk ritual penjinak.\nButuh ${cost} MP (kamu ${fmt(u.mp)}). Pulihkan dulu.`, { quick: [['💊 Heal', 'heal'], ['🎒 Tas', 'inv'], ['🧺 Budakku', 'budakku']] }) }
      u.mp -= cost
      const chance = S.tameChance(u, sl, st), win = Math.random() * 100 < chance
      let t, quick
      if (win) {
        sl.state = 'jinak'; sl.loyal = Math.max(sl.loyal, 25 + R.rnd(0, 10)); sl.fails = 0
        const up = S.addTameExp(u, 12 + r.need * 2)
        t = `🔗✨ *SEGEL KONTRAK TERPASANG!*\n${lab(sl)} akhirnya tunduk padamu.\n_${R.pick(['Matanya melunak. Ia berlutut perlahan.', 'Lingkaran sihir bersinar dan amarahnya mereda.', 'Ia menatapmu lama, lalu mengangguk pelan.'])}_\n\n🎯 Peluang tadi ${chance}% • 💧 -${cost} MP\n📈 Skill Jinak +${12 + r.need * 2} EXP${up ? `\n🎉 *SKILL JINAK NAIK!* Lv.${u.tame.lv}` : ''}`
        quick = [['⭐ Pasang', `pasangbudak ${sl.uid}`], ['💼 Kerja', `kerjabudak ${sl.uid}`], ['🧺 Budakku', 'budakku']]
      } else {
        sl.fails = (sl.fails || 0) + 1
        const up = S.addTameExp(u, 4 + Math.floor(r.need / 2))
        const dmg = Math.min(Math.max(1, u.hp - 1), Math.floor(st.maxhp * 0.4), Math.max(1, Math.floor(S.statsOf(sl).atk * R.rnd(8, 14) / 10)))
        u.hp -= dmg
        let esc = false
        if (chance < 30 && Math.random() < 0.12) esc = true
        if (esc) { u.slaves = u.slaves.filter(x => x !== sl); if (u.slaveActive === sl.uid) u.slaveActive = null }
        t = `💢 *PENJINAKAN GAGAL!*\n${lab(sl)} ${R.pick(['meronta dan menyerangmu', 'menolak segel kontrak', 'menggigit tali sihirmu', 'mengamuk di kandang'])}.\n\n🎯 Peluang tadi ${chance}% • 💧 -${cost} MP • ❤️ -${fmt(dmg)} HP\n📈 Skill Jinak +${4 + Math.floor(r.need / 2)} EXP${up ? ` • 🎉 naik Lv.${u.tame.lv}` : ''}\n${esc ? `\n🏃 *${sl.name} KABUR!* Ia lolos saat kamu lengah. Budak liar yang terlalu kuat memang berbahaya.` : `📈 Peluang berikutnya +3% (dia mulai terbiasa).`}`
        quick = esc ? [['🏛️ Pasar', 'pasarbudak'], ['🎯 Skill Jinak', 'skilljinak'], ['💊 Heal', 'heal']] : [['🔗 Coba lagi', `jinakkan ${sl.uid}`], ['💊 Heal', 'heal'], ['🧺 Budakku', 'budakku']]
      }
      R.save(); return send(t, { quick })
    }

    // ───────── SKILL JINAK ─────────
    if (cmd === 'skill') {
      const tm = u.tame, need_ = tm.lv >= S.TAME_MAX ? 0 : S.tameNeed(tm.lv)
      const fav = (S.CLASS_AFF[u.cls] || []).map(k => S.RACES[k].e + ' ' + S.RACES[k].n).join(', ') || '-'
      const rows = Object.entries(S.RACES).sort((a, b) => a[1].need - b[1].need).map(([k, r]) => {
        const c = S.tameChance(u, { race: k, lv: 1, fails: 0 }, st)
        return `${r.e} ${r.n} [${r.rar}] — min Lv.${r.need} • ~${c}%`
      })
      const t = `🎯 *SKILL JINAK*\nLv.${tm.lv}/${S.TAME_MAX}${need_ ? ` ${bar(tm.exp, need_)} ${fmt(tm.exp)}/${fmt(need_)}` : ' • MAX'}\n\n*Peluang jinak (budak Lv.1):*\n${rows.join('\n')}\n\n✨ Class-mu cocok dengan: ${fav}\n_Peluang naik dengan skill jinak, stat afinitas ras (STR/AGI/INT), dan class yang cocok. Turun jika level budak tinggi._`
      return send(t, { quick: [['🔗 Jinakkan', 'jinakkan'], ['🏛️ Pasar', 'pasarbudak'], ['🧺 Budakku', 'budakku']] })
    }

    // ───────── RAS ─────────
    if (cmd === 'ras') {
      const aff = { str: 'STR', agi: 'AGI', int: 'INT', def: 'DEF' }, pk = { atk: 'ATK', def: 'DEF', hp: 'HP', exp: 'EXP', gold: 'Gold' }
      const t = `🧬 *DAFTAR RAS BUDAK*\n\n` + Object.entries(S.RACES).sort((a, b) => a[1].need - b[1].need).map(([k, r]) => `${r.e} *${r.n}* [${r.rar}] — ${fmt(r.price)}g\n   Skill jinak min Lv.${r.need} • afinitas ${aff[r.aff]} • unggul ${pk[r.perk]}\n   _${r.desc}_`).join('\n\n')
      return send(t, { quick: [['🏛️ Pasar', 'pasarbudak'], ['🎯 Skill Jinak', 'skilljinak'], ['🧺 Budakku', 'budakku']] })
    }

    // ───────── PASANG ─────────
    if (cmd === 'pasang') {
      if (!arg0) {
        const ok = u.slaves.filter(s => s.state === 'jinak')
        if (!ok.length) return send(`Belum ada budak jinak untuk dipasang.`, { quick: [['🏛️ Pasar', 'pasarbudak'], ['🔗 Jinakkan', 'jinakkan']] })
        const rows = ok.map(sl => row(short(sl), `${S.RACES[sl.race].n} • ❤️ ${sl.loyal}`, `${p}pasangbudak ${sl.uid}`)); rows.push(row('❌ Lepas pasangan', 'Tidak ada budak aktif', `${p}pasangbudak off`))
        return send(`⭐ Pilih budak yang ikut bertarung bersamamu.\nBudak aktif memberi bonus ATK/DEF/HP + keunggulan ras.`, { quick: [['🧺 Budakku', 'budakku']], lists: [{ title: '⭐ Pilih Budak', sections: [{ title: 'Budak jinak', rows }] }] })
      }
      if (['off', '0', 'lepas'].includes(String(arg0).toLowerCase())) { u.slaveActive = null; R.save(); return send('❌ Tidak ada budak aktif.', { quick: [['🧺 Budakku', 'budakku'], ['👤 Profil', 'profil']] }) }
      const sl = needSlave(arg0); if (!sl) return
      if (sl.state !== 'jinak') return send(`${lab(sl)} masih liar. Jinakkan dulu.`, { quick: [['🔗 Jinakkan', `jinakkan ${sl.uid}`]] })
      u.slaveActive = sl.uid; const n = R.stats(u); u.hp = Math.min(u.hp, n.maxhp); R.save()
      const b = S.bonus(u)
      return send(`⭐ ${lab(sl)} kini bertarung bersamamu!\n⚔️ ATK +${fmt(b.atk)} • 🛡️ DEF +${fmt(b.def)} • ❤️ HP +${fmt(b.hp)}${b.exp ? ` • ✨ EXP +${b.exp.toFixed(1)}%` : ''}${b.gold ? ` • 💰 Gold +${b.gold.toFixed(1)}%` : ''}\n_Kesetiaan tinggi = bonus lebih besar._`, { quick: [['⚔️ Hunt', 'hunt'], ['🏰 Dungeon', 'dungeon'], ['👤 Profil', 'profil']] })
    }

    // ───────── KERJA ─────────
    if (cmd === 'kerja' || cmd === 'kerjaall') {
      const CD = 20 * 60000, now = Date.now()
      let list
      if (cmd === 'kerja') { const sl = needSlave(arg0); if (!sl) return; list = [sl] } else list = u.slaves.filter(s => s.state === 'jinak')
      if (!list.length) return send('Belum ada budak jinak yang bisa bekerja.', { quick: [['🏛️ Pasar', 'pasarbudak'], ['🔗 Jinakkan', 'jinakkan']] })
      let tot = 0, tex = 0, out = [], skip = [], fled = []
      for (const sl of list) {
        if (sl.state !== 'jinak') { skip.push(`${short(sl)} (masih liar)`); continue }
        const w = (sl.lastWork || 0) + CD - now; if (w > 0) { skip.push(`${short(sl)} (${left(w)})`); continue }
        if (sl.loyal < 8 && Math.random() < 0.25) { u.slaves = u.slaves.filter(x => x !== sl); if (u.slaveActive === sl.uid) u.slaveActive = null; fled.push(short(sl)); continue }
        const r = S.RACES[sl.race], base = (50 + sl.lv * 16) * S.RAR[r.rar].m * (0.6 + sl.loyal / 250) * (0.8 + Math.random() * 0.45)
        const g = R.addGold(u, Math.floor(base * (r.perk === 'gold' ? 1 + S.perkPct(sl) / 100 : 1)))
        const up = S.addExp(sl, 12 + sl.lv * 3); sl.lastWork = now; sl.loyal = Math.max(0, sl.loyal - 1)
        tot += g; tex += 12 + sl.lv * 3; out.push(`${short(sl)} → 💰 +${fmt(g)}${up ? ` 🎉 Lv.${sl.lv}` : ''}`)
      }
      R.save()
      if (!out.length && !fled.length) return send(`😮‍💨 Belum ada yang siap kerja.\n${skip.map(s => '• ' + s).join('\n')}`, { quick: [['🧺 Budakku', 'budakku'], ['💗 Rawat', 'rawat'], ['⚔️ Hunt', 'hunt']] })
      const t = `💼 *BUDAK BEKERJA*\n${out.join('\n')}\n\n💰 Total +${fmt(tot)} gold • ✨ budak +${fmt(tex)} EXP${skip.length ? `\n\n⏳ Belum siap:\n${skip.map(s => '• ' + s).join('\n')}` : ''}${fled.length ? `\n\n🏃 *KABUR (kesetiaan terlalu rendah):* ${fled.join(', ')}` : ''}\n_Kerja menurunkan kesetiaan -1. Rawat secara berkala._`
      return send(t, { quick: [['💗 Rawat', 'rawat'], ['🧺 Budakku', 'budakku'], ['🏪 Shop', 'shop']] })
    }

    // ───────── RAWAT ─────────
    if (cmd === 'rawat') {
      if (!arg0) {
        const ok = u.slaves.filter(s => s.state === 'jinak'); if (!ok.length) return send('Belum ada budak jinak.', { quick: [['🏛️ Pasar', 'pasarbudak']] })
        const rows = ok.map(sl => row(short(sl), `❤️ ${sl.loyal}/100 • ${fmt(80 + sl.lv * 30)}g`, `${p}rawat ${sl.uid}`))
        return send(`💗 *RAWAT BUDAK*\nBeri makan, obat, dan tempat tidur layak → kesetiaan naik.`, { quick: [['🧺 Budakku', 'budakku']], lists: [{ title: '💗 Pilih Budak', sections: [{ title: 'Budak jinak', rows }] }] })
      }
      const sl = needSlave(arg0); if (!sl) return
      if (sl.state !== 'jinak') return send('Jinakkan dulu sebelum dirawat.', { quick: [['🔗 Jinakkan', `jinakkan ${sl.uid}`]] })
      const cost = 80 + sl.lv * 30; if (sl.loyal >= 100) return send(`${short(sl)} sudah sangat setia (100).`, { quick: [['💼 Kerja', `kerjabudak ${sl.uid}`]] })
      if (u.gold < cost) return send(`💰 Gold kurang. Butuh ${fmt(cost)}g.`, { quick: [['💼 Kerja', 'work'], ['⚔️ Hunt', 'hunt']] })
      u.gold -= cost; const add = R.rnd(10, 15); sl.loyal = Math.min(100, sl.loyal + add); R.save()
      return send(`💗 ${lab(sl)} dirawat dengan baik.\n❤️ Kesetiaan +${add} → ${sl.loyal}/100\n💰 -${fmt(cost)}g`, { quick: [['💼 Kerja', `kerjabudak ${sl.uid}`], ['⭐ Pasang', `pasangbudak ${sl.uid}`], ['🧺 Budakku', 'budakku']] })
    }

    // ───────── LATIH ─────────
    if (cmd === 'latih') {
      if (!arg0) {
        const ok = u.slaves.filter(s => s.state === 'jinak' && s.lv < S.MAXLV); if (!ok.length) return send('Belum ada budak jinak yang bisa dilatih.', { quick: [['🏛️ Pasar', 'pasarbudak']] })
        const rows = ok.map(sl => row(short(sl), `${fmt(150 + sl.lv * 60)}g • +${fmt(30 + sl.lv * 8)} EXP`, `${p}latih ${sl.uid}`))
        return send(`🏋️ *LATIH BUDAK*\nBayar pelatih guild untuk menaikkan level budakmu.`, { quick: [['🧺 Budakku', 'budakku']], lists: [{ title: '🏋️ Pilih Budak', sections: [{ title: 'Budak jinak', rows }] }] })
      }
      const sl = needSlave(arg0); if (!sl) return
      if (sl.state !== 'jinak') return send('Jinakkan dulu sebelum dilatih.', { quick: [['🔗 Jinakkan', `jinakkan ${sl.uid}`]] })
      if (sl.lv >= S.MAXLV) return send('Level budak sudah maksimal.', { quick: [['🧺 Budakku', 'budakku']] })
      const w = (sl.lastTrain || 0) + 5 * 60000 - Date.now(); if (w > 0) return send(`⏳ ${short(sl)} masih lelah. ${left(w)} lagi.`, { quick: [['🧺 Budakku', 'budakku']] })
      const cost = 150 + sl.lv * 60; if (u.gold < cost) return send(`💰 Gold kurang. Butuh ${fmt(cost)}g.`, { quick: [['💼 Kerja', 'work'], ['⚔️ Hunt', 'hunt']] })
      u.gold -= cost; const ex = 30 + sl.lv * 8, up = S.addExp(sl, ex); sl.lastTrain = Date.now(); R.save()
      return send(`🏋️ ${lab(sl)} berlatih keras.\n✨ +${fmt(ex)} EXP${up ? `\n🎉 *LEVEL UP!* Lv.${sl.lv}` : ''}\n💰 -${fmt(cost)}g`, { quick: [['🏋️ Latih lagi', `latih ${sl.uid}`], ['⭐ Pasang', `pasangbudak ${sl.uid}`], ['🧺 Budakku', 'budakku']] })
    }

    // ───────── LEPAS ─────────
    if (cmd === 'lepas') {
      if (!arg0) return send(`Pilih budak dari daftar: *${p}budakku* → Kelola Budak → Lepas.`, { quick: [['🧺 Budakku', 'budakku']] })
      const sl = needSlave(arg0); if (!sl) return
      const back = Math.floor(sl.price * (sl.state === 'jinak' ? 0.4 : 0.3))
      u.slaves = u.slaves.filter(x => x !== sl); if (u.slaveActive === sl.uid) u.slaveActive = null
      u.gold += back; R.save()
      return send(`🕊️ ${lab(sl)} dilepas dari kontrak.\n💰 +${fmt(back)}g`, { quick: [['🧺 Budakku', 'budakku'], ['🏛️ Pasar', 'pasarbudak']] })
    }

    // ───────── NAMA ─────────
    if (cmd === 'nama') {
      const sl = needSlave(arg0); const nm = args.slice(1).join(' ').replace(/[^\p{L}\p{N} ]/gu, '').trim().slice(0, 16)
      if (!sl) return
      if (!nm) return send(`Contoh: *${p}namabudak ${sl.uid} Kuro*`, { quick: [['🧺 Budakku', 'budakku']] })
      sl.name = nm; R.save(); return send(`✏️ Namanya kini *${nm}*.`, { quick: [['🧺 Budakku', 'budakku']] })
    }
  },
}
