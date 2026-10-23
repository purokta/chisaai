// ============================================================
//  TEMPLATE PERINTAH BARU
//  1. Salin file ini jadi commands/namafitur.js  (nama file TIDAK boleh diawali "_")
//  2. Ubah isinya, simpan
//  3. Ketik #reload di WhatsApp (atau restart bot). Menu ikut terupdate otomatis.
//
//  Satu file boleh berisi banyak perintah: ganti "module.exports = {...}" dengan "module.exports = [ {...}, {...} ]"
// ============================================================
module.exports = {
  name: 'contoh', //          nama perintah, dipanggil dengan #contoh
  aliases: ['coba'], //       nama lain (opsional)
  category: 'Lainnya', //     kelompok di menu: Stiker / Downloader / AI / Lainnya / Owner (atau buat baru)
  usage: '<teks>', //         petunjuk argumen di menu (opsional)
  desc: 'Contoh perintah', // keterangan singkat di menu
  // ownerOnly: true,        // hanya owner
  // groupOnly: true,        // hanya di grup
  // hidden: true,           // sembunyikan dari menu

  async run(ctx) {
    // Yang tersedia di ctx:
    //   ctx.query            teks setelah perintah (atau teks pesan yang di-reply)
    //   ctx.args             teks setelah perintah, dipecah per kata
    //   ctx.prefix           prefix yang dipakai (# ! ? / $)
    //   ctx.isOwner / ctx.isGroup / ctx.sender / ctx.jid / ctx.pushName
    //   ctx.reply('teks')                     balas pesan
    //   ctx.send({ image: buffer, caption })  kirim gambar / video / stiker / audio
    //   ctx.react('✅')                        kasih reaksi emoji
    //   ctx.mediaTarget()                     media di pesan ini / pesan yang di-reply
    //   ctx.download(node, type)              unduh media jadi Buffer
    //   ctx.sock                              akses penuh ke Baileys
    //   ctx.db.get('kunci', default) / ctx.db.set('kunci', nilai)   simpan data kecil
    await ctx.reply(`Halo ${ctx.pushName || 'kak'}! Kamu menulis: ${ctx.query || '(kosong)'}`)
  }
}
