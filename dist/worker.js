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
    ", or archive every closed one from the display menu."
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

// src/settings.ts
var DEFAULT_SETTINGS = {
  language: "auto",
  autoArchiveDays: 0
};
var ARCHIVE_DAYS = [0, 1, 3, 7, 14, 30];
var isRecord4 = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
function parseSettings(value) {
  const raw = isRecord4(value) ? value : {};
  return {
    language: typeof raw.language === "string" ? raw.language : DEFAULT_SETTINGS.language,
    autoArchiveDays: ARCHIVE_DAYS.includes(raw.autoArchiveDays) ? raw.autoArchiveDays : DEFAULT_SETTINGS.autoArchiveDays
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
  await orca.host.call("statusBar.update", { id: STATUS_ITEM, ...statusFor(todos, states), visible: true });
}
function followStatus(orca, delayMs = 300, everyMs = 60000) {
  let timer;
  const run = () => {
    updateStatus(orca).catch((error) => orca.log(`Could not update the status bar item (${errorCode(error)})`));
  };
  const listening = orca.storage.onDidChange((change) => {
    if (!change.key.startsWith(TODO_KEY) && change.key !== STATES_KEY)
      return;
    clearTimeout(timer);
    timer = setTimeout(run, delayMs);
  });
  const clock = setInterval(run, everyMs);
  run();
  return {
    dispose() {
      clearTimeout(timer);
      clearInterval(clock);
      listening.dispose();
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
}
export {
  activate as default
};
