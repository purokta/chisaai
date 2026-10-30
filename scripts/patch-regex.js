// Dipakai saat membangun APK: tulis ulang \p{...} di modul ESM (youtubei.js dsb.). Node Android tanpa ICU menolak regex itu,
// dan modul ESM yang dimuat lewat import() tidak melewati penambal runtime (lib/re-compat.js).
const fs = require('fs')
const path = require('path')
const { transform } = require('../lib/re-compat')
const root = path.resolve(process.argv[2] || 'node_modules')
let n = 0
function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name)
    if (e.isDirectory()) { walk(p); continue }
    if (!/\.(m?js|cjs)$/.test(e.name)) continue
    let s; try { s = fs.readFileSync(p, 'utf8') } catch { continue }
    if (!s.includes('\\p{') && !s.includes('\\P{')) continue
    const t = transform(s)
    if (t !== s) { fs.writeFileSync(p, t); n++ }
  }
}
for (const pkg of fs.readdirSync(root)) if (/^youtubei/.test(pkg)) walk(path.join(root, pkg))
console.log('regex \\p{} ditambal di', n, 'berkas')
