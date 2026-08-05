// ─────────────────────────────────────────────────────────────────────────────
// The CLAUDE realization of the {@link CarryOnHost} port — an id-keyed turn-end
// entry in the host's `settings.json`.
//
// Mechanically the twin of `EventTapHostClaude`, and deliberately so: that host
// already carries the law this one owes — `uninstall ∘ install ⊨ target ≡ target₀ ∧
// foreign preserved ⟨zero residue⟩` — as a surgical filter keyed by a stable id.
// `install` merges ONE entry stamped {@link CARRY_ON_ID} under the harness's
// turn-end event (foreign top-level keys AND foreign entries under the same event
// preserved); `remove` drops exactly that entry and, when nothing foreign remains,
// the whole `hooks` key rather than leaving a bare `{}` behind; `status` derives
// from the file, so a fresh process reads what an earlier one wrote.
//
// WHAT IT SHARES WITH THE TAP, AND WHY THE IMPORT. `ClaudeHooksBlock` and
// `mergeJsonKeys` are the SHAPE of a claude settings document and the key-scoped
// merge over it — harness knowledge, not tap knowledge. They are imported from the
// sibling capability rather than re-typed here, because a byte-identical private
// copy of a neighbour's map is the exact defect the event-tap vocabulary repair
// closed, and it does not become a different defect when the neighbour is one
// directory over. Their home wants promotion to a shared `capabilities/claude-*`
// module the day a THIRD consumer lands; two consumers is not yet that day.
//
// THE NATIVE EVENT IS INJECTED, NEVER KNOWN. Which harness word means "a turn is
// ending" arrives from the host config the projection emitted. This package must not
// name a canonical event (ARCHITECTURE property 4), so the constructor takes the
// already-resolved native name and the verb surface does the resolution.
// ─────────────────────────────────────────────────────────────────────────────

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { RUNTIME_BIN } from '../../bin-name.js';
import type {
  CarryOnHost,
  CarryOnStatus,
  TurnGate,
} from '../../ports/carry-on.js';
import {
  type ClaudeHooksBlock,
  mergeJsonKeys,
} from '../event-tap/claude-serialize.js';

/**
 * The stable id stamped on this capability's own entry so teardown finds and
 * surgically removes exactly it.
 *
 * Derived from the bin name, never a second literal — and this value is PERSISTED
 * IN USER SETTINGS, so drift between it and the bin does not merely rename a thing,
 * it ORPHANS every installed gate: `revert` would look for an id `elevate` no
 * longer writes, and a session would stay gated with nothing able to lift it.
 */
export const CARRY_ON_ID = `${RUNTIME_BIN}-carry-on`;

/** A parsed claude settings document: the `hooks` block this capability edits,
 *  plus every foreign top-level key it must hand back untouched. */
type ClaudeSettings = Record<string, unknown> & { hooks?: ClaudeHooksBlock };

/**
 * Resolve the target `settings.json`, override-first: explicit ctor arg ▸
 * `$CLAUDE_SETTINGS_PATH` ▸ `<cwd>/.claude/settings.json`. Read per call, so one
 * instance honours the environment of each invocation.
 */
function resolveSettingsPath(override: string | undefined): string {
  if (override !== undefined) return override;
  const env = process.env.CLAUDE_SETTINGS_PATH;
  if (env !== undefined && env.trim() !== '') return env;
  return join(process.cwd(), '.claude', 'settings.json');
}

export class CarryOnHostClaude implements CarryOnHost {
  readonly #settingsPathOverride: string | undefined;
  readonly #nativeTurnEnd: string;

  /**
   * @param settingsPath absolute path to the target `settings.json`; omitted ⇒
   *  resolved lazily from `$CLAUDE_SETTINGS_PATH` or the cwd default.
   * @param nativeTurnEnd this harness's own name for the turn-end moment, already
   *  resolved from the host config's `events.native` map. REQUIRED and injected:
   *  a default here would be this package holding a corpus fact.
   */
  constructor(settingsPath: string | undefined, nativeTurnEnd: string) {
    this.#settingsPathOverride = settingsPath;
    this.#nativeTurnEnd = nativeTurnEnd;
  }

  get #settingsPath(): string {
    return resolveSettingsPath(this.#settingsPathOverride);
  }

  /** Parse the target, or `undefined` when it is absent/blank. Throws on corrupt
   *  JSON — a target that cannot be understood must refuse, never be clobbered. */
  #read(): ClaudeSettings | undefined {
    const path = this.#settingsPath;
    if (!existsSync(path)) return undefined;
    const text = readFileSync(path, 'utf8');
    if (text.trim() === '') return undefined;
    return JSON.parse(text) as ClaudeSettings;
  }

  install(gate: TurnGate): void {
    if (this.#nativeTurnEnd.trim() === '') {
      throw new Error(
        'carry-on: no native turn-end event — this host was constructed for a READ path ' +
          '(status/remove need no event name). Installing without one would write an entry ' +
          'under an empty key, which no harness fires.',
      );
    }
    // Idempotent by construction: strip our own entry first, so elevating twice
    // leaves ONE gate rather than two that both fire and both block.
    this.remove();

    const path = this.#settingsPath;
    const existing = existsSync(path) ? readFileSync(path, 'utf8') : undefined;
    const base: { hooks?: ClaudeHooksBlock } =
      existing && existing.trim() !== ''
        ? (JSON.parse(existing) as { hooks?: ClaudeHooksBlock })
        : {};

    const hooks: ClaudeHooksBlock = { ...(base.hooks ?? {}) };
    hooks[this.#nativeTurnEnd] = [
      ...(hooks[this.#nativeTurnEnd] ?? []),
      { hooks: [{ type: 'command', command: gate.command, id: CARRY_ON_ID }] },
    ];

    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, mergeJsonKeys(existing, { hooks }), 'utf8');
  }

  remove(): void {
    const base = this.#read();
    if (base?.hooks === undefined) return;

    const cleaned: ClaudeHooksBlock = {};
    for (const [event, entries] of Object.entries(base.hooks)) {
      const kept = entries
        .map((e) => ({
          ...e,
          hooks: e.hooks.filter((h) => h.id !== CARRY_ON_ID),
        }))
        .filter((e) => e.hooks.length > 0);
      if (kept.length > 0) cleaned[event] = kept;
    }

    const path = this.#settingsPath;
    if (Object.keys(cleaned).length > 0) {
      writeFileSync(
        path,
        mergeJsonKeys(readFileSync(path, 'utf8'), { hooks: cleaned }),
        'utf8',
      );
      return;
    }
    // Nothing foreign remains under `hooks`: drop the key itself. A bare
    // `"hooks": {}` the target did not have before is residue.
    const { hooks: _removed, ...rest } = base;
    writeFileSync(path, `${JSON.stringify(rest, null, 2)}\n`, 'utf8');
  }

  status(): CarryOnStatus {
    let base: ClaudeSettings | undefined;
    try {
      base = this.#read();
    } catch {
      // A corrupt target cannot be reported as gated; `elevate` refuses on the
      // strength of this answer, which is the safe direction.
      return { attached: false };
    }
    for (const entries of Object.values(base?.hooks ?? {})) {
      for (const entry of entries) {
        for (const h of entry.hooks) {
          if (h.id === CARRY_ON_ID) {
            return h.command !== undefined
              ? { attached: true, command: h.command }
              : { attached: true };
          }
        }
      }
    }
    return { attached: false };
  }
}
