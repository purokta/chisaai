// Mode Chisa memakai balasan WhatsApp biasa. (Paket asli memalsukan kutipan dari akun "WhatsApp Business"
// berverifikasi; itu sengaja tidak dibawa.) Modul ini dipertahankan sebagai pass-through supaya plugin tetap jalan.
const quoteOf = q => q
const contextInfo = () => ({})
const fakeQuoted = () => null
const apply = o => o
module.exports = { quoteOf, BIZ_JID: '', contextInfo, fakeQuoted, apply, enabled: () => false }
