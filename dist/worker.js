// src/protocol.ts
var REQUEST = {
  workspaces: "workspaces.list",
  launch: "agent.launch",
  open: "workspace.open"
};
var isRecord = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
var isString = (v) => typeof v === "string";
var lastSegment = (path) => path.replace(/[\\/]+$/, "").split(/[\\/]/).at(-1) ?? "";
function parseWorkspace(value) {
  if (!isRecord(value) || !isString(value.id) || !isString(value.name))
    return null;
  return {
    id: value.id,
    name: value.name,
    kind: value.kind === "folder" ? "folder" : "worktree",
    branch: isString(value.branch) ? value.branch : null,
    folder: isString(value.folder) ? value.folder : isString(value.path) ? lastSegment(value.path) : "",
    project: isString(value.project) && value.project.trim() ? value.project : null
  };
}
function parseLaunchInput(value) {
  if (!isRecord(value))
    return null;
  const { todoId, workspaceId, agent, prompt } = value;
  const filled = (v) => isString(v) && v.trim() !== "";
  if (!filled(todoId) || !filled(workspaceId) || !filled(agent) || !filled(prompt))
    return null;
  return { todoId, workspaceId, agent, prompt };
}
function parseOpenInput(value) {
  if (!isRecord(value) || !isString(value.workspaceId) || !value.workspaceId.trim())
    return null;
  return { workspaceId: value.workspaceId };
}

// src/i18n/en.ts
var en = {
  close: "Close",
  dismiss: "Dismiss",
  back: "Back",
  loading: "Loading",
  open: "Open",
  add: "Add",
  edit: "Edit",
  copy: "Copy",
  done: "Done",
  keep: "Keep",
  delete: "Delete",
  retry: "Retry",
  stateBacklog: "Backlog",
  stateTodo: "ToDo",
  stateDoing: "In Progress",
  stateDone: "Done",
  allTodos: "All to-dos",
  archived: "Archived",
  state: "State",
  states: "States",
  tags: "Tags",
  todoScopes: "To-do scopes",
  scope: "Scope",
  statOpen: "Open",
  statClosed: "Closed",
  statDoneThisWeek: "Done this week",
  todoDetails: "To-do details",
  loadErrorTitle: "Could not load your to-dos",
  loadErrorBody: "Orca plugin storage did not answer. Nothing was changed.",
  tryAgain: "Try again",
  emptyTitle: "No to-dos yet",
  emptyBody: (newKey, enter, first, last) => [
    "Press ",
    newKey,
    " to add one, type a title, then ",
    enter,
    ". Move it between states with ",
    first,
    "–",
    last,
    "."
  ],
  addATodo: "Add a to-do",
  noMatchesTitle: "No matches",
  noMatchesBody: "Nothing here matches the search or filters.",
  clearSearchAndFilter: "Clear search and filters",
  nothingArchivedTitle: "Nothing archived",
  nothingArchivedBody: (archiveKey) => [
    "Archive a to-do with ",
    archiveKey,
    ", or every closed one from the display menu. Settings can archive closed ones automatically."
  ],
  noOpenTagged: (tag) => `No open to-dos tagged #${tag}.`,
  showAllTodos: "Show all to-dos",
  undo: "Undo",
  saveFailed: "Could not save the last change. It may be lost when Orca reloads.",
  view: "View",
  list: "List",
  board: "Board",
  search: "Search",
  searchTodos: "Search to-dos",
  searchPlaceholder: "Search titles and notes",
  clearSearch: "Clear search",
  newTodo: "New to-do",
  new: "New",
  showEveryPriority: "Show every priority",
  showOnlyHigh: "Show only high priority",
  highWord: "high",
  displayOptions: "Display options",
  displayOptionsOn: "Display options (filter or order on)",
  priority: "Priority",
  anyPriority: "Any",
  order: "Order",
  orderManual: "Manual",
  orderPriority: "Priority",
  orderUpdated: "Recently updated",
  orderCreated: "Newest",
  orderDue: "Due date",
  dueFilter: "Due",
  dueAny: "Any",
  dueOverdue: "Overdue",
  dueByToday: "Today or earlier",
  dueWeek: "Within 7 days",
  showOnlyOverdue: "Show only overdue to-dos",
  showEveryDue: "Show every to-do",
  overdueWord: "overdue",
  resetDisplay: "Reset filters and order",
  archiveClosed: "Archive closed to-dos",
  editStates: "Edit states",
  keyboardShortcuts: "Keyboard shortcuts",
  todos: "To-dos",
  addTo: (state) => `Add to ${state}`,
  addTodo: "Add to-do",
  expand: (state) => `Expand ${state}`,
  collapse: (state) => `Collapse ${state}`,
  updatedOn: (date) => `Updated ${date}`,
  newTodoIn: (state) => `New to-do in ${state}`,
  composerPlaceholder: "To-do title (#tag !high @fri)",
  reopen: "Reopen",
  markDone: "Mark done",
  priorities: { none: "No priority", low: "Low", med: "Medium", high: "High" },
  priorityTitle: (label) => `${label} priority`,
  checklistSummary: (done, total) => `Checklist: ${done} of ${total} done`,
  hasNotes: "Has notes",
  agoNow: "now",
  ago: { s: "s", m: "m", h: "h", d: "d", w: "w", mo: "mo", y: "y" },
  dueToday: "Today",
  dueTomorrow: "Tomorrow",
  dueYesterday: "Yesterday",
  due: "Due",
  dueDate: "Due date",
  dueTime: "Due time",
  addDue: "Add a due date",
  addTime: "Add time",
  clearDue: "Clear due date",
  dueTitle: (full, overdue) => overdue ? `Overdue: was due ${full}` : `Due ${full}`,
  reminderDueNow: "Due now",
  reminderDueToday: "Due today",
  reminderMany: (n) => `${n} to-dos are due`,
  projects: "Projects",
  project: "Project",
  noProject: "No project",
  openProject: (name) => `Open ${name} in Orca`,
  projectNotFound: (name) => `No workspace in Orca belongs to ${name}.`,
  archive: "Archive",
  unarchive: "Unarchive",
  copyAsPrompt: "Copy as agent prompt",
  archivedNotice: "Archived. It is hidden from every scope except Archived.",
  title: "Title",
  showTag: (tag) => `Show #${tag}`,
  removeTag: (tag) => `Remove #${tag}`,
  addTag: "Add tag",
  addTags: "Add tags",
  bold: "Bold",
  italic: "Italic",
  code: "Code",
  link: "Link",
  bulletedList: "Bulleted list",
  checklist: "Checklist",
  editDescription: "Edit description",
  notesEmpty: "Add notes, links or a checklist. Markdown works.",
  notesLabel: "Description (markdown)",
  notesPlaceholder: "Markdown: **bold**, - lists, - [ ] tasks, [links](https://…)",
  dates: (created, updated, closed) => `Created ${created} · Updated ${updated}${closed ? ` · Closed ${closed}` : ""}`,
  statesHint: "Order here is the order of list groups and board columns. Closed states count as done.",
  newStateName: "New state name",
  addState: "Add state",
  stateColor: (state) => `${state} color`,
  stateName: "State name",
  closedHint: "To-dos here count as done",
  closedLabel: "Closed",
  moveUp: "Move up",
  moveDown: "Move down",
  deleteAndMove: (count, state) => `Delete, move ${count} to ${state}`,
  deleteState: "Delete state",
  keysMove: "Move around",
  keysNextPrev: "Next / previous to-do",
  keysColumns: "Previous / next column (board)",
  keysScopes: "Previous / next scope",
  keysOpen: "Open details (again: edit title)",
  keysBack: "Close, clear, go back",
  keysCreate: "Create and find",
  keysNew: "New to-do",
  keysSearch: "Search",
  keysView: "Switch list / board",
  keysChange: "Change the selected to-do",
  keysToState: "Move to state 1–9",
  keysShiftState: "Move to previous / next state",
  keysDone: "Mark done / reopen",
  keysPriority: "Cycle priority",
  keysNotes: "Edit description",
  keysAgent: "Start an agent on it",
  keysOpenRun: "Open the agent's workspace",
  keysCopy: "Copy as agent prompt",
  keysArchive: "Archive / unarchive",
  keysDelete: "Delete",
  keysUndo: "Undo delete or archive",
  runStates: {
    starting: "Starting",
    working: "Working",
    blocked: "Needs you",
    waiting: "Waiting",
    done: "Finished"
  },
  runSummary: (agent, workspace, state) => `${agent} in ${workspace}: ${state}`,
  newSinceLooked: "New since you last looked.",
  openWorkspace: (workspace) => `Open ${workspace}`,
  startAgentOnTodo: "Start an agent on this to-do",
  agentButton: "Agent",
  agentRuns: "Agent runs",
  agents: "Agents",
  startAnother: "Start another",
  inWorkspace: (workspace) => ` in ${workspace}`,
  startAgent: "Start agent",
  workspace: "Workspace",
  agent: "Agent",
  needsNewerOrca: "Starting an agent from here needs Orca 1.4.248 or later. Copy the prompt, then paste it into an agent.",
  prompt: "Prompt",
  movesTo: (state) => `New terminal · moves to ${state}`,
  opensNewTerminal: "Opens in a new terminal",
  starting: "Starting…",
  copyPrompt: "Copy prompt",
  noWorkspaces: "Orca has no workspaces yet. Create one in Orca, then retry.",
  loadingWorkspaces: "Loading workspaces…",
  openNow: " (open now)",
  deleted: (title) => `Deleted “${title}”`,
  archivedTodo: (title) => `Archived “${title}”`,
  restoredTodo: (title) => `Restored “${title}”`,
  archivedClosed: (n) => `Archived ${n} closed to-do${n === 1 ? "" : "s"}`,
  copiedPrompt: "Copied as an agent prompt",
  clipboardRefused: "Could not copy. Orca did not allow the clipboard.",
  startedAgent: (agent, workspace) => `Started ${agent} in ${workspace}`,
  promptMayMiss: (started) => `${started}. If the prompt does not show up there, copy it with Y.`,
  errNotPermitted: "Orca did not allow it. In Settings → Plugins, approve the access of ToDos Board again.",
  errUnreachable: "This Orca cannot reach the plugin worker. Update Orca, or copy the prompt instead.",
  errTimeout: "The plugin worker did not answer in time. Try again.",
  errInvalid: "Pick a workspace and write a prompt first.",
  errStartAgent: "Could not start the agent. Try again.",
  errOpenWorkspace: "Could not open the workspace. Try again.",
  statusNone: "No open to-dos",
  statusOpen: (open, high, overdue) => [`${open} open`, high ? `${high} high` : "", overdue ? `${overdue} overdue` : ""].filter(Boolean).join(" · "),
  statusTip: (open, high, overdue) => open ? `ToDos: ${open} open to-do${open === 1 ? "" : "s"}${high ? `, ${high} high priority` : ""}${overdue ? `, ${overdue} overdue` : ""}. Press to show or hide the right sidebar.` : "ToDos: nothing open. Press to show or hide the right sidebar."
};

