# Four workstreams — greenfield realignment, then publish

## Context

Zero npm releases, zero git tags, `@cratylus` scope unclaimed. **Greenfield: break things.**
Four workstreams, ordered so each lands on ground the previous one made correct.

Order: **W1 layout → W2 publish → W3 channel → W4 memory.** W1 first because it moves
`plan-set` into runtime, which is where W3 and W4 both land. W2 second because publishing
freezes a layout — publish _after_ the layout is right, not before.

---

## W1 — Dissolve `src/toolkit/`, rename the render tree

### Why

`packages/canon/src/toolkit/` is 41 files, 67 refs across 35 files, **0 imported by any other
package**, 0 re-exported, none built (`tsconfig.build.json` excludes it), none shipped
(`files:["dist"]`). It is a residue directory — and under this repo's First Principle,
"the leftovers" is the one thing a name may not be.

**The fact neither prior attempt surfaced: 9 of the 41 files are generated.**
`guardrail/*.sh` + `continuity/*.sh` — 1,242 lines of shell — are written out by
`project-targets.ts` from `workers[].content` template literals in `src/hooks/*.ts`.
**`src/toolkit/guardrail/` is a second, unnamed render tree, committed into `src/`.**

Two independent reasons `src/` is the wrong home, neither about breaking changes: `src/`
asserts "this becomes `dist`", so a build-excluded subtree makes the directory name false;
and it is typechecked under a _different_ config than it builds under, with nothing
convicting the drift.

### Decomposition — no coherent remainder

| →                              | items                                                                                      |
| ------------------------------ | ------------------------------------------------------------------------------------------ |
| canon `src/` (up one level)    | `plan-states`, `operator-lexicon`, `project-template`, `cold-oracle/policy`, `hooks.ts`    |
| `@cratylus/runtime` capability | `praxis.sh`, `plan-set{,-cli}.ts`, `cold-oracle.sh`                                        |
| `@cratylus/forge/validate`     | `structural-parsimony`, `symbol-probe-gate`, `formal-block-self-sufficiency`, `project.ts` |
| repo-root `scripts/`           | `render-oracle.sh`, `project-targets{,-cli}.ts`, `sweep.mjs` (dead — 0 call sites)         |
| `cratylus`                     | `scaffold-cli.ts` — a shipping product command shelved as a dev script                     |
| test tree                      | 11 files + fixtures                                                                        |
| render tree                    | the 9 generated `.sh`                                                                      |

**Operator was wrong on 6 files.** `plan-states.ts`, `operator-lexicon.ts`,
`project-template.ts`, `policy.ts` are canon _meaning_, zero mechanism —
`runtime/carry-on/terminus.ts` deliberately names `plan-states` in prose rather than
importing it, because canon↔runtime must share no edge. Moving it inverts property 1.
`render-oracle.sh` / `project-targets*` / `sweep.mjs` are repo build tooling → `scripts/`.
The cited `memory.mjs` / `eventTap.mjs` don't exist; event-tap is already a runtime capability.

**Deferred, not in W1:** the guardrail workers' _source_ — 1,339 lines of shell embedded as
template literals in `src/hooks/*.ts` — is the real violation of _"a skill that embeds its
own implementation has fused meaning with mechanism"_. `memory-consolidation-nudge` shows
the right shape (72 lines shelling to a runtime bin); `stance-guardrail.sh` at 466 lines
does not. Fix is a runtime stance-guard capability with a thin projected face. Separate plan.

### Render tree → `packages/canon/.cratylus/{claude,codex}/`

**Not `dist/`.** Five mechanical refutations: `files:["dist"]` would publish the rendered
corpus into the tarball; `clean: rm -rf dist` destroys it; turbo `build.outputs:["dist/**"]`
claims it; `tsconfig outDir:dist` clobbers under `--build`; `dist/` is singular while the
render is per-harness (2, byte-compared by `harness-parity`). **`dist/` = publishable
library. Render tree = generated corpus for deployment. Two concepts.**

`.render-ts` is still wrong: the `-ts` suffix meant "the TypeScript render, not the Python
one" — and `resolve.py`, `deploy.py`, `packages/canon/ideas` no longer exist. It names a
completed migration, same defect class as the 119 dead designators, and it already needs an
entry in the signify gate's allowlist — a name needing an exemption failed the gate.

Convention for generated-but-unpublished is a **dotted producer-named dir** (`.next/`,
`.nuxt/`, `.svelte-kit/`, `.astro/`, `.turbo/`). Producer is `cratylus project` → `.cratylus/`.
Per-harness becomes subdirectories, not suffix-siblings.

**Cost: 21 live edits, 11 prose, 1 `git mv`, oracle unmoved** (contents identical, only the
path changes). Stays under `packages/canon/` — it's a pure function of that package's
corpus, and `deploy-drift-notice`'s fixtures build synthetic `.render-ts` inside a package root.

---

## W2 — Publish to npm

### Two facts that invert the obvious approach

