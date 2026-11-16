// An agent run on a to-do, shown the way Orca shows its GitHub and Jira tasks: a status badge, and
// an "Agent →" button that turns into "Open →" once an agent works on the to-do. Both stay outline
// or ghost: in this plugin color carries state, and the primary button is only for New.

import { ArrowRight } from 'lucide-preact'
import { agentLabel, latestRun, RUN_LABEL } from '../agents'
import type { AgentRun, Todo } from '../model'
import { openAgentDialog, openRun } from '../store'
import { ago } from './ui'
import './AgentRun.css'

/** Who runs where, for tooltips and screen readers. */
export const runSummary = (run: AgentRun): string =>
  `${agentLabel(run.agent)} in ${run.workspaceName}: ${RUN_LABEL[run.state]}`

/**
 * The run's state as a dot, with its label unless `dot`. Screen readers get the whole summary as
 * text (an `aria-label` on a plain span is often skipped); `decorative` hides it where the state is
 * already written next to it.
 */
export function RunBadge({
  run,
  dot,
  decorative,
  class: cls = ''
}: {
  run: AgentRun
  dot?: boolean
  decorative?: boolean
  class?: string
}) {
  return (
    <span class={`run-badge run-badge--${run.state} ${cls}`} title={runSummary(run)} aria-hidden={decorative}>
      <span class="run-badge__dot" />
      {!dot && (
        <span class="run-badge__label" aria-hidden="true">
          {RUN_LABEL[run.state]}
        </span>
      )}
      {!decorative && <span class="sr-only">{runSummary(run)}</span>}
    </span>
  )
}

/**
 * "Open →" shows the workspace of the newest run; "Agent →" opens the start dialog. `idle` marks
 * the start button so a row can hide it until hovered or selected.
 */
export function AgentButton({ todo, class: cls = '' }: { todo: Todo; class?: string }) {
  const run = latestRun(todo)
  const click = (e: MouseEvent, act: () => void) => {
    e.stopPropagation()
    act()
  }
  if (run)
    return (
      <button
        type="button"
        class={`btn btn--outline btn--xs agent-button ${cls}`}
        title={`Open ${run.workspaceName} (O)`}
        onClick={(e) => click(e, () => void openRun(run))}
      >
        Open
        <ArrowRight />
      </button>
    )
  return (
    <button
      type="button"
      class={`btn btn--ghost btn--xs agent-button agent-button--idle ${cls}`}
      title="Start an agent on this to-do (S)"
      aria-label="Start an agent on this to-do"
      onClick={(e) => click(e, () => openAgentDialog(todo.id))}
    >
      Agent
      <ArrowRight />
    </button>
  )
}

/** Every run of a to-do, newest first, each with its own Open. */
export function RunList({ todo }: { todo: Todo }) {
  if (!todo.runs.length) return null
  return (
    <section class="run-list" aria-label="Agent runs">
      <header class="run-list__head">
        <h3 class="section-label">Agents</h3>
        <button type="button" class="btn btn--ghost btn--xs" onClick={() => openAgentDialog(todo.id)}>
          Start another
        </button>
      </header>
      <ul class="run-list__items">
        {[...todo.runs].reverse().map((run) => (
          <li key={run.terminalId} class="run-list__item">
            <RunBadge run={run} dot decorative />
            <span class="run-list__name">
              {agentLabel(run.agent)}
              <span class="run-list__where"> in {run.workspaceName}</span>
            </span>
            <span class="run-list__state">{RUN_LABEL[run.state]}</span>
            <span class="count" title={new Date(run.startedAt).toLocaleString()}>
              {ago(run.startedAt)}
            </span>
            <button
              type="button"
              class="btn btn--ghost btn--xs"
              title={`Open ${run.workspaceName}`}
              onClick={() => void openRun(run)}
            >
              Open
              <ArrowRight />
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
