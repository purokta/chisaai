/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .seni <teks> [mandala|galaksi|gelombang|spiro] — lukisan unik yang lahir dari teksmu. Teks sama = lukisan sama.
const AJ = require('../../lib/ajaib'), { B } = require('../../lib/style')
const STYLES = ['mandala', 'galaksi', 'gelombang', 'spiro']
const W = 1024, C = W / 2
const f = (n) => n.toFixed(1)
const hsl = (h, s, l, a = 1) => `hsla(${Math.round(h % 360)},${Math.round(s)}%,${Math.round(l)}%,${a})`
const BG = (h) => `<defs><radialGradient id="bg" cx="50%" cy="50%" r="75%"><stop offset="0" stop-color="${hsl(h, 55, 14)}"/><stop offset="1" stop-color="${hsl(h + 30, 60, 4)}"/></radialGradient></defs><rect width="${W}" height="${W}" fill="url(#bg)"/>`

const GEN = {
  mandala(r) {
    const h = r() * 360, n = 6 + Math.floor(r() * 10), rings = 7 + Math.floor(r() * 4); let o = BG(h)
    for (let k = rings; k >= 1; k--) {
      const rad = (k / rings) * 470, pw = 18 + r() * 60, ph = 30 + r() * 90, hh = h + k * (12 + r() * 14), sh = r()
      for (let i = 0; i < n; i++) {
        const a = (360 / n) * i + (k % 2 ? 180 / n : 0)
        o += `<g transform="translate(${C} ${C}) rotate(${f(a)}) translate(0 ${f(-rad)})">`
        o += sh < 0.5 ? `<ellipse rx="${f(pw)}" ry="${f(ph)}" fill="${hsl(hh, 80, 55, 0.35)}" stroke="${hsl(hh + 40, 90, 75, 0.7)}" stroke-width="1.5"/>` : `<path d="M0 ${f(-ph)} Q${f(pw)} 0 0 ${f(ph)} Q${f(-pw)} 0 0 ${f(-ph)}Z" fill="${hsl(hh, 80, 55, 0.35)}" stroke="${hsl(hh + 40, 90, 75, 0.7)}" stroke-width="1.5"/>`
        o += `<circle r="${f(3 + r() * 5)}" fill="${hsl(hh + 80, 95, 80, 0.9)}"/></g>`
      }
    }
    return o + `<circle cx="${C}" cy="${C}" r="26" fill="${hsl(h + 60, 95, 75)}"/><circle cx="${C}" cy="${C}" r="10" fill="#fff"/>`
  },
  galaksi(r) {
    const h = r() * 360, arms = 2 + Math.floor(r() * 3), twist = 2.2 + r() * 2; let o = BG(h)
    for (let i = 0; i < 380; i++) o += `<circle cx="${f(r() * W)}" cy="${f(r() * W)}" r="${f(0.4 + r() * 1.3)}" fill="#fff" opacity="${f(0.2 + r() * 0.7).slice(0, 4)}"/>`
    o += `<defs><radialGradient id="core"><stop offset="0" stop-color="${hsl(h + 40, 90, 85)}"/><stop offset="0.4" stop-color="${hsl(h + 20, 90, 60, 0.45)}"/><stop offset="1" stop-color="${hsl(h, 80, 40, 0)}"/></radialGradient></defs><circle cx="${C}" cy="${C}" r="190" fill="url(#core)"/>`
    for (let i = 0; i < 2600; i++) {
      const arm = i % arms, t = Math.pow(r(), 0.7), ang = (arm / arms) * Math.PI * 2 + t * twist * Math.PI + (r() - 0.5) * (0.5 - t * 0.3), rad = 30 + t * 440 + (r() - 0.5) * 30 * (1 + t)
      o += `<circle cx="${f(C + Math.cos(ang) * rad)}" cy="${f(C + Math.sin(ang) * rad * 0.82)}" r="${f(0.7 + r() * 2.2)}" fill="${hsl(h + t * 90 + r() * 40, 80, 60 + r() * 30)}" opacity="${f(0.35 + r() * 0.6).slice(0, 4)}"/>`
    }
    return o
  },
  gelombang(r) {
    const h = r() * 360, L = 9 + Math.floor(r() * 4); let o = `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${hsl(h + 200, 60, 18)}"/><stop offset="0.6" stop-color="${hsl(h + 20, 85, 60)}"/><stop offset="1" stop-color="${hsl(h + 40, 90, 75)}"/></linearGradient></defs><rect width="${W}" height="${W}" fill="url(#sky)"/>`
    o += `<circle cx="${f(250 + r() * 520)}" cy="${f(330 + r() * 80)}" r="${f(80 + r() * 60)}" fill="${hsl(h + 50, 100, 90, 0.9)}"/>`
    for (let k = 0; k < L; k++) {
      const y0 = 380 + k * (600 / L), amp = 20 + r() * 70, fr = 0.004 + r() * 0.012, ph = r() * 6.28, amp2 = amp * 0.4, fr2 = fr * 2.3 + r() * 0.01; let d = `M0 ${W} L0 ${f(y0)}`
      for (let x = 0; x <= W; x += 8) d += ` L${x} ${f(y0 + Math.sin(x * fr + ph) * amp + Math.sin(x * fr2 + ph * 2) * amp2)}`
      o += `<path d="${d} L${W} ${W}Z" fill="${hsl(h + 200 - k * (160 / L), 55 + k * 3, 62 - (k / L) * 48)}" opacity="0.96"/>`
    }
    return o
  },
  spiro(r) {
    const h = r() * 360; let o = BG(h)
    for (let layer = 0; layer < 3; layer++) {
      const R = 150 + r() * 120, rr = 20 + Math.floor(r() * 110), d = 20 + r() * 150, k = R - rr, turns = rr / gcd(Math.round(R), rr); let p = ''
      for (let t = 0; t <= turns * Math.PI * 2; t += 0.02) { const x = k * Math.cos(t) + d * Math.cos(k / rr * t), y = k * Math.sin(t) - d * Math.sin(k / rr * t); p += (p ? ' L' : 'M') + f(C + x * 1.45) + ' ' + f(C + y * 1.45) }
      o += `<path d="${p}" fill="none" stroke="${hsl(h + layer * 70, 90, 62, 0.75)}" stroke-width="${f(1 + r() * 1.2)}" style="mix-blend-mode:screen"/>`
    }
    return o
  },
}
const gcd = (a, b) => (b ? gcd(b, a % b) : a)

