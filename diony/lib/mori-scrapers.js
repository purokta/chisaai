/*
 * DIONYSUSMD | © Pix
 * Informasi bot dan konfigurasi: config.js
 */

// Ported/adapted from Mori's downloader scrapers for Dionysus (Node.js).
// Mori's UI, Capacitor and local storage are intentionally not included.
// Updated to Mori v4.5.1 multi-source scrapers:
//   TikTok (tikdownloader.io + tiktokio), YouTube (convert1s/ytmp3.gg + ytmp3.mobi),
//   Instagram (indown.net + snapsave), Twitter/X (savetwt + twittervideodownloader),
//   Spotify (short-link resolve + spotidown), Reddit (RapidSave), TeraBox (Sechno).
//   Other platforms already matched Mori endpoints.
const axios = require('axios')
const cheerio = require('cheerio')
const crypto = require('crypto')
const CHROME_UA = 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36'
const CHROME_DESKTOP_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
const CapacitorHttp = {
  async request(o = {}) {
    const r = await axios.request({ url: o.url, method: o.method || 'GET', data: o.data, headers: o.headers || {}, timeout: o.connectTimeout ? o.connectTimeout * 1000 : 35000, maxRedirects: 8, validateStatus: () => true })
    return { data: r.data, headers: r.headers || {}, url: (r.request && r.request.res && r.request.res.responseUrl) || o.url, status: r.status }
  },
  async get(o = {}) { return this.request({ ...o, method: 'GET' }) },
  async post(o = {}) { return this.request({ ...o, method: 'POST' }) }
}
function getCookiesFromHeaders(headers = {}) {
  const raw = headers['Set-Cookie'] || headers['set-cookie'] || ''
  if (!raw) return ''
  if (Array.isArray(raw)) return raw.map(c => c.split(';')[0]).join('; ')
  return String(raw).split(',').map(c => c.trim().split(';')[0]).join('; ')
}
function serializeData(obj) { return Object.keys(obj).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(obj[k])).join('&') }
function decodeSnapSave(data) {
  try {
    const regex = /eval\(function\(h,u,n,t,e,r\)\{.*?\}\("(.*?)",(\d+),"(.*?)",(\d+),(\d+),(\d+)\)\)/
    const match = String(data).match(regex)
    if (match) {
      const h=match[1], n=match[3], t=parseInt(match[4]), e=parseInt(match[5]), delimiter=n[e], parts=h.split(delimiter)
      let decoded=''
      for (const p of parts) { if (!p) continue; let val=0; for(let j=0;j<p.length;j++) val += n.indexOf(p[j])*Math.pow(e,p.length-1-j); decoded += String.fromCharCode(val-t) }
      return decodeURIComponent(escape(decoded))
    }
    return data
  } catch { return data }
}
function extractFinalUrl(input) {
  if (!input) return null
  let raw=String(input).trim().replace(/^["'\\]+|["'\\]+$/g,''), isRender=false
  if (raw.includes('get_progressApi')) { isRender=true; const m=raw.match(/token=([^&'"]+)/); if(m) raw=m[1] }
  if (raw.includes('.') && !raw.startsWith('http')) { try { const part=raw.split('.')[1]; if(part) { const p=JSON.parse(Buffer.from(part,'base64').toString()); if(p.video_url) return {url:p.video_url,isRender:true}; if(p.url) return {url:p.url,isRender:false} } } catch {} }
  if(raw.startsWith('//')) return {url:'https:'+raw,isRender}
  if(raw.startsWith('/')) return {url:'https://snapsave.app'+raw,isRender}
  return {url:raw,isRender}
}
class DOMParser {
  parseFromString(html) {
    const $ = cheerio.load(String(html || ''))
    const wrap = (el) => {
      if (!el || !el.length) return null
      return {
        get textContent() { return el.text() },
        get innerHTML() { return el.html() || '' },
        get href() { return el.attr('href') },
        get src() { return el.attr('src') },
        get className() { return el.attr('class') || '' },
        get id() { return el.attr('id') || '' },
        get value() { return el.attr('value') || '' },
        getAttribute(name) { return el.attr(name) ?? null },
        querySelector(sel) { return wrap(el.find(sel).first()) },
        querySelectorAll(sel) { return el.find(sel).toArray().map(node => wrap($(node))).filter(Boolean) },
      }
    }
    return {
      querySelector(sel) { return wrap($(sel).first()) },
      querySelectorAll(sel) { return $(sel).toArray().map(node => wrap($(node))).filter(Boolean) }
    }
  }
}
global.DOMParser = global.DOMParser || DOMParser
global.crypto = global.crypto || crypto.webcrypto
if (!global.atob) global.atob = s => Buffer.from(s, 'base64').toString('binary')

const moriNoStorage = { getItem() { return null }, setItem() {} }

// Helper to extract clean URL from pasted text (which may contain share text, comments, etc.)
function getCleanUrl(text) {
  if (!text || typeof text !== "string") return "";
  const match = text.match(/https?:\/\/[^\s]+/);
  let clean = match ? match[0] : text.trim();
  // Ensure it has a protocol
  if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
    clean = "https://" + clean;
  }
  return clean;
}

async function sha256(message) {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function scrapeRedNote(url) {
  try {
    let cleanUrl = getCleanUrl(url);

    // Resolve redirection if it's a short URL to get the xsec_token
    if (cleanUrl.includes("xhslink.com")) {
      try {
        const redirectRes = await CapacitorHttp.get({
          url: cleanUrl,
          headers: {
            "User-Agent": CHROME_UA,
          },
        });
        if (redirectRes.url) {
          cleanUrl = redirectRes.url;
        } else {
          const html = redirectRes.data || "";
          const canonicalMatch =
            html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/) ||
            html.match(
              /href="(https?:\/\/(?:www\.)?xiaohongshu\.com\/explore\/[^"]+)"/,
            );
          if (canonicalMatch) {
            cleanUrl = canonicalMatch[1];
          }
        }
      } catch (e) {
        console.error("RedNote redirect resolve failed:", e);
      }
    }

    const timestamp = Date.now().toString();
    const secret = "3HT8hjE79L";
    const signStr = "en" + timestamp + secret + "url=" + cleanUrl;
    const sign = await sha256(signStr);

    const res = await CapacitorHttp.post({
      url: "https://api.seekin.ai/ikool/media/download",
      data: { url: cleanUrl },
      headers: {
        "Content-Type": "application/json",
        lang: "en",
        timestamp: timestamp,
        sign: sign,
      },
    });

    const responseData =
      typeof res.data === "string" ? JSON.parse(res.data) : res.data;
    if (!responseData || responseData.code !== "0000" || !responseData.data) {
      throw new Error(responseData?.msg || "Failed to process RedNote URL.");
    }

    const info = responseData.data;
    const title = info.title || "RedNote_Media";
    const thumbnail = info.imageUrl || null;
    const downloads = [];

    if (info.medias && info.medias.length > 0) {
      for (const item of info.medias) {
        downloads.push({
          url: item.url,
          type: "VIDEO",
          quality: item.format || "HD",
        });
      }
    } else if (info.images && info.images.length > 0) {
      for (const item of info.images) {
        downloads.push({
          url: item.url || item,
          type: "IMAGE",
          quality: "HD",
        });
      }
    }

    if (downloads.length === 0) throw new Error("No media found on this URL.");
    return {
      status: true,
      result: { title, thumbnail, downloads, sourceUrl: url },
    };
  } catch (e) {
    return { status: false, message: e.message };
  }
}

async function scrapeDouyin(url) {
  try {
    if (!url || typeof url !== "string") throw new Error("Invalid URL.");
    const clean = getCleanUrl(url);

    // Fetch Douyin page
    const mobileUA =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1";
    const pageRes = await CapacitorHttp.get({
      url: clean,
      headers: {
        "User-Agent": mobileUA,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
      },
    });

    const html = typeof pageRes.data === "string" ? pageRes.data : "";
    const marker = "window._ROUTER_DATA =";
    const startIdx = html.indexOf(marker);
    if (startIdx === -1) throw new Error("Could not find video data in page.");

    const slice = html.substring(startIdx + marker.length).trim();
    // Balance braces to extract JSON
    let braceCount = 0,
      inStr = false,
      strChar = null,
      escape = false,
      endIdx = -1;
    for (let i = 0; i < slice.length; i++) {
      const c = slice[i];
      if (escape) {
        escape = false;
        continue;
      }
      if (c === "\\") {
        escape = true;
        continue;
      }
      if (inStr) {
        if (c === strChar) inStr = false;
        continue;
      }
      if (c === '"' || c === "'") {
        inStr = true;
        strChar = c;
        continue;
      }
      if (c === "{") braceCount++;
      else if (c === "}") {
        braceCount--;
        if (braceCount === 0) {
          endIdx = i + 1;
          break;
        }
      }
    }
    if (endIdx === -1) throw new Error("Could not parse router data.");

    const routerData = JSON.parse(slice.substring(0, endIdx));
    const loaderData = routerData.loaderData || {};
    let videoInfoRes = null;
    for (const key in loaderData) {
      if (loaderData[key] && loaderData[key].videoInfoRes) {
        videoInfoRes = loaderData[key].videoInfoRes;
        break;
      }
    }
    if (
      !videoInfoRes ||
      !videoInfoRes.item_list ||
      videoInfoRes.item_list.length === 0
    )
      throw new Error("Could not locate video data.");

    const item = videoInfoRes.item_list[0];
    const title = item.desc || "Douyin Content";
    const author = item.author ? item.author.nickname : "Unknown";
    const awemeType = item.aweme_type;

    const downloads = [];

    // Photo slideshow (aweme_type 2)
    if (awemeType === 2 && item.images && item.images.length > 0) {
      item.images.forEach((img) => {
        const url = img.url_list?.[0];
        if (url) {
          const isMirror = downloads.some((d) => d.url === url);
          downloads.push({ type: "PHOTO", url, isMirror });
        }
      });
    } else {
      // Video mode
      const thumbnail =
        item.video && item.video.cover ? item.video.cover.url_list?.[0] : null;

      const watermarkUrl =
        item.video && item.video.play_addr
          ? item.video.play_addr.url_list?.[0]
          : null;
      if (!watermarkUrl) throw new Error("No video URL found.");

      let videoId = null;
      try {
        videoId = new URL(watermarkUrl).searchParams.get("video_id");
      } catch (e) {}
      if (!videoId) {
        const m = watermarkUrl.match(/video_id=([^&]+)/);
        if (m) videoId = m[1];
      }
      const noWatermarkUrl = videoId
        ? `https://aweme.snssdk.com/aweme/v1/play/?video_id=${videoId}`
        : watermarkUrl;

      downloads.push(
        { type: "VIDEO", url: noWatermarkUrl, isMirror: false },
        { type: "VIDEO_WM", url: watermarkUrl, isMirror: true },
      );
    }

    if (downloads.length === 0) {
      throw new Error("No downloadable media found.");
    }

    return {
      status: true,
      result: {
        title,
        author,
        thumbnail: item.video?.cover?.url_list?.[0] || (item.images?.[0]?.url_list?.[0]) || null,
        downloads,
        sourceUrl: url,
      },
    };
  } catch (e) {
    return { status: false, message: e.message };
  }
}

async function scrapeBilibili(url) {
  try {
    let cleanUrl = getCleanUrl(url);

    // Resolve redirection if it's a short URL (b23.tv)
    if (cleanUrl.includes("b23.tv")) {
      try {
        const redirectRes = await CapacitorHttp.get({
          url: cleanUrl,
          headers: {
            "User-Agent": CHROME_UA,
          },
        });
        if (redirectRes.url) {
          cleanUrl = redirectRes.url;
        }
      } catch (e) {
        console.error("Bilibili redirect resolve failed:", e);
      }
    }

    if (cleanUrl.includes("bilibili.tv")) {
      // Clean tracking parameters to keep a clean destination URL
      try {
        const u = new URL(cleanUrl);
        cleanUrl = u.origin + u.pathname;
      } catch (e) {}

      try {
        // Parse bilibili.tv path to extract video (aid) or anime (ep_id)
        const urlObj = new URL(cleanUrl);
        const parts = urlObj.pathname.split("/").filter(Boolean);

        let apiInfo = null;
        let title = "Bilibili.tv Video";
        let thumbnail = null;

        const idxVideo = parts.indexOf("video");
        if (idxVideo !== -1) {
          const aid = parts[idxVideo + 1];
          if (aid && /^\d+$/.test(aid)) {
            apiInfo = { tipo: "video", id: aid };
          }
        }

        const idxPlay = parts.indexOf("play");
        if (idxPlay !== -1) {
          const numericParts = parts
            .slice(idxPlay + 1)
            .filter((p) => /^\d+$/.test(p));
          if (numericParts.length > 1) {
            apiInfo = { tipo: "anime", id: numericParts[1] };
          } else if (numericParts.length === 1) {
            // Season-only URL, need to resolve default episode ID from HTML first
            apiInfo = { tipo: "anime", id: null, seasonId: numericParts[0] };
          }
        }

        if (!apiInfo) {
          throw new Error("Could not parse Bilibili.tv video or episode ID.");
        }

        let html = "";
        try {
          const pageRes = await CapacitorHttp.get({
            url: cleanUrl,
            headers: {
              "User-Agent": CHROME_UA,
            },
          });
          html = pageRes.data || "";
          const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
          if (titleMatch) title = titleMatch[1].trim();

          const imageMatch =
            html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i) ||
            html.match(/<meta\s+name="twitter:image"\s+content="([^"]+)"/i);
          if (imageMatch) thumbnail = imageMatch[1];
        } catch (err) {
          console.error("Failed to fetch Bilibili.tv page metadata:", err);
        }

        // If we don't have the episode ID yet (season-only URL), resolve it from HTML
        if (apiInfo.tipo === "anime" && !apiInfo.id) {
          let defaultEpId = null;
          try {
            const match = html.match(
              /window\.__initialState\s*=\s*([\s\S]*?)<\/script>/,
            );
            if (match) {
              let scriptText = match[1].trim();
              if (scriptText.endsWith(";")) {
                scriptText = scriptText.substring(0, scriptText.length - 1);
              }
              const fn = new Function(`
                var window = {};
                window.__initialState = ${scriptText};
                return window.__initialState;
              `);
              const state = fn();
              if (state) {
                defaultEpId =
                  state.ogv?.season?.first_episode?.episode_id ||
                  state.ogv?.sectionsList?.[0]?.episodes?.[0]?.episode_id;
              }
            }
          } catch (err) {
            console.error("Failed to parse Bilibili.tv season page HTML:", err);
          }
          apiInfo.id = defaultEpId || apiInfo.seasonId;
        }

        let urlApi;
        if (apiInfo.tipo === "anime") {
          urlApi = `https://api.bilibili.tv/intl/gateway/web/playurl?ep_id=${apiInfo.id}&device=wap&platform=web&qn=64&tf=0&type=0`;
        } else {
          urlApi = `https://api.bilibili.tv/intl/gateway/web/playurl?s_locale=en_US&platform=web&aid=${apiInfo.id}&qn=120`;
        }

        const playRes = await CapacitorHttp.get({
          url: urlApi,
          headers: {
            referer: "https://www.bilibili.tv/",
            "User-Agent": CHROME_UA,
          },
        });

        const playData =
          typeof playRes.data === "string"
            ? JSON.parse(playRes.data)
            : playRes.data;
        if (!playData || !playData.data?.playurl) {
          throw new Error("Failed to retrieve Bilibili.tv stream data.");
        }

        const playurl = playData.data.playurl;
        const downloads = [];

        // Extract video streams — all resolutions
        const videoList = playurl.video || [];
        for (const v of videoList) {
          const resource = v.video_resource || {};
          if (resource.url) {
            const qText =
              v.stream_info?.desc_words || `${v.stream_info?.quality}P` || "HD";
            downloads.push({
              url: resource.url,
              type: "Video",
              quality: qText,
            });
          }
        }

        // Extract audio streams — all bitrates
        const audioList = playurl.audio_resource || [];
        for (const a of audioList) {
          if (a.url) {
            const qText = a.quality
              ? `${Math.floor(a.quality / 1000)}kbps`
              : "High";
            downloads.push({
              url: a.url,
              type: "Audio",
              quality: qText,
            });
          }
        }

        if (downloads.length === 0) {
          throw new Error("No video or audio download streams found.");
        }

        return {
          status: true,
          result: {
            title,
            thumbnail,
            author: "Bilibili.tv Creator",
            downloads,
            sourceUrl: url,
          },
        };
      } catch (err) {
        console.warn(
          "Bilibili.tv native scraper failed, trying seekin.ai fallback:",
          err,
        );
      }
    }

    // Clean tracking parameters to keep a clean destination URL
    try {
      const u = new URL(cleanUrl);
      cleanUrl = u.origin + u.pathname;
    } catch (e) {}

    const timestamp = Date.now().toString();
    const secret = "3HT8hjE79L";
    const signStr = "en" + timestamp + secret + "url=" + cleanUrl;
    const sign = await sha256(signStr);

    const res = await CapacitorHttp.post({
      url: "https://api.seekin.ai/ikool/media/download",
      data: { url: cleanUrl },
      headers: {
        "Content-Type": "application/json",
        lang: "en",
        timestamp: timestamp,
        sign: sign,
      },
    });

    const responseData =
      typeof res.data === "string" ? JSON.parse(res.data) : res.data;
    if (!responseData || responseData.code !== "0000" || !responseData.data) {
      throw new Error(responseData?.msg || "Failed to process Bilibili URL.");
    }

    const info = responseData.data;
    const title = info.title || "Bilibili Video";
    const thumbnail = info.imageUrl || null;
    const downloads = [];

    if (info.medias && info.medias.length > 0) {
      for (let i = 0; i < info.medias.length; i++) {
        const item = info.medias[i];
        downloads.push({
          url: item.url,
          type: "VIDEO",
          quality: item.format || `Part ${i + 1}`,
        });
      }
    }

    if (downloads.length === 0) throw new Error("No video URLs found.");

    return {
      status: true,
      result: {
        title,
        thumbnail,
        author: "Bilibili Creator",
        downloads,
        sourceUrl: url,
      },
    };
  } catch (e) {
    return { status: false, message: e.message };
  }
}

async function scrapeThreads(url) {
  try {
    const mainRes = await CapacitorHttp.get({
      url: "https://threadster.app/",
      headers: { "User-Agent": CHROME_UA },
    });
    const cookies = mainRes.headers["set-cookie"] || "";

    const dlRes = await CapacitorHttp.post({
      url: "https://threadster.app/download",
      data: { url },
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": CHROME_UA,
        Cookie: cookies,
      },
    });

    const parser = new DOMParser();
    const doc = parser.parseFromString(dlRes.data, "text/html");
    const downloads = [];
    doc.querySelectorAll("a").forEach((a) => {
      const href = a.getAttribute("href");
      if (href && (href.includes("token=") || href.includes("acxcdn.com"))) {
        let finalUrl = href;
        let type = "VIDEO";
        try {
          const urlObj = new URL(href);
          const token = urlObj.searchParams.get("token");
          if (token) {
            const payloadPart = token.split(".")[1];
            if (payloadPart) {
              const payload = JSON.parse(atob(payloadPart));
              if (payload.url) {
                finalUrl = payload.url;
                const lowerUrl = finalUrl.toLowerCase();
                if (
                  lowerUrl.includes(".jpg") ||
                  lowerUrl.includes(".jpeg") ||
                  lowerUrl.includes(".png") ||
                  lowerUrl.includes(".webp")
                ) {
                  type = "IMAGE";
                }
              }
            }
          }
        } catch (e) {}
        downloads.push({ type, url: finalUrl });
      }
    });

    if (downloads.length === 0) throw new Error("No download links found.");
    return { status: true, result: { title: "Threads Media", downloads } };
  } catch (e) {
    return { status: false, message: e.message };
  }
}

