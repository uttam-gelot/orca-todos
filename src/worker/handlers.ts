// What the worker answers and follows. Only a worker may list workspaces with their ids and start
// agents, so the panel asks here; agent status events reach the worker even with no panel open.
// Every Orca answer, panel input and stored value is checked before use.

import { indexRun, parseRunIndex, RUN_INDEX_KEY, withRunState } from '../agents'
import { HandlerError } from '../errors'
import { parseTodo, TODO_KEY, type RunState } from '../model'
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

const readKey = async (orca: WorkerOrca, key: string): Promise<unknown> => {
  const answer = await orca.host.call('storage.get', { key })
  return isRecord(answer) ? answer.value : null
}
const writeKey = (orca: WorkerOrca, key: string, value: unknown): Promise<unknown> =>
  orca.host.call('storage.set', { key, value })

/**
 * Starts an agent CLI in a new terminal of the workspace, with the prompt as its first message, and
 * indexes the terminal so its status events find the to-do.
 */
export async function launchAgent(orca: WorkerOrca, input: unknown): Promise<LaunchAnswer> {
  const launch = parseLaunchInput(input)
  if (!launch) throw new HandlerError('invalid_params', 'A launch needs a to-do, a workspace, an agent and a prompt')
  const { todoId, workspaceId, agent, prompt } = launch
  const answer = await orca.host.call('agent.launch', { workspaceId, agent, prompt })
  if (!isRecord(answer) || !isString(answer.terminalId) || !answer.terminalId)
    throw new HandlerError('action_failed', 'Orca answered agent.launch with something unexpected')
  const terminalId = answer.terminalId
  orca.log(`Started ${agent} for to-do ${todoId} in ${workspaceId} (terminal ${terminalId})`)
  // The agent is running either way; without the index only its live status is lost.
  try {
    await writeKey(orca, RUN_INDEX_KEY, indexRun(parseRunIndex(await readKey(orca, RUN_INDEX_KEY)), terminalId, todoId))
  } catch (error) {
    orca.log(`Could not index terminal ${terminalId}; its status will not show: ${String(error)}`)
  }
  return { terminalId }
}

type StatusEvent = { terminalId: string; state: RunState; at: number }

/** The states Orca reports. `starting` is this plugin's own, for a run no event has reached yet. */
const REPORTED: RunState[] = ['working', 'blocked', 'waiting', 'done']

/** The parts of an `agent.status.changed` payload this plugin uses; null without a terminal. */
export function parseStatusEvent(value: unknown): StatusEvent | null {
  if (!isRecord(value) || !isString(value.terminalId) || !value.terminalId) return null
  if (!REPORTED.includes(value.state as RunState)) return null
  const at = typeof value.receivedAt === 'number' ? value.receivedAt : Date.now()
  return { terminalId: value.terminalId, state: value.state as RunState, at }
}

/**
 * Records an agent's new status on the run of the to-do it works on. Events about terminals this
 * plugin did not start are ignored. `updatedAt` stays: a status change is not an edit.
 */
export async function onAgentStatus(orca: WorkerOrca, payload: unknown): Promise<void> {
  const event = parseStatusEvent(payload)
  if (!event) return
  const todoId = parseRunIndex(await readKey(orca, RUN_INDEX_KEY))[event.terminalId]
  if (!todoId) return
  const key = TODO_KEY + todoId
  const todo = parseTodo(await readKey(orca, key))
  if (!todo) {
    orca.log(`To-do ${todoId} is gone or not valid; ignoring terminal ${event.terminalId}`)
    return
  }
  const runs = withRunState(todo.runs, event.terminalId, event.state, event.at)
  if (!runs) return
  await writeKey(orca, key, { ...todo, runs })
  orca.log(`To-do ${todoId}: terminal ${event.terminalId} is ${event.state}`)
}
