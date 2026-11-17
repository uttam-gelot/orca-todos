// The interface text in English: the source every other language follows. A message is a string,
// or a function when it takes values (counts, names) or has keys or icons inside it.
//
// The worker imports this too, so it must stay free of the DOM and of signals.

import type { ComponentChildren } from 'preact'
import type { Priority, RunState } from '../model'

type Node = ComponentChildren

export const en = {
  // Shared
  close: 'Close',
  dismiss: 'Dismiss',
  back: 'Back',
  loading: 'Loading',
  open: 'Open',
  add: 'Add',
  edit: 'Edit',
  copy: 'Copy',
  done: 'Done',
  keep: 'Keep',
  delete: 'Delete',
  retry: 'Retry',

  // Default states, named in the person's language when the plugin first runs
  stateBacklog: 'Backlog',
  stateTodo: 'ToDo',
  stateDoing: 'In Progress',
  stateDone: 'Done',

  // Scopes and the navigator
  allTodos: 'All to-dos',
  archived: 'Archived',
  state: 'State',
  states: 'States',
  tags: 'Tags',
  todoScopes: 'To-do scopes',
  scope: 'Scope',
  statOpen: 'Open',
  statClosed: 'Closed',
  statDoneThisWeek: 'Done this week',

  // App shell and empty states
  todoDetails: 'To-do details',
  loadErrorTitle: 'Could not load your to-dos',
  loadErrorBody: 'Orca plugin storage did not answer. Nothing was changed.',
  tryAgain: 'Try again',
  emptyTitle: 'No to-dos yet',
  emptyBody: (newKey: Node, enter: Node, first: Node, last: Node): Node[] => [
    'Press ',
    newKey,
    ' to add one, type a title, then ',
    enter,
    '. Move it between states with ',
    first,
    '–',
    last,
    '.'
  ],
  addATodo: 'Add a to-do',
  noMatchesTitle: 'No matches',
  noMatchesBody: 'Nothing here matches the search or filters.',
  clearSearchAndFilter: 'Clear search and filters',
  nothingArchivedTitle: 'Nothing archived',
  nothingArchivedBody: (archiveKey: Node): Node[] => [
    'Archive a to-do with ',
    archiveKey,
    ', or every closed one from the display menu. Settings can archive closed ones automatically.'
  ],
  noOpenTagged: (tag: string) => `No open to-dos tagged #${tag}.`,
  showAllTodos: 'Show all to-dos',
  undo: 'Undo',
  saveFailed: 'Could not save the last change. It may be lost when Orca reloads.',

  // Header
  view: 'View',
  list: 'List',
  board: 'Board',
  search: 'Search',
  searchTodos: 'Search to-dos',
  searchPlaceholder: 'Search titles and notes',
  clearSearch: 'Clear search',
  newTodo: 'New to-do',
  new: 'New',
  showEveryPriority: 'Show every priority',
  showOnlyHigh: 'Show only high priority',
  highWord: 'high',
  displayOptions: 'Display options',
  displayOptionsOn: 'Display options (filter or order on)',
  priority: 'Priority',
  anyPriority: 'Any',
  order: 'Order',
  orderManual: 'Manual',
  orderPriority: 'Priority',
  orderUpdated: 'Recently updated',
  orderCreated: 'Newest',
  orderDue: 'Due date',
  dueFilter: 'Due',
  dueAny: 'Any',
  dueOverdue: 'Overdue',
  dueByToday: 'Today or earlier',
  dueWeek: 'Within 7 days',
  showOnlyOverdue: 'Show only overdue to-dos',
  showEveryDue: 'Show every to-do',
  overdueWord: 'overdue',
  resetDisplay: 'Reset filters and order',
  archiveClosed: 'Archive closed to-dos',
  editStates: 'Edit states',
  keyboardShortcuts: 'Keyboard shortcuts',

  // Lists, boards and the composer
  todos: 'To-dos',
  addTo: (state: string) => `Add to ${state}`,
  addTodo: 'Add to-do',
  expand: (state: string) => `Expand ${state}`,
  collapse: (state: string) => `Collapse ${state}`,
  updatedOn: (date: string) => `Updated ${date}`,
  newTodoIn: (state: string) => `New to-do in ${state}`,
  composerPlaceholder: 'To-do title (#tag !high @fri)',

  // Small shared pieces
  reopen: 'Reopen',
  markDone: 'Mark done',
  priorities: { none: 'No priority', low: 'Low', med: 'Medium', high: 'High' } as Record<Priority, string>,
  priorityTitle: (label: string) => `${label} priority`,
  checklistSummary: (done: number, total: number) => `Checklist: ${done} of ${total} done`,
  hasNotes: 'Has notes',
  /** Compact ages: "now", then a number and a unit such as "5m" or "3d". */
  agoNow: 'now',
  ago: { s: 's', m: 'm', h: 'h', d: 'd', w: 'w', mo: 'mo', y: 'y' },

  // Due dates
  dueToday: 'Today',
  dueTomorrow: 'Tomorrow',
  dueYesterday: 'Yesterday',
  due: 'Due',
  dueDate: 'Due date',
  dueTime: 'Due time',
  addDue: 'Add a due date',
  addTime: 'Add time',
  clearDue: 'Clear due date',
  /** A due chip's tooltip. `full` is the date in words. */
  dueTitle: (full: string, overdue: boolean) => (overdue ? `Overdue: was due ${full}` : `Due ${full}`),

  // Due reminders, shown as Orca notifications. The body is the to-do's title.
  reminderDueNow: 'Due now',
  reminderDueToday: 'Due today',
  /** One notification for several to-dos coming due together. */
  reminderMany: (n: number) => `${n} to-dos are due`,

  // Projects
  projects: 'Projects',
  project: 'Project',
  noProject: 'No project',
  /** The project chip's button: opens its workspace in Orca. */
  openProject: (name: string) => `Open ${name} in Orca`,
  projectNotFound: (name: string) => `No workspace in Orca belongs to ${name}.`,

  // The details pane
  archive: 'Archive',
  unarchive: 'Unarchive',
  copyAsPrompt: 'Copy as agent prompt',
  archivedNotice: 'Archived. It is hidden from every scope except Archived.',
  title: 'Title',
  showTag: (tag: string) => `Show #${tag}`,
  removeTag: (tag: string) => `Remove #${tag}`,
  addTag: 'Add tag',
  addTags: 'Add tags',
  bold: 'Bold',
  italic: 'Italic',
  code: 'Code',
  link: 'Link',
  bulletedList: 'Bulleted list',
  checklist: 'Checklist',
  editDescription: 'Edit description',
  notesEmpty: 'Add notes, links or a checklist. Markdown works.',
  notesLabel: 'Description (markdown)',
  notesPlaceholder: 'Markdown: **bold**, - lists, - [ ] tasks, [links](https://…)',
  /** The date line under the details. `closed` is set only for a closed to-do. */
  dates: (created: string, updated: string, closed?: string) =>
    `Created ${created} · Updated ${updated}${closed ? ` · Closed ${closed}` : ''}`,

  // The states sheet
  statesHint: 'Order here is the order of list groups and board columns. Closed states count as done.',
  newStateName: 'New state name',
  addState: 'Add state',
  stateColor: (state: string) => `${state} color`,
  stateName: 'State name',
  closedHint: 'To-dos here count as done',
  closedLabel: 'Closed',
  moveUp: 'Move up',
  moveDown: 'Move down',
  deleteAndMove: (count: number, state: string) => `Delete, move ${count} to ${state}`,
  deleteState: 'Delete state',

  // The shortcuts sheet
  keysMove: 'Move around',
  keysNextPrev: 'Next / previous to-do',
  keysColumns: 'Previous / next column (board)',
  keysScopes: 'Previous / next scope',
  keysOpen: 'Open details (again: edit title)',
  keysBack: 'Close, clear, go back',
  keysCreate: 'Create and find',
  keysNew: 'New to-do',
  keysSearch: 'Search',
  keysView: 'Switch list / board',
  keysChange: 'Change the selected to-do',
  keysToState: 'Move to state 1–9',
  keysShiftState: 'Move to previous / next state',
  keysDone: 'Mark done / reopen',
  keysPriority: 'Cycle priority',
  keysNotes: 'Edit description',
  keysAgent: 'Start an agent on it',
  keysOpenRun: "Open the agent's workspace",
  keysCopy: 'Copy as agent prompt',
  keysArchive: 'Archive / unarchive',
  keysDelete: 'Delete',
  keysUndo: 'Undo delete or archive',

  // Agent runs
  runStates: {
    starting: 'Starting',
    working: 'Working',
    blocked: 'Needs you',
    waiting: 'Waiting',
    done: 'Finished'
  } as Record<RunState, string>,
  runSummary: (agent: string, workspace: string, state: string) => `${agent} in ${workspace}: ${state}`,
  newSinceLooked: 'New since you last looked.',
  openWorkspace: (workspace: string) => `Open ${workspace}`,
  startAgentOnTodo: 'Start an agent on this to-do',
  agentButton: 'Agent',
  agentRuns: 'Agent runs',
  agents: 'Agents',
  startAnother: 'Start another',
  inWorkspace: (workspace: string) => ` in ${workspace}`,

  // The start agent dialog
  startAgent: 'Start agent',
  workspace: 'Workspace',
  agent: 'Agent',
  needsNewerOrca:
    'Starting an agent from here needs Orca 1.4.248 or later. Copy the prompt, then paste it into an agent.',
  prompt: 'Prompt',
  movesTo: (state: string) => `New terminal · moves to ${state}`,
  opensNewTerminal: 'Opens in a new terminal',
  starting: 'Starting…',
  copyPrompt: 'Copy prompt',
  noWorkspaces: 'Orca has no workspaces yet. Create one in Orca, then retry.',
  loadingWorkspaces: 'Loading workspaces…',
  openNow: ' (open now)',

  // Toasts and errors
  deleted: (title: string) => `Deleted “${title}”`,
  archivedTodo: (title: string) => `Archived “${title}”`,
  restoredTodo: (title: string) => `Restored “${title}”`,
  archivedClosed: (n: number) => `Archived ${n} closed to-do${n === 1 ? '' : 's'}`,
  copiedPrompt: 'Copied as an agent prompt',
  clipboardRefused: 'Could not copy. Orca did not allow the clipboard.',
  startedAgent: (agent: string, workspace: string) => `Started ${agent} in ${workspace}`,
  promptMayMiss: (started: string) => `${started}. If the prompt does not show up there, copy it with Y.`,
  errNotPermitted: 'Orca did not allow it. In Settings → Plugins, approve the access of ToDos Board again.',
  errUnreachable: 'This Orca cannot reach the plugin worker. Update Orca, or copy the prompt instead.',
  errTimeout: 'The plugin worker did not answer in time. Try again.',
  errInvalid: 'Pick a workspace and write a prompt first.',
  errStartAgent: 'Could not start the agent. Try again.',
  errOpenWorkspace: 'Could not open the workspace. Try again.',

  // The Orca status bar item (written by the worker)
  statusNone: 'No open to-dos',
  statusOpen: (open: number, high: number, overdue: number) =>
    [`${open} open`, high ? `${high} high` : '', overdue ? `${overdue} overdue` : ''].filter(Boolean).join(' · '),
  statusTip: (open: number, high: number, overdue: number) =>
    open
      ? `ToDos: ${open} open to-do${open === 1 ? '' : 's'}${high ? `, ${high} high priority` : ''}${overdue ? `, ${overdue} overdue` : ''}. Press to show or hide the right sidebar.`
      : 'ToDos: nothing open. Press to show or hide the right sidebar.'
}

/** A catalog's shape: the English one with each string widened, so a translation can say anything. */
export type Messages = { [K in keyof typeof en]: (typeof en)[K] extends string ? string : (typeof en)[K] }
