/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Template Edit ala CapCut + Preset ala Alight Motion (v4.20). Semua lokal (ffmpeg + sharp), tanpa API.
//   .capcut   <template>        template video siap pakai (vlog, glitch, zoompulse, retrotape, cinematic, dreamy, shake, flash, mirror, noir, velocity)
//   .presetam <preset>          efek ala editan Alight Motion (shake, rgb, swing, echo, bounce, pixel, invert, blur, fisheye, flicker) + resep manual di AM
//   .ccam     <preset> [10-100] color correction (pink, teal, vintage, bright, moody, golden, cool, pastel, drama, matcha) untuk foto / video
//   .teksvid  <teks> [flag]     teks animasi di atas video (fade / slide / diam)
// Catatan: ini BUKAN file .alightmotion / template CapCut asli. Efeknya diterapkan langsung ke videomu lewat ffmpeg,
// dan tiap preset punya "resep" nilai setara untuk dibuat manual di aplikasinya (nama menu bisa beda antar versi aplikasi).
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { execFile } = require('child_process')
const sharp = require('../../lib/sharp.js')
const L = require('../../lib/stickerlib')

let FFMPEG = 'ffmpeg'
try { const p = require('@ffmpeg-installer/ffmpeg').path; if (typeof p === 'string' && p) FFMPEG = p } catch {}
const TMP = path.join(__dirname, '..', '..', 'tmp')
const tmpFile = (ext) => { fs.mkdirSync(TMP, { recursive: true }); return path.join(TMP, `cca_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`) }
const rm = (...f) => { for (const x of f) try { fs.unlinkSync(x) } catch {} }

const MAX_PIXELS = 40e6, MAX_IMG = 12 * 1024 * 1024, MAX_VID = 25 * 1024 * 1024, MAX_SEC = 60
const W = 720, H = 1280

// ───────────── dasar: video dipas-kan ke 9:16 (latar blur) ─────────────
const BASE = (crop) => crop
  ? `[0:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1,fps=30[base]`
  : `[0:v]split[a][b];[a]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},boxblur=24:6[bg];[b]scale=${W}:${H}:force_original_aspect_ratio=decrease[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2,setsar=1,fps=30[base]`
const n2 = (x) => (Math.round(x * 100) / 100).toString()