// src/due.ts
var DUE = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/;
var DAY_MS = 24 * 60 * 60 * 1000;
function parseDue(value) {
  if (typeof value !== "string")
    return null;
  const m = DUE.exec(value);
  if (!m)
    return null;
  const [y, mo, d, h, mi] = m.slice(1).map((part) => Number(part ?? 0));
  const date = new Date(y, mo - 1, d);
  const real = date.getFullYear() === y && date.getMonth() === mo - 1 && date.getDate() === d && h < 24 && mi < 60;
  return real ? value : null;
}
var hasTime = (due) => due.length > 10;
var dueDay = (due) => due.slice(0, 10);
var dueTime = (due) => hasTime(due) ? due.slice(11, 16) : "";
var joinDue = (day, time) => time ? `${day}T${time}` : day;
function dayStart(due) {
  const [y, m, d] = dueDay(due).split("-").map(Number);
  return new Date(y, m - 1, d).getTime();
}
function dueAt(due) {
  if (!hasTime(due))
    return dayStart(due) + DAY_MS - 1;
  const [h, mi] = dueTime(due).split(":").map(Number);
  const [y, m, d] = dueDay(due).split("-").map(Number);
  return new Date(y, m - 1, d, h, mi).getTime();
}
function remindAt(due, morning) {
  return hasTime(due) ? dueAt(due) : dueAt(joinDue(dueDay(due), morning));
}
function daysUntil(due, now) {
  const today = new Date(now);
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return Math.round((dayStart(due) - start) / DAY_MS);
}

// src/model.ts
var TODO_KEY = "todo:";
var STATES_KEY = "states";
var RUN_STATES = ["starting", "working", "blocked", "waiting", "done"];
var PRIORITIES = ["high", "med", "low", "none"];
var DEFAULT_STATES = [
  { id: "backlog", name: "Backlog", color: "#8b8b8b", closed: false },
  { id: "todo", name: "ToDo", color: "#3b82f6", closed: false },
  { id: "doing", name: "In Progress", color: "#f59e0b", closed: false },
  { id: "done", name: "Done", color: "#22c55e", closed: true }
];
var QUICK_PRIORITY = new Map([
  ["high", "high"],
  ["h", "high"],
  ["med", "med"],
  ["m", "med"],
  ["low", "low"],
  ["l", "low"]
]);
function inDueFilter(todo, due, now) {
  if (!due)
    return true;
  if (!todo.due || todo.closedAt !== undefined)
    return false;
  if (due === "overdue")
    return dueAt(todo.due) < now;
  return daysUntil(todo.due, now) < (due === "today" ? 1 : 7);
}
var DAY_MS2 = 24 * 60 * 60 * 1000;
function staleClosed(todos, states, days, now) {
  if (days <= 0)
    return [];
  const closed = new Set(states.filter((s) => s.closed).map((s) => s.id));
  const cutoff = now - days * DAY_MS2;
  return todos.filter((t) => !t.archived && closed.has(t.stateId) && t.closedAt !== undefined && t.closedAt <= cutoff);
}
var isRecord2 = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
var isString2 = (v) => typeof v === "string";
var isNumber = (v) => typeof v === "number" && Number.isFinite(v);
function parseTodo(value) {
  if (!isRecord2(value))
    return null;
  const { id, title, stateId, order, createdAt, updatedAt } = value;
  if (!isString2(id) || !isString2(title) || !isString2(stateId))
    return null;
  if (!isNumber(order) || !isNumber(createdAt) || !isNumber(updatedAt))
    return null;
  const priority = PRIORITIES.includes(value.priority) ? value.priority : "none";
  const todo = {
    id,
    title,
    stateId,
    order,
    createdAt,
    updatedAt,
    description: isString2(value.description) ? value.description : "",
    tags: Array.isArray(value.tags) ? value.tags.filter(isString2) : [],
    priority,
    archived: value.archived === true,
    runs: Array.isArray(value.runs) ? value.runs.map(parseRun).filter((r) => r !== null) : []
  };
  if (isNumber(value.closedAt))
    todo.closedAt = value.closedAt;
  const due = parseDue(value.due);
  if (due)
    todo.due = due;
  if (isString2(value.project) && value.project.trim())
    todo.project = value.project.trim().slice(0, 200);
  return todo;
}
function parseRun(value) {
  if (!isRecord2(value))
    return null;
  const { terminalId, agent, workspaceId, workspaceName, startedAt, state, stateAt } = value;
  if (!isString2(terminalId) || !isString2(agent) || !isString2(workspaceId) || !isString2(workspaceName))
    return null;
  if (!isNumber(startedAt))
    return null;
  return {
    terminalId,
    agent,
    workspaceId,
    workspaceName,
    startedAt,
    state: RUN_STATES.includes(state) ? state : "starting",
    stateAt: isNumber(stateAt) ? stateAt : startedAt
  };
}
function parseStates(value) {
  if (!Array.isArray(value) || value.length === 0)
    return null;
  const list = [];
  for (const s of value) {
    if (!isRecord2(s) || !isString2(s.id) || !isString2(s.name) || !isString2(s.color))
      return null;
    list.push({ id: s.id, name: s.name, color: s.color, closed: s.closed === true });
  }
  return list;
}