1. **npm pins `dist-tags.latest` to the first version a package ever receives, whatever
   `--tag` says.** A prerelease into an empty package pins `latest` to a canary permanently.
   **So stable `0.1.0` ships first; `next` opens after.**
2. **`changeset publish` delegates to `pnpm publish`** (verified in `@changesets/cli@2.31.0`
   `getPublishTool`) — so the `catalog:`/`workspace:` question is settled. It is still wrong:
   `pnpm publish` runs `prepack`, so packages **rebuild at upload time** and the published
   bytes are bytes no gate read; and pnpm has no `--provenance`.

### Decisions

- **Publish 5. Hold `@cratylus/canon`** — it's the agent roster, nothing depends on it, and
  it depends on `forge` so publishing drags the projector into consumer trees. Contradicts
  the pending changeset, which lists all six.
- **Non-stable = snapshot** (`0.0.0-next-<ts>`), not changesets pre-mode. `pre enter` writes
  `.changeset/pre.json` **into the repo**, and while it exists every `changeset version`
  yields a prerelease — `main` is the release branch, so pre-mode locks the stable channel shut.
- **Pipeline:** `changeset version` → build → `pnpm -r pack` → **pack-smoke gate** →
  `npm publish <tarball> --provenance` → `changeset tag`. pnpm owns the protocol rewrite,
  the gate audits the literal bytes, npm owns upload and therefore provenance.
- **Node: pin `24` in `.nvmrc` (one home); floor `>=22` in `engines.node`.** A pin and a
  floor are different facts — collapsing them produced four disagreeing homes. Node 24 ships
  npm 11.x, required for trusted publishing.

### Blockers

- **5 of 6 packages declare `"license":"MIT"` and ship no LICENSE file** (only `forge` has one)
- **Zero packages declare `engines`** — npm has no inheritance; copy the floor, gate the copies
- `.changeset/README.md` is false prose (claims 3 packages `fixed`; there are 6, `fixed:[]`)
- `packages/memory/package.json` has a stale `"//"` claiming it is `private:true`
- The pending changeset lists canon

### Pack-smoke gate — 4 laws

