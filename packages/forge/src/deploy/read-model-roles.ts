// The model roles a host's settings file binds, READ ONLY: parsed as the harness
// parses it (YAML, of which JSON is a part), whatever its layout, so a binding written
// in a form the writer (`model-roles.ts`) cannot safely extend is still a binding. It
// never writes, so it carries none of the writer's restrictions.

import { existsSync, readFileSync } from 'node:fs';
import { load } from 'js-yaml';

/**
 * The roles the settings file at `path` binds under `modelRoles`, each to its model.
 * A file that is absent, does not parse, or holds no `modelRoles` mapping binds none;
 * an entry whose value is not a non-empty string binds nothing.
 */
export function readModelRoles(path: string): ReadonlyMap<string, string> {
  if (!existsSync(path)) return new Map();
  let doc: unknown;
  try {
    doc = load(readFileSync(path, 'utf8'));
  } catch {
    return new Map();
  }
  const roles =
    doc !== null && typeof doc === 'object' && !Array.isArray(doc)
      ? (doc as Record<string, unknown>).modelRoles
      : undefined;
  if (roles === null || typeof roles !== 'object' || Array.isArray(roles))
    return new Map();
  return new Map(
    Object.entries(roles).filter(
      (entry): entry is [string, string] =>
        typeof entry[1] === 'string' && entry[1] !== '',
    ),
  );
}
