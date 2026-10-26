/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
// Pengaturan PER GRUP (lib/database/grupset.json), dipakai antilink, filter, mute, slowmode, welcome, jadwal, banchat.
//   const GG = require('./grupdb');  GG.get(chat)  -> objek pengaturan grup (dibuat otomatis)  |  GG.save()
// Bidang: antilink 'off'|'on'|'kick' • antitoxic bool • filter[] • mute[] • slow (detik) • off (bot hanya admin) • ban (diblokir owner)
//         welcome/goodbye bool|undefined • welcomeText/goodbyeText • jadwal {open,close,last}
const DB = require('./jsondb')('grupset')
const get = (chat) => (DB.data[chat] = DB.data[chat] || {})
const all = () => DB.data
const save = () => DB.save()
module.exports = { get, all, save }