The tarball is the one artifact no test reads, and it is irrevocable (72-hour unpublish
window, then never). (1) **protocol** — no `workspace:`/`catalog:` survives; (2) **target** —
every `bin` and `exports` target exists in the tarball (must handle forge's wildcard
`./adapters/*`); (3) **lifecycle** — no `prepack` survives (pnpm strips it, npm doesn't, so a
survivor proves it wasn't packed by pnpm — same evidence as (1) off an independent field);
(4) **license** — a `license` field implies a LICENSE file. Runs on **every PR**.

### Workflows

`.github/actions/setup/` (composite: pnpm → node from `.nvmrc` → frozen install, `HUSKY:0`) ·
`gates.yml` (reusable) · `release.yml` (changesets Release PR → `latest`) ·
`release-next.yml` (`workflow_dispatch` snapshot → `next`, refuses until `latest` exists).

**Cold-clone hazards:** oracle **before** test (it _produces_ the gitignored render trees
`harness-parity` needs); never invoke `cratylus` by bin name in CI (no `dist/` at install ⇒
pnpm omits the symlink); `HUSKY:0` or commitlint rejects the changesets commit;
`cancel-in-progress: false` (a cancelled publish is a half-published release).

### From you

1. **Create the `@cratylus` npm org** — currently unclaimed
2. **Granular token → `gh secret set NPM_TOKEN --repo leclabs/cratylus`**

---

## W3 — Channel substrate v0

**It is already half-built and unnamed.** `packages/runtime/src/capabilities/provisional-v9/`
has `EnvelopeStore` (tmp→`rename`→`ready`, `claim/`), `PushHost`, `period.ts`. v0 is naming
and wiring, not construction. `provisional-v9` is a placeholder — **`/signify` before it gets
a public surface.**

- **Key = identity, subject = address. Split the tiers.** NATS NKEYs _are_ ed25519 pubkeys
  and NATS deliberately refuses to let them address anything; Nostr conflates them and has no
  rotation story and no routing. The two systems that took key-as-identity most seriously drew
  the same line, independently.
- **SSH + maildir over NATS, for a repo-specific reason.** The three costs of maildir-over-SSH
  (no push, no ordering, hand-rolled acks) are already paid by `PushHost`, FIFO-sortable
  filenames, and the `claim/` rename. NATS is the correct destination once fanout/replay is
  wanted; the envelope doesn't change.
- **`ssh 'cat >> f'` is not atomic** — POSIX's `PIPE_BUF` guarantee is pipes-only, and
  **macOS `PIPE_BUF` is 512**. `ash`/`coal`/`fire` are macOS. rename-publish is the fix.
- **SSH multiplexing is a prerequisite** (`ControlMaster auto`, `ControlPersist 10m`) — without
  it every deposit pays TCP+KEX+auth.
- **Message `kind` follows Singh, not FIPA.** FIPA died because acts were defined by the
  sender's BDI mental state (`inform(p)` requires the sender _believes_ p) — unverifiable
  across heterogeneous agents, which is the point of an interop standard. Define each act by
  the **public commitment it creates or discharges**. Take `reply-by` and `not-understood`.
- Reuse `CANONICAL_EVENTS`; do not mint a second event vocabulary.

---

## W4 — Memory redesign

### THE ONE DECISION

**Consolidation stops being an act an agent performs and becomes a service the system runs.**
Trigger ownership moves to the scheduler.

Stronger than "a separate agent dreams": a separate agent still _summoned by the primary_
inherits the failure that emptied eight homes.

### The datum

**8 of 10 agent homes have never consolidated** — still seed-sized, 470–496 B. Only mav and
nico have a past. The ritual is agent-invoked, so it runs only when a busy session remembers.
For 80% of the fleet the persistent-being invariant is already failing, silently.

### Diagnosis

- **(c) inefficient/disruptive — CONFIRMED.** Wake payload 30,759 B before any work; dream's
  composition closure adds 19,517 B to consolidate records averaging 1,435 B. `consolidationOwed`
  fires at 12 records and `encode` is a per-turn duty ⇒ wake almost always fires a dream.
  mav's PROCEDURAL is **7,950/8,000 B** — the next dream refuses nearly any landing and demands
  a whole-store rewrite _as a precondition_, in the primary's working context.
- **(a) cwd-node confuses continuity — REFUTED.** `node` isn't stored; it's computed at fold
  time, and the routing law reads scope from record _text_. That bug existed and was fixed.
  **Live residue:** `session begin --under` still exists and its filter _hard-drops_ records
  with no cwd and records from a **foreign host** — on a 6-host fleet that erases exactly the
  cross-machine continuity being protected. Close the flag.
- **(b) dream coupled to handoff — REFUTED.** `handoff ⊃ dream` is correct and matches the
  field. **The disruptive one is `wake ⊃ dream`**, whose law is _blocking_. Also wrong:
  `praxis-sync ≺ dream ≺ release` puts the expensive act before the release that would make it
  drainable by anyone else. Invert to `praxis-sync ≺ release ≺ enqueue(dream)`.
- **"Cross-cutting" is the wrong word.** One dreamer for ten agents needs each agent's canon
  reach to judge `projection-carries`, and becomes one fleet-wide judgement writing into ten
  identities. No prior art does this. Correct: **one dreamer archetype, instantiated per
  agent** — shared code, separate binding.

### Hindsight: reject the dependency, harvest the mechanisms

Deciding factor is the **load path**. Its contract is `recall(query) → fragments`; ours is
`load → the whole self`. A being that must query to know who it is has a different identity
model. Also: its CC plugin retains whole transcripts, and `dynamicBankGranularity:
["agent","project"]` re-conflates provenance with scope — reintroducing (a) as a feature.

Harvest: temp-0.0 consolidation binding · `source_memory_ids[]` + proof counts · dedup as a
separate focused verdict · the `retain/recall/reflect` split (we have no cheap read-only reflect).

### Design

Three layers by cost: **deterministic** (fold, partition, candidate scoring, admission gate —
no model) · **narrow temp-0** (route + distil each admitted candidate) · **weekly expensive**
(`depalimpsest`, canon promotion — the two needing canon-wide reach).

**Provenance non-negotiable.** Moving the dream out-of-band _raises_ confabulation risk — a
dreamer with no stake sits further from ground truth. Every derived line cites the record
ULIDs it came from. Nearly free; the ULID is already the record id.

**Keep the 8 KB ceiling and refusal-as-summons.** It's the price of loading whole rather than
retrieving, not a limitation.

**Prerequisite:** nothing records that a store line was ever _used_. Recall-count is the
highest-signal admission input in the survey and is unobtainable until wake logs which lines
it served. Build that first.

---

## My output style — W0, trivial

Four dimensions touch communication; two do real work. `transparency: decision-rationale` is
the noise source (your diagnosis, confirmed). `outputFormat: code` is mishomed — it should
carry response _shape_ and instead names a medium I don't emit. `formality: formal
⟨terse·dense⟩` already says terse and is being overridden.

Fix: `transparency` → reports decisions, not reasoning. `outputFormat` → the
Done/Decisions/Open-Questions structure. Then redeploy — the projected copy is what I read.

---

## Verification

- **W1:** `pnpm verify` green; oracle re-baselined once with the rename argued in the commit;
  `git grep -c '\.render-ts'` = 0
- **W2:** the pack-smoke script (W2 creates it; not citable as runnable until it exists —
  the command-veracity gate convicted this very line for naming it) red on purpose against
  each of the 4 convicting fixtures; cold-runner
  PR green; `npm publish --dry-run` proves `--provenance` accepts a tarball spec (unverified —
  fallback is publishing the extracted dir); then `npm i -g cratylus` on `ash`
- **W3:** two agents on different hosts exchange an envelope; kill one mid-claim and prove no loss
- **W4:** scheduler consolidates an _idle_ home with no session open — the 8-of-10 case
