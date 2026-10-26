/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Informasi penggunaan bot (.inf): kartu HTML bergaya "system notice" + tombol native ke owner.
// Nomor owner diambil dari config.js: global.ownerInfo.number, cadangan global.owner[0].
// Dipanggil manual dengan .inf agar tidak spam otomatis.
const { sendHtmlCard, safeJson, escapeHtml, BASE_CSS } = require('../../lib/htmlcard')
const ui = require('../../lib/menuui')
const ST = require('../../lib/style')

const digits = (s) => String(s || '').replace(/\D/g, '')
const ownerNumber = () => digits((global.ownerInfo && global.ownerInfo.number) || (global.owner || [])[0])

function buildHtml({ botname, ownerName, waUrl }) {
  const CFG = { wa: waUrl }
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${BASE_CSS}
.app{padding:16px 14px 18px;background:linear-gradient(180deg,#1b1f2b 0%,#12151d 40%,#0d0f14 100%);border:1px solid #2b303b;}
.logo{background:linear-gradient(135deg,#f59e0b,#d97706);color:#1a1100;font-size:17px;}
.title{font-size:15px;letter-spacing:.8px;}
.sub{letter-spacing:.6px;text-transform:uppercase;}
.hr{height:1px;background:var(--line);margin:4px 0 14px;}
h1{font-size:15px;font-weight:900;letter-spacing:.3px;margin-bottom:10px;line-height:1.35;}
p{font-size:13px;line-height:1.55;color:#d6dbe6;margin-bottom:10px;}
p b{color:#fff;}
.rules{list-style:none;margin:2px 0 12px;display:flex;flex-direction:column;gap:7px;}
.rules li{display:flex;gap:9px;align-items:flex-start;background:var(--card);border:1px solid var(--line);border-radius:11px;padding:9px 11px;font-size:12.5px;line-height:1.45;color:#d6dbe6;}
.rules .n{flex:none;width:20px;height:20px;border-radius:6px;background:#2a2312;color:var(--warn);font-size:11px;font-weight:900;display:flex;align-items:center;justify-content:center;margin-top:1px;}
.warn{background:#2a2312;border:1px solid #4a3b14;border-radius:12px;padding:11px 12px;margin:4px 0 12px;}
.warn .wt{display:flex;gap:7px;align-items:center;font-size:13px;font-weight:900;color:#fde68a;letter-spacing:.3px;margin-bottom:5px;}
.warn .wb{font-size:12.5px;line-height:1.5;color:#e9d9a6;}
.help{font-size:11.5px;line-height:1.5;color:var(--soft);margin-bottom:11px;}
.cta{display:block;text-decoration:none;text-align:center;background:linear-gradient(180deg,#2c4a7a,#1f3558);border:1px solid #3a5f99;border-radius:12px;padding:12px 10px;color:#fff;box-shadow:0 6px 16px rgba(31,53,88,.45);}
.cta:active{transform:scale(.985);}
.cta .c1{font-size:14px;font-weight:900;letter-spacing:.6px;}
.cta .c2{font-size:11.5px;color:#cfe0ff;margin-top:3px;}
.foot{text-align:center;font-size:10px;color:#6b7385;margin-top:12px;letter-spacing:.5px;}
</style></head><body><div class="stage"><div class="app">
<div class="top"><div class="logo">⚠</div><div class="meta"><div class="title">${escapeHtml(botname.toUpperCase())} SYSTEM</div><div class="sub">Usage Notice · System Information</div></div></div>
<div class="hr"></div>
<h1>PERHATIAN: GUNAKAN BOT SECARA WAJAR</h1>
<p>Sistem mendeteksi bahwa penggunaan bot yang berlebihan dapat meningkatkan risiko pembatasan akun WhatsApp, termasuk <b>grup diblokir atau dibatasi oleh WhatsApp</b>.</p>
<p>Demi menjaga stabilitas layanan, ikuti ketentuan berikut:</p>
<ul class="rules">
<li><span class="n">1</span><span><b>Dilarang spam perintah</b> dan pengiriman pesan berulang dalam waktu singkat.</span></li>
<li><span class="n">2</span><span><b>Beri jeda</b> antarperintah, terutama fitur AI, unduhan, dan pemrosesan media.</span></li>
<li><span class="n">3</span><span><b>Patuhi aturan grup</b> serta ketentuan layanan WhatsApp.</span></li>
<li><span class="n">4</span><span><b>Hentikan penggunaan</b> bila admin atau owner memintanya.</span></li>
</ul>
<p><b>Ini bukan larangan menggunakan bot.</b> Gunakan fitur seperlunya agar bot tetap stabil dan nyaman untuk semua orang.</p>
<div class="warn"><div class="wt">⚠ MOHON PERHATIKAN</div><div class="wb">Spam dan penyalahgunaan dapat membuat <b>grup terblokir</b> serta nomor bot dibatasi. Pelanggaran berulang dapat menyebabkan fitur dibatasi atau akses bot dihentikan oleh pengelola.</div></div>
<div class="help">Butuh bantuan atau ingin melaporkan kendala? Hubungi pengelola melalui tombol di bawah.</div>
<a class="cta" id="go" href="#" target="_blank" rel="noopener"><div class="c1">💬 HUBUNGI OWNER</div><div class="c2">Kontak pengelola ${escapeHtml(ownerName)}</div></a>
<div class="foot">${escapeHtml(botname.toUpperCase())} • BOT USAGE NOTICE</div>
</div></div>
<script>var CFG=${safeJson(CFG)};var g=document.getElementById('go');if(CFG.wa){g.href=CFG.wa}else{g.style.opacity='.5'}</script>
</body></html>`
}

module.exports = {
  name: 'inf', alias: ['infobot', 'botinfo'], category: 'tools', noLimit: true,
  desc: 'Kirim informasi dan imbauan penggunaan bot secara tegas + tombol hubungi owner: .inf',
  run: async ({ sock, m, reply }) => {
    const O = global.ownerInfo || {}, D = global.settingsDefault || {}
    const botname = ST.plain ? ST.plain(D.botname || 'Chisa AI') : (D.botname || 'Chisa AI')
    const num = ownerNumber(), ownerName = O.name || 'Owner'
    const waUrl = num ? `https://wa.me/${num}?text=${encodeURIComponent('Halo ' + ownerName + ', saya ingin bertanya/melaporkan kendala terkait bot.')}` : ''

    // 1) kartu HTML (tampilan utama). Gagal -> lanjut ke pesan tombol saja.
    let ok = false
    try { ok = await sendHtmlCard(sock, m, buildHtml({ botname, ownerName, waUrl }), 'Bot Usage Notice', '⚠️', { quoted: m }) } catch (e) { console.log('[inf card]', e.message) }

    // 2) tombol native (cadangan bila kartu tidak bisa membuka tautan keluar)
    const btns = []
    if (waUrl) {
      btns.push({ name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: ST.cut('💬 Hubungi Owner', 30), url: waUrl, merchant_url: waUrl }) })
      btns.push({ name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: ST.cut('📋 Salin Nomor Owner', 30), id: 'copy_owner_inf', copy_code: '+' + num }) })
    }
    const L = global.links || {}
    if (L.group) btns.push({ name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: ST.cut('👥 Grup Resmi', 30), url: L.group, merchant_url: L.group }) })
    if (L.channel) btns.push({ name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: ST.cut('📢 Saluran Info', 30), url: L.channel, merchant_url: L.channel }) })

    const body = `*⚠️ PERHATIAN: GUNAKAN BOT SECARA WAJAR*\n\nSpam dan penyalahgunaan dapat membuat *grup terblokir*. Pelanggaran berulang dapat menyebabkan fitur dibatasi atau akses bot dihentikan oleh pengelola.\n\n• Dilarang spam perintah\n• Beri jeda antarperintah\n• Patuhi aturan grup & WhatsApp\n\n_Butuh bantuan atau ingin melapor? Tekan tombol di bawah._` + (num ? '' : '\n\n_Nomor owner belum diisi di config.js (ownerInfo.number)._')
    if (!btns.length) { if (!ok) await reply(body); return }
    try { await ui.sendInteractive(sock, m, null, body, `${botname} • Bot Usage Notice`, btns, { biz: false }) }
    catch (e) { console.log('[inf btn]', e.message); if (!ok) await reply(body + (waUrl ? '\n\nOwner: ' + waUrl : '')) }
  },
}
