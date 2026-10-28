/*
 * CHISA-AI | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// CHISA — Kartu animasi "AI Agent" (rich response HTML) + pengirim jawaban dengan tombol salin.
//
//   Pesan ──► [LABA-LABA] ──► Balasan        (kelima node duduk di tepi sebuah GLOBE berkawat)
//                │ (benang jari-jari)
//         Model  Memory  Tools
//
// Jaringan digambar sebagai bola dunia: garis bujur berputar pelan, garis lintang melengkung, atmosfer bercahaya,
// cincin orbit berputar, paket data berkeliling di tepi globe, dan bintang-bintang kecil berkedip.
// Agent = laba-laba yang duduk di jaring di pusat globe. Saat AI bekerja ia berlari menyusuri jari-jari benang ke
// Pesan → Model → Memory → Tools → Balasan, menyentuh tiap node (node menyala + riak), meninggalkan jejak benang
// bercahaya, lalu pulang ke jaringnya sebelum berangkat ke tujuan berikutnya.
//
// Animasi murni CSS/SVG (tanpa JS, tanpa jaringan, tanpa emoji — semua vektor):
//   • posisi & arah hadap laba-laba dihitung di sini (Node) lalu dijadikan @keyframes, jadi tidak butuh offset-path
//   • 8 kaki berjalan bergantian (pola tetrapod) hanya saat bergerak; saat berhenti kaki diam
//   • garis bujur globe = elips yang di-scaleX mengikuti cos(sudut) → terlihat benar-benar berputar tanpa JS
//   • thinkingHtml(): berulang selama AI bekerja   • doneHtml(): sekali jalan, berakhir dengan centang di Balasan
//   • sendAnswer(): jawaban dikirim di bawah kartu, tombol native "Salin Jawaban" (cta_copy)
'use strict'
const HC = require('./htmlcard')
const E = HC.escapeHtml

// ───────────────────────── geometri (viewBox 360 x 320) ─────────────────────────
const CX = 180, CY = 182, R = 100       // pusat & jari-jari globe
const NR = 20                           // jari-jari node di tepi globe
const HUB = 30                          // jari-jari hub Agent (jaring laba-laba)
const HOME = [CX, CY]                   // jaring laba-laba = pusat globe
const polar = (deg, r = R) => [+(CX + r * Math.cos(deg * Math.PI / 180)).toFixed(1), +(CY + r * Math.sin(deg * Math.PI / 180)).toFixed(1)]
// lima node tersebar rata (72°) di tepi globe, searah jarum jam mulai dari atas; label diletakkan di luar globe
const ring = (deg) => { const [x, y] = polar(deg); return { x, y, r: NR } }
const NODES = {
  pesan:   { ...ring(-90), label: 'Pesan',   icon: 'pesan',   lx: 0,        ly: -(NR + 9),  anchor: 'middle' },
  model:   { ...ring(-18), label: 'Model',   icon: 'model',   lx: NR + 6,   ly: 4,          anchor: 'start' },
  memory:  { ...ring(54),  label: 'Memory',  icon: 'memory',  lx: 0,        ly: NR + 15,    anchor: 'middle' },
  tools:   { ...ring(126), label: 'Tools',   icon: 'tools',   lx: 0,        ly: NR + 15,    anchor: 'middle' },
  balasan: { ...ring(198), label: 'Balasan', icon: 'balasan', lx: -(NR + 6), ly: 4,         anchor: 'end' },
  agent:   { x: CX, y: CY, r: HUB, label: '', icon: 'web' },
}
const SPOKES = ['pesan', 'model', 'memory', 'tools', 'balasan']

// ikon vektor, digambar di sekitar (0,0) dalam kotak ±12
const ICON = {
  pesan:   '<rect x="-11" y="-8" width="22" height="16" rx="3"/><path d="M-10 -6 L0 2 L10 -6"/>',
  balasan: '<path d="M-11 -9 H11 a2 2 0 0 1 2 2 V3 a2 2 0 0 1 -2 2 H-3 L-9 10 V5 H-11 a2 2 0 0 1 -2 -2 V-7 a2 2 0 0 1 2 -2 Z" transform="translate(-1 -1) scale(.92)"/><path d="M-6 -3 H6 M-6 1 H2"/>',
  model:   '<circle cx="-9" cy="-6" r="2.4"/><circle cx="-9" cy="6" r="2.4"/><circle cx="0" cy="0" r="2.8"/><circle cx="9" cy="-6" r="2.4"/><circle cx="9" cy="6" r="2.4"/><path d="M-7 -5 L-2.4 -1 M-7 5 L-2.4 1 M2.4 -1 L7 -5 M2.4 1 L7 5"/>',
  memory:  '<ellipse cx="0" cy="-7" rx="9" ry="3.2"/><path d="M-9 -7 V7 a9 3.2 0 0 0 18 0 V-7 M-9 0 a9 3.2 0 0 0 18 0"/>',
  tools:   '<path d="M-10 -6 H10 M-10 0 H10 M-10 6 H10"/><circle cx="-3" cy="-6" r="2.6" class="kn"/><circle cx="4" cy="0" r="2.6" class="kn"/><circle cx="-5" cy="6" r="2.6" class="kn"/>',
}

// jaring laba-laba di hub (delapan jari-jari + tiga cincin segi delapan)
function webSvg() {
  const pt = (r, i) => `${(r * Math.cos(i * Math.PI / 4)).toFixed(1)} ${(r * Math.sin(i * Math.PI / 4)).toFixed(1)}`
  let d = ''
  for (let i = 0; i < 8; i++) d += `M0 0 L${pt(25, i)} `
  for (const r of [8, 15, 22]) { for (let i = 0; i < 8; i++) d += `${i ? 'L' : 'M'}${pt(r, i)} `; d += 'Z ' }
  return `<g transform="translate(${CX} ${CY})"><g class="web"><path d="${d}"/></g></g>`
}

// ───────────────────────── globe ─────────────────────────
// Garis bujur: 6 lingkaran besar (tiap 30°) yang di-scaleX = cos(sudut) → elips yang berputar. Tiap garis dapat keyframes
// sendiri yang menyapu +30° dalam satu putaran, sehingga ujung loop identik dengan awalnya (mulus, tanpa lompatan).
const MER = 6, STEPS = 8, TILT = -16, PITCH = 22
function globeCss(T, loop) {
  const spin = loop ? 2.6 : Math.max(2.6, T)       // detik untuk menyapu 30°
  let k = '', r = ''
  for (let i = 0; i < MER; i++) {
    let fr = ''
    for (let j = 0; j <= STEPS; j++) {
      const ang = (i * 30 + 30 * j / STEPS) * Math.PI / 180
      fr += `${(j / STEPS * 100).toFixed(2)}%{transform:scaleX(${Math.cos(ang).toFixed(3)})}`
    }
    k += `@keyframes m${i}{${fr}}`
    r += `.m${i}{animation:m${i} ${spin}s linear ${loop ? 'infinite' : '1 forwards'}}`
  }
  return k + r
}
function globeSvg() {
  const pr = Math.sin(PITCH * Math.PI / 180), pc = Math.cos(PITCH * Math.PI / 180)
  let par = '', mer = ''
  for (const lat of [-60, -30, 0, 30, 60]) {
    const ph = lat * Math.PI / 180, rx = R * Math.cos(ph), ry = rx * pr, y = -R * Math.sin(ph) * pc
    par += `<path class="pb" d="M${f1(-rx)} ${f1(y)} A${f1(rx)} ${f1(ry)} 0 0 1 ${f1(rx)} ${f1(y)}"/>`
    par += `<path class="pf" d="M${f1(-rx)} ${f1(y)} A${f1(rx)} ${f1(ry)} 0 0 0 ${f1(rx)} ${f1(y)}"/>`
  }
  for (let i = 0; i < MER; i++) mer += `<ellipse class="mr m${i}" cx="0" cy="0" rx="${R}" ry="${R}"/>`
  // bintang / kota kecil di permukaan (posisi tetap, kedip bergantian)
  let st = '', seed = 7
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  for (let i = 0; i < 16; i++) {
    const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * (R - 9)
    st += `<circle class="tw" cx="${f1(CX + d * Math.cos(a))}" cy="${f1(CY + d * Math.sin(a))}" r="${(1 + rnd() * 1.1).toFixed(1)}" style="animation-delay:${(-rnd() * 3.6).toFixed(2)}s"/>`
  }
  return `<circle class="atm" cx="${CX}" cy="${CY}" r="${R + 3}"/>`
    + `<circle class="orb" cx="${CX}" cy="${CY}" r="${R + 12}"/>`
    + `<circle class="sph" cx="${CX}" cy="${CY}" r="${R}" fill="url(#gb)"/>`
    + `<g transform="translate(${CX} ${CY}) rotate(${TILT})">${par}${mer}</g>`
    + st
    + `<circle class="rim" cx="${CX}" cy="${CY}" r="${R}"/>`
    + `<g class="pk"><circle class="pz" cx="${CX}" cy="${CY}" r="${R}"/><circle cx="${CX + R}" cy="${CY}" r="3"/></g>`
    + `<g class="pk pk2"><circle class="pz" cx="${CX}" cy="${CY}" r="${R}"/><circle cx="${CX - R}" cy="${CY}" r="2.2"/></g>`
}

// ───────────────────────── rute laba-laba ─────────────────────────
// Tiap rute = polyline rapat dari jaring ke tepi objek tujuan. Laba-laba berhenti STOP px sebelum tepi
// (kaki depannya menyentuh objek, ikon di dalamnya tetap kelihatan).
const STOP = 14
function mkRoute(pts) {
  const cum = [0]
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]))
  const total = cum[cum.length - 1]
  return { pts, cum, total, len: total - STOP }
}
function at(R, s) {
  s = Math.max(0, Math.min(R.total, s))
  let i = 1
  while (i < R.cum.length - 1 && R.cum[i] < s) i++
  const a = R.pts[i - 1], b = R.pts[i], span = R.cum[i] - R.cum[i - 1] || 1, f = (s - R.cum[i - 1]) / span
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]
}
// jari-jari lurus dari hub ke tepi node (benang web)
const edgeOf = (n) => { const d = Math.hypot(n.x - CX, n.y - CY) || 1, e = d - n.r; return [CX + (n.x - CX) * e / d, CY + (n.y - CY) * e / d] }
const ROUTES = {}
SPOKES.forEach(id => { ROUTES[id] = mkRoute([HOME, edgeOf(NODES[id])]) })
// arah hadap sprite (digambar menghadap atas) untuk bergerak sepanjang rute; dir -1 = pulang
function heading(R, s, dir) {
  const e = 1.5, a = at(R, s - e), b = at(R, s + e)
  return Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI + 90 + (dir < 0 ? 180 : 0)
}
const norm = (d) => ((d % 360) + 540) % 360 - 180
const f1 = (n) => (+n.toFixed(1))

// ───────────────────────── linimasa ─────────────────────────
// build() menyusun jadwal: tiap tujuan = putar badan → lari ke objek → berhenti & balik badan → lari pulang → jeda.
//   keys  : titik keyframe laba-laba [t, x, y, sudut]       moves : segmen lari {id, dir, t0, t1}
//   hits  : objek yang menyala [node, detik tiba]            say   : teks status [teks, mulai, selesai]
const STEP = 0.1   // detik antar keyframe (lintasan dibuat dari sampel rapat, interpolasi linear)
function build({ v, dwell, pause, turn, rest, loop, order }) {
  const keys = [], moves = [], hits = [], say = []
  let t = 0, a = 0
  const key = (x, y) => keys.push([t, f1(x), f1(y), f1(a)])
  key(HOME[0], HOME[1])
  if (!loop) hits.push(['agent', 0])
  for (const [id, text] of order) {
    const R = ROUTES[id], from = t
    a += norm(heading(R, 0, 1) - a); t += turn; key(...HOME)                              // putar menghadap tujuan
    for (const dir of [1, -1]) {
      const t0 = t, dur = R.len / v, n = Math.max(2, Math.ceil(dur / STEP))
      for (let i = 1; i <= n; i++) {
        const s = dir > 0 ? R.len * i / n : R.len * (1 - i / n), p = at(R, s)
        a += norm(heading(R, s, dir) - a); t = t0 + dur * i / n; key(...p)
      }
      moves.push({ id, dir, t0, t1: t, R })
      if (dir > 0) {                                                                      // sampai: sentuh objek, lalu balik badan
        hits.push([id, t])
        const e = at(R, R.len)
        a += norm(heading(R, R.len, -1) - a); t += dwell * .6; key(...e)
        t += dwell * .4; key(...e)
      } else {
        if (loop) hits.push(['agent', t])
        t += pause; key(...HOME)
      }
    }
    say.push([text, from, t])
  }
  a += norm(0 - a); t += rest; key(...HOME)                                               // kembali menghadap atas = awal (loop mulus)
  say[say.length - 1][2] = t
  const tOk = moves.find(m => m.id === 'balasan' && m.dir > 0).t1
  const toolsAt = moves.find(m => m.id === 'tools' && m.dir > 0).t1
  return { T: t, loop, keys, moves, hits, say, tOk, minShow: toolsAt + .6 }
}
const ORDER = [['pesan', 'Membaca pesan'], ['model', 'Memanggil model'], ['memory', 'Membuka memory'], ['tools', 'Menyiapkan tools'], ['balasan', 'Menyusun balasan']]
const THINK = build({ v: 210, dwell: .42, pause: .12, turn: .16, rest: .5, loop: true, order: ORDER })
const DONE  = build({ v: 330, dwell: .22, pause: .04, turn: .1,  rest: .3, loop: false, order: ORDER })

const pct = (t, T) => (Math.max(0, Math.min(T, t)) / T * 100).toFixed(2)
const TAIL = 34   // panjang jejak benang bercahaya di belakang laba-laba (px)

function css(tl) {
  const { T, loop } = tl, it = loop ? 'infinite' : '1', fill = loop ? '' : ' forwards'
  let k = '', r = ''
  // posisi + arah hadap laba-laba
  k += `@keyframes sp{${tl.keys.map(([t, x, y, a]) => `${pct(t, T)}%{transform:translate(${x}px,${y}px) rotate(${a}deg)}`).join('')}}`
  r += `.sp{animation:sp ${T}s linear ${it}${fill}}`
  // kaki: jalan hanya saat bergerak (.lgm tampil), diam saat berhenti (.lgs tampil)
  let on = '', off = '0%{opacity:1}'
  tl.moves.forEach(m => {
    on += `${pct(m.t0 - .01, T)}%{opacity:0}${pct(m.t0, T)}%{opacity:1}${pct(m.t1, T)}%{opacity:1}${pct(m.t1 + .01, T)}%{opacity:0}`
    off += `${pct(m.t0 - .01, T)}%{opacity:1}${pct(m.t0, T)}%{opacity:0}${pct(m.t1, T)}%{opacity:0}${pct(m.t1 + .01, T)}%{opacity:1}`
  })
  k += `@keyframes lm{0%{opacity:0}${on}100%{opacity:0}}@keyframes ls{${off}100%{opacity:1}}`
  r += `.lgm{animation:lm ${T}s linear ${it}${fill}}.lgs{animation:ls ${T}s linear ${it}${fill}}`
  // jejak benang: potongan bercahaya yang ikut berlari di belakang laba-laba, lalu memudar
  tl.moves.forEach((m, i) => {
    const tail = TAIL / m.R.len * 100, o0 = f1(tail), o1 = f1(tail - 100), pa = +pct(m.t0, T), pb = +pct(m.t1, T)
    k += `@keyframes c${i}{0%,${pa}%{stroke-dashoffset:${o0};opacity:0}${(pa + .01).toFixed(2)}%{opacity:1}${pb}%{stroke-dashoffset:${o1};opacity:1}${pct(m.t1 + .45, T)}%,100%{stroke-dashoffset:${o1};opacity:0}}`
    r += `.s${i}{animation:c${i} ${T}s linear ${it}${fill}}`
  })
  // nyala + riak tiap objek (satu node bisa kena beberapa kali: keyframes digabung per node)
  const byNode = {}
  tl.hits.forEach(([n, t]) => (byNode[n] = byNode[n] || []).push(t))
  for (const [n, ts] of Object.entries(byNode)) {
    ts.sort((a, b) => a - b)
    let g = `0%{stroke:var(--idle);fill:var(--nf);filter:none}`, w = `0%{opacity:0;transform:scale(1)}`
    ts.forEach((t, i) => {
      const p = +pct(t, T), last = i === ts.length - 1, hold = loop ? Math.min(+pct(t + 1.0, T), (ts[i + 1] ? +pct(ts[i + 1], T) - .1 : 99)) : 100
      g += `${Math.max(p - .3, 0).toFixed(2)}%{stroke:var(--idle);fill:var(--nf);filter:none}${p.toFixed(2)}%{stroke:var(--hot);fill:var(--nh);filter:drop-shadow(0 0 7px var(--hotg))}`
      if (loop) g += `${hold.toFixed(2)}%{stroke:var(--hot);fill:var(--nh);filter:drop-shadow(0 0 5px var(--hotg))}${Math.min(hold + 3, 100).toFixed(2)}%{stroke:var(--idle);fill:var(--nf);filter:none}`
      else if (last) g += `100%{stroke:var(--hot);fill:var(--nh);filter:drop-shadow(0 0 5px var(--hotg))}`
      w += `${Math.max(p - .01, 0).toFixed(2)}%{opacity:0;transform:scale(1)}${(p + .01).toFixed(2)}%{opacity:.95;transform:scale(1)}${Math.min(p + 9, 100).toFixed(2)}%{opacity:0;transform:scale(1.7)}`
    })
    k += `@keyframes g_${n}{${g}}@keyframes w_${n}{${w}100%{opacity:0;transform:scale(1.7)}}`
    r += `.g_${n}{animation:g_${n} ${T}s linear ${it}${fill}}.w_${n}{animation:w_${n} ${T}s ease-out ${it}${fill}}`
  }
  if (!loop) {   // centang di Balasan + teks hasil muncul saat laba-laba menyentuh Balasan
    const p = +pct(tl.tOk, T)
    k += `@keyframes ck{0%,${p}%{stroke-dashoffset:30;opacity:0}${(p + .01).toFixed(2)}%{opacity:1}${Math.min(p + 6, 100)}%,100%{stroke-dashoffset:0;opacity:1}}`
    k += `@keyframes fi{0%,${pct(tl.tOk - .1, T)}%{opacity:0;transform:translateY(4px)}${pct(tl.tOk + .5, T)}%,100%{opacity:1;transform:none}}`
    r += `.ck{stroke-dasharray:30;animation:ck ${T}s ease-out 1 forwards}.fi{animation:fi ${T}s ease-out 1 forwards}`
  }
  return k + r + globeCss(T, loop)
}

// teks status bergantian (hanya kartu berpikir): satu teks per tujuan laba-laba
function sayCss() {
  const { T, say } = THINK
  let k = '', r = ''
  say.forEach(([, a, b], i) => {
    k += `@keyframes y${i}{0%,${pct(a, T)}%{opacity:0;transform:translateY(5px)}${pct(a + .25, T)}%,${pct(b - .25, T)}%{opacity:1;transform:none}${pct(b, T)}%,100%{opacity:0;transform:translateY(-5px)}}`
    r += `.y${i}{animation:y${i} ${T}s ease-in-out infinite}`
  })
  return k + r
}

const BASE = `
:root{--idle:#46557a;--hot:#fbbf24;--hotg:rgba(251,191,36,.65);--nf:#141a2a;--nh:#2a2412;--cy:#38bdf8;--ink:#e9ecf3;--soft:#9aa3b5;--ok:#22c55e}
*{margin:0;padding:0;box-sizing:border-box}
html,body{background:transparent;color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;-webkit-font-smoothing:antialiased}
.w{padding:10px 8px}
.hd{display:flex;align-items:center;gap:8px;margin:0 4px 2px}
.hd svg{flex:none}.hd .n{font-size:12.5px;font-weight:700;color:var(--soft);letter-spacing:.3px;font-style:italic}
.ttl{text-align:center;font-size:20px;font-weight:900;letter-spacing:1.6px;margin:12px 0 0}
svg.d{display:block;width:100%;height:auto;overflow:visible}
.nd{stroke-width:2.2}
.hubf{fill:#101626;stroke:#46557a;stroke-width:2.2}
.ic{fill:none;stroke:#aab2c3;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
.ic .kn{fill:#141a2a}
.web{fill:none;stroke:#7d8fb8;stroke-width:1;stroke-linejoin:round;opacity:.95;transform-box:fill-box;transform-origin:center;animation:webr 40s linear infinite}
@keyframes webr{to{transform:rotate(360deg)}}
.lb{font-size:11.5px;fill:#b4bdd0;font-weight:600;paint-order:stroke;stroke:#0d111c;stroke-width:3px;stroke-linejoin:round}
.ag{font-size:10.5px;font-weight:800;fill:#e9ecf3;text-anchor:middle;letter-spacing:1.6px;paint-order:stroke;stroke:#0d111c;stroke-width:3px;stroke-linejoin:round}
.base{fill:none;stroke:#46557a;stroke-width:1.6;stroke-linecap:round;opacity:.9}.base.dash{stroke-dasharray:2 5}
.cm{fill:none;stroke:var(--hot);stroke-width:2.6;stroke-linecap:round;stroke-dashoffset:40;opacity:0;filter:drop-shadow(0 0 4px var(--hot))}
.wv{fill:none;stroke:var(--hot);stroke-width:2;opacity:0;transform-box:fill-box;transform-origin:center}
.atm{fill:none;stroke:var(--cy);stroke-width:7;opacity:.13;filter:blur(5px);animation:atm 3.6s ease-in-out infinite}
@keyframes atm{0%,100%{opacity:.09}50%{opacity:.22}}
.orb{fill:none;stroke:#fbbf24;stroke-width:1.2;stroke-dasharray:2 7;stroke-linecap:round;opacity:.5;transform-box:fill-box;transform-origin:center;animation:spin 16s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.sph{stroke:none}
.mr{fill:none;stroke:#4a6296;stroke-width:1;vector-effect:non-scaling-stroke;opacity:.8;transform-box:fill-box;transform-origin:center}
.pb{fill:none;stroke:#334469;stroke-width:1;opacity:.45}
.pf{fill:none;stroke:#4a6296;stroke-width:1;opacity:.85}
.rim{fill:none;stroke:#5a74b0;stroke-width:1.6;filter:drop-shadow(0 0 5px rgba(56,189,248,.45))}
.tw{fill:#9fd8ff;opacity:.15;transform-box:fill-box;transform-origin:center;animation:tw 3.6s ease-in-out infinite}
@keyframes tw{0%,100%{opacity:.12;transform:scale(.8)}50%{opacity:.95;transform:scale(1.15)}}
.pk{transform-box:fill-box;transform-origin:center;animation:spin 7.5s linear infinite}
.pk circle{fill:#7dd3fc;filter:drop-shadow(0 0 4px #38bdf8)}.pk .pz{fill:none;filter:none}
.pk2{animation-duration:11s;animation-direction:reverse}
.pk2 circle{fill:#fde68a;filter:drop-shadow(0 0 4px #fbbf24)}
.sp{filter:drop-shadow(0 0 3px rgba(251,191,36,.75))}
.sp .bd{fill:#fbbf24}.sp .hdc{fill:#fcd34d}.sp .mk{fill:#8a6208}.sp .ey{fill:#1b1f29}
.sp .lg{fill:none;stroke:#fbbf24;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
.lgm{opacity:0}.lgs{opacity:1}
.lgA{animation:lgw .28s ease-in-out infinite}
.lgB{animation:lgw .28s ease-in-out infinite;animation-delay:-.14s}
@keyframes lgw{0%,100%{transform:rotate(-15deg)}50%{transform:rotate(15deg)}}
.st{position:relative;height:26px;margin:6px 0 2px}
.st span{position:absolute;left:0;right:0;text-align:center;font-size:13.5px;font-weight:700;opacity:0}
.thk{display:flex;align-items:center;justify-content:center;gap:9px;font-size:16px;font-weight:800;margin:6px 2px 4px}
.dots i{display:inline-block;width:5px;height:5px;border-radius:50%;background:var(--hot);margin:0 1.5px;animation:bn 1.2s ease-in-out infinite}
.dots i:nth-child(2){animation-delay:.15s}.dots i:nth-child(3){animation-delay:.3s}
@keyframes bn{0%,60%,100%{opacity:.25;transform:translateY(0)}30%{opacity:1;transform:translateY(-3px)}}
.sk{height:6px;border-radius:3px;margin:7px 4px 0;background:linear-gradient(90deg,#222735 25%,#323a4e 50%,#222735 75%);background-size:200% 100%;animation:sh 1.4s linear infinite}
@keyframes sh{to{background-position:-200% 0}}
.meta{margin:4px 4px 0;font-size:11px;color:var(--soft);text-align:center;opacity:0}
.okrow{display:flex;align-items:center;justify-content:center;gap:8px;font-size:16px;font-weight:800;margin:6px 2px 2px;opacity:0}
`

// laba-laba: digambar di (0,0) menghadap ke atas. 4 kaki kanan (dicerminkan untuk kiri), tiap kaki berayun
// dari pangkalnya; kaki bersebelahan berlawanan fase (A/B) sehingga terlihat berjalan.
const LEGS = [  // [pangkal x, y, lekuk, ujung] relatif pangkal
  [2.4, -5.2, [5.8, -6.0], [9.8, -3.0]],
  [2.8, -3.6, [7.4, -2.0], [11.4, 2.0]],
  [2.8, -2.0, [7.4, 3.0], [10.4, 8.0]],
  [2.4, -0.4, [5.8, 6.0], [7.8, 12.0]],
]
function spiderSvg() {
  const legSet = (cls) => LEGS.map(([hx, hy, k, e], i) => ['R', 'L'].map(side => {
    const ph = cls ? ((i + (side === 'L' ? 1 : 0)) % 2 ? 'lgB' : 'lgA') : ''
    const sx = side === 'L' ? ' scale(-1 1)' : ''
    return `<g transform="translate(${side === 'L' ? -hx : hx} ${hy})${sx}"><path class="lg ${ph}" d="M0 0 L${k[0]} ${k[1]} L${e[0]} ${e[1]}"/></g>`
  }).join('')).join('')
  const body = '<ellipse class="bd" cx="0" cy="4.4" rx="4.6" ry="6.2"/><path class="mk" d="M0 1.6 L2 5 L0 8.6 L-2 5 Z"/>'
    + '<circle class="hdc" cx="0" cy="-3.6" r="3.3"/><circle class="ey" cx="-1.25" cy="-4.7" r=".85"/><circle class="ey" cx="1.25" cy="-4.7" r=".85"/>'
    + '<circle class="ey" cx="-.55" cy="-3.3" r=".55"/><circle class="ey" cx=".55" cy="-3.3" r=".55"/>'
  return `<g class="sp" style="transform:translate(${HOME[0]}px,${HOME[1]}px)"><g transform="scale(1.4)"><g class="lgs">${legSet(false)}</g><g class="lgm">${legSet(true)}</g>${body}</g></g>`
}

function nodeSvg(id) {
  const n = NODES[id], agent = id === 'agent'
  const lbl = n.label ? `<text class="lb" x="${f1(n.x + n.lx)}" y="${f1(n.y + n.ly)}" text-anchor="${n.anchor}">${n.label}</text>` : ''
  const icon = agent ? webSvg() : `<g class="ic" transform="translate(${n.x} ${n.y})">${ICON[n.icon]}</g>`
  const ag = agent ? `<text class="ag" x="${n.x}" y="${f1(n.y + n.r + 14)}">AGENT</text>` : ''
  return `<circle class="nd g_${id}${agent ? ' hubf' : ''}" cx="${n.x}" cy="${n.y}" r="${n.r}" style="stroke:var(--idle);fill:var(--nf)"/>`
    + `<circle class="wv w_${id}" cx="${n.x}" cy="${n.y}" r="${n.r}"/>` + icon + ag + lbl
}

function logo() {   // logo bot: heksagon + titik (vektor, tanpa emoji)
  return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"><path d="M12 2.5 L20 7 V17 L12 21.5 L4 17 V7 Z"/><circle cx="12" cy="12" r="2.6" fill="#fbbf24" stroke="none"/><path d="M12 9.4 V5.6 M14.2 13.3 L17.6 15.2 M9.8 13.3 L6.4 15.2"/></svg>'
}

// path jejak benang untuk satu segmen lari (pulang = rute dibalik)
function trailD(m) {
  const R = m.R, n = Math.max(4, Math.ceil(R.len / 5)), pts = []
  for (let i = 0; i <= n; i++) pts.push(at(R, m.dir > 0 ? R.len * i / n : R.len * (1 - i / n)))
  return pts.map(([x, y], i) => `${i ? 'L' : 'M'}${f1(x)} ${f1(y)}`).join(' ')
}

function diagram(tl, thinking) {
  const defs = `<defs><radialGradient id="gb" cx="36%" cy="30%" r="80%"><stop offset="0" stop-color="#38bdf8" stop-opacity=".20"/><stop offset=".55" stop-color="#1e3a8a" stop-opacity=".10"/><stop offset="1" stop-color="#0b1020" stop-opacity=".55"/></radialGradient></defs>`
  const lines = SPOKES.map(id => { const e = edgeOf(NODES[id]); return `<path class="base dash" d="M${CX} ${CY} L${f1(e[0])} ${f1(e[1])}"/>` }).join('')
  const trails = tl.moves.map((m, i) => `<path class="cm s${i}" pathLength="100" style="stroke-dasharray:${f1(TAIL / m.R.len * 100)} 400" d="${trailD(m)}"/>`).join('')
  const nodes = Object.keys(NODES).map(id => nodeSvg(id)).join('')
  // centang menutup ikon Balasan saat laba-laba menyentuhnya (kartu selesai)
  const b = NODES.balasan
  const check = thinking ? '' : `<circle cx="${b.x}" cy="${b.y}" r="${b.r - 2}" fill="#10261a" class="fi"/><path class="ck" d="M${b.x - 10} ${b.y + 1} L${b.x - 3} ${b.y + 8} L${b.x + 10} ${b.y - 8}" fill="none" stroke="var(--ok)" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>`
  // urutan gambar: globe → benang jari-jari → node → jejak benang → centang → laba-laba (paling atas)
  return `<svg class="d" viewBox="0 0 360 320" xmlns="http://www.w3.org/2000/svg">${defs}${globeSvg()}${lines}${nodes}${trails}${check}${spiderSvg()}</svg>`
}

// kartu "sedang berpikir": berulang sampai jawaban siap
function thinkingHtml({ name = 'Chisa AI' } = {}) {
  const say = THINK.say.map(([t], i) => `<span class="y${i}">${E(t)}</span>`).join('')
  return `<style>${BASE}${css(THINK)}${sayCss()}</style><div class="w">`
    + `<div class="hd">${logo()}<span class="n">${E(name)} AI</span></div>`
    + `<div class="ttl">AI AGENT</div>${diagram(THINK, true)}`
    + `<div class="st">${say}</div>`
    + `<div class="thk"><span>${E(name)} sedang berpikir</span><span class="dots"><i></i><i></i><i></i></span></div>`
    + `<div class="sk" style="width:86%"></div><div class="sk" style="width:62%"></div></div>`
}

// kartu "selesai": sekali jalan, berakhir dengan centang. info = '2.4 dtk  |  groq/llama-3.3-70b  |  memory aktif'
function doneHtml({ name = 'Chisa AI', info = '' } = {}) {
  return `<style>${BASE}${css(DONE)}.meta{animation:fi ${DONE.T}s ease-out 1 forwards}</style><div class="w">`
    + `<div class="hd">${logo()}<span class="n">${E(name)} AI</span></div>`
    + `<div class="ttl">AI AGENT</div>${diagram(DONE, false)}`
    + `<div class="okrow fi"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5 L10 18 L20 6"/></svg><span>Jawaban sudah siap</span></div>`
    + (info ? `<div class="meta">${E(info)}</div>` : '') + `</div>`
}

// ───────────────────────── kartu satu-pesan: animasi laba-laba + jawaban + tombol salin ─────────────────────────
// Satu pesan HTML saja (tanpa hapus / kirim ulang): laba-laba berlari sekali, lalu bagian animasi menciut
// (grid-template-rows 1fr→0fr) dan jawaban AI muncul di tempat yang sama dengan tombol Salin berupa elemen SVG.
const COPY_ICON = '<svg class="i-cp" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2.5"/><path d="M5 15 V6.5 A2.5 2.5 0 0 1 7.5 4 H16"/></svg>'
  + '<svg class="i-ok" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5 L10 18 L20 6"/></svg>'

// markup WhatsApp / markdown ringan → HTML aman. copies[0] = seluruh jawaban, copies[1..] = isi tiap blok kode.
function fmtAnswer(raw) {
  const copies = [String(raw)], blocks = []
  let s = String(raw).replace(/\r\n/g, '\n').trim()
  s = s.replace(/```([\w+#.-]*)[ \t]*\n?([\s\S]*?)```/g, (_, lang, code) => {
    code = code.replace(/\n+$/, ''); copies.push(code); blocks.push({ lang, code, i: copies.length - 1 })
    return `\u0000B${blocks.length - 1}\u0000`
  })
  const inline = (line) => E(line).split(/(`[^`\n]+`)/).map((p, i) => {
    if (i % 2) return `<code>${p.slice(1, -1)}</code>`
    return p.replace(/\*\*([^*\n]+)\*\*/g, '<b>$1</b>').replace(/\*([^*\n]+)\*/g, '<b>$1</b>')
      .replace(/(^|[^\w])_([^_\n]+)_(?=[^\w]|$)/g, '$1<i>$2</i>').replace(/~([^~\n]+)~/g, '<s>$1</s>')
  }).join('')
  const out = s.split('\n').map(line => {
    let m
    if ((m = line.match(/^\u0000B(\d+)\u0000$/))) {
      const b = blocks[+m[1]]
      return `<div class="cb"><div class="ch"><span>${E(b.lang || 'kode')}</span><button class="cp sm" type="button" data-i="${b.i}">${COPY_ICON}<span class="lbl">Salin</span></button></div><pre>${E(b.code)}</pre></div>`
    }
    if (!line.trim()) return '<div class="gap"></div>'
    if ((m = line.match(/^\s*#{1,6}\s+(.*)$/))) return `<div class="hh">${inline(m[1])}</div>`
    if ((m = line.match(/^\s*[-*•]\s+(.*)$/))) return `<div class="li"><i class="dt"></i><span>${inline(m[1])}</span></div>`
    if ((m = line.match(/^\s*(\d+)[.)]\s+(.*)$/))) return `<div class="li"><span class="nm">${m[1]}.</span><span>${inline(m[2])}</span></div>`
    if ((m = line.match(/^\s*&?>\s?(.*)$/)) && /^\s*>/.test(line)) return `<div class="qt">${inline(m[1])}</div>`
    return `<div class="ln">${inline(line)}</div>`
  }).join('')
  return { html: out, copies }
}

const ANS_CSS = `
.stg{display:grid;grid-template-rows:1fr}
.stg>.in{min-height:0;overflow:hidden}
.ans{opacity:0;max-height:0;overflow:hidden}
.chipok{white-space:nowrap;display:flex;align-items:center;gap:7px;margin:8px 4px 8px;font-size:12px;font-weight:700;color:var(--ok)}
.chipok svg{flex:none}.chipok span.i{flex:1;color:var(--soft);font-weight:500;font-size:11px;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.abody{max-height:440px;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:12px 13px;border-radius:14px;background:#171a22;border:1px solid #2a3040;font-size:14.5px;line-height:1.5;color:var(--ink);word-break:break-word;overflow-wrap:anywhere}
.abody .ln{white-space:pre-wrap}
.abody .gap{height:8px}
.abody b{font-weight:800}.abody i{font-style:italic}.abody s{opacity:.7}
.abody .hh{font-weight:800;font-size:15.5px;margin:2px 0 2px}
.abody .li{display:flex;gap:9px;margin:2px 0}
.abody .li .dt{flex:none;width:5px;height:5px;border-radius:50%;background:var(--hot);margin-top:.62em}
.abody .li .nm{flex:none;color:var(--hot);font-weight:800;min-width:1.2em}
.abody .qt{border-left:3px solid #3b4254;padding-left:9px;color:var(--soft);margin:2px 0}
.abody code{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12.5px;background:#232838;border-radius:5px;padding:1px 5px}
.cb{margin:8px 0;border-radius:11px;overflow:hidden;background:#0f1218;border:1px solid #2a3040}
.ch{display:flex;align-items:center;justify-content:space-between;padding:5px 6px 5px 11px;background:#1b2030;font-size:11px;font-weight:700;color:var(--soft);text-transform:lowercase}
.cb pre{margin:0;padding:10px 12px;overflow-x:auto;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12.5px;line-height:1.45;color:#dfe6f5;white-space:pre}
.abar{display:flex;align-items:center;justify-content:flex-end;gap:8px;margin:9px 2px 2px}
.cp{display:inline-flex;align-items:center;gap:7px;border:1px solid #3a3320;background:#2a2412;color:var(--hot);border-radius:20px;padding:8px 15px;font-size:12.5px;font-weight:800;cursor:pointer;font-family:inherit;transition:background .15s,transform .1s}
.cp:active{transform:scale(.95)}
.cp.sm{padding:4px 10px;font-size:11px;gap:5px}
.cp.sm svg{width:12px;height:12px}
.cp .i-ok{display:none}
.cp.ok{color:var(--ok);background:#10261a;border-color:#1c4a2d}
.cp.ok .i-cp{display:none}.cp.ok .i-ok{display:block}
.cp.er{color:#f87171}
`

const COPY_JS = `(function(){var T=__T__;
function fb(t){try{var a=document.createElement('textarea');a.value=t;a.style.cssText='position:fixed;top:0;left:0;opacity:0';a.setAttribute('readonly','');document.body.appendChild(a);a.focus();a.select();a.setSelectionRange(0,t.length);var ok=false;try{ok=document.execCommand('copy')}catch(e){}document.body.removeChild(a);return ok}catch(e){return false}}
function cp(t,cb){if(fb(t)){cb(true);return}var d=false;function j(o){if(d)return;d=true;cb(o)}try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(function(){j(true)},function(){j(false)});setTimeout(function(){j(false)},900);return}}catch(e){}cb(false)}
var bs=document.querySelectorAll('.cp');
for(var k=0;k<bs.length;k++){bs[k].addEventListener('click',function(){var el=this,i=+el.getAttribute('data-i'),l=el.querySelector('.lbl');if(!l.getAttribute('data-o'))l.setAttribute('data-o',l.textContent);
cp(T[i]||'',function(ok){l.textContent=ok?'Tersalin':'Gagal';el.className=el.className.replace(/ ?(ok|er)\\b/g,'')+(ok?' ok':' er');setTimeout(function(){l.textContent=l.getAttribute('data-o');el.className=el.className.replace(/ ?(ok|er)\\b/g,'')},1700)})})}
})();`

// kartu final: animasi sekali jalan → menciut → jawaban + tombol Salin (semua dalam SATU pesan)
function answerHtml({ name = 'Chisa AI', info = '', text = '' } = {}) {
  const { html, copies } = fmtAnswer(text), T = DONE.T, c0 = +(T - .4).toFixed(2)
  const stage = `<div class="stg"><div class="in">`
    + `<div class="ttl">AI AGENT</div>${diagram(DONE, false)}`
    + `<div class="okrow fi"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5 L10 18 L20 6"/></svg><span>Jawaban sudah siap</span></div>`
    + (info ? `<div class="meta">${E(info)}</div>` : '') + `</div></div>`
  const ans = `<div class="ans" style="animation:ansin .6s ease-out ${c0}s 1 forwards">`
    + `<div class="abody">${html}</div>`
    + `<div class="abar"><button class="cp" type="button" data-i="0">${COPY_ICON}<span class="lbl">Salin Jawaban</span></button></div></div>`
  const kf = `@keyframes col{to{grid-template-rows:0fr;opacity:0}}@keyframes ansin{from{opacity:0;max-height:0;transform:translateY(6px)}to{opacity:1;max-height:3000px;transform:none}}`
  return `<style>${BASE}${css(DONE)}.meta{animation:fi ${T}s ease-out 1 forwards}${ANS_CSS}${kf}</style><div class="w">`
    + `<div class="hd">${logo()}<span class="n">${E(name)} AI</span></div>${stage}${ans}</div>`
    + `<script>${COPY_JS.replace('__T__', require('./htmlcard').safeJson(copies))}</script>`
}

// ───────────────────────── pengiriman ─────────────────────────
const sleep = (ms) => new Promise(r => setTimeout(r, ms))
const newId = () => 'DIO' + require('crypto').randomBytes(8).toString('hex').toUpperCase()

// kirim kartu lewat relayMessage dengan id yang kita pegang, supaya bisa dihapus nanti
async function sendCard(sock, m, html, title) {
  const id = newId()
  await sock.relayMessage(m.chat, HC.buildRichHtmlPayload(html, title, { quoted: m }), { messageId: id })
  return { remoteJid: m.chat, fromMe: true, id }
}
const delMsg = (sock, m, key) => key && sock.sendMessage(m.chat, { delete: key }).catch(() => {})

// pesan interaktif dengan tombol native "Salin" (cta_copy)
async function sendCopyMessage(sock, jid, body, copyText, { label = 'Salin Jawaban', footer = '' } = {}) {
  const { generateWAMessageFromContent } = require('./baileys')
  const btn = { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: label, id: 'copy_agent', copy_code: String(copyText).slice(0, 60000) }) }
  const msg = generateWAMessageFromContent(jid, { viewOnceMessage: { message: {
    messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
    interactiveMessage: { body: { text: String(body) }, footer: { text: footer }, header: { hasMediaAttachment: false }, nativeFlowMessage: { buttons: [btn], messageParamsJson: '' } },
  } } }, { userJid: jid, upload: sock.waUploadToServer })
  await sock.relayMessage(jid, msg.message, { messageId: msg.key.id })
}

