// Local filesystem placer — copy generated defs into a `.claude/` root on this
// host and seed each agent's sidecar layers if-absent. The def is overwritten
// freely (generated substance); the sidecars are protected
// (`substance-over-accident`). Skills are generated substance with no
// sidecars — overwrite freely.
//
// The PLACER never deletes. It only TESTIFIES — `report.written` records the
// harnessDir-relative path of every file it lays down, and the orchestrator
// (`deploy.ts` → `manifest.ts`) uses that record, and only that record, to
// converge the target. The memory sidecars are deliberately absent from the
// testimony: they live outside the deploy root and are the self-authored
// individual, so no deploy may ever sweep them.
//
// Faithful port of `place/local.py`.
//
// ── AND THE READ PATH: does the host still CARRY what we placed? ─────────────
// `auditLocal` (bottom of this file) is the placer run backwards: it compares
// the DEPLOYED bytes against the RENDERED bytes and reports, per artifact, where
// they diverge. It exists because every gate that predates it is a claim about
// how a Target is PRODUCED (`deploy-valid ⇔ REGENERABLE`: deploy-owned,
// deterministic, never hand-edited) and none is a claim about what is on the
// host RIGHT NOW. See the audit's own header for what that cost.

import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, resolve as resolvePath } from 'node:path';
import { ENFORCING_STAGE_DIR } from '../core/harness-adapter.js';
import { staleFiles } from '../prune/index.js';
import {
  assertShimsResolvable,
  stageAssets,
  walkSkillFiles,
} from './bundle.js';
import { readManifest, unattributable } from './manifest.js';
import { SEED_FILES } from './seeds.js';
import {
  type DeployKind,
  type PlaceOpts,
  type PlaceResult,
  type RenderTree,
  emptyReport,
} from './types.js';

/**
 * The DEFAULT destination layout: the render tree's staging layout, used verbatim.
 *
 * Exported because the audit set and the action set must derive a path the SAME
 * way. They used to spell `agents/${name}${agentExt}` at four sites; a harness whose
 * layout differs would have been placed by one and audited by another, and a drift
 * report over a path nothing writes reads as a clean host.
 */
export function defaultAgentRel(name: string, agentExt = '.md'): string {
  return `agents/${name}${agentExt}`;
}

/** Write <harnessDir>/<agentRel(name)> for each name (the harness-specific
 *  declaration); seed the harness-NEUTRAL memory home
 *  <home>/.agents/<name>/{SEMANTIC,PROCEDURAL,EPISODIC} (a sibling of .claude,
 *  mirroring memory `homeForName`) only if absent. */
export function placeAgentsLocal(
  harnessDir: string,
  defsDir: string,
  names: string[],
  opts: PlaceOpts,
): PlaceResult {
  const log = opts.log ?? (() => {});
  const warn = opts.warn ?? (() => {});
  const agentExt = opts.agentExt ?? '.md';
  // SOURCE is the render tree's staging layout; DESTINATION is the harness's own.
  // They coincide for claude and codex and do not for omp, which is why the
  // destination is asked for rather than assumed.
  const agentRel =
    opts.agentRel ?? ((n: string) => defaultAgentRel(n, agentExt));
  const report = emptyReport();
  for (const name of names) {
    const src = resolvePath(defsDir, `${name}${agentExt}`);
    if (!existsSync(src)) {
      warn(`  WARN  no def for ${name} at ${src}`);
      report.warnings.push(`no def for ${name}`);
      report.skipped.push(name);
      continue;
    }
    const dest = resolvePath(harnessDir, agentRel(name));
    if (!opts.dry) {
      // The destination's PARENT, not a fixed `agents/` dir: omp's is
      // `profiles/<name>/agent/`, which does not exist until this run makes it.
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, readFileSync(src, 'utf-8'), 'utf-8');
    }
    report.copied += 1;
    // Testimony: the def is the ONLY thing this placer may later prune. The
    // sidecars below are never recorded — never ours to remove.
    // The extension must match what was WRITTEN, not what claude happens to use:
    // the manifest is the prune record, and a record naming a path that does not
    // exist can never converge — the real file becomes permanently unattributable.
    report.written[name] = [agentRel(name)];
    // Memory sidecars live in the harness-NEUTRAL home ~/.agents/<name> (mirrors
    // memory `homeForName`), a sibling of `.claude` — NOT under
    // `.claude/agents` (Claude-specific; only <name>.md declaration lives there).
    const selfdir = resolvePath(harnessDir, '..', '.agents', name);
    if (!opts.dry) {
      mkdirSync(selfdir, { recursive: true });
    }
    for (const [fname, seedfn] of SEED_FILES) {
      const f = resolvePath(selfdir, fname);
      if (existsSync(f)) {
        report.present.push(`${name}/${fname}`);
      } else if (!opts.dry) {
        writeFileSync(f, seedfn(name), 'utf-8');
        report.seeded.push(`${name}/${fname}`);
      } else {
        report.seeded.push(`${name}/${fname}`);
      }
    }
  }
  log(`  defs copied: ${report.copied}`);
  log(
    `  layers seeded (${report.seeded.length}): ${report.seeded.join(', ') || '-'}`,
  );
  log(
    `  layers present, untouched (${report.present.length}): ${report.present.join(', ') || '-'}`,
  );
  return { rc: 0, report };
}

