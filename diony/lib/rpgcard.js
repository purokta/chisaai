/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// CANVAS KARTU RPG — SVG dirender jadi PNG lewat sharp (tanpa dependency tambahan)
const sharp = require('./sharp.js')
const AN = require('./ancientsvg'), ST = require('./style')
const SERIF = AN.SERIF
const botPlain = () => ST.plain(global.settingsDefault?.botname || 'CHISA AI').toUpperCase()
const subOf = (t) => ST.plain(t || '').split('|').pop().trim().toUpperCase()

const FONT = "Poppins, 'DejaVu Sans', Arial, sans-serif"
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const cut = (s, n) => { s = String(s ?? ''); return s.length > n ? s.slice(0, n - 1) + '…' : s }
const num = (n) => Math.floor(n).toLocaleString('id-ID')
// emoji tidak bisa dirender di SVG -> dibuang; teks diperkecil otomatis supaya tidak menabrak elemen lain
const noEmoji = (t) => String(t ?? '').replace(/\p{Extended_Pictographic}|[\uFE0F\u200D]/gu, '').replace(/\s+/g, ' ').trim()
function fit(t, maxW, size, min = 16, k = 0.62) {
  t = noEmoji(t); let sz = size
  while (sz > min && t.length * sz * k > maxW) sz--
  if (t.length * sz * k > maxW) t = cut(t, Math.max(3, Math.floor(maxW / (sz * k))))
  return { t, sz }
}

// partikel bintang deterministik
function stars(seed, color) {
  let x = seed, out = ''
  const r = () => (x = (x * 9301 + 49297) % 233280) / 233280
  for (let i = 0; i < 46; i++) out += `<circle cx="${(r() * 1000).toFixed(0)}" cy="${(r() * 560).toFixed(0)}" r="${(r() * 1.8 + 0.4).toFixed(1)}" fill="${r() > 0.7 ? color : '#fff'}" opacity="${(r() * 0.5 + 0.1).toFixed(2)}"/>`
  return out
}
const barSvg = (x, y, w, h, pct, c1, c2, id) => `
  <defs><linearGradient id="${id}" x1="0" x2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="#0b0f1f" stroke="#ffffff22"/>
  <rect x="${x}" y="${y}" width="${Math.max(h, w * Math.max(0, Math.min(1, pct)))}" height="${h}" rx="${h / 2}" fill="url(#${id})"/>`

async function avatarDataUri(buf) {
  if (!buf || !Buffer.isBuffer(buf)) return null
  try { const j = await sharp(buf).resize(280, 280, { fit: 'cover' }).jpeg({ quality: 85 }).toBuffer(); return 'data:image/jpeg;base64,' + j.toString('base64') } catch { return null }
}
function silhouette(initial, color) {
  return `<rect width="280" height="280" fill="#1b2140"/><circle cx="140" cy="108" r="58" fill="${color}" opacity="0.55"/>
  <path d="M30 280 C40 190 90 170 140 170 C190 170 240 190 250 280Z" fill="${color}" opacity="0.4"/>
  <text x="140" y="130" text-anchor="middle" font-family="${FONT}" font-size="72" font-weight="800" fill="#fff">${esc(initial)}</text>`
}

function chip(x, y, w, label, value, color) {
  return `<g><rect x="${x}" y="${y}" width="${w}" height="54" rx="14" fill="#ffffff0d" stroke="${color}55"/>
  <text x="${x + 14}" y="${y + 21}" font-family="${FONT}" font-size="13" fill="#9aa4c7" font-weight="600">${label}</text>
  <text x="${x + 14}" y="${y + 43}" font-family="${FONT}" font-size="20" fill="#fff" font-weight="800">${esc(value)}</text></g>`
}

