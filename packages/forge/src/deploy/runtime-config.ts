// ─────────────────────────────────────────────────────────────────────────────
// The HOST RUNTIME CONFIG, EMITTED.
//
// ARCHITECTURE property 4, verbatim: "Runtime depends on nothing. It is the
// deployed base, and everything corpus-specific reaches it as configuration the
// projection emitted." The runtime already READ such a config
// (`runtime/src/runtime-config.ts`, `~/.cratylus.json`) and nothing had ever
// WRITTEN one — the channel existed with no producer, which is why the lifecycle
// vocabulary reached the runtime the only other way a vocabulary can travel: by
// being spelled a second time. `runtime/src/events.ts` held canon's 28 event names,
// hand-authored, identical to schema's generated 28 as a set AND in order.
//
// So this module is the producer, and it is a NEW CAPABILITY rather than a move.
// What it emits is a function of three inputs and nothing else:
//   · the CORPUS's vocabulary — `AgentPlugin.events`, DATA on the plugin, which is
//     how canon reaches the projector at all (property 3);
//   · the ADAPTER's native map — `HarnessAdapter.nativeEvents`, under its `name`;
//   · the CORPUS's capability configuration — what each skill's runtime face
//     declares under `runtime.configuration`, keyed here by its capability.
// All are already resolved by the time deploy runs. Nothing here decides anything
// about any of them; a projector that decided would be containing a design.
//
// WHY IT LANDS OUTSIDE THE HARNESS HOME. Every other deploy target is a file inside
// `.claude/` or `.omp/`. This one is not a harness artifact at all: it configures
// the runtime, which is harness-independent and installed globally, so it lands
// where the runtime looks (`$AGENT_RUNTIME_CONFIG`, else `~/.<bin>.json`). The
// placers own the harness home; this owns exactly one file beside it.
// ─────────────────────────────────────────────────────────────────────────────

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { CLI_BIN } from '@cratylus/runtime/bin-name';
import type { JsonValue, Skill } from '@cratylus/schema';
import type { EventName, NativeBinding } from '@cratylus/schema/hook';

/**
 * Where the emitted config lands: `$AGENT_RUNTIME_CONFIG` ▸ `~/.<runtime-bin>.json`.
 *
 * The resolution the RUNTIME performs, performed here — the two ends of one channel
 * must agree on the file or the write is to nowhere. The env var is honoured because
 * that is what makes the round trip testable without writing into a real home.
 */
export const RUNTIME_CONFIG_ENV = 'AGENT_RUNTIME_CONFIG';

/** The dotfile name, derived from the bin exactly as the runtime derives it. */
export const RUNTIME_CONFIG_NAME = `.${CLI_BIN}.json`;

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
 * The lifecycle-vocabulary half of the emitted config — the corpus's, and
 * harness-independent.
 *
 * `vocabulary` is every name the corpus signifies. The runtime validates against
 * it, so an unmapped-but-real event is rejected as UNREALIZABLE HERE rather than as
 * an unknown word — the distinction the fidelity ladder rests on. Which of those
 * names a harness can fire is that harness's alone, in its {@link EmittedHarness}.
 */
export interface EmittedEvents {
  readonly vocabulary: readonly EventName[];
}

/**
 * The native ⟨event, selector⟩ pair an act realizes as on one harness — the pair the
 * projection itself emits, so a runtime that binds it binds the same moment.
 */
export interface EmittedActBinding {
  readonly event: string;
  readonly matcher?: string;
}

/**
 * One harness's stanza, `harnesses.<harness>`: its native name for each event in
 * the vocabulary it can actually fire, and — for an act, which is a native event
 * narrowed to the tool that performs it — the binding that narrows it. An act is
 * under `acts` and never under `native`: `native` reverses (native → canonical) and
 * several acts share one native event.
 */
export interface EmittedHarness {
  readonly native: Readonly<Record<EventName, string>>;
  readonly acts?: Readonly<Record<EventName, EmittedActBinding>>;
}

/** What `deploy` writes, and `loadRuntimeConfig` reads back. */
export interface EmittedRuntimeConfig {
  readonly events: EmittedEvents;
  /**
   * One stanza per harness, keyed by the adapter's `name`. A deploy writes its own
   * harness's stanza and carries every other one over as it found it: one host runs
   * several harnesses off one runtime, and a single flat map let the last deploy
   * overwrite the others' names with its own.
   */
  readonly harnesses: Readonly<Record<string, EmittedHarness>>;
  /**
   * Each capability's configuration, as the corpus's skills declare it on their
   * runtime face. Regenerated every deploy, like `events`, and harness-independent.
   * Absent when no skill declares any: an empty block and no block are one fact.
   */
  readonly configuration?: Readonly<Record<string, JsonValue>>;
}

/** The corpus + adapter facts the emission is a pure function of. */
export interface EmitRuntimeConfigOpts {
  /** The corpus's event vocabulary — `AgentPlugin.events`, merged over the set. */
  readonly events: readonly EventName[];
  /** The harness whose stanza this emission writes — `HarnessAdapter.name`. */
  readonly harness: string;
  /** That harness's native map — `HarnessAdapter.nativeEvents`. */
  readonly nativeEvents: Readonly<Record<EventName, string>>;
  /** That harness's act bindings — `HarnessAdapter.nativeActs`, when it has any. */
  readonly nativeActs?: Readonly<Record<EventName, NativeBinding>>;
  /** Every other harness's stanza, carried over unchanged. */
  readonly harnesses?: Readonly<Record<string, EmittedHarness>>;
  /** The resolved plugin set's skills; their runtime faces carry the configuration. */
  readonly skills?: readonly Pick<Skill, 'name' | 'runtime'>[];
}

