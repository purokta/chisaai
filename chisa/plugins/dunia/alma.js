/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// ALMA — Sekretaris Pribadi: ringkasan harian, pengingat, profil (kota & tanggal lahir)
const D = require('../../lib/daily'), NU = require('../../lib/npcutil'), P = require('../../lib/profiledb'), G = require('../../lib/geo'), RM = require('../../lib/reminders')
const NDB = require('../../lib/npcdb'), RPG = require('../../lib/rpg')
const hhmm = (ms) => { const p = D.parts(new Date(ms)); return `${D.pad(p.hh)}:${D.pad(p.mm)}` }
const when = (ms) => { const n = D.now(), p = D.parts(new Date(ms)), dd = D.diffDays({ y: n.y, m: n.m, d: n.d }, p); return `${dd === 0 ? 'hari ini' : dd === 1 ? 'besok' : D.fmtDate(p, false)} ${hhmm(ms)}` }
const limitOf = (jid) => 5 + 3 * NDB.lv(jid, 'alma')

module.exports = {
  name: 'harini',
  alias: ['hariini', 'today', 'briefing', 'ringkasan', 'reminder', 'pengingat', 'listpengingat', 'hapuspengingat', 'hapusingat', 'setkota', 'setlahir'],
  category: 'dunia',
  cmds: ['harini', 'pengingat', 'hapuspengingat', 'setkota', 'setlahir'],
  desc: 'Ringkasan harian, pengingat, simpan kota & tanggal lahir (Alma)',
  run: async ({ m, command, text, args, prefix, reply, pushname }) => {
    const jid = m.sender, head = NU.head('alma', jid)

    if (command === 'setkota') {
      if (!text) return reply(`${head}\n\nKota tersimpan: *${P.get(jid).city || '(belum ada)'}*\nContoh: ${prefix}setkota bandung`)
      const c = await G.resolve(text); if (!c) return reply(`${head}\n\nKota "${text}" tidak ketemu. Coba nama lain.`)
      P.set(jid, 'city', text.trim().slice(0, 40)); return reply(`${head}\n\nSiap! Kota kamu *${c.name}*. Sekarang ${prefix}salat, ${prefix}cuaca, dan ${prefix}harini otomatis memakai kota ini.`)
    }
    if (command === 'setlahir') {
      const b = D.takeDate(text).date; if (!b) return reply(`${head}\n\nContoh: ${prefix}setlahir 31-01-2000\nTersimpan: ${P.get(jid).bday || '(belum ada)'}`)
      if (D.diffDays(b, D.now()) < 0) return reply('Tanggal lahir tidak boleh di masa depan.')
      P.set(jid, 'bday', `${b.y}-${D.pad(b.m)}-${D.pad(b.d)}`); return reply(`${head}\n\nTanggal lahir tersimpan: *${D.fmtDate(b)}*. Cek ${prefix}umur atau ${prefix}weton.`)
    }

    if (['ingatkan', 'remind', 'reminder'].includes(command)) {
      const cnt = RM.forUser(jid).length, lim = limitOf(jid)
      const w = RM.parseWhen(text)
      if (!w || w.error || !w.rest) return reply(`${head}\n\n${w && w.error ? w.error + '\n\n' : ''}*Cara pakai pengingat*\n${prefix}ingatkan 30m minum obat\n${prefix}ingatkan 2j rapat tim\n${prefix}ingatkan 07:00 olahraga  (jam berikutnya)\n${prefix}ingatkan besok 08:30 bayar listrik\n${prefix}ingatkan setiap 06:00 minum vitamin  (tiap hari)\n\nSatuan: s/detik, m/menit, j/jam, d/hari. Slot: ${cnt}/${lim} (naik jika hubunganmu dengan Alma membaik).`)
      if (cnt >= lim) return reply(`${head}\n\nSlot pengingat penuh (${cnt}/${lim}). Hapus dengan ${prefix}hapuspengingat <no>, atau akrabkan diri dengan Alma untuk menambah slot.`)
      if (w.at - Date.now() < 10000) return reply('Waktunya terlalu dekat, minimal 10 detik.')
      const r = RM.add(m.chat, jid, w.rest, w.at, w.repeat)
      return reply(`${head}\n\n✅ Siap! Alma akan mengingatkan *${when(r.at)}*${w.repeat ? ' (setiap hari)' : ''}:\n"${r.text}"\n\nSlot ${cnt + 1}/${lim} • ${prefix}pengingat untuk daftar${NU.bump(jid, 'alma', 2)}`)
    }
    if (['pengingat', 'listpengingat'].includes(command)) {
      const l = RM.forUser(jid); if (!l.length) return reply(`${head}\n\nBelum ada pengingat aktif. Coba: ${prefix}ingatkan 30m minum air`)
      return reply(`${head}\n\n*PENGINGAT AKTIF* (${l.length}/${limitOf(jid)})\n\n` + l.map((r, i) => `${i + 1}. ⏰ *${when(r.at)}*${r.repeat ? ' 🔁' : ''}\n    ${r.text}`).join('\n') + `\n\nHapus: ${prefix}hapuspengingat <no>`)
    }
    if (['hapuspengingat', 'hapusingat'].includes(command)) {
      const r = RM.remove(jid, parseInt(args[0])); return reply(r ? `${head}\n\n🗑️ Pengingat "${r.text}" dihapus.` : `${head}\n\nNomor tidak ditemukan. Lihat ${prefix}pengingat`)
    }

    // ── RINGKASAN HARI INI ──
    const t = D.now(), o = { y: t.y, m: t.m, d: t.d }, prof = P.get(jid), h = D.holidayOn(o), nx = D.nextHolidays(o, 1)[0], hj = D.hijri(o)
    let out = `${head}\n\n*${D.greet(t.hh)}, ${pushname || 'Kak'}!*\n\n📅 ${D.fmtDate({ ...o, dow: t.dow })}\n🌙 ${hj.text} • ${D.DAYS[t.dow]} ${D.pasaranOf(o)}\n🕐 Pukul ${D.pad(t.hh)}:${D.pad(t.mm)}`
    out += h ? `\n🔴 Hari ini: *${h.n}*` : nx ? `\n🏖️ Libur berikutnya: ${nx.n} (${nx.in} hari lagi)` : ''
    if (prof.bday) { const b = D.parseDate(prof.bday); if (b) { let n = D.parseDate(`${b.d}-${b.m}-${t.y}`) || { y: t.y, m: 2, d: 28 }; if (D.diffDays(o, n) < 0) n = D.parseDate(`${b.d}-${b.m}-${t.y + 1}`) || n; const dd = D.diffDays(o, n); if (dd === 0) out += `\n🎂 *Selamat ulang tahun ke-${t.y - b.y}!* 🎉`; else if (dd <= 14) out += `\n🎂 Ulang tahunmu ${dd} hari lagi` } }
    let city = null
    if (prof.city) {
      city = await G.resolve(prof.city)
      if (city) {
        const lt = G.nowAt(city.tz), pt = D.prayerTimes({ y: lt.y, m: lt.m, d: lt.d }, city.lat, city.lng, city.tz), nowH = lt.hh + lt.mm / 60, w = ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'], nk = w.find(k => pt[k] > nowH) || 'subuh'
        out += `\n🕌 Salat berikutnya (${city.name}): *${nk[0].toUpperCase() + nk.slice(1)} ${D.hm(pt[nk])}*`
        try { const axios = require('axios'), r = await axios.get('https://api.open-meteo.com/v1/forecast', { timeout: 6000, params: { latitude: city.lat, longitude: city.lng, timezone: 'auto', current: 'temperature_2m,weather_code', daily: 'precipitation_probability_max', forecast_days: 1 } }); out += `\n🌤️ Cuaca: ${Math.round(r.data.current.temperature_2m)}°C, peluang hujan ${r.data.daily.precipitation_probability_max[0] ?? 0}%` } catch {}
      }
    } else out += `\n💡 Atur kota dengan ${prefix}setkota <kota> untuk salat & cuaca otomatis`
    const rems = RM.forUser(jid).filter(r => D.diffDays(o, D.parts(new Date(r.at))) === 0)
    if (rems.length) out += `\n\n⏰ *Pengingat hari ini*\n` + rems.slice(0, 4).map(r => `• ${hhmm(r.at)} — ${r.text}`).join('\n')
    const u = RPG.get(jid)
    if (u) {
      RPG.ensureQuests(u); const ready = u.quest.list.filter(q => !q.done && q.have >= q.need).length, left = u.quest.list.filter(q => !q.done).length
      const dailyOk = Date.now() - (u.cd.daily || 0) > 86400000
      out += `\n\n⚔️ *RPG*${dailyOk ? `\n• Hadiah harian belum diambil (${prefix}daily)` : ''}${left ? `\n• Misi harian tersisa ${left}${ready ? ` (${ready} siap klaim: ${prefix}claimquest)` : ''}` : '\n• Semua misi harian selesai 🎉'}${u.bounty ? `\n• Bounty: ${u.bounty.mob} ${u.bounty.have}/${u.bounty.need}` : ''}`
    }
    out += `\n\n💬 _${D.quoteOf(o)}_`
    return reply(out + NU.bump(jid, 'alma', 2))
  },
}
