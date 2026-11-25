import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { getPublicSupabaseConfig } from './src/lib/config'

const require = createRequire(import.meta.url)

// Header keamanan produksi berasal dari vercel.json. `vite preview` memakai header
// yang sama agar pelanggaran CSP terlihat secara lokal. HSTS dan
// upgrade-insecure-requests dilepas karena preview berjalan di http://127.0.0.1.
function productionSecurityHeaders(): Record<string, string> {
  const config = JSON.parse(readFileSync(new URL('./vercel.json', import.meta.url), 'utf8')) as {
    headers: { source: string; headers: { key: string; value: string }[] }[]
  }
  const entries = config.headers.find(rule => rule.source === '/(.*)')?.headers ?? []
  return Object.fromEntries(entries
    .filter(header => header.key !== 'Strict-Transport-Security')
    .map(header => [header.key, header.value.replace(/;\s*upgrade-insecure-requests/, '')]))
}

// The academic report uses only normal and bold Roboto. Keep its lazy font
// chunk limited to those variants while retaining the original TTF glyphs.
function academicPdfFonts() {
  return {
    name: 'academic-pdf-fonts',
    enforce: 'pre' as const,
    transform(_code: string, id: string) {
      if (!id.replaceAll('\\', '/').endsWith('/pdfmake/build/vfs_fonts.js')) return
      const fonts = Object.fromEntries(['Regular', 'Medium'].map(variant => {
        const filename = `Roboto-${variant}.ttf`
        return [filename, readFileSync(require.resolve(`pdfmake/fonts/Roboto/${filename}`)).toString('base64')]
      }))
      return `export default ${JSON.stringify(fonts)}`
    },
  }
}
export default defineConfig(({ command, mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env }
  if (command === 'build' && !getPublicSupabaseConfig(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY)) {
    throw new Error('Build dihentikan: konfigurasi Supabase belum valid. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_PUBLISHABLE_KEY pada hosting sebelum build.')
  }
  return {
  plugins: [academicPdfFonts(), react(), tailwindcss()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    // On Windows a concurrent editor can hold a lock on a source file, which
    // makes the watcher throw EBUSY and kills the dev server. Test runs do not
    // need HMR, so Playwright disables the watcher for a stable web server.
    watch: process.env.VITE_TEST_NO_WATCH === '1' ? null : undefined,
  },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true, headers: productionSecurityHeaders() },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/pdfmake/')) return id.includes('vfs_fonts') ? 'pdf-fonts' : 'pdf-engine'
          if (id.includes('node_modules')) return id.includes('@supabase') ? 'supabase' : 'vendor'
        },
      },
    },
  },
  }
})
