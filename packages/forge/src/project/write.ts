// THE ONE WRITER — the only place a projected artifact tree touches the disk.
//
// Projection used to render and write in adjacent statements: `adapter.agentDef()`
// on one line, `writeFileSync()` on the next, no intermediate value surviving the
// loop body. That fused two concerns that have nothing to do with each other —
// WHAT bytes a plugin set projects to, and WHERE those bytes land — and it made
// the first unobservable without the second: you could not ask "what does this
// plugin set project?" without handing the projector a directory to scrub.
//
// So the projector now returns the tree and this writes it. The split is not
// cosmetic: it is what lets projection be tested, diffed, and inspected as a pure
// function of the plugin set, and it is why `writeFileSync` must stay OUT of
// `project/index.ts`.

import { chmodSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { ProjectedFile } from './index.js';

/**
 * Write a projected artifact tree beneath `out`, creating parent directories as
 * needed. `executable` files land 0755 so the exec bit survives deploy's
 * mode-preserving copy; everything else takes the ambient umask, exactly as the
 * fused writer did.
 */
export function writeRenderTree(
  out: string,
  files: readonly ProjectedFile[],
): void {
  for (const f of files) {
    const dest = join(out, f.path);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, f.content);
    if (f.executable) chmodSync(dest, 0o755);
  }
}