/**
 * Build the host config document. PURE — no clock, no host, no file — so the
 * round-trip gate can drive it and compare what comes back against both authorities
 * it was built from.
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
  const configuration = configurationOf(opts.skills ?? []);
  return {
    events: { vocabulary: [...opts.events] },
    harnesses: {
      ...opts.harnesses,
      [opts.harness]: harnessStanza(opts),
    },
    ...(Object.keys(configuration).length > 0 ? { configuration } : {}),
  };
}

/**
 * One harness's stanza: its native map and its act bindings, each FILTERED to the
 * vocabulary. A harness peer for a name the corpus does not signify is not a fact
 * about this corpus, and emitting it would let a second vocabulary in through the
 * map's keys — the exact re-entry the vocabulary repair exists to close.
 *
 * `acts` is absent when the harness binds none (or none the corpus signifies): an
 * empty block and no block are one fact, and a names-only stanza is what an earlier
 * deploy wrote. Only the pair the runtime binds by — event and matcher — is emitted;
 * the adapter's own prose about a loss (`NativeBinding.unnarrowed`) is the
 * projection's report, not the host's configuration.
 */
function harnessStanza(
  opts: Pick<EmitRuntimeConfigOpts, 'events' | 'nativeEvents' | 'nativeActs'>,
): EmittedHarness {
  const declared = new Set(opts.events);
  const native: Record<string, string> = {};
  for (const [event, nativeName] of Object.entries(opts.nativeEvents)) {
    if (declared.has(event)) native[event] = nativeName;
  }
  const acts: Record<string, EmittedActBinding> = {};
  for (const [event, { event: nativeName, matcher }] of Object.entries(
    opts.nativeActs ?? {},
  )) {
    if (declared.has(event))
      acts[event] = {
        event: nativeName,
        ...(matcher === undefined ? {} : { matcher }),
      };
  }
  return { native, ...(Object.keys(acts).length > 0 ? { acts } : {}) };
}

/**
 * Gather each capability's configuration off the skills' runtime faces.
 *
 * Two skills configuring ONE capability is refused rather than merged or
 * last-wins: either choice would be the projector deciding which half of the
 * corpus's meaning the runtime receives.
 */
function configurationOf(
  skills: readonly Pick<Skill, 'name' | 'runtime'>[],
): Record<string, JsonValue> {
  const configuration: Record<string, JsonValue> = {};
  const owner = new Map<string, string>();
  for (const { name, runtime } of skills) {
    if (runtime?.configuration === undefined) continue;
    const prior = owner.get(runtime.capability);
    if (prior !== undefined) {
      throw new Error(
        `runtimeConfigDocument: skills '${prior}' and '${name}' both configure capability '${runtime.capability}' — one capability receives one configuration, and choosing between them is not the projection's to do`,
      );
    }
    owner.set(runtime.capability, name);
    configuration[runtime.capability] = runtime.configuration;
  }
  return configuration;
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
  /** The stanza this emission wrote — `doc.harnesses[harness]`. */
  readonly stanza: EmittedHarness;
}

/**
 * Emit the host config.
 *
 * The corpus's parts (`events`, `configuration`) and this harness's stanza are
 * regenerated. Every OTHER harness's stanza is carried over as found: it is that
 * harness's deploy's to write, and replacing it here is how a claude deploy used to
 * erase omp's native names. Nothing else in an existing config is carried.
 */
export function emitRuntimeConfig(
  opts: EmitRuntimeConfigOpts & {
    readonly path?: string;
    readonly dry?: boolean;
    readonly env?: NodeJS.ProcessEnv;
  },
): EmitRuntimeConfigResult {
  const path = opts.path ?? runtimeConfigTarget(opts.env);
  const doc = runtimeConfigDocument({
    ...opts,
    harnesses: opts.harnesses ?? priorHarnesses(path),
  });
  const stanza = harnessStanza(opts);
  if (opts.dry === true) return { path, wrote: false, doc, stanza };
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, serializeRuntimeConfig(doc), 'utf8');
  return { path, wrote: true, doc, stanza };
}

/**
 * Every harness's stanza in an existing config, empty when absent or corrupt.
 * Stanzas are carried as found, not re-read: they are other deploys' output, and
 * this one has no business normalizing them.
 */
function priorHarnesses(
  path: string,
): Readonly<Record<string, EmittedHarness>> {
  if (!existsSync(path)) return {};
  try {
    const { harnesses } = JSON.parse(readFileSync(path, 'utf8')) as {
      harnesses?: unknown;
    };
    return harnesses !== null &&
      typeof harnesses === 'object' &&
      !Array.isArray(harnesses)
      ? (harnesses as Record<string, EmittedHarness>)
      : {};
  } catch {
    // A corrupt config must not wedge a deploy; the vocabulary is re-emitted.
    return {};
  }
}
