// The slice of Orca's worker API (the `orca` that `activate` receives) this plugin uses. Orca's own
// typings come from `orca plugin types`; this local copy keeps the build free of Orca's install.

export type Disposable = { dispose(): void }

export type WorkerOrca = {
  host: { call(method: string, params?: unknown): Promise<unknown> }
  panels: {
    /** Answers a panel's `orca.plugin.request(name, input)`. What the handler returns is the answer. */
    handle(name: string, handler: (input: unknown) => unknown): Disposable
  }
  events: {
    /** Delivers an event the manifest lists in `contributes.events`. */
    on(event: string, handler: (payload: unknown) => unknown): Disposable
  }
  log(message: string): void
}