// ───────────── TEMPLATE ala CapCut ─────────────
// g(d) = graf ffmpeg mulai dari [base] dan berakhir di [v]; d = durasi video (detik). how = langkah manual di CapCut.
const TEMPLATES = {
  vlog: { desc: 'Vlog hangat: warna cerah, vignette halus, fade masuk & keluar', min: 1,
    g: (d) => `[base]eq=contrast=1.08:saturation=1.25:brightness=0.02,colorbalance=rs=0.05:bs=-0.05:rh=0.04:bh=-0.04,vignette=PI/5,fade=t=in:st=0:d=0.5,fade=t=out:st=${n2(Math.max(0, d - 0.5))}:d=0.5[v]`,
    how: ['Efek > Dasar > "Vignette" (intensitas 30)', 'Sesuaikan > Kontras +8, Saturasi +25, Suhu +10', 'Animasi: Masuk "Memudar", Keluar "Memudar" 0,5 dtk'] },
  glitch: { desc: 'Glitch: pecah warna RGB + noise berkedip tiap ±1,4 dtk', min: 1,
    g: () => `[base]rgbashift=rh=-12:bh=12:gv=5:enable='lt(mod(t,1.4),0.22)',noise=alls=18:allf=t:enable='lt(mod(t,1.4),0.22)',eq=contrast=1.08:saturation=1.25[v]`,
    how: ['Efek > Efek Video > "Glitch" / "RGB Split"', 'Taruh efek hanya ±0,2 dtk, ulangi tiap 1,4 dtk (potong klip lalu beri efek di potongan pendek)', 'Sesuaikan > Kontras +8, Saturasi +25'] },
  zoompulse: { desc: 'Zoom berdenyut 2x per detik (cocok untuk beat)', min: 1,
    g: () => `[base]scale=w='${W}*(1+0.07*pow(abs(sin(PI*t*2)),4))':h=-2:eval=frame,crop=${W}:${H}[v]`,
    how: ['Animasi Kombo > "Zoom Berdenyut" / keyframe Skala 100% → 107% → 100% tiap 0,5 dtk', 'Tandai beat musik (Auto Beat) lalu tempel keyframe di tiap beat'] },
  retrotape: { desc: 'Kaset VHS retro: warna pudar, noise, pergeseran warna', min: 1,
    g: () => `[base]curves=preset=vintage,rgbashift=rh=3:bh=-3,noise=alls=14:allf=t+u,eq=saturation=0.85:contrast=1.05,vignette=PI/4[v]`,
    how: ['Efek > Retro > "VHS" / "Kamera Lama"', 'Filter > Vintage (kekuatan 70)', 'Efek > "Noise/Grain" (30)'] },
  cinematic: { desc: 'Sinematik: teal-orange + bar hitam atas/bawah', min: 1,
    g: () => `[base]eq=contrast=1.12:saturation=1.1,colorbalance=rs=-0.08:bs=0.1:rh=0.1:bh=-0.08,drawbox=x=0:y=0:w=iw:h=ih*0.11:color=black:t=fill,drawbox=x=0:y=ih*0.89:w=iw:h=ih*0.11:color=black:t=fill[v]`,
    how: ['Filter > Sinema / Teal & Orange (kekuatan 60)', 'Tambah overlay "Letterbox" / 2 kotak hitam tinggi 11% di atas & bawah', 'Sesuaikan > Kontras +12'] },
  dreamy: { desc: 'Dreamy: cahaya lembut menyala (glow)', min: 1,
    g: () => `[base]split[x][y];[y]gblur=sigma=18,eq=brightness=0.05[g];[x][g]blend=all_mode=screen:all_opacity=0.5[v]`,
    how: ['Duplikat klip, klip atas diberi Blur 18 + mode campur "Screen" opasitas 50%', 'Atau Efek > "Glow" / "Soft Focus"'] },
  shake: { desc: 'Getar kamera halus', min: 1,
    g: () => `[base]scale=792:1408,crop=${W}:${H}:x='36+30*sin(t*37)':y='64+30*cos(t*29)'[v]`,
    how: ['Efek > "Getar Kamera" / "Shake" level 2', 'Atau keyframe Posisi acak ±30 px tiap 0,05 dtk dengan Skala 110%'] },
  flash: { desc: 'Kilat putih di tiap detik (strobe halus)', min: 1,
    g: () => `[base]eq=brightness='0.35*pow(max(0,1-3*mod(t,1)),2)':eval=frame[v]`,
    how: ['Efek > "Kilat" / "Flash" di tiap beat', 'Atau tambah klip putih opasitas 35% berdurasi 0,15 dtk dengan fade-out di tiap beat'] },
  mirror: { desc: 'Cermin simetris kiri-kanan', min: 1,
    g: () => `[base]split[l][r];[l]crop=iw/2:ih:0:0[L];[r]crop=iw/2:ih:0:0,hflip[R];[L][R]hstack[v]`,
    how: ['Efek > "Cermin" / "Mirror" (sumbu vertikal)'] },
  noir: { desc: 'Hitam putih kontras tinggi + grain', min: 1,
    g: () => `[base]hue=s=0,eq=contrast=1.25:brightness=-0.03,noise=alls=10:allf=t,vignette=PI/4[v]`,
    how: ['Filter > Hitam Putih / Noir', 'Sesuaikan > Kontras +25', 'Efek > "Grain" (20) + "Vignette"'] },
  velocity: { desc: 'Velocity edit: cepat → slow-mo di tengah → cepat (suara dibuang)', min: 2, noAudio: true,
    g: (d) => {
      const a = n2(d * 0.3), b = n2(d * 0.7)
      return `[base]split=3[s1][s2][s3];[s1]trim=0:${a},setpts=(PTS-STARTPTS)/1.6[v1];[s2]trim=${a}:${b},setpts=(PTS-STARTPTS)/0.5[v2];[s3]trim=${b},setpts=(PTS-STARTPTS)/1.6[v3];[v1][v2][v3]concat=n=3:v=1:a=0[v]`
    },
    how: ['Kecepatan > Kurva > "Velocity"/"Montase" atau Kustom', 'Titik kurva: 0% → 1,6x • 30% → 0,5x • 70% → 0,5x • 100% → 1,6x', 'Suara: pasang musik terpisah (kecepatan ikut kurva bila dibiarkan)'] },
}

