// `HookDeclaration` is a hook's source declaration: a harness lifecycle event and its
// worker payload. It names canonical events; the canon narrows that vocabulary, and the
// harness adapter supplies the native event binding and invocation.
//
// Worker templates may name projector-owned facts and declared speech. Projection
// resolves those placeholders into the bytes deployed from each `targetPath`;
// the schema carries the template, never its runtime-dependent values.

import type { EventName, Hook, Substrate } from './hook/index.js';

/** Which substrate a hook's event fires in — the `realize`-target family. */
export type HookSubstrate = Substrate;

/**
 * A value only PROJECTION knows, named by a worker template as `{{fact:<name>}}`.
 *
 * A CLOSED SET OF NAMES, never of values. The projector owns every value (see
 * `projectionFacts()` in the projector); this union states only WHICH facts a hook
 * may ask for, so a typo is a compile error and an unknown name is a resolve-time
 * throw.
 *
 * "ADDING A MEMBER COSTS THE PROJECTOR ONE ENTRY AND NOTHING ELSE" holds only where
 * the value already has a home to bind, as `runtime-bin` did; minting a home for one
 * that has none is a NAMING act, not a table edit. The estimate stands for the
 * PROJECTOR'S side of the seam and nowhere else.
 *
 * Adapter-relative facts take the harness's own name and hook-config filename from
 * the same adapter that renders its hook configuration; templates never carry a
 * second harness table.
 */
export type ProjectionFact =
  /** The runtime executable's name on PATH (`CLI_BIN`). */
  | 'runtime-bin'
  /** WHICH harness this projection is for — the adapter's canonical name. */
  | 'harness-name'
  /** This harness's hook-config artifact (`settings.json` / `hooks.json`). */
  | 'harness-hooks-file';
/** The projector's fact table — every `ProjectionFact` bound to its value. */
export type ProjectionFacts = Readonly<Record<ProjectionFact, string>>;

/**
 * One string a hook SPEAKS to an agent — bytes that land in a reader's context,
 * addressed from the worker template as `{{speech:<id>}}`.
 *
 * It has a declared home because it is the only hook content scored at R=LLM that
 * had none: it lived as `printf` bodies inside shell workers, reachable only by
 * parsing shell, which is a proxy for the property rather than the property.
 * PRODUCT-OWNER diagnostics (`>&2`) are not speech; neither is the shell's own machinery.
 */
export interface HookMessage {
  /** Stable id — the `{{speech:<id>}}` address. */
  readonly id: string;
  /** The bytes the agent reads. Scored at R=LLM like any other reader surface. */
  readonly text: string;
}

/** One worker payload a hook ships — the template behind a deploy target's bytes. */
export interface HookWorker {
  /** Basename under `hooks/<id>/` in the render/deploy tree. */
  readonly filename: string;
  /** Repo-relative committed target regenerated from RESOLVED `content`. */
  readonly targetPath: string;
  /**
   * The worker TEMPLATE — verbatim bytes except for a closed placeholder set:
   * `{{fact:<ProjectionFact>}}` and `{{speech:<id>}}`. Everything else, `{`
   * and `}` included, is carried through untouched. `resolveWorker` turns this
   * into the bytes that deploy; nothing consumes it raw.
   */
  readonly content: string;
  /** Whether the regenerated target carries the executable bit. */
  readonly executable: boolean;
}

/**
 * A `hook` source declaration (source grain), carrying its verbatim worker payloads.
 *
 * `E` is the CANON'S event vocabulary. Left at its default this declaration accepts
 * any `EventName`, which is all this package can say; the canon aliases it against
 * its own declared tuple and gets the compile error back.
 */
export interface HookDeclaration<E extends EventName = EventName> {
  /** Stable id → `hooks/<id>/`; the hook's term `term(c)` (== the filename). */
  readonly id: string;
  /** The correction written beside the term (`body = ⟨term, correction⟩`). */
  readonly correction: string;
  /** Which substrate the event fires in. */
  readonly substrate: HookSubstrate;
  /** The harness-agnostic events that trigger the hook (≥1). */
  /**
   * Explicit run order within an event. A dir-scan would otherwise impose
   * ALPHABETICAL order, silently reordering hooks whose sequence is semantic — a
   * blocking gate must evaluate before a non-blocking nudge. Lower runs first;
   * unset sorts last, then by id.
   */
  readonly order?: number;
  readonly events: readonly [E, ...E[]];
  /**
   * WHICH worker is the entry point — a `workers[].filename`, never a path and
   * never a command. The adapter turns ⟨id, entry⟩ into the invocation its harness
   * needs; a declaration that spelled that out would have chosen a face.
   */
  readonly entry: string;
  /** Timeout in seconds; adapter default when omitted. */
  readonly timeout?: number;
  /** The worker payload templates (byte-identity pins, once resolved). */
  readonly workers: readonly HookWorker[];
  /**
   * What this hook SPEAKS to an agent, addressed as `{{speech:<id>}}` from a
   * worker template. Absent on a hook that says nothing to a reader.
   */
  readonly speech?: readonly HookMessage[];
  /** Terms this hook references. */
  readonly refs?: readonly string[];
}

