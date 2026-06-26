// The CODEX HARNESS RESET — what the Codex CLI provides natively, the basis for
// omit-to-inherit when projecting a mind agent through the codex adapter (mirrors
// `adapters/claude/harness-reset.ts`, the T2.2 pattern). When an agent's organ
// value equals the harness-provided value, the codex adapter can SUBTRACT it at
// export so the projected agent carries only its distinctive delta.
//
// `codex` is a HARNESS, never a mind agent — so this reset lives HERE in the koine
// codex adapter, NOT as a `mind/agents/*` module. Subtraction fires per organ kind
// exactly as for claude (SET → set-difference; SCALAR → omit-on-match); the shared
// `HarnessReset` type and `subtractReset` machinery are reused from the claude
// adapter (the reset is harness-data, the subtraction is harness-neutral).
//
// ── ACCURACY DISCLAIMER (T2.4 scope) ─────────────────────────────────────────
// Per-harness reset ACCURACY is explicitly OUT OF SCOPE for T2.4 (incremental —
// it is refined when the harness is actually measured). Unlike `claudeHarnessReset`
// (ratified from a blind bare `/introspect`, DECISION 2), this is a REASONABLE
// FIRST PASS, not a measured fixture. Codex is an Anthropic-class coding agent over
// the SAME substrate family, so the assumptions below mirror claude's measured set:
//   - actions: Codex provides shell/file/code-exec + sub-agent (`agents/*.toml`).
//   - modalities: text + image input.
//   - model/trigger/output-format/autonomy/reasoning-strategy/satisficing/formality:
//     same defaults a general coding-agent harness provides (a turn answers a user
//     message in natural language, ReAct loop, satisficing, neutral register).
//   - guardrails:  Codex ships the same HHH + untrusted-input safety floor.
// The ONE deliberate divergence from claude: `model` is `codex` here, not
// `claude` — a mind agent whose model is `claude` is NOT subtracted under
// codex (its model is a real delta there). When Codex is measured by a blind
// bare introspection, replace these slugs with the recorded values and promote
// this to a conformance fixture (as `claudeHarnessReset` already is).

import type { HarnessReset } from '../claude/harness-reset.js';

/**
 * The codex harness reset — a FIRST-PASS estimate (see the accuracy disclaimer
 * above), mirroring `claudeHarnessReset`'s organ set and subtraction kinds. ONLY
 * these organs have a reset entry; every other organ is always emitted.
 */
export const codexHarnessReset: HarnessReset = {
  // The Codex tool repertoire (shell/file/code-exec, sub-agent via agents/*.toml,
  // mcp). Corpus anchors an agent might also select: file-ops, delegation,
  // code-execution.
  actions: {
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
  modalities: { kind: 'set', slugs: ['text', 'image'] },
  // The one deliberate divergence from claude: the codex model is `codex`.
  model: { kind: 'scalar', slugs: ['codex'] },
  trigger: { kind: 'scalar', slugs: ['user-message'] },
  'output-format': { kind: 'scalar', slugs: ['natural-language'] },
  autonomy: { kind: 'scalar', slugs: ['human-on-the-loop'] },
  guardrails: {
    kind: 'set',
    slugs: ['harm-avoidance', 'honesty', 'helpfulness', 'input-untrusted'],
  },
  'reasoning-strategy': { kind: 'scalar', slugs: ['react'] },
  satisficing: { kind: 'scalar', slugs: ['satisfice'] },
  formality: { kind: 'scalar', slugs: ['neutral'] },
};
