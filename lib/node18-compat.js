// Tambalan fitur Node 20+ yang tidak ada di Node 18 (nodejs-mobile), supaya library terbaru (ytdl-core, youtubei.js, undici) bisa dimuat.
function install() {
  const g = globalThis
  try { if (typeof g.File === 'undefined') { const { File } = require('buffer'); if (File) g.File = File } } catch {}
  try { if (typeof g.Blob === 'undefined') g.Blob = require('buffer').Blob } catch {}
  try { if (typeof g.CustomEvent === 'undefined' && typeof Event !== 'undefined') g.CustomEvent = class CustomEvent extends Event { constructor(t, o = {}) { super(t, o); this.detail = o.detail ?? null } } } catch {}
  try { if (typeof g.navigator === 'undefined') g.navigator = { userAgent: 'Node.js/18' } } catch {}
  const def = (o, k, f) => { if (typeof o[k] !== 'function') Object.defineProperty(o, k, { value: f, writable: true, configurable: true }) }
  def(Array.prototype, 'toSorted', function (c) { return [...this].sort(c) })
  def(Array.prototype, 'toReversed', function () { return [...this].reverse() })
  def(Array.prototype, 'toSpliced', function (...a) { const x = [...this]; x.splice(...a); return x })
  def(Array.prototype, 'with', function (i, v) { const x = [...this]; x[i < 0 ? x.length + i : i] = v; return x })
  def(Array.prototype, 'findLast', function (f) { for (let i = this.length - 1; i >= 0; i--) if (f(this[i], i, this)) return this[i] })
  def(Array.prototype, 'findLastIndex', function (f) { for (let i = this.length - 1; i >= 0; i--) if (f(this[i], i, this)) return i; return -1 })
  def(Promise, 'withResolvers', function () { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b }); return { promise, resolve, reject } })
  def(Array, 'fromAsync', async function (it) { const out = []; for await (const x of it) out.push(x); return out })
  def(Object, 'groupBy', function (items, f) { const o = Object.create(null); let i = 0; for (const x of items) { const k = f(x, i++); (o[k] ||= []).push(x) } return o })
  def(String.prototype, 'isWellFormed', function () { return !/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(this) })
}
module.exports = { install }
