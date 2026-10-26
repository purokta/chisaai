/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// PDF minimal tanpa dependensi: halaman gambar (JPEG) dan halaman teks (Helvetica). A4 = 595x842 pt.
const W = 595, H = 842, M = 50
// lebar glif Helvetica (AFM) untuk ASCII 32..126, per 1000 unit
const HW = [278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584]
// teks -> byte WinAnsi (Latin-1 cukup untuk Indonesia/Eropa); sisanya jadi "?"
const latin = (s) => Array.from(String(s).normalize('NFC').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/…/g, '...').replace(/\t/g, '    ').replace(/[•●]/g, '*')).map(c => { const k = c.codePointAt(0); return k >= 32 && k < 127 ? c : k >= 160 && k <= 255 ? c : '?' }).join('')
const cw = (ch) => { const k = ch.charCodeAt(0); return k >= 32 && k < 127 ? HW[k - 32] : 556 }
const strW = (s, size) => Array.from(s).reduce((n, c) => n + cw(c), 0) * size / 1000
function wrap(text, size, maxW) {
  const out = []
  for (const para0 of String(text).replace(/\r/g, '').split('\n')) {
    const para = latin(para0)
    if (!para.trim()) { out.push(''); continue }
    let line = ''
    for (const word of para.split(/ +/)) {
      let w = word
      while (strW(w, size) > maxW) { // kata super panjang: potong
        let i = w.length; while (i > 1 && strW(w.slice(0, i), size) > maxW) i--
        if (line) { out.push(line); line = '' } out.push(w.slice(0, i)); w = w.slice(i)
      }
      const t = line ? line + ' ' + w : w
      if (strW(t, size) <= maxW) line = t; else { out.push(line); line = w }
    }
    out.push(line)
  }
  return out
}
const esc = (s) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')

// pages: [{ jpeg:Buffer, w, h } | { text:string, title? }]
function build(pages, opts = {}) {
  const size = opts.size || 12, lead = size * 1.4, objs = []   // objs[i] = Buffer (isi objek nomor i+1)
  const add = (b) => { objs.push(Buffer.isBuffer(b) ? b : Buffer.from(b, 'latin1')); return objs.length }
  add('')  // 1 = catalog (diisi akhir), 2 = pages (diisi akhir)
  add('')
  const font = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>')
  const fontB = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>')
  const kids = []
  const addPage = (content, res) => {
    const c = add(Buffer.concat([Buffer.from(`<< /Length ${content.length} >>\nstream\n`), content, Buffer.from('\nendstream')]))
    kids.push(add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Contents ${c} 0 R /Resources ${res} >>`))
  }
  for (const p of pages) {
    if (p.jpeg) {
      const img = add(Buffer.concat([Buffer.from(`<< /Type /XObject /Subtype /Image /Width ${p.w} /Height ${p.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpeg.length} >>\nstream\n`), p.jpeg, Buffer.from('\nendstream')]))
      const k = Math.min((W - 2 * 30) / p.w, (H - 2 * 30) / p.h), dw = p.w * k, dh = p.h * k, x = (W - dw) / 2, y = (H - dh) / 2
      addPage(Buffer.from(`q ${dw.toFixed(2)} 0 0 ${dh.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm /Im0 Do Q`), `<< /XObject << /Im0 ${img} 0 R >> >>`)
    } else {
      const lines = wrap(p.text, size, W - 2 * M), per = Math.floor((H - 2 * M) / lead), res = `<< /Font << /F1 ${font} 0 R /F2 ${fontB} 0 R >> >>`
      let i = 0, first = true
      do {
        const hasTitle = first && p.title, n = per - (hasTitle ? 2 : 0), chunk = lines.slice(i, i + Math.max(1, n))
        let s = 'BT\n', y = H - M - size
        if (hasTitle) { s += `/F2 ${size + 6} Tf 1 0 0 1 ${M} ${y} Tm (${esc(latin(p.title))}) Tj\n`; y -= lead * 2 }
        s += `/F1 ${size} Tf ${lead.toFixed(2)} TL 1 0 0 1 ${M} ${y.toFixed(2)} Tm\n`
        chunk.forEach((l, j) => { s += (j ? 'T* ' : '') + `(${esc(l)}) Tj\n` })
        addPage(Buffer.from(s + 'ET', 'latin1'), res); i += chunk.length; first = false
      } while (i < lines.length)
    }
  }
  objs[0] = Buffer.from('<< /Type /Catalog /Pages 2 0 R >>')
  objs[1] = Buffer.from(`<< /Type /Pages /Kids [${kids.map(k => k + ' 0 R').join(' ')}] /Count ${kids.length} >>`)
  const parts = [Buffer.from('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n', 'latin1')], offs = []; let pos = parts[0].length
  objs.forEach((b, i) => { offs.push(pos); const o = Buffer.concat([Buffer.from(`${i + 1} 0 obj\n`), b, Buffer.from('\nendobj\n')]); parts.push(o); pos += o.length })
  let x = `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('')
  x += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${pos}\n%%EOF\n`
  parts.push(Buffer.from(x)); return Buffer.concat(parts)
}
module.exports = { build, wrap, latin }
