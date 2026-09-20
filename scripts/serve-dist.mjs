/* Tiny static server that mirrors the vercel.json config (trailingSlash +
   the /order/:id rewrite) so the production build can be walked locally
   exactly as Vercel would serve it. Dev/test only — not deployed. */
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

const dist = path.resolve('dist')
const port = Number(process.argv[2] || 4178)

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
  '.json': 'application/json',
  '.png': 'image/png',
}

http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0])

  // vercel.json: rewrite /order/<id> to the prerendered /order shell.
  if (/^\/order\/[^/]+\/?$/.test(urlPath)) urlPath = '/order/'

  let file = path.join(dist, urlPath)
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html')
  if (!fs.existsSync(file) && fs.existsSync(`${file}/index.html`)) file = `${file}/index.html`

  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/html' })
    res.end(fs.readFileSync(path.join(dist, '404.html')))
    return
  }

  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' })
  res.end(fs.readFileSync(file))
}).listen(port, () => console.log(`serving dist on http://localhost:${port}`))
