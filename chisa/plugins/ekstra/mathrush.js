/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .mathrush — adu cepat hitung. Jawab angka langsung di chat. Tingkat: mudah | sedang | sulit
const { B } = require('../../lib/style'), E = require('../../lib/ekstra')
const games = new Map()
const r = (a, b) => a + Math.floor(Math.random() * (b - a + 1))
const LV = {
  mudah: { pts: 5, ms: 30e3, gen: () => { const a = r(2, 40), b = r(2, 40), t = r(0, 2); return t === 0 ? [`${a} + ${b}`, a + b] : t === 1 ? [`${a + b} - ${b}`, a] : [`${r(2, 9)} × ${r(2, 9)}`, null] } },
  sedang: { pts: 10, ms: 40e3, gen: () => { const a = r(11, 35), b = r(3, 9), c = r(10, 99), t = r(0, 2); return t === 0 ? [`${a} × ${b}`, a * b] : t === 1 ? [`${c} + ${a} + ${r(10, 99)}`, null] : [`${c * b} ÷ ${b}`, c] } },
  sulit: { pts: 15, ms: 50e3, gen: () => { const a = r(2, 15), b = r(2, 15), c = r(2, 12), t = r(0, 3); return t === 0 ? [`(${a} + ${b}) × ${c}`, (a + b) * c] : t === 1 ? [`${a} × ${b} - ${c}`, a * b - c] : t === 2 ? [`${a + 10}²`, (a + 10) ** 2] : [`${a} × ${b} + ${c} × ${r(2, 9)}`, null] } },
}
// soal bertanda null dihitung ulang dari string agar pasti benar
const evalExpr = (s) => Function(`"use strict";return (${s.replace(/×/g, '*').replace(/÷/g, '/').replace(/(\d+)²/g, '($1*$1)')})`)()
const end = (chat) => { const g = games.get(chat); if (g) clearTimeout(g.tm); games.delete(chat) }
module.exports = {
  name: 'mathrush', alias: ['hitungcepat', 'adumath', 'mathgame'], category: 'ekstra', noLimit: true, cmds: ['mathrush'],
  desc: 'Math Rush: adu cepat hitung, jawab angka langsung (.mathrush mudah|sedang|sulit)',
  run: async ({ sock, m, args, reply }) => {
    const g = games.get(m.chat); if (g) return reply(`${B('MATH RUSH')}\nSoal masih berjalan:\n\n*${g.q} = ?*`)
    const lv = LV[(args[0] || '').toLowerCase()] ? (args[0] || '').toLowerCase() : 'mudah', [q, a0] = LV[lv].gen(), a = a0 === null ? evalExpr(q) : a0
    const ng = { q, a, lv, pts: LV[lv].pts }; ng.tm = setTimeout(() => { if (games.get(m.chat) === ng) { games.delete(m.chat); sock.sendMessage(m.chat, { text: `Waktu habis! ${q} = *${a}*` }).catch(() => {}) } }, LV[lv].ms)
    games.set(m.chat, ng)
    return reply(`${B('MATH RUSH')} • ${lv}\n━━━━━━━━━━━━━━━━━━━━\n\n*${q} = ?*\n\nJawab angka secepatnya! (${LV[lv].ms / 1000} detik, ${ng.pts} poin)`)
  },
  before: async ({ m, budy, reply }) => {
    const g = games.get(m.chat); if (!g || !budy || !/^-?\d{1,9}$/.test(budy.trim())) return false
    if (Number(budy.trim()) !== g.a) return false
    end(m.chat); const sc = E.addScore(m.sender, m.pushName, g.pts, 'mathrush')
    await reply(`✦ *${m.pushName || 'Kamu'}* tercepat! ${g.q} = *${g.a}*\n+${g.pts} poin (total ${sc.pts})\n_Lagi: .mathrush ${g.lv} • .topgame_`)
    return true
  },
}
