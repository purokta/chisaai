// Memuat Baileys dengan cara yang jalan di versi CommonJS (6.x) maupun ESM (7.x)
let cached

async function loadBaileys() {
  if (cached) return cached
  const mod = await import('@whiskeysockets/baileys')
  const def = mod.default
  const ns = { ...(def && typeof def === 'object' ? def : {}), ...mod }
  ns.makeWASocket = typeof def === 'function' ? def : def?.default || mod.makeWASocket || ns.makeWASocket
  cached = ns
  return ns
}

module.exports = { loadBaileys }