// TikTok — multi-source (Mori v4.5.1): tikdownloader.io → tiktokio
async function scrapeTikTok(url) {
  let currentStatus = null
  try {
    let cleanUrl = getCleanUrl(url).split('?')[0]
    // Resolve short / shop links
    if (cleanUrl.includes('tt.site') || /tiktok\.com\/t\//i.test(cleanUrl)) {
      try {
        const r = await CapacitorHttp.get({ url: cleanUrl, headers: { 'User-Agent': CHROME_UA } })
        const loc = (r.headers && (r.headers.location || r.headers.Location)) || r.url || ''
        if (loc && (loc.includes('ec/mall') || loc.includes('cart_item'))) {
          throw new Error('This link points to a TikTok Shop / Mall cart page, not a video or photo post.')
        }
        if (loc && loc.includes('tiktok.com')) cleanUrl = loc.split('?')[0]
      } catch (e) {
        if (e.message && e.message.includes('TikTok Shop')) throw e
      }
    }
    if (/^https?:\/\/(www\.)?tiktok\.com\/?$/i.test(cleanUrl.replace(/\/$/, ''))) {
      throw new Error('This link does not point to a TikTok video or photo post.')
    }

    const authorMatch = cleanUrl.match(/@([^\/]+)/)
    const author = authorMatch ? authorMatch[1] : 'Unknown'
    let lastErr = null

    // ── Source 1: tikdownloader.io (Mori v4.5.1 primary) ──
    try {
      const res = await CapacitorHttp.post({
        url: 'https://tikdownloader.io/api/ajaxSearch',
        data: `q=${encodeURIComponent(cleanUrl)}&vt=id`,
        headers: {
          'User-Agent': CHROME_UA,
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'X-Requested-With': 'XMLHttpRequest',
          Origin: 'https://tikdownloader.io',
          Referer: 'https://tikdownloader.io/id',
        },
      })
      currentStatus = res.status
      let data = res.data
      if (typeof data === 'string') {
        if (data.trim().startsWith('<')) throw new Error('TikDownloader returned HTML (blocked).')
        try { data = JSON.parse(data) } catch { throw new Error('TikDownloader invalid JSON.') }
      }
      if (!data || data.status !== 'ok' || !data.data) throw new Error(data?.mess || 'TikDownloader failed.')
      const html = String(data.data)
      let title = 'TikTok Content'
      const tM = html.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i) || html.match(/class="[^"]*title[^"]*"[^>]*>([\s\S]*?)</i)
      if (tM) title = tM[1].replace(/<[^>]+>/g, '').trim()
      let thumbnail = ''
      const thM = html.match(/<img[^>]+src=["']([^"']+)["']/i)
      if (thM) thumbnail = thM[1].replace(/&#38;/g, '&')
      const downloads = []
      const aRe = /<a[\s\S]*?<\/a>/gi
      let m
      while ((m = aRe.exec(html)) !== null) {
        const tag = m[0]
        const hrefM = tag.match(/href=["']([^"']+)/i)
        if (!hrefM || hrefM[1] === '#') continue
        const href = hrefM[1].replace(/&#38;/g, '&')
        if (!href.startsWith('http')) continue
        const txt = tag.replace(/<[^>]+>/g, '').trim().toLowerCase()
        let type = null
        if (/without\s*watermark|no\s*watermark|unduh\s*video|download\s*video|mp4/i.test(txt) || tag.includes('btn-primary') || tag.includes('download-btn-green') || tag.includes('download-btn-blue')) type = 'VIDEO'
        else if (/mp3|music|audio|musik/i.test(txt) || tag.includes('download-btn-purple')) type = 'MP3'
        else if (/photo|image|gambar|slide/i.test(txt)) type = 'PHOTO'
        if (type && !downloads.some(d => d.url === href)) downloads.push({ type, url: href, isMirror: downloads.some(d => d.type === type) })
      }
      // photo grid fallback
      if (downloads.filter(d => d.type === 'PHOTO').length === 0 && /image-item|images-grid/i.test(html)) {
        const imgRe = /<img[^>]+src=["'](https?:\/\/[^"']+)["']/gi
        let im
        while ((im = imgRe.exec(html)) !== null) {
          const u = im[1].replace(/&#38;/g, '&')
          if (!downloads.some(d => d.url === u)) downloads.push({ type: 'PHOTO', url: u, isMirror: false })
        }
      }
      if (downloads.length) {
        return { status: true, result: { title, author, thumbnail, downloads, sourceUrl: url } }
      }
      throw new Error('No download links from TikDownloader.')
    } catch (e) {
      lastErr = e
    }

    // ── Source 2: tiktokio (fallback) ──
    try {
      const res = await CapacitorHttp.post({
        url: 'https://tiktokio.com/api/v1/tk/html',
        data: { vid: cleanUrl, prefix: 'tiktokio.com' },
        headers: {
          'User-Agent': CHROME_UA,
          'Content-Type': 'application/json',
          Origin: 'https://tiktokio.com',
          Referer: 'https://tiktokio.com/',
        },
      })
      currentStatus = res.status
      let html = res.data
      if (typeof html === 'object' && html !== null) html = JSON.stringify(html)
      if (typeof html !== 'string') html = ''
      if (!html || html.includes('Please paste a valid link') || html.includes('Error')) {
        throw new Error('tiktokio failed.')
      }
      let title = 'TikTok Content'
      const titleMatch = html.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i)
      if (titleMatch) title = titleMatch[1].replace(/<[^>]+>/g, '').trim()
      let thumbnail = ''
      const thumbMatch = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i)
      if (thumbMatch) thumbnail = thumbMatch[1].replace(/&#38;/g, '&')
      const isSlideshow = html.includes('class="images-grid"') || html.includes('class="image-item"')
      const downloads = []
      if (isSlideshow) {
        const slidesRegex = /<div[^>]*class=["'][^"']*image-item[^"']*["'][^>]*>[\s\S]*?<\/div>/gi
        let slideMatch
        while ((slideMatch = slidesRegex.exec(html)) !== null) {
          const slideHtml = slideMatch[0]
          const aHref = slideHtml.match(/href=["']([^"']+)/i)
          if (aHref && aHref[1] !== '#') {
            const u = aHref[1].replace(/&#38;/g, '&')
            if (!downloads.some(d => d.url === u)) downloads.push({ type: 'PHOTO', url: u, isMirror: false })
          } else {
            const imgSrc = slideHtml.match(/src=["']([^"']+)/i)
            if (imgSrc) {
              const u = imgSrc[1].replace(/&#38;/g, '&')
              if (!downloads.some(d => d.url === u)) downloads.push({ type: 'PHOTO', url: u, isMirror: false })
            }
          }
        }
        const mp3TagRegex = /<a[\s\S]*?<\/a>/gi
        let mp3Match
        while ((mp3Match = mp3TagRegex.exec(html)) !== null) {
          const tag = mp3Match[0]
          if (tag.includes('download-btn-purple') || /mp3|music/i.test(tag)) {
            const h = tag.match(/href=["']([^"']+)/i)
            if (h && h[1] !== '#') {
              const u = h[1].replace(/&#38;/g, '&')
              if (!downloads.some(d => d.url === u)) downloads.push({ type: 'MP3', url: u, isMirror: false })
            }
          }
        }
      } else {
        const anchorTagRegex = /<a[\s\S]*?<\/a>/gi
        let anchorMatch
        while ((anchorMatch = anchorTagRegex.exec(html)) !== null) {
          const tag = anchorMatch[0]
          if (!tag.includes('download-btn')) continue
          const hrefM = tag.match(/href=["']([^"']+)/i)
          if (!hrefM || hrefM[1] === '#') continue
          const href = hrefM[1].replace(/&#38;/g, '&')
          const innerText = tag.replace(/<[^>]+>/g, '').trim().toLowerCase()
          let label = null
          if (innerText.includes('without watermark') || tag.includes('download-btn-blue') || tag.includes('download-btn-green')) label = 'VIDEO'
          else if (innerText.includes('mp3') || innerText.includes('music') || tag.includes('download-btn-purple')) label = 'MP3'
          if (label) downloads.push({ type: label, url: href, isMirror: downloads.some(d => d.type === label) })
        }
      }
      if (downloads.length) {
        return { status: true, result: { title, author, thumbnail, downloads, sourceUrl: url } }
      }
      throw new Error('No download links from tiktokio.')
    } catch (e) {
      lastErr = e
    }

    throw lastErr || new Error('All TikTok sources failed.')
  } catch (err) {
    return { status: false, message: err.message, statusCode: currentStatus }
  }
}

// Instagram — multi-source (Mori v4.5.1): indown.net ajax → snapsave
async function scrapeInstagram(url) {
  let currentStatus = null
  try {
    const cleanUrl = getCleanUrl(url).split('?')[0]
    const parser = new DOMParser()
    let lastErr = null

    // ── Source 1: indown.net ajaxSearch (Mori v4.5.1) ──
    try {
      const res = await CapacitorHttp.post({
        url: 'https://indown.net/api/ajaxSearch',
        data: serializeData({ q: cleanUrl, vt: 'reel', t: 'media', lang: 'en', v: 'v2' }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'User-Agent': CHROME_UA,
          'X-Requested-With': 'XMLHttpRequest',
          Origin: 'https://indown.net',
          Referer: 'https://indown.net/',
        },
      })
      currentStatus = res.status
      let data = res.data
      if (typeof data === 'string') {
        try { data = JSON.parse(data) } catch { /* keep string */ }
      }
      const html = (data && data.data) ? String(data.data) : (typeof data === 'string' ? data : '')
      if (!html) throw new Error('indown.net empty')
      const doc = parser.parseFromString(html, 'text/html')
      const downloads = []
      const seen = new Set()
      const add = (href, type) => {
        if (!href || !href.startsWith('http') || seen.has(href)) return
        if (/indown\.net|javascript|ads?/i.test(href)) return
        seen.add(href)
        downloads.push({ type: type || 'VIDEO', url: href })
      }
      doc.querySelectorAll('a').forEach((a) => {
        const href = a.getAttribute('href')
        const text = (a.textContent || '').toUpperCase()
        const type = /PHOTO|IMAGE|JPG|PNG/i.test(text) ? 'IMAGE' : (/MP3|AUDIO/i.test(text) ? 'AUDIO' : 'VIDEO')
        add(href, type)
      })
      doc.querySelectorAll('video[src], video source[src], img[src]').forEach((el) => {
        const src = el.getAttribute('src')
        if (src && src.startsWith('http')) {
          const tag = (el.tagName || '').toLowerCase()
          add(src, tag === 'img' ? 'IMAGE' : 'VIDEO')
        }
      })
      let thumbnail = null
      const vid = doc.querySelector('video')
      if (vid) thumbnail = vid.getAttribute('poster') || vid.getAttribute('src')
      if (!thumbnail) {
        const img = doc.querySelector('img')
        if (img) thumbnail = img.getAttribute('src')
      }
      if (downloads.length) {
        return {
          status: true,
          result: { title: 'Instagram Content', thumbnail, downloads, sourceUrl: url },
        }
      }
      throw new Error('indown.net: no media')
    } catch (e) {
      lastErr = e
    }

    // ── Source 2: snapsave.app (also used by Mori for FB/IG) ──
    try {
      const r1 = await CapacitorHttp.get({
        url: 'https://snapsave.app/id',
        headers: { 'User-Agent': CHROME_UA },
      })
      currentStatus = r1.status
      const doc1 = parser.parseFromString(String(r1.data || ''), 'text/html')
      const token = doc1.querySelector('input[name="token"]')?.value ||
        (String(r1.data).match(/name=["']token["']\s+value=["']([^"']+)/i) || [])[1]
      const r2 = await CapacitorHttp.post({
        url: 'https://snapsave.app/action.php',
        data: serializeData({ url: cleanUrl, token: token || '', lang: 'id' }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': CHROME_UA,
          Origin: 'https://snapsave.app',
          Referer: 'https://snapsave.app/id',
          'X-Requested-With': 'XMLHttpRequest',
        },
      })
      currentStatus = r2.status
      let html = r2.data
      if (typeof html === 'object' && html !== null) {
        html = html.data || JSON.stringify(html)
      }
      // snapsave sometimes returns encoded payload
      if (typeof html === 'string' && html.includes('get_progressApi')) {
        try {
          const decoded = decodeSnapSave(html)
          if (decoded) html = decoded
        } catch (_) {}
      }
      const doc2 = parser.parseFromString(String(html || ''), 'text/html')
      const downloads = []
      doc2.querySelectorAll('a').forEach((a) => {
        let href = a.getAttribute('href') || a.getAttribute('data-href')
        if (!href) return
        if (href.startsWith('//')) href = 'https:' + href
        if (!href.startsWith('http')) return
        if (/snapsave|javascript|ads?/i.test(href)) return
        const text = (a.textContent || '').toUpperCase()
        const type = /PHOTO|IMAGE/i.test(text) ? 'IMAGE' : 'VIDEO'
        if (!downloads.some(d => d.url === href)) downloads.push({ type, url: href })
      })
      // extract from rendered tokens
      if (downloads.length === 0 && typeof html === 'string') {
        const extracted = extractFinalUrl(html)
        if (extracted && extracted.url) downloads.push({ type: 'VIDEO', url: extracted.url })
      }
      if (downloads.length) {
        return {
          status: true,
          result: { title: 'Instagram Content', thumbnail: downloads[0].url, downloads, sourceUrl: url },
        }
      }
      throw new Error('snapsave: no media')
    } catch (e) {
      lastErr = e
    }

    throw lastErr || new Error('Media links not found. Post might be private or invalid.')
  } catch (err) {
    return { status: false, message: err.message, statusCode: currentStatus }
  }
}

// YouTube — multi-source (Mori v4.5.1): media.ytmp3.gg / convert1s → ytmp3.mobi
async function scrapeYouTube(url) {
  let currentStatus = null
  try {
    const videoId = url.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i,
    )?.[1]
    if (!videoId) throw new Error('Invalid YouTube URL')

    let title = 'YouTube Video'
    let thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
    try {
      const oRes = await CapacitorHttp.get({
        url: `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      })
      if (oRes.data) {
        title = oRes.data.title || title
        thumbnail = oRes.data.thumbnail_url || thumbnail
      }
    } catch (_) {}

    const downloads = []
    let lastErr = null

    // ── Source 1: media.ytmp3.gg / hub.convert1s.com (Mori v4.5.1) ──
    try {
      const headers = {
        Origin: 'https://media.ytmp3.gg',
        Referer: 'https://media.ytmp3.gg/',
        'User-Agent': CHROME_DESKTOP_UA,
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
      }
      const tryConvert = async (type, format, quality) => {
        const res = await CapacitorHttp.post({
          url: 'https://hub.convert1s.com/api/download',
          data: {
            url: `https://www.youtube.com/watch?v=${videoId}`,
            os: 'macos',
            output: { type: type === 'mp4' ? 'video' : 'audio', format, quality },
            audio: { bitrate: '128k' },
          },
          headers,
        })
        currentStatus = res.status
        let data = res.data
        if (typeof data === 'string') {
          if (data.trim().startsWith('<')) return null
          try { data = JSON.parse(data) } catch { return null }
        }
        if (!data) return null
        // Possible response shapes
        const link = data.downloadUrl || data.url || data.link || data.file || (data.data && (data.data.url || data.data.downloadUrl))
        if (link && String(link).startsWith('http')) return String(link)
        return null
      }
      const [mp4, mp3] = await Promise.all([
        tryConvert('mp4', 'mp4', '720').catch(() => null),
        tryConvert('mp3', 'mp3', '128').catch(() => null),
      ])
      if (mp4) downloads.push({ type: 'MP4 VIDEO', url: mp4 })
      if (mp3) downloads.push({ type: 'MP3 AUDIO', url: mp3 })
      if (downloads.length) {
        return { status: true, result: { title, thumbnail, downloads, sourceUrl: url } }
      }
      throw new Error('convert1s returned no links')
    } catch (e) {
      lastErr = e
    }

    // ── Source 2: ytmp3.mobi (fallback, same as previous) ──
    try {
      const headers = {
        Origin: 'https://ytmp3.mobi',
        Referer: 'https://ytmp3.mobi/en8/',
        'User-Agent': CHROME_UA,
      }
      const fetchLink = async (format) => {
        const r1 = await CapacitorHttp.get({
          url: `https://a.ymcdn.org/api/v1/init?p=y&23=1llum1n471&_=${Math.random()}`,
          headers,
        })
        if (!r1.data || r1.data.error) return null
        const r2 = await CapacitorHttp.get({
          url: `${r1.data.convertURL}&v=${videoId}&f=${format}`,
          headers,
        })
        if (!r2.data || r2.data.error) return null
        let progress = 0
        let dlUrl = r2.data.downloadURL
        const progUrl = r2.data.progressURL
        let attempts = 0
        while (progress < 3 && attempts < 15) {
          await new Promise((r) => setTimeout(r, 2000))
          const r3 = await CapacitorHttp.get({ url: progUrl, headers })
          if (!r3.data || r3.data.error) break
          progress = r3.data.progress
          if (r3.data.downloadURL) dlUrl = r3.data.downloadURL
          if (progress === 4) break
          attempts++
        }
        if (dlUrl && dlUrl.startsWith('//')) dlUrl = 'https:' + dlUrl
        if (dlUrl && dlUrl.startsWith('/')) dlUrl = 'https://ytmp3.mobi' + dlUrl
        return dlUrl
      }
      const [mp4Url, mp3Url] = await Promise.all([fetchLink('mp4'), fetchLink('mp3')])
      if (mp4Url) downloads.push({ type: 'MP4 VIDEO', url: mp4Url })
      if (mp3Url) downloads.push({ type: 'MP3 AUDIO', url: mp3Url })
      if (downloads.length) {
        return { status: true, result: { title, thumbnail, downloads, sourceUrl: url } }
      }
      throw new Error('ytmp3.mobi returned no links')
    } catch (e) {
      lastErr = e
    }

    throw lastErr || new Error('Failed to get YouTube download links. Try again.')
  } catch (err) {
    return { status: false, message: err.message, statusCode: currentStatus }
  }
}

// Twitter / X — multi-source (Mori v4.5.1): savetwt → twittervideodownloader
async function scrapeTwitter(url) {
  let currentStatus = null
  try {
    const cleanUrl = getCleanUrl(url)
      .replace(/https:\/\/(fixupx|fxtwitter|vxtwitter|nitter|twitter)\.com/gi, 'https://x.com')
      .split('?')[0]
    const parser = new DOMParser()
    let lastErr = null

    // ── Source 1: savetwt.com ──
    try {
      const r1 = await CapacitorHttp.get({
        url: 'https://savetwt.com/',
        headers: {
          'User-Agent': CHROME_UA,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      })
      currentStatus = r1.status
      const doc1 = parser.parseFromString(String(r1.data || ''), 'text/html')
      const token =
        doc1.querySelector('input[name="_token"]')?.value ||
        doc1.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ||
        (String(r1.data).match(/name=["']_token["']\s+value=["']([^"']+)/i) || [])[1]
      const cookies = getCookiesFromHeaders(r1.headers)
      const r2 = await CapacitorHttp.post({
        url: 'https://savetwt.com/download',
        data: serializeData({ url: cleanUrl, ...(token ? { _token: token } : {}) }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': CHROME_UA,
          Origin: 'https://savetwt.com',
          Referer: 'https://savetwt.com/',
          Cookie: cookies,
        },
      })
      currentStatus = r2.status
      const doc2 = parser.parseFromString(String(r2.data || ''), 'text/html')
      const downloads = []
      doc2.querySelectorAll('a').forEach((a) => {
        let href = a.getAttribute('href')
        if (!href || !href.startsWith('http')) return
        if (/savetwt\.com|javascript|premium|login/i.test(href)) return
        const text = (a.textContent || '').trim().toLowerCase()
        let type = 'VIDEO'
        if (/image|photo|jpg|png/i.test(text) || /\.(jpe?g|png|webp)/i.test(href)) type = 'IMAGE'
        else if (/mp3|audio/i.test(text)) type = 'AUDIO'
        else if (/hd|1080|720|video|download|mp4/i.test(text) || /\.mp4/i.test(href)) type = text.includes('hd') || text.includes('1080') ? 'HD VIDEO' : 'VIDEO'
        if (!downloads.some(d => d.url === href)) {
          downloads.push({ type, url: href, isMirror: downloads.some(d => d.type === type) })
        }
      })
      // Also check video/source tags
      doc2.querySelectorAll('video source, video').forEach((el) => {
        const src = el.getAttribute('src') || el.getAttribute('data-src')
        if (src && src.startsWith('http') && !downloads.some(d => d.url === src)) {
          downloads.push({ type: 'VIDEO', url: src, isMirror: downloads.some(d => d.type === 'VIDEO') })
        }
      })
      if (downloads.length) {
        const titleEl = doc2.querySelector('h1, h2, h3, .title, .username')
        const title = (titleEl && titleEl.textContent.trim()) || 'Twitter / X Content'
        return { status: true, result: { title, thumbnail: null, downloads, sourceUrl: url } }
      }
      throw new Error('savetwt: no links')
    } catch (e) {
      lastErr = e
    }

    // ── Source 2: twittervideodownloader.com ──
    try {
      const twUrl = cleanUrl.replace('https://x.com', 'https://twitter.com')
      const r1 = await CapacitorHttp.get({
        url: 'https://twittervideodownloader.com/',
        headers: { 'User-Agent': CHROME_UA },
      })
      currentStatus = r1.status
      const doc1 = parser.parseFromString(String(r1.data || ''), 'text/html')
      const csrf = doc1.querySelector('input[name="csrfmiddlewaretoken"]')?.value
      const gql = doc1.querySelector('input[name="gql"]')?.value || ''
      const cookies = getCookiesFromHeaders(r1.headers)
      if (!csrf) throw new Error('TVD: CSRF missing')
      const r2 = await CapacitorHttp.post({
        url: 'https://twittervideodownloader.com/download',
        data: serializeData({ tweet: twUrl, csrfmiddlewaretoken: csrf, gql }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': CHROME_UA,
          Origin: 'https://twittervideodownloader.com',
          Referer: 'https://twittervideodownloader.com/',
          Cookie: cookies,
        },
      })
      currentStatus = r2.status
      const doc2 = parser.parseFromString(String(r2.data || ''), 'text/html')
      const downloads = []
      doc2.querySelectorAll('a').forEach((a) => {
        let href = a.getAttribute('href')
        if (!href || !href.startsWith('http')) return
        if (/twittervideodownloader\.com\/?$|javascript/i.test(href)) return
        const text = (a.textContent || '').trim().toLowerCase()
        let type = /image|photo/i.test(text) ? 'IMAGE' : (text.includes('hd') || text.includes('1080') ? 'HD VIDEO' : 'VIDEO')
        if (!downloads.some(d => d.url === href)) downloads.push({ type, url: href, isMirror: downloads.some(d => d.type === type) })
      })
      if (downloads.length) {
        return { status: true, result: { title: 'Twitter / X Content', thumbnail: null, downloads, sourceUrl: url } }
      }
      throw new Error('TVD: no links')
    } catch (e) {
      lastErr = e
    }

    throw lastErr || new Error('Twitter / X links not found.')
  } catch (err) {
    return { status: false, message: err.message, statusCode: currentStatus }
  }
}

// Spotify — Mori v4.5.1 style: resolve short links, then spotidown.app
async function scrapeSpotify(url) {
  let currentStatus = null
  try {
    let trackUrl = getCleanUrl(url)

    // Resolve spotify.com/s/ short links (same as Mori)
    if (/spotify\.com\/s\//i.test(trackUrl)) {
      try {
        const r = await CapacitorHttp.get({
          url: trackUrl,
          headers: { 'User-Agent': 'WhatsApp/2.21.19.21 A' },
        })
        if (r.url && !/spotify\.com\/s\//i.test(r.url)) {
          trackUrl = getCleanUrl(r.url)
        } else if (typeof r.data === 'string') {
          const og = r.data.match(/<meta\s+property="og:url"\s+content="([^"]+)"/i)
          if (og && og[1]) trackUrl = getCleanUrl(og[1])
        }
      } catch (_) {}
    }

    const r1 = await CapacitorHttp.get({
      url: 'https://spotidown.app/',
      headers: { 'User-Agent': CHROME_UA },
    })
    currentStatus = r1.status

    const parser = new DOMParser()
    const doc1 = parser.parseFromString(r1.data, 'text/html')

    const form = doc1.querySelector('form[name="spotifyurl"]')
    const data = { url: trackUrl }
    form?.querySelectorAll('input').forEach((input) => {
      const name = input.getAttribute('name')
      const value = input.getAttribute('value') || ''
      if (name && name !== 'url') data[name] = value
    })

    const r2 = await CapacitorHttp.post({
      url: 'https://spotidown.app/action',
      data: serializeData(data),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': CHROME_UA,
        Origin: 'https://spotidown.app',
        Referer: 'https://spotidown.app/',
      },
    })

    let r2Data = r2.data
    if (typeof r2Data === 'string') {
      try { r2Data = JSON.parse(r2Data) } catch (e) {}
    }
    if (r2Data && r2Data.error) throw new Error(r2Data.message || 'Spotify error')

    let finalHtml = (r2Data && r2Data.data) || r2Data
    const doc2 = parser.parseFromString(String(finalHtml || ''), 'text/html')
    const form2 = doc2.querySelector('form[name="submitspurl"]')

    if (form2) {
      const data2 = {}
      form2.querySelectorAll('input').forEach((input) => {
        const name = input.getAttribute('name')
        const value = input.getAttribute('value') || ''
        if (name) data2[name] = value
      })

      const r3 = await CapacitorHttp.post({
        url: 'https://spotidown.app/action/track',
        data: serializeData(data2),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': CHROME_UA,
          Origin: 'https://spotidown.app',
          Referer: 'https://spotidown.app/',
        },
      })

      let r3Data = r3.data
      if (typeof r3Data === 'string') {
        try { r3Data = JSON.parse(r3Data) } catch (e) {}
      }
      finalHtml = (r3Data && r3Data.data) || r3Data
    }

    const doc3 = parser.parseFromString(String(finalHtml || ''), 'text/html')
    const title = doc3.querySelector('h3')?.textContent?.trim() || 'Spotify Track'
    const artist = doc3.querySelector('p')?.textContent?.trim()
    const thumbnail = doc3.querySelector('img')?.getAttribute('src')
    const downloads = []

    doc3.querySelectorAll('a').forEach((a) => {
      const link = a.getAttribute('href')
      const text = (a.textContent || '').trim()
      if (
        link &&
        link.startsWith('http') &&
        !link.includes('premium.html') &&
        text !== 'Download Another Song'
      ) {
        downloads.push({ type: text || 'MP3', url: link })
      }
    })

    if (downloads.length === 0) throw new Error('No download links found on spotidown.')

    return {
      status: true,
      result: {
        title: artist ? `${artist} - ${title}` : title,
        thumbnail,
        downloads,
        sourceUrl: url,
      },
    }
  } catch (err) {
    return { status: false, message: err.message, statusCode: currentStatus }
  }
}

async function scrapePinterest(url) {
  let currentStatus = null;
  try {
    const r1 = await CapacitorHttp.get({
      url: "https://pindown.io/",
      headers: { "User-Agent": CHROME_UA },
    });
    currentStatus = r1.status;
    const cookies = getCookiesFromHeaders(r1.headers);
    const parser = new DOMParser();
    const doc1 = parser.parseFromString(r1.data, "text/html");

    const tokenInput = doc1.querySelector(
      'input[type="hidden"]:not([name="lang"])',
    );
    const tokenName = tokenInput?.getAttribute("name");
    const tokenValue = tokenInput?.getAttribute("value");

    if (!tokenName || !tokenValue)
      throw new Error("Pinterest token not found.");

    const r2 = await CapacitorHttp.post({
      url: "https://pindown.io/action",
      data: { url, [tokenName]: tokenValue, lang: "en" },
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
        Cookie: cookies,
        "User-Agent": CHROME_UA,
      },
    });
    currentStatus = r2.status;

    let r2Data = r2.data;
    if (typeof r2Data === "string") r2Data = JSON.parse(r2Data);

    const doc2 = parser.parseFromString(r2Data.html, "text/html");
    const downloads = [];
    doc2.querySelectorAll(".columns .column").forEach((el) => {
      const title = el.querySelector(".is-size-6")?.textContent?.trim();
      const dlUrl = el.querySelector(".button")?.getAttribute("href");
      if (dlUrl) downloads.push({ type: title || "DOWNLOAD", url: dlUrl });
    });

    return {
      status: true,
      result: {
        title: doc2.querySelector("h3")?.textContent?.trim() || "Pinterest",
        thumbnail: doc2.querySelector(".image img")?.getAttribute("src"),
        downloads,
        sourceUrl: url,
      },
    };
  } catch (err) {
    return { status: false, message: err.message, statusCode: currentStatus };
  }
}

async function scrapeAppleMusic(url) {
  let currentStatus = null;
  try {
    const headers = {
      "User-Agent": CHROME_UA,
      Accept: "application/json, text/javascript, */*; q=0.01",
      "X-Requested-With": "XMLHttpRequest",
    };

    const r1 = await CapacitorHttp.get({
      url: "https://aplmate.com/",
      headers: { ...headers, Accept: "text/html" },
    });
    currentStatus = r1.status;
    const cookies = getCookiesFromHeaders(r1.headers);

    const r2 = await CapacitorHttp.post({
      url: "https://aplmate.com/action/userverify",
      data: serializeData({ url }),
      headers: {
        ...headers,
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        Cookie: cookies,
      },
    });

    let r2Data = r2.data;
    if (typeof r2Data === "string") r2Data = JSON.parse(r2Data);
    const token = r2Data.success ? r2Data.token : null;
    if (!token) throw new Error(r2Data.message || "Verification failed.");

    const r3 = await CapacitorHttp.post({
      url: "https://aplmate.com/action",
      data: serializeData({ url, "cf-turnstile-response": token }),
      headers: {
        ...headers,
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: cookies,
      },
    });

    let r3Data = r3.data;
    if (typeof r3Data === "string") r3Data = JSON.parse(r3Data);
    if (r3Data.error) throw new Error(r3Data.message || "Action failed.");

    const parser = new DOMParser();
    let finalHtml = r3Data.html;
    const doc2 = parser.parseFromString(finalHtml, "text/html");
    const form2 = doc2.querySelector('form[name="submitapurl"]');

    if (form2) {
      const data2 = {};
      form2.querySelectorAll("input").forEach((input) => {
        const name = input.getAttribute("name");
        const value = input.getAttribute("value") || "";
        if (name) data2[name] = value;
      });

      const r4 = await CapacitorHttp.post({
        url: "https://aplmate.com/action/track",
        data: serializeData(data2),
        headers: {
          ...headers,
          "Content-Type": "application/x-www-form-urlencoded",
          Cookie: cookies,
        },
      });
      let r4Data = r4.data;
      if (typeof r4Data === "string") r4Data = JSON.parse(r4Data);
      finalHtml = r4Data.data || r4Data;
    }

    const doc3 = parser.parseFromString(finalHtml, "text/html");
    const title =
      doc3.querySelector(".hover-underline")?.textContent?.trim() ||
      doc3.querySelector("h3")?.textContent?.trim() ||
      "Apple Music Content";
    const artist = doc3.querySelector("p")?.textContent?.trim();
    const thumbnail = doc3.querySelector("img")?.getAttribute("src");
    const downloads = [];

    doc3.querySelectorAll("a").forEach((a) => {
      const href = a.getAttribute("href");
      const text = a.textContent.trim();
      if (
        href &&
        (href.includes("/dl?token=") || a.classList.contains("abutton"))
      ) {
        if (href.includes("ko-fi.com") || href.includes("premium.html")) return;
        if (text.toLowerCase().includes("another song")) return;
        downloads.push({
          type: text || "MP3",
          url: href.startsWith("http") ? href : "https://aplmate.com" + href,
        });
      }
    });

    return {
      status: true,
      result: {
        title: artist ? `${artist} - ${title}` : title,
        thumbnail,
        downloads,
        sourceUrl: url,
      },
    };
  } catch (err) {
    return { status: false, message: err.message, statusCode: currentStatus };
  }
}

async function scrapeFacebook(url) {
  let currentStatus = null;
  try {
    const headers = {
      "User-Agent": CHROME_UA,
      Origin: "https://snapsave.app",
      Referer: "https://snapsave.app/id",
    };

    const r1 = await CapacitorHttp.get({
      url: "https://snapsave.app/id",
      headers: { ...headers, Accept: "text/html" },
    });
    currentStatus = r1.status;
    const cookies = getCookiesFromHeaders(r1.headers);

    const r2 = await CapacitorHttp.post({
      url: "https://snapsave.app/action.php?lang=id",
      data: serializeData({ url }),
      headers: {
        ...headers,
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: cookies,
      },
    });
    currentStatus = r2.status;

    const decodedHtml = decodeSnapSave(r2.data);
    const parser = new DOMParser();
    const doc = parser.parseFromString(decodedHtml, "text/html");
    const downloads = [];

    doc.querySelectorAll("table tbody tr").forEach((tr) => {
      const qTd = tr.querySelector("td.video-quality");
      const quality = qTd
        ? qTd.textContent.trim()
        : tr.querySelectorAll("td")[0]?.textContent?.trim();
      const btn =
        tr.querySelector("a.btn-download") ||
        tr.querySelector("button") ||
        tr.querySelector("a");
      let linkAttr = btn?.getAttribute("href") || btn?.getAttribute("onclick");

      const extracted = extractFinalUrl(linkAttr);
      if (extracted && extracted.url.startsWith("http")) {
        downloads.push({
          type: quality || "VIDEO",
          url: extracted.url,
          isRender: extracted.isRender,
        });
      }
    });

    if (downloads.length === 0)
      throw new Error("Could not extract download links.");

    const thumbEl =
      doc.querySelector(".video-preview img") ||
      doc.querySelector(".video-preview") ||
      doc.querySelector("img:not([src*='logo'])");
    let thumbnail = thumbEl
      ? thumbEl.getAttribute("src") ||
        thumbEl.style.backgroundImage.replace(/url\(['"]?(.*?)['"]?\)/, "$1")
      : null;
    if (thumbnail && thumbnail.startsWith("/"))
      thumbnail = "https://snapsave.app" + thumbnail;

    return {
      status: true,
      result: { title: "Facebook Media", thumbnail, downloads, sourceUrl: url },
    };
  } catch (err) {
    return { status: false, message: err.message, statusCode: currentStatus };
  }
}

async function scrapeBandcamp(url) {
  let currentStatus = null;
  try {
    const headers = {
      "User-Agent": CHROME_UA,
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    };

    const r1 = await CapacitorHttp.get({
      url: "https://bandcampdownloader.app/",
      headers,
    });
    currentStatus = r1.status;
    const cookies = getCookiesFromHeaders(r1.headers);
    const parser = new DOMParser();
    const doc1 = parser.parseFromString(r1.data, "text/html");

    const csrfInput = doc1.querySelector(
      'form[name="submitbcurl"] input[type="hidden"]',
    );
    const csrfName = csrfInput?.getAttribute("name");
    const csrfValue = csrfInput?.getAttribute("value");

    if (!csrfName || !csrfValue) throw new Error("CSRF token not found.");

    const r2 = await CapacitorHttp.post({
      url: "https://bandcampdownloader.app/action",
      data: serializeData({ url, [csrfName]: csrfValue }),
      headers: {
        ...headers,
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: cookies,
      },
    });
    currentStatus = r2.status;

    let r2Data = r2.data;
    if (typeof r2Data === "string") r2Data = JSON.parse(r2Data);

    if (r2Data.error)
      throw new Error(r2Data.message || "Failed to process URL.");
    if (!r2Data.success || !r2Data.html)
      throw new Error("Unexpected response.");

    const doc2 = parser.parseFromString(r2Data.html, "text/html");
    const trackForms = doc2.querySelectorAll('form[name="submitapurl"]');
    if (trackForms.length === 0) throw new Error("No tracks found.");

    const firstDataB64 =
      trackForms[0].querySelector('input[name="data"]')?.value;
    const firstMeta = JSON.parse(atob(firstDataB64));

    const downloads = [];
    const isAlbum = trackForms.length > 1;

    for (let i = 0; i < trackForms.length; i++) {
      const form = trackForms[i];
      const dataVal = form.querySelector('input[name="data"]')?.value;
      const baseVal = form.querySelector('input[name="base"]')?.value;
      const tokenVal = form.querySelector('input[name="token"]')?.value;
      const meta = JSON.parse(atob(dataVal));

      const r3 = await CapacitorHttp.post({
        url: "https://bandcampdownloader.app/action/track",
        data: serializeData({
          data: dataVal,
          base: baseVal,
          token: tokenVal,
          type: "320",
        }),
        headers: {
          ...headers,
          "Content-Type": "application/x-www-form-urlencoded",
          Cookie: cookies,
        },
      });

      let r3Data = r3.data;
      if (typeof r3Data === "string") r3Data = JSON.parse(r3Data);
      if (r3Data.error) continue;

      const doc3 = parser.parseFromString(r3Data.data, "text/html");
      doc3.querySelectorAll("a.abutton").forEach((a) => {
        const href = a.getAttribute("href");
        const label = a.textContent.trim();
        if (href && href.includes("/dl?token=")) {
          const prefix = isAlbum
            ? `${(i + 1).toString().padStart(2, "0")}. `
            : "";
          downloads.push({
            type: `${prefix}${label}`,
            url: `https://bandcampdownloader.app${href}`,
          });
        }
      });
    }

    if (downloads.length === 0) throw new Error("Download links not found.");

    return {
      status: true,
      result: {
        title: isAlbum ? firstMeta.album || firstMeta.name : firstMeta.name,
        thumbnail: firstMeta.cover,
        downloads,
        sourceUrl: url,
      },
    };
  } catch (err) {
    return { status: false, message: err.message, statusCode: currentStatus };
  }
}

async function scrapePixiv(url) {
  let currentStatus = null;
  try {
    const illustIdMatch =
      url.match(/artworks\/(\d+)/) || url.match(/illust_id=(\d+)/);
    if (!illustIdMatch) throw new Error("Invalid Pixiv URL.");
    const illustId = illustIdMatch[1];

    const res = await CapacitorHttp.get({
      url: `https://www.pixiv.net/ajax/illust/${illustId}?lang=en`,
      headers: {
        "User-Agent": CHROME_UA,
        Referer: "https://www.pixiv.net/",
      },
    });
    currentStatus = res.status;

    let resData = res.data;
    if (typeof resData === "string") {
      try {
        resData = JSON.parse(resData);
      } catch (e) {}
    }

    const data = resData?.body;
    if (resData?.error || !data || !data.urls || !data.urls.original) {
      let maxValid = 1;

      const checkExists = async (page) => {
        try {
          const res = await CapacitorHttp.request({
            url: `https://pixiv.re/${illustId}-${page}.jpg`,
            method: "HEAD",
          });
          return res.status !== 404;
        } catch (e) {
          return false;
        }
      };

      if (await checkExists(1)) {
        let low = 1;
        let high = 200;
        while (low <= high) {
          let mid = Math.floor((low + high) / 2);
          if (await checkExists(mid)) {
            maxValid = mid;
            low = mid + 1;
          } else {
            high = mid - 1;
          }
        }
      }

      const fallbackDownloads = [
        { type: "IMAGE / PAGE 1", url: `https://pixiv.re/${illustId}.jpg` },
      ];
      for (let i = 2; i <= maxValid; i++) {
        fallbackDownloads.push({
          type: `PAGE ${i}`,
          url: `https://pixiv.re/${illustId}-${i}.jpg`,
        });
      }
      let fallbackTitle = "Pixiv Artwork (Restricted / R-18)";
      try {
        const htmlRes = await CapacitorHttp.get({
          url: `https://www.pixiv.net/en/artworks/${illustId}`,
          headers: {
            "User-Agent": CHROME_UA,
            "Accept-Language": "en-US,en;q=0.9",
          },
        });
        if (htmlRes.data && typeof htmlRes.data === "string") {
          const match = htmlRes.data.match(
            /<meta\s+property="twitter:title"\s+content="([^"]+)"/i,
          );
          if (match && match[1]) {
            fallbackTitle = match[1]
              .replace(/&amp;/g, "&")
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'")
              .replace(/&lt;/g, "<")
              .replace(/&gt;/g, ">");
          }
        }
      } catch (e) {
        console.warn("Could not fetch R-18 title", e);
      }

      return {
        status: true,
        result: {
          title: fallbackTitle,
          thumbnail: `https://pixiv.re/${illustId}.jpg`,
          downloads: fallbackDownloads,
          sourceUrl: url,
        },
      };
    }

    const pageCount = data.pageCount || 1;
    const isUgoira = data.illustType === 2;
    const downloads = [];

    if (isUgoira) {
      const ugoRes = await CapacitorHttp.get({
        url: `https://www.pixiv.net/ajax/illust/${illustId}/ugoira_meta?lang=en`,
        headers: {
          "User-Agent": CHROME_UA,
          Referer: "https://www.pixiv.net/",
        },
      });
      let ugoDataRaw = ugoRes.data;
      if (typeof ugoDataRaw === "string") {
        try {
          ugoDataRaw = JSON.parse(ugoDataRaw);
        } catch (e) {}
      }
      const ugoData = ugoDataRaw?.body;
      if (ugoData && ugoData.originalSrc) {
        downloads.push({
          type: "UGOIRA (ZIP)",
          url: ugoData.originalSrc.replace("i.pximg.net", "i.pixiv.re"),
        });
      }
    } else {
      const originalUrl = data.urls.original;
      for (let i = 0; i < pageCount; i++) {
        let type = pageCount > 1 ? `PAGE ${i + 1}` : "IMAGE";
        let pageUrl = originalUrl.replace("_p0", `_p${i}`);
        pageUrl = pageUrl.replace("i.pximg.net", "i.pixiv.re");
        downloads.push({ type, url: pageUrl });
      }
    }

    if (downloads.length === 0) {
      throw new Error("No downloadable media found.");
    }

    const thumb =
      data.urls.regular?.replace("i.pximg.net", "i.pixiv.re") ||
      data.urls.original?.replace("i.pximg.net", "i.pixiv.re");

    return {
      status: true,
      result: {
        title: data.title
          ? `${data.title} by ${data.userName || "Unknown"}`
          : "Pixiv Artwork",
        thumbnail: thumb,
        downloads,
        sourceUrl: url,
      },
    };
  } catch (err) {
    return { status: false, message: err.message, statusCode: currentStatus };
  }
}

// ───────────────────────── Reddit (dari Mori v4.5.1 — RapidSave) ─────────────────────────
async function scrapeReddit(url) {
  let currentStatus = null
  try {
    if (!url || typeof url !== 'string') throw new Error('Invalid URL.')
    const clean = getCleanUrl(url)
    const infoUrl = `https://rapidsave.com/info?url=${encodeURIComponent(clean)}`
    const res = await CapacitorHttp.get({
      url: infoUrl,
      headers: {
        'User-Agent': CHROME_DESKTOP_UA,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        Referer: 'https://rapidsave.com/',
      },
    })
    currentStatus = res.status
    const html = typeof res.data === 'string' ? res.data : ''
    const linkMatch =
      html.match(/class="downloadbutton"[^>]*href="([^"]+)"/i) ||
      html.match(/href="([^"]*sd\.rapidsave\.com\/download\.php[^"]*)"/i) ||
      html.match(/href="([^"]*download\.php\?[^"]*)"/i)
    if (!linkMatch || linkMatch[1].startsWith('/') || linkMatch[1].includes('reddit-downloader-bot')) {
      if (html.includes('alert-info') && html.includes('Reddit is limiting')) {
        throw new Error('Reddit is currently limiting access on RapidSave. Please try again later.')
      }
      throw new Error('Could not extract media download link from RapidSave.')
    }
    let dlUrl = linkMatch[1].replace(/&amp;/g, '&')
    try {
      const u = new URL(dlUrl)
      if (u.hostname.endsWith('reddit.com') && !u.hostname.includes('redd.it')) {
        throw new Error('This post contains an image gallery or text (RapidSave only supports Reddit video downloads).')
      }
    } catch (e) {
      if (e.message && e.message.includes('RapidSave')) throw e
    }

    let title = 'Reddit Media'
    const titleMatch =
      html.match(/class="text-center">([^<]+)<\/p>/i) ||
      html.match(/<h2>([\s\S]*?)<\/h2>/i) ||
      html.match(/<strong>([\s\S]*?)<\/strong>/i)
    if (titleMatch && titleMatch[1].trim()) {
      title = titleMatch[1].trim()
    } else {
      const slug = clean.match(/comments\/[^\/]+\/([^\/\?#]+)/)
      if (slug && slug[1]) title = decodeURIComponent(slug[1].replace(/_/g, ' '))
    }

    let thumbnail = ''
    const thumbMatch =
      html.match(/<video[^>]+poster="([^">]+)"/i) ||
      html.match(/<img[^>]+class="[^"]*thumbnail[^"]*"[^>]+src="([^">]+)"/i) ||
      html.match(/<img[^>]+src="([^">]+)"[^>]+class="[^"]*thumbnail[^"]*"/i) ||
      html.match(/<img[^>]+src="([^">]*thumbs\.rapidsave\.com[^">]*)"/i) ||
      html.match(/<img[^>]+src="([^">]*(?:preview\.redd\.it|external-preview\.redd\.it|i\.redd\.it|thumbs\.redditmedia\.com)[^">]*)"/i) ||
      html.match(/<meta[^>]+property="og:image"[^>]+content="([^">]+)"/i) ||
      html.match(/<meta[^>]+content="([^">]+)"[^>]+property="og:image"/i)
    if (thumbMatch && thumbMatch[1]) {
      let t = thumbMatch[1].replace(/&amp;/g, '&').trim()
      if (t.startsWith('/')) t = 'https://rapidsave.com' + t
      if (!t.includes('logo') && !t.includes('icon') && !t.includes('placeholder')) thumbnail = t
    }
    if (!thumbnail) {
      try {
        const oembed = await CapacitorHttp.get({
          url: `https://www.reddit.com/oembed?url=${encodeURIComponent(clean)}`,
          headers: { 'User-Agent': CHROME_DESKTOP_UA },
        })
        const data = typeof oembed.data === 'string' ? JSON.parse(oembed.data) : oembed.data
        if (data && data.thumbnail_url) thumbnail = data.thumbnail_url
      } catch (_) {}
    }

    let audioUrl = null
    try {
      const a = new URL(dlUrl).searchParams.get('audio_url')
      if (a && a.startsWith('http')) audioUrl = a
    } catch (_) {}

    const isImage = /\.(jpe?g|png|webp|gif)/i.test(dlUrl)
    const downloads = [
      {
        type: isImage ? 'image' : 'video',
        quality: isImage ? 'HD Image' : 'HD Video (with Audio)',
        url: dlUrl,
        thumbnail: thumbnail || '',
      },
    ]
    if (audioUrl) {
      downloads.push({ type: 'audio', quality: 'Audio Track', url: audioUrl, thumbnail: thumbnail || '' })
    }

    return {
      status: true,
      result: {
        title,
        thumbnail,
        type: isImage ? 'image' : 'video',
        downloads,
        sourceUrl: url,
      },
    }
  } catch (err) {
    return { status: false, message: err.message, statusCode: currentStatus }
  }
}

// ───────────────────────── TeraBox (dari Mori v4.5.1 — Sechno API) ─────────────────────────
async function scrapeTeraBox(url) {
  let currentStatus = null
  try {
    if (!url || typeof url !== 'string') throw new Error('Invalid URL.')
    const clean = getCleanUrl(url)
    const res = await CapacitorHttp.post({
      url: 'https://sechno.com/api/terabox',
      data: { url: clean },
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': CHROME_DESKTOP_UA,
        Referer: 'https://sechno.com/tools/terabox-downloader',
      },
    })
    currentStatus = res.status
    const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
    if (!data || !data.success) {
      const errMsg = (data && data.error) || ''
      if (String(errMsg).includes('105')) {
        throw new Error('The TeraBox link is invalid, expired, or deleted (errno 105).')
      }
      throw new Error(errMsg || 'Failed to resolve TeraBox link via Sechno.')
    }
    const files = Array.isArray(data.files) ? data.files : []
    if (files.length === 0) throw new Error('No files found in TeraBox share.')
    const downloadable = files.filter((f) => !f.isDir && (f.downloadUrl || f.streamUrl))
    if (downloadable.length === 0) throw new Error('No downloadable files found in TeraBox share.')

    const downloads = []
    const multi = downloadable.length > 1
    let title = data.title || 'TeraBox Shared Files'

    if (multi) {
      downloadable.forEach((f, i) => {
        const label = `${String(i + 1).padStart(2, '0')}. ${f.filename || `File_${i + 1}`}`
        const thumb =
          f.thumbUrl ||
          f.thumbnail ||
          (f.thumbs && (f.thumbs.url3 || f.thumbs.url2 || f.thumbs.url1)) ||
          (/\.(jpe?g|png|webp|gif)/i.test(f.filename || '') ? f.downloadUrl : '')
        if (f.downloadUrl) {
          downloads.push({
            type: label,
            filename: f.filename,
            size: f.sizeFormatted || (f.size ? `${f.size} B` : ''),
            quality: f.sizeFormatted || 'Direct Download',
            url: f.downloadUrl,
            thumbnail: thumb || '',
          })
        } else if (f.streamUrl) {
          downloads.push({
            type: label,
            filename: f.filename,
            size: f.sizeFormatted || (f.size ? `${f.size} B` : ''),
            quality: 'Stream',
            url: f.streamUrl,
            thumbnail: thumb || '',
          })
        }
      })
    } else {
      const f = downloadable[0]
      if (f.filename) title = f.filename
      const thumb =
        f.thumbUrl ||
        f.thumbnail ||
        (f.thumbs && (f.thumbs.url3 || f.thumbs.url2 || f.thumbs.url1)) ||
        (/\.(jpe?g|png|webp|gif)/i.test(f.filename || '') ? f.downloadUrl : '')
      if (f.downloadUrl) {
        downloads.push({
          type: 'file',
          filename: f.filename,
          size: f.sizeFormatted || (f.size ? `${f.size} B` : ''),
          quality: f.sizeFormatted ? `Direct Download (${f.sizeFormatted})` : 'Direct Download',
          url: f.downloadUrl,
          thumbnail: thumb || '',
        })
      }
      if (f.streamUrl) {
        downloads.push({
          type: 'video',
          filename: f.filename,
          size: f.sizeFormatted || (f.size ? `${f.size} B` : ''),
          quality: 'Fast Stream (m3u8)',
          url: f.streamUrl,
          thumbnail: thumb || '',
        })
      }
    }

    const thumb =
      (downloadable.find((f) => f.thumbUrl || f.thumbnail || (f.thumbs && (f.thumbs.url3 || f.thumbs.url2 || f.thumbs.url1))) || {}).thumbUrl ||
      (downloadable.find((f) => f.thumbnail) || {}).thumbnail ||
      (downloadable.find((f) => /\.(jpe?g|png|webp|gif)/i.test(f.filename || '')) || {}).downloadUrl ||
      ''

    return {
      status: true,
      result: {
        title,
        thumbnail: thumb,
        totalFiles: downloadable.length,
        downloads,
        sourceUrl: url,
      },
    }
  } catch (err) {
    return { status: false, message: err.message, statusCode: currentStatus }
  }
}

// Peta domain -> platform. Urutan sama seperti routing di script.js Mori, ditambah domain pendek
// (pin.it, b23.tv, threads.com, vt.tiktok.com, dll.) agar tautan share tetap terdeteksi.
// Ditambah Reddit & TeraBox dari Mori v4.5.1.
const PLATFORMS = [
  { id: 'tiktok',     label: 'TikTok',        audio: false, fn: () => scrapeTikTok,     hosts: ['tiktok.com'] },
  { id: 'instagram',  label: 'Instagram',     audio: false, fn: () => scrapeInstagram,  hosts: ['instagram.com', 'instagr.am', 'ig.me'] },
  { id: 'youtube',    label: 'YouTube',       audio: false, fn: () => scrapeYouTube,    hosts: ['youtube.com', 'youtu.be', 'youtube-nocookie.com'] },
  { id: 'twitter',    label: 'X / Twitter',   audio: false, fn: () => scrapeTwitter,    hosts: ['twitter.com', 'x.com', 't.co', 'fxtwitter.com', 'vxtwitter.com'] },
  { id: 'spotify',    label: 'Spotify',       audio: true,  fn: () => scrapeSpotify,    hosts: ['spotify.com', 'spotify.link'] },
  { id: 'pinterest',  label: 'Pinterest',     audio: false, single: true, fn: () => scrapePinterest,  hosts: ['pinterest.com', 'pin.it'] },
  { id: 'applemusic', label: 'Apple Music',   audio: true,  fn: () => scrapeAppleMusic, hosts: ['music.apple.com'] },
  { id: 'facebook',   label: 'Facebook',      audio: false, fn: () => scrapeFacebook,   hosts: ['facebook.com', 'fb.watch', 'fb.com', 'fb.me'] },
  { id: 'rednote',    label: 'RedNote',       audio: false, fn: () => scrapeRedNote,    hosts: ['xiaohongshu.com', 'xhslink.com'] },
  { id: 'douyin',     label: 'Douyin',        audio: false, fn: () => scrapeDouyin,     hosts: ['douyin.com', 'iesdouyin.com'] },
  { id: 'bilibili',   label: 'Bilibili',      audio: false, fn: () => scrapeBilibili,   hosts: ['bilibili.com', 'b23.tv', 'bilibili.tv'] },
  { id: 'threads',    label: 'Threads',       audio: false, fn: () => scrapeThreads,    hosts: ['threads.net', 'threads.com'] },
  { id: 'bandcamp',   label: 'Bandcamp',      audio: true,  fn: () => scrapeBandcamp,   hosts: ['bandcamp.com'] },
  { id: 'pixiv',      label: 'Pixiv',         audio: false, fn: () => scrapePixiv,      hosts: ['pixiv.net', 'pixiv.me'] },
  { id: 'reddit',     label: 'Reddit',        audio: false, fn: () => scrapeReddit,     hosts: ['reddit.com', 'redd.it'] },
  { id: 'terabox',    label: 'TeraBox',       audio: false, fn: () => scrapeTeraBox,    hosts: ['terabox.com', 'teraboxapp.com', '1024terabox.com', 'terabox.fun', 'terafileshare.com', 'dubox.com'] },
]
const hostMatch = (host, d) => host === d || host.endsWith('.' + d)

// -> objek platform (id, label, audio) atau null bila domain tidak didukung scraper Mori
function platformOf(url) {
  let host = ''
  try { host = new URL(String(url || '').trim()).hostname.toLowerCase().replace(/^www\./, '') } catch { return null }
  return PLATFORMS.find(pf => pf.hosts.some(d => hostMatch(host, d))) || null
}

async function scrapeForUrl(url) {
  const pf = platformOf(url)
  if (!pf) return { status: false, message: 'Mori scraper tidak mendukung domain ini.' }
  return pf.fn()(url)
}
const PLATFORM_LIST = PLATFORMS.map(({ id, label, audio, single, hosts }) => ({ id, label, audio, single: !!single, hosts }))
module.exports = {
  scrapeForUrl, platformOf, PLATFORM_LIST,
  decodeSnapSave, extractFinalUrl,
  scrapeRedNote, scrapeDouyin, scrapeBilibili, scrapeThreads,
  scrapeTikTok, scrapeInstagram, scrapeYouTube, scrapeTwitter,
  scrapeSpotify, scrapePinterest, scrapeAppleMusic, scrapeFacebook,
  scrapeBandcamp, scrapePixiv, scrapeReddit, scrapeTeraBox,
}
