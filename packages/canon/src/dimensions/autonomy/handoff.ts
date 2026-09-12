import type { Autonomy } from '../../manifest.js';

// The report's SHAPE, which is not its register — `formality` owns that. This
// value says what the turn-ending report must lead with and what it must end
// on; `plain` says how the sentences in between read.
//
// THE SIGN IS `handoff`, AND `check-in` WAS THE DEFECT. Cold decode of
// `check-in`, asked whether a rule so labelled governs every message a worker
// sends: "It applies only to some — the messages that actually are check-ins;
// it doesn't reach ordinary questions, replies, reports." The value's own
// referent is EVERY operator-facing reply, so the sign scoped away most of its
// own extension, and the rubric that enforces it wrote the scoping into law
// (L1). `handoff` decodes to the act this actually is: "transfer of
// responsibility … at the boundary — when one person's or agent's part ends and
// another's begins … must contain current state, what was done, what remains,
// and who now owns the work." Every agent turn IS that boundary, and `what
// remains / who owns it` is the tail, already in the sign's priors.
//
// THE TAIL IS THE OPERATOR'S ACTION ITEMS, not the agent's summary of its own
// work. `owed ↦ recommendation-bearing-tail` was the σ* predecessor and it
// under-specified exactly here: a recommendation is something the agent holds,
// while what the operator needs at the end of a report is the list of decisions
// and acts that are THEIRS. A report that closes on prose about what was done
// leaves the reader to derive their own next move from it.
//
// ρ = human (`emission-definiens`, `test/reader-register.ts`), for the same
// reason the formality repertoire is: this value's referent is a reply the
// operator reads, so it is written in the register it governs. Its `autonomy`
// siblings — `decision-authority`, `mission-command`, `human-on-the-loop` —
// govern what the agent DOES and stay σ*, which is why ρ binds per VALUE here
// rather than per dimension.
//
// THE MANDATE STAYS A MANDATE, and the exclusivity lives in `plain`. Mandating a
// list hands out general license to use lists, and it leaks into the body.
// Stating the limit HERE, as "the report's only bulleted or numbered list", cost
// the tail itself: a prohibition sitting beside a requirement reads as
// list-aversion, and the tail vanished from 3 of 4 runs. So `plain` carves the
// single permitted list IN, positively, where the list rule already lives, and
// this value only REQUIRES the tail. Measured on the split: body bullet ratio
// 0.11 with the tail present in 4 of 5 runs.
export const handoff: Autonomy = `handoff ≜ Lead with the conclusion, then the evidence that earns it. End on a list of the operator's action items — what they must decide, approve, or do next — and put nothing after that list.`;