module.exports = {
  name: 'seni', alias: ['lukisan_unik', 'artgen', 'lukisku'], category: 'ajaib', noLimit: true, cmds: ['seni'],
  desc: 'Lukisan generatif unik dari teksmu (mandala, galaksi, gelombang, spiro); teks sama selalu menghasilkan lukisan sama',
  run: async ({ sock, m, args, pushname, prefix, reply }) => {
    let style = null; const rest = []
    for (const a of args) (STYLES.includes(a.toLowerCase()) && !style) ? (style = a.toLowerCase()) : rest.push(a)
    const text = rest.join(' ').trim() || pushname || 'Chisa AI'
    if (text.length > 60) return reply('✕ Teks maksimal 60 karakter.')
    const r = AJ.rng(text.toLowerCase()), chosen = style || STYLES[Math.floor(AJ.rng('gaya:' + text.toLowerCase())() * STYLES.length)]
    try {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${W}" viewBox="0 0 ${W} ${W}">${GEN[chosen](r)}</svg>`
      const png = await require('../../lib/sharp.js')(Buffer.from(svg)).png().toBuffer(), code = (AJ.hash32(text.toLowerCase())() % 1e6).toString().padStart(6, '0')
      return sock.sendMessage(m.chat, { image: png, caption: `✦ ${B('SENI')} • ${chosen}\nLukisan unik dari “${text}”\nKode #${code}\n_Teks yang sama selalu melahirkan lukisan yang sama. Coba: ${prefix}seni ${text} ${STYLES[(STYLES.indexOf(chosen) + 1) % 4]}_` }, { quoted: m })
    } catch (e) { console.log('[seni]', e); return reply(`✕ Gagal melukis.\n_${e.message}_`) }
  },
  _internals: { GEN, STYLES },
}
