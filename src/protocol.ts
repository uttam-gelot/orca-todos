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

export type LaunchInput = { workspaceId: string; agent: string; prompt: string }
export type LaunchAnswer = { terminalId: string }

/** Names of the worker's request handlers. */
export const REQUEST = {
  workspaces: 'workspaces.list',
  launch: 'agent.launch'
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
  const { workspaceId, agent, prompt } = value
  if (!isString(workspaceId) || !workspaceId || !isString(agent) || !agent || !isString(prompt) || !prompt.trim())
    return null
  return { workspaceId, agent, prompt }
}

/** The worker's launch answer, or null when it is not one. */
export function parseLaunchAnswer(value: unknown): LaunchAnswer | null {
  return isRecord(value) && isString(value.terminalId) && value.terminalId ? { terminalId: value.terminalId } : null
}
