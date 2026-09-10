// The runtime THIN SHIM emitter — the BUILD→RUNTIME seam of the projection.
// Lives in forge (not the corpus) so the CONSUMER projection path emits
// shims too: a plugin the consumer extends may declare `runtime:`, and its cells
// must get a reachable shim wherever they are projected from.
//
// When a skill cell declares `runtime: {capability}`, the projection emits, beside
// its SKILL.md, a `scripts/<capability>.mjs` THIN SHIM. The shim is minimal: it
// forwards its argv to the host-installed `<CLI_BIN> <capability>` CLI and
// mirrors its exit code — NOTHING more. It is NOT a bundle of the capability impl:
// the impl lives host-side behind the runtime port (@cratylus/runtime → memory /
// event-tap host / …), installed once per host, addressed by the CLI and NEVER
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
 * THE VENDOR NAMES LIVE ON THE ADAPTERS, NOT HERE.
 *
 * This emitter used to hold `HARNESS_SESSION_ENV_VARS = ['CLAUDE_CODE_SESSION_ID',
 * 'CLAUDE_SESSION_ID']` and stamp it into every harness's shim. A vendor variable
 * is a fact about ONE harness, so its home is that harness's adapter
 * (`HarnessAdapter.sessionEnvVars`), and the emitter takes the list as an argument.
 * The old shared constant asserted a claude bridge inside the omp projection — a
 * far end that does not exist on that harness.
 *
 * Why any bridge exists: `memory` resolves a session from `$AGENT_SESSION_ID` (its
 * own `AGENT_*` namespace, beside `$AGENT_HOME`) and must never learn a vendor
 * name. No harness sets that variable, so without a bridge at this boundary every
 * invocation looks sessionless, and the lock/liveness machinery sees a phantom
 * sibling on the very next call.
 */

/**
 * The runtime's own contract variable, and the indirection that lets an operator
 * supply it on a harness that names no session of its own. Spelled here because
 * the shim's REFUSAL has to name the way out of it.
 */
const SESSION_ID_ENV = 'AGENT_SESSION_ID';
const SESSION_ID_FROM_ENV = 'AGENT_SESSION_ID_FROM';

/** The thin-shim source for a capability — a self-contained node forwarder to the
 *  host `<CLI_BIN> <capability>` CLI. Pure `f(capability, sessionEnvVars)`; no
 *  impl, no deps.
 *
 *  `sessionEnvVars` is the projecting harness's own list
 *  (`HarnessAdapter.sessionEnvVars`). EMPTY IS A REAL ANSWER: a harness that
 *  exposes no session id to a child process gets a shim that REFUSES instead of
 *  one that proceeds sessionless. Proceeding is what produced the phantom-sibling
 *  class of failure this seam exists to end, and a shim asserting a bridge whose
 *  far end does not exist is worse than one that says so — measured on omp, which
 *  sets no session variable anywhere in `packages/coding-agent/src` yet received
 *  claude's two names in every projected shim. */
export function runtimeShimContent(
  capability: string,
  sessionEnvVars: readonly string[],
): string {
  const vendors = sessionEnvVars.map((v) => `'${v}'`).join(', ');
  const bridge =
    sessionEnvVars.length > 0
      ? `//
// It also BRIDGES this harness to the runtime's session contract: the runtime reads
// \$${SESSION_ID_ENV} and knows no vendor names, so the adapter belongs here, at the
// boundary, not in the library. An explicit \$${SESSION_ID_ENV} always wins.
import { spawnSync } from 'node:child_process';
const env = { ...process.env };
if (!env.${SESSION_ID_ENV}) {
  for (const k of [${vendors}]) {
    const v = process.env[k];
    if (v) { env.${SESSION_ID_ENV} = v; break; }
  }
}`
      : `//
// THIS HARNESS NAMES NO SESSION. It exposes no session-id variable to a child
// process, so there is nothing to bridge into the runtime's \$${SESSION_ID_ENV}
// contract and this shim REFUSES rather than running sessionless: a fresh id per
// invocation makes every call a different session, and the lock it takes is held
// against a pid that has already exited. The operator's way out is either name,
// and both are the runtime's own — no vendor variable exists to read.
import { spawnSync } from 'node:child_process';
const env = { ...process.env };
if (!env.${SESSION_ID_ENV} && !env.${SESSION_ID_FROM_ENV}) {
  process.stderr.write(
    '${CLI_BIN} ${capability}: no session id — this harness sets none.\\n' +
    'Export \$${SESSION_ID_ENV}=<id>, or \$${SESSION_ID_FROM_ENV}=<VARNAME> to name the variable to read.\\n',
  );
  process.exit(3);
}`;
  return `#!/usr/bin/env node
// THIN SHIM — projected by canon for a skill declaring runtime:{capability:'${capability}'}.
// Forwards to the host-installed \`${CLI_BIN}\` CLI (installed per host, never bundled).
// NOT a bundle of the capability impl — the impl lives host-side behind the runtime
// port, addressed by the CLI, never imported here. Zero cross-package imports.
${bridge}
const r = spawnSync('${CLI_BIN}', ['${capability}', ...process.argv.slice(2)], {
  stdio: 'inherit',
  env,
});
process.exit(r.status ?? 1);
`;
}

/** Emit the thin shim into `<skillDir>/scripts/<capability>.mjs`, executable (0755
 *  so the exec bit survives deploy's mode-preserving copy). Returns the path.
 *  `sessionEnvVars` is the projecting harness's own list
 *  (`HarnessAdapter.sessionEnvVars`) — REQUIRED, because a default here is how a
 *  claude bridge ended up inside every other harness's shim. */
export function emitRuntimeShim(
  skillDir: string,
  capability: string,
  sessionEnvVars: readonly string[],
): string {
  const scriptsDir = join(skillDir, 'scripts');
  mkdirSync(scriptsDir, { recursive: true });
  const dest = join(scriptsDir, `${capability}.mjs`);
  writeFileSync(dest, runtimeShimContent(capability, sessionEnvVars));
  chmodSync(dest, 0o755);
  return dest;
}
