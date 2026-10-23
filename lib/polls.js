// Polling sebagai "tombol" yang pasti bisa dipencet di semua WhatsApp.
// Bot mengirim polling berisi pilihan; saat seseorang memilih, pilihan itu dijalankan sebagai perintah.
const registry = new Map() // pollId -> { chat, options: { "👥 Grup": "#menu grup" } }
const lastSel = new Map() // pollId|voter -> nama opsi terakhir

const num = j => String(j || '').split('@')[0].split(':')[0]

function register(pollId, data) {
  registry.set(pollId, data)
  if (registry.size > 200) registry.delete(registry.keys().next().value)
}

// dipanggil dari event messages.update
async function onUpdates(updates, { aggregate, getMessage, run }) {
  for (const { key, update } of updates || []) {
    if (!update?.pollUpdates || !key?.id) continue
    const poll = registry.get(key.id)
    if (!poll) continue
    const creation = await getMessage(key)
    if (!creation) continue
    let votes
    try {
      votes = aggregate({ message: creation, pollUpdates: update.pollUpdates })
    } catch (e) {
      console.log('[poll] gagal baca suara:', e?.message || e)
      continue
    }
    const now = new Map() // voter -> opsi sekarang
    for (const o of votes || []) for (const v of o.voters || []) now.set(v, o.name)
    // pemilih yang batal memilih -> reset supaya bisa memilih lagi
    for (const k of [...lastSel.keys()]) if (k.startsWith(key.id + '|') && ![...now.keys()].some(v => k === key.id + '|' + v)) lastSel.delete(k)
    for (const [voter, name] of now) {
      const k = key.id + '|' + voter
      if (lastSel.get(k) === name) continue
      lastSel.set(k, name)
      const cmd = poll.options[name]
      if (cmd) await run({ chat: poll.chat, voter, command: cmd })
    }
  }
}

module.exports = { register, onUpdates, num }
