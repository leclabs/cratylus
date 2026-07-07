# canon-collapse

**Authority.** Operator granted **whole-repository planning scope** (2026-07-06). Planning spans `agent-forge`
(anatomy + adapters + codegen + cli) AND `agent-anatomy` (organs + agents + skills + toolkit). Execution
delegates ENGINE work to Mav; nico owns the plan and the corpus.

**Intent.** Realign the IMPLEMENTATION to the MODEL it already declares. The `Fragment {organ, slug, definiens,
<O,G,C,A>}` object is a _describe-era_ artifact. MODEL says a fragment is an _address_, not a definition:
`body(c) = ⟨α(c), residue(c)⟩ ∧ residue(c) = D(c) ∖ fired(α(c))` (`MODEL.md:40`) — the anchor plus **only**
the leftover the anchor doesn't already fire; `residue = ∅` for a true σ\*. VISION: _address, don't describe._
This is a **green-field rebuild** to that shape.

**Green-field discipline (binding).** Incumbent structure has no standing; design the ideal, delete freely.
**NO** compat coercion, **NO** byte-parity-vs-old-projection proofs, **NO** churn-avoidance to spare incumbents
(the reviewer flagged all three in the prior draft — M2/M3). grey-field would be an explicit declaration; this
initiative is not one.

## Architecture decisions (design of record)

- **D1 · Fragment → branded string.** An organ value is a bare named σ\* expression:
  `export const humanOnTheLoop: Autonomy = '<residue>'`. Per-organ type = a **nominal-branded string**, not a
  `{organ,slug,definiens}` object.
  - `organ` field → DELETED (home = the directory `organs/<organ>/`; PARTITIONED).
  - `slug` field → DELETED (anchor α = the export name / filename; SIGNIFIED).
  - `definiens` → **`residue`** (`D ∖ fired(α)`); expect ∅; a non-empty residue signals an under-chosen anchor.
  - per-value `<O,G,C,A>` phantom + `MetaOf` → DELETED; genus/classification/arity live ONCE per organ in `ANATOMY`.
- **D2 · Agent is the sole representation.** `ResolvedAgent` ELIMINATED repo-wide (reviewer B4): the anatomy
  type, `codegen.ts:255` (stops emitting `${name}Resolved`), the **claude AND codex** adapters
  (`adapters/{claude,codex}/anatomy.ts`), and the toolkit consumers (`project-cli.ts`, `project-cli-codex.ts`).
  Projection (mark→color, description, protocol / `{name}` substitution) lives in the adapters — REGENERABLE.
