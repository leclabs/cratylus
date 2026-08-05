// ─────────────────────────────────────────────────────────────────────────────
// The HOST RUNTIME CONFIG, EMITTED.
//
// ARCHITECTURE property 4, verbatim: "Runtime depends on nothing. It is the
// deployed base, and everything corpus-specific reaches it as configuration the
// projection emitted." The runtime already READ such a config
// (`runtime/src/runtime-config.ts`, `~/.cratylus-run.json`) and nothing had ever
// WRITTEN one — the channel existed with no producer, which is why the lifecycle
// vocabulary reached the runtime the only other way a vocabulary can travel: by
// being spelled a second time. `runtime/src/events.ts` held canon's 28 event names,
// hand-authored, identical to schema's generated 28 as a set AND in order.
//
// So this module is the producer, and it is a NEW CAPABILITY rather than a move.
// What it emits is a function of two inputs and nothing else:
//   · the CORPUS's vocabulary — `AgentPlugin.events`, DATA on the plugin, which is
//     how canon reaches the projector at all (property 3);
//   · the ADAPTER's native map — `HarnessAdapter.nativeEvents`, the projection's own.
// Both are already resolved by the time deploy runs. Nothing here decides anything
// about either; a projector that decided would be containing a design.
//
// WHY IT LANDS OUTSIDE THE HARNESS HOME. Every other deploy target is a file inside
// `.claude/` or `.codex/`. This one is not a harness artifact at all: it configures
// the runtime, which is harness-independent and installed globally, so it lands
// where the runtime looks (`$AGENT_RUNTIME_CONFIG`, else `~/.<bin>.json`). The
// placers own the harness home; this owns exactly one file beside it.
// ─────────────────────────────────────────────────────────────────────────────

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { RUNTIME_BIN } from '@cratylus/runtime/bin-name';
import type { EventName } from '@cratylus/schema/hook';

/**
 * Where the emitted config lands: `$AGENT_RUNTIME_CONFIG` ▸ `~/.<runtime-bin>.json`.
 *
 * The resolution the RUNTIME performs, performed here — the two ends of one channel
 * must agree on the file or the write is to nowhere. The env var is honoured because
 * that is what makes the round trip testable without writing into a real home.
 */
export const RUNTIME_CONFIG_ENV = 'AGENT_RUNTIME_CONFIG';

/** The dotfile name, derived from the bin exactly as the runtime derives it. */
export const RUNTIME_CONFIG_NAME = `.${RUNTIME_BIN}.json`;

/** Resolve the emission target the same way the runtime resolves its read. */
export function runtimeConfigTarget(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const override = env[RUNTIME_CONFIG_ENV];
  return override && override !== ''
    ? override
    : join(homedir(), RUNTIME_CONFIG_NAME);
}

/**
 * The lifecycle-vocabulary half of the emitted config.
 *
 * TWO FIELDS, NOT ONE, because they answer different questions and only the first
 * is harness-independent:
 *   · `vocabulary` — every name the corpus signifies. The runtime validates against
 *     it, so an unmapped-but-real event is rejected as UNREALIZABLE HERE rather than
 *     as an unknown word — the distinction the fidelity ladder rests on.
 *   · `native` — this harness's peers, for the events it can actually fire.
 */
export interface EmittedEvents {
  readonly vocabulary: readonly EventName[];
  readonly native: Readonly<Record<EventName, string>>;
}

/** What `deploy` writes, and `loadRuntimeConfig` reads back. */
export interface EmittedRuntimeConfig {
  readonly resolveFrom?: string;
  readonly capabilities: readonly string[];
  readonly events: EmittedEvents;
}

/** The corpus + adapter facts the emission is a pure function of. */
export interface EmitRuntimeConfigOpts {
  /** The corpus's event vocabulary — `AgentPlugin.events`, merged over the set. */
  readonly events: readonly EventName[];
  /** The harness's native map — `HarnessAdapter.nativeEvents`. */
  readonly nativeEvents: Readonly<Record<EventName, string>>;
  /** Capability provider specifiers the host should register. */
  readonly capabilities?: readonly string[];
  /** Dir whose `node_modules` those specifiers resolve against. */
  readonly resolveFrom?: string;
}

