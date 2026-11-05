// The requests a panel sends to the plugin's worker (`orca.plugin.request`), with their inputs and
// answers. Both sides import this file. Each side checks what it receives: the answers cross a
// process boundary as JSON.

export type WorkspaceOption = {
  id: string
  name: string
  kind: 'worktree' | 'folder'
  branch: string | null
  /** The last segment of the workspace's path: the repo or folder name, which `name` often is not. */
  folder: string
}

export type WorkspacesAnswer = {
  workspaces: WorkspaceOption[]
  /** The workspace Orca shows now, when the plugin can tell which one it is. */
  focusedId: string | null
  /** True when Orca listed only the first workspaces. */
  truncated: boolean
}

/** `todoId` lets the worker tie the agent's later status events to the to-do. */
export type LaunchInput = { todoId: string; workspaceId: string; agent: string; prompt: string }
/**
 * `prompt` says how the prompt went in: `command` when it was part of the agent's start command,
 * `typed` when Orca was left to type it once the agent is up (which can miss, so the panel also
 * copies it).
 */
export type LaunchAnswer = { terminalId: string; prompt: 'command' | 'typed' }

/** Shows a workspace in Orca, the way Orca's own task rows open theirs. */
export type OpenInput = { workspaceId: string }

/** Names of the worker's request handlers. */
export const REQUEST = {
  workspaces: 'workspaces.list',
  launch: 'agent.launch',
  open: 'workspace.open'
} as const

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const isString = (v: unknown): v is string => typeof v === 'string'

const lastSegment = (path: string): string =>
  path
    .replace(/[\\/]+$/, '')
    .split(/[\\/]/)
    .at(-1) ?? ''

/**
 * One workspace row, from Orca's `workspace.list` (which has `path`) or the worker's answer (which
 * has `folder`); null when unusable.
 */
export function parseWorkspace(value: unknown): WorkspaceOption | null {
  if (!isRecord(value) || !isString(value.id) || !isString(value.name)) return null
  return {
    id: value.id,
    name: value.name,
    kind: value.kind === 'folder' ? 'folder' : 'worktree',
    branch: isString(value.branch) ? value.branch : null,
    folder: isString(value.folder) ? value.folder : isString(value.path) ? lastSegment(value.path) : ''
  }
}

/** The worker's workspace list, or null when the answer is not one. */
export function parseWorkspacesAnswer(value: unknown): WorkspacesAnswer | null {
  if (!isRecord(value) || !Array.isArray(value.workspaces)) return null
  const workspaces = value.workspaces.map(parseWorkspace).filter((w): w is WorkspaceOption => w !== null)
  const focusedId =
    isString(value.focusedId) && workspaces.some((w) => w.id === value.focusedId) ? value.focusedId : null
  return { workspaces, focusedId, truncated: value.truncated === true }
}

/** A launch request, or null when the input is not one. The worker checks every panel input. */
export function parseLaunchInput(value: unknown): LaunchInput | null {
  if (!isRecord(value)) return null
  const { todoId, workspaceId, agent, prompt } = value
  const filled = (v: unknown): v is string => isString(v) && v.trim() !== ''
  if (!filled(todoId) || !filled(workspaceId) || !filled(agent) || !filled(prompt)) return null
  return { todoId, workspaceId, agent, prompt }
}

/** The worker's launch answer, or null when it is not one. */
export function parseLaunchAnswer(value: unknown): LaunchAnswer | null {
  if (!isRecord(value) || !isString(value.terminalId) || !value.terminalId) return null
  return { terminalId: value.terminalId, prompt: value.prompt === 'command' ? 'command' : 'typed' }
}

/** An open request, or null when the input is not one. */
export function parseOpenInput(value: unknown): OpenInput | null {
  if (!isRecord(value) || !isString(value.workspaceId) || !value.workspaceId.trim()) return null
  return { workspaceId: value.workspaceId }
}

/** The worker's open answer: true when Orca showed the workspace. */
export const parseOpenAnswer = (value: unknown): { opened: true } | null =>
  isRecord(value) && value.opened === true ? { opened: true } : null
