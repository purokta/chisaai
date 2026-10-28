/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .nada  — bot MEMAINKAN melodi dari notasi teks (sintesis suara murni, tanpa file lagu)
//   .nada twinkle                      (lagu siap pakai: twinkle, ode, ultah, elise, jingle)
//   .nada C D E F G A B C5             (nada dasar; angka = oktaf, # = kres, b = mol)
//   .nada do re mi fa sol la si do5    (solmisasi)
//   .nada 8bit bpm=150 E5 E5 - E5 - C5 E5 G5:2 G4:2    (instrumen: piano | 8bit | seruling; ":2" = 2 ketuk; "-" = jeda)
//   .nada C+E+G:2 F+A+C5:2             (akor = nada digabung "+")
// .morsesuara — teks -> kode morse + suara bip; kirim kode morse (.-/) untuk diterjemahkan balik
const { B } = require('../../lib/style'), AJ = require('../../lib/ajaib')

const SR = 22050
const SEMI = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 }
const SOL = { do: 'c', re: 'd', mi: 'e', fa: 'f', sol: 'g', la: 'a', si: 'b', ti: 'b' }
const PRESET = {
  twinkle: { bpm: 110, s: 'C C G G A A G:2 F F E E D D C:2 G G F F E E D:2 G G F F E E D:2 C C G G A A G:2 F F E E D D C:2' },
  ode: { bpm: 120, s: 'E E F G G F E D C C D E E:1.5 D:0.5 D:2 E E F G G F E D C C D E D:1.5 C:0.5 C:2' },
  ultah: { bpm: 100, s: 'G:0.75 G:0.25 A G C5 B:2 G:0.75 G:0.25 A G D5 C5:2 G:0.75 G:0.25 G5 E5 C5 B A:2 F5:0.75 F5:0.25 E5 C5 D5 C5:2' },
  elise: { bpm: 130, s: 'E5:0.5 D#5:0.5 E5:0.5 D#5:0.5 E5:0.5 B4:0.5 D5:0.5 C5:0.5 A4:1.5 -:0.5 C4:0.5 E4:0.5 A4:0.5 B4:1.5 -:0.5 E4:0.5 G#4:0.5 B4:0.5 C5:1.5' },
  jingle: { bpm: 140, s: 'E E E:2 E E E:2 E G C D E:4 F F F F F E E E E D D E D:2 G:2' },
}
const freq = (semi, oct) => 440 * Math.pow(2, (12 * (oct + 1) + semi - 69) / 12)

