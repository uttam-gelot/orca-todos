// The "Start agent" dialog, laid out like Orca's New Workspace composer: workspace and agent up
// front, then the prompt the agent will get, one primary action with ⌘↵. The worker starts the
// agent; the prompt can also be copied to paste anywhere.

import { useSignal } from '@preact/signals'
import { Copy, Pencil, RotateCw, X } from 'lucide-preact'
import { AGENTS, buildPrompt, groupWorkspaces, stateAfterSend, workspaceLabel } from '../agents'
import type { Todo } from '../model'
import { t } from '../i18n/t'
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

/** Prompts the person edited, by to-do, so Esc or a click outside does not lose them. */
const drafts = new Map<string, string>()

export function AgentDialog() {
  const todo = selected.value
  if (sheet.value !== 'agent' || !todo) return null
  return (
    <Sheet label={t.startAgent} onClose={close} center>
      <AgentForm key={todo.id} todo={todo} />
    </Sheet>
  )
}

function AgentForm({ todo }: { todo: Todo }) {
  const draft = drafts.get(todo.id)
  const prompt = useSignal(draft ?? buildPrompt(todo))
  const editing = useSignal(draft !== undefined)
  const sending = useSignal(false)
  const error = useSignal<string | null>(null)
  const canSend = workerAvailable()
  const list = workspaceList.value
  const choice = agentChoice.value
  const target = stateAfterSend(todo, states.value)
  const ready = list.status === 'ready' && list.answer.workspaces.some((w) => w.id === choice.workspaceId)
  const copy = () => copyPrompt(todo.id, prompt.value)

  const send = async () => {
    if (sending.value || !canSend || !ready) return
    sending.value = true
    error.value = await sendToAgent(todo.id, prompt.value)
    sending.value = false
    if (error.value) return
    drafts.delete(todo.id)
    close()
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
          if (canSend) void send()
          else copy()
        }
      }}
    >
      <header class="agent-dialog__head">
        <div class="agent-dialog__heading">
          <h2 class="agent-dialog__title">{t.startAgent}</h2>
          <p class="agent-dialog__subject" title={todo.title}>
            {todo.title}
          </p>
        </div>
        <IconButton label={`${t.close} (Esc)`} onClick={close}>
          <X />
        </IconButton>
      </header>

      <fieldset class="agent-dialog__body" disabled={sending.value}>
        {canSend ? (
          <>
            <div class="agent-dialog__field">
              <label class="agent-dialog__label" for="agent-workspace">
                {t.workspace}
              </label>
              <WorkspacePicker />
            </div>
            <div class="agent-dialog__field">
              <label class="agent-dialog__label" for="agent-agent">
                {t.agent}
              </label>
              <select
                id="agent-agent"
                class="select agent-dialog__control"
                value={choice.agent}
                onChange={(e) => (agentChoice.value = { ...choice, agent: e.currentTarget.value })}
              >
                {AGENTS.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : (
          <p class="agent-dialog__notice">{t.needsNewerOrca}</p>
        )}

        <div class="agent-dialog__field">
          <div class="agent-dialog__label-row">
            <label class="agent-dialog__label" for="agent-prompt">
              {t.prompt}
            </label>
            {!editing.value && (
              <button
                type="button"
                class="btn btn--ghost btn--xs agent-dialog__edit"
                onClick={() => (editing.value = true)}
              >
                <Pencil />
                {t.edit}
              </button>
            )}
          </div>
          {editing.value ? (
            <textarea
              id="agent-prompt"
              class="agent-dialog__prompt"
              value={prompt.value}
              spellcheck={false}
              ref={(el) => el?.focus()}
              onInput={(e) => {
                prompt.value = e.currentTarget.value
                drafts.set(todo.id, prompt.value)
              }}
            />
          ) : (
            <pre id="agent-prompt" class="agent-dialog__preview" tabIndex={0}>
              {prompt.value}
            </pre>
          )}
        </div>

        {error.value && (
          <p class="agent-dialog__error" role="alert">
            {error.value}
          </p>
        )}
      </fieldset>

      <footer class="agent-dialog__foot">
        {canSend ? (
          <>
            <span class="agent-dialog__hint">
              {target ? t.movesTo(stateById.value.get(target)?.name ?? '') : t.opensNewTerminal}
            </span>
            <button type="button" class="btn btn--ghost btn--sm" onClick={copy}>
              <Copy />
              {t.copy}
            </button>
            <button
              type="submit"
              class="btn btn--primary btn--sm agent-dialog__submit"
              disabled={!ready || !prompt.value.trim() || sending.value}
              aria-busy={sending.value}
            >
              {sending.value ? t.starting : t.startAgent}
              <Kbd small class="agent-dialog__kbd">
                {MOD}↵
              </Kbd>
            </button>
          </>
        ) : (
          <>
            <span class="agent-dialog__hint" />
            <button type="button" class="btn btn--primary btn--sm" autofocus onClick={copy}>
              <Copy />
              {t.copyPrompt}
              <Kbd small class="agent-dialog__kbd">
                {MOD}↵
              </Kbd>
            </button>
          </>
        )}
      </footer>
    </form>
  )
}

/** The workspace select, grouped by project, or what stops it: loading, an error, no workspaces. */
function WorkspacePicker() {
  const list = workspaceList.value
  const choice = agentChoice.value
  if (list.status === 'error' || (list.status === 'ready' && !list.answer.workspaces.length))
    return (
      <div class="agent-dialog__error" role="alert">
        <span>{list.status === 'error' ? list.message : t.noWorkspaces}</span>
        <button type="button" class="btn btn--ghost btn--xs" autofocus onClick={() => void loadWorkspaces()}>
          <RotateCw />
          {t.retry}
        </button>
      </div>
    )
  return (
    <select
      id="agent-workspace"
      class="select agent-dialog__control"
      autofocus
      aria-busy={list.status === 'loading'}
      value={choice.workspaceId}
      onChange={(e) => (agentChoice.value = { ...choice, workspaceId: e.currentTarget.value })}
    >
      {list.status === 'loading' ? (
        <option value="">{t.loadingWorkspaces}</option>
      ) : (
        groupWorkspaces(list.answer.workspaces).map((group) => (
          <optgroup key={group.name} label={group.name}>
            {group.workspaces.map((w) => (
              <option key={w.id} value={w.id}>
                {workspaceLabel(w)}
                {w.id === list.answer.focusedId ? t.openNow : ''}
              </option>
            ))}
          </optgroup>
        ))
      )}
    </select>
  )
}
