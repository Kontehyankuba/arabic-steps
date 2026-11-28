// Zero-dependency server: serves the built SPA and keeps Quran Foundation API
// credentials on the server. Secrets are read from the environment and are
// never included in any response, log line or bundle.
//
// Free to run: no paid service is required. With no credentials the app simply
// streams authentic recitation from the free Islamic Network CDN instead.
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('./dist', import.meta.url)).replace(/[\\/]+$/, '')
const port = Number(process.env.PORT || 3000)
const host = process.env.HOST || '0.0.0.0'

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
}

/* ------------------------------------------------------------------ *
 * Quran Foundation API (optional, free developer account)
 * ------------------------------------------------------------------ */

const QURAN = {
  clientId: process.env.QURAN_CLIENT_ID || '',
  clientSecret: process.env.QURAN_CLIENT_SECRET || '',
  tokenUrl: process.env.QURAN_TOKEN_URL || 'https://oauth2.quran.foundation/oauth2/token',
  apiBase: (process.env.QURAN_API_BASE || 'https://apis.quran.foundation/content/api/v4').replace(/\/+$/, ''),
  recitationId: process.env.QURAN_RECITATION_ID || '7',
  reciterName: process.env.QURAN_RECITER_NAME || 'Mishary Rashid Alafasy',
}

const quranConfigured = Boolean(QURAN.clientId && QURAN.clientSecret)

const CDN_RECITER = {
  id: 'ar.alafasy',
  name: 'Mishary Rashid Alafasy',
  provider: 'Al Quran Cloud / Islamic Network CDN',
}

let tokenCache = { token: '', expiresAt: 0 }

async function quranToken() {
  if (tokenCache.token && Date.now() < tokenCache.expiresAt) return tokenCache.token
  const basic = Buffer.from(`${QURAN.clientId}:${QURAN.clientSecret}`).toString('base64')
  const body = new URLSearchParams({ grant_type: 'client_credentials', scope: 'content' })
  const response = await fetch(QURAN.tokenUrl, {
    method: 'POST',
    headers: {
      authorization: `Basic ${basic}`,
      'content-type': 'application/x-www-form-urlencoded',
      accept: 'application/json',
    },
    body,
    signal: AbortSignal.timeout(9000),
  })
  if (!response.ok) throw new Error(`token request failed (${response.status})`)
  const data = await response.json()
  if (!data?.access_token) throw new Error('token response had no access_token')
  const lifetime = Number(data.expires_in) > 60 ? Number(data.expires_in) - 60 : 300
  tokenCache = { token: data.access_token, expiresAt: Date.now() + lifetime * 1000 }
  return tokenCache.token
}

async function quranGet(path) {
  const token = await quranToken()
  const response = await fetch(`${QURAN.apiBase}${path}`, {
    headers: {
      'x-auth-token': token,
      'x-client-id': QURAN.clientId,
      accept: 'application/json',
    },
    signal: AbortSignal.timeout(9000),
  })
  if (!response.ok) throw new Error(`Quran API ${response.status}`)
  return response.json()
}

function verseNumber(item) {
  const key = String(item?.verse_key ?? item?.verseKey ?? '')
  const ayah = Number(key.split(':')[1] ?? item?.ayah ?? NaN)
  return Number.isFinite(ayah) ? ayah : null
}