/** Copy <skillsSrc>/<name>/ -> every destination the harness reads skill `<name>`
 *  from (`PlaceOpts.skillRel`) — SKILL.md plus any staged companion assets beside
 *  it (byte-for-byte, binary-safe). Skills are generated substance with no
 *  sidecars — overwrite freely. Before copying, the deploy layer STAGES declared
 *  committed `assets:` companions into the source skill dir (a missing asset warns,
 *  never blocks).
 *
 *  MANY DESTINATIONS, because a harness may scope a reader by directory: omp's
 *  native config root is per-profile, so a skill every projected persona can load
 *  is one copy per profile plus one in the session root. claude and codex return a
 *  single path and behave exactly as before. */
export function placeSkillsLocal(
  harnessDir: string,
  tree: RenderTree,
  names: string[],
  opts: PlaceOpts,
): PlaceResult {
  const log = opts.log ?? (() => {});
  const warn = opts.warn ?? (() => {});
  const report = emptyReport();
  const skillRel =
    opts.skillRel ?? ((name: string): readonly string[] => [`skills/${name}`]);
  const agents = opts.agents ?? [];
  // A shim placed against a bin that does not execute is a broken artifact, and a
  // deploy that ships one must not report success. Collected across skills so the
  // refusal is reported once with every affected shim named, then carried out as
  // rc 2 — see `assertShimsResolvable` for why this is a verdict and not a throw.
  let refusal: string | null = null;
  for (const name of names) {
    const srcDir = resolvePath(tree.skillsDir, name);
    if (!existsSync(resolvePath(srcDir, 'SKILL.md'))) {
      warn(
        `  WARN  no SKILL.md for ${name} at ${resolvePath(srcDir, 'SKILL.md')}`,
      );
      report.warnings.push(`no SKILL.md for ${name}`);
      report.skipped.push(name);
      continue;
    }
    // Stage committed `assets:` companions into the SOURCE skill dir first, so
    // they copy beside SKILL.md. A missing asset is a WARN, never a hard error.
    const comp = tree.companions?.[name];
    if (comp?.assets) {
      stageAssets(name, srcDir, comp.assets, {
        assetBaseDir: srcDir,
        log,
        warn,
      });
    }
    // Recurse the WHOLE skill dir: co-located `scripts/`, `references/`,
    // `assets/` subtrees ride along, structure preserved.
    const files = walkSkillFiles(srcDir);
    const rels = skillRel(name, agents);
    const written: string[] = [];
    for (const rel of rels) {
      const destDir = resolvePath(harnessDir, rel);
      if (!opts.dry) {
        mkdirSync(destDir, { recursive: true });
        for (const file of files) {
          const srcFile = resolvePath(srcDir, file);
          const destFile = resolvePath(destDir, file);
          mkdirSync(dirname(destFile), { recursive: true });
          copyFileSync(srcFile, destFile);
          // Preserve mode so exec bits on `scripts/*` survive the copy
          // (copyFileSync does not carry the source mode).
          chmodSync(destFile, statSync(srcFile).mode);
        }
      }
      written.push(...files.map((file) => `${rel}/${file}`));
    }
    report.copied += 1;
    // Testimony: exactly the files copied for this skill, dest-relative, across
    // EVERY destination. A file sitting in a target skill dir that we did NOT copy
    // is not recorded and therefore survives every future prune.
    report.written[name] = written;
    const extra = files.filter((f) => f !== 'SKILL.md');
    const tail = extra.length
      ? ` (+${extra.length} asset${extra.length === 1 ? '' : 's'})`
      : '';
    const scopes = rels.length > 1 ? ` × ${rels.length} scopes` : '';
    log(
      `  skill ${name} -> ${resolvePath(harnessDir, rels[0] ?? `skills/${name}`)}/SKILL.md${tail}${scopes}`,
    );
    // AFTER placing: the shims are on the host now, so the binding they spawn is
    // this deploy's problem. `--version`, never `which`.
    if (refusal === null) {
      refusal = assertShimsResolvable(srcDir, files, { dry: opts.dry });
    }
  }
  log(`  skills copied: ${report.copied}`);
  if (refusal !== null) {
    warn(refusal);
    report.warnings.push(
      'runtime bin unresolvable on this host — deployed shims are inert',
    );
    return { rc: 2, report };
  }
  return { rc: 0, report };
}