// src/agents.ts
var AGENTS = [
  { id: "claude", label: "Claude", command: "claude" },
  { id: "codex", label: "Codex", command: "codex" },
  { id: "gemini", label: "Gemini", command: "gemini", promptFlag: "--prompt-interactive" },
  { id: "opencode", label: "OpenCode", command: "opencode", promptFlag: "--prompt" },
  { id: "cursor", label: "Cursor", command: "cursor-agent" },
  { id: "copilot", label: "GitHub Copilot", command: "copilot", promptFlag: "-i" },
  { id: "droid", label: "Droid", command: "droid" },
  { id: "grok", label: "Grok", command: "grok", promptFlag: "--" },
  { id: "amp", label: "Amp" },
  { id: "aider", label: "Aider" },
  { id: "goose", label: "Goose" },
  { id: "kiro", label: "Kiro" },
  { id: "qwen-code", label: "Qwen Code" }
];
var agentLabel = (id) => AGENTS.find((a) => a.id === id)?.label ?? id;
var shellQuote = (value) => `'${value.replaceAll("'", `'\\''`)}'`;
function startCommand(agentId, prompt) {
  const agent = AGENTS.find((a) => a.id === agentId);
  if (!agent?.command)
    return null;
  return [agent.command, agent.promptFlag, shellQuote(prompt)].filter(Boolean).join(" ");
}
function withRunState(runs, terminalId, state, at) {
  const run = runs.find((r) => r.terminalId === terminalId);
  if (!run || run.state === state)
    return null;
  return runs.map((r) => r === run ? { ...r, state, stateAt: at } : r);
}
var RUN_INDEX_KEY = "runs";
var MAX_INDEXED_RUNS = 50;
function parseRunIndex(value) {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return {};
  return Object.fromEntries(Object.entries(value).filter((e) => typeof e[1] === "string" && e[1] !== ""));
}
function indexRun(index, terminalId, todoId) {
  const entries = Object.entries(index).filter(([t]) => t !== terminalId);
  return Object.fromEntries([...entries, [terminalId, todoId]].slice(-MAX_INDEXED_RUNS));
}

// src/errors.ts
class HandlerError extends Error {
  name = "HandlerError";
  code;
  constructor(code, message, options) {
    super(message, options);
    this.code = code;
  }
}

// src/worker/handlers.ts
var isRecord3 = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
var isString3 = (v) => typeof v === "string";
var branchName = (branch) => branch?.replace(/^refs\/heads\//, "") ?? "";
function parseContext(value) {
  if (!isRecord3(value) || !isString3(value.displayName))
    return null;
  return {
    workspaceId: isString3(value.workspaceId) && value.workspaceId ? value.workspaceId : null,
    displayName: value.displayName,
    branch: isString3(value.branch) ? value.branch : ""
  };
}
function focusedWorkspaceId(workspaces, context) {
  if (!context)
    return null;
  const { workspaceId } = context;
  if (workspaceId && workspaces.some((w) => w.id === workspaceId))
    return workspaceId;
  const same = workspaces.filter((w) => w.name === context.displayName && branchName(w.branch) === branchName(context.branch));
  return same.length === 1 ? same[0].id : null;
}
async function listWorkspaces(orca) {
  const [listed, context] = await Promise.all([
    orca.host.call("workspace.list", {}),
    orca.host.call("workspace.readContext", {})
  ]);
  if (!isRecord3(listed) || !Array.isArray(listed.workspaces))
    throw new HandlerError("action_failed", "Orca answered workspace.list with something unexpected");
  const workspaces = listed.workspaces.map(parseWorkspace).filter((w) => w !== null);
  return {
    workspaces,
    focusedId: focusedWorkspaceId(workspaces, parseContext(context)),
    truncated: listed.truncated === true
  };
}
var readKey = async (orca, key) => {
  const answer = await orca.host.call("storage.get", { key });
  return isRecord3(answer) ? answer.value : null;
};
var writeKey = (orca, key, value) => orca.host.call("storage.set", { key, value });
var terminalOf = (answer, method) => {
  if (isRecord3(answer) && isString3(answer.terminalId) && answer.terminalId)
    return answer.terminalId;
  throw new HandlerError("action_failed", `Orca answered ${method} with something unexpected`);
};
async function launchAgent(orca, input, platform = process.platform) {
  const launch = parseLaunchInput(input);
  if (!launch)
    throw new HandlerError("invalid_params", "A launch needs a to-do, a workspace, an agent and a prompt");
  const { todoId, workspaceId, agent, prompt } = launch;
  const command = platform === "win32" ? null : startCommand(agent, prompt);
  const terminalId = command ? terminalOf(await orca.host.call("terminal.create", { workspaceId, title: agentLabel(agent), command }), "terminal.create") : terminalOf(await orca.host.call("agent.launch", { workspaceId, agent, prompt }), "agent.launch");
  orca.log(`Started ${agent} for to-do ${todoId} in ${workspaceId} (terminal ${terminalId})`);
  try {
    await writeKey(orca, RUN_INDEX_KEY, indexRun(parseRunIndex(await readKey(orca, RUN_INDEX_KEY)), terminalId, todoId));
  } catch (error) {
    orca.log(`Could not index terminal ${terminalId}; its status will not show: ${String(error)}`);
  }
  return { terminalId, prompt: command ? "command" : "typed" };
}
async function openWorkspace(orca, input) {
  const open = parseOpenInput(input);
  if (!open)
    throw new HandlerError("invalid_params", "Opening needs a workspace");
  await orca.host.call("workspace.open", { workspaceId: open.workspaceId });
  orca.log(`Opened workspace ${open.workspaceId}`);
  return { opened: true };
}
var REPORTED = ["working", "blocked", "waiting", "done"];
function parseStatusEvent(value) {
  if (!isRecord3(value) || !isString3(value.terminalId) || !value.terminalId)
    return null;
  if (!REPORTED.includes(value.state))
    return null;
  const at = typeof value.receivedAt === "number" ? value.receivedAt : Date.now();
  return { terminalId: value.terminalId, state: value.state, at };
}
async function onAgentStatus(orca, payload) {
  const event = parseStatusEvent(payload);
  if (!event)
    return;
  const todoId = parseRunIndex(await readKey(orca, RUN_INDEX_KEY))[event.terminalId];
  if (!todoId)
    return;
  const key = TODO_KEY + todoId;
  const todo = parseTodo(await readKey(orca, key));
  if (!todo) {
    orca.log(`To-do ${todoId} is gone or not valid; ignoring terminal ${event.terminalId}`);
    return;
  }
  const runs = withRunState(todo.runs, event.terminalId, event.state, event.at);
  if (!runs)
    return;
  await writeKey(orca, key, { ...todo, runs });
  orca.log(`To-do ${todoId}: terminal ${event.terminalId} is ${event.state}`);
}

// src/i18n/de.ts
var plural = (n, one, many) => n === 1 ? one : many;
var de = {
  close: "Schließen",
  dismiss: "Ausblenden",
  back: "Zurück",
  loading: "Wird geladen",
  open: "Öffnen",
  add: "Hinzufügen",
  edit: "Bearbeiten",
  copy: "Kopieren",
  done: "Fertig",
  keep: "Behalten",
  delete: "Löschen",
  retry: "Erneut versuchen",
  stateBacklog: "Backlog",
  stateTodo: "Zu erledigen",
  stateDoing: "In Arbeit",
  stateDone: "Erledigt",
  allTodos: "Alle Aufgaben",
  archived: "Archiviert",
  state: "Status",
  states: "Status",
  tags: "Tags",
  todoScopes: "Aufgabenansichten",
  scope: "Ansicht",
  statOpen: "Offen",
  statClosed: "Geschlossen",
  statDoneThisWeek: "Diese Woche erledigt",
  todoDetails: "Aufgabendetails",
  loadErrorTitle: "Deine Aufgaben konnten nicht geladen werden",
  loadErrorBody: "Der Plugin-Speicher von Orca hat nicht geantwortet. Nichts wurde geändert.",
  tryAgain: "Erneut versuchen",
  emptyTitle: "Noch keine Aufgaben",
  emptyBody: (newKey, enter, first, last) => [
    "Drücke ",
    newKey,
    ", um eine hinzuzufügen, gib einen Titel ein, dann ",
    enter,
    ". Mit ",
    first,
    "–",
    last,
    " wechselst du den Status."
  ],
  addATodo: "Aufgabe hinzufügen",
  noMatchesTitle: "Keine Treffer",
  noMatchesBody: "Nichts passt zur Suche oder zu den Filtern.",
  clearSearchAndFilter: "Suche und Filter zurücksetzen",
  nothingArchivedTitle: "Nichts archiviert",
  nothingArchivedBody: (archiveKey) => [
    "Archiviere eine Aufgabe mit ",
    archiveKey,
    " oder alle geschlossenen über das Anzeigemenü. In den Einstellungen geht das auch automatisch."
  ],
  noOpenTagged: (tag) => `Keine offenen Aufgaben mit #${tag}.`,
  showAllTodos: "Alle Aufgaben anzeigen",
  undo: "Rückgängig",
  saveFailed: "Die letzte Änderung konnte nicht gespeichert werden. Sie geht beim Neuladen von Orca eventuell verloren.",
  view: "Ansicht",
  list: "Liste",
  board: "Board",
  search: "Suchen",
  searchTodos: "Aufgaben durchsuchen",
  searchPlaceholder: "Titel und Notizen durchsuchen",
  clearSearch: "Suche löschen",
  newTodo: "Neue Aufgabe",
  new: "Neu",
  showEveryPriority: "Alle Prioritäten anzeigen",
  showOnlyHigh: "Nur hohe Priorität anzeigen",
  highWord: "hoch",
  displayOptions: "Anzeigeoptionen",
  displayOptionsOn: "Anzeigeoptionen (Filter oder Sortierung aktiv)",
  priority: "Priorität",
  anyPriority: "Alle",
  order: "Sortierung",
  orderManual: "Manuell",
  orderPriority: "Priorität",
  orderUpdated: "Zuletzt geändert",
  orderCreated: "Neueste",
  orderDue: "Fälligkeit",
  dueFilter: "Fällig",
  dueAny: "Alle",
  dueOverdue: "Überfällig",
  dueByToday: "Heute oder früher",
  dueWeek: "In 7 Tagen",
  showOnlyOverdue: "Nur überfällige Aufgaben anzeigen",
  showEveryDue: "Alle Aufgaben anzeigen",
  overdueWord: "überfällig",
  resetDisplay: "Filter und Sortierung zurücksetzen",
  archiveClosed: "Geschlossene Aufgaben archivieren",
  editStates: "Status bearbeiten",
  keyboardShortcuts: "Tastenkürzel",
  todos: "Aufgaben",
  addTo: (state) => `Zu ${state} hinzufügen`,
  addTodo: "Aufgabe hinzufügen",
  expand: (state) => `${state} ausklappen`,
  collapse: (state) => `${state} einklappen`,
  updatedOn: (date) => `Geändert ${date}`,
  newTodoIn: (state) => `Neue Aufgabe in ${state}`,
  composerPlaceholder: "Aufgabentitel (#tag !high @fri)",
  reopen: "Wieder öffnen",
  markDone: "Als erledigt markieren",
  priorities: { none: "Keine Priorität", low: "Niedrig", med: "Mittel", high: "Hoch" },
  priorityTitle: (label) => `Priorität: ${label}`,
  checklistSummary: (done, total) => `Checkliste: ${done} von ${total} erledigt`,
  hasNotes: "Hat Notizen",
  agoNow: "jetzt",
  ago: { s: "s", m: "min", h: "h", d: "T", w: "W", mo: "M", y: "J" },
  dueToday: "Heute",
  dueTomorrow: "Morgen",
  dueYesterday: "Gestern",
  due: "Fällig",
  dueDate: "Fälligkeitsdatum",
  dueTime: "Fälligkeitszeit",
  addDue: "Fälligkeit hinzufügen",
  addTime: "Uhrzeit hinzufügen",
  clearDue: "Fälligkeit entfernen",
  dueTitle: (full, overdue) => overdue ? `Überfällig: war fällig am ${full}` : `Fällig am ${full}`,
  reminderDueNow: "Jetzt fällig",
  reminderDueToday: "Heute fällig",
  reminderMany: (n) => `${n} Aufgaben sind fällig`,
  projects: "Projekte",
  project: "Projekt",
  noProject: "Kein Projekt",
  openProject: (name) => `${name} in Orca öffnen`,
  projectNotFound: (name) => `Kein Arbeitsbereich in Orca gehört zu ${name}.`,
  archive: "Archivieren",
  unarchive: "Wiederherstellen",
  copyAsPrompt: "Als Agent-Prompt kopieren",
  archivedNotice: "Archiviert. Nur noch unter Archiviert sichtbar.",
  title: "Titel",
  showTag: (tag) => `#${tag} anzeigen`,
  removeTag: (tag) => `#${tag} entfernen`,
  addTag: "Tag hinzufügen",
  addTags: "Tags hinzufügen",
  bold: "Fett",
  italic: "Kursiv",
  code: "Code",
  link: "Link",
  bulletedList: "Aufzählung",
  checklist: "Checkliste",
  editDescription: "Beschreibung bearbeiten",
  notesEmpty: "Notizen, Links oder eine Checkliste hinzufügen. Markdown wird unterstützt.",
  notesLabel: "Beschreibung (Markdown)",
  notesPlaceholder: "Markdown: **fett**, - Listen, - [ ] Aufgaben, [Links](https://…)",
  dates: (created, updated, closed) => `Erstellt ${created} · Geändert ${updated}${closed ? ` · Geschlossen ${closed}` : ""}`,
  statesHint: "Diese Reihenfolge gilt für die Gruppen der Liste und die Spalten des Boards. Geschlossene Status zählen als erledigt.",
  newStateName: "Name des neuen Status",
  addState: "Status hinzufügen",
  stateColor: (state) => `Farbe von ${state}`,
  stateName: "Statusname",
  closedHint: "Aufgaben hier zählen als erledigt",
  closedLabel: "Geschlossen",
  moveUp: "Nach oben",
  moveDown: "Nach unten",
  deleteAndMove: (count, state) => `Löschen, ${count} nach ${state} verschieben`,
  deleteState: "Status löschen",
  keysMove: "Bewegen",
  keysNextPrev: "Nächste / vorige Aufgabe",
  keysColumns: "Vorige / nächste Spalte (Board)",
  keysScopes: "Vorige / nächste Ansicht",
  keysOpen: "Details öffnen (nochmal: Titel bearbeiten)",
  keysBack: "Schließen, leeren, zurück",
  keysCreate: "Erstellen und finden",
  keysNew: "Neue Aufgabe",
  keysSearch: "Suchen",
  keysView: "Liste / Board wechseln",
  keysChange: "Ausgewählte Aufgabe ändern",
  keysToState: "In Status 1–9 verschieben",
  keysShiftState: "In vorigen / nächsten Status",
  keysDone: "Erledigt / wieder öffnen",
  keysPriority: "Priorität wechseln",
  keysNotes: "Beschreibung bearbeiten",
  keysAgent: "Einen Agenten darauf starten",
  keysOpenRun: "Arbeitsbereich des Agenten öffnen",
  keysCopy: "Als Agent-Prompt kopieren",
  keysArchive: "Archivieren / wiederherstellen",
  keysDelete: "Löschen",
  keysUndo: "Löschen oder Archivieren rückgängig",
  runStates: {
    starting: "Startet",
    working: "Arbeitet",
    blocked: "Braucht dich",
    waiting: "Wartet",
    done: "Fertig"
  },
  runSummary: (agent, workspace, state) => `${agent} in ${workspace}: ${state}`,
  newSinceLooked: "Neu seit deinem letzten Blick.",
  openWorkspace: (workspace) => `${workspace} öffnen`,
  startAgentOnTodo: "Einen Agenten auf diese Aufgabe ansetzen",
  agentButton: "Agent",
  agentRuns: "Agent-Läufe",
  agents: "Agenten",
  startAnother: "Weiteren starten",
  inWorkspace: (workspace) => ` in ${workspace}`,
  startAgent: "Agent starten",
  workspace: "Arbeitsbereich",
  agent: "Agent",
  needsNewerOrca: "Einen Agenten von hier zu starten erfordert Orca 1.4.248 oder neuer. Kopiere den Prompt und füge ihn in einen Agenten ein.",
  prompt: "Prompt",
  movesTo: (state) => `Neues Terminal · wechselt zu ${state}`,
  opensNewTerminal: "Öffnet sich in einem neuen Terminal",
  starting: "Startet…",
  copyPrompt: "Prompt kopieren",
  noWorkspaces: "Orca hat noch keine Arbeitsbereiche. Lege einen in Orca an und versuche es erneut.",
  loadingWorkspaces: "Arbeitsbereiche werden geladen…",
  openNow: " (gerade offen)",
  deleted: (title) => `„${title}“ gelöscht`,
  archivedTodo: (title) => `„${title}“ archiviert`,
  restoredTodo: (title) => `„${title}“ wiederhergestellt`,
  archivedClosed: (n) => plural(n, "1 geschlossene Aufgabe archiviert", `${n} geschlossene Aufgaben archiviert`),
  copiedPrompt: "Als Agent-Prompt kopiert",
  clipboardRefused: "Kopieren fehlgeschlagen. Orca hat die Zwischenablage nicht erlaubt.",
  startedAgent: (agent, workspace) => `${agent} in ${workspace} gestartet`,
  promptMayMiss: (started) => `${started}. Falls der Prompt dort nicht erscheint, kopiere ihn mit Y.`,
  errNotPermitted: "Orca hat es nicht erlaubt. Bestätige unter Einstellungen → Plugins den Zugriff von ToDos Board erneut.",
  errUnreachable: "Diese Orca-Version erreicht den Plugin-Worker nicht. Aktualisiere Orca oder kopiere stattdessen den Prompt.",
  errTimeout: "Der Plugin-Worker hat nicht rechtzeitig geantwortet. Versuche es erneut.",
  errInvalid: "Wähle zuerst einen Arbeitsbereich und schreibe einen Prompt.",
  errStartAgent: "Der Agent konnte nicht gestartet werden. Versuche es erneut.",
  errOpenWorkspace: "Der Arbeitsbereich konnte nicht geöffnet werden. Versuche es erneut.",
  statusNone: "Keine offenen Aufgaben",
  statusOpen: (open, high, overdue) => [`${open} offen`, high ? `${high} hoch` : "", overdue ? `${overdue} überfällig` : ""].filter(Boolean).join(" · "),
  statusTip: (open, high, overdue) => open ? `ToDos: ${plural(open, "1 offene Aufgabe", `${open} offene Aufgaben`)}${high ? `, ${high} mit hoher Priorität` : ""}${overdue ? `, ${overdue} überfällig` : ""}. Klicken, um die rechte Seitenleiste ein- oder auszublenden.` : "ToDos: nichts offen. Klicken, um die rechte Seitenleiste ein- oder auszublenden."
};

