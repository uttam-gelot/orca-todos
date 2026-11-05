// The plugin worker: a Node process Orca starts when a panel asks it something or an agent's status
// changes. It holds the calls only a worker may make (listing workspaces with their ids, starting
// agents) and keeps each run's status on its to-do. Built to dist/worker.js, the manifest's `main`.

import { REQUEST } from '../protocol'
import { launchAgent, listWorkspaces, onAgentStatus } from './handlers'
import type { WorkerOrca } from './host'

export default function activate(orca: WorkerOrca): void {
  orca.panels.handle(REQUEST.workspaces, () => listWorkspaces(orca))
  orca.panels.handle(REQUEST.launch, (input) => launchAgent(orca, input))
  orca.events.on('agent.status.changed', (payload) => onAgentStatus(orca, payload))
}
