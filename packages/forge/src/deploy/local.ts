import { resolve as resolvePath } from 'node:path';
import { digestFile } from './manifest.js';

// ─────────────────────────────────────────────────────────────────────────────
// THE REMOVAL READ — does a placed file still hold what we wrote?
//
// An uninstall asks of one recorded path: are the bytes there still the ones this
// tool laid down? The answer is the manifest's digest of the write, compared with the
// bytes now — a REPORT. Nothing is opened for writing.
//
// A file the host has changed since is the host's, and an uninstall leaves it. A file
// with no recorded digest (placed before digests were kept) is cratylus's: the earlier
// installation recorded placing it, and that record is what makes it so (decision 0114).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * How a recorded file stands.
 *   - `unchanged`  — its bytes hash to the digest recorded when it was written.
 *   - `changed`    — they do not: the host edited it.
 *   - `unverified` — no digest was recorded: placed before digests were kept.
 *   - `absent`     — nothing is there any more.
 */
export type PlacedFileState = 'unchanged' | 'changed' | 'unverified' | 'absent';

/** The state of the file `rel` (from `harnessDir`) against the manifest's digests. */
export function placedFileState(
  harnessDir: string,
  rel: string,
  digests: Readonly<Record<string, string>>,
): PlacedFileState {
  const now = digestFile(resolvePath(harnessDir, rel));
  if (now === undefined) return 'absent';
  const written = Object.hasOwn(digests, rel) ? digests[rel] : undefined;
  if (written === undefined) return 'unverified';
  return now === written ? 'unchanged' : 'changed';
}
