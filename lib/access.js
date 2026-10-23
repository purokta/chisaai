// Daftar VIP gabungan: dari settings.js + yang ditambah lewat #vip add
const config = require('../config')
const db = require('./db')

function vipNumbers() {
  return new Set([...config.vip.map(v => v.number), ...db.get('vip', [])].map(String).filter(Boolean))
}

module.exports = { vipNumbers }
