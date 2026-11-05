// Pure rules for handing a to-do to an agent: the agents to offer, the prompt, and run bookkeeping.
// No Orca and no DOM, so the panel and the worker share it and tests call it directly.

import { PRIORITY_LABEL, type AgentRun, type RunState, type State, type Todo } from './model'
import type { WorkspaceOption } from './protocol'

/**
 * An agent CLI to offer. `command` and `promptFlag` say how the CLI takes a first prompt on its
 * command line (`claude '<prompt>'`, `gemini --prompt-interactive '<prompt>'`), the way Orca's own
 * GitHub and Jira launches start it. Without `command`, the prompt can only be typed in once the
 * agent is up, which Orca's plugin `agent.launch` does.
 */
export type AgentChoice = { id: string; label: string; command?: string; promptFlag?: string }

/**
 * Agent CLIs to offer, by Orca's agent id. Orca knows more; these are the common ones. The commands
 * and flags follow Orca's agent catalog. A CLI missing on the host fails in its terminal.
 */
export const AGENTS: AgentChoice[] = [
  { id: 'claude', label: 'Claude', command: 'claude' },
  { id: 'codex', label: 'Codex', command: 'codex' },
  { id: 'gemini', label: 'Gemini', command: 'gemini', promptFlag: '--prompt-interactive' },
  { id: 'opencode', label: 'OpenCode', command: 'opencode', promptFlag: '--prompt' },
  { id: 'cursor', label: 'Cursor', command: 'cursor-agent' },
  { id: 'copilot', label: 'GitHub Copilot', command: 'copilot', promptFlag: '-i' },
  { id: 'droid', label: 'Droid', command: 'droid' },
  { id: 'grok', label: 'Grok', command: 'grok', promptFlag: '--' },
  { id: 'amp', label: 'Amp' },
  { id: 'aider', label: 'Aider' },
  { id: 'goose', label: 'Goose' },
  { id: 'kiro', label: 'Kiro' },
  { id: 'qwen-code', label: 'Qwen Code' }
]

export const DEFAULT_AGENT = 'claude'

export const agentLabel = (id: string): string => AGENTS.find((a) => a.id === id)?.label ?? id

/** One POSIX shell word: single quotes, with each `'` closed, escaped and reopened. */
export const shellQuote = (value: string): string => `'${value.replaceAll("'", `'\\''`)}'`

/**
 * The shell command that starts `agentId` with `prompt` as its first message, or null when the
 * agent takes no prompt on its command line. POSIX shells only.
 */
export function startCommand(agentId: string, prompt: string): string | null {
  const agent = AGENTS.find((a) => a.id === agentId)
  if (!agent?.command) return null
  return [agent.command, agent.promptFlag, shellQuote(prompt)].filter(Boolean).join(' ')
}

export const RUN_LABEL: Record<RunState, string> = {
  starting: 'Starting',
  working: 'Working',
  blocked: 'Needs you',
  waiting: 'Waiting',
  done: 'Finished'
}

/** Runs kept per to-do. Older ones drop off: they only record history. */
export const MAX_RUNS = 10

/** The prompt an agent gets for a to-do: its title, notes, tags and priority, as markdown. */
export function buildPrompt(todo: Todo): string {
  const facts = [
    todo.tags.length ? `Tags: ${todo.tags.map((t) => `#${t}`).join(' ')}` : '',
    todo.priority !== 'none' ? `Priority: ${PRIORITY_LABEL[todo.priority]}` : ''
  ].filter(Boolean)
  return [`# ${todo.title}`, todo.description.trim(), facts.join('\n')].filter(Boolean).join('\n\n')
}

/**
 * The state a to-do moves to when an agent starts on it: the last open state before the first
 * closed one ("In Progress" with the default states). Null when every state is closed.
 */
export function workingStateId(states: State[]): string | null {
  const firstClosed = states.findIndex((s) => s.closed)
  const open = (firstClosed < 0 ? states : states.slice(0, firstClosed)).filter((s) => !s.closed)
  return open.at(-1)?.id ?? null
}

/**
 * Where a to-do goes when it is sent: the working state, unless it already is there or further
 * along. Null to leave it where it is.
 */
export function stateAfterSend(todo: Todo, states: State[]): string | null {
  const target = workingStateId(states)
  if (!target) return null
  const at = states.findIndex((s) => s.id === todo.stateId)
  const to = states.findIndex((s) => s.id === target)
  return at < to ? target : null
}

/** The to-do's runs with `run` added, newest last, at most MAX_RUNS. */
export function addRun(runs: AgentRun[], run: AgentRun): AgentRun[] {
  return [...runs.filter((r) => r.terminalId !== run.terminalId), run].slice(-MAX_RUNS)
}

/** The runs with one run's state changed, or null when no run has that terminal or nothing changed. */
export function withRunState(runs: AgentRun[], terminalId: string, state: RunState, at: number): AgentRun[] | null {
  const run = runs.find((r) => r.terminalId === terminalId)
  if (!run || run.state === state) return null
  return runs.map((r) => (r === run ? { ...r, state, stateAt: at } : r))
}

/**
 * Storage key of the run index: terminal id → to-do id, so the worker can find the to-do an agent
 * status event is about without reading every to-do. Written by the worker at each launch.
 */
export const RUN_INDEX_KEY = 'runs'

/** Terminals the index remembers. Older ones drop off; their to-dos keep their last run state. */
export const MAX_INDEXED_RUNS = 50

export type RunIndex = Record<string, string>

/** The stored run index, or an empty one when it is missing or not valid. */
export function parseRunIndex(value: unknown): RunIndex {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {}
  return Object.fromEntries(
    Object.entries(value).filter((e): e is [string, string] => typeof e[1] === 'string' && e[1] !== '')
  )
}

/** The index with a terminal added last, at most MAX_INDEXED_RUNS entries. */
export function indexRun(index: RunIndex, terminalId: string, todoId: string): RunIndex {
  const entries = Object.entries(index).filter(([t]) => t !== terminalId)
  return Object.fromEntries([...entries, [terminalId, todoId]].slice(-MAX_INDEXED_RUNS))
}

/** The newest run, which is the one lists and cards show. */
export const latestRun = (todo: Todo): AgentRun | undefined => todo.runs.at(-1)

/**
 * How a workspace reads in a picker. Orca names a repo's main worktree after its branch, so many
 * are just "main"; the folder tells them apart.
 */
export function workspaceLabel(w: WorkspaceOption): string {
  const branch = w.branch?.replace(/^refs\/heads\//, '') ?? ''
  const base = w.folder || w.name
  const name = w.name !== base && w.name !== branch ? `${base} (${w.name})` : base
  return branch && branch !== base ? `${name} · ${branch}` : name
}

/** What to tell the person when handing a to-do to an agent failed, by Orca's error code. */
export function agentErrorText(code: string): string {
  switch (code) {
    case 'not_permitted':
    case 'approval_required':
      return 'Orca did not allow it. Approve the plugin again so it may start agents.'
    case 'unavailable':
    case 'unknown_method':
      return 'This Orca cannot reach the plugin worker. Update Orca, or copy the prompt instead.'
    case 'timeout':
      return 'The plugin worker did not answer in time. Try again.'
    case 'invalid_params':
      return 'Pick a workspace and write a prompt first.'
    default:
      return `Could not start the agent (${code}).`
  }
}
