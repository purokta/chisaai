/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// .namagen [jenis] [jumlah] — pembuat nama acak: fantasi, elf, kurcaci, orc, naga, kerajaan, planet, tim, brand
const pick = (a) => a[Math.floor(Math.random() * a.length)]
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)
const join = (parts) => cap(parts.join('').replace(/(.)\1{2,}/g, '$1$1'))
const mk = (pre, mid, suf, midChance = 0.4) => () => join([pick(pre), Math.random() < midChance ? pick(mid) : '', pick(suf)])

const GEN = {
  fantasi: mk(['ar', 'bel', 'cal', 'dor', 'el', 'fen', 'gal', 'hal', 'is', 'kor', 'lun', 'mor', 'nar', 'or', 'ral', 'sil', 'thal', 'vor', 'zan'], ['a', 'e', 'i', 'o', 'u', 'ar', 'en', 'ir'], ['dor', 'wen', 'iel', 'ion', 'thas', 'ra', 'mir', 'ulf', 'dis', 'nor', 'vyn']),
  elf: mk(['ae', 'el', 'fae', 'gal', 'il', 'lor', 'mel', 'nim', 'sil', 'thran', 'yl'], ['a', 'e', 'i', 'o', 'ia', 'ae', 'ni'], ['iel', 'wen', 'dor', 'las', 'riel', 'ndil', 'thil', 'anar', 'ia']),
  kurcaci: mk(['bor', 'dur', 'gim', 'thor', 'bal', 'dwal', 'khaz', 'mor', 'bru', 'gar'], ['in', 'ak', 'un', 'ok'], ['rin', 'din', 'grim', 'bur', 'dok', 'gan', 'bek', 'ron'], 0.3),
  orc: mk(['gor', 'ug', 'mog', 'krag', 'shak', 'zug', 'grak', 'urg', 'dur'], ['', 'ak', 'ug', 'ar'], ['gash', 'thar', 'bog', 'zul', 'mak', 'nak', 'rok', 'dush'], 0.3),
  naga: () => `${pick(['Vy', 'Ky', 'Zy', 'Ae', 'Dra', 'Nyx', 'Sy', 'Ty'])}${pick(['rax', 'thos', 'gorn', 'lith', 'zar', 'nyx', 'vorath', 'ndrel', 'xion'])} ${pick(['si Pembakar Langit', 'Sang Penjaga Abu', 'Sang Pelahap Bintang', 'si Sisik Petir', 'Sang Badai Kuno', 'Raja Jurang', 'Sang Bayangan Api'])}`,
  kerajaan: () => `${pick(['Kerajaan', 'Kekaisaran', 'Kesultanan', 'Republik', 'Dinasti', 'Persekutuan'])} ${pick(['Aurelia', 'Valdoria', 'Nusantara Timur', 'Kharzan', 'Eldoria', 'Sriwijaya Baru', 'Mirathen', 'Solvaris', 'Tarkana', 'Lumeria', 'Dravenia'])}`,
  planet: () => `${pick(['Kep', 'Zor', 'Xan', 'Nov', 'Tra', 'Qua', 'Vel', 'Hyd', 'Ar', 'Lyr'])}${pick(['ler', 'mos', 'dia', 'tune', 'ion', 'ara', 'thos', 'gea'])}-${Math.floor(Math.random() * 900 + 10)}${pick(['b', 'c', 'd', 'e', ''])}`,
  tim: () => `${pick(['Elang', 'Naga', 'Serigala', 'Garuda', 'Harimau', 'Badai', 'Bayangan', 'Phoenix', 'Titan', 'Kobra', 'Rajawali', 'Spartan'])} ${pick(['Hitam', 'Perak', 'Api', 'Malam', 'Baja', 'Petir', 'Merah', 'Langit', 'Liar', 'Abadi', 'Utama', 'Esport'])}`,
  brand: () => `${pick(['Nova', 'Lumi', 'Zeno', 'Kira', 'Vita', 'Orbi', 'Mira', 'Aero', 'Pixa', 'Solu', 'Qora', 'Tera'])}${pick(['ly', 'ra', 'x', 'ify', 'vo', 'ta', 'ora', 'io', 'nix', 'ko'])}`,
}
const ALIAS = { fantasy: 'fantasi', dwarf: 'kurcaci', dragon: 'naga', kingdom: 'kerajaan', negara: 'kerajaan', team: 'tim', clan: 'tim', merek: 'brand', usaha: 'brand' }

module.exports = {
  name: 'namagen', alias: ['namafantasi', 'buatnama'], category: 'kreasi', cmds: ['namagen'],
  desc: 'Pembuat nama acak: fantasi, elf, kurcaci, orc, naga, kerajaan, planet, tim, brand',
  run: async ({ reply, args, prefix }) => {
    const first = String(args[0] || '').toLowerCase(), kind = GEN[ALIAS[first] || first] ? (ALIAS[first] || first) : null
    if (!kind) return reply(`📜 *PEMBUAT NAMA*\n\n> Jenis: ${Object.keys(GEN).join(', ')}\n\n*Contoh:* ${prefix}namagen elf\n*Banyak:* ${prefix}namagen tim 10`)
    const n = Math.min(15, Math.max(1, parseInt(args[1]) || 8)), seen = new Set()
    for (let i = 0; i < n * 6 && seen.size < n; i++) seen.add(GEN[kind]())
    reply(`📜 *NAMA ${kind.toUpperCase()}*\n\n${[...seen].map((x, i) => `${i + 1}. ${x}`).join('\n')}\n\n_Ketik ulang ${prefix}namagen ${kind} untuk nama lain._`)
  },
}
