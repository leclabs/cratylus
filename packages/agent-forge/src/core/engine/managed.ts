/**
 * Read-merge primitives for shared target files (§3 "write is destructive"
 * remediation). Three surfaces, one discipline: forge owns a delimited
 * region / a set of keys; every foreign byte survives.
 *
 * Primitives only — per-adapter application is owned by the adapter shards.
 */

import { dump, load } from 'js-yaml';

/** Default marker tag; renders as `<!-- agent-forge:begin -->` etc. */
export const MANAGED_TAG = 'agent-forge';

export function managedBeginMarker(tag: string = MANAGED_TAG): string {
  return `<!-- ${tag}:begin -->`;
}

export function managedEndMarker(tag: string = MANAGED_TAG): string {
  return `<!-- ${tag}:end -->`;
}

/**
 * Insert or replace the marker-delimited managed region in a markdown
 * document. Hand-written content outside the markers survives byte-for-byte;
 * a missing region is appended (blank-line separated). `existing` undefined
 * ⇒ the result is just the managed region.
 */
export function upsertManagedRegion(
  existing: string | undefined,
  content: string,
  tag: string = MANAGED_TAG,
): string {
  const begin = managedBeginMarker(tag);
  const end = managedEndMarker(tag);
  const region = `${begin}\n${content.replace(/\n$/, '')}\n${end}\n`;

  if (existing === undefined || existing.trim() === '') return region;

  const beginIdx = existing.indexOf(begin);
  const endIdx = existing.indexOf(end);
  if (beginIdx !== -1 && endIdx !== -1 && endIdx > beginIdx) {
    const before = existing.slice(0, beginIdx);
    const after = existing.slice(endIdx + end.length).replace(/^\n/, '');
    return `${before}${region}${after}`;
  }
  const sep = existing.endsWith('\n\n')
    ? ''
    : existing.endsWith('\n')
      ? '\n'
      : '\n\n';
  return `${existing}${sep}${region}`;
}

/** The managed region's inner content, or null when no region exists. */
export function readManagedRegion(
  text: string,
  tag: string = MANAGED_TAG,
): string | null {
  const begin = managedBeginMarker(tag);
  const end = managedEndMarker(tag);
  const beginIdx = text.indexOf(begin);
  const endIdx = text.indexOf(end);
  if (beginIdx === -1 || endIdx === -1 || endIdx <= beginIdx) return null;
  return text
    .slice(beginIdx + begin.length, endIdx)
    .replace(/^\n/, '')
    .replace(/\n$/, '');
}

/**
 * Key-scoped JSON merge: parse `existing` (undefined/blank ⇒ `{}`), set the
 * owned top-level keys, leave every foreign key untouched. Returns the
 * serialized document (2-space indent, trailing newline). Throws on invalid
 * JSON — a corrupt target must refuse, never be clobbered.
 */
export function mergeJsonKeys(
  existing: string | undefined,
  owned: Record<string, unknown>,
): string {
  const base: Record<string, unknown> =
    existing === undefined || existing.trim() === ''
      ? {}
      : (JSON.parse(existing) as Record<string, unknown>);
  const merged = { ...base, ...owned };
  return `${JSON.stringify(merged, null, 2)}\n`;
}

/**
 * Key-scoped YAML merge: same contract as `mergeJsonKeys` over a YAML
 * mapping. Foreign keys and their values survive semantically (YAML is
 * re-serialized, so comments/formatting are not preserved — callers that
 * need byte-fidelity outside owned keys must use a delimited-region format
 * instead). Throws on non-mapping or invalid YAML.
 */
export function mergeYamlKeys(
  existing: string | undefined,
  owned: Record<string, unknown>,
): string {
  let base: Record<string, unknown> = {};
  if (existing !== undefined && existing.trim() !== '') {
    const parsed = load(existing);
    if (parsed === null || parsed === undefined) {
      base = {};
    } else if (typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('mergeYamlKeys: existing document is not a mapping');
    } else {
      base = parsed as Record<string, unknown>;
    }
  }
  const merged = { ...base, ...owned };
  return dump(merged, { lineWidth: 100, noRefs: true });
}
