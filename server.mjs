// Minimal zero-dependency static server for the built app.
// Serves ./dist with an SPA fallback so client-side routes never 404.
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

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
    let pathname = decodeURIComponent(url.pathname)
    if (pathname.endsWith('/')) pathname += 'index.html'

    let filePath = normalize(join(root, pathname))
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
})
