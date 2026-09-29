// The runtime THIN SHIM emitter — the BUILD→RUNTIME seam of the projection.
// Lives in forge (not the corpus) so the CONSUMER projection path emits
// shims too: a plugin the consumer extends may declare `runtime:`, and its cells
// must get a reachable shim wherever they are projected from.
//
// When a skill cell declares `runtime: {capability}`, the projection emits, beside
// its SKILL.md, a `scripts/<capability>.mjs` THIN SHIM. The shim is minimal: it
// forwards its argv to the host-installed `<CLI_BIN> <capability>` CLI and
// mirrors its exit code — NOTHING more. It is NOT a bundle of the capability impl:
// the impl lives host-side behind the runtime port (@cratylus/runtime → event-tap
// host / design / plan / note), installed once per host, addressed by the CLI and NEVER
// imported here. This REVERSES the superseded design in which forge composed a
// standalone, dependency-free `.mjs` at build time: forge now projects a thin shim
// against the runtime contract instead.
//
// The shim carries NO `@cratylus/*` import (grep-proven) — its only dependency is the
// runtime binary on PATH, guaranteed by the per-host install.
//
// THE BIN NAME IS INTERPOLATED, NEVER SPELLED. This emitter is the OPERATIVE site:
// the literal it writes is baked into every deployed `scripts/<cap>.mjs`, where no
// compiler can see it — a rename that missed it produced a script that failed on a
// host, not at build. It reads `CLI_BIN` from the runtime contract leaf, which
// is the name's one home.

import { chmodSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CLI_BIN } from '@cratylus/runtime/bin-name';

/**
 * The line every generated shim carries, naming the capability it forwards to:
 * `// <CLI_BIN>-shim: <capability>`. It is what identifies a script as a
 * forge-generated forwarder rather than one a skill author wrote, and the omp
 * launcher reads it back to say which CLI command a shim's route runs as.
 */
export const SHIM_SIGNATURE = `// ${CLI_BIN}-shim: `;

/** The thin-shim source for a capability — a self-contained node forwarder to the
 *  host `<CLI_BIN> <capability>` CLI. Pure `f(capability)`; no impl, no deps. One
 *  shape for every capability and every harness: it passes argv through, runs
 *  with the caller's environment and mirrors the exit code. */
export function runtimeShimContent(capability: string): string {
  return `#!/usr/bin/env node
${SHIM_SIGNATURE}${capability}
// THIN SHIM — projected by canon for a skill declaring runtime:{capability:'${capability}'}.
// Forwards to the host-installed \`${CLI_BIN}\` CLI (installed per host, never bundled).
// NOT a bundle of the capability impl — the impl lives host-side behind the runtime
// port, addressed by the CLI, never imported here. Zero cross-package imports.
import { spawnSync } from 'node:child_process';
const r = spawnSync('${CLI_BIN}', ['${capability}', ...process.argv.slice(2)], {
  stdio: 'inherit',
});
process.exit(r.status ?? 1);
`;
}

/** Emit the thin shim into `<skillDir>/scripts/<capability>.mjs`, executable (0755
 *  so the exec bit survives deploy's mode-preserving copy). Returns the path. */
export function emitRuntimeShim(skillDir: string, capability: string): string {
  const scriptsDir = join(skillDir, 'scripts');
  mkdirSync(scriptsDir, { recursive: true });
  const dest = join(scriptsDir, `${capability}.mjs`);
  writeFileSync(dest, runtimeShimContent(capability));
  chmodSync(dest, 0o755);
  return dest;
}