// ─────────────────────────────────────────────────────────────────────────────
// THE AUDIT — deployed bytes vs. rendered bytes, per artifact.
//
// The placers above only ever ANSWER the question "what should land where"
// while landing it. Nothing ever asked the question on its own, against a host
// that was written to some time ago — so `~/.claude/agents/nico.md` and
// `.cratylus/claude/agents/nico.md` diverged, an agent ran the superseded first
// principle for a whole session, and every gate stayed green the entire time.
// The render oracle hashes the corpus's OUTPUT; it proves the projector is
// deterministic and says nothing about whether anyone ran `deploy` afterwards.
//
// THIS IS A REPORT, NOT A REPAIR. It opens files for reading and returns a
// value; it writes nothing, deletes nothing, and re-places nothing. The
// deliberate consequence is that an operator can run it on a host they are not
// ready to converge and still learn what that host is running.
//
// ATTRIBUTION IS BORROWED, NOT REDERIVED. Who a deployed file belongs to is a
// question `deploy` already answered by RECORD (`manifest.ts`) rather than by
// naming convention, and re-answering it here would put a second home under the
// one claim that must never fork. So the foreign case is exactly
// `unattributable` (deployed, ours-or-not unknowable ⇒ never claimed, never
// deleted) plus `staleFiles` (deployed, recorded by a prior deploy ⇒ ours, and
// retired). Neither is invented here.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * WHAT the divergence is. Three cases, because they are three different
 * defects and an operator repairs them differently:
 *
 *   stale    deployed ≠ rendered. The host is RUNNING something the corpus no
 *            longer says. This is the one that cost a session.
 *   absent   rendered, never deployed. A correction landed in the source and
 *            never reached the surface that gets read.
 *   foreign  deployed, not rendered. Either someone else's artifact (never
 *            ours, never touched) or one a PRIOR deploy of ours left behind —
 *            `ours` says which, and neither is ever deleted from here.
 */
export type DriftKind = 'stale' | 'absent' | 'foreign';

/** One artifact's divergence between the host and the render tree. */
export interface Divergence {
  readonly kind: DriftKind;
  /** harnessDir-relative POSIX path (a `foreign` name-level entry ends in `/`
   *  when the artifact is a whole directory). */
  readonly path: string;
  readonly deployKind: DeployKind;
  /** `stale` — rendered lines the host does NOT have: what would be lost by
   *  leaving the host alone. Empty when the file is binary. */
  readonly missing: readonly string[];
  /** `stale` — deployed lines the render tree no longer carries: what the host
   *  is STILL RUNNING. Empty when the file is binary. */
  readonly superseded: readonly string[];
  /** Bytes: the rendered size for `absent`, the deployed size otherwise. */
  readonly bytes: number;
  /** `foreign` only. `true` ⇒ a prior deploy of ours recorded this path (it is
   *  retired, and a converging deploy would prune it). `false` ⇒ this tool
   *  cannot account for it at all; it is not ours to name, move, or remove. */
  readonly ours?: boolean;
  /** One line naming WHAT this is, for an operator reading a path they do not
   *  recognize. Never a count. */
  readonly gist: string;
}

