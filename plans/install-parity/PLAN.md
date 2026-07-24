# install-parity — PLAN

Design: [`DESIGN.md`](./DESIGN.md) (frozen). Reader = LLM. Shards are MECE; each is independently
executable and independently verifiable.

**Status 2026-07-23.** Design settled + operator-corrected (projection runs at the consumer's build
time; `agent-canon` is a build-time plugin shipping as code). Fleet clean-slate **DONE** — all 7 hosts
purged of project artifacts, memory homes preserved. Remote-fleet distribution **DEFERRED** (verdaccio
is the target mechanism; not a prerequisite).

## Progress

| shard                               | state                             | commit    |
| ----------------------------------- | --------------------------------- | --------- |
| S1 shim seam                        | **DONE**                          | `ad45999` |
| S3 wake/handoff onto the shim       | **DONE**                          | `cae76b7` |
| S2 declared-dependency capabilities | **DONE**                          | `cd10503` |
| S4 CLI brand                        | **DOES NOT CONVERGE** — see below | —         |
| S5 `agent-canon` installable        | **DONE**                          | `b84c959` |
| S6 local dev-loop parity            | **DONE** — falsifier actually run | see below |
| S7 compose → render tree            | **DONE**                          | `650480e` |

### S6 — `pnpm add -g .` LINKS, it does not copy

The premise this shard started from was that `pnpm add -g .` packs workspace siblings
into the isolated global store, making it a hermeticity test. **Measured, it does not.**
For a package inside a pnpm workspace it symlinks straight back into the checkout:

```
$PNPM_HOME/global/v11/…/node_modules/@leclabs/agent-cli
  -> …/packages/agent-cli          (a link, not a copy)
```

and its capabilities resolve through the workspace's own `node_modules`. So it is
**not** a consumer-parity proof — the global bin is reading monorepo build output.

That cuts both ways, and both are useful:

- **As a dev loop it is better than advertised.** Because it links, a rebuild is
  immediately live on the global bin — there is no re-install step, which dissolves the
  "TypeScript gotcha" (snapshot staleness) that motivated the watch-mode workaround.
  `pnpm dev` (turbo, parallel `tsup --watch` / `tsc --watch`) is all the loop needs.
- **Hermeticity must be proven by the packed tarball**, which is a separate act:

```
pnpm -C packages/agent-cli pack
npm install <tgz> …        # clean dir, no monorepo
```

**Both legs verified.** Hermetic: packing runtime+memory+cli and npm-installing into a
clean directory yields 4 packages and a bin that dispatches `memory home` correctly with
no checkout present. Canon likewise loads and scans (10 agents, 15 skills) from an
installed copy outside the workspace.

**Install parity: met.** **Deployment parity: NOT met** — see S7. I initially recorded
S6 as done; that was wrong, and the redeploy to `fire` that followed used the RETIRED
path (`pnpm canon:project` + the CLI invoked as a path into the checkout), which is
precisely the act the design says a consumer cannot perform.

### S7 — compose → render tree (the missing link)

Measured end-to-end from a clean consumer install (`/tmp/iso-canon`: all packages
npm-installed, no monorepo):

| step                         | result                                                                                 |
| ---------------------------- | -------------------------------------------------------------------------------------- |
| `agent-forge init`           | ✅ scaffolds `agents.config.ts` with `extends: [canon]`                                |
| `agent-forge compose`        | ✅ resolves the installed canon plugin, enumerates every fragment — **writes nothing** |
| `agent-forge compile claude` | ❌ **0 files written** — the composed set never reaches the IR                         |
| `agent-forge deploy`         | ❌ requires a render tree nothing produces                                             |

**CLOSED by `650480e`.** `agent-forge project` materializes the resolved set, and
`canon:project` now makes the SAME call over the same plugin — one path, ridden by
both. Keeping a second dir-scanning projector is precisely what let the consumer path
rot unnoticed.

A defect this surfaced: the founding doctrine was stamped by canon's build SCRIPT, so
consumer-projected cells silently lost the axiom — the ambient dependence
`intrinsic ⟨¬ambient⟩` forbids. It now travels ON the plugin. It was caught only
because a falsifier's CONTROL was vacuous: the grep came back clean while the control
matched nothing, which is not a pass.

**Verified on `fire` through the consumer path**, not merely in a sandbox: a real site
(`~/.agent-site`) with packages npm-installed, `init → project → deploy`, no path into
the checkout. The consumer-projected artifacts are **byte-identical** to what the
retired path produced, and `fire` is now deployed from this path.

**Hooks closed too** (`f57c1d5`). A plugin declares a hooks dir; the shared projector
emits `settings.json` + workers from the CELL bytes, filtered to harness substrate so a
git-substrate cell never reaches settings (verified non-vacuously: 4 cells in source, 3
projected). `canon:project` no longer has its own hook projector — agents, skills and
hooks all travel the one path.

