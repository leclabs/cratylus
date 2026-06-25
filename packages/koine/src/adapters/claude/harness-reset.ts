// The CLAUDE HARNESS RESET — what Claude Code provides natively, measured by a
// blind bare `/introspect` on the harness (no agent loaded). This is the basis
// for omit-to-inherit: when an agent's organ value equals the harness-provided
// value, the claude adapter can SUBTRACT it at export so the projected SOUL
// carries only the agent's distinctive delta (see `docs/baseline-delta-model.md`,
// the "harness reset" row + the delta-over-target law).
//
// `claude` is a HARNESS, never a mind agent — so this reset lives HERE in the
// koine claude adapter, NOT as a `mind/agents/*` module. Each adapter owns its
// own harness reset; subtraction fires per the reset's organ kind:
//   - SET organ   → emit the SET-DIFFERENCE (drop agent fragments whose slug is
//                   in the reset set; keep the rest).
//   - SCALAR organ → OMIT the organ section entirely iff the agent's single
//                   fragment slug equals the reset slug.
// Organs with NO entry here are never subtracted — always emitted.
//
// Identity is by fragment `slug` (the corpus anchor). The values below ARE the
// recorded measurement (the conformance fixture, T2.2): a drift check asserts
// the declared reset equals this fixture.

import type { Organ } from '../../anatomy/index.js';

/** One organ's harness-provided value(s), keyed by fragment slug. */
export interface HarnessOrganReset {
  /** Whether the organ is a SET (emit set-difference) or SCALAR (omit on match). */
  readonly kind: 'set' | 'scalar';
  /**
   * The harness-provided fragment slugs. For a SCALAR organ this is a single
   * slug; for a SET organ it is the full set the harness provides.
   */
  readonly slugs: readonly string[];
}

/** A harness reset: the organs a harness provides natively, by organ name. */
export type HarnessReset = Partial<Record<Organ, HarnessOrganReset>>;

/**
 * The claude-code harness reset — ratified from a blind bare-`/introspect`
 * measurement (DECISION 2). ONLY these organs have a reset entry; every other
 * organ is always emitted. Each entry's `kind` selects the subtraction rule.
 *
 * NOTE: the SET-organ slug sets are the FULL native repertoire — subtraction is
 * value-equality on slug, so listing extra harness slugs an agent never carries
 * is harmless (only the intersection is dropped). The corpus anchors below are
 * the load-bearing members an agent might also select.
 */
export const claudeHarnessReset: HarnessReset = {
  // The full Claude Code tool repertoire (file/dir ops, sub-agent delegation,
  // code execution, web/notebook/mcp tools). Corpus anchors: file-ops, delegation.
  effectors: {
    kind: 'set',
    slugs: [
      'file-ops',
      'delegation',
      'code-execution',
      'communication',
      'retrieval',
      'tool-call',
    ],
  },
  // Text channel (plus image input).
  sensors: { kind: 'set', slugs: ['text', 'image'] },
  substrate: { kind: 'scalar', slugs: ['claude'] },
  percept: { kind: 'scalar', slugs: ['user-message'] },
  enaction: { kind: 'scalar', slugs: ['natural-language'] },
  address: { kind: 'scalar', slugs: ['human-on-the-loop'] },
  charter: {
    kind: 'set',
    slugs: ['harm-avoidance', 'honesty', 'helpfulness', 'input-untrusted'],
  },
  deliberation: { kind: 'scalar', slugs: ['react'] },
  resolve: { kind: 'scalar', slugs: ['satisfice'] },
  comportment: { kind: 'scalar', slugs: ['neutral'] },
};
