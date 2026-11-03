// `bun run shots`: screenshots of the sidebar panel and the center tab, drawn by Orca itself with
// `orca plugin shot`, in light and dark mode, with sample data.
//
// 1. Build a demo copy of the plugin into a temporary folder. It has its own id (`todos-demo`),
//    so its storage is separate from your to-dos, and an entry that writes the sample data.
// 2. Load that copy as a development plugin and approve it. It asks for the same access as the
//    plugin itself.
// 3. Hide Orca: `--theme` and `--act` work only while the window is hidden. Without Automation
//    access to System Events, the script waits for you to hide it with Cmd+H.
// 4. Take the shots into `.orca/shots/`.
// 5. Show Orca again and unload the demo copy, also when a step fails.
//
// Needs the Orca desktop app 1.4.247 or later, running on this machine, with the `orca` CLI.

import { $ } from 'bun'
import { cp, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const ROOT = resolve(import.meta.dir, '../..')
const OUT = join(ROOT, '.orca/shots')
const DEMO_ID = 'todos-demo'
const DEMO_KEY = `local.${DEMO_ID}`
const THEMES = ['light', 'dark'] as const
// Wide enough for the navigator and all four board columns.
const TAB = { width: 1500, height: 800 }
const PANEL_WIDTH = 380
const HIDE_WAIT_MS = 120_000

type Shot = { name: string; args: string[] }

type Act = { key: string } | { click: [number, number] }

/** Keys that do nothing. Each act waits for a paint, so these let the details pane finish its fade-in. */
const SETTLE: Act[] = Array.from({ length: 6 }, () => ({ key: 'Shift' }))

/** A shot of the center tab. `--act` sends real input to the board before the capture. */
function tabShot(name: string, theme: string, demoFile: string, acts: Act[]): Shot {
  // With `--act`, the shot opens a copy of the file in a temporary workspace and removes it, so
  // Orca does not keep the demo folder as a workspace. `Shift` alone is a key that does nothing.
  const act = JSON.stringify(acts.length ? acts : [{ key: 'Shift' }])
  const size = ['--width', String(TAB.width), '--height', String(TAB.height)]
  return { name: `${name}-${theme}`, args: ['--editor', demoFile, ...size, '--act', act, '--theme', theme] }
}

function allShots(demoFile: string): Shot[] {
  const tabs = THEMES.flatMap((theme) => [
    tabShot('tab-board', theme, demoFile, []),
    // `v` shows the list view. The click opens the details of "Rate limit the agent launch
    // endpoint", the sample with a checklist in its notes.
    tabShot('tab-list', theme, demoFile, [{ key: 'v' }, { click: [600, 425] }, ...SETTLE])
  ])
  const panels = THEMES.map((theme) => ({
    name: `panel-${theme}`,
    args: ['--width', String(PANEL_WIDTH), '--theme', theme]
  }))
  return [...tabs, ...panels]
}

/** Builds the demo copy: the plugin's own HTML, images and fonts, with the demo bundle. */
async function buildDemo(dir: string): Promise<string> {
  const build = await Bun.build({
    entrypoints: [join(import.meta.dir, 'demo-main.tsx')],
    outdir: join(dir, 'dist'),
    naming: 'app.[ext]',
    target: 'browser',
    format: 'esm',
    minify: true,
    define: { DEMO_SEED_ID: JSON.stringify(crypto.randomUUID()) }
  })
  if (!build.success) throw new AggregateError(build.logs, 'The demo build failed')

  for (const file of ['panel.html', 'board.html', 'images'])
    await cp(join(ROOT, file), join(dir, file), { recursive: true })
  await cp(join(ROOT, 'src/fonts/Geist-Variable.woff2'), join(dir, 'dist/Geist-Variable.woff2'))

  const manifest = await Bun.file(join(ROOT, 'orca-plugin.json')).json()
  await writeFile(
    join(dir, 'orca-plugin.json'),
    JSON.stringify({ ...manifest, id: DEMO_ID, name: 'ToDos (demo)' }, null, 2)
  )

  const file = join(dir, 'workspace/ToDos.todos')
  await mkdir(join(dir, 'workspace'))
  await writeFile(file, '')
  return file
}

/** Loads the demo copy. A first load answers `approval_required` with the fingerprint to approve. */
async function loadDemo(dir: string): Promise<void> {
  const first = await $`orca plugin dev load ${dir} --json`.nothrow().quiet()
  if (first.exitCode === 0) return
  const fingerprint = /"approveFlag"\s*:\s*"--approve ([^"]+)"/.exec(first.stdout.toString())?.[1]
  if (first.exitCode !== 3 || !fingerprint)
    throw new Error(`orca plugin dev load failed:\n${first.stdout}${first.stderr}`)
  await $`orca plugin dev load ${dir} --approve ${fingerprint} --json`.quiet()
}

