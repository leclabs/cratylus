// The claude-code projection of the agent ANATOMY: assemble a full SOUL `.md`
// (front-matter + provenance header + `## Organ` sections + the `## Memory Protocol` genus
// block) from a typed agent's organ-fragment modules; and project a skill cell to
// its composed SKILL.md. This is koine's claude adapter owning "project a typed
// Agent/Skill to claude-code markdown" — the inversion's projection-to-disk path.
//
// Distinct from this adapter's IR serialize path (`write.ts` / `serializeAgent`):
// that projects the config-IR resources; THIS projects the anatomy SOULs. Two
// concepts, one adapter, no collision (mirrors `@leclabs/koine/anatomy` sitting
// beside the core IR `Agent`/`Skill`).
//
// Transcribed from the mind Python toolkit, not reinvented — the byte-anchor is
// `packages/mind/.render/{agents,skills}` (regen via `python3 toolkit/resolve.py
// --reader strong-llm-lean`). The three Python agent stages and their mirrors:
//   compose_agent_selection → `agentBody`
//   decorate/agent.decorate → `frontMatter`
//   render/claude_code.render → `agentToClaudeMd`
// And for skills: `compose_skill` + `emit_skill_dir` → `skillToClaudeMd`.

import { createHash } from 'node:crypto';
import type { Fragment, Mark, Organ } from '../../anatomy/index.js';
import type { HarnessReset } from './harness-reset.js';

// ── Reader-density axis (port of mind toolkit `compose/reader.py`) ────────────
// Reader density is a PROJECTION PARAMETER, never a property of the source: the
// SAME typed fragments project at three densities that close progressively larger
// prior-gaps. It is ORTHOGONAL to the harness affordance (how a `[[ref]]` name
// prints — `/trigger` vs `**bold**`): density decides how much SCAFFOLDING wraps
// that name. The Python byte-anchor is `resolve.py --reader <density>`.
//
//   strong-llm-lean   name only — the name is the pointer        (density → 0)
//   strong-llm        name + delineation                         (safe default)
//   weak-llm          + an explicit kind/verb cue                (max scaffold)
//
// NOTE on the current corpus: density-aware ref EXPANSION (`densityRef`) is the
// ported mechanism, but it only governs LIST-ITEM `- <ref>` surfaces. The deployed
// corpus has none: agents are organ-selection vectors whose value-cells are inlined
// verbatim (no per-anchor delineation to drop, no cue to add), and skills emit a
// LEAN one-line provenance (names only, by spec — `skill.py`: "names only, never
// the full delineations") plus harness-only inline refs. So the projected body is
// byte-identical at all three densities on this corpus — only the recorded
// `profile:` header line changes. The mechanism is parameterized and exercised so a
// future density-varying surface honors it; it is not a no-op by accident.

/** The reader-prior density axis — a projection parameter, not a source property. */
export type ReaderDensity = 'strong-llm-lean' | 'strong-llm' | 'weak-llm';

const READER_DENSITIES: readonly ReaderDensity[] = [
  'strong-llm-lean',
  'strong-llm',
  'weak-llm',
];

/** Whether a string is one of the three reader densities (CLI guard). */
export function isReaderDensity(s: string): s is ReaderDensity {
  return (READER_DENSITIES as readonly string[]).includes(s);
}

/** Derive the recorded `profile:` value (`<density>/<harness>`). */
export function densityProfile(
  density: ReaderDensity,
  harness = 'claude-code',
): string {
  return `${density}/${harness}`;
}

/**
 * One resolved-anchor LIST-ITEM line at the given density (port of `reader.py`
 * `render_ref`). `name` is the already-harness-projected anchor (a skill →
 * `/trigger`, else `**slug**`); `delineation` is the anchor's one-line bound; `cue`
 * is the weak-llm `<kind>, <verb>` scaffold (or `undefined` when the slug has no
 * kind cue). Mirrors:
 *   strong-llm-lean → `- <name>`                      (the name is the pointer)
 *   weak-llm        → `- <name> _(<cue>)_ -- <delin>` (cue present)
 *   else            → `- <name> -- <delineation>`     (strong-llm; weak w/o cue)
 */
export function densityRef(
  name: string,
  density: ReaderDensity,
  delineation: string,
  cue?: string,
): string {
  if (density === 'strong-llm-lean') {
    return `- ${name}`;
  }
  if (density === 'weak-llm' && cue) {
    return `- ${name} _(${cue})_ -- ${delineation}`;
  }
  return `- ${name} -- ${delineation}`;
}

