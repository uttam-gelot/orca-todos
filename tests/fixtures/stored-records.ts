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
  updatedAt: 20
}

/** An older record: no description, tags or priority fields yet. */
export const LEGACY_TODO = { id: 'old', title: 'Legacy', stateId: 'backlog', order: 2, createdAt: 1, updatedAt: 1 }

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
