// Chat AI gratis dengan ingatan percakapan singkat. Provider dicoba berurutan sampai ada yang menjawab.
const config = require('../config')
const { request } = require('./http')

const TTL = 30 * 60 * 1000
const history = new Map()

function getHistory(key) {
  let h = history.get(key)
  if (!h || Date.now() - h.t > TTL) {
    h = { msgs: [], t: Date.now() }
    history.set(key, h)
  }
  return h
}

async function openaiCompat(url, headers, body) {
  const res = await request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
    timeout: 15000
  })
  if (!res.ok) throw new Error('HTTP ' + res.status)
  const j = await res.json()
  const text = j.choices?.[0]?.message?.content
  if (!text) throw new Error('Jawaban kosong')
  return String(text)
}

function providers() {
  const list = []
  const o = config.ai.openai
  if (o.baseUrl && o.apiKey && o.model) {
    list.push(messages =>
      openaiCompat(o.baseUrl.replace(/\/$/, '') + '/chat/completions', { authorization: 'Bearer ' + o.apiKey }, {
        model: o.model,
        messages,
        max_tokens: 500,
        temperature: 0.8
      })
    )
  }
  const pk = config.ai.pollinationsKey
  const pHeaders = pk ? { authorization: 'Bearer ' + pk } : {}
  list.push(messages =>
    openaiCompat('https://text.pollinations.ai/openai', pHeaders, { model: 'openai', messages, max_tokens: 500 })
  )
  list.push(async (messages, userText) => {
    const url =
      'https://text.pollinations.ai/' +
      encodeURIComponent(userText) +
      '?model=openai&system=' +
      encodeURIComponent(config.ai.persona)
    const res = await request(url, { headers: pHeaders, timeout: 15000 })
    if (!res.ok) throw new Error('HTTP ' + res.status)
    const text = (await res.text()).trim()
    if (!text) throw new Error('Jawaban kosong')
    return text
  })
  return list
}

async function chat(key, userText) {
  const h = getHistory(key)
  const messages = [{ role: 'system', content: config.ai.persona }, ...h.msgs, { role: 'user', content: userText }]

  let reply = null
  let lastErr
  for (const ask of providers()) {
    try {
      reply = await ask(messages, userText)
      if (reply) break
    } catch (e) {
      lastErr = e
    }
  }
  if (!reply) throw lastErr || new Error('AI tidak merespons')

  reply = reply.trim()
  h.msgs.push({ role: 'user', content: userText }, { role: 'assistant', content: reply })
  h.msgs = h.msgs.slice(-config.autoReply.maxHistory * 2)
  h.t = Date.now()
  return reply
}

// satu pertanyaan tanpa riwayat (untuk ringkasan, dll.)
async function ask(prompt) {
  const messages = [{ role: 'system', content: config.ai.persona }, { role: 'user', content: prompt }]
  let lastErr
  for (const p of providers()) {
    try {
      const r = await p(messages, prompt.slice(0, 1500))
      if (r) return r.trim()
    } catch (e) {
      lastErr = e
    }
  }
  throw lastErr || new Error('AI tidak merespons')
}

// tanya soal gambar (JPEG buffer). Hanya provider yang mendukung gambar.
async function vision(jpeg, question) {
  const url = 'data:image/jpeg;base64,' + jpeg.toString('base64')
  const messages = [
    { role: 'system', content: config.ai.persona },
    { role: 'user', content: [{ type: 'text', text: question }, { type: 'image_url', image_url: { url } }] }
  ]
  let lastErr
  for (const p of providers().slice(0, -1)) {
    try {
      const r = await p(messages, question)
      if (r) return r.trim()
    } catch (e) {
      lastErr = e
    }
  }
  const err = new Error('AI belum bisa membaca gambar sekarang, coba lagi nanti.' + (lastErr ? ` (${lastErr.message})` : ''))
  err.userMessage = err.message
  throw err
}

function reset(key) {
  history.delete(key)
}

module.exports = { chat, ask, vision, reset }