export interface DriftReport {
  readonly harnessDir: string;
  readonly deployKind: DeployKind;
  /** How many rendered artifacts were actually compared — a report of zero
   *  divergences over zero comparisons is not an exoneration. */
  readonly compared: number;
  readonly divergences: readonly Divergence[];
}

/**
 * The harness's DESTINATION layout, as much of it as a reader of the render tree
 * needs — the adapter facts both the placers and the audit must agree on.
 *
 * One bag rather than five positionals: the audit and the placers diverging on
 * layout is the exact failure this type exists to make impossible, and a
 * positional list is where an added fact gets passed at one call site and
 * forgotten at the other.
 */
export interface RenderedLayout {
  /** The harness's agent-definition extension (`HarnessAdapter.agentExt`). */
  agentExt?: string;
  /** The harness's DESTINATION layout for one agent (`HarnessAdapter.agentRel`). */
  agentRel?: (name: string) => string;
  /** Every destination for one skill (`HarnessAdapter.skillRel`). */
  skillRel?: (name: string, agents: readonly string[]) => readonly string[];
  /** The projected agent set — the scopes a per-directory harness is keyed by. */
  agents?: readonly string[];
  /** Where a scoped mechanism artifact lands (`HarnessAdapter.enforcingRel`). */
  enforcingRel?: (filename: string, agent?: string) => string;
}

export interface AuditOpts extends RenderedLayout {
  /** Cap on differing lines carried per side (0 ⇒ unbounded). A def is a whole
   *  doctrine; a full diff of one is not a report an operator reads. */
  maxLines?: number;
}

/** The `.forge/` bookkeeping dir — deploy's manifest here, `project`'s render
 *  manifest one stage upstream. It is this tool's own record of its work, NOT a
 *  projected artifact, so it is neither rendered nor drift. Named once. */
const BOOKKEEPING = '.forge';

/**
 * WHERE a kind's rendered artifacts come from, WHERE they land, and WHICH record
 * key owns them — the READ path's copy of the layout the placers WRITE.
 *
 * These two must agree, and `test/deploy/check.test.ts` pins the agreement
 * against the placers' own testimony (`report.written` from a dry run) rather
 * than by inspection: an audit enumerating a layout the placers do not use
 * would report every artifact absent and every deployed file foreign, which is
 * a very loud way to be silent about the thing it was built to catch.
 *
 * `owner` is that record key — the artifact NAME for agents, skills and hook
 * workers, and `enforcing:<scope>` for a scoped mechanism module, which no single
 * cell owns. It is returned rather than re-derived by the caller because the
 * prune's candidate set is keyed by it, and a second derivation is a second
 * chance to disagree.
 *
 * It is derived here rather than taken from a dry-run place because a dry-run
 * skill place still STAGES declared `assets:` companions into the source tree,
 * and this must mutate nothing at all.
 */
