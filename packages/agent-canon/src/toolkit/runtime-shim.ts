// The runtime THIN SHIM emitter — the BUILD→RUNTIME seam of the projection.
//
// When a skill cell declares `runtime: {capability}`, the projection emits, beside
// its SKILL.md, a `scripts/<capability>.mjs` THIN SHIM. The shim is minimal: it
// forwards its argv to the host-installed `agent-runtime <capability>` CLI and
// mirrors its exit code — NOTHING more. It is NOT a bundle of the capability impl:
// the impl lives host-side behind the runtime port (agent-runtime → agent-memory /
// event-tap host / …), installed per-host by agent-runtime/S7, addressed by the CLI
// and NEVER imported here. This REVERSES the superseded dep-free-bundle composition
// (skills-refactor T4): forge projects a thin shim against the runtime contract, it
// does not compose a standalone `.mjs` at build time.
//
// The shim carries NO `@leclabs/*` import (grep-proven) — its only dependency is the
// `agent-runtime` binary on PATH, guaranteed by the per-host install.

import { chmodSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/** The thin-shim source for a capability — a self-contained node forwarder to the
 *  host `agent-runtime <capability>` CLI. Pure `f(capability)`; no impl, no deps. */
export function runtimeShimContent(capability: string): string {
  return `#!/usr/bin/env node
// THIN SHIM — projected by agent-canon for a skill declaring runtime:{capability:'${capability}'}.
// Forwards to the host-installed \`agent-runtime\` CLI (per-host install: agent-runtime/S7).
// NOT a bundle of the capability impl — the impl lives host-side behind the runtime
// port, addressed by the CLI, never imported here. Zero cross-package imports.
import { spawnSync } from 'node:child_process';
const r = spawnSync('agent-runtime', ['${capability}', ...process.argv.slice(2)], {
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
