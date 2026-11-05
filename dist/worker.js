// src/protocol.ts
var REQUEST = {
  workspaces: "workspaces.list",
  launch: "agent.launch"
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
    folder: isString(value.folder) ? value.folder : isString(value.path) ? lastSegment(value.path) : ""
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

// src/model.ts
var TODO_KEY = "todo:";
var RUN_STATES = ["starting", "working", "blocked", "waiting", "done"];
var PRIORITIES = ["high", "med", "low", "none"];
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
  return { displayName: value.displayName, branch: isString3(value.branch) ? value.branch : "" };
}
function focusedWorkspaceId(workspaces, context) {
  if (!context)
    return null;
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

// src/worker/main.ts
function activate(orca) {
  orca.panels.handle(REQUEST.workspaces, () => listWorkspaces(orca));
  orca.panels.handle(REQUEST.launch, (input) => launchAgent(orca, input));
  orca.events.on("agent.status.changed", (payload) => onAgentStatus(orca, payload));
}
export {
  activate as default
};
