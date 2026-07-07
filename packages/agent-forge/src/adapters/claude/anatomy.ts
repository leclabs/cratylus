// The claude-code projection of the agent ANATOMY: assemble a full SOUL `.md`
// (front-matter + provenance header + `## Organ` sections + the `## Memory Protocol` genus
// block) from a typed agent's organ-fragment modules; and project a skill cell to
// its composed SKILL.md. This is agent-forge's claude adapter owning "project a typed
// Agent/Skill to claude-code markdown" — the inversion's projection-to-disk path.
//
// Distinct from this adapter's IR serialize path (`write.ts` / `serializeAgent`):
// that projects the config-IR resources; THIS projects the anatomy SOULs. Two
// concepts, one adapter, no collision (mirrors `@leclabs/agent-forge/anatomy` sitting
// beside the core IR `Agent`/`Skill`).
//
// Transcribed from the agent-anatomy Python toolkit, not reinvented — the byte-anchor is
// `packages/agent-anatomy/.render/{agents,skills}` (regen via `python3 toolkit/resolve.py
// --reader strong-llm-lean`). The three Python agent stages and their mirrors:
//   compose_agent_selection → `agentBody`
//   decorate/agent.decorate → `frontMatter`
//   render/claude_code.render → `agentToClaudeMd`
// And for skills: `compose_skill` + `emit_skill_dir` → `skillToClaudeMd`.

import { createHash } from 'node:crypto';
import type { Agent } from '../../anatomy/index.js';
import { ORGAN_NAMES, markToColor } from '../../anatomy/index.js';

// ── Reader-density axis (port of agent-anatomy toolkit `compose/reader.py`) ────────────
// Reader density is a PROJECTION PARAMETER, never a property of the source: the
// SAME typed fragments project at three densities that close progressively larger
// prior-gaps. It is ORTHOGONAL to the harness affordance (how a `[[ref]]` name
// prints — `/trigger` vs `**bold**`): density decides how much SCAFFOLDING wraps
// that name. The Python byte-anchor is `resolve.py --reader <density>`.
//
//   strong-llm-lean   name only — the name is the pointer        (density → 0)
//   strong-llm        name + description                         (safe default)
//   weak-llm          + an explicit kind/verb cue                (max scaffold)
//
// NOTE on the current corpus: density-aware ref EXPANSION (`densityRef`) is the
// ported mechanism, but it only governs LIST-ITEM `- <ref>` surfaces. The deployed
// corpus has none: agents are organ-selection vectors whose value-cells are inlined
// verbatim (no per-anchor description to drop, no cue to add), and skills emit a
// LEAN one-line provenance (names only, by spec — `skill.py`: "names only, never
// the full descriptions") plus harness-only inline refs. So the projected body is
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
 * `/trigger`, else `**slug**`); `description` is the anchor's one-line bound; `cue`
 * is the weak-llm `<kind>, <verb>` scaffold (or `undefined` when the slug has no
 * kind cue). Mirrors:
 *   strong-llm-lean → `- <name>`                      (the name is the pointer)
 *   weak-llm        → `- <name> _(<cue>)_ -- <delin>` (cue present)
 *   else            → `- <name> -- <description>`     (strong-llm; weak w/o cue)
 */
export function densityRef(
  name: string,
  density: ReaderDensity,
  description: string,
  cue?: string,
): string {
  if (density === 'strong-llm-lean') {
    return `- ${name}`;
  }
  if (density === 'weak-llm' && cue) {
    return `- ${name} _(${cue})_ -- ${description}`;
  }
  return `- ${name} -- ${description}`;
}

// ── Agent projection (from the Agent vector directly) ────────────────────────

/** `audience-adaptation` → `Audience-Adaptation`, `output-format` → `Output-Format`. */
export function organTitle(organ: string): string {
  return organ
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('-');
}

