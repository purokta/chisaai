/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Speech-to-text: Groq Whisper dulu (cepat), cadangan ASR Fish Audio. Masukan: Buffer audio (mp3/ogg/wav/m4a/webm).
const axios = require('axios')
const arr = (v) => (Array.isArray(v) ? v : [v]).filter(k => typeof k === 'string' && k.trim()).map(k => k.trim())

async function groqWhisper(buf, ext, language) {
  const FD = require('form-data'), ks = arr(global.apikey && global.apikey.groq); let last
  if (!ks.length) throw new Error('tidak ada key Groq')
  for (const key of ks) {
    try {
      const f = new FD(); f.append('file', buf, { filename: 'audio.' + (ext || 'mp3') }); f.append('model', 'whisper-large-v3-turbo'); f.append('response_format', 'json'); f.append('temperature', '0')
      if (language) f.append('language', language)
      const r = await axios.post('https://api.groq.com/openai/v1/audio/transcriptions', f, { headers: { ...f.getHeaders(), Authorization: 'Bearer ' + key }, timeout: 120000, maxBodyLength: Infinity })
      return String((r.data && r.data.text) || '').trim()
    } catch (e) { last = e; if (![401, 403, 429].includes(e.response && e.response.status)) break }
  }
  throw new Error('Groq: ' + (last.response ? last.response.status + ' ' + JSON.stringify(last.response.data).slice(0, 120) : last.message))
}

// hasil { text, via }
async function transcribe(buf, ext = 'mp3', language) {
  const errs = []
  try { const t = await groqWhisper(buf, ext, language); if (t) return { text: t, via: 'groq-whisper' }; errs.push('groq: kosong') } catch (e) { errs.push(e.message) }
  const FISH = require('./fishai')
  if (FISH.hasKey()) { try { const t = await FISH.asr(buf, ext, language); if (t) return { text: t, via: 'fish-asr' }; errs.push('fish: kosong') } catch (e) { errs.push('fish: ' + e.message) } }
  const e = new Error(errs.join(' | ') || 'tidak ada mesin transkripsi'); throw e
}
module.exports = { transcribe }
