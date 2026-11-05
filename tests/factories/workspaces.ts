// Worker answers for the agent sheet, served by the fake frame's `plugin.request`.

import { REQUEST, type WorkspacesAnswer } from '../../src/protocol'
import type { FakeOrcaFrame } from './orca-frame'

export const WORKSPACES: WorkspacesAnswer = {
  workspaces: [
    { id: 'w1', name: 'main', kind: 'worktree', branch: 'main', folder: 'app' },
    { id: 'w2', name: 'feature/login', kind: 'worktree', branch: 'feature/login', folder: 'app' }
  ],
  focusedId: 'w2',
  truncated: false
}

/** Makes the fake worker list WORKSPACES and start every agent in terminal `t1`. */
export function serveWorker(frame: FakeOrcaFrame): void {
  frame.handlers.set(REQUEST.workspaces, () => WORKSPACES)
  frame.handlers.set(REQUEST.launch, () => ({ terminalId: 't1', prompt: 'command' }))
}
