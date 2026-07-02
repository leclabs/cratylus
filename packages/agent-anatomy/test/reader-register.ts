// reader-register — the reusable half of the READER-DENSITY gate: the reader
// binding ρ over artifact classes + the deterministic register(a) witness +
// conform(a) ⇔ register(a) = ρ(a) (`src/skills/signify.ts`, READER BINDING).
// `reader-density.test.ts` (static corpus surfaces + ratchets) and
// `reader-reach.test.ts` (runtime frontiers: generated artifacts · agent↔agent
// messages) both enforce THIS one model — one detector, one RHO, no drift.
//
// Signal-class thresholds frozen from the 2026-07-01 corpus sweep; calibration
// provenance in `reader-density.test.ts`'s header. The detector is one-sided:
// it can witness register=human, never certify it — so ρ=human classes are
// exempt BY THE MODEL, never by path.

// ── ρ — the reader binding over the artifact classes this corpus materializes
//        or its skills generate. Mirrors the READER BINDING subset lists. ──────

export type Rho = 'LLM' | 'human';
export const RHO = {
  // static corpus surfaces (reader-density.test.ts)
  'organ-definiens': 'LLM', // source cell
  'skill-delineation': 'LLM', // progressive-disclosure surface, read by the harness LLM
  'skill-prose': 'LLM', // projected SKILL.md body (outside fences)
  'genus-protocol': 'LLM', // verbatim(a) ⇒ ρ(a) = LLM — ship-whole, never a density exemption
  'agent-vector': 'LLM', // projected SOUL
  // runtime frontiers (reader-reach.test.ts)
  'task-file': 'LLM', // praxis: blind-dispatchable execution spec = the dispatch prompt
  'plan-mirror': 'LLM', // praxis: PLAN.md, agent-read
  'agent-memory': 'LLM', // dream/handoff/wake: SELF · MEMORY · EPISODIC · routed AGENTS.md
  'generated-agent-artifact': 'LLM', // create-agent vectors · exemplify cells/manifests on consumer hosts
  'delegation-prompt': 'LLM', // agent↔agent dispatch
  'subagent-return': 'LLM', // agent↔agent return
  // ρ = human ⇔ readers(a) = {human}
  readme: 'human',
  'human-doc': 'human',
  'commit-message': 'human',
  'generated-human-output': 'human', // slack · email · report — generated FOR a human
} as const satisfies Record<string, Rho>;
export type ArtClass = keyof typeof RHO;

// ── register(a) — the deterministic human-register witness ─────────────────────

/** Tutorial / hedge / connective lexicon — the human-gloss register markers. */
const HEDGE_PATTERNS: ReadonlyArray<readonly [string, RegExp]> = [
  ['note-that', /\bnote that\b/i],
  ['in-other-words', /\bin other words\b/i],
  ['that-is-to-say', /\bthat is to say\b/i],
  ['in-order-to', /\bin order to\b/i],
  ['make-sure', /\bmake sure\b/i],
  ['be-sure-to', /\bbe sure to\b/i],
  ['please', /\bplease\b/i],
  ['keep-in-mind', /\bkeep in mind\b/i],
  ['remember-that', /\bremember that\b/i],
  ['of-course', /\bof course\b/i],
  ['it-is-important', /\bit is important\b/i],
  ['essentially', /\bessentially\b/i],
  ['basically', /\bbasically\b/i],
  ['put-simply', /\bput simply\b/i],
  ['worth-noting', /\bworth noting\b/i],
  ['as-you-can-see', /\bas you can see\b/i],
  ['dont-worry', /\bdon'?t worry\b/i],
  ['feel-free', /\bfeel free\b/i],
  ['you-modal', /\byou (should|can|cannot|may|might|need to|will want)\b/i],
  ['for-example', /\bfor example\b/i],
  ['means-that', /\b(this |which )?means that\b/i],
  ['allows-helps', /\b(allows?|helps?|enables?) (you|the reader|us)\b/i],
];
const HEDGE_FAIL = 2;

const SECOND_PERSON = /\b(you|your|yours|yourself)\b/gi;
const SECOND_PERSON_MIN_HITS = 2;
const SECOND_PERSON_MIN_RATE = 4; // hits per 100 words

const FPP = /\b(we|let'?s|us)\b/gi;
const FPP_FAIL = 2;

function wordCount(text: string): number {
  return (text.match(/[A-Za-z][A-Za-z'-]*/g) ?? []).length;
}

/** The named human-register signals `text` witnesses (∅ ⇒ register = LLM). */
export function humanRegisterSignals(text: string): string[] {
  const signals: string[] = [];
  const n = wordCount(text);
  const hedges = HEDGE_PATTERNS.filter(([, re]) => re.test(text));
  if (hedges.length >= HEDGE_FAIL) {
    signals.push(
      `HEDGE×${hedges.length} (${hedges.map(([k]) => k).join(' ')})`,
    );
  }
  const second = (text.match(SECOND_PERSON) ?? []).length;
  const secondRate = n ? (second / n) * 100 : 0;
  if (
    second >= SECOND_PERSON_MIN_HITS &&
    secondRate >= SECOND_PERSON_MIN_RATE
  ) {
    signals.push(`SECOND-PERSON×${second} (${secondRate.toFixed(1)}/100)`);
  }
  const fpp = (text.match(FPP) ?? []).length;
  if (fpp >= FPP_FAIL) {
    signals.push(`FPP-WALKTHROUGH×${fpp}`);
  }
  return signals;
}

export function registerOf(text: string): Rho {
  return humanRegisterSignals(text).length > 0 ? 'human' : 'LLM';
}

/** conform, one-sided: ρ=LLM demands register=LLM; ρ=human is exempt by the model. */
export function conform(cls: ArtClass, text: string): boolean {
  return RHO[cls] === 'human' || registerOf(text) === 'LLM';
}