/** organ kebab name → its `Agent` camelCase field. */
function organField(organ: string): keyof Agent {
  return organ.replace(/-(\w)/g, (_, c: string) =>
    c.toUpperCase(),
  ) as keyof Agent;
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
 * The agent def BODY (no front-matter) — derived from the `Agent` VECTOR alone:
 * `# <emoji> <name>`, the `## Persona` identity section, then each non-null organ
 * (in ANATOMY declaration order) as a `## <Organ-Title>` heading + its branded
 * value(s) — the value string IS the SOUL body ⟨α, residue⟩, emitted verbatim; a
 * set organ lists its members blank-separated. `null` organs are omitted
 * (harness-inherit). Closed `rstrip() + "\n"`.
 */
export function agentBody(a: Agent): string {
  const emoji = a.provenance?.mark.emoji ?? '';
  const heading = emoji ? `${emoji} ${a.name}` : a.name;
  const out: string[] = [`# ${heading}`, ''];
  if (a.persona) {
    out.push('## Persona', '', a.persona, '');
  }
  for (const organ of ORGAN_NAMES) {
    const value = a[organField(organ)];
    if (value === null || value === undefined) {
      continue;
    }
    out.push(`## ${organTitle(organ)}`, '');
    for (const v of Array.isArray(value) ? value : [value]) {
      out.push(v as string, '');
    }
  }
  return `${out.join('\n').replace(/\n+$/, '')}\n`;
}

/** The front-matter (name, description = persona, color = mark→color). */
function agentFrontMatter(a: Agent): string[] {
  const emoji = a.provenance?.mark.emoji;
  const description = emoji ? `${emoji} ${a.persona}` : a.persona;
  const fm: string[] = [`name: ${a.name}`, `description: ${description}`];
  if (a.provenance?.mark) {
    fm.push(`color: ${markToColor(a.provenance.mark)}`);
  }
  return fm;
}

/**
 * Frame a body as a claude artifact: front-matter + body. No provenance header —
 * the `<!-- GENERATED … content-hash … -->` banner is build-provenance the running
 * agent never consumes, and it is not injected into the deployed SOUL. `bodyHash` /
 * `provenanceHeader` remain exported as reusable primitives (a future drift reader
 * recomputes the hash from the body); they are simply not injected here.
 */
function frameClaudeMd(frontMatter: string[], body: string): string {
  const lines: string[] = ['---', ...frontMatter, '---', ''];
  lines.push(body.replace(/\n+$/, ''), '');
  return lines.join('\n');
}

/** The full claude-code SOUL for an agent, projected from its `Agent` vector. */
export function agentToClaudeMd(a: Agent): string {
  return frameClaudeMd(agentFrontMatter(a), agentBody(a));
}

// ── Skill projection ────────────────────────────────────────────────────────

/** A resolved skill ready to project to its composed SKILL.md. */
export interface ResolvedSkill {
  readonly name: string;
  readonly trigger: string;
  /** Front-matter `description` (the SKILL.md `description`). */
  readonly description: string;
  /**
   * Optional host-discovery copy (`skill_description:`). When present it is the
   * SKILL.md `description` instead of `description` (the `deploy: skill-dir` path).
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
 * composition-formula line ONLY (`<name> ≜ …`, consumed not emitted — every
 * other `≜`-bearing preamble line, e.g. an absorbed-declaration bullet, is
 * kept), project `[[refs]]` on prose lines via `refProject`, KEEP the
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
    // Drop ONLY the composition-formula line (`<name> ≜ …` at line start —
    // consumed by composition, never emitted). Any other `≜`-bearing preamble
    // line — an absorbed-declaration bullet (`- **x** ≜ …`) above all — is the
    // cell's self-sufficiency mechanism and MUST render.
    if (l.startsWith(`${s.name} ≜`) && !fence.has(i)) {
      continue;
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
    `description: ${s.skillDescription ?? s.description}`,
  ];
  if (s.toolSection === undefined) {
    fm.push(`trigger: ${s.trigger}`);
  }
  return fm;
}

/**
 * The full composed SKILL.md for a skill (mirrors `compose_skill` + render, or
 * `emit_skill_dir` for a `deploy: skill-dir` cell). `refProject` maps a `[[slug]]`
 * to its harness affordance (a skill → its `/trigger`, else `**slug**`). `_profile`
 * is retained for API symmetry but no longer recorded (no provenance banner is
 * injected — build-provenance the running agent never consumes).
 */
export function skillToClaudeMd(
  s: ResolvedSkill,
  refProject: (slug: string) => string,
  _profile = 'strong-llm-lean/claude-code',
  harness = 'claude-code',
): string {
  return frameClaudeMd(skillFrontMatter(s), skillBody(s, refProject, harness));
}