export function renderedFiles(
  kind: DeployKind,
  tree: RenderTree,
  names: readonly string[],
  layout: RenderedLayout = {},
): { rel: string; src: string; owner: string }[] {
  const agentExt = layout.agentExt ?? '.md';
  const agentRel =
    layout.agentRel ?? ((n: string) => defaultAgentRel(n, agentExt));
  const skillRel =
    layout.skillRel ??
    ((name: string): readonly string[] => [`skills/${name}`]);
  const agents = layout.agents ?? [];
  const out: { rel: string; src: string; owner: string }[] = [];
  for (const name of names) {
    if (kind === 'agent') {
      // SOURCE from the staging layout, `rel` in the HARNESS's layout — the same
      // asymmetry `placeAgentsLocal` writes with, so audit and action agree.
      const src = resolvePath(tree.agentsDir, `${name}${agentExt}`);
      if (existsSync(src)) {
        out.push({ rel: agentRel(name), src, owner: name });
      }
      continue;
    }
    if (kind === 'skill') {
      const dir = resolvePath(tree.skillsDir, name);
      if (!existsSync(resolvePath(dir, 'SKILL.md'))) {
        continue;
      }
      // EVERY destination, because the placer writes every destination. An audit
      // that enumerated one of omp's N+1 scopes would call the other N absent.
      for (const skillDir of skillRel(name, agents)) {
        for (const rel of walkSkillFiles(dir)) {
          out.push({
            rel: `${skillDir}/${rel}`,
            src: resolvePath(dir, rel),
            owner: name,
          });
        }
      }
      continue;
    }
    // hooks: the worker assets under `<hooksDir>/hooks/<id>/` (top level, as
    // `placeHooksLocal` copies them). The settings.json REGISTRATIONS are a
    // merge into a shared file, not a placed artifact, and are out of a
    // byte-comparison's reach by construction.
    if (!tree.hooksDir) {
      continue;
    }
    const dir = resolvePath(tree.hooksDir, 'hooks', name);
    if (!existsSync(dir)) {
      continue;
    }
    for (const f of readdirSync(dir).sort()) {
      const src = resolvePath(dir, f);
      if (statSync(src).isFile()) {
        out.push({ rel: `hooks/${name}/${f}`, src, owner: name });
      }
    }
  }
  // hooks, second half: the SCOPED mechanism modules. Not keyed by a hook id —
  // one module carries every cell's registrations — so they are enumerated from
  // the staging dir rather than from `names`, exactly as the placer does.
  const enforcingRel = layout.enforcingRel;
  if (kind === 'hooks' && tree.hooksDir && enforcingRel) {
    const stageRoot = resolvePath(tree.hooksDir, ENFORCING_STAGE_DIR);
    if (existsSync(stageRoot)) {
      for (const scope of readdirSync(stageRoot).sort()) {
        const scopeDir = resolvePath(stageRoot, scope);
        if (!statSync(scopeDir).isDirectory()) continue;
        for (const file of readdirSync(scopeDir).sort()) {
          const src = resolvePath(scopeDir, file);
          if (!statSync(src).isFile()) continue;
          out.push({
            rel: enforcingRel(file, scope),
            src,
            owner: `${ENFORCING_STAGE_DIR}:${scope}`,
          });
        }
      }
    }
  }
  return out.filter((f) => !f.rel.split('/').includes(BOOKKEEPING));
}

/** Lines present in `a` and not in `b`, as a multiset difference. Blank lines
 *  are dropped: they are never the doctrine that went missing. */
function lineDelta(a: string, b: string): string[] {
  const tally = (s: string): Map<string, number> => {
    const m = new Map<string, number>();
    for (const l of s.split('\n')) {
      m.set(l, (m.get(l) ?? 0) + 1);
    }
    return m;
  };
  const A = tally(a);
  const B = tally(b);
  const out: string[] = [];
  for (const [line, n] of A) {
    if (line.trim() === '') {
      continue;
    }
    for (let i = 0; i < n - (B.get(line) ?? 0); i += 1) {
      out.push(line);
    }
  }
  return out;
}

/** The first line worth quoting as "what this artifact is" — its heading or
 *  first real sentence, past a front-matter fence. */
function gistOf(text: string, fallback: string): string {
  const lines = text.split('\n').map((l) => l.trim());
  const body =
    lines[0] === '---' ? lines.slice(lines.indexOf('---', 1) + 1) : lines;
  const pick = body.find((l) => l !== '' && l !== '---');
  if (!pick) {
    return fallback;
  }
  return pick.length > 120 ? `${pick.slice(0, 117)}...` : pick;
}

/** Bytes that are not text — a diff of them would be noise, so the divergence
 *  is reported without lines. */
function isBinary(buf: Buffer): boolean {
  return buf.includes(0);
}

/**
 * Compare the DEPLOYED tree under `harnessDir` against what `tree` RENDERS for
 * `names` of one kind, and report every divergence per artifact.
 *
 * Reads only. Deletes nothing, writes nothing, re-places nothing.
 */
