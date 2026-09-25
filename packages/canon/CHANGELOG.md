# @cratylus/canon

## Unreleased

### Minor Changes

- A role is a bundle of expected aspects, and five positions now state their
  contract

  `role` was `arity: 'scalar'` over bare tokens, so the corpus could _name_ a
  position and could not _state_ one. Everything the name should have carried was
  retyped on every holder, and two measurements say what that cost. `kino` and
  `architect` agreed on **19 of 22** dimensions by copying, each copy free to
  drift from the other and nothing in the corpus able to notice. And `mav` and
  `nico` both declared the token `build` while sharing almost nothing else — a
  collision the token could not even make visible, since one of the two agents
  colliding on it never wrote a line of substrate. A word that cannot tell its
  own holders apart is not doing the work of a role.

  The dimension stays; its VALUES changed. Each is now a multi-line contract
  stating the ARROW the position is over the ladder
  `intent ≺ C ≺ spec ≺ artifact` — `architect ≜ reads⟨intent · C⟩ → writes⟨C⟩` —
  with the acts the arrow reserves and the defect it names. Delegation is a
  **theorem** of the arrow rather than a second declaration beside it: an act
  whose domain or codomain falls outside the pair is delegated necessarily,
  including an act nobody anticipated, which no enumerated list can manage. That
  is why no `delegation` axis was minted, and why the arrow was not raised into
  a dimension of its own — a dimension determined 1:1 by another dimension is
  not a dimension, and stating the arrow inside the role's own value is also
  what makes it quotable by a rubric. The absence of `software-engineering` from
  the architect's capabilities used to carry this load alone, and an omission is
  not scoreable: no rubric can quote it and no reader of a projected Target can
  tell a deliberate absence from a forgotten one.

  `packages/canon/src/roles/` holds one cell per position — its sign, its skills
  and a partial dimension vector — and `holds(role, declared)` folds the two at
  AUTHORING time, before `compose`, so the emitted Target is exactly as flat as
  it was when every value was retyped by hand. The precedence rule reads the
  manifest's own `arity` instead of restating it: a set is unioned, role members
  first; a scalar is the holder's when the key is PRESENT and the role's
  otherwise, so present-with-`null` is an explicit suppression rather than an
  omission. `provenance.mark` never folds.

  Exactly one thing is inviolable — the role's own contract — and it is
  inviolable structurally rather than by a marking: `Declared` omits the `role`
  key, so there is no field to override and no rule to enforce. A general
  constitutive/default scheme was considered and rejected. With the contract
  folded into the role's own value no second aspect needed protecting, and a
  mechanism with no live subject is structure carrying no load. Every other
  aspect a role supplies is a default: a scalar the holder overrides, a set the
  holder extends.

  **Two agents were re-seated.** `nico` now holds `architect`: it is the
  architect of the corpus exactly as `kino` is of the film floor, and the
  domain's one peculiarity is what makes `output-format: code` sit beside that
  contract without contradicting it — here a canon cell IS a concept written
  down, so authoring `dimensions/<d>/<v>.ts` is writing C while the engine that
  projects it is handed out. `mav` holds `build`, the only contract in the corpus
  bounded from ABOVE rather than below: it writes spec and artifact, escalates
  anything whose codomain is C, and its characteristic defect is named `ascent`
  as the architect's is `descent`. An agent that quietly amends the design to fit
  what it built has manufactured its own evidence. `mav` declares nothing but its
  identity now, which is the honest reading — `mav` IS the build role.

  **`assay` is the arrow no role expressed**, and it closes a real contradiction
  rather than adding a position. `deliver` is right that
  `validate ⊨ artifact ⟨NEVER r⟩`, and reading artifacts is reading files, which
  the architect contract calls a descent; left there, the skill obliged the
  design-holder to descend on every wave. The split is that the READ is
  delegable and the VERDICT is not. `assay ≜ reads⟨C · artifact⟩ → writes⟨C⟩` is
  the adjoint of `plan` — substrate enters the loop at `plan` and leaves at
  `assay` — and the new `assayer` agent holds it: it holds C and never the
  executor's spec, so there are still two descriptions and two witnesses, and it
  emits unachieved **concepts**, never a verdict and never prose about naming,
  structure or test quality. `deliver` gained `assay`, `assayer`, `achieved`,
  `unachieved` and the redispatch law. `validate ⊨ artifact ⟨NEVER r⟩` and
  `validate ⊨ self` are byte-identical to what they were, because they are the
  laws this change protects.

  **Nine role tokens are deleted** — `converse`, `curate`, `diagnose`,
  `document`, `operate`, `orchestrate`, `research`, `review` and `test`. Every
  one was composed by no agent. With no bundle to hold them they had drifted into
  different registers, which is the same anemia read from the catalog side:
  `curate ≜ ⟨canonical-corpus⟩` sat unheld while the actual curator declared
  `build`.

  **Two capabilities left the architect role**, because the written contract
  convicted them. `planning-decomposition` was glossed as the decomposition that
  hands work out while the contract says `⟨C → spec⟩ ↦ plan`, and an agent
  holding a capability exercises it.
  `review-critique ≜ ⟨adversarial threat-modeling severity-triage⟩` is a
  substrate act under a name that sounded conceptual; the critique this rung
  performs is `judge`, which the contract reserves by name. One edit on the role
  corrected both `architect` and `kino`, which is the mechanical proof that the
  fold works.

  **The cost, stated plainly: projected order changed.** The set fold emits role
  members before the holder's own, so `kino`'s capabilities now read
  system-design and research-investigation before its two film capabilities
  rather than after them, and `nico`'s capabilities, engineering principles and
  guardrails are likewise reordered against what it declared by hand. Nothing was
  dropped by the reordering — `nico` gains `separation-of-concerns` and the
  `design`/`deliver` apparatus from the position — but the Targets are not
  byte-identical to their predecessors, and order is visible to a reader.

