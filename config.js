// ============================================================
//  PEMUAT PENGATURAN (jangan diedit)
//  defaults.js (bawaan, ikut update) + settings.js (milikmu, aman dari update)
// ============================================================
const fs = require('fs')
const path = require('path')
const defaults = require('./defaults')

const settingsPath = path.join(__dirname, 'settings.js')
const examplePath = path.join(__dirname, 'settings.example.js')

// pertama kali jalan: buat settings.js dari contoh
if (!fs.existsSync(settingsPath) && fs.existsSync(examplePath)) {
  try {
    fs.copyFileSync(examplePath, settingsPath)
    console.log('[config] settings.js dibuat dari settings.example.js')
  } catch {}
}

let user = {}
try {
  user = require(settingsPath)
} catch (e) {
  console.log('[config] settings.js bermasalah, memakai nilai bawaan:', e.message)
}

const isObj = x => x && typeof x === 'object' && !Array.isArray(x)
function merge(a, b) {
  const out = { ...a }
  for (const k of Object.keys(b || {})) out[k] = isObj(a[k]) && isObj(b[k]) ? merge(a[k], b[k]) : b[k]
  return out
}

function normalizeNumber(n) {
  let d = String(n || '').replace(/\D/g, '')
  if (d.startsWith('0')) d = '62' + d.slice(1)
  return d
}

const config = merge(defaults, user)
config.owner.number = normalizeNumber(config.owner.number)
config.ownerLids = (config.ownerLids || []).map(String)
config.vip = (config.vip || [])
  .map(v => (isObj(v) ? { name: v.name || config.vipLabel, number: normalizeNumber(v.number) } : { name: config.vipLabel, number: normalizeNumber(v) }))
  .filter(v => v.number)
config.telegram.ownerIds = (config.telegram.ownerIds || []).map(String)
config.telegram.vipIds = (config.telegram.vipIds || []).map(String)
config.normalizeNumber = normalizeNumber

module.exports = config
