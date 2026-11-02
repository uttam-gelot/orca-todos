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