// src/i18n/es.ts
var plural2 = (n, one, many) => n === 1 ? one : many;
var es = {
  close: "Cerrar",
  dismiss: "Descartar",
  back: "Atrás",
  loading: "Cargando",
  open: "Abrir",
  add: "Añadir",
  edit: "Editar",
  copy: "Copiar",
  done: "Hecho",
  keep: "Conservar",
  delete: "Eliminar",
  retry: "Reintentar",
  stateBacklog: "Pendientes",
  stateTodo: "Por hacer",
  stateDoing: "En curso",
  stateDone: "Hecho",
  allTodos: "Todas las tareas",
  archived: "Archivadas",
  state: "Estado",
  states: "Estados",
  tags: "Etiquetas",
  todoScopes: "Vistas de tareas",
  scope: "Vista",
  statOpen: "Abiertas",
  statClosed: "Cerradas",
  statDoneThisWeek: "Hechas esta semana",
  todoDetails: "Detalles de la tarea",
  loadErrorTitle: "No se pudieron cargar tus tareas",
  loadErrorBody: "El almacenamiento de plugins de Orca no respondió. No se cambió nada.",
  tryAgain: "Reintentar",
  emptyTitle: "Aún no hay tareas",
  emptyBody: (newKey, enter, first, last) => [
    "Pulsa ",
    newKey,
    " para añadir una, escribe un título y pulsa ",
    enter,
    ". Muévela entre estados con ",
    first,
    "–",
    last,
    "."
  ],
  addATodo: "Añadir una tarea",
  noMatchesTitle: "Sin resultados",
  noMatchesBody: "Nada coincide con la búsqueda o los filtros.",
  clearSearchAndFilter: "Borrar búsqueda y filtros",
  nothingArchivedTitle: "Nada archivado",
  nothingArchivedBody: (archiveKey) => [
    "Archiva una tarea con ",
    archiveKey,
    ", o todas las cerradas desde el menú de visualización. En Ajustes puedes archivarlas automáticamente."
  ],
  noOpenTagged: (tag) => `No hay tareas abiertas con #${tag}.`,
  showAllTodos: "Mostrar todas las tareas",
  undo: "Deshacer",
  saveFailed: "No se pudo guardar el último cambio. Puede perderse cuando Orca se recargue.",
  view: "Vista",
  list: "Lista",
  board: "Tablero",
  search: "Buscar",
  searchTodos: "Buscar tareas",
  searchPlaceholder: "Buscar en títulos y notas",
  clearSearch: "Borrar búsqueda",
  newTodo: "Nueva tarea",
  new: "Nueva",
  showEveryPriority: "Mostrar todas las prioridades",
  showOnlyHigh: "Mostrar solo prioridad alta",
  highWord: "alta",
  displayOptions: "Opciones de visualización",
  displayOptionsOn: "Opciones de visualización (filtro u orden activo)",
  priority: "Prioridad",
  anyPriority: "Cualquiera",
  order: "Orden",
  orderManual: "Manual",
  orderPriority: "Prioridad",
  orderUpdated: "Actualizadas recientemente",
  orderCreated: "Más recientes",
  orderDue: "Fecha límite",
  dueFilter: "Vence",
  dueAny: "Cualquiera",
  dueOverdue: "Vencidas",
  dueByToday: "Hoy o antes",
  dueWeek: "En 7 días",
  showOnlyOverdue: "Mostrar solo tareas vencidas",
  showEveryDue: "Mostrar todas las tareas",
  overdueWord: "vencidas",
  resetDisplay: "Restablecer filtros y orden",
  archiveClosed: "Archivar tareas cerradas",
  editStates: "Editar estados",
  keyboardShortcuts: "Atajos de teclado",
  todos: "Tareas",
  addTo: (state) => `Añadir a ${state}`,
  addTodo: "Añadir tarea",
  expand: (state) => `Expandir ${state}`,
  collapse: (state) => `Contraer ${state}`,
  updatedOn: (date) => `Actualizada el ${date}`,
  newTodoIn: (state) => `Nueva tarea en ${state}`,
  composerPlaceholder: "Título de la tarea (#etiqueta !high @fri)",
  reopen: "Reabrir",
  markDone: "Marcar como hecha",
  priorities: { none: "Sin prioridad", low: "Baja", med: "Media", high: "Alta" },
  priorityTitle: (label) => `Prioridad ${label.toLowerCase()}`,
  checklistSummary: (done, total) => `Lista: ${done} de ${total} hechas`,
  hasNotes: "Tiene notas",
  agoNow: "ahora",
  ago: { s: "s", m: "min", h: "h", d: "d", w: "sem", mo: "mes", y: "a" },
  dueToday: "Hoy",
  dueTomorrow: "Mañana",
  dueYesterday: "Ayer",
  due: "Vence",
  dueDate: "Fecha límite",
  dueTime: "Hora límite",
  addDue: "Añadir fecha límite",
  addTime: "Añadir hora",
  clearDue: "Quitar fecha límite",
  dueTitle: (full, overdue) => overdue ? `Vencida: vencía el ${full}` : `Vence el ${full}`,
  reminderDueNow: "Vence ahora",
  reminderDueToday: "Vence hoy",
  reminderMany: (n) => `Vencen ${n} tareas`,
  projects: "Proyectos",
  project: "Proyecto",
  noProject: "Sin proyecto",
  openProject: (name) => `Abrir ${name} en Orca`,
  projectNotFound: (name) => `Ningún espacio de trabajo de Orca pertenece a ${name}.`,
  archive: "Archivar",
  unarchive: "Desarchivar",
  copyAsPrompt: "Copiar como prompt para agente",
  archivedNotice: "Archivada. Solo aparece en Archivadas.",
  title: "Título",
  showTag: (tag) => `Mostrar #${tag}`,
  removeTag: (tag) => `Quitar #${tag}`,
  addTag: "Añadir etiqueta",
  addTags: "Añadir etiquetas",
  bold: "Negrita",
  italic: "Cursiva",
  code: "Código",
  link: "Enlace",
  bulletedList: "Lista con viñetas",
  checklist: "Lista de comprobación",
  editDescription: "Editar descripción",
  notesEmpty: "Añade notas, enlaces o una lista de comprobación. Admite Markdown.",
  notesLabel: "Descripción (Markdown)",
  notesPlaceholder: "Markdown: **negrita**, - listas, - [ ] tareas, [enlaces](https://…)",
  dates: (created, updated, closed) => `Creada ${created} · Actualizada ${updated}${closed ? ` · Cerrada ${closed}` : ""}`,
  statesHint: "Este orden es el de los grupos de la lista y las columnas del tablero. Los estados cerrados cuentan como hechos.",
  newStateName: "Nombre del nuevo estado",
  addState: "Añadir estado",
  stateColor: (state) => `Color de ${state}`,
  stateName: "Nombre del estado",
  closedHint: "Las tareas aquí cuentan como hechas",
  closedLabel: "Cerrado",
  moveUp: "Subir",
  moveDown: "Bajar",
  deleteAndMove: (count, state) => `Eliminar y mover ${count} a ${state}`,
  deleteState: "Eliminar estado",
  keysMove: "Moverse",
  keysNextPrev: "Tarea siguiente / anterior",
  keysColumns: "Columna anterior / siguiente (tablero)",
  keysScopes: "Vista anterior / siguiente",
  keysOpen: "Abrir detalles (otra vez: editar título)",
  keysBack: "Cerrar, borrar, volver",
  keysCreate: "Crear y buscar",
  keysNew: "Nueva tarea",
  keysSearch: "Buscar",
  keysView: "Cambiar lista / tablero",
  keysChange: "Cambiar la tarea seleccionada",
  keysToState: "Mover al estado 1–9",
  keysShiftState: "Mover al estado anterior / siguiente",
  keysDone: "Marcar como hecha / reabrir",
  keysPriority: "Cambiar prioridad",
  keysNotes: "Editar descripción",
  keysAgent: "Iniciar un agente con ella",
  keysOpenRun: "Abrir el espacio de trabajo del agente",
  keysCopy: "Copiar como prompt para agente",
  keysArchive: "Archivar / desarchivar",
  keysDelete: "Eliminar",
  keysUndo: "Deshacer eliminar o archivar",
  runStates: {
    starting: "Iniciando",
    working: "Trabajando",
    blocked: "Te necesita",
    waiting: "Esperando",
    done: "Terminado"
  },
  runSummary: (agent, workspace, state) => `${agent} en ${workspace}: ${state}`,
  newSinceLooked: "Novedades desde la última vez.",
  openWorkspace: (workspace) => `Abrir ${workspace}`,
  startAgentOnTodo: "Iniciar un agente con esta tarea",
  agentButton: "Agente",
  agentRuns: "Ejecuciones de agentes",
  agents: "Agentes",
  startAnother: "Iniciar otro",
  inWorkspace: (workspace) => ` en ${workspace}`,
  startAgent: "Iniciar agente",
  workspace: "Espacio de trabajo",
  agent: "Agente",
  needsNewerOrca: "Iniciar un agente desde aquí requiere Orca 1.4.248 o posterior. Copia el prompt y pégalo en un agente.",
  prompt: "Prompt",
  movesTo: (state) => `Terminal nueva · pasa a ${state}`,
  opensNewTerminal: "Se abre en una terminal nueva",
  starting: "Iniciando…",
  copyPrompt: "Copiar prompt",
  noWorkspaces: "Orca aún no tiene espacios de trabajo. Crea uno en Orca y vuelve a intentarlo.",
  loadingWorkspaces: "Cargando espacios de trabajo…",
  openNow: " (abierto ahora)",
  deleted: (title) => `Se eliminó «${title}»`,
  archivedTodo: (title) => `Se archivó «${title}»`,
  restoredTodo: (title) => `Se restauró «${title}»`,
  archivedClosed: (n) => `Se ${plural2(n, "archivó 1 tarea cerrada", `archivaron ${n} tareas cerradas`)}`,
  copiedPrompt: "Copiado como prompt para agente",
  clipboardRefused: "No se pudo copiar. Orca no permitió usar el portapapeles.",
  startedAgent: (agent, workspace) => `${agent} iniciado en ${workspace}`,
  promptMayMiss: (started) => `${started}. Si el prompt no aparece allí, cópialo con Y.`,
  errNotPermitted: "Orca no lo permitió. En Ajustes → Plugins, vuelve a aprobar el acceso de ToDos Board.",
  errUnreachable: "Esta versión de Orca no llega al worker del plugin. Actualiza Orca o copia el prompt.",
  errTimeout: "El worker del plugin no respondió a tiempo. Inténtalo de nuevo.",
  errInvalid: "Primero elige un espacio de trabajo y escribe un prompt.",
  errStartAgent: "No se pudo iniciar el agente. Inténtalo de nuevo.",
  errOpenWorkspace: "No se pudo abrir el espacio de trabajo. Inténtalo de nuevo.",
  statusNone: "No hay tareas abiertas",
  statusOpen: (open, high, overdue) => [
    plural2(open, "1 abierta", `${open} abiertas`),
    high ? plural2(high, "1 alta", `${high} altas`) : "",
    overdue ? plural2(overdue, "1 vencida", `${overdue} vencidas`) : ""
  ].filter(Boolean).join(" · "),
  statusTip: (open, high, overdue) => open ? `ToDos: ${plural2(open, "1 tarea abierta", `${open} tareas abiertas`)}${high ? `, ${high} de prioridad alta` : ""}${overdue ? `, ${plural2(overdue, "1 vencida", `${overdue} vencidas`)}` : ""}. Pulsa para mostrar u ocultar la barra lateral derecha.` : "ToDos: nada abierto. Pulsa para mostrar u ocultar la barra lateral derecha."
};

