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
// THE LINE IS NOT MAIN, AND IT HOLDS THE PLAN'S WHOLE WORK. Approved work accumulates on
// the plan's own integration line, cut at the integrator's first dispatch from the commit
// the plan's units are built on (the HEAD of the checkout where the plan was bound) and
// never from bare main: a line cut from main lacks the history the units stand on, and
// that history then conflicts at combination. The finished whole reaches main by the
// operator's sign-off, which the integrator asks for and never takes: a push is a release
// decision and a release decision is not the integrator's to make.
//
// RECORDS REACH THE LINE AT EVERY ACT, NOT ONLY ON GREEN. A record is an immutable file
// named by its ULID, so the union of any two sets of records never conflicts, and the
// integrator adds every record file any worktree of the repository holds, tracked or not,
// or any local branch holds, that the line lacks, and commits them by pathspec. Records
// commit on a red as well as a green, because the notes and plan records written while a
// unit is red are the trace of why it is red; the unit's work stays off the line and the
// records do not. The plan's close is the last act: the last unit's completed record and
// the close record are written after the last green, so only a gather at the close puts
// them on the line, and only after it, with nothing left for lacks to print, does the
// integrator ask the operator to release. A release of a line missing a record is a
// release that loses work no other branch holds.
//
// WHO OWNS WHAT, so the loop reads in order: routing by name is the architect's; binding
// the plan and recording a unit active, completed and the plan closed is the planner's;
// building and verifying against the spec, and writing the landing of each commit that
// holds the unit, is the implementer's; the verdict, written to the unit's history before
// it is returned, is the assayer's; cutting the line, combining, the whole check, the
// unit's whole or broke written before the report, the records commit at every act and
// the ask to release are the integrator's. A finding is captured as a note by the party
// that met it and is never chased; when a finding enters the design is the design
// skill's law.
//
// THE LEDGER IS WHERE A UNIT STANDS. Each party writes its own event to the unit's history
// as it happens, so which commit landed a unit, what the assayer found on it and whether
// it made the whole or broke it are read from `plan show <unit>`; no return, message or
// memory has to carry them, and the returns stay names.