## 0.3.0

### Minor Changes

- a6dc4ec: The stance guardrail is enrolled by placement, and it says when it did not run.

  **Breaking.** Three ways of deciding who gets judged are gone. The per-repo
  opt-in `agentfactory.stanceGuard` is deleted, with `stance-guard:on`, `:off` and
  `:status` — it asked whether a guard may run in a _directory_, and a stance
  belongs to the agent, not the checkout. The agent allowlist and its
  `STANCE_GUARD_AGENTS` override are deleted — a runtime self-filter over an
  enrollment the corpus already derives, which had drifted so far that `architect`
  and `kino` held principal authority and were never once judged. Enrollment is
  now the presence of `<scope>/stance/manifest.json`, which the projection places
  in each persona's own scope. The off switch is launching the harness without a
  persona.

  **Breaking.** `praxis-continuity` and `targets/continuity/` are retired with the
  praxis plan mirror they nudged about, along with the `continuity:install`,
  `continuity:uninstall` and `continuity:status` scripts. The plan-set mechanism
  survives its cell: `tooling/praxis/praxis.sh` is now
  `tooling/plan-set/plan-set.sh`, reached as `pnpm plan`.

  A turn the judge could not answer now leaves a `DARK` row in the per-session
  verdict log rather than nothing at all, so an unjudged turn and an absent
  session stop reading identically off disk.

  The evidence check no longer discards the collapse it exists to catch. It
  compared a quoted span to the turn with `grep -qF` and no `--`, so evidence
  opening with a markdown bullet was parsed as an option — and a tail-enumeration
  collapse _is_ a bullet list. Both sides are now flattened identically and
  compared with `--`, authenticating the judge's words rather than its list
  syntax.

## 0.2.0

### Minor Changes