// ───────────── PRESET ala Alight Motion ─────────────
// am = nilai setara untuk dibuat manual di Alight Motion (keyframe / efek). Nama menu bisa beda antar versi.
const PRESETS = {
  shake: { desc: 'Shake kuat (kamera berguncang, skala 120%)',
    g: () => `[base]scale=864:1536,crop=${W}:${H}:x='72+50*sin(t*47)+22*sin(t*23)':y='128+50*cos(t*41)+22*cos(t*19)'[v]`,
    am: ['Layer video: Skala 120%', 'Keyframe Posisi acak ±50 px (X) dan ±50 px (Y) tiap 0,04–0,06 dtk', 'Interpolasi: Linear (bukan Ease) supaya terasa kasar'] },
  rgb: { desc: 'RGB split berdenyut (chromatic aberration)',
    g: () => `[base]rgbashift=rh=-8:bh=8:enable='lt(mod(t,0.8),0.2)',eq=contrast=1.05[v]`,
    am: ['Duplikat layer 3x, beri efek Warna: Merah / Hijau / Biru saja pada tiap layer', 'Mode campur ketiganya "Add/Screen"', 'Keyframe Posisi layer merah −8 px, biru +8 px selama 0,2 dtk tiap 0,8 dtk'] },
  swing: { desc: 'Ayunan: video berputar kiri-kanan pelan',
    g: () => `[base]scale=864:1536,rotate=a='0.05*sin(2*PI*t*1.2)':ow=${W}:oh=${H}:c=black[v]`,
    am: ['Layer video: Skala 120%', 'Keyframe Rotasi −3° ↔ +3° (±0,05 rad) tiap 0,42 dtk', 'Interpolasi: Ease In-Out'] },
  echo: { desc: 'Jejak bayangan (ghost trail)',
    g: () => `[base]tmix=frames=6:weights='1 0.8 0.6 0.4 0.3 0.2'[v]`,
    am: ['Efek > "Echo" / "Trail": jumlah 6, peluruhan 80%', 'Atau duplikat layer 5x dengan penundaan 2 frame & opasitas 80/60/40/30/20%'] },
  bounce: { desc: 'Pantulan vertikal mengikuti ketukan (2x per detik)',
    g: () => `[base]scale=792:1408,crop=${W}:${H}:x=36:y='64-48*abs(sin(PI*t*2))'[v]`,
    am: ['Layer video: Skala 110%', 'Keyframe Posisi Y: 0 → −48 px → 0 tiap 0,5 dtk', 'Interpolasi: Ease Out (naik) lalu Ease In (turun)'] },
  pixel: { desc: 'Pixelate (mosaik 18 px)',
    g: () => `[base]scale=iw/18:ih/18:flags=neighbor,scale=${W}:${H}:flags=neighbor[v]`,
    am: ['Efek > "Pixelate" / "Mosaic": ukuran blok 18 px'] },
  invert: { desc: 'Negatif berkedip di tiap detik',
    g: () => `[base]negate=enable='lt(mod(t,1),0.12)'[v]`,
    am: ['Efek > "Invert" / "Negative", tempel 0,12 dtk di tiap beat', 'Atau layer kosong putih, mode campur "Difference", durasi 0,12 dtk'] },
  blur: { desc: 'Blur sesaat di tiap ±1,5 dtk (transisi ritmis)',
    g: () => `[base]gblur=sigma=14:enable='lt(mod(t,1.5),0.25)'[v]`,
    am: ['Efek > "Blur" radius 14 selama 0,25 dtk tiap 1,5 dtk', 'Keyframe radius: 0 → 14 → 0 (naik-turun cepat) agar halus'] },
  fisheye: { desc: 'Lensa fisheye (cembung)',
    g: () => `[base]lenscorrection=k1=-0.35:k2=-0.1[v]`,
    am: ['Efek > "Fisheye" / "Lens Distortion": jumlah −35%', 'Skala 105% agar tepi hitam tak terlihat'] },
  flicker: { desc: 'Lampu berkedip (kecerahan turun-naik cepat)',
    g: () => `[base]eq=brightness='-0.25*lt(mod(t,0.2),0.07)':eval=frame[v]`,
    am: ['Efek > "Brightness/Exposure" keyframe 0 → −25 → 0 tiap 0,2 dtk (turun 0,07 dtk)', 'Atau layer hitam opasitas 0 ↔ 25% berkedip'] },
}

