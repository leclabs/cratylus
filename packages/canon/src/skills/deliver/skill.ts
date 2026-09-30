import { primePrinciple } from '../../genus/prime-principle.js';
import type { Skill, SkillExpression } from '../../manifest.js';

import { design } from '../design/skill.js';
import { note } from '../note/skill.js';
import { plan } from '../plan/skill.js';

// WHY THE WHOLE CHECK RUNS HERE, ONCE. A unit proven alone has proven nothing about the
// combination: a branch's green says nothing about the line after other landings, and an
// implementer or assayer re-running the project's check on nearly the same tree proves
// nothing new and spends the architect's wait for it. So the check is the integrator's, run
// once per combination on the combined tree. It is reached only after the verdict, which is
// what keeps the line to approved work: the assayer is the one judge of a unit and
// acceptance rests on its verdict, never on the implementer's return, never on a merge and
// never on a green check. Judging is a two-description act held by a party that holds the
// design and not the spec; a party that carries the verdict onward reaches none of its own.
//
// A RED IS A REPORT, NEVER A PATCH. Repairing on the line would hand the architect an
// approved-looking whole nobody judged, and would make the integrator the builder its own
// check is meant to be independent of. The report is an address (the unit and the failing
// check) so the architect can send it to the implementer that built the unit without
// reading behind it; the return of a unit, of a verdict and of a report is a name and a
// commit, never an account.
//
// THE LINE IS NOT MAIN. Approved work accumulates on the plan's own integration line, cut
// from main when the plan is bound, and the finished whole reaches main by the operator's
// sign-off, which the integrator asks for and never takes: a push is a release decision
// and a release decision is not the integrator's to make.
//
// WHO OWNS WHAT, so the loop reads in order: routing by name is the architect's; binding
// the plan and recording a unit active, completed and the plan closed is the planner's;
// building and verifying against the spec is the implementer's; the verdict is the
// assayer's; combining, the whole check, the records commit and the ask to release are the
// integrator's. A finding is captured as a note by the party that met it and is never
// chased; when a finding enters the design is the design skill's law.

