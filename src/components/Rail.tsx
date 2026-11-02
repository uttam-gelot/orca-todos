// Left navigator: scopes (all, states, tags, archived) with counts, and the week's numbers.

import { Archive, Hash, Inbox, Settings2 } from 'lucide-preact'
import type { ComponentChildren } from 'preact'
import { archivedCount, scope, scopeKey, setScope, sheet, summary, tagCounts, type Scope } from '../store'
import { IconButton, StateIcon } from './ui'
import './Rail.css'

function Item({
  target,
  icon,
  label,
  count
}: {
  target: Scope
  icon: ComponentChildren
  label: string
  count: number
}) {
  const current = scopeKey(scope.value) === scopeKey(target)
  return (
    <button type="button" class="nav-item" aria-current={current ? 'page' : undefined} onClick={() => setScope(target)}>
      {icon}
      <span class="nav-item__label">{label}</span>
      <span class="count">{count || ''}</span>
    </button>
  )
}

export function Rail() {
  const s = summary.value
  return (
    <nav class="rail" aria-label="To-do scopes">
      <div class="rail__scroll">
        <Item target={{ kind: 'all' }} icon={<Inbox />} label="All to-dos" count={s.total} />

        <div class="rail__section section-label">
          <span>States</span>
          <IconButton label="Edit states" class="btn--icon-xs" onClick={() => (sheet.value = 'states')}>
            <Settings2 />
          </IconButton>
        </div>
        {s.perState.map(({ state, count }) => (
          <Item
            key={state.id}
            target={{ kind: 'state', id: state.id }}
            icon={<StateIcon state={state} />}
            label={state.name}
            count={count}
          />
        ))}

        {tagCounts.value.length > 0 && (
          <>
            <div class="rail__section section-label">
              <span>Tags</span>
            </div>
            {tagCounts.value.map(([tag, count]) => (
              <Item key={tag} target={{ kind: 'tag', id: tag }} icon={<Hash />} label={tag} count={count} />
            ))}
          </>
        )}

        <div class="rail__gap" />
        <Item target={{ kind: 'archived' }} icon={<Archive />} label="Archived" count={archivedCount.value} />
      </div>
      <Progress />
    </nav>
  )
}

/** Share of live todos per state as one thin bar, with the headline numbers under it. `compact`
 * puts it all on one line for the narrow status bar. */
export function Progress({ compact = false }: { compact?: boolean }) {
  const s = summary.value
  return (
    <footer class={compact ? 'progress progress--compact' : 'progress'}>
      <div
        class="progress__bar"
        role="img"
        aria-label={s.perState.map(({ state, count }) => `${state.name} ${count}`).join(', ')}
      >
        {s.total > 0 &&
          s.perState.map(({ state, count }) =>
            count ? (
              <span key={state.id} class="progress__segment" style={{ flexGrow: count, background: state.color }} />
            ) : null
          )}
      </div>
      <dl class="progress__stats">
        <Stat term="Open" value={s.open} />
        <Stat term="Closed" value={s.closed} />
        <Stat term="Done this week" value={s.doneThisWeek} />
      </dl>
    </footer>
  )
}

function Stat({ term, value }: { term: string; value: number }) {
  return (
    <div class="progress__stat">
      <dt class="progress__term">{term}</dt>
      <dd class="progress__value">{value}</dd>
    </div>
  )
}

/** The rail as a native select, for widths where the rail is hidden. */
export function ScopeSelect() {
  const s = summary.value
  const label = (name: string, n: number) => (n ? `${name} (${n})` : name)
  return (
    <select
      class="scope-select"
      aria-label="Scope"
      value={scopeKey(scope.value)}
      onChange={(e) => {
        const [kind, ...rest] = e.currentTarget.value.split(':')
        const id = rest.join(':')
        setScope(kind === 'state' || kind === 'tag' ? { kind, id } : { kind: kind as 'all' | 'archived' })
      }}
    >
      <option value="all">{label('All to-dos', s.total)}</option>
      <optgroup label="States">
        {s.perState.map(({ state, count }) => (
          <option key={state.id} value={`state:${state.id}`}>
            {label(state.name, count)}
          </option>
        ))}
      </optgroup>
      {tagCounts.value.length > 0 && (
        <optgroup label="Tags">
          {tagCounts.value.map(([tag, count]) => (
            <option key={tag} value={`tag:${tag}`}>
              {label(`#${tag}`, count)}
            </option>
          ))}
        </optgroup>
      )}
      <option value="archived">{label('Archived', archivedCount.value)}</option>
    </select>
  )
}
