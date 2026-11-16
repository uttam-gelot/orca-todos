// An agent run on a to-do, shown the way Orca shows its GitHub and Jira tasks: a status badge, and
// an "Agent →" button that turns into "Open →" once an agent works on the to-do. Both stay outline
// or ghost: in this plugin color carries state, and the primary button is only for New.

import { ArrowRight } from 'lucide-preact'
import { agentLabel, latestRun } from '../agents'
import { formatLong, t } from '../i18n/t'
import type { AgentRun, Todo } from '../model'
import { openAgentDialog, openRun } from '../store'
import { ago } from './ui'
import './AgentRun.css'

/** Who runs where, for tooltips and screen readers. */
export const runSummary = (run: AgentRun): string =>
  t.runSummary(agentLabel(run.agent), run.workspaceName, t.runStates[run.state])

/**
 * The run's state as a dot, with its label unless `dot`. Screen readers get the whole summary as
 * text (an `aria-label` on a plain span is often skipped); `decorative` hides it where the state is
 * already written next to it.
 */
export function RunBadge({
  run,
  dot,
  decorative,
  unseen,
  class: cls = ''
}: {
  run: AgentRun
  dot?: boolean
  decorative?: boolean
  /** The state changed after the to-do was last looked at: the badge stands out until it is. */
  unseen?: boolean
  class?: string
}) {
  const summary = unseen ? `${runSummary(run)}. ${t.newSinceLooked}` : runSummary(run)
  return (
    <span
      class={['run-badge', `run-badge--${run.state}`, unseen && 'run-badge--unseen', cls].filter(Boolean).join(' ')}
      title={summary}
      aria-hidden={decorative}
    >
      <span class="run-badge__dot" />
      {!dot && (
        <span class="run-badge__label" aria-hidden="true">
          {t.runStates[run.state]}
        </span>
      )}
      {!decorative && <span class="sr-only">{summary}</span>}
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
        title={`${t.openWorkspace(run.workspaceName)} (O)`}
        onClick={(e) => click(e, () => void openRun(run))}
      >
        {t.open}
        <ArrowRight />
      </button>
    )
  return (
    <button
      type="button"
      class={`btn btn--ghost btn--xs agent-button agent-button--idle ${cls}`}
      title={`${t.startAgentOnTodo} (S)`}
      aria-label={t.startAgentOnTodo}
      onClick={(e) => click(e, () => openAgentDialog(todo.id))}
    >
      {t.agentButton}
      <ArrowRight />
    </button>
  )
}

/** Every run of a to-do, newest first, each with its own Open. */
export function RunList({ todo }: { todo: Todo }) {
  if (!todo.runs.length) return null
  return (
    <section class="run-list" aria-label={t.agentRuns}>
      <header class="run-list__head">
        <h3 class="section-label">{t.agents}</h3>
        <button type="button" class="btn btn--ghost btn--xs" onClick={() => openAgentDialog(todo.id)}>
          {t.startAnother}
        </button>
      </header>
      <ul class="run-list__items">
        {[...todo.runs].reverse().map((run) => (
          <li key={run.terminalId} class="run-list__item">
            <RunBadge run={run} dot decorative />
            <span class="run-list__name">
              {agentLabel(run.agent)}
              <span class="run-list__where">{t.inWorkspace(run.workspaceName)}</span>
            </span>
            <span class="run-list__state">{t.runStates[run.state]}</span>
            <span class="count" title={formatLong(run.startedAt)}>
              {ago(run.startedAt)}
            </span>
            <button
              type="button"
              class="btn btn--ghost btn--xs"
              title={t.openWorkspace(run.workspaceName)}
              onClick={() => void openRun(run)}
            >
              {t.open}
              <ArrowRight />
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
