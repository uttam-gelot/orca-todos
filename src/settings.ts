// The plugin's settings, as declared in the manifest's `contributes.settings` and shown by Orca
// under the plugin in Settings. Pure, so the panel and the worker read them the same way.
//
// Orca hands back whatever is stored, including values an older manifest allowed, so every value
// is checked here and an unusable one falls back to its default.

/** How the settings read in code. Keys match the manifest. */
export type Settings = {
  /** `auto` follows Orca's language; otherwise a language tag from `LANGUAGES`. */
  language: string
  /** Days after closing that a to-do moves to the archive; 0 keeps closed to-dos where they are. */
  autoArchiveDays: number
}

export const DEFAULT_SETTINGS: Settings = {
  language: 'auto',
  autoArchiveDays: 0
}

/** The choices the manifest offers for `autoArchiveDays`. */
export const ARCHIVE_DAYS = [0, 1, 3, 7, 14, 30]

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/** Settings from Orca's answer, each missing or unusable one at its default. */
export function parseSettings(value: unknown): Settings {
  const raw = isRecord(value) ? value : {}
  return {
    language: typeof raw.language === 'string' ? raw.language : DEFAULT_SETTINGS.language,
    autoArchiveDays: ARCHIVE_DAYS.includes(raw.autoArchiveDays as number)
      ? (raw.autoArchiveDays as number)
      : DEFAULT_SETTINGS.autoArchiveDays
  }
}
