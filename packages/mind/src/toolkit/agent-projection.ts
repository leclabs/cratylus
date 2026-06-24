// The claude-code projection of an agent: assemble the full SOUL (front-matter +
// provenance header + `## Organ` sections + the `## Memory` genus block) from the
// agent's organ-fragment modules. Mirrors the Python `compose_agent_selection`
// (toolkit/compose/agent.py) + `decorate/agent.py` + `render/claude_code.py`
// EXACTLY — the byte-anchor is `packages/mind/.render/agents/<name>.md`.
//
// Transcribed, not reinvented. The three Python stages and their TS mirrors:
//   compose_agent_selection → `agentBody`   (the `# heading` + `## Organ` sections + `## Memory`)
//   decorate/agent.decorate → `frontMatter` (name, emoji-prefixed description, color)
//   render/claude_code.render → `agentToClaudeMd` (front-matter + provenance header + body)
//
// The content-hash is DERIVED from the body (`sha256(body)[:16]`), so a
// byte-identical body yields the same hash automatically — we just emit the same
// header format.

import { createHash } from 'node:crypto';
import type { Fragment, Mark } from '@leclabs/koine/anatomy';

/** A resolved agent ready to project: name, ordered organs, their fragments, mark. */
export interface ResolvedAgent {
  readonly name: string;
  /**
   * The organ sections in SOURCE ORDER. Each is `[organTitle, [fragment, …]]` —
   * a set organ carries several fragments under one heading, a scalar one. The
   * title is the readable heading (`register-fit` → `Register-Fit`).
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

/** `register-fit` → `Register-Fit`, `disposition-memory` → `Disposition-Memory`. */
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

/**
 * The agent def BODY (no front-matter, no provenance header) — the exact text the
 * renderer hashes. Mirrors `compose_agent_selection`: `# <emoji> <name>`, then per
 * organ a `## <Organ-Title>` heading + each value's inlined body (blank-separated),
 * then the `## Memory` genus block ({name}-substituted). Closed with
 * `"\n".join(body).rstrip() + "\n"`.
 */
export function agentBody(a: ResolvedAgent): string {
  const emoji = a.mark?.emoji ?? '';
  const heading = emoji ? `${emoji} ${a.name}` : a.name;
  const out: string[] = [];
  out.push(`# ${heading}`);
  out.push('');
  for (const [title, frags] of a.organs) {
    out.push(`## ${title}`);
    out.push('');
    for (const f of frags) {
      out.push(fragmentBody(f));
      out.push('');
    }
  }
  // Genus: the memory protocol verbatim, {name}-substituted.
  out.push('## Memory');
  out.push('');
  out.push(a.memoryProtocol.replaceAll('{name}', a.name));
  out.push('');
  return `${out.join('\n').replace(/\n+$/, '')}\n`;
}

/** sha256[:16] of the body — the drift anchor (mirrors `body_hash`). */
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

/** The front-matter (mirrors `decorate/agent.decorate`): name, description, color. */
function frontMatter(a: ResolvedAgent): string[] {
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

/**
 * The full claude-code SOUL for an agent (mirrors `render/claude_code.render`):
 * front-matter, the provenance header, then the body. `profile` is
 * `<reader>/<harness>` (default the deployed `strong-llm-lean/claude-code`).
 */
export function agentToClaudeMd(
  a: ResolvedAgent,
  profile = 'strong-llm-lean/claude-code',
): string {
  const body = agentBody(a);
  const bh = bodyHash(body);
  const lines: string[] = [];
  lines.push('---');
  // decorate then render: front-matter built so description is emoji-prefixed.
  // The renderer serializes the front-matter dict verbatim, in insertion order.
  for (const line of frontMatter(a)) {
    lines.push(line);
  }
  lines.push('---');
  lines.push('');
  lines.push(provenanceHeader(a.sourcePath, profile, bh));
  lines.push('');
  lines.push(body.replace(/\n+$/, ''));
  lines.push('');
  return lines.join('\n');
}
