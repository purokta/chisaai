const http = require('../lib/http')

const WMO = {
  0: 'Cerah ☀️', 1: 'Cerah berawan 🌤️', 2: 'Berawan ⛅', 3: 'Mendung ☁️', 45: 'Berkabut 🌫️', 48: 'Berkabut 🌫️',
  51: 'Gerimis 🌦️', 53: 'Gerimis 🌦️', 55: 'Gerimis lebat 🌦️', 61: 'Hujan ringan 🌧️', 63: 'Hujan 🌧️', 65: 'Hujan lebat 🌧️',
  80: 'Hujan lokal 🌦️', 81: 'Hujan lokal 🌧️', 82: 'Hujan deras ⛈️', 95: 'Badai petir ⛈️', 96: 'Badai petir ⛈️', 99: 'Badai petir ⛈️'
}

const ZONES = {
  jakarta: 'Asia/Jakarta', wib: 'Asia/Jakarta', makassar: 'Asia/Makassar', wita: 'Asia/Makassar', jayapura: 'Asia/Jayapura', wit: 'Asia/Jayapura',
  tokyo: 'Asia/Tokyo', seoul: 'Asia/Seoul', beijing: 'Asia/Shanghai', singapore: 'Asia/Singapore', kualalumpur: 'Asia/Kuala_Lumpur',
  bangkok: 'Asia/Bangkok', dubai: 'Asia/Dubai', mekkah: 'Asia/Riyadh', makkah: 'Asia/Riyadh', london: 'Europe/London', paris: 'Europe/Paris',
  berlin: 'Europe/Berlin', moscow: 'Europe/Moscow', newyork: 'America/New_York', losangeles: 'America/Los_Angeles', sydney: 'Australia/Sydney', utc: 'UTC'
}

module.exports = [
  {
    name: 'cuaca',
    aliases: ['weather'],
    category: 'Info',
    usage: '<kota>',
    desc: 'Cuaca saat ini',
    async run(ctx) {
      if (!ctx.query) return ctx.reply(`Contoh: ${ctx.prefix}cuaca Bandung`)
      const g = await http.getJson(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(ctx.query)}&count=1&language=id`
      )
      const p = g.results?.[0]
      if (!p) return ctx.reply('Kota tidak ditemukan.')
      const w = await http.getJson(
        `https://api.open-meteo.com/v1/forecast?latitude=${p.latitude}&longitude=${p.longitude}` +
          `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`
      )
      const c = w.current
      await ctx.reply(
        `🌤️ *${p.name}${p.admin1 ? ', ' + p.admin1 : ''}* (${p.country || ''})\n\n` +
          `${WMO[c.weather_code] || 'Cuaca ' + c.weather_code}\n` +
          `🌡️ ${c.temperature_2m}°C (terasa ${c.apparent_temperature}°C)\n` +
          `💧 Kelembapan ${c.relative_humidity_2m}%\n💨 Angin ${c.wind_speed_10m} km/j`
      )
    }
  },
  {
    name: 'kurs',
    aliases: ['convert'],
    category: 'Info',
    usage: '<jumlah> <dari> <ke>',
    desc: 'Kurs mata uang (mis. kurs 10 usd idr)',
    async run(ctx) {
      const [a, from = 'usd', to = 'idr'] = ctx.args
      const amount = Number(String(a || '1').replace(',', '.'))
      if (!amount) return ctx.reply(`Contoh: ${ctx.prefix}kurs 10 usd idr`)
      const r = await http.getJson('https://open.er-api.com/v6/latest/' + from.toUpperCase())
      const rate = r.rates?.[to.toUpperCase()]
      if (!rate) return ctx.reply('Kode mata uang tidak dikenal (contoh: usd, idr, eur, jpy).')
      const fmt = n => n.toLocaleString('id-ID', { maximumFractionDigits: 2 })
      await ctx.reply(`💱 ${fmt(amount)} ${from.toUpperCase()} = *${fmt(amount * rate)} ${to.toUpperCase()}*`)
    }
  },
  {
    name: 'gempa',
    category: 'Info',
    desc: 'Gempa terbaru (BMKG)',
    async run(ctx) {
      const r = (await http.getJson('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json')).Infogempa?.gempa
      if (!r) return ctx.reply('Data gempa tidak tersedia.')
      await ctx.reply(
        `🌋 *GEMPA TERBARU*\n\n🕒 ${r.Tanggal}, ${r.Jam}\n📏 Magnitudo ${r.Magnitude}\n🌊 Kedalaman ${r.Kedalaman}\n` +
          `📍 ${r.Wilayah}\n${r.Potensi ? '⚠️ ' + r.Potensi : ''}\n\nSumber: BMKG`
      )
    }
  },
  {
    name: 'jam',
    aliases: ['waktu'],
    category: 'Info',
    usage: '<kota>',
    desc: 'Jam di kota lain (tokyo, london, ...)',
    async run(ctx) {
      const key = ctx.query.toLowerCase().replace(/\s+/g, '')
      const tz = ZONES[key] || (/^[A-Za-z_]+\/[A-Za-z_]+$/.test(ctx.query) ? ctx.query : null)
      if (!tz) return ctx.reply(`Contoh: ${ctx.prefix}jam tokyo\nKota: ${Object.keys(ZONES).join(', ')}\nAtau nama zona, mis. Asia/Tokyo`)
      try {
        const t = new Intl.DateTimeFormat('id-ID', { timeZone: tz, dateStyle: 'full', timeStyle: 'short' }).format(new Date())
        await ctx.reply(`🕒 *${tz}*\n${t}`)
      } catch {
        await ctx.reply('Zona waktu tidak valid.')
      }
    }
  },
  {
    name: 'wiki',
    aliases: ['wikipedia'],
    category: 'Info',
    usage: '<topik>',
    desc: 'Ringkasan Wikipedia',
    async run(ctx) {
      if (!ctx.query) return ctx.reply(`Contoh: ${ctx.prefix}wiki Candi Borobudur`)
      const s = await http.getJson(
        `https://id.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(ctx.query)}&limit=1&format=json`
      )
      const title = s?.[1]?.[0]
      if (!title) return ctx.reply('Tidak ditemukan di Wikipedia.')
      const r = await http.getJson('https://id.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(title))
      await ctx.reply(`📚 *${r.title}*\n\n${r.extract}\n\n${r.content_urls?.mobile?.page || ''}`)
    }
  }
]
