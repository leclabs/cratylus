// ─────────────────────────────────────────────────────────────────────────────
// PROJECTION over a RESOLVED PLUGIN SET — the missing link between `compose` and
// `deploy`.
//
// `compose` resolved the plugin set and wrote nothing; `deploy` required a render
// tree; and the only producer of a render tree was a MONOREPO SCRIPT that
// dir-scanned the corpus and bypassed the plugin resolver entirely. So a consumer
// could install, extend, and resolve — and still not obtain a single artifact.
//
// This module closes that gap, and closes it ONCE: the corpus's own projection and
// the consumer's projection are now the same call over the same plugin dirs. The
// difference between "our corpus" and "a consumer's config" is only WHICH plugins
// are in the set — which is the whole point of a build-time plugin architecture.
//
// RENDERING IS NOT WRITING. Projection returns the artifact tree; `writeRenderTree`
// (./write.ts) puts it on disk. This module opens no file descriptor — that is a
// LOAD-BEARING property, not tidiness: it is what makes "what does this plugin set
// project?" an answerable question instead of a tmpdir excavation.
//
// AND RENDERING IS NOT SELECTING. `resolve()` folded the plugin set's fragments and
// this projector rendered agents straight off their import bindings — two pipelines
// over one plugin set that never met. Absent `patches` the fold is the IDENTITY, so
// they agreed by construction and the missing pipe was invisible. `discoverFragments`
// + `resolveFragmentBodies` are that pipe: they hand back the authored-body ⟼
// resolved-body substitution an agent's dimension values undergo before `agentDef`,
// which is what makes `compose(select(a)) = ir(a)` (ENGINE:22) hold under a patch and
// not merely when nothing patches.
// ─────────────────────────────────────────────────────────────────────────────

import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  type Agent,
  type Binding,
  type Dimension,
  type Enforcing,
  type HookCell,
  type Skill,
  type Value,
  anchorOf,
  bodyOf,
  enforcing,
  hookIrOf,
  withBody,
} from '../anatomy/index.js';
import {
  type DiscoveredPlugin,
  discoverPluginFragments,
} from '../catalog/index.js';
import type { ResolvedSkill } from '../core/anatomy-body.js';
import { enforcingValuesOf } from '../core/exemplify/dimension-fields.js';
import type { HarnessAdapter } from '../core/harness-adapter.js';
import {
  resolveModulePath,
  scanCellDirNames,
  scanModuleNames,
} from '../core/module-scan.js';
import {
  type LoadedPlugin,
  type PatchEntry,
  resolve as foldFragments,
} from '../resolve/resolve.js';
import { assertRealizable } from './refusal.js';
import { runtimeShimContent } from './runtime-shim.js';

/** The plugin fields projection consumes — the dirs a plugin contributes cells from. */
export interface ProjectablePlugin {
  readonly name: string;
  readonly agents?: string;
  readonly skills?: string;
  /**
   * Fragment (dimension-value) dir — scanned `<dir>/<dimension>/*.ts`. Projection
   * needs it because an agent module inlines its dimension values BY IMPORT
   * BINDING (`objective: insight_objective`), i.e. the body as authored on disk.
   * Folding the fragments is the only way the projected SOUL can carry the
   * COMPOSED value rather than the authored one (see `composedBodies`).
   */
  readonly fragments?: string;
  /** Leading block stamped into this plugin's cells; travels with the plugin. */
  readonly preamble?: string;
  /** Dir of hook cell modules this plugin contributes. */
  readonly hooks?: string;
}

export interface ProjectOpts {
  /** The resolved plugin set, in `extends` order. */
  readonly plugins: readonly ProjectablePlugin[];
  /** The harness adapter that renders each cell. */
  readonly adapter: HarnessAdapter;
  /**
   * The resolver's fold, as the substitution an agent's authored dimension values
   * undergo: `resolveFragmentBodies(await discoverFragments(plugins), patches)`.
   * Absent/empty ⇒ the fold is the identity and the projected bytes are unchanged.
   *
   * PASSED IN, not computed here, because a patch can only target a node some
   * discovery already minted — see `discoverFragments`.
   */
  readonly resolvedBodies?: ReadonlyMap<string, string>;
  /**
   * A doctrine-agnostic leading block stamped into every projected cell. The corpus
   * passes its founding doctrine so the axiom rides the projected bytes rather than
   * ambient repo context; a consumer may pass nothing.
   */
  readonly preamble?: string;
  readonly log?: (line: string) => void;
}