- **D3 · provenance → `{mark:{emoji,hue}}` on the agent.** provenance carries _data_, not a σ\* residue — it is
  not a value-fragment; it inlines on the agent. The 9 `organs/provenance/*.ts` fragments DELETED, **enumerated
  not globbed** (B5: `diagnostic-delegate-cyan.ts` has no `-archetype-`). Each agent's mark is assigned directly
  from its **deployed SOUL** (`~/.claude/agents/<agent>.md` — ground truth), NOT recovered from a fragment
  (B1/B2: fragments don't map 1:1 to agents; nico/mav/principal-ic have none).
- **D4 · memory on named being-agents only** — nico, mav; the other 9 carry `memory: null`.
- **D5 · autonomy composed** — an ordered set of σ\* members (authority-scope ⊕ loop-mode ⊕ doctrine).
- **D6 · base.ts / genus DELETED** — memory + persona ride their own organs; `{name}` parameterization moves to
  the adapter's projection step.
- **D7 · Refactor SURFACES partitions.** Reducing a definiens to residue exposes MECE violations where one cell
  fused ≥2 concepts; each splits to its own home. Worked example: `human-on-the-loop` (fuses the loop-level +
  the mission-command doctrine) — see the `O` task.
- **D8 · Naming — English handle files it; the strongest σ\* stays in the formal notation.** A cell's
  filename/export is the **English equivalent** (navigable handle); the strongest sign — even if foreign —
  lives in the value's formal notation. The `carry-on` pattern: file `carry-on`, body-anchor `weitermachen`.
  So the mission-command doctrine partitioned out of `human-on-the-loop` files as **`mission-command.ts`**
  (export `missionCommand`), value `'auftragstaktik ⟨…⟩'` (`carry-on.ts` already cites `mission-command`).
- **D9 · Skills + hooks are in scope (MODEL `REFLEXIVE`).** All 5 Kinds satisfy Universal. The same cruft is
  present — HookCell: `kind` restates the type, `id`==`slug`==filename, `definiens` prose; SkillCell:
  `name`/`verb`/`trigger` mutually derivable, prose `description`. **A skill's `formalBlock` is its PRIMARY σ\*
  payload** — the self-sufficient set-builder that IS the skill's address — NOT inert content and NOT "normally
  empty" (verified against the tree: **13/15** skills carry a substantial block, 21–138 lines). Every skill
  surface — `description` AND `formalBlock` AND body — is a **DEPLOYED artifact the model reads as context** ⇒
  it MUST address the model's semantic space in formal σ\*, never human prose; the formalBlock is the FIRST
  subject of the residue discipline, never exempt. Structural fields collapse (E2b); `definiens`/`description` →
  residue (E2a); the whole `formalBlock` → a `formalize` artifact — declarations-above / laws-below, **zero
  explanatory prose** (every semantic-load gloss / `#`-preamble LIFTED into formal notation, never trimmed to
  short prose nor merely deleted) (E2a). **NO executable exception** — a skill that shells out DECLARES its
  executable as a function/operation in the block (a signature line, like `praxis`'s `live : session → 𝔹`
  referencing the `episodic` runtime); the literal command string is body/projection detail. Raw code-as-bytes
  survives ONLY in HookCell `command`/`workers` (a different Kind, not a formalBlock gloss). 15 skills, 2 hooks.
- **D10 · Lint reads the source module, never a markdown projection; no human glossary.** `symbols.test.ts`
  parses `references/formal-symbolic-notation.md` — a lint reading a projection. The operator/symbol lexicon
  consolidates to one ESM module `src/toolkit/operator-lexicon.ts` (E3), read by BOTH the symbols lint and the
  E2a residue gate. The markdown is deleted; a human who needs a glyph's meaning asks an agent to explain the
  artifact (VISION's on-demand dereference channel), not a maintained doc. General rule: **gates read
  source-of-truth modules; human comprehension is on-demand agent explanation, never an accreted glossary.**
- **D11 · Reader binding ρ — one ρ=LLM source; ρ=human is projection/service only.** The collapse spans three
  reader contexts: (a) **agent reads its own SOUL** (ρ=LLM — residue σ\* is native; this IS the collapse);
  (b) **agent↔agent** (ρ=LLM STANDING RULE — dispatch prompts + subagent returns dense/signifier-carries-load,
  ρ=human only for a human-facing deliverable carried within; codified in `organs/actions/delegation.ts` +
  `skills/praxis.ts`, enforced by `reader-reach.test.ts` — the O/S collapse of those cells MUST preserve the
  codification); (c) **human reads** (ρ=human — NEVER an authored source). **Decision (corrected): DEFER the
  human view, don't retire it.** The current `project-human` READMEs are stale (they project the pre-collapse
  definiens), so ARCHIVE them (D12) rather than maintain or delete, and **regenerate the human view for
  reader=human once the source settles** — on-demand agent explanation covers the interim. `project-human` the
  mechanism survives; only its stale output is parked. Law: **one ρ=LLM authored source; every ρ=human artifact
  is a projection or live service, regenerated from the settled source, never a hand-authored second source.**
- **D12 · Markdown-deletion policy — archive, never delete; and the protected root set.** Any `.md` the plan
  would remove is instead **moved to `.scratchpad/{basename}.{ulid}.{ext}`** (`.scratchpad/` is gitignored;
  `{ulid}` freshly minted at archive time) with its **original repo-relative path appended as the last line** of
  the file — so the human content is preserved for regeneration once the source settles. Applies to ALL markdown
  deletions (formal-symbolic-notation.md, the 24 organ READMEs, any genus `.md`); `.ts` deletions stay ordinary
  (git is their recovery net). **PROTECTED — never edit, never move:** `VISION.md` (why the canon exists) ·
  `MODEL.md` (what a canonical primitive is) · `ENGINE.md` (how primitives are discovered/validated/projected) ·
  `CANON.md` (the primitives themselves). These four are the source-of-truth root; the plan reads them, never
  touches them.
- **D13 · persona → a plain-string DESCRIPTION on the agent, not a σ\* fragment (parallel to D3 provenance→{mark}).**
  Persona is a _presented identity_, not a universal pattern — "persona ≠ archetype" (the old cells mislabeled it
  "the X archetype"). It carries no reusable σ\* residue and isn't shared across agents, so it's **not a value
  fragment**: it inlines on the agent as `persona: '<identity description>'`. **`Agent.persona: string`** (E1);
  the `Persona` fragment type + persona's membership in the fragment-organ catalog are removed. The **entire
  persona value-cell catalog is deleted** (the 12 Jungian archetypes + any partial cells `creator`/`explorer`/
  `master-builder`; C1) — archive the persona `README.md` per D12. Persona **subsumes `description`** (the
  agent's one-line description was `persona.definiens`; now persona _is_ that string). Each agent gets an
  appropriate identity description (A-task; the empty `persona: ''` placeholders get filled — nico's is the
  empirical-ontologist description already inlined).

## Starting state — a DELIBERATE partial illustration (read first; do NOT be surprised)

**The working tree is NOT a clean pre-collapse checkout.** The Operator hand-made directionally-correct partial
changes to ILLUSTRATE the target, so the tree is **intentionally, partially broken**. `pnpm typecheck` is **RED,
and that is EXPECTED** — it is not a defect to diagnose, it is scaffold to complete. Read the tree as
_direction_, never as _breakage_. **Do not "fix" the illustration back toward the old shape** — realize the
intent, discard the scaffold, make it green.

**Directional INTENT already in the tree (complete it):** persona → plain string on agents (nico done; others
`persona: ''` placeholders) D13 · provenance → `{mark}` inlined D3 · autonomy → composed set D5 · `base.ts`
gutted (protocols emptied, "delete this file") D6 · roster: `boswell`/`cognizant` deleted, `boz` added → **10
agents** {arch-doc-writer, boz, developer, investigator, mav, nico, planner, principal-engineer-reviewer,
principal-ic, tester} · `simplicity`/`green-field` principle cells added · `docs/*` pruned by the Operator.

**WIP SCAFFOLD to DISCARD (not the target — do not preserve):** `nico.ts`'s `nicoResolved` block + its inline
WIP comments ("garbage", "fluff?", "what goes here now?") — `ResolvedAgent` is being eliminated (D2) · a
`Standing` type import that does not exist (a naming placeholder — the standing is an Autonomy value) · any
leftover partial persona cells (`creator`/`explorer`/`master-builder`) or placeholder values — superseded.

**Re-census at dispatch** — the plan tracks the LIVE tree; verify every count (agents, organs, cells) against
the current tree, never a stale number in this doc.

## Binding acceptance criteria (encoded — the spec-creation gate)

- **AC-RESIDUE** (machine-checked, `E2a`): ∀ σ\* payload — every organ **value string**, every skill
  **`description`**, and every skill **`formalBlock`** (whole) — body = `⟨α, residue⟩` with residue a composable
  σ\* expression or ∅, never prose. Each is a DEPLOYED artifact the model reads ⇒ formal σ\*, **no exemption**;
  only enumerated executable worker-bytes (HookCell `command`/`workers`) are excluded. MODEL's PARSIMONIOUS
  specialized. (Supersedes the prior "AC-FORMAL" — same intent, now MODEL-anchored: residue, not
  "formal-expression-in-general.")
- **AC-PARSIMONY** (machine-checked, `E2b`): no file/type/field restating what structure already holds —
  catches the `organ`/`slug` fields, `ResolvedAgent`, `base.ts`, the phantom metadata.
- **AC-COLLAPSE / AC-MEMORY / AC-VECTOR**: per D2–D6.
- **Global exit gate**: whole-repo `pnpm build/test/lint/typecheck` green on a clean worktree; `E2a` + `E2b` green.

## Slice cut + wave schedule (reviewer-fixed)

Single executor per task (M7). Engine = Mav, corpus = Nico; a gate's _predicate_ is nico-specified in the
task-file, the _wiring_ is Mav's execution — one executor per file. No agents⊥organs collision (B3): the
standing lives in `organs/autonomy/`, owned by the `O` task; the `A` task only **references** it. provenance
excluded from the organ fan-out (M5: don't formalize then delete).

```
wave 0  ENGINE(mav):  E1 anatomy-collapse (Fragment→brand; drop organ/slug; residue; ResolvedAgent-elim across
                         anatomy+codegen+both-adapters+toolkit; Agent shape; + a codemod that keeps the repo green)
                      E2b structural-parsimony gate
                      E3 operator-lexicon-module (md symbol-table → ESM module; rewire symbols lint; del md)  ← 3-wide frontier
wave 1  ENGINE(mav):  E2a residue/σ* gate (reads the E3 module)                    dep E1, E3
wave 2  CORPUS(nico): O1..O23 organ-residue-rebuild (per organ; provenance EXCLUDED)   dep E2a
                   ‖  A1..A11 agent-collapse (per agent; marks from deployed SOUL)      dep E1
                   ‖  S1..S15 skill-collapse (per skill; drop derivable name/verb/trigger; description→residue) dep E1,E2a
                   ‖  H1..H2  hook-collapse (drop kind; merge id/slug; definiens→residue; keep worker bytes)    dep E1,E2a
                      (organs/**, agents/**, skills/**, hooks/** all file-disjoint → one concurrent wave)
wave 3  CLEANUP:      C1 delete enumerated cruft + regenerate projections + global exit gate   dep A*,O*,S*,H*
```

`|frontier|>1` at waves 0 and 2; wave 1 (E2a alone) is a genuine single-gate barrier, not a mis-cut (M1: A* now
correctly dep **E1**, dispatched in wave 2 alongside O*, never serialized behind E2a).

## Reviewer blocker resolution ledger

B1/B2 mark-recovery → D3 (assign from deployed SOUL, enumerated). B3 collision → organ owns
`decision-authority.ts`, agent references. B4 ResolvedAgent → D2 (whole-repo incl `codegen`+codex+toolkit).
B5 glob → enumerate the 9. M1 single-wave → A\* dep E1 (wave 2), only E2a is solo (a real barrier). M2/M3
grey-field → green-field discipline binding + the codemod replaces byte-parity ceremony. M5 → provenance
excluded from O. M7 → single executor/task (predicate authored by nico in-spec). m1 census → **160** values
(verify at dispatch, not 158).

## The green-keeping bridge (why the repo never breaks)

E1 changes the value TYPE, so the 160 existing `{organ,slug,definiens}` values stop typechecking. E1's
deliverable includes a **codemod** that mechanically rewrites each value to the bare branded string with
`residue := old definiens verbatim` (a faithful first pass), so the repo is green the instant E1 lands. `O*`
then _reduces_ each verbatim residue to true `D∖fired(α)`. No broken intermediate; green-field ideal reached in
two steps, each compiling.

## Status mirror

**COMPLETE** — landing commit `a27960b` (branch `tmp-illustrate-conceptual-architecture`). Every task landed;
whole-repo exit gate GREEN on a clean worktree (`build · test · lint · typecheck` + `E2a` AC-RESIDUE live-scan

- `E2b` structural-parsimony). The corpus is formal σ\*, machine-verified.

* **E1** anatomy-collapse (Fragment→branded string · ResolvedAgent/base.ts eliminated · green-keeping codemod)
* **E3** operator-lexicon module (md symbol-table → ESM; symbols gate reads it) · **E2b** structural-parsimony gate
* **E2a** residue gate (`admissibleSingleLine` + `admissibleFormalBlock`; reads `RESIDUE_OPERATORS`); live-scan ENABLED + green
* **A** 10 agents (dense σ\* personas · marks from deployed SOULs · D4 memory-null) · **O** 140 organ values → true residue (+ `mission-command` partition)
* **S** 15 skills (description→σ\* · formalBlock→formalize artifact; signify reader-binding `σ*_R`→`σ*` by-design) · **H** 2 hooks→residue
* **C1** cleanup + global exit gate; persona/provenance READMEs archived (D12)
* **E0** reverted — a reader-binding non-problem (the reader is uniformly LLM; no per-artifact inference).

**push / deploy RESERVED to the Operator — not performed** (the reversible/irreversible line).

## See also

VISION (address-don't-describe) · `MODEL.md:40` (`body=⟨α,residue⟩`) · `packages/agent-forge/src/anatomy/index.ts`
(the `Fragment` being collapsed).
