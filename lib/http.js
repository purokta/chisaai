// Helper HTTP (pakai fetch bawaan Node 18+, tanpa library tambahan)
const UA =
  'Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36'

function request(url, { method = 'GET', headers = {}, body, timeout = 20000 } = {}) {
  return fetch(url, {
    method,
    headers: { 'user-agent': UA, ...headers },
    body,
    redirect: 'follow',
    signal: AbortSignal.timeout(timeout)
  })
}

async function getJson(url, opts) {
  const res = await request(url, opts)
  if (!res.ok) throw new Error('HTTP ' + res.status)
  return res.json()
}

async function getText(url, opts) {
  const res = await request(url, opts)
  if (!res.ok) throw new Error('HTTP ' + res.status)
  return res.text()
}

async function getBuffer(url, { maxMB = 60, timeout = 120000, headers } = {}) {
  const res = await request(url, { headers, timeout })
  if (!res.ok) throw new Error('HTTP ' + res.status)
  const limit = maxMB * 1024 * 1024
  const declared = Number(res.headers.get('content-length') || 0)
  if (declared > limit) throw new Error(`File terlalu besar (maks ${maxMB} MB)`)
  const buffer = Buffer.from(await res.arrayBuffer())
  if (buffer.length > limit) throw new Error(`File terlalu besar (maks ${maxMB} MB)`)
  const mime = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase()
  return { buffer, mime }
}

module.exports = { request, getJson, getText, getBuffer }
