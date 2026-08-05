// The runtime THIN SHIM emitter — the BUILD→RUNTIME seam of the projection.
// Lives in forge (not the corpus) so the CONSUMER projection path emits
// shims too: a plugin the consumer extends may declare `runtime:`, and its cells
// must get a reachable shim wherever they are projected from.
//
// When a skill cell declares `runtime: {capability}`, the projection emits, beside
// its SKILL.md, a `scripts/<capability>.mjs` THIN SHIM. The shim is minimal: it
// forwards its argv to the host-installed `<RUNTIME_BIN> <capability>` CLI and
// mirrors its exit code — NOTHING more. It is NOT a bundle of the capability impl:
// the impl lives host-side behind the runtime port (@cratylus/runtime → memory /
// event-tap host / …), installed per-host by agent-runtime/S7, addressed by the CLI
// and NEVER imported here. This REVERSES the superseded dep-free-bundle composition
// (skills-refactor T4): forge projects a thin shim against the runtime contract, it
// does not compose a standalone `.mjs` at build time.
//
// The shim carries NO `@cratylus/*` import (grep-proven) — its only dependency is the
// runtime binary on PATH, guaranteed by the per-host install.
//
// THE BIN NAME IS INTERPOLATED, NEVER SPELLED. This emitter is the OPERATIVE site:
// the literal it writes is baked into every deployed `scripts/<cap>.mjs`, where no
// compiler can see it — a rename that missed it produced a script that failed on a
// host, not at build. It reads `RUNTIME_BIN` from the runtime contract leaf, which
// is the name's one home.

import { chmodSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { RUNTIME_BIN } from '@cratylus/runtime/bin-name';

/**
 * Vendor session-id variables, most-specific first, mapped into the runtime's
 * own `AGENT_SESSION_ID` contract.
 *
 * THIS IS THE HARNESS-ADAPTER SEAM, and the ONLY place in the projection
 * entitled to name a vendor. The shim is emitted INTO a specific harness's skill
 * tree, so it is harness-specific by construction; the runtime packages behind
 * it are not, and must never learn these names. Supporting a new host means
 * adding one entry here — not a second read inside `memory`.
 *
 * Why it exists: `memory` resolves a session from `$AGENT_SESSION_ID`
 * (its own `AGENT_*` namespace, beside `$AGENT_HOME`). No harness sets that, so
 * without this bridge every invocation looks sessionless, mints a fresh id, and
 * the lock/liveness machinery sees a phantom sibling on the very next call.
 */
export const HARNESS_SESSION_ENV_VARS = [
  'CLAUDE_CODE_SESSION_ID',
  'CLAUDE_SESSION_ID',
] as const;

/** The thin-shim source for a capability — a self-contained node forwarder to the
 *  host `<RUNTIME_BIN> <capability>` CLI. Pure `f(capability)`; no impl, no deps. */
export function runtimeShimContent(capability: string): string {
  const vendors = HARNESS_SESSION_ENV_VARS.map((v) => `'${v}'`).join(', ');
  return `#!/usr/bin/env node
// THIN SHIM — projected by canon for a skill declaring runtime:{capability:'${capability}'}.
// Forwards to the host-installed \`${RUNTIME_BIN}\` CLI (per-host install: agent-runtime/S7).
// NOT a bundle of the capability impl — the impl lives host-side behind the runtime
// port, addressed by the CLI, never imported here. Zero cross-package imports.
//
// It also BRIDGES this harness to the runtime's session contract: the runtime reads
// \$AGENT_SESSION_ID and knows no vendor names, so the adapter belongs here, at the
// boundary, not in the library. An explicit \$AGENT_SESSION_ID always wins.
import { spawnSync } from 'node:child_process';
const env = { ...process.env };
if (!env.AGENT_SESSION_ID) {
  for (const k of [${vendors}]) {
    const v = process.env[k];
    if (v) { env.AGENT_SESSION_ID = v; break; }
  }
}
const r = spawnSync('${RUNTIME_BIN}', ['${capability}', ...process.argv.slice(2)], {
  stdio: 'inherit',
  env,
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
