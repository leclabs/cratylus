// A host's settings, READ ONLY: each file parsed as the harness parses it (YAML, of
// which JSON is a part), whatever its layout, so a setting written in a form the
// writers (`model-roles.ts`, `status-line.ts`) cannot safely extend is still read. It
// never writes, so it carries none of the writers' restrictions. A project
// installation reads the project's and the user's settings this way and writes
// neither (decision 0313).

import { existsSync, readFileSync } from 'node:fs';
import { load } from 'js-yaml';
import type { StatusSegmentHost } from '../core/harness-adapter.js';
import { CUSTOM_PRESET } from './status-line.js';

type Mapping = Readonly<Record<string, unknown>>;

/** `value` where it is a mapping, else `undefined`. */
function mappingOf(value: unknown): Mapping | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Mapping)
    : undefined;
}

/** The settings file at `path` as a mapping: empty where it is absent, does not
 *  parse, or is no mapping, since the harness then reads no setting from it. */
function readSettings(path: string): Mapping {
  if (!existsSync(path)) return {};
  try {
    return mappingOf(load(readFileSync(path, 'utf8'))) ?? {};
  } catch {
    return {};
  }
}

/**
 * The roles the settings file at `path` binds under `modelRoles`, each to its model.
 * A file with no `modelRoles` mapping binds none; an entry whose value is not a
 * non-empty string binds nothing.
 */
export function readModelRoles(path: string): ReadonlyMap<string, string> {
  return new Map(
    Object.entries(mappingOf(readSettings(path).modelRoles) ?? {}).filter(
      (entry): entry is [string, string] =>
        typeof entry[1] === 'string' && entry[1] !== '',
    ),
  );
}

/**
 * Whether the settings files at `paths`, each layer over the one before as the harness
 * merges them (the user's, then the project's), hide the session's agent: the row
 * beneath the editor is turned off (`showHookStatus: false`) and the layout in effect
 * does not list `host.segment` inside the line, which only `custom` reads from the
 * settings.
 */
export function hidesSessionAgent(
  paths: readonly string[],
  host: Pick<StatusSegmentHost, 'segment'>,
): boolean {
  const line: Record<string, unknown> = {};
  for (const path of paths)
    Object.assign(line, mappingOf(readSettings(path).statusLine));
  if (line.showHookStatus !== false) return false;
  if (line.preset !== CUSTOM_PRESET) return true;
  return ![line.leftSegments, line.rightSegments].some(
    (segments) => Array.isArray(segments) && segments.includes(host.segment),
  );
}
