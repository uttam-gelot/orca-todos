// What the worker answers. Only a worker may list workspaces with their ids and start agents, so
// the panel asks here. Every Orca answer and every panel input is checked before use.

import { HandlerError } from '../errors'
import {
  parseLaunchInput,
  parseWorkspace,
  type LaunchAnswer,
  type WorkspaceOption,
  type WorkspacesAnswer
} from '../protocol'
import type { WorkerOrca } from './host'

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const isString = (v: unknown): v is string => typeof v === 'string'

type FocusedContext = { displayName: string; branch: string }

/** `refs/heads/main` and `main` name the same branch; a folder has none. */
const branchName = (branch: string | null | undefined): string => branch?.replace(/^refs\/heads\//, '') ?? ''

function parseContext(value: unknown): FocusedContext | null {
  if (!isRecord(value) || !isString(value.displayName)) return null
  return { displayName: value.displayName, branch: isString(value.branch) ? value.branch : '' }
}

/**
 * The id of the focused workspace. Orca's focus answer has no id, only a name and a branch, so this
 * is the one listed workspace with both. Null when none or several match.
 */
export function focusedWorkspaceId(workspaces: WorkspaceOption[], context: FocusedContext | null): string | null {
  if (!context) return null
  const same = workspaces.filter(
    (w) => w.name === context.displayName && branchName(w.branch) === branchName(context.branch)
  )
  return same.length === 1 ? same[0].id : null
}

/** Every workspace Orca reaches, and which one is focused. */
export async function listWorkspaces(orca: WorkerOrca): Promise<WorkspacesAnswer> {
  const [listed, context] = await Promise.all([
    orca.host.call('workspace.list', {}),
    orca.host.call('workspace.readContext', {})
  ])
  if (!isRecord(listed) || !Array.isArray(listed.workspaces))
    throw new HandlerError('action_failed', 'Orca answered workspace.list with something unexpected')
  const workspaces = listed.workspaces.map(parseWorkspace).filter((w): w is WorkspaceOption => w !== null)
  return {
    workspaces,
    focusedId: focusedWorkspaceId(workspaces, parseContext(context)),
    truncated: listed.truncated === true
  }
}

/** Starts an agent CLI in a new terminal of the workspace, with the prompt as its first message. */
export async function launchAgent(orca: WorkerOrca, input: unknown): Promise<LaunchAnswer> {
  const launch = parseLaunchInput(input)
  if (!launch) throw new HandlerError('invalid_params', 'A launch needs a workspace, an agent and a prompt')
  const answer = await orca.host.call('agent.launch', launch)
  if (!isRecord(answer) || !isString(answer.terminalId))
    throw new HandlerError('action_failed', 'Orca answered agent.launch with something unexpected')
  orca.log(`Started ${launch.agent} in ${launch.workspaceId} (terminal ${answer.terminalId})`)
  return { terminalId: answer.terminalId }
}