/**
 * One source-of-truth entry per harness hook: the `Hook` config-IR + its verbatim
 * workers. A projector serializes `hook` into settings.json and writes each worker's
 * `content` under `hooks/<hook.id>/` (byte-identity pin — no on-disk copy).
 */
export interface HookSource {
  readonly hook: Hook;
  readonly workers: readonly HookWorker[];
}

/**
 * Every `{{…}}` occurrence. The BODY may not itself contain a brace, so a shell
 * `${VAR}` — one brace — never matches, and `${X:-{{fact:y}}}` matches exactly the
 * inner placeholder and leaves the closing shell brace alone.
 */
const PLACEHOLDER = /\{\{([^{}]*)\}\}/g;

/**
 * Resolve one worker TEMPLATE into the bytes that deploy.
 *
 * PURE: a function of the worker, the projector's fact table, and the hook's
 * speech — no clock, no host, no file. That is what keeps the byte-identity pin a pin
 * when its subject moved from the declaration's literal to the resolved bytes.
 *
 * IT THROWS ON AN UNKNOWN PLACEHOLDER, and that is the load-bearing half. A silent
 * pass-through would ship a literal `{{fact:runtime-bin}}` into a deployed `.sh`,
 * where it fails on a host at run time rather than here — the exact class of defect
 * this whole seam exists to close.
 */
export function resolveWorker(
  worker: HookWorker,
  facts: ProjectionFacts,
  speech: readonly HookMessage[] = [],
): HookWorker {
  const said = new Map(speech.map((m) => [m.id, m.text]));
  const said_ids = [...said.keys()].join(', ') || 'none';
  const content = worker.content.replace(
    PLACEHOLDER,
    (whole: string, body: string): string => {
      const at = body.indexOf(':');
      const kind = at < 0 ? body : body.slice(0, at);
      const id = at < 0 ? '' : body.slice(at + 1);
      const where = `resolveWorker: '${worker.filename}' names ${whole}`;
      if (kind === 'fact') {
        const value = (facts as Readonly<Record<string, string | undefined>>)[
          id
        ];
        if (value === undefined) {
          throw new Error(
            `${where}, which is not a projection fact (known: ${Object.keys(facts).join(', ') || 'none'}).`,
          );
        }
        return value;
      }
      if (kind === 'speech') {
        const text = said.get(id);
        if (text === undefined) {
          throw new Error(
            `${where}, which is not one of the hook's speech ids (${said_ids}).`,
          );
        }
        return text;
      }
      throw new Error(
        `${where}; the grammar is {{fact:<name>}} | {{speech:<id>}} and nothing else.`,
      );
    },
  );
  return { ...worker, content };
}

/**
 * Lift a harness-substrate hook declaration into the `Hook` config-IR. A `git`-substrate
 * hook fires in git's process and is rejected here — it must not reach
 * settings.json. Doctrine-free: references no specific hook, and no specific event.
 */
export function hookIrOf(
  declaration: HookDeclaration,
  hookCommand: (id: string, entry: string) => string,
): Hook {
  if (declaration.substrate !== 'harness') {
    throw new Error(
      `hookIrOf: '${declaration.id}' is substrate=${declaration.substrate}; only harness hooks serialize to settings.json`,
    );
  }
  if (!declaration.workers.some((w) => w.filename === declaration.entry)) {
    throw new Error(
      `hookIrOf: '${declaration.id}' names entry '${declaration.entry}', which is not one of its workers (${declaration.workers.map((w) => w.filename).join(', ') || 'none'}). An entry naming nothing deploys a hook that invokes a missing file.`,
    );
  }
  return {
    id: declaration.id,
    events: [...declaration.events] as [EventName, ...EventName[]],
    command: hookCommand(declaration.id, declaration.entry),
    ...(declaration.timeout !== undefined
      ? { timeout: declaration.timeout }
      : {}),
  };
}
