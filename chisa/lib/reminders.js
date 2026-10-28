/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// PENGINGAT (reminder) tersimpan di disk, tetap hidup setelah bot restart
const fs = require('fs'), path = require('path')
const D = require('./daily')
const FILE = path.join(global.chisaData, 'reminders.json')
let list = []; try { list = JSON.parse(fs.readFileSync(FILE, 'utf8')) } catch {}
const save = () => { try { fs.writeFileSync(FILE, JSON.stringify(list)) } catch {} }
const UNIT = { s: 1e3, detik: 1e3, m: 6e4, mnt: 6e4, menit: 6e4, j: 36e5, jam: 36e5, h: 36e5, d: 864e5, hari: 864e5 }

// "30m minum obat" | "2j rapat" | "besok 07:00 olahraga" | "15.30 jemput" | "setiap 06:00 vitamin"
function parseWhen(text, ref = new Date()) {
  let s = String(text || '').trim(), repeat = false, m
  if ((m = s.match(/^(setiap|tiap|daily|harian)\s+/i))) { repeat = true; s = s.slice(m[0].length) }
  if (!repeat && (m = s.match(/^(\d+)\s*(detik|menit|mnt|jam|hari|s|m|j|h|d)\b\s*/i))) {
    const ms = +m[1] * UNIT[m[2].toLowerCase()]; if (!ms || ms > 365 * 864e5) return { error: 'Maksimal 365 hari.' }
    return { at: ref.getTime() + ms, rest: s.slice(m[0].length).trim(), repeat: false }
  }
  if ((m = s.match(/^(besok|lusa)?\s*(?:jam\s*)?(\d{1,2})[:.](\d{2})\s*(?:wib|wita|wit)?\s*/i))) {
    const hh = +m[2], mm = +m[3]; if (hh > 23 || mm > 59) return { error: 'Jam tidak valid (00:00 - 23:59).' }
    const n = D.now(), add = /besok/i.test(m[1] || '') ? 1 : /lusa/i.test(m[1] || '') ? 2 : 0
    let day = D.addDays(n, add), at = D.zonedToUtc(day.y, day.m, day.d, hh, mm)
    if (!add && at <= ref.getTime() + 30000) { day = D.addDays(n, 1); at = D.zonedToUtc(day.y, day.m, day.d, hh, mm) }
    return { at, rest: s.slice(m[0].length).trim(), repeat }
  }
  return null
}
const forUser = (jid) => list.filter(r => r.user === jid).sort((a, b) => a.at - b.at)
function add(chat, user, text, at, repeat) { const r = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), chat, user, text: String(text).slice(0, 300), at, repeat: !!repeat }; list.push(r); save(); return r }
function remove(user, idx) { const r = forUser(user)[idx - 1]; if (!r) return null; list = list.filter(x => x.id !== r.id); save(); return r }
let timer = null
function start(sock) {
  if (timer) clearInterval(timer)
  timer = setInterval(async () => {
    const due = list.filter(r => r.at <= Date.now()); if (!due.length) return
    for (const r of due) {
      try { await sock.sendMessage(r.chat, { text: `⏰ *PENGINGAT* untuk @${r.user.split('@')[0]}\n\n${r.text}${r.repeat ? '\n\n_(berulang setiap hari)_' : ''}\n\n— Alma, Sekretaris Pribadi`, mentions: [r.user] }) } catch (e) { console.log('[reminder]', e.message) }
      if (r.repeat) { r.at += 864e5; while (r.at <= Date.now()) r.at += 864e5 } else list = list.filter(x => x.id !== r.id)
    }
    save()
  }, 15000)
}
module.exports = { parseWhen, add, forUser, remove, start }
