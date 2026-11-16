// `bun run cover`: renders the catalog cover (images/cover.png, 1600×1000) from cover.html, with
// the real board built from the current source and the screenshot sample data. It runs in a
// headless Chrome with no Orca involved, so the cover can follow every UI change.
//
// Needs Chrome or Chromium: the app at its usual macOS path, Playwright's headless shell, or a
// binary named by CHROME_PATH.

import { $ } from 'bun'
import { cp, mkdir, mkdtemp, rm, stat } from 'node:fs/promises'
import { homedir, tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const ROOT = resolve(import.meta.dir, '../..')
const OUT = join(ROOT, 'images/cover.png')
const SIZE = { width: 1600, height: 1000 }
/** The catalog refuses a larger cover. */
const MAX_BYTES = 1024 * 1024

async function findChrome(): Promise<string> {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH
  const app = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  if (await Bun.file(app).exists()) return app
  const shells =
    await $`ls -d ${homedir()}/Library/Caches/ms-playwright/chromium_headless_shell-*/*/chrome-headless-shell`
      .nothrow()
      .quiet()
      .text()
  const shell = shells.trim().split('\n').filter(Boolean).pop()
  if (shell) return shell
  throw new Error('No Chrome found. Install Google Chrome or set CHROME_PATH.')
}

const dir = await mkdtemp(join(tmpdir(), 'todos-cover-'))
const server = Bun.serve({
  port: 0,
  async fetch(req) {
    const file = Bun.file(join(dir, new URL(req.url).pathname))
    return (await file.exists()) ? new Response(file) : new Response('Not found', { status: 404 })
  }
})
try {
  const build = await Bun.build({
    entrypoints: [join(ROOT, 'scripts/shots/demo-main.tsx')],
    outdir: join(dir, 'dist'),
    naming: 'app.[ext]',
    target: 'browser',
    format: 'esm',
    minify: true,
    define: { DEMO_SEED_ID: JSON.stringify(crypto.randomUUID()) }
  })
  if (!build.success) throw new AggregateError(build.logs, 'The demo build failed')
  await mkdir(join(dir, 'images'))
  await cp(join(ROOT, 'src/fonts/Geist-Variable.woff2'), join(dir, 'dist/Geist-Variable.woff2'))
  await cp(join(ROOT, 'images/icon.png'), join(dir, 'images/icon.png'))
  await cp(join(ROOT, 'board.html'), join(dir, 'board.html'))
  await cp(join(ROOT, 'panel.html'), join(dir, 'panel.html'))
  await cp(join(import.meta.dir, 'cover.html'), join(dir, 'cover.html'))

  const chrome = await findChrome()
  // Dark, as Orca's default theme. A fresh profile, so the sample data is written again.
  await $`${chrome} --headless --user-data-dir=${join(dir, 'profile')} --hide-scrollbars --force-device-scale-factor=1 --window-size=${SIZE.width},${SIZE.height} --virtual-time-budget=4000 --blink-settings=preferredColorScheme=0 --screenshot=${OUT} http://localhost:${server.port}/cover.html`.quiet()
  const { size } = await stat(OUT)
  if (size > MAX_BYTES) throw new Error(`The cover is ${Math.round(size / 1024)} KB; the catalog allows 1024 KB.`)
  process.stdout.write(`Wrote ${OUT} (${Math.round(size / 1024)} KB)\n`)
} finally {
  server.stop()
  await rm(dir, { recursive: true, force: true })
}
