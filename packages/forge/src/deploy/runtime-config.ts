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
// where the runtime looks (`$AGENT_RUNTIME_CONFIG`, else `<home>/.<bin>.json` of the
// home the run was given, the process's when it was given none). The placers own the
// harness home; this owns exactly one file beside it.
// ─────────────────────────────────────────────────────────────────────────────

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { CLI_BIN } from '@cratylus/runtime/bin-name';
import type { JsonValue, Skill } from '@cratylus/schema';
import type { EventName, NativeBinding } from '@cratylus/schema/hook';
import type { RuntimeConfigRecord } from './manifest.js';

/**
 * Where the emitted config lands: `$AGENT_RUNTIME_CONFIG` ▸ `<home>/.<runtime-bin>.json`,
 * where `<home>` is the home the run was given (the user's, which the harness
 * directory hangs from) and, for a run given none, the process's.
 *
 * The resolution the RUNTIME performs, performed here — the two ends of one channel
 * must agree on the file or the write is to nowhere. The env var is honoured because
 * that is what makes the round trip testable without writing into a real home. The
 * home follows the run: a deploy or uninstall given another home reads and writes
 * that home's file and leaves the process's untouched.
 */
export const RUNTIME_CONFIG_ENV = 'AGENT_RUNTIME_CONFIG';

/** The dotfile name, derived from the bin exactly as the runtime derives it. */
export const RUNTIME_CONFIG_NAME = `.${CLI_BIN}.json`;

/** Resolve the emission target the same way the runtime resolves its read. */
export function runtimeConfigTarget(
  env: NodeJS.ProcessEnv = process.env,
  home: string = homedir(),
): string {
  const override = env[RUNTIME_CONFIG_ENV];
  return override && override !== ''
    ? override
    : join(home, RUNTIME_CONFIG_NAME);
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

/** Serialize the document exactly as it lands on disk (2-space, trailing newline). A
 *  document an uninstall has cut down is not an `EmittedRuntimeConfig`, hence the
 *  plain object. */
export function serializeRuntimeConfig(
  doc: EmittedRuntimeConfig | Readonly<Record<string, unknown>>,
): string {
  return `${JSON.stringify(doc, null, 2)}\n`;
}

/** What the emission did, for the deploy log. */
export interface EmitRuntimeConfigResult {
  readonly path: string;
  readonly wrote: boolean;
  /** The document as it stands (or, dry, would stand): cratylus's parts and every
   *  part of the host's that was carried. */
  readonly doc: EmittedRuntimeConfig;
  /** The stanza this emission wrote — `doc.harnesses[harness]`. */
  readonly stanza: EmittedHarness;
  /** What this emission wrote, by digest of each part's value: the part of the file
   *  that is cratylus's, which an uninstall takes out while it is still what was
   *  written and leaves once the host has changed it. The deploy records it. */
  readonly record: RuntimeConfigRecord;
}

/** The sha-256 (hex) of a value as JSON, its object keys in order, so that a part the
 *  host re-serialized with the same content is the part that was written. */
export function digestOf(value: unknown): string {
  const canonical = JSON.stringify(value, (_key, v: unknown) =>
    isPlain(v)
      ? Object.fromEntries(
          Object.entries(v).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
        )
      : v,
  );
  return createHash('sha256').update(canonical).digest('hex');
}

type Plain = Record<string, unknown>;

const isPlain = (v: unknown): v is Plain =>
  v !== null && typeof v === 'object' && !Array.isArray(v);

/** `from` less the named keys. */
function omit(from: Plain, keys: readonly string[]): Plain {
  return Object.fromEntries(
    Object.entries(from).filter(([k]) => !keys.includes(k)),
  );
}

/**
 * Emit the host config.
 *
 * What is cratylus's in the file is the event vocabulary (`events.vocabulary`), the
 * configuration of each capability the corpus configures (`configuration.<capability>`)
 * and each harness's stanza (`harnesses.<harness>`). The vocabulary, the configuration
 * and this harness's stanza are regenerated. Every OTHER harness's stanza is carried
 * over as found: it is that harness's deploy's to write, and replacing it here is how a
 * claude deploy used to erase omp's native names. Everything else in an existing config
 * is the host's and is carried as found: a key of its own at the top, another key under
 * `events`, a capability's configuration the corpus does not write.
 */
export function emitRuntimeConfig(
  opts: EmitRuntimeConfigOpts & {
    readonly path?: string;
    readonly dry?: boolean;
    readonly env?: NodeJS.ProcessEnv;
    /** The home the run was given, whose `<home>/.<bin>.json` is the target when
     *  neither `path` nor `$AGENT_RUNTIME_CONFIG` names one. Absent ⇒ the process's. */
    readonly home?: string;
  },
): EmitRuntimeConfigResult {
  const path = opts.path ?? runtimeConfigTarget(opts.env, opts.home);
  const prior = priorConfig(path);
  const ours = runtimeConfigDocument({
    ...opts,
    harnesses:
      opts.harnesses ??
      (isPlain(prior.harnesses)
        ? (prior.harnesses as Record<string, EmittedHarness>)
        : {}),
  });
  const record: RuntimeConfigRecord = {
    stanza: digestOf(ours.harnesses[opts.harness]),
    vocabulary: digestOf(ours.events.vocabulary),
    capabilities: Object.fromEntries(
      Object.entries(ours.configuration ?? {}).map(([capability, value]) => [
        capability,
        digestOf(value),
      ]),
    ),
  };
  const { events, harnesses: _stanzas, configuration, ...hostKeys } = prior;
  const mergedConfiguration = {
    ...(isPlain(configuration)
      ? omit(configuration, Object.keys(record.capabilities))
      : {}),
    ...ours.configuration,
  };
  // The host's parts ride in the document beside the typed ones, which is why the
  // result is cast: `EmittedRuntimeConfig` names what cratylus emits, not what a host
  // keeps in its own file.
  const doc = {
    events: {
      ...(isPlain(events) ? omit(events, ['vocabulary']) : {}),
      ...ours.events,
    },
    harnesses: ours.harnesses,
    ...(Object.keys(mergedConfiguration).length > 0
      ? { configuration: mergedConfiguration }
      : {}),
    ...hostKeys,
  } as unknown as EmittedRuntimeConfig;
  const stanza = harnessStanza(opts);
  if (opts.dry === true) return { path, wrote: false, doc, stanza, record };
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, serializeRuntimeConfig(doc), 'utf8');
  return { path, wrote: true, doc, stanza, record };
}