// ───────────── COLOR CORRECTION ala CapCut / Alight Motion ─────────────
// b = kecerahan (-1..1), c = kontras (1 = normal), s = saturasi (1 = normal), w = hangat(+)/dingin(-), m = magenta(+)/hijau(-)
const CC = {
  pink: { b: 0.03, c: 1.06, s: 1.3, w: 0.35, m: 0.55, desc: 'Pink lembut, kulit cerah' },
  teal: { b: 0, c: 1.12, s: 1.15, w: -0.3, m: -0.25, desc: 'Teal & orange sinematik' },
  vintage: { b: 0.02, c: 0.92, s: 0.75, w: 0.5, m: 0.1, desc: 'Vintage pudar kekuningan' },
  bright: { b: 0.08, c: 1.05, s: 1.2, w: 0.1, m: 0, desc: 'Cerah & bersih' },
  moody: { b: -0.07, c: 1.22, s: 0.85, w: -0.25, m: 0, desc: 'Gelap, dingin, dramatis' },
  golden: { b: 0.03, c: 1.08, s: 1.2, w: 0.7, m: 0, desc: 'Golden hour hangat' },
  cool: { b: 0, c: 1.05, s: 1, w: -0.6, m: 0, desc: 'Dingin kebiruan' },
  pastel: { b: 0.1, c: 0.88, s: 0.8, w: 0.15, m: 0.25, desc: 'Pastel lembut' },
  drama: { b: -0.04, c: 1.35, s: 1.1, w: 0, m: 0, desc: 'Kontras tinggi' },
  matcha: { b: 0, c: 1.02, s: 0.9, w: -0.1, m: -0.5, desc: 'Hijau matcha segar' },
}
const IDENT = { b: 0, c: 1, s: 1, w: 0, m: 0 }
const clamp = (x, a, b) => Math.min(b, Math.max(a, x))
// k = kekuatan 10–100 (%); nilai preset diinterpolasi dari "tanpa efek"
function scaleCC(p, k = 100) {
  const f = clamp(Number(k) || 100, 10, 100) / 100, o = {}
  for (const key of Object.keys(IDENT)) o[key] = +(IDENT[key] + (p[key] - IDENT[key]) * f).toFixed(4)
  return o
}
const gains = (p) => ({ r: 1 + 0.10 * p.w + 0.04 * p.m, g: 1 - 0.08 * p.m, b: 1 - 0.10 * p.w + 0.04 * p.m })
const f3 = (x) => (+x).toFixed(3)
function ccFilter(p) {
  const g = gains(p)
  return `eq=brightness=${f3(p.b)}:contrast=${f3(p.c)}:saturation=${f3(p.s)},colorchannelmixer=rr=${f3(g.r)}:gg=${f3(g.g)}:bb=${f3(g.b)}`
}
async function ccPhoto(buf, p) {
  const g = gains(p), off = 128 * (1 - p.c) + p.b * 255
  return sharp(buf, { failOn: 'none', limitInputPixels: MAX_PIXELS }).rotate().removeAlpha()
    .modulate({ saturation: p.s })
    .linear([g.r * p.c, g.g * p.c, g.b * p.c], [off, off, off])
    .jpeg({ quality: 92 }).toBuffer()
}
// nilai setara untuk diketik manual di aplikasi (perkiraan; sesuaikan selera)
function ccRecipe(p) {
  const sgn = (n) => (n > 0 ? '+' : '') + n
  const temp = p.w > 0.05 ? `hangat ${sgn(Math.round(p.w * 50))}` : p.w < -0.05 ? `dingin ${sgn(Math.round(p.w * 50))}` : '0'
  const tint = p.m > 0.05 ? `magenta ${sgn(Math.round(p.m * 40))}` : p.m < -0.05 ? `hijau ${sgn(Math.round(-p.m * 40))}` : '0'
  return `Kecerahan ${sgn(Math.round(p.b * 100))} • Kontras ${sgn(Math.round((p.c - 1) * 100))} • Saturasi ${sgn(Math.round((p.s - 1) * 100))} • Suhu ${temp} • Tint ${tint}`
}