// src/i18n/fr.ts
var plural3 = (n, one, many) => n <= 1 ? one : many;
var fr = {
  close: "Fermer",
  dismiss: "Ignorer",
  back: "Retour",
  loading: "Chargement",
  open: "Ouvrir",
  add: "Ajouter",
  edit: "Modifier",
  copy: "Copier",
  done: "Terminé",
  keep: "Garder",
  delete: "Supprimer",
  retry: "Réessayer",
  stateBacklog: "En attente",
  stateTodo: "À faire",
  stateDoing: "En cours",
  stateDone: "Terminé",
  allTodos: "Toutes les tâches",
  archived: "Archivées",
  state: "État",
  states: "États",
  tags: "Étiquettes",
  todoScopes: "Vues des tâches",
  scope: "Vue",
  statOpen: "Ouvertes",
  statClosed: "Fermées",
  statDoneThisWeek: "Terminées cette semaine",
  todoDetails: "Détails de la tâche",
  loadErrorTitle: "Impossible de charger vos tâches",
  loadErrorBody: "Le stockage des plugins d’Orca n’a pas répondu. Rien n’a été modifié.",
  tryAgain: "Réessayer",
  emptyTitle: "Aucune tâche pour l’instant",
  emptyBody: (newKey, enter, first, last) => [
    "Appuyez sur ",
    newKey,
    " pour en ajouter une, saisissez un titre, puis ",
    enter,
    ". Changez son état avec ",
    first,
    "–",
    last,
    "."
  ],
  addATodo: "Ajouter une tâche",
  noMatchesTitle: "Aucun résultat",
  noMatchesBody: "Rien ici ne correspond à la recherche ou aux filtres.",
  clearSearchAndFilter: "Effacer la recherche et les filtres",
  nothingArchivedTitle: "Rien d’archivé",
  nothingArchivedBody: (archiveKey) => [
    "Archivez une tâche avec ",
    archiveKey,
    ", ou toutes les tâches fermées depuis le menu d’affichage. Les réglages peuvent les archiver automatiquement."
  ],
  noOpenTagged: (tag) => `Aucune tâche ouverte avec #${tag}.`,
  showAllTodos: "Afficher toutes les tâches",
  undo: "Annuler",
  saveFailed: "Impossible d’enregistrer la dernière modification. Elle peut être perdue au rechargement d’Orca.",
  view: "Affichage",
  list: "Liste",
  board: "Tableau",
  search: "Rechercher",
  searchTodos: "Rechercher des tâches",
  searchPlaceholder: "Rechercher dans les titres et les notes",
  clearSearch: "Effacer la recherche",
  newTodo: "Nouvelle tâche",
  new: "Nouvelle",
  showEveryPriority: "Afficher toutes les priorités",
  showOnlyHigh: "Afficher seulement la priorité haute",
  highWord: "haute",
  displayOptions: "Options d’affichage",
  displayOptionsOn: "Options d’affichage (filtre ou tri actif)",
  priority: "Priorité",
  anyPriority: "Toutes",
  order: "Tri",
  orderManual: "Manuel",
  orderPriority: "Priorité",
  orderUpdated: "Modifiées récemment",
  orderCreated: "Plus récentes",
  orderDue: "Échéance",
  dueFilter: "Échéance",
  dueAny: "Toutes",
  dueOverdue: "En retard",
  dueByToday: "Aujourd’hui ou avant",
  dueWeek: "Sous 7 jours",
  showOnlyOverdue: "Afficher seulement les tâches en retard",
  showEveryDue: "Afficher toutes les tâches",
  overdueWord: "en retard",
  resetDisplay: "Réinitialiser les filtres et le tri",
  archiveClosed: "Archiver les tâches fermées",
  editStates: "Modifier les états",
  keyboardShortcuts: "Raccourcis clavier",
  todos: "Tâches",
  addTo: (state) => `Ajouter à ${state}`,
  addTodo: "Ajouter la tâche",
  expand: (state) => `Déplier ${state}`,
  collapse: (state) => `Replier ${state}`,
  updatedOn: (date) => `Modifiée le ${date}`,
  newTodoIn: (state) => `Nouvelle tâche dans ${state}`,
  composerPlaceholder: "Titre de la tâche (#étiquette !high @fri)",
  reopen: "Rouvrir",
  markDone: "Marquer comme terminée",
  priorities: { none: "Sans priorité", low: "Basse", med: "Moyenne", high: "Haute" },
  priorityTitle: (label) => `Priorité ${label.toLowerCase()}`,
  checklistSummary: (done, total) => `Liste : ${done} sur ${total} faites`,
  hasNotes: "Contient des notes",
  agoNow: "maintenant",
  ago: { s: "s", m: "min", h: "h", d: "j", w: "sem", mo: "mois", y: "an" },
  dueToday: "Aujourd’hui",
  dueTomorrow: "Demain",
  dueYesterday: "Hier",
  due: "Échéance",
  dueDate: "Date d’échéance",
  dueTime: "Heure d’échéance",
  addDue: "Ajouter une échéance",
  addTime: "Ajouter une heure",
  clearDue: "Retirer l’échéance",
  dueTitle: (full, overdue) => overdue ? `En retard : échéance le ${full}` : `Échéance le ${full}`,
  reminderDueNow: "Échéance maintenant",
  reminderDueToday: "Échéance aujourd’hui",
  reminderMany: (n) => `${n} tâches arrivent à échéance`,
  projects: "Projets",
  project: "Projet",
  noProject: "Aucun projet",
  openProject: (name) => `Ouvrir ${name} dans Orca`,
  projectNotFound: (name) => `Aucun espace de travail d’Orca n’appartient à ${name}.`,
  archive: "Archiver",
  unarchive: "Désarchiver",
  copyAsPrompt: "Copier comme prompt pour agent",
  archivedNotice: "Archivée. Elle n’apparaît plus que dans Archivées.",
  title: "Titre",
  showTag: (tag) => `Afficher #${tag}`,
  removeTag: (tag) => `Retirer #${tag}`,
  addTag: "Ajouter une étiquette",
  addTags: "Ajouter des étiquettes",
  bold: "Gras",
  italic: "Italique",
  code: "Code",
  link: "Lien",
  bulletedList: "Liste à puces",
  checklist: "Liste de contrôle",
  editDescription: "Modifier la description",
  notesEmpty: "Ajoutez des notes, des liens ou une liste de contrôle. Markdown accepté.",
  notesLabel: "Description (Markdown)",
  notesPlaceholder: "Markdown : **gras**, - listes, - [ ] tâches, [liens](https://…)",
  dates: (created, updated, closed) => `Créée ${created} · Modifiée ${updated}${closed ? ` · Fermée ${closed}` : ""}`,
  statesHint: "Cet ordre est celui des groupes de la liste et des colonnes du tableau. Les états fermés comptent comme terminés.",
  newStateName: "Nom du nouvel état",
  addState: "Ajouter un état",
  stateColor: (state) => `Couleur de ${state}`,
  stateName: "Nom de l’état",
  closedHint: "Les tâches ici comptent comme terminées",
  closedLabel: "Fermé",
  moveUp: "Monter",
  moveDown: "Descendre",
  deleteAndMove: (count, state) => `Supprimer, déplacer ${count} vers ${state}`,
  deleteState: "Supprimer l’état",
  keysMove: "Se déplacer",
  keysNextPrev: "Tâche suivante / précédente",
  keysColumns: "Colonne précédente / suivante (tableau)",
  keysScopes: "Vue précédente / suivante",
  keysOpen: "Ouvrir les détails (encore : modifier le titre)",
  keysBack: "Fermer, effacer, revenir",
  keysCreate: "Créer et chercher",
  keysNew: "Nouvelle tâche",
  keysSearch: "Rechercher",
  keysView: "Basculer liste / tableau",
  keysChange: "Modifier la tâche sélectionnée",
  keysToState: "Passer à l’état 1–9",
  keysShiftState: "Passer à l’état précédent / suivant",
  keysDone: "Marquer terminée / rouvrir",
  keysPriority: "Changer la priorité",
  keysNotes: "Modifier la description",
  keysAgent: "Lancer un agent dessus",
  keysOpenRun: "Ouvrir l’espace de travail de l’agent",
  keysCopy: "Copier comme prompt pour agent",
  keysArchive: "Archiver / désarchiver",
  keysDelete: "Supprimer",
  keysUndo: "Annuler la suppression ou l’archivage",
  runStates: {
    starting: "Démarrage",
    working: "En cours",
    blocked: "Attend votre réponse",
    waiting: "En attente",
    done: "Terminé"
  },
  runSummary: (agent, workspace, state) => `${agent} dans ${workspace} : ${state}`,
  newSinceLooked: "Nouveau depuis votre dernier passage.",
  openWorkspace: (workspace) => `Ouvrir ${workspace}`,
  startAgentOnTodo: "Lancer un agent sur cette tâche",
  agentButton: "Agent",
  agentRuns: "Exécutions d’agents",
  agents: "Agents",
  startAnother: "En lancer un autre",
  inWorkspace: (workspace) => ` dans ${workspace}`,
  startAgent: "Lancer l’agent",
  workspace: "Espace de travail",
  agent: "Agent",
  needsNewerOrca: "Lancer un agent d’ici nécessite Orca 1.4.248 ou plus récent. Copiez le prompt, puis collez-le dans un agent.",
  prompt: "Prompt",
  movesTo: (state) => `Nouveau terminal · passe à ${state}`,
  opensNewTerminal: "S’ouvre dans un nouveau terminal",
  starting: "Démarrage…",
  copyPrompt: "Copier le prompt",
  noWorkspaces: "Orca n’a pas encore d’espace de travail. Créez-en un dans Orca, puis réessayez.",
  loadingWorkspaces: "Chargement des espaces de travail…",
  openNow: " (ouvert)",
  deleted: (title) => `« ${title} » supprimée`,
  archivedTodo: (title) => `« ${title} » archivée`,
  restoredTodo: (title) => `« ${title} » restaurée`,
  archivedClosed: (n) => plural3(n, `${n} tâche fermée archivée`, `${n} tâches fermées archivées`),
  copiedPrompt: "Copié comme prompt pour agent",
  clipboardRefused: "Copie impossible. Orca n’a pas autorisé le presse-papiers.",
  startedAgent: (agent, workspace) => `${agent} lancé dans ${workspace}`,
  promptMayMiss: (started) => `${started}. Si le prompt n’apparaît pas, copiez-le avec Y.`,
  errNotPermitted: "Orca ne l’a pas autorisé. Dans Réglages → Plugins, approuvez à nouveau l’accès de ToDos Board.",
  errUnreachable: "Cette version d’Orca ne joint pas le worker du plugin. Mettez Orca à jour ou copiez le prompt.",
  errTimeout: "Le worker du plugin n’a pas répondu à temps. Réessayez.",
  errInvalid: "Choisissez d’abord un espace de travail et écrivez un prompt.",
  errStartAgent: "Impossible de lancer l’agent. Réessayez.",
  errOpenWorkspace: "Impossible d’ouvrir l’espace de travail. Réessayez.",
  statusNone: "Aucune tâche ouverte",
  statusOpen: (open, high, overdue) => [
    plural3(open, `${open} ouverte`, `${open} ouvertes`),
    high ? plural3(high, `${high} haute`, `${high} hautes`) : "",
    overdue ? `${overdue} en retard` : ""
  ].filter(Boolean).join(" · "),
  statusTip: (open, high, overdue) => open ? `ToDos : ${plural3(open, `${open} tâche ouverte`, `${open} tâches ouvertes`)}${high ? `, ${high} de priorité haute` : ""}${overdue ? `, ${overdue} en retard` : ""}. Appuyez pour afficher ou masquer la barre latérale droite.` : "ToDos : rien d’ouvert. Appuyez pour afficher ou masquer la barre latérale droite."
};