- b0bc847: An agent declares the skills it operates through

  `autoloadSkills` was a reader with nothing to read. OMP honours the field natively for a spawned
  subagent, and the generic `omp-agent` launcher already rendered it as required reading for a main
  session — the consuming half existed on **both** paths. The producing half did not, because the
  corpus had nowhere to declare it. The branch was live code with zero live inputs: every deployed
  definition carried exactly `name` and `description`.

  `Agent.skills` is an optional list of skill NAMES, modelled on the existing optional `preamble`.

  It is deliberately **not a dimension**, for two independent reasons. Structurally, a dimension's
  value is a branded σ\* fragment `agentBody` emits into the Target, while a skill name is an
  address a host resolves — declaring it as a dimension would mint one empty fragment per skill.
  Conceptually, a dimension is a persona trait, and which skills an agent loads is apparatus; the
  catalog would misrepresent it and hand every agent one more required `null` to spell.

  The omp adapter emits it as a third front-matter key, each name through the same `yamlString` the
  description uses. Absent or empty emits nothing, leaving the two-key document unchanged. The
  claude and codex adapters are untouched: neither harness has a field that loads a skill from an
  agent definition, and emitting a key a harness ignores is noise.

  This closes the gap that made every skill binding advisory. A main-session persona now carries
  its required skills in the system prompt on every turn rather than waiting for a description to
  match, and a spawned subagent gets them injected before its first prompt.

- b0bc847: design, plan and deliver supersede praxis, and three agent rungs carry them

  `praxis` carried three activities with three different ends — capturing understanding,
  specifying work, and governing execution — with no seam between them. An agent asked to switch
  telos three times with nothing marking the switch settles into whichever posture its last tool
  call left it in, which in a tool-driven session is always the making.

  The deeper defect was verification. Acceptance keyed to a unit's own criteria is a **closed
  loop**: the author writes the unit, writes its criteria, and checks the return against them, so
  every term comes from one source. An executor satisfying the letter passes while the design goes
  unmet, and no instruction to "actually verify" repairs it — verification is a two-description
  operation and there was only ever one description.

  - **`design`** is the durative concept lattice, amended only by append-only supersession and cut
    into closed pieces. It is the second witness, and the one artifact that outlives every plan.
    praxis measured its own absence: sixteen retired plans, twenty-five laws established, zero
    surviving into any corpus.
  - **`plan`** decomposes ONE piece into units that each cite the concept they realize. Totality is
    a refusal, not a warning. Units are sliced on the design's seams rather than on file adjacency,
    because files are a lagging proxy for modularity — a file-cut yields units each touching a
    fragment of several concepts, which is exactly the state in which an executor finishes
    correctly and the system stays incoherent.
  - **`deliver`** dispatches, then validates the landed artifact against the design — never the
    report against the plan. `verify` is the executor's proof that it built to spec; `validate` is
    the principal's proof that it is what the design called for. Neither substitutes. It also
    carries the conduct: one plan bound at a time, finish before starting, repair what blocks the
    path and merely file what sits beside it.

  The laws that were paid for survive verbatim, including the output-array law and its measurement
  (six under-declared arrays in one plan, one cause: a footprint read off where a sign is DEFINED
  while the work is bounded by where it is USED).

  `architect`, `planner` and `implementer` are one ladder differing first in decision authority —
  principal at the top, withheld below — and sharing `mission-command`, whose escalation clause is
  the single law every rung obeys: surface the fork, do not resolve it. `architect` omits
  `software-engineering`, which is the delegation boundary made structural: the rung cannot
  conceive of itself as the builder.

  `kino` is the ai-film specialization of the architect rung, and needed two minted capabilities:
  `film-production` (identity and continuity are different problems needing different instruments;
  an art-bible entry is approved once and applied everywhere) and `generative-video` (reference
  conditioning is stateless, so whatever carries identity across a production is the ledger and
  never the model).

### Patch Changes