interface Src {
  readonly dir: string;
  readonly plugin: string;
  readonly preamble?: string;
}

export interface ProjectReport {
  readonly agents: number;
  readonly skills: number;
  readonly shims: number;
  readonly hooks: number;
}

/**
 * ONE projected artifact: its path RELATIVE to the render-tree root, plus its bytes.
 * `HarnessAdapter` already hands back `{ filename, content }` per cell; this is that
 * pair once the projection has decided which subtree the cell belongs under.
 */
export interface ProjectedFile {
  /** Path relative to the render-tree root, e.g. `skills/wake/SKILL.md`. */
  readonly path: string;
  readonly content: string;
  /** 0755 on write (shims, hook workers). Absent ⇒ ambient umask. */
  readonly executable?: boolean;
}

/**
 * What a plugin set projects to: every artifact as bytes, plus the counts.
 *
 * DELIBERATELY a local structural type, and deliberately unnamed beyond that. This
 * is NOT MODEL's `IR`: `ir : agent → IR` is AGENT-scoped and is already realized by
 * the `Agent` interface. A whole-plugin-set aggregate is a different thing that no
 * grounding doc declares, and minting a canonical anchor for it is a cratylism act
 * this seam is not entitled to perform.
 */
export interface ProjectedTree extends ProjectReport {
  readonly files: readonly ProjectedFile[];
}

/** The `<name>: Agent` vector export of an agent module. */
async function agentOf(modPath: string): Promise<Agent> {
  const mod = (await import(pathToFileURL(modPath).href)) as Record<
    string,
    unknown
  >;
  const key = Object.keys(mod).find((k) => k !== 'default');
  if (!key) throw new Error(`${modPath}: no Agent export`);
  return mod[key] as Agent;
}

/** The `Skill` export of a skill module (the object carrying `formalBlock`). */
async function skillOf(modPath: string): Promise<Skill> {
  const mod = (await import(pathToFileURL(modPath).href)) as Record<
    string,
    unknown
  >;
  const skill = Object.values(mod).find(
    (v): v is Skill =>
      typeof v === 'object' && v !== null && 'formalBlock' in v,
  );
  if (!skill) throw new Error(`${modPath}: no Skill export`);
  return skill;
}

/** The `HookCell` export of a hook module (the object carrying `substrate`). */
async function hookOf(modPath: string): Promise<HookCell | null> {
  const mod = (await import(pathToFileURL(modPath).href)) as Record<
    string,
    unknown
  >;
  const cell = Object.values(mod).find(
    (v): v is HookCell =>
      typeof v === 'object' && v !== null && 'substrate' in v && 'workers' in v,
  );
  return cell ?? null;
}

/**
 * The BINDINGS a projected agent set implies: for each enforcing value, exactly
 * the agents that compose it.
 *
 * This is the whole mediation fix in one function. Scope is COMPUTED from
 * composition, never authored beside the mechanism, so it cannot disagree with
 * what the agents actually declare. Agents are sorted so the emitted artifact is
 * byte-stable — an unsorted set would churn the deploy diff and hide real changes
 * among reorderings.
 */
export function bindingsOf(
  agents: readonly { readonly name: string; readonly agent: Agent }[],
): Binding[] {
  const byAnchor = new Map<
    string,
    { fragment: Enforcing<Dimension>; agents: Set<string> }
  >();
  for (const { name, agent } of agents) {
    for (const fragment of enforcingValuesOf(agent)) {
      const anchor = anchorOf(fragment);
      const seen = byAnchor.get(anchor);
      if (seen) seen.agents.add(name);
      else byAnchor.set(anchor, { fragment, agents: new Set([name]) });
    }
  }
  return [...byAnchor]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([anchor, { fragment, agents: names }]) => ({
      anchor,
      fragment,
      agents: [...names].sort(),
    }));
}

