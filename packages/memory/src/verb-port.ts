// ─────────────────────────────────────────────────────────────────────────────
// The memory capability's RUNTIME VERB-PORT — the argv→verb marshalling the kernel
// dispatches against.
//
// The runtime dispatcher (`@cratylus/runtime`) treats a capability port as an
// OPAQUE BAG OF VERB HANDLERS: it hands each verb a generic `VerbArgs`
// (`{positionals, flags}`) and serializes the return to stdout, mapping a throw to a
// code-1 failure. Per the dispatcher's law, "per-verb argv marshalling for a real
// capability is that capability package's concern, not the kernel's" — so THIS file
// is that concern for memory. It re-presents the standalone `memory` CLI (`cli.ts`
// `main`) as the kernel's verb bag: each memory verb reconstructs the argv tail and
// delegates to the tested `main`, so `agent-runtime memory <verb>` is byte-identical
// to the retired `memory <verb>` bin — the whole point of the runtime migration
// (memory-on-PATH DISSOLVED into a normal capability the runtime dispatches).
//
// The typed {@link AgentMemory} strategy stays the PROGRAMMATIC API (imported and
// called with typed args); this verb-port is its CLI face for the runtime. The
// kernel casts a port through `MemoryStrategy` (see its own tests' fake port), so a
// same-named verb bag binds + resolves identically.
// ─────────────────────────────────────────────────────────────────────────────

import type { MemoryStrategy } from '@cratylus/runtime';
import type { VerbArgs } from '@cratylus/runtime/dispatch';
import { main } from './cli.js';

/**
 * The memory verbs the runtime dispatches — the `cli.ts` command set minus the
 * meta words (`--version`/`--help`) and the RETIRED `install` self-check (S7: the
 * per-host runtime install replaces it). One handler is minted per name below.
 *
 * SECOND ENUMERATION, GATED. This list and `cli.ts`'s per-verb flag table are two
 * homes for one set, and they diverge SILENTLY: a verb present in `cli.ts` but
 * missing here typechecks, passes every unit test, and is simply unreachable
 * through the runtime — which is how `get` and `rollover` shipped dead. The
 * equality is pinned by `test/verb-roster.test.ts`; do not add a verb to one
 * without the other.
 */
export const MEMORY_VERBS = [
  'init',
  'encode',
  'read',
  'node',
  'home',
  'fold',
  'lock',
  'session',
  'migrate',
  'drain',
  'apply',
  'get',
  'replace',
  'rollover',
  'audit',
] as const;

/**
 * Reserialize a parsed `{positionals, flags}` back to an argv tail. The runtime
 * dispatcher and `cli.ts` share ONE flag grammar (`--flag value` / `--flag=value` /
 * boolean `--flag` / positionals), so this round-trips faithfully: positionals
 * first, a boolean flag as `--flag`, a valued flag as `--flag value` (already one
 * argv element each, so a value with spaces survives without shell requoting).
 */
export function verbArgsToArgv(a: VerbArgs): string[] {
  const argv: string[] = [...a.positionals];
  for (const [key, value] of Object.entries(a.flags)) {
    argv.push(`--${key}`);
    if (typeof value === 'string') argv.push(value);
  }
  return argv;
}

/**
 * Build the memory runtime verb-port: one handler per {@link MEMORY_VERBS} that
 * marshals the kernel's `VerbArgs` into a `memory <verb> …` invocation of the tested
 * cli `main`, returns its stdout (the kernel serializes it), and throws its stderr
 * on a non-zero exit (the kernel maps a throw to a code-1 failure). The result is a
 * verb bag the runtime dispatches against; the typed `MemoryStrategy` face is the
 * cast the kernel already uses for a port, so binding/resolution are unchanged.
 */
export function memoryVerbPort(): MemoryStrategy {
  const port: Record<string, (a: VerbArgs) => string> = {};
  for (const verb of MEMORY_VERBS) {
    port[verb] = (a: VerbArgs): string => {
      const { code, out, err } = main([verb, ...verbArgsToArgv(a)]);
      if (code !== 0) {
        throw new Error(err.trim() || `memory ${verb} exited ${code}`);
      }
      return out;
    };
  }
  return port as unknown as MemoryStrategy;
}
