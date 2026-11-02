// Preloaded before every test file (see bunfig.toml). Gives tests a browser-like DOM (happy-dom)
// and installs a fake Orca frame before any `src/` module reads `window.orca`.

import { GlobalRegistrator } from '@happy-dom/global-registrator'
import { createFakeOrcaFrame } from './factories/orca-frame'

GlobalRegistrator.register({ url: 'http://localhost/' })

/** The fake Orca frame every `src/` module sees as `window.orca`. Reset it in `beforeEach`. */
export const fakeOrca = createFakeOrcaFrame()
window.orca = fakeOrca

// Keep test output readable: only errors print. Tests that expect an error spy on console.error.
const { logConfig } = await import('../src/log')
logConfig.level = 'error'