Dir-scanning surfaced a silent behavioral change: it imposes ALPHABETICAL order where
the composition root encoded intent (the blocking stance gate ran before the
non-blocking nudge). `HookCell` now carries an explicit `order`, so the emitted
settings.json is byte-identical to deployed rather than incidentally reordered.

**`fire` is now fully deployed from the consumer path** — 10 agents, 15 skills, 3 hooks,
via `~/.agent-site` with npm-installed packages and no path into the checkout.

Remaining: the build face still ships as the separate `agent-forge` bin (S4/S9).

The only thing that produces a render tree is `pnpm canon:project`, a **monorepo script**
that dir-scans `src/agents` / `src/skills` directly and **bypasses the plugin resolver**.
So the resolver path is live for _resolution_ but dead for _materialization_, and the
corpus's own projection does not travel it.

Until S7 lands, consumer-side projection — the operator's correction that projection runs
at the consumer's build time — is not reachable, and every deployment necessarily uses
the retired path.

### Re-sequencing (S3 → S4 → S2, not S1 → S2 → S3 → S4)

`agent-runtime` **cannot** declare a capability package: every capability depends on
the runtime for its contracts, so the edge cycles. A type-only import does not save it
— turbo's `^build` follows devDependencies too. The declared-dependency fix therefore
_requires_ the third package (`agent-cli`), which is what the vite model predicts:
core, plugins, and an installable unit that composes them.

### S4 — negative result, recorded rather than forced

Six candidate-free concept-alone cold runs yielded `forge`×2, `rig`×2, `conduit`,
`foundry`. **The negative control fails**: concept-alone does not regenerate a single
anchor, so the anchor is _not yet discovered_ and must not be coined (cratylism).

Diagnostic: `forge`/`foundry` are one metaphor family naming only the **build** face —
the oracle returns the genus (a build tool), not the species (a dual-faced single entry
point). Either the definiendum is still under-specified, or the concept lives in a gap.

Measured collision data (the oracle _guesses_ collisions badly — always measure):
scope-stripping means the binding constraint is a **bin on PATH**, not an npm package
name. `forge` ships `bin:{forge}` at 5.4k downloads/month plus Foundry's `forge` —
genuinely disqualified. `rig` is a dead 2013 package with no bin; `rig-rs` is a Rust
_library_, not a PATH binary, so the oracle's stated collision is not real for us.

**No longer blocking.** S1+S3 gave the bin name exactly one home, so the rebrand is a
one-line change whenever the anchor resolves.

### S5 — scope enlarged by a silent failure mode

Shipping built `.js` is necessary but **not sufficient**: every module scan hardcodes a
`*.ts` glob — `catalog/enumerateCatalog` over `<corpus>/<dim>/*.ts`, canon over
`agents/*.ts` and `*/skill.ts`. An installed package would be scanned for `.ts` and
match **nothing, silently** (a zero-match glob is an empty list, not an error). The
build must also preserve per-module structure, so bundling is ruled out — the scan
depends on one file per cell.

S5 is therefore three concerns, not one: (a) structure-preserving build, (b) scans that
accept the built extension, (c) the `AgentPlugin` consumer path made live at all — it
currently has zero real importers and the projection bypasses it entirely.

## Ordering constraint

**Actual order, as executed:** S1 → S3 → S4 → S2 → S5 → S6. The originally-planned
S1 → S2 → S3 → S4 was wrong: S2 needs the third package, whose bin name is the brand,
so S2 could not precede S4; and S4 could not precede S3, because deriving a name pasted
across skill prose yields a half-completed rename in markdown no compiler checks.

| #   | shard                                                  | why it is where it is                                                     |
| --- | ------------------------------------------------------ | ------------------------------------------------------------------------- |
| S1  | complete the runtime-shim seam                         | unblocks everything; the mechanism was never usable                       |
| S3  | rewrite `wake` + `handoff` formal blocks onto the shim | gives the bin name exactly one home                                       |
| S4  | derive the CLI brand (signify)                         | safe only once S3 leaves one home; did **not** converge, no longer blocks |
| S2  | declare capabilities as real dependencies              | the hermeticity defect; needs the third package                           |
| S5  | `agent-canon` builds to `dist/` + is installable       | blocking for consumer-side projection                                     |
| S6  | local dev-loop parity (`pnpm add -g .` + watch)        | the acceptance test for the whole design                                  |

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

## Open distribution tail (encapsulation gap, 2026-07-24)

The fleet consumer-path deploy was executed from an ephemeral `/tmp` script all session — NOT
encapsulated. Rescued to `plans/install-parity/fleet-deploy.sh` so the workflow survives. It is the
pragmatic fleet form of the consumer path (pack centrally → ship tarballs → per-host
`npm install → init → project → deploy`, no monorepo), and the concrete replacement for
`runtime-install.ts`'s retired scp path. **Open:** first-class it as an `agent-forge fleet-deploy`
command (design work), then delete `runtime-install.ts`'s scp half per DESIGN §4.
