// Pure rules for handing a to-do to an agent: the agents to offer, the prompt, and run bookkeeping.
// No Orca and no DOM, so the panel and the worker share it and tests call it directly.

import { PRIORITY_LABEL, type AgentRun, type RunState, type State, type Todo } from './model'
import type { WorkspaceOption } from './protocol'

export type AgentChoice = { id: string; label: string }

/**
 * Agent CLIs to offer, by Orca's agent id. Orca knows more; these are the common ones. Orca starts
 * the CLI as installed on the workspace's host, so a missing CLI fails in its terminal.
 */
export const AGENTS: AgentChoice[] = [
  { id: 'claude', label: 'Claude' },
  { id: 'codex', label: 'Codex' },
  { id: 'gemini', label: 'Gemini' },
  { id: 'opencode', label: 'OpenCode' },
  { id: 'cursor', label: 'Cursor' },
  { id: 'copilot', label: 'GitHub Copilot' },
  { id: 'amp', label: 'Amp' },
  { id: 'aider', label: 'Aider' },
  { id: 'goose', label: 'Goose' },
  { id: 'droid', label: 'Droid' },
  { id: 'kiro', label: 'Kiro' },
  { id: 'qwen-code', label: 'Qwen Code' },
  { id: 'grok', label: 'Grok' }
]

export const DEFAULT_AGENT = 'claude'

export const agentLabel = (id: string): string => AGENTS.find((a) => a.id === id)?.label ?? id

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