/**
 * The existing config as an object, empty when absent, corrupt or not an object.
 * Its harness stanzas are carried as found, not re-read: they are other deploys'
 * output, and this one has no business normalizing them.
 */
function priorConfig(path: string): Plain {
  if (!existsSync(path)) return {};
  try {
    const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'));
    return isPlain(parsed) ? parsed : {};
  } catch {
    // A corrupt config must not wedge a deploy; the vocabulary is re-emitted.
    return {};
  }
}

/** What an uninstall of one harness does to a runtime config. */
export interface RuntimeConfigRemoval {
  /** Whether no other installed harness has a stanza in the file, so that the corpus's
   *  parts went with this one's. */
  readonly last: boolean;
  /** The document once cratylus's parts are out; `null` when nothing is left in it. */
  readonly rest: Plain | null;
  /** The parts of cratylus's that were taken out, as dotted paths. */
  readonly removed: readonly string[];
  /** Parts cratylus placed that the host has changed since, which stand. */
  readonly changed: readonly string[];
  /** Parts of cratylus's that stand because the deploy recorded nothing of what it wrote,
   *  so a change by the host cannot be ruled out. */
  readonly unrecorded: readonly string[];
  /** What stands because the host placed it; reported only for the last harness, for
   *  the others share the file with their own parts. */
  readonly left: readonly string[];
}

/**
 * Take cratylus's parts out of a runtime config for one harness's uninstall, and
 * nothing the host placed or changed. A part is cratylus's to take out while it is what
 * the deploy recorded writing (`record`, by digest of its value): this harness's stanza,
 * and — when no other harness of `installed` still has a stanza in the file — the
 * vocabulary and the configuration of each capability the deploy wrote. A part the host
 * has changed since stands and is named, as does every part when `record` is `null`, a
 * deploy from before it was kept. `undefined` when the config holds no stanza of this
 * harness, so there is nothing of its to remove.
 */
export function withoutRuntimeParts(
  doc: Plain,
  opts: {
    readonly harness: string;
    /** The harnesses other than this one that are installed — each has a deploy record. */
    readonly installed: readonly string[];
    readonly record: RuntimeConfigRecord | null;
  },
): RuntimeConfigRemoval | undefined {
  const { harness, record } = opts;
  if (!isPlain(doc.harnesses) || !Object.hasOwn(doc.harnesses, harness)) {
    return undefined;
  }
  const last = !opts.installed.some(
    (name) => name !== harness && Object.hasOwn(doc.harnesses as Plain, name),
  );
  const removed: string[] = [];
  const changed: string[] = [];
  const unrecorded: string[] = [];
  /** Whether the part at `path` is cratylus's to take out, said once either way. */
  const settle = (
    path: string,
    value: unknown,
    recorded: string | undefined,
  ): boolean => {
    if (record === null) unrecorded.push(path);
    else if (recorded !== undefined && digestOf(value) === recorded) {
      removed.push(path);
      return true;
    } else changed.push(path);
    return false;
  };

  let harnesses: Plain = doc.harnesses;
  let events = doc.events;
  let configuration = doc.configuration;
  if (settle(`harnesses.${harness}`, harnesses[harness], record?.stanza)) {
    harnesses = omit(harnesses, [harness]);
  }
  if (last) {
    if (
      isPlain(events) &&
      Object.hasOwn(events, 'vocabulary') &&
      settle('events.vocabulary', events.vocabulary, record?.vocabulary)
    ) {
      events = omit(events, ['vocabulary']);
    }
    if (isPlain(configuration)) {
      const present = configuration;
      const capabilities =
        record === null
          ? Object.keys(present)
          : Object.keys(record.capabilities).filter((c) =>
              Object.hasOwn(present, c),
            );
      configuration = omit(
        present,
        capabilities.filter((capability) =>
          settle(
            `configuration.${capability}`,
            present[capability],
            record?.capabilities[capability],
          ),
        ),
      );
    }
  }

  // What is left of each block stays; a block this took the last entry out of goes, for
  // deploy added it whole.
  const rest: Plain = Object.fromEntries(
    Object.entries({ ...doc, harnesses, events, configuration }).filter(
      ([key, block]) =>
        block !== undefined &&
        !(
          isPlain(block) &&
          Object.keys(block).length === 0 &&
          removed.some((path) => path.startsWith(`${key}.`))
        ),
    ),
  );

  const left: string[] = [];
  if (last) {
    const named = new Set([...changed, ...unrecorded]);
    for (const [key, value] of Object.entries(rest)) {
      const paths =
        isPlain(value) && ['events', 'harnesses', 'configuration'].includes(key)
          ? Object.keys(value).map((k) => `${key}.${k}`)
          : [key];
      for (const path of paths) if (!named.has(path)) left.push(path);
    }
  }
  return {
    last,
    rest: Object.keys(rest).length > 0 ? rest : null,
    removed,
    changed,
    unrecorded,
    left,
  };
}
