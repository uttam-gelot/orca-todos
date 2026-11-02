// The one place the plugin writes diagnostics. Orca shows a plugin frame's console in its dev
// tools, so a thin structured wrapper over `console` is enough; everything else imports `log`.
// Never pass to-do titles, notes or other user content as context: log ids and operation names.

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'
export type LogContext = Record<string, string | number | boolean | null | undefined>

export type LogEntry = {
  level: LogLevel
  message: string
  context?: LogContext
  error?: unknown
}

const RANK: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 }

/** Entries below this level are dropped. Tests raise it to keep output quiet. */
export const logConfig = { level: 'info' as LogLevel }

function write(entry: LogEntry): void {
  if (RANK[entry.level] < RANK[logConfig.level]) return
  const { level, message, context, error } = entry
  const line = `[orca-todos] ${message}`
  const extras = [context, error].filter((x) => x !== undefined)
  // eslint-disable-next-line no-console -- the logger is the only sanctioned console user
  console[level](line, ...extras)
}

export const log = {
  debug: (message: string, context?: LogContext): void => write({ level: 'debug', message, context }),
  info: (message: string, context?: LogContext): void => write({ level: 'info', message, context }),
  warn: (message: string, context?: LogContext, error?: unknown): void =>
    write({ level: 'warn', message, context, error }),
  error: (message: string, context?: LogContext, error?: unknown): void =>
    write({ level: 'error', message, context, error })
}
