// The ONE behavioral PORT for anatomy→harness projection. A `HarnessAdapter`
// captures the projection operations a consumer (agent-canon's project CLIs)
// needs to render its typed `Agent`/`ResolvedSkill`/`Hook` vectors to a harness's
// on-disk surface — WITHOUT naming a concrete adapter module. A consumer selects
// an implementation strictly BY NAME (`adapterByName('claude' | 'codex')`), so no
// `adapters/<harness>` subpath import leaks into the consumer.
//
// Each projection op returns `{ filename, content }` — the harness owns its own
// file naming (`<name>.md` vs `<name>.toml`; `SKILL.md`), the consumer owns only
// the parent directory it writes under. Optional ops (`surface`, `hooks`) are
// present only on harnesses that have that surface (codex has an `AGENTS.md`
// index; claude serializes hooks → a `settings.json` fragment).

import type { Agent } from '../anatomy/index.js';
import type { ResolvedSkill } from './anatomy-body.js';
import type { Hook } from './index.js';

/** A single projected artifact: the harness-owned filename + its bytes. */
export interface HarnessProjection {
  /** The harness-owned filename (with extension), e.g. `mav.md` / `mav.toml` / `SKILL.md`. */
  readonly filename: string;
  readonly content: string;
}

/** A hooks → settings-fragment projection, plus the per-hook losses. `settings`
 *  is the harness-native `hooks` block (a JSON-serializable fragment the consumer
 *  merges into the host's settings). */
export interface HarnessHooksProjection {
  readonly settings: Record<string, unknown>;
  readonly warnings: readonly string[];
  readonly skipped: readonly {
    readonly path: string;
    readonly reason: string;
  }[];
}

/** The projection port a harness adapter implements. */
export interface HarnessAdapter {
  /** The canonical harness name this adapter projects for (`claude`, `codex`, …). */
  readonly name: string;
  /** Project an agent vector → its subagent def file. */
  agentDef(agent: Agent): HarnessProjection;
  /** Project a resolved skill → its `SKILL.md`. */
  skillDef(skill: ResolvedSkill): HarnessProjection;
  /** The always-loaded instruction/index surface, when the harness has one
   *  (codex `AGENTS.md`; claude has none). */
  surface?(agentNames: readonly string[]): HarnessProjection;
  /** Hooks → a settings fragment + per-hook losses, when the harness supports
   *  hooks (claude → `settings.json` `hooks` block; codex projects none). */
  hooks?(hooks: readonly Hook[]): HarnessHooksProjection;
}
