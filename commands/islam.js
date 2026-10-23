const http = require('../lib/http')

module.exports = [
  {
    name: 'sholat',
    aliases: ['jadwalsholat', 'salat'],
    category: 'Islami',
    usage: '<kota>',
    desc: 'Jadwal sholat hari ini',
    async run(ctx) {
      const city = ctx.query || ctx.config.prayer.city
      const r = await http.getJson(
        `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(ctx.config.prayer.country)}&method=20`
      )
      const t = r.data?.timings
      if (!t) return ctx.reply('Kota tidak ditemukan.')
      await ctx.reply(
        `🕌 *JADWAL SHOLAT — ${city.toUpperCase()}*\n${r.data.date?.readable || ''}\n\n` +
          `Imsak   : ${t.Imsak}\nSubuh   : ${t.Fajr}\nTerbit  : ${t.Sunrise}\nDzuhur  : ${t.Dhuhr}\nAshar   : ${t.Asr}\nMaghrib : ${t.Maghrib}\nIsya    : ${t.Isha}`
      )
    }
  },
  {
    name: 'quran',
    aliases: ['alquran', 'ayat'],
    category: 'Islami',
    usage: '<surat> <ayat>',
    desc: 'Ayat Al-Qur\'an (mis. quran 2 255)',
    async run(ctx) {
      const m = ctx.query.match(/^(\d{1,3})\s*[: ]\s*(\d{1,3})$/)
      if (!m) return ctx.reply(`Pakai nomor surat dan ayat.\nContoh: ${ctx.prefix}quran 2 255  (Al-Baqarah ayat 255)`)
      const r = await http.getJson(`https://api.alquran.cloud/v1/ayah/${m[1]}:${m[2]}/editions/quran-uthmani,id.indonesian`)
      const [ar, id] = r.data || []
      if (!ar) return ctx.reply('Ayat tidak ditemukan.')
      await ctx.reply(`📖 *${ar.surah.englishName} (${ar.surah.name}) : ${ar.numberInSurah}*\n\n${ar.text}\n\n_${id?.text || ''}_`)
    }
  }
]
