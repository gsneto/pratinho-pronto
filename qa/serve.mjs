import http from 'node:http'
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs'
import { extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createFixtureStore, fixtureToday, fixtureUser } from './store.mjs'

// Dedicated loopback-only demo of the real build, never imported by src/.
const root = fileURLToPath(new URL('../tmp/ui-qa-dist/', import.meta.url))
const port = 4178
const origin = `http://127.0.0.1:${port}`
const session = { access_token: 'qa-fixture-access', refresh_token: 'qa-fixture-refresh', expires_at: 4102444800, expires_in: 3600, token_type: 'bearer', user: fixtureUser }
let store = createFixtureStore()
const types = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.woff': 'font/woff', '.mp4': 'video/mp4', '.pdf': 'application/pdf', '.json': 'application/json', '.webmanifest': 'application/manifest+json' }
const bootstrap = `<script>
if(!location.pathname.startsWith('/login')) localStorage.setItem('sb-127-auth-token', ${JSON.stringify(JSON.stringify(session))});
else localStorage.removeItem('sb-127-auth-token');
if(!localStorage.getItem('pratinho-pronto-theme')) localStorage.setItem('pratinho-pronto-theme','light');
(()=>{const NativeDate=Date;const fixed=new NativeDate(${JSON.stringify(fixtureToday)}).valueOf();window.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:[fixed]))}static now(){return fixed}}})();
</script>`
const banner = '<aside class="pp-preview-banner" aria-label="Ambiente demonstrativo">Prévia local · Dados fictícios de Alice · Alterações apenas nesta demonstração</aside>'
const json = (response, status, body) => { response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); response.end(JSON.stringify(body)) }

if (!existsSync(resolve(root, 'index.html'))) throw new Error('Run the isolated QA build before starting qa/serve.mjs')
http.createServer(async (request, response) => {
  try {
    if (request.headers.host !== `127.0.0.1:${port}`) return json(response, 403, { message: 'Loopback host required' })
    if (request.headers.origin && request.headers.origin !== origin) return json(response, 403, { message: 'Same origin required' })
    const url = new URL(request.url, origin)
    if (url.pathname === '/__qa/health') return json(response, 200, { mode: 'local-fixtures', recipes: store.catalog.recipes.length, production: false })
    if (url.pathname === '/__qa/reset' && request.method === 'POST') {
      store = createFixtureStore(url.searchParams.get('scenario') ?? 'full')
      return json(response, 200, { reset: true })
    }
    if (url.pathname === '/__qa/supabase/auth/v1/user') return json(response, 200, fixtureUser)
    if (url.pathname === '/__qa/supabase/auth/v1/logout') return json(response, 200, {})
    if (url.pathname.startsWith('/__qa/supabase/rest/v1/')) {
      let body = ''
      for await (const chunk of request) {
        body += chunk
        if (body.length > 1000000) return json(response, 413, { message: 'Fixture request too large' })
      }
      const result = store.request(request.method, url.pathname.split('/').at(-1), url.searchParams, body ? JSON.parse(body) : {})
      const single = request.headers.accept?.includes('application/vnd.pgrst.object+json')
      return json(response, result.status, single && Array.isArray(result.body) ? result.body[0] ?? null : result.body)
    }
    if (!['GET', 'HEAD'].includes(request.method)) return json(response, 405, { message: 'Local fixture server only' })
    const requestedPath = resolve(root, `.${decodeURIComponent(url.pathname)}`)
    if (requestedPath !== resolve(root) && !requestedPath.startsWith(resolve(root) + sep)) return json(response, 403, { message: 'Invalid path' })
    const file = existsSync(requestedPath) && statSync(requestedPath).isFile() ? requestedPath : resolve(root, 'index.html')
    if (file.endsWith('index.html')) {
      const html = readFileSync(file, 'utf8').replace('<head>', `<head>${bootstrap}`).replace('<body>', `<body>${banner}`)
      response.writeHead(200, {
        'Content-Type': types['.html'], 'Cache-Control': 'no-store',
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self' data:; img-src 'self' data: blob:; font-src 'self' data:; media-src 'self' blob:; worker-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'self'",
      })
      return response.end(html)
    }
    const size = statSync(file).size
    const range = request.headers.range?.match(/^bytes=(\d+)-(\d*)$/)
    if (range) {
      const start = Number(range[1]); const end = range[2] ? Math.min(Number(range[2]), size - 1) : size - 1
      if (start > end || start >= size) { response.writeHead(416, { 'Content-Range': `bytes */${size}` }); return response.end() }
      response.writeHead(206, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream', 'Accept-Ranges': 'bytes', 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': end - start + 1 })
      return createReadStream(file, { start, end }).pipe(response)
    }
    response.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream', 'Content-Length': size, 'Cache-Control': 'no-cache' })
    if (request.method === 'HEAD') return response.end()
    createReadStream(file).pipe(response)
  } catch (error) {
    console.error(error)
    if (!response.headersSent) json(response, 500, { message: 'Local QA request failed' })
    else response.end()
  }
}).listen(port, '127.0.0.1', () => console.log(`Local fixture preview ready: ${origin}/app`))