- f1c41e1: A handoff ends every turn, and an undefined `output-format` was fighting `plain`

  An operator reported that replies were still verbose and gave no clear indication of what was
  theirs to do — after `plain` had shipped. Measured cold, the deployed persona complies:
  5 runs on the deployed prompt scored a body bullet ratio of 0.0, no headings, and a
  well-formed action-item tail in 5 of 5. Two defects explain the gap between that and a live
  session, and neither is the register.

  **`check-in` scoped away most of its own extension.** Cold decode, asked whether a rule
  labelled `check-in` governs every message a worker sends: _"It applies only to some — the
  messages that actually are check-ins; it doesn't reach ordinary questions, replies,
  reports."_ The value's referent is EVERY operator-facing reply, and the rubric that enforces
  it had already written the scoping into law (`L1 · these govern operator-facing check-ins
only`). `handoff` decodes to the act this is — _"transfer of responsibility … at the boundary
  — when one person's or agent's part ends and another's begins … must contain current state,
  what was done, what remains, and who now owns the work"_ — and every agent turn IS that
  boundary, with the tail already in the sign's priors. The definiens is unchanged; only the
  sign moved. `L1` now says every turn that ends back at the operator is a handoff.

  **`output-format: structured-decision` was a layout, not a kind, and it had no definiens.**
  Its repertoire names artifact KINDS — code · document · natural-language · structured-data ·
  visualization · action. Cold decode of a prompt whose entire Output-Format section is that
  token: _"a bare label, not a spec … it fixes no headings, no field names, no ordering, no
  format … the best I can infer is: don't answer in freeform prose; separate the decision from
  its supporting reasoning in some labeled way."_ That is `plain` negated, emitted by the one
  section with nothing to hold it. `549d5d48` adopted it to give the rationale "a slot with a
  size"; the cell has neither. The bound on rationale volume is `plain`'s own "no more length
  than the decision carries", and the reply's shape is `handoff`'s — so mav's `output-format`
  is null and the cell is deleted.

  The carry-on skill's `check-in` is untouched: there it means the operator-interrupt act, which
  is a different concept and keeps the name.

