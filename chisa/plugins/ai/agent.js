/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// AI Agent dengan kartu animasi: laba-laba (agent) berlari ke Pesan -> Model -> Memory -> Tools -> Balasan.
//   .agent <pertanyaan>   (alias: .agen .omp .aiagent)   — boleh reply sebuah pesan
// Alur (global.agentMode di config.js):
//   'native' (bawaan) → kartu animasi laba-laba (pendek) + jawaban sebagai blok native WhatsApp "Lihat kode":
//                       diketuk → layar penuh berisi jawaban lengkap, ada tombol salin bawaan WhatsApp.
//   'card'            → mode lama: SATU kartu HTML (laba-laba → jawaban + tombol Salin).
const ai = require('../../lib/ai')
const S = require('../../lib/settingsdb')
const AC = require('../../lib/agentcard')

const AGENT_EXTRA = 'Kamu bekerja sebagai AI Agent. Jawab lengkap, runtut, dan tuntas. Untuk permintaan kode, tulis SELURUH kode sampai selesai di blok ```bahasa ... ``` (tanpa \"...\" dan tanpa kerangka kosong), lalu beri penjelasan singkat cara pakai.'

module.exports = {
  name: 'agent', alias: ['agen', 'omp', 'aiagent'], category: 'ai', cmds: ['agent'],
  desc: 'AI Agent dengan animasi alur (Pesan, Model, Memory, Tools, Balasan) dan jawaban yang bisa disalin',
  run: async ({ sock, m, text, prefix, command, reply, isCreator }) => {
    const quoted = (m.quoted && (m.quoted.text || m.quoted.caption)) || ''
    const q = (text || quoted).trim()
    if (!q) return reply(`*AI AGENT*\nKetik: ${prefix}${command} <pertanyaan>\natau reply sebuah pesan dengan ${prefix}${command}\n\nContoh: ${prefix}${command} jelaskan cara kerja DNS singkat`)
    const name = S.get('botname') || 'Chisa AI'
    const prompt = text && quoted ? `Konteks (pesan yang dibalas):\n"""${quoted.slice(0, 1500)}"""\n\nPertanyaan: ${text}` : q

    // satu pesan saja: selama AI bekerja cukup tampil "mengetik...", lalu SATU kartu (animasi laba-laba -> jawaban + Salin)
    const typing = () => sock.sendPresenceUpdate('composing', m.chat).catch(() => {})
    typing(); const tick = setInterval(typing, 4000)
    const t0 = Date.now()
    let r, err
    try { r = await ai.ask({ uid: m.sender, text: prompt, extra: AGENT_EXTRA }) } catch (e) { err = e }
    clearInterval(tick); sock.sendPresenceUpdate('paused', m.chat).catch(() => {})

    if (err) {
      console.log('[agent]', err.message, err.details || '')
      return reply(`Maaf, AI sedang tidak bisa menjawab. Coba lagi sebentar ya.${isCreator && err.details ? '\n\n_Detail (owner):_\n' + err.details.map(x => '- ' + x).join('\n') : ''}`)
    }

    const sec = ((Date.now() - t0) / 1000).toFixed(1)
    const info = `${sec} dtk  |  ${r.via}  |  memory ${S.get('aimemory') ? 'aktif' : 'mati'}`
    const title = `${name} AI: ${String(r.text).slice(0, 80)}`
    if (global.agentMode === 'card') {
      try { return await AC.sendCard(sock, m, AC.answerHtml({ name, info, text: r.text }), title) }
      catch (e) { console.log('[agent] kartu:', e.message) }
      return AC.sendAnswer(sock, m, r.text, `${name} AI  |  ${sec} dtk`)   // cadangan bila kartu HTML ditolak
    }
    // mode native: kartu laba-laba (animasi saja) lalu jawaban di blok "Lihat kode"
    try { await AC.sendCard(sock, m, AC.doneHtml({ name, info }), title) } catch (e) { console.log('[agent] kartu animasi:', e.message) }
    return AC.sendNative(sock, m, r.text)
  },
}