// ── Agent projection ────────────────────────────────────────────────────────

/** A resolved agent ready to project: name, ordered organs, fragments, mark. */
export interface ResolvedAgent {
  readonly name: string;
  /**
   * The organ sections in SOURCE ORDER. Each is `[organTitle, [fragment, …]]` —
   * a set organ carries several fragments under one heading, a scalar one.
   */
  readonly organs: readonly (readonly [string, readonly Fragment[]])[];
  /** The emoji·hue mark (from the provenance fragment), or undefined. */
  readonly mark?: Mark;
  /** The agent description = the persona fragment's definiens. */
  readonly description: string;
  /** The repo-relative source path (for the provenance header). */
  readonly sourcePath: string;
  /** The `{name}`-parameterized memory protocol (the genus block). */
  readonly memoryProtocol: string;
}

/** `audience-adaptation` → `Audience-Adaptation`, `output-format` → `Output-Format`. */
export function organTitle(organ: string): string {
  return organ
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('-');
}

/** A fragment's inlined body in an agent def: the stripped `<slug> ≜ <definiens>`. */
function fragmentBody(f: Fragment): string {
  return `${f.slug} ≜ ${f.definiens}`;
}

/** sha256[:16] of a body — the drift anchor (mirrors Python `body_hash`). */
export function bodyHash(body: string): string {
  return createHash('sha256').update(body, 'utf8').digest('hex').slice(0, 16);
}

/** The 4-line GENERATED provenance comment (mirrors `provenance_header`). */
export function provenanceHeader(
  sourcePath: string,
  profile: string,
  bh: string,
): string {
  return `<!-- GENERATED from ${sourcePath} by projecting its composed cells at the recorded reader profile.
     profile: ${profile}
     Edit the cells and regenerate; do not hand-edit.
     content-hash: sha256:${bh} (regenerate-without-clobbering ancestor) -->`;
}

/**
 * The agent def BODY (no front-matter / header) — the exact text the renderer
 * hashes. Mirrors `compose_agent_selection`: `# <emoji> <name>`, then per organ a
 * `## <Organ-Title>` heading + each value's inlined body (blank-separated), then
 * the `## Memory Protocol` genus block ({name}-substituted). Closed `rstrip() + "\n"`.
 */
export function agentBody(a: ResolvedAgent): string {
  const emoji = a.mark?.emoji ?? '';
  const heading = emoji ? `${emoji} ${a.name}` : a.name;
  const out: string[] = [`# ${heading}`, ''];
  for (const [title, frags] of a.organs) {
    out.push(`## ${title}`, '');
    for (const f of frags) {
      out.push(fragmentBody(f), '');
    }
  }
  out.push('## Memory Protocol', '');
  out.push(a.memoryProtocol.replaceAll('{name}', a.name), '');
  return `${out.join('\n').replace(/\n+$/, '')}\n`;
}

/** The front-matter (mirrors `decorate/agent.decorate`): name, description, color. */
function agentFrontMatter(a: ResolvedAgent): string[] {
  let description = a.description;
  const fm: string[] = [`name: ${a.name}`];
  if (a.mark) {
    const { emoji, hue } = a.mark;
    if (emoji) {
      description = `${emoji} ${a.description}`;
    }
    fm.push(`description: ${description}`);
    if (hue) {
      fm.push(`color: ${hue}`);
    }
  } else {
    fm.push(`description: ${description}`);
  }
  return fm;
}

/** Frame a body as a claude artifact: front-matter + provenance header + body. */
function frameClaudeMd(
  frontMatter: string[],
  sourcePath: string,
  profile: string,
  body: string,
): string {
  const bh = bodyHash(body);
  const lines: string[] = ['---', ...frontMatter, '---', ''];
  lines.push(provenanceHeader(sourcePath, profile, bh), '');
  lines.push(body.replace(/\n+$/, ''), '');
  return lines.join('\n');
}

/**
 * The full claude-code SOUL for an agent (mirrors `render/claude_code.render`).
 * `profile` is `<reader>/<harness>` (default the deployed `strong-llm-lean/claude-code`).
 */
export function agentToClaudeMd(
  a: ResolvedAgent,
  profile = 'strong-llm-lean/claude-code',
): string {
  return frameClaudeMd(
    agentFrontMatter(a),
    a.sourcePath,
    profile,
    agentBody(a),
  );
}