export function auditLocal(
  harnessDir: string,
  kind: DeployKind,
  tree: RenderTree,
  names: readonly string[],
  opts: AuditOpts = {},
): DriftReport {
  const agentExt = opts.agentExt ?? '.md';
  const agentRel =
    opts.agentRel ?? ((n: string) => defaultAgentRel(n, agentExt));
  const cap = opts.maxLines ?? 12;
  const clip = (ls: string[]): string[] => (cap > 0 ? ls.slice(0, cap) : ls);
  const rendered = renderedFiles(kind, tree, names, opts);
  const divergences: Divergence[] = [];

  // ── stale + absent: every rendered artifact, against its deployed copy.
  for (const { rel, src } of rendered) {
    const dest = resolvePath(harnessDir, rel);
    const want = readFileSync(src);
    if (!existsSync(dest)) {
      divergences.push({
        kind: 'absent',
        path: rel,
        deployKind: kind,
        missing: [],
        superseded: [],
        bytes: want.length,
        gist: isBinary(want)
          ? `${want.length} bytes, never deployed`
          : gistOf(want.toString('utf-8'), rel),
      });
      continue;
    }
    const have = readFileSync(dest);
    if (have.equals(want)) {
      continue;
    }
    const binary = isBinary(want) || isBinary(have);
    const w = binary ? '' : want.toString('utf-8');
    const h = binary ? '' : have.toString('utf-8');
    const missing = binary ? [] : lineDelta(w, h);
    const superseded = binary ? [] : lineDelta(h, w);
    divergences.push({
      kind: 'stale',
      path: rel,
      deployKind: kind,
      missing: clip(missing),
      superseded: clip(superseded),
      bytes: have.length,
      gist: binary
        ? `binary artifact, ${have.length} deployed bytes vs ${want.length} rendered`
        : missing.length === 0 && superseded.length === 0
          ? 'same lines, reordered or re-whitespaced'
          : `${missing.length} rendered line(s) missing, ${superseded.length} superseded line(s) still deployed`,
    });
  }

  // ── foreign: deployed, not rendered. BOTH populations, neither claimed.
  const prior = readManifest(harnessDir).kinds[kind] ?? {};
  // Ours-and-retired: a path a prior deploy recorded that this render tree no
  // longer produces. `staleFiles` is the prune's own candidate set, borrowed, and
  // it is keyed by the RECORD key — which is the artifact name for most kinds and
  // `enforcing:<scope>` for a scoped mechanism module. Grouped from the same
  // enumeration the comparison above used, so a module that IS rendered can never
  // be reported as retired.
  const renderedByName: Record<string, string[]> = {};
  for (const f of rendered) {
    const group = renderedByName[f.owner] ?? [];
    group.push(f.rel);
    renderedByName[f.owner] = group;
  }
  for (const rel of staleFiles(prior, renderedByName, [], false)) {
    const dest = resolvePath(harnessDir, rel);
    if (!existsSync(dest)) {
      continue; // already gone by hand; a deploy would simply drop the record
    }
    divergences.push({
      kind: 'foreign',
      path: rel,
      deployKind: kind,
      missing: [],
      superseded: [],
      bytes: statSync(dest).size,
      ours: true,
      gist: 'a prior deploy placed this and the render tree no longer carries it',
    });
  }
  // Not ours at all: `unattributable` mixes an operator's own artifact with an
  // orphan of a pre-manifest deploy and NOTHING can separate them, so it never
  // claims either. Reported so the operator can judge; never acted on.
  for (const name of unattributable(
    harnessDir,
    kind,
    [...names],
    Object.keys(prior),
    agentExt,
  )) {
    const rel = kind === 'agent' ? agentRel(name) : `${kindDir(kind)}/${name}/`;
    divergences.push({
      kind: 'foreign',
      path: rel,
      deployKind: kind,
      missing: [],
      superseded: [],
      bytes: 0,
      ours: false,
      gist: 'not in the render tree and not in our record — not ours to touch',
    });
  }

  const order: Record<DriftKind, number> = { stale: 0, absent: 1, foreign: 2 };
  divergences.sort(
    (a, b) => order[a.kind] - order[b.kind] || a.path.localeCompare(b.path),
  );
  return {
    harnessDir,
    deployKind: kind,
    compared: rendered.length,
    divergences,
  };
}

/** The kind's top-level dir under the deploy root. Mirrors `KIND_ROOT` in
 *  `manifest.ts`, which owns the fact but does not export it; used only to
 *  render a foreign NAME back as a path for the report. */
function kindDir(kind: DeployKind): string {
  return kind === 'skill' ? 'skills' : kind === 'hooks' ? 'hooks' : 'agents';
}
