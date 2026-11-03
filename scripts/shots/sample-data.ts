// Sample to-dos for screenshots. Dates are relative to now, so "done this week" and the update
// times in the shots always look current.

import type { Priority, State, Todo } from '../../src/model'

const HOUR = 3_600_000
const DAY = 24 * HOUR

export const SAMPLE_STATES: State[] = [
  { id: 'backlog', name: 'Backlog', color: '#8b8b8b', closed: false },
  { id: 'todo', name: 'ToDo', color: '#3b82f6', closed: false },
  { id: 'doing', name: 'In Progress', color: '#f59e0b', closed: false },
  { id: 'done', name: 'Done', color: '#22c55e', closed: true }
]

type Sample = {
  id: string
  title: string
  stateId: string
  tags?: string[]
  priority?: Priority
  order: number
  /** How long ago the to-do was last updated. */
  age: number
  description?: string
  archived?: boolean
}

const SAMPLES: Sample[] = [
  {
    id: 'a',
    title: 'Rate limit the agent launch endpoint',
    stateId: 'doing',
    tags: ['api'],
    priority: 'high',
    order: 1,
    age: 2 * HOUR,
    description:
      'Agents spawn faster than the worktree pool can clean up.\n\n- [x] Measure p95 spawn time\n- [ ] Token bucket per workspace\n- [ ] Show a toast when throttled\n\n`MAX_PARALLEL = 8` today.'
  },
  {
    id: 'b',
    title: 'Review diff viewer PR from the weekend',
    stateId: 'doing',
    tags: ['review'],
    priority: 'med',
    order: 2,
    age: 5 * HOUR
  },
  {
    id: 'c',
    title: 'Write release notes for 1.4.247',
    stateId: 'todo',
    tags: ['docs'],
    priority: 'med',
    order: 1,
    age: DAY
  },
  {
    id: 'd',
    title: 'Flaky worktree cleanup test on CI',
    stateId: 'todo',
    tags: ['ci', 'bug'],
    priority: 'high',
    order: 2,
    age: 3 * DAY,
    description: 'Fails about 1 in 20 runs on macOS runners.'
  },
  { id: 'e', title: 'Try the new terminal split shortcuts', stateId: 'todo', priority: 'low', order: 3, age: 4 * DAY },
  { id: 'f', title: 'Plugin settings page polish', stateId: 'backlog', tags: ['ui'], order: 1, age: 6 * DAY },
  {
    id: 'g',
    title: 'Benchmark Bun vs pnpm install in CI',
    stateId: 'backlog',
    tags: ['ci'],
    priority: 'low',
    order: 2,
    age: 9 * DAY
  },
  {
    id: 'h',
    title: 'Draft RFC: send a to-do to an agent',
    stateId: 'backlog',
    tags: ['agents'],
    order: 3,
    age: 12 * DAY,
    description: 'Needs `agent.launch` from host API 1.3.'
  },
  {
    id: 'i',
    title: 'Fix dark mode contrast in tab bar',
    stateId: 'done',
    tags: ['ui', 'bug'],
    priority: 'med',
    order: 1,
    age: DAY
  },
  { id: 'j', title: 'Upgrade marked to v18', stateId: 'done', order: 2, age: 2 * DAY },
  { id: 'k', title: 'Old spike: Electron 38 upgrade', stateId: 'done', order: 3, age: 20 * DAY, archived: true }
]

/** The sample to-dos, stamped relative to `now`. */
export function sampleTodos(now: number = Date.now()): Todo[] {
  return SAMPLES.map(({ age, tags = [], priority = 'none', description = '', archived = false, ...rest }) => ({
    ...rest,
    tags,
    priority,
    description,
    archived,
    createdAt: now - age - 2 * DAY,
    updatedAt: now - age,
    ...(rest.stateId === 'done' ? { closedAt: now - age } : {})
  }))
}