// d: { title, name, avatar (Buffer), cls, rank{tier,name,color}, level, exp, need, hp, maxhp, mp, maxmp, gold, power, atk, def, agi, int,
//      clan{name,level,members,max}|null, wins, kills, companion, footer, registered }
async function profileCard(d) {
  const rc = d.rank.color, uri = await avatarDataUri(d.avatar)
  const initial = (d.name || '?').trim().charAt(0).toUpperCase()
  const expPct = d.need ? d.exp / d.need : 0
  const clan = d.clan
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1000" height="560" viewBox="0 0 1000 560">
  <defs>${AN.defs(rc)}
    <clipPath id="av"><circle cx="190" cy="230" r="124"/></clipPath>
    <filter id="sh"><feGaussianBlur stdDeviation="8"/></filter>
  </defs>
  ${AN.frame(1000, 560, rc, 28)}

  <!-- header -->
  ${AN.brand(64, 66, botPlain(), 26, esc(cut(subOf(d.title) || 'ADVENTURER GUILD', 30)))}
  <text x="944" y="62" text-anchor="end" font-family="${SERIF}" font-size="15" fill="${AN.C.stone}" font-weight="600">${esc(cut(d.footer || '', 36))}</text>

  <!-- avatar -->
  <circle cx="190" cy="230" r="140" fill="${rc}" opacity="0.28" filter="url(#sh)"/>
  <circle cx="190" cy="230" r="134" fill="none" stroke="${rc}" stroke-width="6"/>
  <g clip-path="url(#av)"><svg x="66" y="106" width="248" height="248" viewBox="0 0 280 280" preserveAspectRatio="xMidYMid slice">${uri ? `<image href="${uri}" xlink:href="${uri}" width="280" height="280"/>` : silhouette(initial, rc)}</svg></g>
  <g><rect x="110" y="352" width="160" height="46" rx="23" fill="${rc}"/>
  <text x="190" y="383" text-anchor="middle" font-family="${FONT}" font-size="22" font-weight="800" fill="#0a0e1f">RANK ${esc(d.rank.tier)}</text></g>
  <text x="190" y="428" text-anchor="middle" font-family="${FONT}" font-size="16" font-weight="700" fill="${rc}">${esc(cut(d.rank.name, 22))}</text>

  <!-- identitas: nama menyesuaikan lebar, level = lencana kecil di kanan (tidak pernah bentrok) -->
  ${(() => { const f = fit(d.name, 440, 40, 22); return `<text x="360" y="124" font-family="${SERIF}" font-size="${f.sz}" font-weight="700" fill="#fff">${esc(f.t)}</text>` })()}
  <text x="360" y="154" font-family="${FONT}" font-size="18" font-weight="600" fill="#b9c2e8">${esc(cut(noEmoji(d.cls), 20))}${d.companion ? '  •  ' + esc(cut(noEmoji(d.companion), 22)) : ''}</text>
  <g><rect x="836" y="92" width="120" height="40" rx="20" fill="#ffffff10" stroke="${rc}" stroke-width="2"/>
  <text x="896" y="120" text-anchor="middle" font-family="${FONT}" font-size="22" font-weight="800" fill="${rc}">LV ${d.level}</text></g>

  <!-- bar -->
  <text x="360" y="196" font-family="${FONT}" font-size="14" font-weight="700" fill="#9aa4c7">EXP</text>
  <text x="956" y="196" text-anchor="end" font-family="${FONT}" font-size="14" font-weight="700" fill="#fff">${num(d.exp)} / ${num(d.need)}</text>
  ${barSvg(360, 204, 596, 16, expPct, '#fbbf24', '#f472b6', 'be')}
  <text x="360" y="252" font-family="${FONT}" font-size="14" font-weight="700" fill="#9aa4c7">HP</text>
  <text x="956" y="252" text-anchor="end" font-family="${FONT}" font-size="14" font-weight="700" fill="#fff">${num(d.hp)} / ${num(d.maxhp)}</text>
  ${barSvg(360, 260, 596, 16, d.hp / Math.max(1, d.maxhp), '#ef4444', '#fb7185', 'bh')}
  <text x="360" y="308" font-family="${FONT}" font-size="14" font-weight="700" fill="#9aa4c7">MP</text>
  <text x="956" y="308" text-anchor="end" font-family="${FONT}" font-size="14" font-weight="700" fill="#fff">${num(d.mp)} / ${num(d.maxmp)}</text>
  ${barSvg(360, 316, 596, 16, d.mp / Math.max(1, d.maxmp), '#38bdf8', '#818cf8', 'bm')}

  <!-- statistik -->
  ${chip(360, 352, 140, 'ATK', num(d.atk), '#f87171')}
  ${chip(512, 352, 140, 'DEF', num(d.def), '#38bdf8')}
  ${chip(664, 352, 140, 'POWER', num(d.power), '#c084fc')}
  ${chip(816, 352, 140, 'GOLD', num(d.gold), '#fbbf24')}

  <!-- clan -->
  <g>
    <rect x="44" y="456" width="912" height="72" rx="20" fill="#ffffff0f" stroke="${clan ? '#fbbf24' : '#ffffff22'}" stroke-opacity="0.7"/>
    ${clan ? `
    <polygon points="98,468 130,486 130,520 98,538 66,520 66,486" transform="translate(0,-8)" fill="#fbbf24"/>
    <text x="98" y="509" text-anchor="middle" font-family="${FONT}" font-size="26" font-weight="800" fill="#0a0e1f">${esc(clan.name.charAt(0).toUpperCase())}</text>
    <text x="156" y="488" font-family="${FONT}" font-size="14" font-weight="700" fill="#fbbf24" letter-spacing="2">CLAN</text>
    <text x="156" y="516" font-family="${FONT}" font-size="26" font-weight="800" fill="#fff">${esc(cut(clan.name, 20))}</text>
    <text x="928" y="506" text-anchor="end" font-family="${FONT}" font-size="18" font-weight="700" fill="#e5e9ff">Clan Lv.${clan.level}  •  ${clan.members}/${clan.max} member</text>`
    : `<text x="80" y="500" font-family="${FONT}" font-size="22" font-weight="700" fill="#9aa4c7">Belum punya clan</text>
    <text x="80" y="520" font-family="${FONT}" font-size="14" fill="#6b7599">${esc(d.registered === false ? 'Ketik .rpgstart untuk memulai petualangan' : 'Buat dengan .clancreate atau gabung dengan .clanjoin')}</text>
    <text x="928" y="506" text-anchor="end" font-family="${FONT}" font-size="18" font-weight="700" fill="#e5e9ff">Menang ${d.wins || 0}  •  Kill ${num(d.kills || 0)}</text>`}
  </g>
</svg>`
  return sharp(Buffer.from(svg)).png().toBuffer()
}

// KARTU HASIL FITUR (hunt, dungeon, explore, daily, quest, duel, dll) — satu desain untuk semua fitur.
// d: { title, sub, tone:'win'|'lose'|'gain'|'info'|'levelup', headline, name, avatar, cls, level, rank{tier,name,color}, exp, need,
//      hp, maxhp, mp, maxmp, gold, chips:[{l,v,c}], log:[string], up:{from,to,pts,rankUp,prev}|null, footer }
const TONE = { win: '#34d399', lose: '#f87171', gain: '#fbbf24', info: '#38bdf8', levelup: '#fde047' }
async function resultCard(d) {
  const tone = TONE[d.tone] || TONE.info, rc = d.rank.color, uri = await avatarDataUri(d.avatar)
  const initial = (noEmoji(d.name) || '?').charAt(0).toUpperCase()
  const nm = fit(d.name, 270, 28, 17), hd = fit(String(d.headline || '').toUpperCase(), 560, 54, 28, 0.7)
  const sub = fit(d.sub || '', 580, 20, 14, 0.56)
  const chips = (d.chips || []).slice(0, 3), cw = chips.length ? Math.floor((596 - (chips.length - 1) * 12) / chips.length) : 0
  const chipSvg = chips.map((c, i) => { const v = fit(c.v, cw - 24, 24, 13, 0.6); return `<g><rect x="${360 + i * (cw + 12)}" y="200" width="${cw}" height="62" rx="16" fill="#ffffff0d" stroke="${c.c || tone}66"/>
    <text x="${374 + i * (cw + 12)}" y="223" font-family="${FONT}" font-size="12" fill="#9aa4c7" font-weight="700" letter-spacing="2">${esc(noEmoji(c.l).toUpperCase())}</text>
    <text x="${374 + i * (cw + 12)}" y="251" font-family="${FONT}" font-size="${v.sz}" fill="${c.c || '#fff'}" font-weight="800">${esc(v.t)}</text></g>` }).join('')
  const log = (d.log || []).slice(0, 4).map((l, i) => `<text x="372" y="${300 + i * 25}" font-family="${FONT}" font-size="15" font-weight="500" fill="#c7cff0">${esc(cut(noEmoji(l).replace(/^[➤>\-\s]+/, ''), 64))}</text>`).join('')
  const logBar = (d.log || []).length ? `<rect x="360" y="284" width="4" height="${Math.min(4, d.log.length) * 25 - 2}" rx="2" fill="${tone}"/>` : ''
  const up = d.up
  const strip = up
    ? `<rect x="44" y="446" width="912" height="60" rx="18" fill="url(#agold)"/>
       <text x="72" y="484" font-family="${FONT}" font-size="22" font-weight="800" fill="#1a1204">LEVEL UP!   Lv.${up.from}  →  Lv.${up.to}</text>
       <text x="928" y="484" text-anchor="end" font-family="${FONT}" font-size="17" font-weight="700" fill="#1a1204">${up.rankUp ? 'RANK UP  ' + esc(up.prev.tier) + '  →  ' + esc(d.rank.tier) : '+' + up.pts + ' stat point'}</text>`
    : `<rect x="44" y="446" width="912" height="60" rx="18" fill="#ffffff0d" stroke="#ffffff22"/>
       <text x="72" y="482" font-family="${FONT}" font-size="17" font-weight="700" fill="#e5e9ff">HP ${num(d.hp)}/${num(d.maxhp)}      •      MP ${num(d.mp)}/${num(d.maxmp)}</text>
       <text x="928" y="482" text-anchor="end" font-family="${FONT}" font-size="17" font-weight="700" fill="#fbbf24">GOLD ${num(d.gold)}</text>`
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1000" height="540" viewBox="0 0 1000 540">
  <defs>${AN.defs(tone)}<clipPath id="av"><circle cx="190" cy="230" r="88"/></clipPath><filter id="sh"><feGaussianBlur stdDeviation="8"/></filter></defs>
  ${AN.frame(1000, 540, tone, 28)}
  ${AN.brand(64, 66, botPlain(), 26, esc(cut(noEmoji(d.title || ''), 30).toUpperCase()))}
  <text x="944" y="62" text-anchor="end" font-family="${SERIF}" font-size="15" fill="${AN.C.stone}" font-weight="600">${esc(cut(noEmoji(d.footer || ''), 36))}</text>

  <circle cx="190" cy="230" r="100" fill="${rc}" opacity="0.28" filter="url(#sh)"/>
  <circle cx="190" cy="230" r="94" fill="none" stroke="${rc}" stroke-width="5"/>
  <g clip-path="url(#av)"><svg x="102" y="142" width="176" height="176" viewBox="0 0 280 280" preserveAspectRatio="xMidYMid slice">${uri ? `<image href="${uri}" xlink:href="${uri}" width="280" height="280"/>` : silhouette(initial, rc)}</svg></g>
  <rect x="128" y="316" width="124" height="34" rx="17" fill="${rc}"/>
  <text x="190" y="340" text-anchor="middle" font-family="${FONT}" font-size="17" font-weight="800" fill="#0a0e1f">RANK ${esc(d.rank.tier)}</text>
  <text x="190" y="378" text-anchor="middle" font-family="${SERIF}" font-size="${nm.sz}" font-weight="700" fill="#fff">${esc(nm.t)}</text>
  <text x="190" y="404" text-anchor="middle" font-family="${FONT}" font-size="15" font-weight="700" fill="${rc}">LV ${d.level}  •  ${esc(cut(d.rank.name, 18))}</text>
  <text x="190" y="428" text-anchor="middle" font-family="${FONT}" font-size="13" font-weight="600" fill="#9aa4c7">${esc(cut(noEmoji(d.cls || ''), 24))}</text>

  <text x="360" y="148" font-family="${SERIF}" font-size="${hd.sz}" font-weight="700" fill="${tone}">${esc(hd.t)}</text>
  <text x="360" y="182" font-family="${FONT}" font-size="${sub.sz}" font-weight="600" fill="#b9c2e8">${esc(sub.t)}</text>
  ${chipSvg}
  ${logBar}${log}
  ${barSvg(360, 404, 596, 14, d.need ? d.exp / d.need : 0, '#fbbf24', '#f472b6', 'be')}
  <text x="360" y="398" font-family="${FONT}" font-size="12" font-weight="700" fill="#9aa4c7" letter-spacing="2">EXP</text>
  <text x="956" y="398" text-anchor="end" font-family="${FONT}" font-size="12" font-weight="700" fill="#fff">${num(d.exp)} / ${num(d.need)}</text>
  ${strip}
</svg>`
  return sharp(Buffer.from(svg)).png().toBuffer()
}