// src/i18n/ja.ts
var ja = {
  close: "閉じる",
  dismiss: "閉じる",
  back: "戻る",
  loading: "読み込み中",
  open: "開く",
  add: "追加",
  edit: "編集",
  copy: "コピー",
  done: "完了",
  keep: "残す",
  delete: "削除",
  retry: "再試行",
  stateBacklog: "バックログ",
  stateTodo: "未着手",
  stateDoing: "進行中",
  stateDone: "完了",
  allTodos: "すべてのToDo",
  archived: "アーカイブ",
  state: "ステータス",
  states: "ステータス",
  tags: "タグ",
  todoScopes: "ToDoの表示範囲",
  scope: "表示範囲",
  statOpen: "未完了",
  statClosed: "完了済み",
  statDoneThisWeek: "今週完了",
  todoDetails: "ToDoの詳細",
  loadErrorTitle: "ToDoを読み込めませんでした",
  loadErrorBody: "Orcaのプラグインストレージが応答しませんでした。何も変更されていません。",
  tryAgain: "再試行",
  emptyTitle: "ToDoはまだありません",
  emptyBody: (newKey, enter, first, last) => [
    newKey,
    " で追加し、タイトルを入力して ",
    enter,
    "。",
    first,
    "–",
    last,
    " でステータスを移動できます。"
  ],
  addATodo: "ToDoを追加",
  noMatchesTitle: "該当なし",
  noMatchesBody: "検索やフィルタに一致するものはありません。",
  clearSearchAndFilter: "検索とフィルタをクリア",
  nothingArchivedTitle: "アーカイブは空です",
  nothingArchivedBody: (archiveKey) => [
    archiveKey,
    " でToDoをアーカイブするか、表示メニューから完了済みをまとめてアーカイブできます。設定で自動アーカイブもできます。"
  ],
  noOpenTagged: (tag) => `#${tag} の未完了のToDoはありません。`,
  showAllTodos: "すべてのToDoを表示",
  undo: "元に戻す",
  saveFailed: "最後の変更を保存できませんでした。Orcaを再読み込みすると失われる可能性があります。",
  view: "表示",
  list: "リスト",
  board: "ボード",
  search: "検索",
  searchTodos: "ToDoを検索",
  searchPlaceholder: "タイトルとメモを検索",
  clearSearch: "検索をクリア",
  newTodo: "新しいToDo",
  new: "新規",
  showEveryPriority: "すべての優先度を表示",
  showOnlyHigh: "優先度「高」のみ表示",
  highWord: "高",
  displayOptions: "表示オプション",
  displayOptionsOn: "表示オプション(フィルタまたは並び順が有効)",
  priority: "優先度",
  anyPriority: "すべて",
  order: "並び順",
  orderManual: "手動",
  orderPriority: "優先度",
  orderUpdated: "更新が新しい順",
  orderCreated: "作成が新しい順",
  orderDue: "期限",
  dueFilter: "期限",
  dueAny: "すべて",
  dueOverdue: "期限切れ",
  dueByToday: "今日まで",
  dueWeek: "7日以内",
  showOnlyOverdue: "期限切れのToDoのみ表示",
  showEveryDue: "すべてのToDoを表示",
  overdueWord: "期限切れ",
  resetDisplay: "フィルタと並び順をリセット",
  archiveClosed: "完了済みのToDoをアーカイブ",
  editStates: "ステータスを編集",
  keyboardShortcuts: "キーボードショートカット",
  todos: "ToDo",
  addTo: (state) => `${state} に追加`,
  addTodo: "ToDoを追加",
  expand: (state) => `${state} を展開`,
  collapse: (state) => `${state} を折りたたむ`,
  updatedOn: (date) => `${date} に更新`,
  newTodoIn: (state) => `${state} に新しいToDo`,
  composerPlaceholder: "ToDoのタイトル(#タグ !high @fri)",
  reopen: "再開",
  markDone: "完了にする",
  priorities: { none: "優先度なし", low: "低", med: "中", high: "高" },
  priorityTitle: (label) => `優先度: ${label}`,
  checklistSummary: (done, total) => `チェックリスト: ${total} 件中 ${done} 件完了`,
  hasNotes: "メモあり",
  agoNow: "今",
  ago: { s: "秒", m: "分", h: "時間", d: "日", w: "週", mo: "か月", y: "年" },
  dueToday: "今日",
  dueTomorrow: "明日",
  dueYesterday: "昨日",
  due: "期限",
  dueDate: "期限日",
  dueTime: "期限時刻",
  addDue: "期限を追加",
  addTime: "時刻を追加",
  clearDue: "期限をクリア",
  dueTitle: (full, overdue) => overdue ? `期限切れ: 期限は ${full}` : `期限: ${full}`,
  reminderDueNow: "期限になりました",
  reminderDueToday: "今日が期限です",
  reminderMany: (n) => `${n} 件のToDoが期限です`,
  projects: "プロジェクト",
  project: "プロジェクト",
  noProject: "プロジェクトなし",
  openProject: (name) => `${name} をOrcaで開く`,
  projectNotFound: (name) => `${name} に属するワークスペースがOrcaにありません。`,
  archive: "アーカイブ",
  unarchive: "アーカイブから戻す",
  copyAsPrompt: "エージェント用プロンプトとしてコピー",
  archivedNotice: "アーカイブ済みです。「アーカイブ」以外には表示されません。",
  title: "タイトル",
  showTag: (tag) => `#${tag} を表示`,
  removeTag: (tag) => `#${tag} を削除`,
  addTag: "タグを追加",
  addTags: "タグを追加",
  bold: "太字",
  italic: "斜体",
  code: "コード",
  link: "リンク",
  bulletedList: "箇条書き",
  checklist: "チェックリスト",
  editDescription: "説明を編集",
  notesEmpty: "メモ、リンク、チェックリストを追加できます。Markdown対応です。",
  notesLabel: "説明(Markdown)",
  notesPlaceholder: "Markdown: **太字**、- リスト、- [ ] タスク、[リンク](https://…)",
  dates: (created, updated, closed) => `作成 ${created} · 更新 ${updated}${closed ? ` · 完了 ${closed}` : ""}`,
  statesHint: "この順序がリストのグループとボードの列の順序になります。完了ステータスは完了として数えます。",
  newStateName: "新しいステータス名",
  addState: "ステータスを追加",
  stateColor: (state) => `${state} の色`,
  stateName: "ステータス名",
  closedHint: "ここにあるToDoは完了として数えます",
  closedLabel: "完了",
  moveUp: "上へ",
  moveDown: "下へ",
  deleteAndMove: (count, state) => `削除して ${count} 件を ${state} へ移動`,
  deleteState: "ステータスを削除",
  keysMove: "移動",
  keysNextPrev: "次 / 前のToDo",
  keysColumns: "前 / 次の列(ボード)",
  keysScopes: "前 / 次の表示範囲",
  keysOpen: "詳細を開く(もう一度でタイトル編集)",
  keysBack: "閉じる、クリア、戻る",
  keysCreate: "作成と検索",
  keysNew: "新しいToDo",
  keysSearch: "検索",
  keysView: "リスト / ボード切り替え",
  keysChange: "選択中のToDoを変更",
  keysToState: "ステータス 1–9 へ移動",
  keysShiftState: "前 / 次のステータスへ移動",
  keysDone: "完了 / 再開",
  keysPriority: "優先度を切り替え",
  keysNotes: "説明を編集",
  keysAgent: "エージェントを起動",
  keysOpenRun: "エージェントのワークスペースを開く",
  keysCopy: "エージェント用プロンプトとしてコピー",
  keysArchive: "アーカイブ / 戻す",
  keysDelete: "削除",
  keysUndo: "削除やアーカイブを元に戻す",
  runStates: {
    starting: "起動中",
    working: "作業中",
    blocked: "対応が必要",
    waiting: "待機中",
    done: "終了"
  },
  runSummary: (agent, workspace, state) => `${workspace} の ${agent}: ${state}`,
  newSinceLooked: "前回確認してから更新があります。",
  openWorkspace: (workspace) => `${workspace} を開く`,
  startAgentOnTodo: "このToDoでエージェントを起動",
  agentButton: "エージェント",
  agentRuns: "エージェントの実行",
  agents: "エージェント",
  startAnother: "別に起動",
  inWorkspace: (workspace) => `(${workspace})`,
  startAgent: "エージェントを起動",
  workspace: "ワークスペース",
  agent: "エージェント",
  needsNewerOrca: "ここからエージェントを起動するにはOrca 1.4.248以降が必要です。プロンプトをコピーしてエージェントに貼り付けてください。",
  prompt: "プロンプト",
  movesTo: (state) => `新しいターミナル · ${state} へ移動`,
  opensNewTerminal: "新しいターミナルで開きます",
  starting: "起動中…",
  copyPrompt: "プロンプトをコピー",
  noWorkspaces: "Orcaにワークスペースがまだありません。Orcaで作成してから再試行してください。",
  loadingWorkspaces: "ワークスペースを読み込み中…",
  openNow: "(表示中)",
  deleted: (title) => `「${title}」を削除しました`,
  archivedTodo: (title) => `「${title}」をアーカイブしました`,
  restoredTodo: (title) => `「${title}」を戻しました`,
  archivedClosed: (n) => `完了済みのToDoを ${n} 件アーカイブしました`,
  copiedPrompt: "エージェント用プロンプトとしてコピーしました",
  clipboardRefused: "コピーできませんでした。Orcaがクリップボードを許可しませんでした。",
  startedAgent: (agent, workspace) => `${workspace} で ${agent} を起動しました`,
  promptMayMiss: (started) => `${started}。プロンプトが表示されない場合は Y でコピーしてください。`,
  errNotPermitted: "Orcaが許可しませんでした。設定 → プラグインで、ToDos Boardのアクセスを再度承認してください。",
  errUnreachable: "このOrcaからプラグインのワーカーに接続できません。Orcaを更新するか、プロンプトをコピーしてください。",
  errTimeout: "プラグインのワーカーが時間内に応答しませんでした。再試行してください。",
  errInvalid: "ワークスペースを選び、プロンプトを入力してください。",
  errStartAgent: "エージェントを起動できませんでした。再試行してください。",
  errOpenWorkspace: "ワークスペースを開けませんでした。再試行してください。",
  statusNone: "未完了のToDoはありません",
  statusOpen: (open, high, overdue) => [`未完了 ${open}`, high ? `高 ${high}` : "", overdue ? `期限切れ ${overdue}` : ""].filter(Boolean).join(" · "),
  statusTip: (open, high, overdue) => open ? `ToDos: 未完了のToDo ${open} 件${high ? `(優先度「高」${high} 件)` : ""}${overdue ? `、期限切れ ${overdue} 件` : ""}。押すと右サイドバーを表示または非表示にします。` : "ToDos: 未完了はありません。押すと右サイドバーを表示または非表示にします。"
};

