/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */
/*
✦ CHISA AI — by SHIPUR
*/

const { extractMessageContent, jidNormalizedUser, proto, delay, getContentType, areJidsSameUser, generateWAMessage } = require("./baileys")
const chalk = require('chalk')
const J = require('./jid')
const fs = require('fs')
const Crypto = require('crypto')
const axios = require('axios')
const moment = require('moment-timezone')
const { sizeFormatter } = require('human-readable')
const util = require('util')
const { read, MIME_JPEG } = require('jimp')

const unixTimestampSeconds = (date = new Date()) => Math.floor(date.getTime() / 1000)
exports.unixTimestampSeconds = unixTimestampSeconds

exports.generateMessageTag = (epoch) => {
  let tag = unixTimestampSeconds().toString()
  if (epoch) tag += '.--' + epoch
  return tag
}

exports.processTime = (timestamp, now) => {
  return moment.duration(now - moment(timestamp * 1000)).asSeconds()
}

exports.getRandom = (ext) => `${Math.floor(Math.random() * 10000)}${ext}`

exports.getBuffer = async (url, options = {}) => {
  try {
    const res = await axios({
      method: "get",
      url,
      headers: { 'DNT': 1, 'Upgrade-Insecure-Request': 1 },
      ...options,
      responseType: 'arraybuffer'
    })
    return res.data
  } catch (err) {
    return err
  }
}

exports.fetchJson = async (url, options = {}) => {
  try {
    const res = await axios({ method: 'GET', url, ...options })
    return res.data
  } catch (err) {
    return err
  }
}

exports.runtime = (seconds) => {
  seconds = Number(seconds)
  let d = Math.floor(seconds / (3600 * 24))
  let h = Math.floor(seconds % (3600 * 24) / 3600)
  let m = Math.floor(seconds % 3600 / 60)
  let s = Math.floor(seconds % 60)
  return `${d ? d + "d " : ""}${h ? h + "h " : ""}${m ? m + "m " : ""}${s ? s + "s" : ""}`
}

exports.formatp = sizeFormatter({
  std: 'JEDEC',
  decimalPlaces: 2,
  keepTrailingZeroes: false,
  render: (literal, symbol) => `${literal} ${symbol}B`,
})

exports.parseMention = (text = '') =>
  [...text.matchAll(/@([0-9]{5,16})/g)].map(v => v[1] + '@s.whatsapp.net')

exports.getGroupAdmins = (participants = []) =>
  participants.filter(p => p.admin).map(p => p.id)


exports.sleep = async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

exports.isUrl = (url) => {
    return url.match(new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/, 'gi'))
}

exports.getTime = (format, date) => {
  if (date) {
    return moment(date).locale('id').format(format)
  } else {
    return moment.tz('Asia/Jakarta').locale('id').format(format)
  }
}

exports.tanggal = (numer) => {
	myMonths = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
	myDays = ['Minggu','Senin','Selasa','Rabu','Kamis','Jum’at','Sabtu']; 
	var tgl = new Date(numer);
	var day = tgl.getDate()
	bulan = tgl.getMonth()
	var thisDay = tgl.getDay(),
	thisDay = myDays[thisDay];
	var yy = tgl.getYear()
	var year = (yy < 1000) ? yy + 1900 : yy; 
	const time = moment.tz('Asia/Jakarta').format('DD/MM HH:mm:ss')
	let d = new Date
	let locale = 'id'
	let gmt = new Date(0).getTime() - new Date('1 January 1970').getTime()
	let weton = ['Pahing', 'Pon','Wage','Kliwon','Legi'][Math.floor(((d * 1) + gmt) / 84600000) % 5]
	return`${thisDay}, ${day} - ${myMonths[bulan]} - ${year}`
}

// ========================= SERIALIZE MESSAGE =========================
exports.smsg = (Yuukey, m, store) => {
  if (!m) return m
  let M = proto.WebMessageInfo

  // 🔥 SAFE decodeJid
  const decode = (jid) =>
    Yuukey.decodeJid?.(jid) || jidNormalizedUser(jid || '')

  if (m.key) {
    m.id = m.key.id
    m.chat = m.key.remoteJid
    m.fromMe = m.key.fromMe
    m.isGroup = m.chat.endsWith('@g.us')
    // pengirim SELALU dinormalkan ke nomor telepon (LID -> 628xxx@s.whatsapp.net) bila nomornya diketahui
    m.sender = J.toPn(decode(
      m.fromMe
        ? Yuukey.user?.id
        : m.key.participant || m.chat
    ))
    if (m.isGroup) m.participant = J.toPn(decode(m.key.participant))
  }

  if (m.message) {
    m.mtype = getContentType(m.message)
    m.msg = m.message[m.mtype]
    m.text =
      m.msg?.text ||
      m.msg?.caption ||
      m.message.conversation ||
      ''

    // mention (@orang) juga dinormalkan ke nomor telepon supaya cocok dengan database & daftar admin
    if (m.msg?.contextInfo?.mentionedJid?.length) m.msg.contextInfo.mentionedJid = m.msg.contextInfo.mentionedJid.map(j => J.toPn(decode(j)))
    m.mentionedJid = m.msg?.contextInfo?.mentionedJid || []

    let quoted = m.msg?.contextInfo?.quotedMessage
    if (quoted) {
      let type = getContentType(quoted)
      let qn = quoted[type]
      // reply ke teks biasa: isinya STRING (conversation) → bungkus jadi objek, kalau tidak sender/key tidak bisa dipasang
      if (qn === null || typeof qn !== 'object') qn = { text: qn == null ? '' : String(qn), conversation: qn == null ? '' : String(qn) }
      m.quoted = qn
      m.quoted.mtype = type
      const qpart = m.msg.contextInfo.participant || m.msg.contextInfo.remoteJid || ''
      m.quoted.key = {
        remoteJid: m.chat,
        fromMe: (() => { const qp = J.strip(qpart); return J.botIds(Yuukey).includes(qp) || J.toPn(qp) === J.toPn(decode(Yuukey.user?.id)) })(),
        id: m.msg.contextInfo.stanzaId,
        participant: decode(qpart)
      }
      // chat pribadi: contextInfo.participant bisa kosong → pengirim yang di-reply = lawan bicara
      m.quoted.sender = J.toPn(decode(qpart || (m.isGroup ? '' : m.chat)))
      m.quoted.text =
        m.quoted.text ||
        m.quoted.caption ||
        m.quoted.conversation ||
        ''
    }
  }

  m.reply = (text, chatId = m.chat, options = {}) =>
    Yuukey.sendMessage(chatId, { text }, { quoted: m, ...options })

  return m
}
// ====================================================================

