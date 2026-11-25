import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'))
const global = config.headers.find(rule => rule.source === '/(.*)')
const header = key => global?.headers.find(item => item.key === key)?.value

test('vercel.json memasang header keamanan pada semua rute', () => {
  assert.ok(global, 'aturan header untuk /(.*) wajib ada')
  assert.equal(header('X-Content-Type-Options'), 'nosniff')
  assert.equal(header('X-Frame-Options'), 'DENY')
  assert.equal(header('Referrer-Policy'), 'strict-origin-when-cross-origin')
  assert.match(header('Permissions-Policy') ?? '', /camera=\(\)/)
  assert.match(header('Strict-Transport-Security') ?? '', /max-age=\d{8,}/)
})

test('CSP mengizinkan Supabase dan font, tetapi tidak inline script atau eval', () => {
  const csp = header('Content-Security-Policy') ?? ''
  const directive = name => csp.split(';').map(part => part.trim()).find(part => part.startsWith(`${name} `)) ?? ''
  assert.equal(directive('script-src'), "script-src 'self'")
  assert.doesNotMatch(csp, /unsafe-eval/)
  assert.match(directive('connect-src'), /https:\/\/\*\.supabase\.co/)
  assert.match(directive('connect-src'), /wss:\/\/\*\.supabase\.co/)
  assert.match(directive('font-src'), /fonts\.gstatic\.com/)
  assert.match(directive('style-src'), /fonts\.googleapis\.com/)
  assert.match(directive('worker-src'), /'self'/)
  assert.equal(directive('frame-ancestors'), "frame-ancestors 'none'")
  assert.equal(directive('object-src'), "object-src 'none'")
})

test('aset ber-hash tetap di-cache lama dan service worker tidak di-cache', () => {
  const cache = source => config.headers.find(rule => rule.source === source)?.headers.find(item => item.key === 'Cache-Control')?.value
  assert.equal(cache('/assets/(.*)'), 'public, max-age=31536000, immutable')
  assert.equal(cache('/sw.js'), 'no-cache')
})