async function surahPayload(chapter) {
  if (!quranConfigured) {
    return {
      configured: false,
      source: 'cdn',
      reciter: CDN_RECITER,
      audio: [],
      text: [],
      note: 'Quran Foundation credentials are not set on the server, so authentic recitation is streamed from the free Islamic Network CDN.',
    }
  }
  try {
    const [audioData, verseData] = await Promise.all([
      quranGet(`/recitations/${encodeURIComponent(QURAN.recitationId)}/by_chapter/${chapter}?per_page=50`),
      quranGet(`/verses/by_chapter/${chapter}?fields=text_uthmani&per_page=50`),
    ])
    const audioFiles = audioData?.audio_files ?? audioData?.audioFiles ?? []
    const audio = audioFiles
      .map((item) => ({ ayah: verseNumber(item), url: item?.url }))
      .filter((item) => item.ayah !== null && typeof item.url === 'string' && item.url.startsWith('http'))
    const verses = verseData?.verses ?? []
    const text = verses
      .map((item) => ({
        ayah: verseNumber(item),
        text: item?.text_uthmani ?? item?.textUthmani ?? '',
      }))
      .filter((item) => item.ayah !== null && item.text)
    return {
      configured: true,
      source: 'quran.foundation',
      reciter: {
        id: String(QURAN.recitationId),
        name: QURAN.reciterName,
        provider: 'Quran Foundation Content API',
      },
      audio,
      text,
    }
  } catch (error) {
    // Never break reading: fall back to the free CDN and say why.
    console.error('[quran] falling back to CDN:', error.message)
    return {
      configured: true,
      source: 'cdn',
      reciter: CDN_RECITER,
      audio: [],
      text: [],
      note: `The Quran Foundation API could not be reached (${error.message}), so the free CDN is used instead.`,
    }
  }
}

function sendJson(res, status, payload, cacheSeconds = 0) {
  const body = JSON.stringify(payload)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': cacheSeconds > 0 ? `public, max-age=${cacheSeconds}` : 'no-store',
    'x-content-type-options': 'nosniff',
  })
  res.end(body)
}

async function handleApi(req, res, pathname) {
  if (pathname === '/api/health') {
    sendJson(res, 200, { ok: true, quran: { configured: quranConfigured } })
    return true
  }
  if (pathname === '/api/quran/status') {
    sendJson(res, 200, {
      configured: quranConfigured,
      source: quranConfigured ? 'quran.foundation' : 'cdn',
      reciter: quranConfigured
        ? { id: String(QURAN.recitationId), name: QURAN.reciterName, provider: 'Quran Foundation Content API' }
        : CDN_RECITER,
    })
    return true
  }
  const match = pathname.match(/^\/api\/quran\/surah\/(\d{1,3})$/)
  if (match) {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      sendJson(res, 405, { error: 'method_not_allowed' })
      return true
    }
    const chapter = Number(match[1])
    if (!Number.isInteger(chapter) || chapter < 1 || chapter > 114) {
      sendJson(res, 400, { error: 'invalid_chapter', message: 'Chapter must be 1–114.' })
      return true
    }
    sendJson(res, 200, await surahPayload(chapter), 3600)
    return true
  }
  if (pathname.startsWith('/api/')) {
    sendJson(res, 404, { error: 'not_found' })
    return true
  }
  return false
}

/* ------------------------------------------------------------------ *
 * Static files
 * ------------------------------------------------------------------ */

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
    const pathname = decodeURIComponent(url.pathname)

    if (await handleApi(req, res, pathname)) return

    let filePath = normalize(join(root, pathname.endsWith('/') ? `${pathname}index.html` : pathname))
    if (filePath !== root && !filePath.startsWith(root + sep)) {
      res.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' })
      res.end('Forbidden')
      return
    }

    let body
    try {
      body = await readFile(filePath)
    } catch {
      if (extname(filePath)) {
        res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
        res.end('Not found')
        return
      }
      filePath = join(root, 'index.html')
      body = await readFile(filePath)
    }

    res.setHeader('content-type', MIME[extname(filePath)] || 'application/octet-stream')
    res.setHeader('x-content-type-options', 'nosniff')
    res.setHeader(
      'cache-control',
      filePath.includes(`${sep}assets${sep}`)
        ? 'public, max-age=31536000, immutable'
        : 'no-cache, must-revalidate',
    )
    res.writeHead(200)
    res.end(req.method === 'HEAD' ? undefined : body)
  } catch (error) {
    res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' })
    res.end('Server error')
    console.error(error)
  }
})

server.listen(port, host, () => {
  console.log(`Arabic Journey listening on http://${host}:${port}`)
  console.log(
    quranConfigured
      ? '[quran] Quran Foundation API credentials detected — using official verse audio and text.'
      : '[quran] No Quran Foundation credentials — using the free Islamic Network CDN.',
  )
})