- e2b2263: A harness-invariant hook asset deploys once, to the vendor-neutral `.agents` root

  The stance rubric is one 27 kB file every projection scores against, byte-for-byte identical
  across claude, codex and omp — and it was being copied into `<harness>/hooks/stance-guardrail/`
  three times. The duplication was the smaller half of the cost. The larger half is that the text
  had **no address any other realization could name**: an advisor roster entry wanting the same
  rubric would have had to `@`-import it out of a sibling harness's tree, which is exactly the
  cross-harness reach `harness-independence` forbids. A shared asset has one address, and the
  neutral root is the one place every harness may read without reaching into another.

  `HookWorker.shared` declares it, `SHARED_STAGE_DIR` stages it, and deploy places it at
  `../.agents/<id>/` — the same relative-escape shape the scoped mechanism modules already use,
  so the manifest keeps it attributable and prune retires it with its hook. The workers resolve
  it by DERIVATION (`.agents` is the sibling of every harness home, three `dirname`s up), never
  by a baked `$HOME`, so a sandboxed `--home` deploy resolves correctly — the same discipline
  that repaired the `$HOME/.claude` leak, applied before it could become one.

  **The criterion is `byte-identical ∧ ¬executable`, and the gate is what corrected it.** The
  first cut said byte-identical alone, and it immediately caught two assets that must NOT move:
  the worker scripts are byte-identical too, and are positionally coupled to the harness in two
  ways their bytes cannot show — each harness's registration addresses its own copy by path, and
  each worker resolves `stance-judge.sh` as a sibling. That judge is genuinely harness-specific
  (it names the harness's own CLI through `{{fact:harness-judge-bin}}`), so a single shared
  worker could not know whose judge to run without the registration passing it in. That trade
  relocates harness-specificity into a shared file's arguments and buys only the deduplication of
  two scripts that belong beside the registration invoking them. An entry point a harness invokes
  is executable; a rubric is not.

  The gate holds both directions and is non-vacuous in both arms: the corpus must contain a shared
  data asset and a harness-specific one, or the rule is green over nothing.

  Verified on a sandboxed two-harness deploy — one rubric on disk, claude and omp both resolving
  `<home>/.agents/stance-guardrail/stance-judge-prompt.md`, including from the pre-guard — and
  live on omp, where the guard blocked twice reading the shared rubric with a tripwire `claude`
  first on `PATH` never invoked.

- 94b3a7b: `stance-guardrail-pre` resolves its judge from its own hooks root, not from `~/.claude`

  The pre-guard named `$HOME/.claude/hooks/stance-guardrail` outright for its judge, its rubric
  and its miss log. The copy deployed under `~/.omp/hooks/` therefore reached across into the
  CLAUDE tree at fire time, and on a host with no claude deployment found nothing, failed open,
  and appended its misses to a directory that does not exist — a cell whose whole claim is
  harness-neutrality, coupled to one vendor's home by four literals.

  Every hooks root holds both hook dirs as siblings, so `../stance-guardrail` is true at every
  site this file can land. The sibling Stop worker already derives its own directory this way;
  this is the same derivation, one level up. The `STANCE_GUARD_DIR` / `STANCE_RUBRIC` /
  `STANCE_JUDGE_CMD` / `STANCE_GUARD_LOG` overrides are unchanged and still win.

  Traced on the omp-deployed copy after redeploy: `HOOKS_ROOT=/home/lex/.omp/hooks`,
  `JUDGE_CMD=sh /home/lex/.omp/hooks/stance-guardrail/stance-judge.sh`, where it previously
  resolved `/home/lex/.claude/hooks/stance-guardrail/stance-judge.sh`.

- fc9b334: The stance guard is told which loop-position is in force, derived from the transcript

  `carry-on` declares `loop-position ∈ {on-the-loop, out-of-the-loop}` as **live session state**, and
  nothing anywhere wrote it down. Every turn was therefore judged as though the session had just opened:
  a check-in is CORRECT at rest ("a session opens in orientation · intent is the operator's to set") and
  a COLLAPSE under an elevation the operator already granted, and the judge could not tell those apart
  because it was never told which one it was in.

  **The defect was total blindness, and it had a second cause that made it airtight.** The operator slot
  takes `| last` and filters out skill bodies — a filter added for a real reason, because 2.8 kB of a
  skill definition once reached the judge as "the operator's most recent instruction". A `/carry-on`
  invocation arrives wrapped in `<command-name>`, which is exactly what that filter drops. **The one
  utterance that establishes an elevation was the one utterance guaranteed never to reach the judge.**

  **Derived, not stored.** The transcript IS the record: the operator's own utterance is what established
  the elevation, it is already on disk, it is session-scoped by construction, and it cannot desync from
  what was actually said. A store would have needed a session id this worker is not always given, a write
  path, and a lifecycle — all to hold a fold over messages already present. The scan runs BEFORE the
  operator-slot filter and takes only the utterance (a `<command-message>`'s contents, never the body), so
  the grant crosses and the skill definition still does not.

  The payload now opens with a `=== STANDING DIRECTIVE ===` block naming the position, the verbatim grant,
  and how many operator turns have passed since. The rubric reads it first, and the semantics are the
  cell's: an elevation **RAISES** the bar rather than lowering it — the operator has said they are out of
  the loop, so a check-in or handed-back in-remit decision is a plainer collapse than usual — and it
  excuses exactly one thing, surfacing a fork the principal cannot resolve, which the elevation itself
  reserves. At rest, surfacing options where no mandate exists is correct and must not be blocked.

  **Measured honestly: this changes the judge's GROUNDS, not its verdicts.** Across three fixture pairs
  against the live rubric and a local model, the elevated run cites the directive ("despite the operator's
  'carry on' directive") and the resting run does not, but both reach the same decision — the structural
  turn-close rules catch those turns in either position. The gate therefore pins the PAYLOAD, which is the
  thing that was broken and that this corpus controls; pinning a flip would pin one judge sample.

- 415a112: omp judges in-process; no harness depends on another harness's CLI

  `claude -p` was never an acceptable judge for omp, and it was not acceptable for codex
  either. The backend hardcoded `judge_bin="${STANCE_JUDGE_BIN:-claude}"`, so every harness's
  stance guard required a third vendor's CLI installed, on PATH, and separately
  authenticated. When that OAuth lapsed on the author's host, every verdict on every harness
  failed open in silence — deployed, opted in, correctly scoped, judging nothing.

  **The judge seam is now explicit, and the procedure still has one home.** A host that holds a
  model runs the worker twice around a judgment it makes itself: once with `STANCE_EMIT_PAYLOAD`
  to collect the gated, layer-1-annotated payload and the rubric that scores it, then again with
  `STANCE_VERDICT_FILE` naming its answer. Everything either pass touches before the seam is
  read-only, so the counters, the hash and the verdict log see exactly one pass. The gating,
  extraction, deterministic pre-filter, evidence verification and block accounting stay in the
  worker; only the model call moves.

  **omp's shim takes that seam.** The emitted extension module resolves `modelRoles.advisor`
  (then `smol`, then `tiny`, then the live session model) through `ctx.modelRegistry`, gets auth
  from omp's own registry, and calls `completeSimple` — static-imported from `@oh-my-pi/pi-ai`,
  which omp's loader aliases to its own bundled build. Measured against `omp` v18.1.19: the real
  26.8 kB rubric judged in 1991 ms on a local model, and a live `mav` session blocked, re-opened
  the turn, and settled with a tripwire `claude` first on `PATH` never once invoked.

  The richer `judgment` module (`TextJudge`, `chatTextBackend`, `NoulQuestion`) exists in omp's
  source but is **not** in the bundled compat entrypoint the shipped binary carries; importing it
  silently kills the module load. `completeSimple` is what the binary exposes and what a judge
  needs.

  **The judge binary is now a projection fact, not a literal.** `harness-judge-bin` joins the
  closed `ProjectionFact` set; each adapter answers with its own name — claude `claude`, codex
  `codex`, omp the **empty string**, because it judges in-process and names no subprocess at all.
  An empty value is a real answer and the backend reads it as one, failing open rather than
  falling back to somebody else's CLI.

  **A gate holds the law.** `canon/harness-independence.test.ts` fails if any committed worker
  names another harness's home in executable shell, or if a cell template names a vendor CLI
  where a projection fact belongs. Both legs were convicted before admission: a
  `$HOME/.claude/...` line injected into a committed worker and a `:-claude}` default restored to
  the cell each produced exactly one finding, and removing them returned the gate to green.
  Comments are exempt — a rule that forbids naming `claude` in a sentence would delete the record
  of the repair along with the bug.

- Updated dependencies [b0bc847]
- Updated dependencies [e2b2263]
- Updated dependencies [415a112]
  - @cratylus/schema@0.2.0

## 0.1.3

### Patch Changes

- 985aa89: A check-in ends on the operator's action items, and `emission-definiens` covers
  both values that govern a reply

  The operator asked for two things: a tighter `formality` prose, and a closing tail
  listing THEIR action items. Those are two dimensions, not one.

  **`plain` keeps the register; `check-in` owns the tail.** What a reply must CONTAIN at
  the end is report structure, so it belongs to `autonomy/check-in` — whose σ\*
  predecessor, `⟨conclusion-first · owed ↦ recommendation-bearing-tail⟩`,
  under-specified exactly here. A recommendation is something the agent holds; what the
  operator needs is the list of decisions and acts that are theirs.

  **ρ GENERALIZES FROM ONE DIMENSION TO A SET OF VALUES.** `check-in`'s referent is a
  reply the operator reads, so the same ruling applies and it becomes prose. The class
  is renamed `formality-definiens` → `emission-definiens`, and membership is now per
  VALUE rather than per dimension: every `formality` member governs the reply, but
  `autonomy` is a set dimension whose siblings — `decision-authority`,
  `mission-command`, `human-on-the-loop` — govern what the agent DOES and stay σ\*. ρ is
  a fact about an artifact, and the artifact is a value.

  **TWO PHRASINGS WERE MEASURED AND REJECTED.** Trimming `plain` for concision dropped
  `never standing alone` and body fragmentation rose sharply — the prohibitions are the
  binding clauses, and the positive halves alone read as a preference. Then, because a
  mandated list hands out general license to use lists, stating the limit inside
  `check-in` as "the report's only bulleted or numbered list" cost the tail itself: a
  prohibition beside a requirement reads as list-aversion and the tail vanished from 3
  of 4 runs. The shipped split carves the single permitted list IN, positively, from
  `plain`, and leaves `check-in` to require the tail.

  **THE FIRST INSTRUMENT WAS WRONG, and the cells now say so.** It scored every
  markdown line matching a list OR HEADING marker, so a reply of long prose paragraphs
  under two section headings scored as fragmented. Direction held under both
  instruments and the effect was large, so the ρ ruling stands, but magnitudes recorded
  earlier are not comparable. Current instrument — body bullet/numbered lines only,
  with the mandated action-item tail excluded — measures 0.11 over five runs, three of
  them zero, tail present in 4 of 5.

  `targets/guardrail/stance-judge-prompt.md` moves because it quotes the `check-in`
  value verbatim; regenerated by `project:targets`, not hand-edited.

## 0.1.2

### Patch Changes

- 805d19b: ρ(`formality-definiens`) = human — a value that governs the operator's prose is written in it

  An operator reported that both agents' check-ins "obfuscate important information within
  high cog, high verbosity, fragmented prose." The cause was `formality: formal ⟨terse ·
dense · symbol-bearing⟩`, carried by mav since 2026-06-24 and by nico since. `expansive`
  was not the repair: it negates the glyphs and pays for it with `unhurried`, licensing the
  volume the register was meant to cut.

  **COMPREHENSION WAS NEVER THE GAP.** The first attempt minted `plain ⟨prose · economical ·
¬symbol-bearing⟩` and it barely moved: measured on `omp/18.1.17` / `claude-opus-5:high`,
  one probe, n=3, scoring the share of reply lines that are bullets, headings, or numbered
  items, the baseline was 0.69 and the new value scored 0.73. Loading the residue with the
  full clause set reached 0.45 at best and 0.81 at worst. Asked to quote its own `formality`
  value, the same session returned it byte-for-byte with every glyph intact — so the value
  was parsed, stored, recitable, and disobeyed. A declaration whose own surface contradicts
  its content does not bind emission, however well the model reads it.

  Relocation was tested too, and it is not the driver: the whole declaration loaded through
  omp's personality slot instead of `--append-system-prompt` scored 0.71 against 0.69 for
  the append carrier, inside the noise band.

  **THE RULING.** ρ binds on `readers(a)`. Every other dimension's definiens is read by the
  model about the model, but a `formality` value's referent IS the text the operator reads,
  so the register it must be written in is the register it describes. `llm-native` already
  said so — `register-resolution ∉ signifier-derivation`: register resolves from the reader
  of what a value GOVERNS, never inherited from the notation its siblings are signified in.
  `formality-definiens` is therefore split out of `dimension-definiens` as ρ=human, and the
  whole five-member repertoire — `casual`, `neutral`, `plain`, `formal`, `expansive` — is
  rewritten as prose. Shipped configuration measures 0.22 (n=4, range 0.17–0.27), with zero
  notation glyphs in the reply.

  **BOTH GATES NOW READ ρ INSTEAD OF ASSUMING IT.** AC-RESIDUE's governing invariant already
  reads "every deployed artifact THE MODEL READS is formal σ*, never human prose — under ρ",
  so it consults `RHO` rather than treating every dimension value as a σ* payload; the
  density gate's unclaimed-class assertion narrows to ρ=LLM, the exemption its own header
  already grants `readme` and `human-doc`. One table, two gates, no drift.

  **AND THE RULING BITES.** `conform` exempts ρ=human, so the declaration alone would have
  let a value regress to σ* silently. The new leg gates formality by AC-RESIDUE's own
  predicate INVERTED — every ρ=human dimension value must be inadmissible as σ*, proving it
  is prose. `registerOf` is the wrong instrument and was tried first: it witnesses the
  tutorial-gloss register (hedges, second person, first-person walkthrough), which is a
  defect signal rather than evidence of prose, and clean prose carries none of those markers.
  Verified non-vacuous by reverting `formal` to its σ\* form and watching the leg convict it.

  mav also regains `llm-native`, dropped in `f7cf5d58`. Its `¬human-prose` clause is guarded
  by `reader = LLM ⟨¬inferred⟩` and so never reaches an operator reply; excluding the
  principle on that basis read the clause outside its own guard.

- 805d19b: omp launcher resolves its own path through symlinks

  `omp-launch` computed `dirname "$0"` and passed `--config <that dir>/omp.yml`.
  Linked into a `PATH` dir - the one way an operator runs a persona by name - `$0`
  is the link, and omp refused to start: `Config overlay not found:
~/.local/bin/omp.yml`. The script now walks `readlink` to the real file before
  resolving its directory, with hops capped so a link cycle fails instead of
  hanging.

## 0.1.1

### Patch Changes

- ae56e1e: `introspect` enumerates its subject instead of recalling it, and may not infer absence

  Two defects found by running the skill on a host with no corpus on disk, where recall
  has nothing to fall back on.

  **It dropped 2 of 20 dimensions and reported a denominator it never counted.** The run
  enumerated 18, silently omitting `Prime Principle` — the first section, and `cratylism`
  itself — and `Learning`, then concluded "2 of 18 dimensions diverge". The cell invited
  it: `O` was written as an illustrative membership list closing in an ellipsis, which
  reads as the definition rather than as an example. `O` is now
  `enumerate(## sections @ A's live Target) ⟨READ · ¬ recalled⟩`, the cardinality `|O|` is
  a declared term carried into `report`, and `|{row(o)}| ≠ |O| ⇒ ⊥`. A self-audit that
  miscounts its own subject reports a clean bill over an unread remainder.

  **It reported a capability as overridden when it had merely not been invoked.** `memory`
  came back `harness-override` — "no persistent memory across sessions" — while the store
  sat readable on that host and had been round-tripped through it the same day. The cell
  now states `rt(o) ⊨ EXERCISED ⟨¬ inferred-from-absence⟩` and
  `¬ exercised(o) ⇒ why(o) = unobservable ∧ why(o) ≠ harness-override`. `unobservable` was
  already in the taxonomy for exactly this; nothing routed to it.

## 0.1.0

### Minor Changes

- 26f6fef: The corpus is published, because a projector with no installable corpus is not installable software.

  `@cratylus/canon` was `ignore`d in the changesets config and sat at `0.0.0` while its five siblings
  reached `0.1.1`. The consequence was not cosmetic: `@cratylus/forge` ships the `cratylus` bin but
  deliberately does not depend on a corpus — it receives one as data through `cratylus.config.ts` — so
  with canon unpublished there was **no way for anyone to install a working cratylus at all**.

  It also decides a design question in the open. A globally installed corpus does not resolve from a
  config outside any `node_modules` (`ERR_MODULE_NOT_FOUND`, measured), and ESLint's answer to that —
  "plugins and shareable configs must still be installed locally" — defeats the model this project is
  built on, where an agent is a being that exists out-of-band from any one repository. So the corpus
  becomes a dependency of the CLI: always resolvable, wherever the CLI is installed.

  **Depending on the corpus is not assuming it.** The dependency makes canon resolvable; the config
  still names it. `init` writes `extends: [canon]`, a replacement corpus is installed and named the
  same way, and the projector continues to hold no opinion of its own about what an agent is.

### Patch Changes

- Updated dependencies [3e9c103]
  - @cratylus/schema@0.1.2
