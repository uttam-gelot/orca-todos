// Raw values as they may sit in Orca storage: written by this version, an older one, or corrupted.

export const VALID_TODO = {
  id: 'v1',
  title: 'Valid',
  description: 'notes',
  stateId: 'todo',
  tags: ['api'],
  priority: 'high',
  archived: false,
  order: 1,
  createdAt: 10,
  updatedAt: 20,
  runs: [
    {
      terminalId: 't1',
      agent: 'claude',
      workspaceId: 'wt-1',
      workspaceName: 'orca-todos',
      startedAt: 30,
      state: 'working',
      stateAt: 40
    }
  ]
}

/** An older record: no description, tags or priority fields yet. */
export const LEGACY_TODO = { id: 'old', title: 'Legacy', stateId: 'backlog', order: 2, createdAt: 1, updatedAt: 1 }

/** Stored runs: one usable but from a future state name, one missing its terminal. */
export const ODD_RUNS = [
  { terminalId: 't2', agent: 'codex', workspaceId: 'wt-1', workspaceName: 'x', startedAt: 5, state: 'paused' },
  { agent: 'codex', workspaceId: 'wt-1', workspaceName: 'x', startedAt: 5, state: 'done', stateAt: 6 }
]

export const INVALID_TODOS: unknown[] = [
  null,
  'a string',
  [],
  { id: 'x', title: 'No state', order: 1, createdAt: 1, updatedAt: 1 },
  { id: 'y', title: 'Bad order', stateId: 'todo', order: 'first', createdAt: 1, updatedAt: 1 }
]

export const CUSTOM_STATES = [
  { id: 'open', name: 'Open', color: '#3b82f6', closed: false },
  { id: 'shipped', name: 'Shipped', color: '#22c55e', closed: true }
]