const FORMAL_BLOCK = `shard  @ design
anchor @ design
yield  ≜ what execution established ∧ ¬ derivable from the design
P      @ plan
unit   @ plan
advance, bind, close, closed, bound, land, assay, whole, broke @ plan
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
integrator : P ⇀ agent ⟨role = integrator · one per P · cuts line(P) · combines · runs gate · gathers and commits records at every act · asks release⟩
operator ≜ the human who signs off a release
achieved : unit → 𝔹 ⟨the assayer's verdict⟩
base(P) ≜ the commit the units of P are built on ⟨the HEAD of the checkout where P was bound⟩
line(P) ≜ the integration line of P, branch \`plan/<plan>\` cut at the integrator's first dispatch for P from base(P) ⟨¬ main · \`git worktree add <path> -b plan/<plan> <base>\` · the history the units stand on never conflicts at combination, and the line lacks nothing that branch held when P began · it holds every approved unit AND every design, plan and note record written while P ran, so releasing it loses nothing⟩
lacks(P) ≜ \`{ git for-each-ref --format='%(refname)' refs/heads | while read -r b; do git ls-tree -r --name-only "$b" records/; done; git worktree list --porcelain | sed -n 's/^worktree //p' | while read -r w; do git -C "$w" ls-files -co --exclude-standard records/; done; } | sort -u | comm -23 - <(git ls-tree -r --name-only HEAD records/ | sort)\` ⟨run at the root of the worktree on line(P) · prints each record file that any worktree of the repository, tracked or not, or any local branch holds and line(P) lacks · a record file is \`records/<domain>/<ULID>.json\`, immutable and named by its ULID, so the union of two sets of them never conflicts⟩
gather(P) ≜ \`git for-each-ref --format='%(refname)' refs/heads | while read -r b; do git ls-tree -r --name-only "$b" records/ | sort | comm -23 - <(git ls-tree -r --name-only HEAD records/ | sort) | xargs -r git checkout "$b"; done\` then \`git worktree list --porcelain | sed -n 's/^worktree //p' | while read -r w; do git -C "$w" ls-files -co --exclude-standard records/ | sort | comm -23 - <(git ls-tree -r --name-only HEAD records/ | sort) | while read -r f; do [ "$w/$f" -ef "$f" ] || { mkdir -p "$(dirname "$f")"; cp "$w/$f" "$f"; }; done; done\` then \`git add records/ && { git diff --cached --quiet records/ || git commit -m 'chore(records): <plan> <act>' records/; }\` ⟨run at the root of the worktree on line(P) · adds every record lacks(P) prints, from its branch or its worktree, and commits them by pathspec, records only · <act> is the unit and green or red, or close⟩
gate   ≜ the project's whole check ⟨every suite · typecheck · build : what a green line demands⟩
verify : P × return → 𝔹 ⟨the IMPLEMENTER's · built-it-right, against spec⟩
integrate(unit) ≜ merge artifact(unit) onto line(P) ⟨pre achieved(unit)⟩
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
integrator ⊨ takes(unit) ⇔ accepted(unit) ⟨what the architect sends it is a unit's name ∧ commit after an achieved verdict · the first dispatch for P also names base(P)⟩
first dispatch for bound P ⇒ the integrator cuts line(P) from base(P) ⟨a later dispatch finds line(P) and uses it⟩
integrate(unit) ⇒ gate ONCE on the combined tree ⟨a branch's green says nothing about the line after other landings · an implementer ∨ assayer re-running gate proves nothing new on nearly the same tree⟩
integrate(unit) ∧ gate green ⇒ whole(unit) ∧ gather(P) ∧ report \`whole <unit> of <plan>\` ⟨whole(unit) ≜ line(P) with unit integrated ∧ gate green, recorded by the integrator with the line's commit before the report · the architect sends the report to the planner, which records advance(unit) completed ∧ hands out the newly ready names⟩
integrate(unit) ∧ ¬ gate green ∨ a merge conflict ⇒ the unit's work OFF line(P) ⟨the merge aborted or the line returned to the commit before the combination⟩ ∧ broke(unit) ∧ gather(P) ∧ report \`red <unit> of <plan>: <failing check>\` ⟨broke(unit) records the failing check before the report · the records written while the unit was red are still committed · the architect sends the report to the implementer that built the unit · the integrator repairs nothing⟩
∀ event ∈ { land, assay, whole, broke } of unit : written to its history as it happens, by the party it happens to ⟨land ∈ the implementer, for each commit that holds unit · assay ∈ the assayer, before its verdict is returned · whole ∨ broke ∈ the integrator, before its report · none of them a return⟩
where unit stands ∧ on what it was accepted ⇒ read from show(unit) ⟨its ledger : the commit that landed it, what the assayer found on it, whether it made the whole or broke it · ¬ a message ∧ ¬ an agent's memory⟩
impedes(d, unit) ⇔ d standing ⇒ ∄ r : accept(unit)(r)
finding ∨ d ⊨ capture ⟨a note by the party that met it : implementer ∨ assayer ∨ integrator ∨ architect · the operator's steer by the architect · it reaches the architect as a note, ¬ a return⟩ ; when a finding enters the design is the law of yield ≠ ∅ @ design
impedes(d, unit) ⇒ an implementer repairs it ⟨a regression in the path goes back to the unit's implementer by way of the architect · the integrator makes no fix⟩
¬impedes(d, unit) ⇒ file(d) ∧ ¬fix(d) ⟨a defect BESIDE the path is filed, ¬ chased⟩
cost(file) < cost(fix) ⟨else the gradient points at chasing · the load-bearing law⟩
∃ P : ¬terminal(P) ⇒ ∃ P : bound(P) ⟨WIP = 1, held by bind : the planner binds it · finish before starting⟩
elect ≜ in-flight ≻ gating ≻ operator-intent ⟨lexicographic⟩
terminal(P) ⇒ close(P) ⟨obligation ¬ permission : the planner closes it · an unclosed terminal plan is WIP that is not work · a closed plan stays readable⟩
closed(P) ⇒ the architect routes the close to the integrator ⟨the records written after the last combination, the planner's completed and close records among them, exist only now⟩
the close routed ⇒ gather(P) ∧ lacks(P) prints nothing ⟨no worktree and no local branch holds a record line(P) lacks⟩ ∧ ask the operator release(P) ⟨the ask comes AFTER the gather · the integrator asks · it never moves main⟩
deliver ≜ bind ⟨planner⟩ → send ⟨architect, by name⟩ → verify ⟨implementer, writes land⟩ → achieved ⟨assayer, writes assay⟩ → integrate ∧ gate ⟨integrator, once on the combined tree⟩ → whole ∨ broke ⟨integrator writes it⟩ → gather ⟨integrator, at every act : green or red⟩ → advance ⟨planner records completed⟩ → close ⟨planner⟩ → gather ⟨integrator, at the close⟩ → release ⟨operator, asked by the integrator once lacks(P) prints nothing⟩` as SkillExpression;

export const deliver: Skill = {
  name: 'deliver',
  description: `use this skill to make a plan's approved work whole and see it released — take each unit whose assay verdict is achieved, integrate it onto the plan's integration line, run the project's whole check once on the combined tree, and at every act commit the records the line lacks by pathspec, then record the unit whole with the line's commit and report it on green, or on red or a merge conflict leave the unit's work off the line, record the unit broke with the failing check, and report the unit and the failing check. The line is cut at the first dispatch from the commit the plan's units are built on, never from bare main, and it holds the plan's whole work: every approved unit together with every design, plan and note record written while the plan ran, gathered from every worktree of the repository and every local branch, so releasing it loses nothing. Reach for it whenever an achieved unit arrives by name and commit, and when the plan closes: the records written after the last combination (the planner's completed and close records) are gathered and committed at the close, and only then does it ask the operator to release. It reads the loop in order: the architect sends each name and routes the close, the planner binds the plan and records units active and completed and the plan closed, the implementer builds and records the landing of its commit, and the assayer's verdict, recorded by the assayer, the one judgement of a unit, is the acceptance rather than the implementer's return; each party writes its own event to the unit's history as it happens, so where a unit stands is read from \`plan show\` and never from a message; a merge is durability, and neither a merge nor a green check accepts. It never moves main itself. It also carries the conduct of the work: one plan bound at a time, finish before starting, a defect that impedes the path goes back to its implementer by way of the architect and one beside it is only filed, and a finding is captured as a note by the party that met it, entering the design when the design skill's law says.`,
  formalBlock: FORMAL_BLOCK,
  composition: () => [design, plan, note],
  preamble: primePrinciple,
};