// src/i18n/zh-CN.ts
var zhCN = {
  close: "关闭",
  dismiss: "关闭",
  back: "返回",
  loading: "加载中",
  open: "打开",
  add: "添加",
  edit: "编辑",
  copy: "复制",
  done: "完成",
  keep: "保留",
  delete: "删除",
  retry: "重试",
  stateBacklog: "待规划",
  stateTodo: "待办",
  stateDoing: "进行中",
  stateDone: "已完成",
  allTodos: "全部待办",
  archived: "已归档",
  state: "状态",
  states: "状态",
  tags: "标签",
  todoScopes: "待办范围",
  scope: "范围",
  statOpen: "未完成",
  statClosed: "已关闭",
  statDoneThisWeek: "本周完成",
  todoDetails: "待办详情",
  loadErrorTitle: "无法加载你的待办",
  loadErrorBody: "Orca 插件存储没有响应。没有任何更改。",
  tryAgain: "重试",
  emptyTitle: "还没有待办",
  emptyBody: (newKey, enter, first, last) => [
    "按 ",
    newKey,
    " 添加，输入标题后按 ",
    enter,
    "。用 ",
    first,
    "–",
    last,
    " 在状态之间移动。"
  ],
  addATodo: "添加待办",
  noMatchesTitle: "没有匹配项",
  noMatchesBody: "没有符合搜索或筛选条件的内容。",
  clearSearchAndFilter: "清除搜索和筛选",
  nothingArchivedTitle: "没有归档内容",
  nothingArchivedBody: (archiveKey) => [
    "按 ",
    archiveKey,
    " 归档待办，或在显示菜单中归档所有已关闭的待办。也可以在设置中开启自动归档。"
  ],
  noOpenTagged: (tag) => `没有带 #${tag} 的未完成待办。`,
  showAllTodos: "显示全部待办",
  undo: "撤销",
  saveFailed: "无法保存最后一次更改。Orca 重新加载时可能会丢失。",
  view: "视图",
  list: "列表",
  board: "看板",
  search: "搜索",
  searchTodos: "搜索待办",
  searchPlaceholder: "搜索标题和备注",
  clearSearch: "清除搜索",
  newTodo: "新建待办",
  new: "新建",
  showEveryPriority: "显示所有优先级",
  showOnlyHigh: "只显示高优先级",
  highWord: "高",
  displayOptions: "显示选项",
  displayOptionsOn: "显示选项（已启用筛选或排序）",
  priority: "优先级",
  anyPriority: "全部",
  order: "排序",
  orderManual: "手动",
  orderPriority: "优先级",
  orderUpdated: "最近更新",
  orderCreated: "最新创建",
  orderDue: "截止日期",
  dueFilter: "截止",
  dueAny: "全部",
  dueOverdue: "已逾期",
  dueByToday: "今天及之前",
  dueWeek: "7 天内",
  showOnlyOverdue: "只显示已逾期的待办",
  showEveryDue: "显示全部待办",
  overdueWord: "逾期",
  resetDisplay: "重置筛选和排序",
  archiveClosed: "归档已关闭的待办",
  editStates: "编辑状态",
  keyboardShortcuts: "键盘快捷键",
  todos: "待办",
  addTo: (state) => `添加到${state}`,
  addTodo: "添加待办",
  expand: (state) => `展开${state}`,
  collapse: (state) => `收起${state}`,
  updatedOn: (date) => `更新于 ${date}`,
  newTodoIn: (state) => `在${state}中新建待办`,
  composerPlaceholder: "待办标题（#标签 !high @fri）",
  reopen: "重新打开",
  markDone: "标记为完成",
  priorities: { none: "无优先级", low: "低", med: "中", high: "高" },
  priorityTitle: (label) => `优先级：${label}`,
  checklistSummary: (done, total) => `清单：已完成 ${done}/${total}`,
  hasNotes: "有备注",
  agoNow: "刚刚",
  ago: { s: "秒", m: "分", h: "小时", d: "天", w: "周", mo: "个月", y: "年" },
  dueToday: "今天",
  dueTomorrow: "明天",
  dueYesterday: "昨天",
  due: "截止",
  dueDate: "截止日期",
  dueTime: "截止时间",
  addDue: "添加截止日期",
  addTime: "添加时间",
  clearDue: "清除截止日期",
  dueTitle: (full, overdue) => overdue ? `已逾期：截止于 ${full}` : `截止于 ${full}`,
  reminderDueNow: "现在到期",
  reminderDueToday: "今天到期",
  reminderMany: (n) => `${n} 个待办已到期`,
  projects: "项目",
  project: "项目",
  noProject: "无项目",
  openProject: (name) => `在 Orca 中打开 ${name}`,
  projectNotFound: (name) => `Orca 中没有属于 ${name} 的工作区。`,
  archive: "归档",
  unarchive: "取消归档",
  copyAsPrompt: "复制为智能体提示词",
  archivedNotice: "已归档。只在“已归档”中显示。",
  title: "标题",
  showTag: (tag) => `显示 #${tag}`,
  removeTag: (tag) => `移除 #${tag}`,
  addTag: "添加标签",
  addTags: "添加标签",
  bold: "粗体",
  italic: "斜体",
  code: "代码",
  link: "链接",
  bulletedList: "项目符号列表",
  checklist: "清单",
  editDescription: "编辑描述",
  notesEmpty: "添加备注、链接或清单。支持 Markdown。",
  notesLabel: "描述（Markdown）",
  notesPlaceholder: "Markdown：**粗体**、- 列表、- [ ] 任务、[链接](https://…)",
  dates: (created, updated, closed) => `创建于 ${created} · 更新于 ${updated}${closed ? ` · 关闭于 ${closed}` : ""}`,
  statesHint: "这里的顺序就是列表分组和看板列的顺序。已关闭的状态算作完成。",
  newStateName: "新状态名称",
  addState: "添加状态",
  stateColor: (state) => `${state}的颜色`,
  stateName: "状态名称",
  closedHint: "这里的待办算作完成",
  closedLabel: "已关闭",
  moveUp: "上移",
  moveDown: "下移",
  deleteAndMove: (count, state) => `删除，并将 ${count} 个移到${state}`,
  deleteState: "删除状态",
  keysMove: "移动",
  keysNextPrev: "下一个 / 上一个待办",
  keysColumns: "上一列 / 下一列（看板）",
  keysScopes: "上一个 / 下一个范围",
  keysOpen: "打开详情（再按：编辑标题）",
  keysBack: "关闭、清除、返回",
  keysCreate: "创建与查找",
  keysNew: "新建待办",
  keysSearch: "搜索",
  keysView: "切换列表 / 看板",
  keysChange: "修改所选待办",
  keysToState: "移到状态 1–9",
  keysShiftState: "移到上一个 / 下一个状态",
  keysDone: "标记完成 / 重新打开",
  keysPriority: "切换优先级",
  keysNotes: "编辑描述",
  keysAgent: "让智能体处理它",
  keysOpenRun: "打开智能体的工作区",
  keysCopy: "复制为智能体提示词",
  keysArchive: "归档 / 取消归档",
  keysDelete: "删除",
  keysUndo: "撤销删除或归档",
  runStates: {
    starting: "启动中",
    working: "工作中",
    blocked: "需要你处理",
    waiting: "等待中",
    done: "已结束"
  },
  runSummary: (agent, workspace, state) => `${agent}（${workspace}）：${state}`,
  newSinceLooked: "自你上次查看后有更新。",
  openWorkspace: (workspace) => `打开 ${workspace}`,
  startAgentOnTodo: "让智能体处理这个待办",
  agentButton: "智能体",
  agentRuns: "智能体运行",
  agents: "智能体",
  startAnother: "再启动一个",
  inWorkspace: (workspace) => `（${workspace}）`,
  startAgent: "启动智能体",
  workspace: "工作区",
  agent: "智能体",
  needsNewerOrca: "从这里启动智能体需要 Orca 1.4.248 或更高版本。请复制提示词，然后粘贴到智能体中。",
  prompt: "提示词",
  movesTo: (state) => `新终端 · 移到${state}`,
  opensNewTerminal: "在新终端中打开",
  starting: "启动中…",
  copyPrompt: "复制提示词",
  noWorkspaces: "Orca 中还没有工作区。请先在 Orca 中创建一个，然后重试。",
  loadingWorkspaces: "正在加载工作区…",
  openNow: "（当前打开）",
  deleted: (title) => `已删除“${title}”`,
  archivedTodo: (title) => `已归档“${title}”`,
  restoredTodo: (title) => `已恢复“${title}”`,
  archivedClosed: (n) => `已归档 ${n} 个已关闭的待办`,
  copiedPrompt: "已复制为智能体提示词",
  clipboardRefused: "无法复制。Orca 不允许使用剪贴板。",
  startedAgent: (agent, workspace) => `已在 ${workspace} 中启动 ${agent}`,
  promptMayMiss: (started) => `${started}。如果提示词没有出现，请按 Y 复制。`,
  errNotPermitted: "Orca 没有允许此操作。请在 设置 → 插件 中重新批准 ToDos Board 的访问权限。",
  errUnreachable: "此版本的 Orca 无法连接插件 worker。请更新 Orca，或改为复制提示词。",
  errTimeout: "插件 worker 没有及时响应。请重试。",
  errInvalid: "请先选择工作区并填写提示词。",
  errStartAgent: "无法启动智能体。请重试。",
  errOpenWorkspace: "无法打开工作区。请重试。",
  statusNone: "没有未完成的待办",
  statusOpen: (open, high, overdue) => [`${open} 个未完成`, high ? `${high} 个高` : "", overdue ? `${overdue} 个逾期` : ""].filter(Boolean).join(" · "),
  statusTip: (open, high, overdue) => open ? `ToDos：${open} 个未完成的待办${high ? `，${high} 个高优先级` : ""}${overdue ? `，${overdue} 个已逾期` : ""}。点击显示或隐藏右侧边栏。` : "ToDos：没有未完成的待办。点击显示或隐藏右侧边栏。"
};