/**
 * Build the host config document. PURE — no clock, no host, no file — so the
 * round-trip gate can drive it and compare what comes back against both authorities
 * it was built from.
 *
 * The native map is FILTERED to the vocabulary: a harness peer for a name the corpus
 * does not signify is not a fact about this corpus, and emitting it would let a
 * second vocabulary in through the map's keys — the exact re-entry this repair
 * exists to close.
 */
export function runtimeConfigDocument(
  opts: EmitRuntimeConfigOpts,
): EmittedRuntimeConfig {
  if (opts.events.length === 0) {
    throw new Error(
      'runtimeConfigDocument: the plugin set declares no lifecycle events — a host ' +
        'config with an empty vocabulary leaves every runtime capability unable to ' +
        'validate, which is silence wearing a success',
    );
  }
  const declared = new Set(opts.events);
  const native: Record<string, string> = {};
  for (const [event, nativeName] of Object.entries(opts.nativeEvents)) {
    if (declared.has(event)) native[event] = nativeName;
  }
  return {
    ...(opts.resolveFrom !== undefined
      ? { resolveFrom: opts.resolveFrom }
      : {}),
    capabilities: [...(opts.capabilities ?? [])],
    events: { vocabulary: [...opts.events], native },
  };
}

/** Serialize the document exactly as it lands on disk (2-space, trailing newline). */
export function serializeRuntimeConfig(doc: EmittedRuntimeConfig): string {
  return `${JSON.stringify(doc, null, 2)}\n`;
}

/** What the emission did, for the deploy log. */
export interface EmitRuntimeConfigResult {
  readonly path: string;
  readonly wrote: boolean;
  readonly doc: EmittedRuntimeConfig;
}

/**
 * Emit the host config.
 *
 * `capabilities` are PRESERVED from an existing config when the caller supplies
 * none. A host's provider selection is the OPERATOR's declaration, made once and
 * kept; the vocabulary is the corpus's, regenerated every deploy. Overwriting the
 * first to deliver the second would make every deploy silently reset which memory
 * strategy that host runs — a behaviour change wearing a projection.
 */
export function emitRuntimeConfig(
  opts: EmitRuntimeConfigOpts & {
    readonly path?: string;
    readonly dry?: boolean;
    readonly env?: NodeJS.ProcessEnv;
  },
): EmitRuntimeConfigResult {
  const path = opts.path ?? runtimeConfigTarget(opts.env);
  const prior = readPriorCapabilities(path);
  const doc = runtimeConfigDocument({
    ...opts,
    capabilities: opts.capabilities ?? prior.capabilities,
    ...(opts.resolveFrom === undefined && prior.resolveFrom !== undefined
      ? { resolveFrom: prior.resolveFrom }
      : {}),
  });
  if (opts.dry === true) return { path, wrote: false, doc };
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, serializeRuntimeConfig(doc), 'utf8');
  return { path, wrote: true, doc };
}

/** The operator-owned half of an existing config; empty when absent or corrupt. */
function readPriorCapabilities(path: string): {
  capabilities: readonly string[];
  resolveFrom?: string;
} {
  if (!existsSync(path)) return { capabilities: [] };
  try {
    const raw = JSON.parse(readFileSync(path, 'utf8')) as {
      capabilities?: unknown;
      resolveFrom?: unknown;
    };
    return {
      capabilities: Array.isArray(raw.capabilities)
        ? raw.capabilities.filter((s): s is string => typeof s === 'string')
        : [],
      ...(typeof raw.resolveFrom === 'string'
        ? { resolveFrom: raw.resolveFrom }
        : {}),
    };
  } catch {
    // A corrupt config must not wedge a deploy; the vocabulary is re-emitted and
    // the operator's unreadable selection is not silently invented.
    return { capabilities: [] };
  }
}