// jawaban di bawah kartu. Pendek: satu pesan + tombol salin. Panjang / berisi kode: teks (atau blok kode) lalu tombol salin.
async function sendAnswer(sock, m, text, footer = '') {
  const CB = require('./codeblock')
  const SHORT = 1800
  if (text.length <= SHORT && !/```/.test(text)) {
    try { return await sendCopyMessage(sock, m.chat, text, text, { footer }) } catch (e) { console.log('[agent] salin:', e.message) }
  }
  let sent = false
  try { sent = await CB.sendAnswer(sock, m, text) } catch (e) { console.log('[agent] codeblock:', e.message) }
  if (!sent) await sock.sendMessage(m.chat, { text }, { quoted: m })
  try { await sendCopyMessage(sock, m.chat, 'Salin seluruh jawaban di atas dengan satu ketukan.', text, { footer }) } catch (e) { console.log('[agent] salin:', e.message) }
}

// jawaban agent sebagai blok native WhatsApp: ada kode → teks + kotak "Lihat kode" per blok;
// tanpa kode → seluruh jawaban dibungkus SATU kotak "Lihat kode" (ketuk = layar penuh, bisa disalin). Gagal → teks biasa.
async function sendNative(sock, m, text) {
  const CB = require('./codeblock')
  let segs = CB.splitAnswer(text)
  if (!segs.some(x => x.code !== undefined)) segs = [{ text: 'Ketuk *Lihat kode* untuk membuka jawaban lengkap (bisa disalin).' }, { code: String(text), lang: 'text' }]
  if (segs.length > 40) { await sock.sendMessage(m.chat, { text }, { quoted: m }); return true }
  await CB.sendRich(sock, m, segs)   // sendRich sendiri jatuh ke teks ``` bila WhatsApp menolak
  return true
}

module.exports = { sendNative, thinkingHtml, doneHtml, answerHtml, fmtAnswer, sendCard, delMsg, sendCopyMessage, sendAnswer, sleep, THINK, DONE }
