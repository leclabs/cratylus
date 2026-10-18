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

/** The `statusLine` keys that decide whether the session's agent shows. */
const STATUS_KEYS = [
  'showHookStatus',
  'preset',
  'leftSegments',
  'rightSegments',
] as const;

/** How the user's and the project's settings hide the session's agent: the
 *  project's own `statusLine` keys that hide it, as `statusLine.<key>`, empty where
 *  the hiding comes from the user's settings alone. */
export interface SessionAgentHiding {
  readonly projectKeys: readonly string[];
}

/**
 * Whether the user's settings at `user`, with the project's at `project` over them as
 * the harness layers them, hide the session's agent: the row beneath the editor is
 * turned off (`showHookStatus: false`) and the layout in effect does not list
 * `host.segment` inside the line, which only `custom` reads from the settings. A key
 * set to null is unset, as the harness reads it, so the layer below still applies.
 * `undefined` where the agent shows.
 */
export function sessionAgentHiding(
  user: string,
  project: string,
  host: Pick<StatusSegmentHost, 'segment'>,
): SessionAgentHiding | undefined {
  const layers = [user, project].map((path) => {
    const line = mappingOf(readSettings(path).statusLine) ?? {};
    return Object.fromEntries(
      STATUS_KEYS.flatMap((key) =>
        line[key] === undefined || line[key] === null ? [] : [[key, line[key]]],
      ),
    ) as Partial<Record<(typeof STATUS_KEYS)[number], unknown>>;
  });
  const own = layers[1] ?? {};
  const line = Object.assign({}, ...layers) as typeof own;
  if (line.showHookStatus !== false) return undefined;
  const lists = (['leftSegments', 'rightSegments'] as const).filter(
    (key) => line[key] !== undefined,
  );
  const custom = line.preset === CUSTOM_PRESET;
  if (
    custom &&
    lists.some((key) => {
      const segments = line[key];
      return Array.isArray(segments) && segments.includes(host.segment);
    })
  )
    return undefined;
  // The project's own keys among those that hide it: the row turned off, and a
  // layout without the segment decided by its preset or its lists.
  const projectKeys = [
    ...(own.showHookStatus === false ? ['showHookStatus'] : []),
    ...(own.preset !== undefined && !custom ? ['preset'] : []),
    ...(custom ? lists.filter((key) => own[key] !== undefined) : []),
  ].map((key) => `statusLine.${key}`);
  return { projectKeys };
}
