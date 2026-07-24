# install-parity — PLAN

Design: [`DESIGN.md`](./DESIGN.md) (frozen). Reader = LLM. Shards are MECE; each is independently
executable and independently verifiable.

**Status 2026-07-23.** Design settled + operator-corrected (projection runs at the consumer's build
time; `agent-canon` is a build-time plugin shipping as code). Fleet clean-slate **DONE** — all 7 hosts
purged of project artifacts, memory homes preserved. Remote-fleet distribution **DEFERRED** (verdaccio
is the target mechanism; not a prerequisite).

## Ordering constraint

S1 → S2 → S3 must precede S4, and S4 must precede S5. The bin name is currently pasted across skill
prose; **the brand must not be derived until the name has exactly one home**, or the rename becomes a
multi-site edit in generated markdown no compiler checks.

| #   | shard                                                  | why it is where it is                                        |
| --- | ------------------------------------------------------ | ------------------------------------------------------------ |
| S1  | complete the runtime-shim seam                         | unblocks everything; the mechanism is unusable today         |
| S2  | declare capabilities as real dependencies              | the hermeticity defect; must land before any host reinstalls |
| S3  | rewrite `wake` + `handoff` formal blocks onto the shim | removes the bin name from prose                              |
| S4  | derive the CLI brand (signify)                         | safe only once S3 leaves one home for the name               |
| S5  | `agent-canon` builds to `dist/` + is installable       | blocking for consumer-side projection                        |
| S6  | local dev-loop parity (`pnpm add -g .` + watch)        | the acceptance test for the whole design                     |

---

## S1 — complete the runtime-shim seam

**Defect.** `runtime-shim.ts` emits `<skillDir>/scripts/<capability>.mjs`, but nothing binds that path
into the projected `SKILL.md`. A cell declaring `runtime:` gets a shim it cannot name. **Zero cells
declare `runtime:`** — the mechanism has never been usable, which is why every skill embeds the bin
name in prose instead.

**Fix.** Realization binds the shim by `$HOME`-relative path, exactly as hook commands already do
(`sh "$HOME/.claude/hooks/<id>/<id>.sh"` — proven, deployed, harness-appropriate). The projected body
gains one binding line naming the capability's shim path; the verbs reference the binding, never a bin.

**Outputs.** Shim path binding emitted into `SKILL.md` for any cell declaring `runtime:`; a test that a
`runtime:`-declaring cell produces a body whose shim reference resolves to the deployed location.

**Falsifier.** A `runtime:` cell still requires a bare bin name in its body to be executable.

---

## S2 — capability packages become declared dependencies

**Defect.** `loader.ts` `discover()` resolves capabilities by ambient dynamic `import()` with no
declared dependency. It works only because the retired installer flat-co-installed siblings into one
`node_modules`. A consumer running `npm i -g @leclabs/agent-runtime` gets **no memory capability**; an
isolated store (`pnpm add -g .`) breaks discovery outright.

**Fix.** The installable unit declares its capability packages as real dependencies — the vite model.
`discover()` may keep dynamic `import()`, but resolution must succeed because the dependency is
_declared_, not because a sibling happens to be co-located.

**Outputs.** Declared-dependency capability resolution; a test that proves resolution under an
**isolated** install layout, not merely a flat one.

**Falsifier.** Capability resolution still passes only under a flat co-install.

---

## S3 — rewrite `wake` + `handoff` formal blocks onto the shim

**Defect.** `wake/skill.ts` embeds **6** literal `agent-runtime memory …` invocations inside its formal
block; `handoff/skill.ts` embeds 1. These are shell realization details sitting in a σ\* block, and
they land verbatim in deployed markdown. `dream/skill.ts` carries **zero** and expresses consolidation
abstractly — it is the correct shape and the reference for this rewrite.

**Fix.** Each cell declares `runtime: { capability: 'memory' }`. The block binds the capability once
and expresses each step as a verb application over that binding. The bin name appears in exactly one
home: `runtime-shim.ts`.

**Constraint.** This is a **signification** act, not a mechanical substitution — the verb notation must
cold-decode to the same operations. Round-trip acceptance per `self-sufficiency-redo`: an independent
cold read must reconstruct meaning **equivalent-or-better** than the current block.

**Outputs.** `wake` + `handoff` rewritten; zero bin-name occurrences under `src/skills/`.

**Falsifier.** A cold reader cannot determine how to perform the operation from the rewritten block.

---

## S4 — derive the CLI brand (FORK-4)

Blocked on S3. `packages/agent-runtime/src/bin.ts:11` declares the current name a **placeholder**.
Derivation is a `signify` act under cratylism — candidate-free cold oracle, negative control, no
operator-floated or self-floated candidate adopted without independent re-derivation.

**Falsifier.** The brand was confirmed rather than derived, or a generic/collision-prone name shipped.

---

## S5 — `agent-canon` builds to `dist/` and is installable

**Defect.** Exports `./src/index.ts` with `files: ["src"]` and no build ⇒
`ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING` when installed; works today only via the pnpm workspace
symlink's realpath escape. **Blocking**, because consumer-side projection must import this package.

Also settle: `private: true` on `agent-runtime`/`agent-memory`, and the broken `changeset publish`
(with `ignore: []` it would publish canon as raw TS while its transitive dep is unpublishable).

**Falsifier.** The package resolves only from inside the workspace.

---

## S6 — local dev-loop parity

`pnpm build` → `cd packages/<cli> && pnpm add -g .` → `<cli> deploy`, plus `tsup --watch` for the edit
loop. Requires `pnpm setup` + `PATH` (pnpm's global bin dir is currently empty and unresolvable).

**Acceptance — the whole design's test.** A clean host reaches a working deployment using only the
commands a consumer would run, with **no path into the monorepo**.

**Falsifier.** Any step requires reaching into the checkout, or `--no-runtime-install` is needed to
make deploy work outside the workspace.

---

## Retired by this plan

The `pnpm pack` → `scp` → remote `npm install -g` path, its fingerprint stamp, and its
interactive-shell prefix probe. Superseded by per-host build + install; see DESIGN §4.

## Carried forward, not in scope

- Deploy **never prunes** — every retired cell's artifact persists on every host. The clean slate
  cleared today's accumulation; the mechanism still needs a converge-to-render-tree leg.
- Node version drift across the fleet: `spark` 26.2.0, `fire`/`upgoose` 24.18.0, rest 24.16.0. Matters
  now that each host builds what it installs.
- `.agent-factory.config` is gitignored, its committed example has drifted, and its cited schema doc
  does not exist.
