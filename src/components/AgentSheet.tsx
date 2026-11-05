// The "Send to agent" sheet: pick an agent CLI and a workspace, edit the prompt, then start the
// agent there through the plugin worker, or copy the prompt to paste anywhere.

import { useSignal } from '@preact/signals'
import { Bot, Copy, RotateCw } from 'lucide-preact'
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
import { Sheet, SheetHeader } from './ui'
import './AgentSheet.css'

const close = () => (sheet.value = null)

export function AgentSheet() {
  const todo = selected.value
  if (sheet.value !== 'agent' || !todo) return null
  return (
    <Sheet label="Send to agent" onClose={close}>
      <SheetHeader title="Send to agent" onClose={close} />
      <AgentForm key={todo.id} todo={todo} />
    </Sheet>
  )
}

function AgentForm({ todo }: { todo: Todo }) {
  const prompt = useSignal(buildPrompt(todo))
  const sending = useSignal(false)
  const error = useSignal<string | null>(null)
  const canSend = workerAvailable()
  const list = workspaceList.value
  const choice = agentChoice.value
  const target = stateAfterSend(todo, states.value)
  const ready = list.status === 'ready' && list.answer.workspaces.some((w) => w.id === choice.workspaceId)

  const send = async () => {
    if (sending.value) return
    sending.value = true
    error.value = await sendToAgent(todo.id, prompt.value)
    sending.value = false
    if (!error.value) close()
  }

  return (
    <form
      class="agent-sheet"
      onSubmit={(e) => {
        e.preventDefault()
        void send()
      }}
    >
      <div class="sheet__body">
        <label class="agent-sheet__field">
          <span class="agent-sheet__label">Agent</span>
          <select
            class="select"
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

        <div class="agent-sheet__field">
          <label class="agent-sheet__label" for="agent-workspace">
            Workspace
          </label>
          {!canSend ? (
            <p class="sheet__hint">
              Starting an agent needs Orca 1.4.248 or later. Copy the prompt and paste it into an agent instead.
            </p>
          ) : list.status === 'error' ? (
            <div class="agent-sheet__problem" role="alert">
              <span>{list.message}</span>
              <button type="button" class="btn btn--ghost btn--xs" onClick={() => void loadWorkspaces()}>
                <RotateCw />
                Retry
              </button>
            </div>
          ) : (
            <select
              id="agent-workspace"
              class="select"
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

        <label class="agent-sheet__field agent-sheet__field--grow">
          <span class="agent-sheet__label">Prompt</span>
          <textarea
            class="agent-sheet__prompt"
            value={prompt.value}
            spellcheck={false}
            onInput={(e) => (prompt.value = e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                void send()
              }
            }}
          />
        </label>

        <p class="sheet__hint">
          Orca opens a terminal in the workspace and starts the agent with this prompt
          {target ? `. The to-do moves to ${stateById.value.get(target)?.name}.` : '.'}
        </p>
        {error.value && (
          <p class="agent-sheet__error" role="alert">
            {error.value}
          </p>
        )}
      </div>

      <footer class="agent-sheet__actions">
        <button type="button" class="btn btn--outline btn--sm" onClick={() => copyPrompt(todo.id, prompt.value)}>
          <Copy />
          Copy prompt
        </button>
        <button
          type="submit"
          class="btn btn--primary btn--sm"
          disabled={!canSend || !ready || !prompt.value.trim() || sending.value}
        >
          <Bot />
          {sending.value ? 'Starting…' : 'Send'}
        </button>
      </footer>
    </form>
  )
}