// ── Delta-over-target (subtract the harness reset) ───────────────────────────
// An ADDITIVE capability on top of `agentToClaudeMd`: the DEFAULT projection is
// unchanged (byte-identical to the Python oracle); this is a SEPARATE path that
// subtracts the supplied harness reset so the projected SOUL carries only the
// agent's distinctive delta. The reset declares, per organ, whether to take the
// SET-DIFFERENCE (drop agent fragments whose slug is harness-provided) or to OMIT
// a SCALAR organ entirely when its single value matches the reset slug. Organs
// with no reset entry pass through untouched. An organ emptied by subtraction is
// dropped (no empty `## Organ` heading). See `docs/baseline-delta-model.md`.

/**
 * Invert `organTitle`: recover the `Organ` slug an organ-section title came from
 * (`Audience-Adaptation` → `audience-adaptation`, `Actions` → `actions`). The projected
 * `ResolvedAgent.organs` carries display titles; the reset is keyed by `Organ`.
 */
function titleToOrgan(title: string): Organ {
  return title.toLowerCase() as Organ;
}

/**
 * Subtract a harness reset from a resolved agent's organ sections, returning a
 * new `ResolvedAgent` whose `organs` carry only the agent's delta. Pure — does
 * not mutate the input. SET organs → set-difference by slug; SCALAR organs →
 * omitted iff the single fragment's slug equals the reset slug; emptied organs
 * dropped; organs absent from the reset are kept verbatim.
 */
export function subtractReset(
  a: ResolvedAgent,
  reset: HarnessReset,
): ResolvedAgent {
  const organs: (readonly [string, readonly Fragment[]])[] = [];
  for (const [title, frags] of a.organs) {
    const entry = reset[titleToOrgan(title)];
    if (!entry) {
      organs.push([title, frags]);
      continue;
    }
    const provided = new Set(entry.slugs);
    if (entry.kind === 'scalar') {
      // Omit the whole organ iff its single value is the harness-provided one.
      const only = frags[0];
      if (frags.length === 1 && only && provided.has(only.slug)) {
        continue;
      }
      organs.push([title, frags]);
      continue;
    }
    // SET: keep only the fragments the harness does NOT provide.
    const kept = frags.filter((f) => !provided.has(f.slug));
    if (kept.length > 0) {
      organs.push([title, kept]);
    }
  }
  return { ...a, organs };
}

/**
 * The DELTA claude-code SOUL for an agent: like `agentToClaudeMd` but with the
 * harness reset subtracted first (the separate, opt-in subtraction path). The
 * front-matter/header framing is identical; only the organ body differs.
 */
export function projectAgentDelta(
  a: ResolvedAgent,
  reset: HarnessReset,
  profile = 'strong-llm-lean/claude-code',
): string {
  return agentToClaudeMd(subtractReset(a, reset), profile);
}

// ── Skill projection ────────────────────────────────────────────────────────

/** A resolved skill ready to project to its composed SKILL.md. */
export interface ResolvedSkill {
  readonly name: string;
  readonly trigger: string;
  /** Front-matter `delineation` (the SKILL.md `description`). */
  readonly delineation: string;
  /**
   * Optional host-discovery copy (`skill_description:`). When present it is the
   * SKILL.md `description` instead of `delineation` (the `deploy: skill-dir` path).
   */
  readonly skillDescription?: string;
  /** The verbatim canonical cell body (`split('---',2)[2]`). */
  readonly body: string;
  /** The composed-anchor provenance names, already harness-projected (or []). */
  readonly composedFrom: readonly string[];
  /** The repo-relative source path (for the provenance header). */
  readonly sourcePath: string;
  /**
   * A `deploy: skill-dir` cell (e.g. `memory`) emits its `## Tool` section body
   * VERBATIM as the SKILL.md body, NOT the composed skill body. When set, this is
   * that section text and the composed-body path is bypassed.
   */
  readonly toolSection?: string;
}

const REF_RE = /\[\[([a-z0-9-]+)\]\]/g;

/** ``` fenced-block line indices (markers included) — mirrors `fence_lines`. */
function fenceMask(body: string): Set<number> {
  const lines = body.split('\n');
  const mask = new Set<number>();
  let open = -1;
  for (let i = 0; i < lines.length; i++) {
    if ((lines[i] as string).startsWith('```')) {
      if (open === -1) {
        open = i;
      } else {
        for (let j = open; j <= i; j++) {
          mask.add(j);
        }
        open = -1;
      }
    }
  }
  return mask;
}