// src/i18n/index.ts
var LOCALE_KEY = "locale";
var LANGUAGES = {
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  ja: "日本語",
  "zh-CN": "简体中文"
};
var CATALOGS = { en, es, fr, de, ja, "zh-CN": zhCN };
var isLang = (tag) => Object.hasOwn(LANGUAGES, tag);
function resolveLang(setting, locale) {
  if (isLang(setting))
    return setting;
  const tag = (locale ?? "").trim();
  if (isLang(tag))
    return tag;
  const [base, ...rest] = tag.split("-");
  const lower = base.toLowerCase();
  if (lower === "zh") {
    const traditional = rest.some((part) => /^(Hant|TW|HK|MO)$/i.test(part));
    return traditional ? "en" : "zh-CN";
  }
  return isLang(lower) ? lower : "en";
}
var messagesFor = (lang) => CATALOGS[lang];

// src/settings.ts
var DEFAULT_SETTINGS = {
  language: "auto",
  autoArchiveDays: 0,
  dueReminders: true,
  reminderTime: "09:00"
};
var ARCHIVE_DAYS = [0, 1, 3, 7, 14, 30];
var REMINDER_TIMES = ["07:00", "08:00", "09:00", "10:00", "12:00", "17:00"];
var isRecord4 = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
function parseSettings(value) {
  const raw = isRecord4(value) ? value : {};
  return {
    language: typeof raw.language === "string" ? raw.language : DEFAULT_SETTINGS.language,
    autoArchiveDays: ARCHIVE_DAYS.includes(raw.autoArchiveDays) ? raw.autoArchiveDays : DEFAULT_SETTINGS.autoArchiveDays,
    dueReminders: typeof raw.dueReminders === "boolean" ? raw.dueReminders : DEFAULT_SETTINGS.dueReminders,
    reminderTime: REMINDER_TIMES.includes(raw.reminderTime) ? raw.reminderTime : DEFAULT_SETTINGS.reminderTime
  };
}

// src/worker/data.ts
var isRecord5 = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
var errorCode = (error) => isRecord5(error) && typeof error.code === "string" ? error.code : "action_failed";
async function readValue(orca, key) {
  const answer = await orca.host.call("storage.get", { key });
  return isRecord5(answer) ? answer.value : null;
}
async function writeValue(orca, key, value) {
  await orca.host.call("storage.set", { key, value });
}
async function readAll(orca) {
  const answer = await orca.host.call("storage.keys", {});
  const keys = isRecord5(answer) && Array.isArray(answer.keys) ? answer.keys.filter((k) => typeof k === "string") : [];
  const values = await Promise.all(keys.filter((k) => k.startsWith(TODO_KEY)).map((k) => readValue(orca, k)));
  const todos = values.map(parseTodo).filter((t) => t !== null);
  return { todos, states: parseStates(await readValue(orca, STATES_KEY)) ?? DEFAULT_STATES };
}
async function readSettings(orca) {
  try {
    return parseSettings(await orca.settings.get());
  } catch (error) {
    orca.log(`Could not read settings; using the defaults (${errorCode(error)})`);
    return parseSettings(null);
  }
}
async function readMessages(orca) {
  const { language } = await readSettings(orca);
  let locale = null;
  try {
    locale = await readValue(orca, LOCALE_KEY);
  } catch (error) {
    orca.log(`Could not read the stored locale (${errorCode(error)})`);
  }
  return messagesFor(resolveLang(language, typeof locale === "string" ? locale : undefined));
}

// src/worker/archive.ts
var HOUR_MS = 60 * 60 * 1000;
async function autoArchive(orca, now = Date.now()) {
  const { autoArchiveDays } = await readSettings(orca);
  if (!autoArchiveDays)
    return 0;
  const { todos, states } = await readAll(orca);
  const stale = staleClosed(todos, states, autoArchiveDays, now);
  for (const todo of stale)
    await writeValue(orca, TODO_KEY + todo.id, { ...todo, archived: true, updatedAt: now });
  if (stale.length)
    orca.log(`Auto-archived ${stale.length} closed to-dos`);
  return stale.length;
}
function followArchive(orca, everyMs = HOUR_MS) {
  const run = () => {
    autoArchive(orca).catch((error) => orca.log(`Could not archive closed to-dos (${errorCode(error)})`));
  };
  const timer = setInterval(run, everyMs);
  const listening = orca.settings.onDidChange(run);
  run();
  return {
    dispose() {
      clearInterval(timer);
      listening.dispose();
    }
  };
}

// src/worker/reminders.ts
var REMINDERS_KEY = "reminders";
var GRACE_MS = 12 * 60 * 60 * 1000;
var MAX_SEPARATE = 3;
var isRecord6 = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
function parseReminded(value) {
  if (!isRecord6(value))
    return {};
  return Object.fromEntries(Object.entries(value).filter((entry) => typeof entry[1] === "string"));
}
function notificationsFor(due, m = en) {
  if (due.length > MAX_SEPARATE)
    return [{ title: m.reminderMany(due.length), body: due.map((t) => t.title).join(", ") }];
  return due.map((t) => ({ title: t.due && hasTime(t.due) ? m.reminderDueNow : m.reminderDueToday, body: t.title }));
}
async function remind(orca, now = Date.now(), m) {
  const { dueReminders, reminderTime } = await readSettings(orca);
  if (!dueReminders)
    return 0;
  const { todos, states } = await readAll(orca);
  const closed = new Set(states.filter((s) => s.closed).map((s) => s.id));
  const open = todos.filter((t) => Boolean(t.due) && !t.archived && !closed.has(t.stateId));
  const before = parseReminded(await readValue(orca, REMINDERS_KEY));
  const after = Object.fromEntries(open.filter((t) => before[t.id] === t.due).map((t) => [t.id, t.due]));
  const fresh = [];
  for (const todo of open) {
    if (after[todo.id])
      continue;
    const at = remindAt(todo.due, reminderTime);
    if (at > now)
      continue;
    after[todo.id] = todo.due;
    if (now - at <= GRACE_MS)
      fresh.push(todo);
  }
  const words = fresh.length ? m ?? await readMessages(orca) : en;
  for (const note of notificationsFor(fresh, words)) {
    try {
      await orca.host.call("notifications.show", note);
    } catch (error) {
      orca.log(`Could not show a due reminder (${errorCode(error)})`);
    }
  }
  if (JSON.stringify(after) !== JSON.stringify(before))
    await writeValue(orca, REMINDERS_KEY, after);
  if (fresh.length)
    orca.log(`Reminded about ${fresh.length} due to-dos`);
  return fresh.length;
}
function followReminders(orca, everyMs = 60000) {
  let running = false;
  const run = () => {
    if (running)
      return;
    running = true;
    remind(orca).catch((error) => orca.log(`Could not check due reminders (${errorCode(error)})`)).finally(() => running = false);
  };
  const timer = setInterval(run, everyMs);
  const listening = orca.settings.onDidChange(run);
  run();
  return {
    dispose() {
      clearInterval(timer);
      listening.dispose();
    }
  };
}

// src/worker/status.ts
var STATUS_ITEM = "open-count";
function statusFor(todos, states, m = en, now = Date.now()) {
  const closed = new Set(states.filter((s) => s.closed).map((s) => s.id));
  const open = todos.filter((t) => !t.archived && !closed.has(t.stateId));
  const high = open.filter((t) => t.priority === "high").length;
  const overdue = open.filter((t) => inDueFilter(t, "overdue", now)).length;
  return {
    text: open.length ? m.statusOpen(open.length, high, overdue) : m.statusNone,
    tooltip: m.statusTip(open.length, high, overdue)
  };
}
async function updateStatus(orca) {
  const { todos, states } = await readAll(orca);
  const m = await readMessages(orca);
  await orca.host.call("statusBar.update", { id: STATUS_ITEM, ...statusFor(todos, states, m), visible: true });
}
function followStatus(orca, delayMs = 300, everyMs = 60000) {
  let timer;
  const run = () => {
    updateStatus(orca).catch((error) => orca.log(`Could not update the status bar item (${errorCode(error)})`));
  };
  const soon = () => {
    clearTimeout(timer);
    timer = setTimeout(run, delayMs);
  };
  const listening = orca.storage.onDidChange((change) => {
    if (change.key.startsWith(TODO_KEY) || change.key === STATES_KEY || change.key === LOCALE_KEY)
      soon();
  });
  const settingsChanges = orca.settings.onDidChange(soon);
  const clock = setInterval(run, everyMs);
  run();
  return {
    dispose() {
      clearTimeout(timer);
      clearInterval(clock);
      listening.dispose();
      settingsChanges.dispose();
    }
  };
}

// src/worker/main.ts
function activate(orca) {
  orca.panels.handle(REQUEST.workspaces, () => listWorkspaces(orca));
  orca.panels.handle(REQUEST.launch, (input) => launchAgent(orca, input));
  orca.panels.handle(REQUEST.open, (input) => openWorkspace(orca, input));
  orca.events.on("agent.status.changed", (payload) => onAgentStatus(orca, payload));
  followStatus(orca);
  followArchive(orca);
  followReminders(orca);
}
export {
  activate as default
};