// "C#5:2" | "do" | "-:2" | "C+E+G:2"  ->  { notes: [freq...], beats }  (notes kosong = jeda)
function parseToken(tok) {
  let [body, dur] = tok.split(':'); const beats = dur === undefined ? 1 : Number(dur)
  if (!(beats > 0 && beats <= 16)) return null
  if (body === '-' || body === 'p' || body === 'r' || body === '_') return { notes: [], beats }
  const notes = []
  for (const part of body.split('+')) {
    const mm = part.toLowerCase().match(/^(do|re|mi|fa|sol|la|si|ti|[a-g])([#b]?)(\d?)$/); if (!mm) return null
    const letter = SOL[mm[1]] || mm[1]; let semi = SEMI[letter] + (mm[2] === '#' ? 1 : mm[2] === 'b' ? -1 : 0), oct = mm[3] === '' ? 4 : +mm[3]
    if (oct < 1 || oct > 7) return null
    notes.push(freq(semi, oct))
  }
  return { notes, beats }
}
function parse(input) {
  const toks = String(input).replace(/\|/g, ' ').trim().split(/\s+/).filter(Boolean); let bpm = 120, inst = 'piano', preset = null
  const seq = []
  for (let t of toks) {
    const lt = t.toLowerCase()
    if (PRESET[lt] && !seq.length) { preset = lt; bpm = PRESET[lt].bpm; for (const x of PRESET[lt].s.split(' ')) seq.push(parseToken(x)); continue }
    if (['piano', '8bit', 'seruling'].includes(lt)) { inst = lt; continue }
    let mb = lt.match(/^bpm=(\d{2,3})$/); if (mb) { bpm = Math.max(40, Math.min(240, +mb[1])); continue }
    const p = parseToken(t); if (!p) return { error: `Token tidak dikenali: "${t}"` }
    seq.push(p)
  }
  if (!seq.length) return { error: 'Tidak ada nada.' }
  if (seq.length > 220) return { error: 'Maksimal 220 nada.' }
  const total = seq.reduce((s, x) => s + x.beats, 0) * 60 / bpm
  if (total > 90) return { error: `Terlalu panjang (${total.toFixed(0)} detik, maks 90).` }
  return { seq, bpm, inst, preset, total }
}

// ── sintesis ──
const VOICE = {
  piano: (f, t, d) => { let s = 0; const H = [1, 0.5, 0.28, 0.14, 0.07]; for (let h = 0; h < H.length; h++) s += H[h] * Math.sin(2 * Math.PI * f * (h + 1) * t) * Math.exp(-t * (2.2 + h * 1.4)); return s * 1.5 },
  '8bit': (f, t, d) => (Math.sin(2 * Math.PI * f * t) >= 0 ? 1 : -1) * 0.3,
  seruling: (f, t, d) => (Math.sin(2 * Math.PI * f * t + 0.6 * Math.sin(2 * Math.PI * 5.2 * t) * Math.min(1, t * 3)) + 0.12 * Math.sin(2 * Math.PI * f * 2 * t)) * 0.7,
}
function render(p) {
  const beat = 60 / p.bpm, tail = 0.6, n = Math.ceil((p.total + tail) * SR), buf = new Float32Array(n); let at = 0
  for (const ev of p.seq) {
    const dur = ev.beats * beat, len = Math.ceil((dur + 0.25) * SR), start = Math.floor(at * SR), amp = 0.5 / Math.max(1, Math.sqrt(ev.notes.length))
    for (const f of ev.notes) for (let i = 0; i < len && start + i < n; i++) {
      const t = i / SR; let env = Math.min(1, t / 0.006)                       // serangan cepat
      if (t > dur) env *= Math.max(0, 1 - (t - dur) / 0.25)                    // pelepasan
      if (p.inst !== 'piano' && t < dur) env *= Math.min(1, (dur - t) / 0.02 + 0.0)  // hindari klik di akhir not (alat tiup/8bit)
      buf[start + i] += VOICE[p.inst](f, t, dur) * env * amp
    }
    at += dur
  }
  let peak = 0; for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(buf[i]))
  const g = peak > 0.9 ? 0.9 / peak : 1, pcm = Buffer.alloc(n * 2); for (let i = 0; i < n; i++) pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, buf[i] * g)) * 32767), i * 2)
  return wav(pcm)
}
function wav(pcm, sr = SR) { const h = Buffer.alloc(44); h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVEfmt ', 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(sr, 24); h.writeUInt32LE(sr * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40); return Buffer.concat([h, pcm]) }

// ── MORSE ──
const MORSE = { a: '.-', b: '-...', c: '-.-.', d: '-..', e: '.', f: '..-.', g: '--.', h: '....', i: '..', j: '.---', k: '-.-', l: '.-..', m: '--', n: '-.', o: '---', p: '.--.', q: '--.-', r: '.-.', s: '...', t: '-', u: '..-', v: '...-', w: '.--', x: '-..-', y: '-.--', z: '--..', 0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.', '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.', '!': '-.-.--', '/': '-..-.', '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-', '+': '.-.-.', '-': '-....-', '"': '.-..-.', '@': '.--.-.' }
const REV = Object.fromEntries(Object.entries(MORSE).map(([k, v]) => [v, k]))
const morseEnc = (t) => String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/\s+/).filter(Boolean).map(w => Array.from(w).map(c => MORSE[c]).filter(Boolean).join(' ')).join(' / ')
const morseDec = (s) => String(s).replace(/[·•]/g, '.').replace(/[–—_]/g, '-').trim().split(/\s*\/\s*|\s{3,}/).map(w => w.split(/\s+/).map(c => REV[c] || '?').join('')).join(' ')
const isMorse = (s) => /^[.\-/\s·•–—_]+$/.test(s) && /[.\-·•–—_]/.test(s)
function morseWav(code, wpm = 16, hz = 620) {
  const u = 1.2 / wpm, ev = []   // [nyala?, panjang unit]
  const words = code.split(' / ')
  words.forEach((w, wi) => { w.split(' ').forEach((ch, ci) => { Array.from(ch).forEach((s, si) => { ev.push([1, s === '.' ? 1 : 3]); if (si < ch.length - 1) ev.push([0, 1]) }); if (ci < w.split(' ').length - 1) ev.push([0, 3]) }); if (wi < words.length - 1) ev.push([0, 7]) })
  const total = ev.reduce((s, e) => s + e[1], 0) * u, n = Math.ceil((total + 0.3) * SR), pcm = Buffer.alloc(n * 2); let at = 0
  for (const [on, len] of ev) { const d = len * u; if (on) { const a = Math.floor(at * SR), c = Math.floor(d * SR); for (let i = 0; i < c; i++) { const r = Math.min(1, i / (0.005 * SR), (c - i) / (0.005 * SR)); pcm.writeInt16LE(Math.round(Math.sin(2 * Math.PI * hz * i / SR) * r * 0.6 * 32767), (a + i) * 2) } } at += d }
  return { wav: wav(pcm), seconds: total }
}

module.exports = {
  name: 'nada', alias: ['melodi', 'mainkan', 'morsesuara', 'bipmorse'], category: 'ajaib', noLimit: true, cmds: ['nada', 'morsesuara'],
  desc: 'Bot memainkan melodi dari notasi teks (.nada) dan mengubah teks ↔ sandi morse bersuara (.morsesuara)',
  run: async ({ sock, m, text, command, prefix, reply }) => {
    if (command === 'morsesuara' || command === 'bipmorse') {
      const src = String(text || (m.quoted && (m.quoted.text || m.quoted.caption)) || '').trim()
      if (!src) return reply(`✦ ${B('MORSE')}\n${prefix}morsesuara sos kami di sini   -> kode + suara bip\n${prefix}morsesuara ... --- ...         -> terjemahkan balik\n_Pisahkan huruf dengan spasi, kata dengan "/". Bisa juga reply pesan._`)
      if (isMorse(src)) return reply(`✦ ${B('MORSE → TEKS')}\n\n${morseDec(src).toUpperCase()}`)
      if (src.length > 80) return reply('✕ Maksimal 80 karakter.')
      const code = morseEnc(src); if (!code) return reply('✕ Tidak ada karakter yang bisa diubah ke morse.')
      await reply(`✦ ${B('TEKS → MORSE')}\n\n${code}`)
      try { const { wav: w } = morseWav(code), mp3 = await AJ.runFF(w, 'wav', 'mp3', ['-b:a', '64k', '-f', 'mp3']); await sock.sendMessage(m.chat, { audio: mp3, mimetype: 'audio/mpeg', ptt: false, fileName: 'morse.mp3' }, { quoted: m }) } catch (e) { console.log('[morse]', e.message) }
      return
    }
    if (!text) return reply(`✦ ${B('NADA')}\nBot memainkan melodi dari teks.\n\n${prefix}nada twinkle        (siap pakai: ${Object.keys(PRESET).join(', ')})\n${prefix}nada C D E F G A B C5\n${prefix}nada do re mi fa sol la si do5\n${prefix}nada 8bit bpm=150 E5 E5 - E5 - C5 E5 G5:2\n${prefix}nada seruling C+E+G:2 F+A+C5:2\n\nAturan: huruf = nada, angka = oktaf (default 4), # kres, b mol, ":2" = 2 ketuk, "-" = jeda, "+" = akor, bpm=60..240. Instrumen: piano, 8bit, seruling.`)
    const p = parse(text); if (p.error) return reply(`✕ ${p.error}\n_Ketik ${prefix}nada untuk panduan._`)
    try {
      const mp3 = await AJ.runFF(render(p), 'wav', 'mp3', ['-b:a', '96k', '-ar', '44100', '-f', 'mp3'])
      await sock.sendMessage(m.chat, { audio: mp3, mimetype: 'audio/mpeg', ptt: false, fileName: `${p.preset || 'melodi'}.mp3` }, { quoted: m })
      return reply(`✦ ${p.preset ? 'Lagu: *' + p.preset + '*' : p.seq.length + ' nada'} • ${p.inst} • ${p.bpm} bpm • ${p.total.toFixed(1)} detik`)
    } catch (e) { console.log('[nada]', e.message); return reply(`✕ Gagal membuat audio.\n_${e.message}_`) }
  },
  _internals: { parse, render, freq, morseEnc, morseDec, morseWav, isMorse, SR },
}