/** Hides or shows Orca through System Events. False when macOS refuses (no Automation access). */
async function setOrcaVisible(visible: boolean): Promise<boolean> {
  const script = `tell application "System Events" to set visible of process "Orca" to ${visible}`
  return (await $`osascript -e ${script}`.nothrow().quiet()).exitCode === 0
}

/**
 * True when Orca's window is hidden or minimized. Orca applies `--theme` only then, so a cheap
 * status bar shot reports it as `themeApplied`.
 */
async function isOrcaHidden(dir: string): Promise<boolean> {
  const probe = join(dir, 'probe.png')
  const result = await $`orca plugin shot ${DEMO_KEY} --status-bar --theme dark --out ${probe} --json`.nothrow().quiet()
  return /"themeApplied"\s*:\s*true/.test(result.stdout.toString())
}

/** Hides Orca, or waits up to HIDE_WAIT_MS for you to hide it when macOS refuses the script. */
async function hideOrca(dir: string): Promise<void> {
  await setOrcaVisible(false)
  if (await isOrcaHidden(dir)) return
  process.stdout.write('Hide Orca now (Cmd+H or minimize it). The shots start when it is hidden.\n')
  for (const end = Date.now() + HIDE_WAIT_MS; Date.now() < end; await Bun.sleep(1000)) {
    if (await isOrcaHidden(dir)) return
  }
  throw new Error('Orca is still visible. Hide it and run `bun run shots` again.')
}

/** The error message of a failed `orca plugin shot --json`, or its raw output when it has none. */
function failureReason(stdout: string, stderr: string): string {
  try {
    const json = JSON.parse(stdout) as { error?: { message?: string }; result?: { errors?: string[] } }
    const reasons = [json.error?.message, ...(json.result?.errors ?? [])].filter(Boolean)
    if (reasons.length) return reasons.join('; ')
  } catch {
    // Not JSON: show what the command printed.
  }
  return (stdout + stderr).trim()
}

async function main(): Promise<void> {
  const dir = await mkdtemp(join(tmpdir(), 'orca-todos-shots-'))
  let failed = 0
  try {
    const demoFile = await buildDemo(dir)
    await loadDemo(dir)
    await mkdir(OUT, { recursive: true })
    await hideOrca(dir)
    // The first panel shot after the demo copy loads fails with "could not be loaded" (Orca
    // 1.4.247), and the next one works. This throwaway shot takes that failure.
    await $`orca plugin shot ${DEMO_KEY} --out ${join(dir, 'warm-up.png')} --json`.nothrow().quiet()
    for (const shot of allShots(demoFile)) {
      const out = join(OUT, `${shot.name}.png`)
      const result = await $`orca plugin shot ${DEMO_KEY} ${shot.args} --out ${out} --json`.nothrow().quiet()
      if (result.exitCode === 0) {
        const themed = /"themeApplied"\s*:\s*true/.test(result.stdout.toString())
        process.stdout.write(`ok    ${shot.name}${themed ? '' : '  (Orca did not apply the theme)'}\n`)
      } else {
        failed++
        process.stdout.write(
          `FAIL  ${shot.name}: ${failureReason(result.stdout.toString(), result.stderr.toString())}\n`
        )
      }
    }
  } finally {
    await setOrcaVisible(true)
    await $`orca plugin dev unload ${DEMO_KEY}`.nothrow().quiet()
    await rm(dir, { recursive: true, force: true })
  }
  process.stdout.write(`\nShots in ${OUT}\n`)
  if (failed) process.exit(1)
}

await main()
