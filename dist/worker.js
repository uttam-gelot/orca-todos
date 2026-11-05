// src/protocol.ts
var REQUEST = {
  workspaces: "workspaces.list",
  launch: "agent.launch"
};
var isRecord = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
var isString = (v) => typeof v === "string";
function parseWorkspace(value) {
  if (!isRecord(value) || !isString(value.id) || !isString(value.name))
    return null;
  return {
    id: value.id,
    name: value.name,
    kind: value.kind === "folder" ? "folder" : "worktree",
    branch: isString(value.branch) ? value.branch : null
  };
}
function parseLaunchInput(value) {
  if (!isRecord(value))
    return null;
  const { workspaceId, agent, prompt } = value;
  if (!isString(workspaceId) || !workspaceId || !isString(agent) || !agent || !isString(prompt) || !prompt.trim())
    return null;
  return { workspaceId, agent, prompt };
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
var isRecord2 = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
var isString2 = (v) => typeof v === "string";
var branchName = (branch) => branch?.replace(/^refs\/heads\//, "") ?? "";
function parseContext(value) {
  if (!isRecord2(value) || !isString2(value.displayName))
    return null;
  return { displayName: value.displayName, branch: isString2(value.branch) ? value.branch : "" };
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
  if (!isRecord2(listed) || !Array.isArray(listed.workspaces))
    throw new HandlerError("action_failed", "Orca answered workspace.list with something unexpected");
  const workspaces = listed.workspaces.map(parseWorkspace).filter((w) => w !== null);
  return {
    workspaces,
    focusedId: focusedWorkspaceId(workspaces, parseContext(context)),
    truncated: listed.truncated === true
  };
}
async function launchAgent(orca, input) {
  const launch = parseLaunchInput(input);
  if (!launch)
    throw new HandlerError("invalid_params", "A launch needs a workspace, an agent and a prompt");
  const answer = await orca.host.call("agent.launch", launch);
  if (!isRecord2(answer) || !isString2(answer.terminalId))
    throw new HandlerError("action_failed", "Orca answered agent.launch with something unexpected");
  orca.log(`Started ${launch.agent} in ${launch.workspaceId} (terminal ${answer.terminalId})`);
  return { terminalId: answer.terminalId };
}

// src/worker/main.ts
function activate(orca) {
  orca.panels.handle(REQUEST.workspaces, () => listWorkspaces(orca));
  orca.panels.handle(REQUEST.launch, (input) => launchAgent(orca, input));
}
export {
  activate as default
};