/**
 * Two fragment nodes share an authored body but fold to DIFFERENT values, so an
 * agent that selected that body has no determinate resolved value. Loud, because
 * silently picking one is exactly the merge ambiguity the resolver refuses.
 */
export class AmbiguousFragmentBodyError extends Error {
  constructor(
    readonly body: string,
    readonly values: readonly string[],
  ) {
    super(
      `ambiguous fragment body: '${body.slice(0, 60)}${body.length > 60 ? '…' : ''}' is contributed by more than one node and resolves to ${values.length} different values — an agent selecting it has no determinate value`,
    );
    this.name = 'AmbiguousFragmentBodyError';
  }
}

/**
 * DISCOVER the plugin set's fragment nodes — step ONE of routing projection through
 * the resolver, and SEPARATE from the fold on purpose.
 *
 * A string fragment's node is MINTED at scan time (`catalog/discoverPluginFragments`),
 * so its object identity — the only address `resolve()` accepts (NORTH-STAR §3) —
 * exists only downstream of a discovery. Folding inside `projectPluginSet` would
 * therefore make its own nodes unaddressable and every caller's patch a guaranteed
 * `MissingExtendsTargetError`. Handing the discovery back is what makes a patch
 * targetable at all.
 */
export async function discoverFragments(
  plugins: readonly ProjectablePlugin[],
): Promise<DiscoveredPlugin[]> {
  const sources = plugins
    .filter((p): p is ProjectablePlugin & { fragments: string } =>
      Boolean(p.fragments),
    )
    .map((p) => ({ name: p.name, fragmentsDir: p.fragments }));
  return sources.length === 0 ? [] : discoverPluginFragments(sources);
}

/**
 * FOLD a discovery under the consumer `patches` → the substitution an agent's
 * authored dimension values must undergo: authored body ⟼ resolved body. Step TWO.
 *
 * WHY THIS EXISTS. `select(a)` (ENGINE:22) is realized as an agent module's import
 * list — `objective: insight_objective` binds the fragment's body AS IT SAT ON DISK.
 * The catalog those values are supposed to be drawn from is the resolver's ordered
 * fold. Without this map the two coincide only by accident: the moment a patch moves
 * a fragment, the projected SOUL still carries the pre-fold string and
 * `COMPOSED(a) : S_on ⊆ catalog(on)` fails while every suite stays green.
 *
 * ONLY MOVED FRAGMENTS ARE RECORDED. A plugin originates each of its fragments with a
 * single `replace(body)`, so ABSENT PATCHES THE FOLD IS THE IDENTITY, the map is
 * empty, and the render tree is byte-for-byte what it was.
 */
export function resolveFragmentBodies(
  discovered: readonly DiscoveredPlugin[],
  patches: readonly PatchEntry[] = [],
): ReadonlyMap<string, string> {
  if (discovered.length === 0) return new Map();
  const extended: LoadedPlugin[] = discovered.map((d) => ({
    name: d.name,
    contributions: d.fragments.map((f) => ({
      target: f.node,
      op: 'replace' as const,
      value: f.body,
    })),
  }));
  const { fragments } = foldFragments({ extends: extended, patches });

  // Collect every value each authored body resolves to, then admit only the moves.
  const byBody = new Map<string, Set<string>>();
  for (const d of discovered) {
    for (const f of d.fragments) {
      if (typeof f.body !== 'string') continue;
      const folded = fragments.get(f.node)?.value;
      if (typeof folded !== 'string') continue;
      const seen = byBody.get(f.body);
      if (seen) seen.add(folded);
      else byBody.set(f.body, new Set([folded]));
    }
  }
  const subst = new Map<string, string>();
  for (const [body, values] of byBody) {
    if (values.size > 1) {
      throw new AmbiguousFragmentBodyError(body, [...values]);
    }
    const [only] = values;
    if (only !== undefined && only !== body) subst.set(body, only);
  }
  return subst;
}