// d: { name, level, members, max, leader, treasury, power, wins, next(upgrade cost), rankPos }
async function clanCard(d) {
  const col = '#fbbf24'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="480" viewBox="0 0 900 480">
  <defs>${AN.defs(col)}</defs>
  ${AN.frame(900, 480, col, 26)}
  ${AN.brand(62, 62, botPlain(), 22, 'CLAN GUILD HALL')}
  <polygon points="140,92 220,138 220,224 140,270 60,224 60,138" fill="${col}"/>
  <polygon points="140,108 206,146 206,216 140,254 74,216 74,146" fill="#2b1a0c"/>
  <text x="140" y="212" text-anchor="middle" font-family="${FONT}" font-size="80" font-weight="800" fill="${col}">${esc(d.name.charAt(0).toUpperCase())}</text>
  ${(() => { const f = fit(d.name, 430, 46, 24); return `<text x="270" y="140" font-family="${SERIF}" font-size="${f.sz}" font-weight="700" fill="#fff">${esc(f.t)}</text>` })()}
  <text x="270" y="176" font-family="${FONT}" font-size="20" font-weight="600" fill="#e7c98a">Leader: ${esc(cut(d.leader, 22))}</text>
  <g><rect x="740" y="108" width="120" height="40" rx="20" fill="#ffffff10" stroke="${col}" stroke-width="2"/><text x="800" y="136" text-anchor="middle" font-family="${FONT}" font-size="22" font-weight="800" fill="${col}">LV ${d.level}</text></g>
  ${d.rankPos ? `<text x="860" y="176" text-anchor="end" font-family="${FONT}" font-size="20" font-weight="700" fill="#e7c98a">Peringkat #${d.rankPos}</text>` : ''}
  ${chip(270, 206, 180, 'MEMBER', `${d.members}/${d.max}`, col)}
  ${chip(466, 206, 180, 'TOTAL POWER', num(d.power), '#c084fc')}
  ${chip(662, 206, 198, 'KAS CLAN', num(d.treasury) + ' G', '#fbbf24')}
  ${chip(270, 276, 180, 'CLAN WAR', `${d.wins} menang`, '#f87171')}
  ${chip(466, 276, 394, 'UPGRADE BERIKUTNYA', d.level >= 10 ? 'MAX LEVEL' : num(d.next) + ' G kas', '#38bdf8')}
  <rect x="40" y="370" width="820" height="70" rx="18" fill="#ffffff0d" stroke="#ffffff22"/>
  <text x="64" y="400" font-family="${FONT}" font-size="15" font-weight="700" fill="${col}">BONUS CLAN</text>
  <text x="64" y="426" font-family="${FONT}" font-size="18" font-weight="600" fill="#fff">+${d.level * 2}% EXP  •  +${d.level}% Gold  •  Kapasitas ${d.max} member</text>
  </svg>`
  return sharp(Buffer.from(svg)).png().toBuffer()
}


const wrapText = (t, n) => { const w = String(t || '').split(' '), out = []; let l = ''; for (const x of w) { if ((l + ' ' + x).trim().length > n) { out.push(l.trim()); l = x } else l = l + ' ' + x } if (l.trim()) out.push(l.trim()); return out.slice(0, 3) }
const HEART = 'M12 21s-7-4.5-9-9c-1.5-3.5 1-7 4.5-7 2 0 3.5 1 4.5 2.5C13 6 14.5 5 16.5 5 20 5 22.5 8.5 21 12c-2 4.5-9 9-9 9z'

// d: { name, title, group, color, desc, idx, levelName, pts, next, likes[], service, perk, maxIdx }
async function npcCard(d) {
  const c = d.color, initials = d.name.replace(/^(Bu|Bang|Madam|Kak)\s+/i, '').slice(0, 1)
  const pct = d.next ? Math.min(1, (d.pts - d.prevMin) / (d.next - d.prevMin)) : 1
  const hearts = Array.from({ length: d.maxIdx }, (_, i) => `<g transform="translate(${360 + i * 44},232) scale(1.5)"><path d="${HEART}" fill="${i < d.idx ? c : 'none'}" stroke="${c}" stroke-width="1.6" opacity="${i < d.idx ? 1 : 0.5}"/></g>`).join('')
  const desc = wrapText(d.desc, 52).map((l, i) => `<text x="360" y="${150 + i * 24}" font-family="${FONT}" font-size="17" font-weight="500" fill="#c7cff0">${esc(l)}</text>`).join('')
  const likes = (d.likes || []).slice(0, 4).map((l, i) => `<g><rect x="${360 + i * 126}" y="334" width="120" height="34" rx="17" fill="${c}22" stroke="${c}66"/><text x="${360 + i * 126 + 60}" y="356" text-anchor="middle" font-family="${FONT}" font-size="13" font-weight="700" fill="#fff">${esc(cut(l, 14))}</text></g>`).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="470" viewBox="0 0 900 470">
  <defs>${AN.defs(c)}<filter id="bl"><feGaussianBlur stdDeviation="9"/></filter></defs>
  ${AN.frame(900, 470, c, 26)}
  ${AN.brand(62, 62, botPlain(), 20, d.group === 'kota' ? 'NPC KOTA GUILD' : d.group === 'harian' ? 'NPC KEHIDUPAN SEHARI-HARI' : 'NPC')}
  <circle cx="190" cy="236" r="130" fill="${c}" opacity="0.3" filter="url(#bl)"/>
  <circle cx="190" cy="236" r="116" fill="#141a35" stroke="${c}" stroke-width="6"/>
  <circle cx="190" cy="236" r="100" fill="${c}" opacity="0.18"/>
  <text x="190" y="262" text-anchor="middle" font-family="${FONT}" font-size="76" font-weight="800" fill="${c}">${esc(initials.toUpperCase())}</text>
  <text x="360" y="104" font-family="${SERIF}" font-size="46" font-weight="700" fill="#fff">${esc(cut(d.name, 16))}</text>
  <text x="860" y="100" text-anchor="end" font-family="${FONT}" font-size="20" font-weight="700" fill="${c}">${esc(d.title)}</text>
  ${desc}
  <text x="360" y="226" font-family="${FONT}" font-size="14" font-weight="700" fill="#9aa4c7" letter-spacing="2">HUBUNGAN  •  ${esc(d.levelName.toUpperCase())}</text>
  ${hearts}
  ${barSvg(360, 268, 500, 14, pct, c, '#ffffff', 'nb')}
  <text x="860" y="302" text-anchor="end" font-family="${FONT}" font-size="13" font-weight="700" fill="#9aa4c7">${d.pts}${d.next ? ' / ' + d.next : ''} poin</text>
  <text x="360" y="312" font-family="${FONT}" font-size="12" font-weight="700" fill="#9aa4c7" letter-spacing="2" opacity="0"> </text>
  <text x="360" y="326" font-family="${FONT}" font-size="12" font-weight="700" fill="#9aa4c7" letter-spacing="2">SUKA DIBERI</text>
  <g>${likes}</g>
  ${d.service ? `<rect x="40" y="392" width="820" height="52" rx="16" fill="#ffffff0d" stroke="${c}66"/><text x="62" y="415" font-family="${FONT}" font-size="12" font-weight="700" fill="${c}" letter-spacing="2">LAYANAN</text><text x="62" y="435" font-family="${FONT}" font-size="15" font-weight="600" fill="#fff">${esc(cut(d.service, 62))}</text>` : `<text x="40" y="430" font-family="${FONT}" font-size="15" font-weight="600" fill="#9aa4c7">Ngobrol: .talk &lt;pesan&gt;   •   Hadiah: .gift ${esc(d.id || '')} &lt;item&gt;</text>`}
  </svg>`
  return sharp(Buffer.from(svg)).png().toBuffer()
}

module.exports = { profileCard, clanCard, npcCard, resultCard, fit, noEmoji }
