// The plugin worker: a Node process Orca starts when a panel asks it something or an agent's status
// changes, and keeps running for the status bar item. It holds the calls only a worker may make
// (listing workspaces with their ids, starting agents, showing workspaces), keeps each run's status
// on its to-do, and does the timed work no panel must be open for: the status bar count, auto-archive
// and due reminders. Built to dist/worker.js, the manifest's `main`.

import { REQUEST } from '../protocol'
import { launchAgent, listWorkspaces, onAgentStatus, openWorkspace } from './handlers'
import { followArchive } from './archive'
import type { WorkerOrca } from './host'
import { followReminders } from './reminders'
import { followStatus } from './status'

export default function activate(orca: WorkerOrca): void {
  orca.panels.handle(REQUEST.workspaces, () => listWorkspaces(orca))
  orca.panels.handle(REQUEST.launch, (input) => launchAgent(orca, input))
  orca.panels.handle(REQUEST.open, (input) => openWorkspace(orca, input))
  orca.events.on('agent.status.changed', (payload) => onAgentStatus(orca, payload))
  followStatus(orca)
  followArchive(orca)
  followReminders(orca)
}