/**
 * Rewrite an agent's DIMENSION fields through the resolved-body substitution. Only
 * the 22 fragment dimensions are touched: `archetype` is a plain identity string
 * (D13) and `provenance` the structured mark (D3) — neither lives in a `fragments`
 * dir, so neither is a fold subject. An empty substitution returns the agent
 * unchanged (identity, not a copy) so the no-patch path stays byte-exact.
 */
function withResolvedBodies(
  agent: Agent,
  subst: ReadonlyMap<string, string>,
): Agent {
  if (subst.size === 0) return agent;
  // Substitute a value's DECLARATION face and put the binding back. A value may
  // now be an enforcing cell rather than a bare string, and `substrate`/`events`
  // are not bodies — folding a value must never silently unbind it. Keying the
  // map on `bodyOf(v)` is what keeps an enforcing value substitutable by the same
  // authored body a bare one uses.
  const sub = <T extends Value<Dimension>>(v: T): T => {
    const body = bodyOf(v);
    return withBody(v, subst.get(body) ?? body) as T;
  };
  const one = <T extends Value<Dimension>>(v: T | null): T | null =>
    v === null ? null : sub(v);
  // Overloaded so nullability ROUND-TRIPS. `guardrails` is the one set dimension
  // with no `| null` (the catch-all — see `Agent` in anatomy), so a single
  // `readonly T[] | null` return would widen it back to nullable here and fail to
  // assign. Widening it with a cast would have "fixed" the error by re-admitting
  // the null this dimension exists to exclude.
  function many<T extends Value<Dimension>>(vs: readonly T[]): readonly T[];
  function many<T extends Value<Dimension>>(
    vs: readonly T[] | null,
  ): readonly T[] | null;
  function many<T extends Value<Dimension>>(
    vs: readonly T[] | null,
  ): readonly T[] | null {
    return vs === null ? null : vs.map(sub);
  }
  return {
    ...agent,
    autonomy: many(agent.autonomy),
    role: one(agent.role),
    formality: one(agent.formality),
    audienceAdaptation: one(agent.audienceAdaptation),
    transparency: one(agent.transparency),
    objective: one(agent.objective),
    guardrails: many(agent.guardrails),
    engineeringPrinciples: many(agent.engineeringPrinciples),
    heuristics: many(agent.heuristics),
    capabilities: many(agent.capabilities),
    learning: one(agent.learning),
    situationAwareness: one(agent.situationAwareness),
    actions: many(agent.actions),
    modalities: one(agent.modalities),
    model: one(agent.model),
    memory: one(agent.memory),
    trigger: one(agent.trigger),
    framing: one(agent.framing),
    reasoningStrategy: one(agent.reasoningStrategy),
    satisficing: one(agent.satisficing),
    outputFormat: one(agent.outputFormat),
    selfEvaluation: one(agent.selfEvaluation),
  };
}

/**
 * Project every cell contributed by the plugin set into an artifact tree. Writes
 * nothing — hand the result to `writeRenderTree(out, tree.files)`.
 *
 * Later plugins in `extends` order win on a name collision, so a consumer can
 * override a canon CELL by shipping one of the same name. The winner is reported,
 * never silently applied.
 *
 * This is NOT "the same precedence `resolve()` gives fragments" — that claim was
 * here and it was false. Cells and fragments override ASYMMETRICALLY, deliberately:
 *
 *   cell     — collides BY NAME, later plugin wins (here)
 *   fragment — does NOT collide. `discoverPluginFragments` mints a distinct node
 *              per plugin (`catalog/index.ts:270-274`, id `<plugin>:<dim>/<export>`),
 *              so two plugins naming `parsimony` yield two nodes, not a contest.
 *
 * The asymmetry is right and worth keeping. A cell is a COMPOSITION — a local
 * assembly choice, and overriding one changes only that cell. A fragment is
 * canonical VOCABULARY: overriding it by name would silently redefine a concept
 * everywhere any agent selects it, across the whole plugin set, with no site
 * naming the change. Per-plugin fragment identity makes that impossible by
 * construction rather than by discipline.
 *
 * Consequence a consumer must know: you can override canon's `investigator`; you
 * cannot override canon's `objective/insight`. To change a fragment's body, patch
 * its node — see `discoverFragments` / `resolveFragmentBodies` below.
 */
