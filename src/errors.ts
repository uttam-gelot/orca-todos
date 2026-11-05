// Typed failures. Each keeps the original error as `cause` so the logger can show the root problem.

export type StorageOp = 'load' | 'read' | 'write' | 'delete'

/** Orca plugin storage (or the browser preview's localStorage) failed or returned unusable data. */
export class StorageError extends Error {
  override readonly name = 'StorageError'
  readonly op: StorageOp
  readonly key?: string

  constructor(op: StorageOp, key: string | undefined, options?: { cause?: unknown }) {
    super(key ? `Storage ${op} failed for "${key}"` : `Storage ${op} failed`, options)
    this.op = op
    this.key = key
  }
}

export type AgentOp = 'workspaces' | 'launch'

/**
 * Handing a to-do to an agent failed: the worker could not be reached, Orca refused the call, or
 * an answer was not usable. `code` is Orca's error code when it gave one, such as `not_permitted`.
 */
export class AgentError extends Error {
  override readonly name = 'AgentError'
  readonly op: AgentOp
  readonly code: string

  constructor(op: AgentOp, code: string, options?: { cause?: unknown }) {
    super(`Agent ${op} failed (${code})`, options)
    this.op = op
    this.code = code
  }
}

/** A worker handler failure. Orca hands `code` (such as `invalid_params`) to the panel that asked. */
export class HandlerError extends Error {
  override readonly name = 'HandlerError'
  readonly code: string

  constructor(code: string, message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.code = code
  }
}
