// The "Start agent" dialog, laid out like Orca's New Workspace composer: workspace and agent up
// front, the prompt under "Advanced", one primary action with ⌘↵. The worker starts the agent; the
// prompt can also be copied to paste anywhere.

import { useSignal } from '@preact/signals'
import { ChevronDown, ChevronRight, Copy, RotateCw, X } from 'lucide-preact'
import { AGENTS, buildPrompt, stateAfterSend, workspaceLabel } from '../agents'
import type { Todo } from '../model'
import { workerAvailable } from '../orca'
import {
  agentChoice,
  copyPrompt,
  loadWorkspaces,
  selected,
  sendToAgent,
  sheet,
  stateById,
  states,
  workspaceList
} from '../store'
import { IconButton, Kbd, MOD, Sheet } from './ui'
import './AgentDialog.css'

const close = () => (sheet.value = null)

export function AgentDialog() {
  const todo = selected.value
  if (sheet.value !== 'agent' || !todo) return null
  return (
    <Sheet label="Start agent" onClose={close} center>
      <AgentForm key={todo.id} todo={todo} />
    </Sheet>
  )
}

function AgentForm({ todo }: { todo: Todo }) {
  const prompt = useSignal(buildPrompt(todo))
  const advanced = useSignal(false)
  const sending = useSignal(false)
  const error = useSignal<string | null>(null)
  const canSend = workerAvailable()
  const list = workspaceList.value
  const choice = agentChoice.value
  const target = stateAfterSend(todo, states.value)
  const ready = list.status === 'ready' && list.answer.workspaces.some((w) => w.id === choice.workspaceId)

  const send = async () => {
    if (sending.value || !canSend) return
    sending.value = true
    error.value = await sendToAgent(todo.id, prompt.value)
    sending.value = false
    if (!error.value) close()
  }

  return (
    <form
      class="agent-dialog"
      onSubmit={(e) => {
        e.preventDefault()
        void send()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault()
          void send()
        }
      }}
    >
      <header class="agent-dialog__head">
        <div class="agent-dialog__heading">
          <h2 class="agent-dialog__title">Start agent</h2>
          <p class="agent-dialog__subject">{todo.title}</p>
        </div>
        <IconButton label="Close (Esc)" onClick={close}>
          <X />
        </IconButton>
      </header>

      <div class="agent-dialog__body">
        <div class="agent-dialog__field">
          <label class="agent-dialog__label" for="agent-workspace">
            Workspace
          </label>
          {!canSend ? (
            <p class="agent-dialog__hint">
              Starting an agent needs Orca 1.4.248 or later. Copy the prompt and paste it into an agent instead.
            </p>
          ) : list.status === 'error' ? (
            <div class="agent-dialog__error" role="alert">
              <span>{list.message}</span>
              <button type="button" class="btn btn--ghost btn--xs" onClick={() => void loadWorkspaces()}>
                <RotateCw />
                Retry
              </button>
            </div>
          ) : (
            <select
              id="agent-workspace"
              class="select agent-dialog__control"
              disabled={list.status === 'loading'}
              value={choice.workspaceId}
              onChange={(e) => (agentChoice.value = { ...choice, workspaceId: e.currentTarget.value })}
            >
              {list.status === 'loading' ? (
                <option value="">Loading workspaces…</option>
              ) : (
                list.answer.workspaces.map((w) => (
                  <option key={w.id} value={w.id}>
                    {workspaceLabel(w)}
                    {w.id === list.answer.focusedId ? ' (open now)' : ''}
                  </option>
                ))
              )}
            </select>
          )}
        </div>

        <label class="agent-dialog__field">
          <span class="agent-dialog__label">Agent</span>
          <select
            class="select agent-dialog__control"
            autofocus
            value={choice.agent}
            onChange={(e) => (agentChoice.value = { ...choice, agent: e.currentTarget.value })}
          >
            {AGENTS.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
        </label>

        <div class="agent-dialog__advanced">
          <button
            type="button"
            class="btn btn--ghost btn--xs agent-dialog__toggle"
            aria-expanded={advanced.value}
            onClick={() => (advanced.value = !advanced.value)}
          >
            Advanced
            {advanced.value ? <ChevronDown /> : <ChevronRight />}
          </button>
          {advanced.value && (
            <label class="agent-dialog__field">
              <span class="agent-dialog__label">Prompt</span>
              <textarea
                class="agent-dialog__prompt"
                value={prompt.value}
                spellcheck={false}
                onInput={(e) => (prompt.value = e.currentTarget.value)}
              />
            </label>
          )}
        </div>

        {error.value && (
          <p class="agent-dialog__error" role="alert">
            {error.value}
          </p>
        )}
      </div>

      <footer class="agent-dialog__foot">
        <span class="agent-dialog__hint">
          {target ? `Moves to ${stateById.value.get(target)?.name}` : 'Runs in a new terminal'}
        </span>
        <button
          type="button"
          class="btn btn--ghost btn--sm"
          title="Copy prompt (Y)"
          onClick={() => copyPrompt(todo.id, prompt.value)}
        >
          <Copy />
          Copy prompt
        </button>
        <button
          type="submit"
          class="btn btn--primary btn--sm"
          disabled={!canSend || !ready || !prompt.value.trim() || sending.value}
        >
          {sending.value ? 'Starting…' : 'Start agent'}
          <Kbd small class="agent-dialog__kbd">
            {MOD}↵
          </Kbd>
        </button>
      </footer>
    </form>
  )
}