export async function projectPluginSet(
  opts: ProjectOpts,
): Promise<ProjectedTree> {
  const log = opts.log ?? (() => {});
  const files: ProjectedFile[] = [];

  // An agent is rendered from the RESOLVED catalog, never from the bodies its
  // module happened to import (ENGINE:22). Every move is reported, never silent.
  const subst = opts.resolvedBodies ?? new Map<string, string>();
  for (const [from, to] of subst) {
    log(`RESOLVE fragment: '${from.slice(0, 40)}…' → '${to.slice(0, 40)}…'`);
  }

  // Collect by name across plugins first, so an override is resolved BEFORE any
  // cell is rendered and can be logged rather than discovered as a clobbered file.
  const agentSrc = new Map<string, Src>();
  const skillSrc = new Map<string, Src>();
  for (const p of opts.plugins) {
    if (p.agents) {
      for (const n of await scanModuleNames(p.agents, ['base'])) {
        const prev = agentSrc.get(n);
        if (prev) log(`  override agent ${n}: ${prev.plugin} → ${p.name}`);
        agentSrc.set(n, {
          dir: p.agents,
          plugin: p.name,
          preamble: p.preamble,
        });
      }
    }
    if (p.skills) {
      for (const n of await scanCellDirNames(p.skills, 'skill')) {
        const prev = skillSrc.get(n);
        if (prev) log(`  override skill ${n}: ${prev.plugin} → ${p.name}`);
        skillSrc.set(n, {
          dir: p.skills,
          plugin: p.name,
          preamble: p.preamble,
        });
      }
    }
  }

  let agents = 0;
  const agentNames: string[] = [];
  // Composed vectors, kept so the BINDINGS can be derived from what the agents
  // actually compose — after the fold, since a folded body is the real one.
  const composed: { name: string; agent: Agent }[] = [];
  for (const [name, { dir, preamble: pre }] of [...agentSrc].sort()) {
    const modPath = await resolveModulePath(dir, name);
    if (!modPath) throw new Error(`agent module not found: ${name}`);
    const agent = withResolvedBodies(await agentOf(modPath), subst);
    const { filename, content } = opts.adapter.agentDef({
      ...agent,
      ...((pre ?? opts.preamble) ? { preamble: pre ?? opts.preamble } : {}),
    });
    files.push({ path: join('agents', filename), content });
    log(`EMIT agent ${name}`);
    agentNames.push(name);
    composed.push({ name, agent });
    agents++;
  }

  // ENFORCING FRAGMENTS. The MECHANISM is emitted by the adapter into each
  // agent's OWN front-matter (`agentHooksFrontMatter`), because Claude Code fires
  // a subagent's front-matter hooks only while that subagent runs. Attachment IS
  // the scope, so there is no separate scope artifact that could drift from the
  // agents it claims to govern.
  //
  // What projection still owes: the build-time refusal, and the WORKER BYTES the
  // emitted commands invoke.
  const bindings = bindingsOf(composed);
  for (const b of bindings) {
    // THE VERIFIER ON THE SEAM, before a byte is written. Case 3 (another
    // substrate — a git hook is not a harness hook) routes untouched.
    assertRealizable(
      {
        anchor: b.anchor,
        substrate: b.fragment.substrate,
        events: b.fragment.events,
      },
      opts.adapter,
    );
    for (const worker of b.fragment.workers) {
      files.push({
        path: join('hooks', b.anchor, worker.filename),
        content: worker.content,
        executable: worker.executable,
      });
    }
    log(`EMIT enforcing ${b.anchor} → ${b.agents.join(' ')}`);
  }

  let skills = 0;
  let shims = 0;
  for (const [name, { dir, preamble: pre }] of [...skillSrc].sort()) {
    const cellPath = await resolveModulePath(join(dir, name), 'skill');
    if (!cellPath) throw new Error(`skill module not found: ${name}/skill`);
    const cell = await skillOf(cellPath);
    const resolved: ResolvedSkill = {
      name: cell.name,
      trigger: `/${cell.name}`,
      description: cell.description,
      formalBlock: cell.formalBlock,
      composedFrom: cell.composition().map((c) => `/${c.name}`),
      ...((pre ?? opts.preamble) ? { preamble: pre ?? opts.preamble } : {}),
      runtime: cell.runtime,
    };
    const cellOut = join('skills', name);
    const { filename, content } = opts.adapter.skillDef(resolved);
    files.push({ path: join(cellOut, filename), content });
    if (cell.runtime) {
      files.push({
        path: join(cellOut, 'scripts', `${cell.runtime.capability}.mjs`),
        content: runtimeShimContent(cell.runtime.capability),
        executable: true,
      });
      log(
        `EMIT skill ${name} (+runtime shim scripts/${cell.runtime.capability}.mjs)`,
      );
      shims++;
    } else {
      log(`EMIT skill ${name}`);
    }
    skills++;
  }

  // Hooks. Only `harness`-substrate cells register in settings.json; a
  // `git`-substrate cell fires in git's own process and must never be serialized
  // here, so it is filtered BEFORE the lift (which refuses it loudly anyway).
  const hookCells: HookCell[] = [];
  for (const p of opts.plugins) {
    if (!p.hooks) continue;
    for (const n of await scanModuleNames(p.hooks)) {
      const modPath = await resolveModulePath(p.hooks, n);
      if (!modPath) continue;
      const cell = await hookOf(modPath);
      if (cell && cell.substrate === 'harness') hookCells.push(cell);
    }
  }

  hookCells.sort(
    (a, b) =>
      (a.order ?? Number.MAX_SAFE_INTEGER) -
        (b.order ?? Number.MAX_SAFE_INTEGER) || a.id.localeCompare(b.id),
  );

  let hooks = 0;
  if (hookCells.length > 0) {
    const renderHooks = opts.adapter.hooks;
    if (!renderHooks) {
      throw new Error(
        `harness '${opts.adapter.name}' does not project hooks, but the plugin set contributes ${hookCells.length}`,
      );
    }
    const sources = hookCells.map((cell) => ({
      hook: hookIrOf(cell),
      workers: cell.workers,
    }));
    const { settings, warnings, skipped } = renderHooks(
      sources.map((s) => s.hook),
    );
    for (const w of warnings) log(`WARN hook: ${w}`);
    for (const sk of skipped) log(`SKIP hook ${sk.path}: ${sk.reason}`);
    files.push({
      path: 'settings.json',
      content: `${JSON.stringify({ hooks: settings }, null, 2)}\n`,
    });
    log(`EMIT settings.json (hooks: ${Object.keys(settings).join(', ')})`);
    for (const src of sources) {
      const destDir = join('hooks', src.hook.id ?? 'unnamed');
      for (const worker of src.workers) {
        // Bytes come from the CELL, never an on-disk copy — the cell is the home.
        files.push({
          path: join(destDir, worker.filename),
          content: worker.content,
          ...(worker.executable ? { executable: true } : {}),
        });
      }
      log(
        `EMIT hook ${src.hook.id} (+${src.workers.length} worker${src.workers.length === 1 ? '' : 's'})`,
      );
      hooks++;
    }
  }

  // The always-loaded INSTRUCTION SURFACE — codex's `AGENTS.md`, the shell a
  // workspace reads before any agent is selected. OPTIONAL on the port
  // (`HarnessAdapter.surface`) because it is a harness property, not a cell kind:
  // codex has one, claude has none, and a harness without one must project the
  // same tree it always did — hence the guard, and hence NO throw on absence.
  //
  // It is emitted LAST because it indexes the projected agent names, and it goes
  // into `files` like every other artifact: the surface used to be the codex CLI's
  // own direct disk write, which is precisely the fork that let that path drift.
  // Rendering it here keeps this module's no-file-descriptor property intact.
  const renderSurface = opts.adapter.surface;
  if (renderSurface) {
    const { filename, content } = renderSurface(agentNames);
    files.push({ path: filename, content });
    log(`EMIT surface ${filename}`);
  }

  return { files, agents, skills, shims, hooks };
}

export { emitRuntimeShim } from './runtime-shim.js';
export { writeRenderTree } from './write.js';