const FORMAL_BLOCK = `shard  @ design
anchor @ design
yield  ≜ what execution established ∧ ¬ derivable from the design
P      @ plan
unit   @ plan
advance, bind, close, closed, bound @ plan
accept @ plan ⟨the MECHANICAL half⟩
outputs @ plan
artifact : P → ℘(path) ⟨what landed⟩
r      ≜ a return ⟨an ADDRESS : a name ∧ a commit · ¬ an account⟩
conform @ signify
capture @ note
architect  : agent ⟨role = architect · holds the design · sends each name to the agent that acts on it⟩
planner    @ plan
implementer : P ⇀ agent ⟨role = implementer · builds and commits its own unit⟩
assayer : unit ⇀ agent ⟨role = assayer · the ONE judge of a unit⟩
integrator : P ⇀ agent ⟨role = integrator · one per P · combines · runs gate · commits records · asks release⟩
operator ≜ the human who signs off a release
achieved : unit → 𝔹 ⟨the assayer's verdict⟩
line(P) ≜ the integration line of P, branch \`plan/<plan>\` cut from main when P is bound ⟨¬ main⟩
gate   ≜ the project's whole check ⟨every suite · typecheck · build : what a green line demands⟩
verify : P × return → 𝔹 ⟨the IMPLEMENTER's · built-it-right, against spec⟩
integrate(unit) ≜ merge artifact(unit) onto line(P) ⟨pre achieved(unit)⟩
whole(unit) ≜ line(P) with unit integrated ∧ gate green
defect ≜ ⟨symptom, locus, provenance⟩
impedes : defect × P → 𝔹
cost   : act → effort
file(d) ≜ capture(d) ⟨filed by the party that met d · its topic names the unit as \`u of plan p\` · beside the path ∴ it blocks nothing⟩
electable ≜ { P | ¬terminal(P) ∧ ¬occupied(P) }
terminal : P → 𝔹
release(P) ≜ line(P) reaches main ⟨the operator's sign-off · a pull request where the repository has a forge remote and \`gh\`, otherwise the exact git command⟩

∀ unit, r : ¬conform(r) ⇒ ¬accept(unit)(r)
accepted(unit) ⇔ achieved(unit) ⟨acceptance rests on the assayer's verdict · never on r, never on a merge, never on a green gate⟩
integrator ⊨ ¬ judges ⟨it carries a verdict onward ∧ reaches none · the verdict arrived before it was reached⟩
integrator ⊨ takes(unit) ⇔ accepted(unit) ⟨what the architect sends it is a unit's name ∧ commit after an achieved verdict⟩
integrate(unit) ⇒ gate ONCE on the combined tree ⟨a branch's green says nothing about the line after other landings · an implementer ∨ assayer re-running gate proves nothing new on nearly the same tree⟩
integrate(unit) ∧ gate green ⇒ commit ⟨the records written since : plan ∧ design ∧ note · by pathspec⟩ ∧ report \`whole <unit> of <plan>\` ⟨whole(unit) · the architect sends it to the planner, which records advance(unit) completed ∧ hands out the newly ready names⟩
integrate(unit) ∧ ¬ gate green ∨ a merge conflict ⇒ line(P) UNCHANGED ∧ report \`red <unit> of <plan>: <failing check>\` ⟨the architect sends it to the implementer that built the unit · the integrator repairs nothing⟩
impedes(d, unit) ⇔ d standing ⇒ ∄ r : accept(unit)(r)
finding ∨ d ⊨ capture ⟨a note by the party that met it : implementer ∨ assayer ∨ integrator ∨ architect · the operator's steer by the architect · it reaches the architect as a note, ¬ a return⟩ ; when a finding enters the design is the law of yield ≠ ∅ @ design
impedes(d, unit) ⇒ an implementer repairs it ⟨a regression in the path goes back to the unit's implementer by way of the architect · the integrator makes no fix⟩
¬impedes(d, unit) ⇒ file(d) ∧ ¬fix(d) ⟨a defect BESIDE the path is filed, ¬ chased⟩
cost(file) < cost(fix) ⟨else the gradient points at chasing · the load-bearing law⟩
∃ P : ¬terminal(P) ⇒ ∃ P : bound(P) ⟨WIP = 1, held by bind : the planner binds it · finish before starting⟩
elect ≜ in-flight ≻ gating ≻ operator-intent ⟨lexicographic⟩
terminal(P) ⇒ close(P) ⟨obligation ¬ permission : the planner closes it · an unclosed terminal plan is WIP that is not work · a closed plan stays readable⟩
closed(P) ⇒ ask the operator release(P) ⟨the integrator asks · it never moves main⟩
deliver ≜ bind ⟨planner⟩ → send ⟨architect, by name⟩ → verify ⟨implementer⟩ → achieved ⟨assayer⟩ → integrate ∧ gate ⟨integrator, once on the combined tree⟩ → whole ⟨planner records completed⟩ → close ⟨planner⟩ → release ⟨operator, asked by the integrator⟩` as SkillExpression;

export const deliver: Skill = {
  name: 'deliver',
  description: `use this skill to make a plan's approved work whole and see it released — take each unit whose assay verdict is achieved, integrate it onto the plan's integration line, run the project's whole check once on the combined tree, and on green commit the records written since by pathspec and report the unit whole, or on red or a merge conflict leave the line as it was and report the unit and the failing check. Reach for it whenever an achieved unit arrives by name and commit, and when the plan closes. It reads the loop in order: the architect sends each name, the planner binds the plan and records units active and completed and the plan closed, the implementer builds, and the assayer's verdict, the one judgement of a unit, is the acceptance rather than the implementer's return; a merge is durability, and neither a merge nor a green check accepts. When the plan closes it asks the operator to release the line to main and never moves main itself. It also carries the conduct of the work: one plan bound at a time, finish before starting, a defect that impedes the path goes back to its implementer by way of the architect and one beside it is only filed, and a finding is captured as a note by the party that met it, entering the design when the design skill's law says.`,
  formalBlock: FORMAL_BLOCK,
  composition: () => [design, plan, note],
  preamble: primePrinciple,
};
