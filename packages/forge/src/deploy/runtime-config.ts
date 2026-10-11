// ─────────────────────────────────────────────────────────────────────────────
// The HOST RUNTIME CONFIG — what a capability is configured with, and the EARLIER
// layout's host config.
//
// The corpus's capability configuration — what each skill's runtime face declares
// under `runtime.configuration`, keyed by its capability — is data on the plugin set,
// and install writes it into the owned root (`runtime.json`), where the runtime reads
// it (`@cratylus/runtime/runtime-config`). Nothing else is written there.
//
// The EARLIER layout wrote a host config beside the harness home, `<home>/.<bin>.json`
// (or `$AGENT_RUNTIME_CONFIG`), with the event vocabulary, each harness's stanza and the
// configuration, and recorded what it wrote by digest in its deploy manifest. An upgrade
// or uninstall takes those parts out again while they are what was written, or where it
// was written before such a record was kept ({@link withoutRuntimeParts}), and leaves
// every part the host placed or changed.
// ─────────────────────────────────────────────────────────────────────────────

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import {
  RUNTIME_CONFIG_ENV,
  RUNTIME_CONFIG_NAME,
} from '@cratylus/runtime/runtime-config';
import type { JsonValue, Skill } from '@cratylus/schema';
import type { RuntimeConfigRecord } from './manifest.js';

/** Where the earlier layout's host config is: `$AGENT_RUNTIME_CONFIG` ▸
 *  `<home>/.<bin>.json`, the home the run was given or the process's. */
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
 * Gather each capability's configuration off the skills' runtime faces.
 *
 * Two skills configuring ONE capability is refused rather than merged or
 * last-wins: either choice would be the projector deciding which half of the
 * corpus's meaning the runtime receives.
 */
export function capabilityConfiguration(
  skills: readonly Pick<Skill, 'name' | 'runtime'>[],
): Record<string, JsonValue> {
  const configuration: Record<string, JsonValue> = {};
  const owner = new Map<string, string>();
  for (const { name, runtime } of skills) {
    if (runtime?.configuration === undefined) continue;
    const prior = owner.get(runtime.capability);
    if (prior !== undefined) {
      throw new Error(
        `capability configuration: skills '${prior}' and '${name}' both configure capability '${runtime.capability}' — one capability receives one configuration, and choosing between them is not the projection's to do`,
      );
    }
    owner.set(runtime.capability, name);
    configuration[runtime.capability] = runtime.configuration;
  }
  return configuration;
}

/** Serialize a config exactly as it lands on disk (2-space, trailing newline). */
export function serializeRuntimeConfig(
  doc: Readonly<Record<string, unknown>>,
): string {
  return `${JSON.stringify(doc, null, 2)}\n`;
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
 * What is wrong with the runtime config at `path`, said as the tail of a sentence
 * about the file; `undefined` when there is none or it reads as a JSON object. A file
 * that is there and cannot be read so is the host's bytes: nothing here rewrites it.
 */
export function unreadableRuntimeConfig(path: string): string | undefined {
  if (!existsSync(path)) return undefined;
  let text: string;
  try {
    text = readFileSync(path, 'utf8');
  } catch (e) {
    return `cannot be read (${(e as Error).message})`;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return 'is not valid JSON';
  }
  return isPlain(parsed) ? undefined : 'is not a JSON object';
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
 * has changed since stands and is named. Where `record` is `null`, a deploy from before
 * it was kept, every one of those parts is cratylus's by that deploy, and goes
 * (decision 0114). `undefined` when the config holds no stanza of this harness, so
 * there is nothing of its to remove.
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
  /** Whether the part at `path` is cratylus's to take out, said once either way. */
  const settle = (
    path: string,
    value: unknown,
    recorded: string | undefined,
  ): boolean => {
    if (
      record === null ||
      (recorded !== undefined && digestOf(value) === recorded)
    ) {
      removed.push(path);
      return true;
    }
    changed.push(path);
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
    for (const [key, value] of Object.entries(rest)) {
      const paths =
        isPlain(value) && ['events', 'harnesses', 'configuration'].includes(key)
          ? Object.keys(value).map((k) => `${key}.${k}`)
          : [key];
      for (const path of paths) if (!changed.includes(path)) left.push(path);
    }
  }
  return {
    last,
    rest: Object.keys(rest).length > 0 ? rest : null,
    removed,
    changed,
    left,
  };
}
