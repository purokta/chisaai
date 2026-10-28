/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Pencarian kota: database lokal dulu, lalu Open-Meteo geocoding (gratis, tanpa key)
const axios = require('axios'), D = require('./daily')
const cache = new Map()
async function geocode(q) {
  const key = String(q).toLowerCase().trim(); if (cache.has(key)) return cache.get(key)
  const r = await axios.get('https://geocoding-api.open-meteo.com/v1/search', { params: { name: q, count: 1, language: 'id', format: 'json' }, timeout: 10000 })
  const x = r.data && r.data.results && r.data.results[0]; if (!x) return null
  const out = { name: [x.name, x.admin1, x.country].filter((v, i, a) => v && a.indexOf(v) === i).slice(0, 2).join(', '), lat: x.latitude, lng: x.longitude, tzName: x.timezone, tz: D.tzHours(x.timezone || D.tzOf()) }
  cache.set(key, out); return out
}
// -> { name, lat, lng, tz (jam dari UTC) } atau null
async function resolve(q) {
  const c = D.findCity(q); if (c) return { name: c.name, lat: c.lat, lng: c.lng, tz: c.tz, local: true }
  try { return await geocode(q) } catch (e) { console.log('[geo]', e.message); return null }
}
// waktu setempat pada offset jam tertentu
const nowAt = (tzHours) => D.parts(new Date(Date.now() + tzHours * 3600000), 'UTC')
module.exports = { resolve, geocode, nowAt }
