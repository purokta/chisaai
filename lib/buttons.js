// Pesan interaktif (tombol "Pilih kategori" di bawah pesan) memakai native flow WhatsApp.
// Catatan: WhatsApp tidak selalu menampilkan tombol dari bot non-resmi. Kalau tidak muncul, pakai #menustyle teks.
const baileys = require('./baileys')

async function sendSelectMenu(sock, jid, { image, body, footer, buttonTitle, sectionTitle, rows, quickReplies = [] }, quoted) {
  const B = await baileys.loadBaileys()
  const { generateWAMessageFromContent, prepareWAMessageMedia, proto } = B
  if (!generateWAMessageFromContent || !prepareWAMessageMedia || !proto) throw new Error('Baileys tidak mendukung pesan interaktif')

  const header = { title: '', subtitle: '', hasMediaAttachment: false }
  if (image) {
    const media = await prepareWAMessageMedia({ image }, { upload: sock.waUploadToServer })
    Object.assign(header, { hasMediaAttachment: true, imageMessage: media.imageMessage })
  }

  const msg = generateWAMessageFromContent(
    jid,
    {
      viewOnceMessage: {
        message: {
          messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
          interactiveMessage: proto.Message.InteractiveMessage.create({
            header: proto.Message.InteractiveMessage.Header.create(header),
            body: proto.Message.InteractiveMessage.Body.create({ text: body }),
            footer: proto.Message.InteractiveMessage.Footer.create({ text: footer || '' }),
            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
              buttons: [
                {
                  name: 'single_select',
                  buttonParamsJson: JSON.stringify({ title: buttonTitle, sections: [{ title: sectionTitle, rows }] })
                },
                ...quickReplies.map(q => ({
                  name: 'quick_reply',
                  buttonParamsJson: JSON.stringify({ display_text: q.text, id: q.id })
                }))
              ]
            })
          })
        }
      }
    },
    { quoted, userJid: sock.user?.id }
  )

  await sock.relayMessage(jid, msg.message, {
    messageId: msg.key.id,
    additionalNodes: [
      {
        tag: 'biz',
        attrs: {},
        content: [
          {
            tag: 'interactive',
            attrs: { type: 'native_flow', v: '1' },
            content: [{ tag: 'native_flow', attrs: { v: '9', name: 'mixed' } }]
          }
        ]
      }
    ]
  })
  return msg
}

module.exports = { sendSelectMenu }
