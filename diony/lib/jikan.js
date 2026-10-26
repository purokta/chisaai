/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Klien Jikan (MyAnimeList) bersama untuk semua fitur anime: cache 10 menit + ulang otomatis saat kena rate limit.
const axios = require('axios')
const API = 'https://api.jikan.moe/v4'
const cache = new Map(), TTL = 10 * 60 * 1000
const sleep = (ms) => new Promise(r => setTimeout(r, ms))

async function jikan(path, params = {}) {
  const key = path + JSON.stringify(params), hit = cache.get(key)
  if (hit && Date.now() - hit.t < TTL) return hit.d
  for (let i = 0; i < 3; i++) {
    try {
      const { data } = await axios.get(API + path, { params, timeout: 15000 })
      cache.set(key, { t: Date.now(), d: data })
      if (cache.size > 300) cache.delete(cache.keys().next().value)
      return data
    } catch (e) {
      const st = e.response && e.response.status
      if ((st === 429 || st >= 500) && i < 2) { await sleep(1200 * (i + 1)); continue }   // rate limit Jikan: ±3 req/detik
      if (st === 404) return { data: null }
      throw new Error(st ? 'Server Jikan error (' + st + ')' : 'Tidak bisa terhubung ke Jikan')
    }
  }
}
module.exports = { jikan, sleep, API }