// ───────────── teks animasi di atas video ─────────────
const esc = (s) => String(s).replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c]))
function wrapText(text, maxChars) {
  const out = []
  for (const para of String(text).split(/\n/)) {
    let line = ''
    for (let w of para.split(/\s+/).filter(Boolean)) {
      while (Array.from(w).length > maxChars) { if (line) { out.push(line); line = '' } const a = Array.from(w); out.push(a.slice(0, maxChars).join('')); w = a.slice(maxChars).join('') }
      if (!line) line = w
      else if (Array.from(line + ' ' + w).length <= maxChars) line += ' ' + w
      else { out.push(line); line = w }
    }
    if (line) out.push(line)
  }
  return out
}
function layout(text, boxW, boxH, maxFs, minFs = 20) {
  for (let fs_ = maxFs; fs_ >= minFs; fs_ -= 2) {
    const lines = wrapText(text, Math.max(4, Math.floor(boxW / (fs_ * 0.6))))
    if (lines.length * fs_ * 1.2 <= boxH) return { fs: fs_, lines, lh: fs_ * 1.2 }
  }
  const lines = wrapText(text, Math.max(4, Math.floor(boxW / (minFs * 0.6)))), max = Math.max(1, Math.floor(boxH / (minFs * 1.2)))
  return { fs: minFs, lines: lines.slice(0, max), lh: minFs * 1.2 }
}
const TXT_COLORS = { putih: '#ffffff', kuning: '#ffe14d', pink: '#ff7ac8', biru: '#6ec6ff', hijau: '#7dffa1', merah: '#ff5a5a', oren: '#ffa94d' }
// PNG transparan seukuran video berisi teks (dilapis lewat ffmpeg)
async function textPng(text, w, h, { pos = 'bawah', color = 'putih' } = {}) {
  const fill = TXT_COLORS[color] || TXT_COLORS.putih
  const b = layout(String(text), w * 0.86, h * 0.3, Math.round(Math.min(w, h) / 9))
  const bh = b.lines.length * b.lh
  const y0 = pos === 'atas' ? h * 0.08 : pos === 'tengah' ? (h - bh) / 2 : h * 0.84 - bh
  const sw = Math.max(3, Math.round(b.fs / 9))
  const els = b.lines.map((ln, i) => `<text x="${w / 2}" y="${Math.round(y0 + b.lh * i + b.fs * 0.9)}" text-anchor="middle" font-family="DejaVu Sans, Sans" font-weight="700" font-size="${b.fs}" fill="${fill}" stroke="#000" stroke-width="${sw}" stroke-linejoin="round" paint-order="stroke">${esc(ln)}</text>`).join('')
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${els}</svg>`)
  return sharp({ create: { width: w, height: h, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite([{ input: svg }]).png().toBuffer()
}

// ───────────── ffmpeg ─────────────
const ff = (args, timeout = 170000) => new Promise((res, rej) => execFile(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { maxBuffer: 1 << 26, timeout }, (e, _o, se) => e ? rej(new Error(String(se || e.message).split('\n').filter(Boolean).slice(-3).join(' '))) : res()))
const probe = (file) => new Promise((res) => execFile(FFMPEG, ['-hide_banner', '-i', file], { timeout: 20000 }, (_e, _o, se) => {
  se = String(se || ''); const d = /Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(se), sz = /Video:.*?,\s*(\d{2,5})x(\d{2,5})/.exec(se)
  res({ duration: d ? (+d[1]) * 3600 + (+d[2]) * 60 + parseFloat(d[3]) : null, hasAudio: /Audio:/.test(se), hasVideo: /Video:/.test(se), w: sz ? +sz[1] : null, h: sz ? +sz[2] : null })
}))
const X264 = ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '26', '-pix_fmt', 'yuv420p', '-movflags', '+faststart']
const AUDIO = ['-map', '0:a?', '-c:a', 'aac', '-b:a', '128k']
const even = (n) => Math.max(2, Math.floor(n / 2) * 2)

// bangun argumen ffmpeg (dipisah agar mudah diuji). kind: capcut | presetam | ccam | teksvid
function buildArgs(kind, name, inp, out, o = {}) {
  const d = o.d || 10
  if (kind === 'capcut' || kind === 'presetam') {
    const t = (kind === 'capcut' ? TEMPLATES : PRESETS)[name]; if (!t) return null
    return ['-i', inp, '-filter_complex', `${BASE(o.crop)};${t.g(d)}`, '-map', '[v]', ...(t.noAudio ? ['-an'] : AUDIO), ...X264, out]
  }
  if (kind === 'ccam') {
    return ['-i', inp, '-vf', `scale=trunc(iw/2)*2:trunc(ih/2)*2,${ccFilter(o.cc)}`, '-map', '0:v:0', ...AUDIO, ...X264, out]
  }
  if (kind === 'teksvid') {
    const w = even(o.w || W), h = even(o.h || H), anim = o.anim || 'fade'
    const fade = anim === 'diam' ? '' : ',fade=t=in:st=0.15:d=0.5:alpha=1'
    const y = anim === 'slide' ? `:y='if(lt(t,0.65),70*(1-t/0.65),0)'` : ''
    return ['-i', inp, '-loop', '1', '-i', o.png, '-filter_complex',
      `[0:v]scale=${w}:${h},setsar=1[bv];[1:v]format=rgba${fade}[t];[bv][t]overlay=x=0${y || ':y=0'}:shortest=1:format=auto,format=yuv420p[v]`,
      '-map', '[v]', ...AUDIO, ...X264, out]
  }
  return null
}

const INFO = {
  capcut: ['.capcut <template>', 'template edit video ala CapCut (kirim / reply video). Tanpa nama = daftar template. ".capcut info <nama>" = langkah manual di CapCut.'],
  presetam: ['.presetam <preset>', 'efek ala editan Alight Motion (kirim / reply video). Tanpa nama = daftar preset. ".presetam info <nama>" = resep nilai untuk dibuat manual di AM.'],
  ccam: ['.ccam <preset> [10-100]', 'color correction preset (foto atau video). Angka = kekuatan efek (%). Balasan juga memuat nilai setara untuk CapCut / AM.'],
  teksvid: ['.teksvid <teks> [--atas|--tengah|--bawah] [--fade|--slide|--diam] [--warna]', 'tempel teks beranimasi di video. Warna: ' + Object.keys(TXT_COLORS).join(', ')],
}
const CMDS = Object.keys(INFO)

const busy = new Set()
const lastUse = new Map()

module.exports = {
  name: 'capcutam', alias: CMDS, category: 'kreasi', cmds: CMDS,
  desc: 'Template edit ala CapCut, preset ala Alight Motion, color correction foto/video, dan teks animasi video',
  INFO, TEMPLATES, PRESETS, CC, TXT_COLORS, scaleCC, gains, ccFilter, ccPhoto, ccRecipe, textPng, buildArgs, BASE,
  run: async ({ sock, m, text, args, command, prefix, reply, sender }) => {
    const cmd = command, U = (c) => `${prefix}${c}`
    const arg = (text || '').trim(), who = (m && m.sender) || sender || 'anon'
    const media = L.pickMedia(m)
    const usage = () => reply(`🎬 *${cmd.toUpperCase()}*\n\n> ${INFO[cmd][0].replace('.', prefix)}\n_${INFO[cmd][1]}_`)

    // ── daftar & info (capcut / presetam / ccam) ──
    const table = cmd === 'capcut' ? TEMPLATES : cmd === 'presetam' ? PRESETS : cmd === 'ccam' ? CC : null
    if (table) {
      const first = String(args[0] || '').toLowerCase()
      const title = { capcut: '✂️ TEMPLATE CAPCUT', presetam: '🌀 PRESET ALIGHT MOTION', ccam: '🎨 COLOR CORRECTION' }[cmd]
      if (!first) {
        const rows = Object.entries(table).map(([k, v]) => `> ${U(cmd + ' ' + k)} — ${v.desc}`).join('\n')
        const tip = cmd === 'ccam' ? `Kirim / reply foto atau video. Atur kekuatan: ${U('ccam pink 60')}` : `Kirim / reply video. Detail langkah manual: ${U(cmd + ' info <nama>')}`
        return reply(`${title}\n\n${rows}\n\n${tip}`)
      }
      if (first === 'info') {
        const k = String(args[1] || '').toLowerCase(), v = table[k]
        if (!v) return reply(`Nama "${k || ''}" tidak ada.\n\nPilihan: ${Object.keys(table).join(', ')}`)
        const steps = cmd === 'ccam' ? [ccRecipe(v)] : (v.how || v.am)
        return reply(`${title} • *${k}*\n_${v.desc}_\n\n${cmd === 'presetam' ? '📱 Resep di Alight Motion' : cmd === 'capcut' ? '📱 Langkah manual di CapCut' : '📱 Nilai untuk CapCut / Alight Motion'}:\n${steps.map((s) => '• ' + s).join('\n')}\n\n_Nama menu dapat berbeda antar versi aplikasi; nilai bersifat perkiraan._`)
      }
    }

    const isImg = media && ['image', 'sticker'].includes(media.kind)

    // ── ccam pada foto ──
    if (cmd === 'ccam' && isImg) {
      const name = String(args[0] || '').toLowerCase(), p = CC[name]
      if (!p) return reply(`Preset "${name}" tidak ada.\n\nPilihan: ${Object.keys(CC).join(', ')}`)
      const k = args[1] ? parseInt(args[1]) : 100
      if (!Number.isInteger(k) || k < 10 || k > 100) return reply(`Kekuatan 10–100. Contoh: ${U('ccam ' + name + ' 60')}`)
      if (media.node && Number(media.node.fileLength) > MAX_IMG) return reply(`❌ Foto terlalu besar (maks ${MAX_IMG / 1048576} MB).`)
      try {
        const buf = await L.download(media); if (!buf || !buf.length) return reply('❌ Gagal mengunduh foto.')
        const sp = scaleCC(p, k)
        return sock.sendMessage(m.chat, { image: await ccPhoto(buf, sp), caption: `🎨 ${name} ${k}%\n${ccRecipe(sp)}` }, { quoted: m })
      } catch (e) { console.log('[capcutam]', cmd, e.message); return reply('❌ Gagal memproses foto: ' + e.message) }
    }

    // ── semua yang lain: video ──
    if (!media || media.kind !== 'video') return usage()
    if (media.node && Number(media.node.fileLength) > MAX_VID) return reply(`❌ Video terlalu besar (maks ${MAX_VID / 1048576} MB).`)
    if (busy.has(who)) return reply('⏳ Masih ada proses video milikmu yang berjalan. Tunggu selesai dulu.')
    if (lastUse.get(who) > Date.now() - 8000) return reply('⏳ Tunggu beberapa detik sebelum memproses video lagi.')

    const opt = {}; let name = '', caption = ''
    if (cmd === 'capcut' || cmd === 'presetam') {
      name = String(args[0] || '').toLowerCase()
      const t = (cmd === 'capcut' ? TEMPLATES : PRESETS)[name]
      if (!t) return reply(`Nama "${name}" tidak ada.\n\nPilihan: ${Object.keys(cmd === 'capcut' ? TEMPLATES : PRESETS).join(', ')}`)
      opt.crop = args.slice(1).some((a) => /^crop$/i.test(a))
      opt.min = t.min || 0
      caption = `${cmd === 'capcut' ? '✂️ Template' : '🌀 Preset AM'} ${name}`
    } else if (cmd === 'ccam') {
      name = String(args[0] || '').toLowerCase()
      const p = CC[name]; if (!p) return reply(`Preset "${name}" tidak ada.\n\nPilihan: ${Object.keys(CC).join(', ')}`)
      const k = args[1] ? parseInt(args[1]) : 100
      if (!Number.isInteger(k) || k < 10 || k > 100) return reply(`Kekuatan 10–100. Contoh: ${U('ccam ' + name + ' 60')}`)
      opt.cc = scaleCC(p, k); caption = `🎨 ${name} ${k}%\n${ccRecipe(opt.cc)}`
    } else if (cmd === 'teksvid') {
      let t = arg
      const flags = []; t = t.replace(/--(\w+)/g, (_x, f) => { flags.push(f.toLowerCase()); return '' }).trim()
      if (!t) return usage()
      if (t.length > 120) return reply('❌ Teks terlalu panjang (maks 120 huruf).')
      opt.pos = flags.find((f) => ['atas', 'tengah', 'bawah'].includes(f)) || 'bawah'
      opt.anim = flags.find((f) => ['fade', 'slide', 'diam'].includes(f)) || 'fade'
      opt.color = flags.find((f) => TXT_COLORS[f]) || 'putih'
      const bad = flags.filter((f) => !['atas', 'tengah', 'bawah', 'fade', 'slide', 'diam'].includes(f) && !TXT_COLORS[f])
      if (bad.length) return reply(`Flag tidak dikenal: ${bad.map((b) => '--' + b).join(' ')}\n\n> ${INFO.teksvid[0].replace('.', prefix)}`)
      opt.text = t; caption = `🔤 Teks (${opt.pos}, ${opt.anim})`
    }

    busy.add(who); lastUse.set(who, Date.now())
    const inp = tmpFile('mp4'), out = tmpFile('mp4'), png = tmpFile('png')
    L.react(sock, m, '🕕')
    try {
      const buf = await L.download(media); if (!buf || !buf.length) throw new Error('Gagal mengunduh video')
      if (buf.length > MAX_VID) throw new Error(`Video terlalu besar (maks ${MAX_VID / 1048576} MB)`)
      fs.writeFileSync(inp, buf)
      const info = await probe(inp)
      if (!info.hasVideo) throw new Error('Berkas ini bukan video')
      if (info.duration && info.duration > MAX_SEC) throw new Error(`Video terlalu panjang (maks ${MAX_SEC} detik)`)
      opt.d = info.duration || 10
      if (opt.min && info.duration && info.duration < opt.min) throw new Error(`Template ini butuh video minimal ${opt.min} detik`)
      if (cmd === 'teksvid') {
        const w = even(info.w || W), h = even(info.h || H)
        opt.w = w; opt.h = h
        fs.writeFileSync(png, await textPng(opt.text, w, h, { pos: opt.pos, color: opt.color })); opt.png = png
      }
      await ff(buildArgs(cmd === 'teksvid' ? 'teksvid' : cmd, name, inp, out, opt))
      const res = fs.readFileSync(out); if (!res.length) throw new Error('Hasil kosong')
      L.react(sock, m, '✅')
      return sock.sendMessage(m.chat, { video: res, caption, mimetype: 'video/mp4' }, { quoted: m })
    } catch (e) {
      console.log('[capcutam]', cmd, e.message); L.react(sock, m, '❌'); return reply('❌ Gagal memproses video: ' + e.message)
    } finally { rm(inp, out, png); busy.delete(who) }
  },
}
