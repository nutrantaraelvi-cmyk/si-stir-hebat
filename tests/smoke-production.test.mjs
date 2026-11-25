import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { once } from 'node:events'
import { createServer } from 'node:http'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const run = promisify(execFile)
const smoke = fileURLToPath(new URL('../scripts/smoke-production.mjs', import.meta.url))
const html = '<title>SI STIR HEBAT</title><div id="root"></div><script type="module" src="/assets/main.js"></script>'

test('smoke requires a JavaScript bundle and a database-level denial for a row-free anonymous probe', async t => {
  let apiStatus = 403
  let apiBody = { code: '42501' }
  let assetIsHtml = false
  const server = createServer((request, response) => {
    const url = new URL(request.url, 'http://localhost')
    if (url.pathname === '/rest/v1/profiles') {
      assert.equal(url.searchParams.get('limit'), '0')
      assert.equal(request.headers.authorization, undefined)
      assert.ok(request.headers.apikey?.startsWith('sb_publishable_'))
      response.writeHead(apiStatus, { 'content-type': 'application/json' }).end(JSON.stringify(apiBody))
    } else if (url.pathname === '/assets/main.js' && !assetIsHtml) {
      response.writeHead(200, { 'content-type': 'text/javascript' }).end('export {}')
    } else {
      response.writeHead(200, { 'content-type': 'text/html' }).end(html)
    }
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  t.after(() => new Promise(resolve => server.close(resolve)))
  const origin = `http://127.0.0.1:${server.address().port}`
  const env = { ...process.env, VITE_SUPABASE_URL: origin, VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_abcdefghijklmnopqrstuv_12345678' }
  const check = () => run(process.execPath, [smoke, origin], { env })

  assert.match((await check()).stdout, /Smoke 5\/5 lulus/)
  apiBody = { message: 'Invalid API key' }
  apiStatus = 401
  await assert.rejects(check(), { code: 1, stderr: /REST menolak akses anonim/ })
  apiStatus = 200
  apiBody = []
  await assert.rejects(check(), { code: 1, stderr: /REST menolak akses anonim/ })
  apiStatus = 403
  apiBody = { code: '42501' }
  assetIsHtml = true
  await assert.rejects(check(), { code: 1, stderr: /bundel produksi/ })
})