/**
 * The composed SKILL.md body (mirrors `compose_skill`): drop the prose `≜`
 * formula line (the composition formula, consumed not emitted) and its trailing
 * blank, project `[[refs]]` on prose lines via `refProject`, KEEP the
 * `## Harness: <target>` selector (re-headed) and drop other-harness selectors,
 * append a one-line "Composed from …" provenance when refs exist. Fence interiors
 * pass through verbatim. Returns `rstrip() + "\n"`.
 */
export function skillBody(
  s: ResolvedSkill,
  refProject: (slug: string) => string,
  harness = 'claude-code',
): string {
  // `deploy: skill-dir` (memory): the `## Tool` section verbatim, no composition.
  if (s.toolSection !== undefined) {
    return `${s.toolSection.replace(/\n+$/, '')}\n`;
  }

  const fence = fenceMask(s.body);
  const lines = s.body.split('\n');
  const project = (l: string, i: number) =>
    fence.has(i)
      ? l
      : l.replace(REF_RE, (_m, slug) => refProject(slug as string));

  // Section structure: preamble (before first `## `) then sections.
  const out: string[] = [];
  // Heading (first `# `), intro (preamble minus the `≜` formula), then sections.
  let h1Seen = false;
  let i = 0;
  // Preamble.
  const preamble: string[] = [];
  for (; i < lines.length; i++) {
    const l = lines[i] as string;
    if (l.startsWith('## ') && !fence.has(i)) {
      break;
    }
    if (l.startsWith('# ') && !h1Seen && !fence.has(i)) {
      h1Seen = true;
      out.push(l);
      out.push('');
      continue;
    }
    if (l.includes('≜') && !fence.has(i)) {
      continue; // the prose formula line is dropped
    }
    if (h1Seen) {
      preamble.push(project(l, i));
    }
  }
  const introText = preamble.join('\n').replace(/^\n+/, '').replace(/\n+$/, '');
  if (introText) {
    out.push(introText, '');
  }
  if (s.composedFrom.length) {
    out.push(`Composed from ${s.composedFrom.join(' · ')}.`, '');
  }

  // Sections (each `## ` heading to the next), harness selector handling.
  const harnessRe = /^## Harness:\s*(\S+)\s*$/;
  let curHead: string | null = null;
  let curBody: string[] = [];
  const flush = () => {
    if (curHead === null) {
      return;
    }
    const m = curHead.match(harnessRe);
    if (m) {
      if (m[1] !== harness) {
        curHead = null;
        curBody = [];
        return;
      }
      out.push(`## Harness (${harness})`);
    } else {
      out.push(curHead);
    }
    for (const b of curBody) {
      out.push(b);
    }
    while (out.length && out[out.length - 1] === '') {
      out.pop();
    }
    out.push('');
    curHead = null;
    curBody = [];
  };
  for (; i < lines.length; i++) {
    const l = lines[i] as string;
    if (l.startsWith('## ') && !fence.has(i)) {
      flush();
      curHead = l;
    } else if (curHead !== null) {
      curBody.push(project(l, i));
    }
  }
  flush();

  return `${out.join('\n').replace(/\n+$/, '')}\n`;
}

/**
 * The skill SKILL.md front-matter. A composed `kind: skill` cell carries
 * `name / description / trigger`; a `deploy: skill-dir` cell (the `toolSection`
 * path, e.g. `memory`) carries only `name / description` — no `trigger` line
 * (mirrors `emit_skill_dir`, which has no command affordance).
 */
function skillFrontMatter(s: ResolvedSkill): string[] {
  const fm = [
    `name: ${s.name}`,
    `description: ${s.skillDescription ?? s.delineation}`,
  ];
  if (s.toolSection === undefined) {
    fm.push(`trigger: ${s.trigger}`);
  }
  return fm;
}

/**
 * The full composed SKILL.md for a skill (mirrors `compose_skill` + render, or
 * `emit_skill_dir` for a `deploy: skill-dir` cell). `refProject` maps a `[[slug]]`
 * to its harness affordance (a skill → its `/trigger`, else `**slug**`).
 */
export function skillToClaudeMd(
  s: ResolvedSkill,
  refProject: (slug: string) => string,
  profile = 'strong-llm-lean/claude-code',
  harness = 'claude-code',
): string {
  return frameClaudeMd(
    skillFrontMatter(s),
    s.sourcePath,
    profile,
    skillBody(s, refProject, harness),
  );
}
