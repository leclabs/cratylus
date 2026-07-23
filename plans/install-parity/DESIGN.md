# install-parity — DESIGN

<!-- `ρ=human` — operator review + executor grounding. Convergent design prose, not execution shards. -->

> **Anchor owed.** The plan-dir name `install-parity` is a working handle, not a discovered anchor.
> It must be cold-derived before it canonizes (cratylism: names are discovered, never decided).

## Objective

Development-time fleet deployment and end-consumer installation become **the same act over the same
artifact**, differing only in where the package comes from (a local build vs the npm registry). Every
leclabs host becomes a **sibling development environment** that traverses every lifecycle phase on its
own disk, rather than an install target that receives the output of another host's phases.

## 1. The gap, stated as an ontology

Four words in the operator's framing — *development time, build time, runtime, deployed artifacts* —
resolve to **seven** distinct phases. The current system fuses several of them, which is why they
cannot be reasoned about separately.

| # | Phase | Input → Output | Runs where | Owner |
|---|-------|----------------|-----------|-------|
| 1 | **authoring** | intent → hand-written `.ts` under `src/` | our repo | human + nico |
| 2 | **compile** | `src/` → `dist/` (tsup) | our repo | turbo |
| 3 | **packaging** | `dist/` + manifest → tarball / registry artifact | our repo | pnpm / npm |
| 4 | **installation** | package → the consumer's project or global prefix | **consumer** | npm / pnpm — *not us* |
| 5 | **composition** | `extends: [pluginA, pluginB, …]` → one merged cell set | **consumer** | our build core |
| 6 | **projection** | composed cells → harness-agnostic IR | **consumer** | our build core + plugins |
| 7 | **realization** | IR → harness declaration artifacts in the config home | **consumer** | our build core |
| 8 | **execution** | harness reads declarations; skills invoke runtime capabilities | **consumer** | the harness + our runtime |

**The cut that governs everything:** phases 1–3 are ours and ship as *code*; phases 4–8 run at the
consumer's site. **Nothing is pre-rendered.** Projection is a build the *consumer* runs, because what
gets projected depends on a composition only the consumer knows.

### Why projection cannot be pre-computed — the vite correspondence

| | vite | agent-factory |
|---|------|---------------|
| build core | `vite` | `@leclabs/agent-forge` |
| **build-time plugin** | `vite-plugin-*`, listed in `vite.config.ts` `plugins: []` | **`AgentPlugin`**, listed in `agents.config.ts` `extends: []` — e.g. `@leclabs/agent-canon` |
| build invocation | `vite build` | `<cli> build` / `deploy` |
| build output | `dist/` assets | realized harness declarations |
| runtime core | vite dev server / preview | `@leclabs/agent-runtime` |
| **runtime plugin** | — | **`RuntimePlugin`** — `@leclabs/agent-memory`, event-tap |

A vite plugin ships **code that runs during the user's build**, not pre-rendered output — because the
user composes plugins the author never saw. Ours is the same: `extends: [canon, mine, third-party]` is
resolvable only at the consumer's site. Pre-rendering projection would make composition structurally
impossible, since N pre-rendered markdown trees cannot be merged. **`agent-canon` is a build-time
plugin and must ship as code.**

Two consequences follow immediately:

- **`agent-canon`'s unpublishability is now BLOCKING, not optional.** It must build to `dist/` with
  real `exports`/`files`, exactly like any vite plugin. Shipping `./src/index.ts` with `files:["src"]`
  is not viable for a package the consumer's build must import.
- **The consumer needs the build core, not merely the runtime.** This is precisely S9's "one core, two
  skins": a dev machine resolves both faces; a runtime-only host resolves only runtime verbs and fails
  loud on a build verb.

Note that **projection (6) and realization (7) remain different acts**, both currently called "deploy".
Projection is composed-cells → IR: semantic, harness-blind. Realization is IR → `~/.claude/…`:
mechanical, harness-bound. Both are consumer-side; only the second knows the harness.

**My own agent declaration, traced through the phases** — the concrete instance the operator asked
about:

```
canon cell (1 authoring)
  → IR (3 projection)
    → ~/.claude/agents/nico.md (6 realization)      ← harness declaration, REGENERABLE
      → harness reads it, spawns me (7 execution)
        → /wake shim calls `agent-runtime memory …`
          → bin resolved from the global prefix (5 installation)
            → reads/writes ~/.agents/nico (SelfAuthored — ∉ Target, never realized, never deployed)
```

Five artifact classes with five different lifecycles and owners. `~/.claude/agents/nico.md` is a
**face**; `~/.agents/nico` is the **being's** memory home, harness-independent and outside every
projection (MODEL.md:42–46). The current fleet mechanism fuses 5 and 6 into one ssh-driven command run
from a build host, which is why these cannot be reasoned about separately today.

## 2. Empirical state (probed 2026-07-23, not inferred)

**The fleet is 7 hosts**, declared in the **gitignored** `.agent-factory.config`: `fire` (local),
`forge`, `spark`, `ash`, `apps`, `upmav`, `upgoose`. The committed `.agent-factory.config.example`
declares a *different* 3-host set and has drifted from the live file. `docs/agent-factory-config-schema.md`
is cited from three source files and **does not exist**.

- **`upmav` has no checkout of `agent-factory`.** It never authors, compiles, projects, or packages.
  It receives `scp`'d tarballs and runs `npm install -g` over `ssh`. Phases 1–4 do not exist there,
  so nothing about its state is reproducible from its own disk. (Probed directly; the other five
  remotes are presumed the same shape and should be confirmed before execution.)
- **The fleet packs once, centrally.** `deployFleet` builds the runtime bundle a single time and ships
  the same tarballs to every host — the literal mechanism of "build time happens on one host for all
  hosts."
- **Node drifts across the fleet**: fire `24.18.0`, upmav `24.16.0` — both mise-managed at
  `~/.local/share/mise/installs/node/<ver>`, with an `lts` symlink to the version dir.
- **Split version-manager ownership**: pnpm is Homebrew-installed on both hosts; node is mise-managed.
- **pnpm global is not wired.** `PNPM_HOME` is set, `~/.local/share/pnpm/bin` is empty and absent from
  `PATH`, and `pnpm ls -g` hard-errors demanding `pnpm setup`. The runtime that resolves today lives
  in mise's node prefix.
- **Installed at fire's npm prefix**: `@leclabs/agent-runtime` + `@leclabs/agent-memory`, stamp
  `0.0.0 eface3ecbb4f741d`; the bin is an npm bin-link into the runtime's `dist/bin.js`.
- **Runtime install runs only on `--kind agent`** — the skill and hooks branches return before it.
- **Drift already visible on `fire`**: a legacy `~/.claude/agents/mav/EPISODIC.jsonl` sidecar, a
  `~/.claude/skills/memory/` leftover, a stray `~/.agents/skills`. Deploy **never prunes**, so every
  retired cell's artifact persists on every host indefinitely.

### Where the monorepo coupling actually is

I initially placed this coupling in the *installed artifact*. That is **wrong**, and the census
disproves it: `~/.claude/agents/*.md` and the entire `.render-ts` tree contain **zero** references to
`agent-factory`, `packages/…`, `pnpm-workspace`, or any absolute checkout path. Deployed skills invoke
only the `agent-runtime` bin on `PATH`; hook workers reference only `$HOME` paths and `jq`/`git`.
**The deployed artifacts are already clean.**

The coupling is in the **deploy act itself**, and there it is total. Deploy cannot run without the
monorepo checkout because:

1. the CLI is invoked as a *path* — `node packages/agent-forge/dist/cli/index.js`, never as an
   installed bin;
2. `buildRuntimeBundle` walks up from its own `dist/` location to `pnpm-workspace.yaml` and requires
   `<root>/packages/{agent-runtime,agent-memory}` plus a working `pnpm`;
3. the fleet topology is read from `<nearest .git>/.agent-factory.config`;
4. the render tree is `packages/agent-canon/.render-ts`, gitignored and unpublished.

If `agent-forge` were installed *outside* a workspace, `defaultMonorepoRoot()` would throw and
`--no-runtime-install` would become mandatory. **That is the parity gap in one sentence: the consumer
has no monorepo, so the consumer cannot run the act we run.**

### Two build-integrity defects the census surfaced

- **`pnpm pack` runs no build.** Neither `agent-runtime` nor `agent-memory` declares `prepack` or
  `prepare`, so whatever `dist/` happens to be on disk is what ships. A stale `dist` ships stale bytes
  silently. This is a live false-green: the fingerprint stamp hashes the *tarball*, so a stale-but-
  consistent bundle reads as "current."
- **`agent-canon` is outside the build graph.** It declares no `build` script, so turbo never
  schedules it. Its real build — `pnpm canon:project` → `.render-ts` — is unmodelled by turbo and
  unordered with respect to everything else. Only the root `canon:deploy` script chains
  `build && canon:project && deploy`; the three `canon:deploy:*` variants skip both.

## 3. The defect the gap was hiding

`packages/agent-runtime/src/loader.ts` discovers capabilities by **ambient resolution**:

> "`discover` probes a set of `@leclabs/*` capability-package specifiers by dynamic `import()`
> (STRINGS, never static deps — the runtime deps no capability package)"

This resolves **only** because `runtime-install.ts` flat-co-installs the runtime and every capability
package into one `node_modules` in a single `npm install -g` command, making them siblings.

That co-location is a property of **our installer**, not of the package. Consequences:

1. A consumer running `npm i -g @leclabs/agent-runtime` gets **no memory capability**. The install
   succeeds, the bin works, and `agent-runtime memory …` reports the capability absent.
2. `pnpm add -g .` — whose isolated global store gives each package only its *declared* dependencies —
   would break discovery on our own fleet.

This is not an argument against the operator's proposal. It is the proposal working as intended: the
isolated store is a **hermeticity test**, and it fails a design that was relying on ambient siblings.

**Resolution — the vite model, applied.** The unit of installation becomes **one thin CLI client**
that declares its capability packages as **real dependencies**. The consumer installs one thing.
Discovery may keep its dynamic-`import()` mechanism, but it then resolves because the dependency is
*declared*, not because a sibling happens to be co-located. This is how vite resolves plugins:
declared in the consuming project, never ambiently discovered.

## 4. Target architecture

**Consumer path:**

```
npm i -g @leclabs/<cli>      # phase 5 — installation, from the registry
<cli> deploy                 # phase 6 — realization, on their host
```

**Development path — the same two steps, differing only in package origin:**

```
pnpm build                              # phases 2–4, locally
cd packages/<cli> && pnpm add -g .      # phase 5 — installation, from the local build
<cli> deploy                            # phase 6 — realization, identical code path
```

`workspace:*` is what makes this work: pnpm packs local siblings into the isolated global store rather
than fetching them from the registry, so no publish is required to exercise the real consumer path.

**Fleet deployment becomes N sibling development environments**, each running the development path on
its own disk. The only thing crossing the network is `git`. A fleet command, if we keep one, is an
orchestrator that runs *on each host exactly what a human would run there* — it never packs on one
host for another.

### What this deletes

- `pnpm pack` → `scp` → remote `npm install -g` (the entire `ssh` half of `runtime-install.ts`),
  and with it the stale-`dist` shipping hazard: each host builds what it installs
- the bundle fingerprint stamp — npm's own version + integrity already answers idempotency
- the interactive-shell remote prefix probe and its `lastPathLine` noise-stripping
- `buildRuntimeBundle`'s walk to `pnpm-workspace.yaml`, and the invocation of the deploy CLI as a
  *path into the checkout* rather than as an installed bin — **the structural form of the whole gap:
  the act we run is one the consumer cannot run**

### What this does not fix, and must be handled separately

Deploy **never prunes**. Under sibling-host symmetry every host still accumulates the artifacts of
every retired cell. Realization needs a prune leg — the render tree is already the complete intended
set, so the deployed set should converge to it rather than union with it.

### The development-loop cost, and the answer

`pnpm add -g .` is a snapshot: source edits do not sync to the global bin. The answer is the one the
operator's material names — `tsup --watch` so `dist/` is always current, plus `pnpm link` from a
consumer project when the isolated global store caches stale files. Note this *weakens* the
hermeticity test, so linking is a development convenience and must never be the path a gate verifies.

### A simplification this yields

A host that deploys **to itself** needs no fleet topology at all. `.agent-factory.config` — gitignored,
drifted from its committed example, and documented by a schema file that does not exist — is needed
only by an *orchestrator* that reaches across hosts. Under sibling symmetry it shrinks to a
convenience for "run this on all my machines," and stops being load-bearing for correctness.

### Prerequisites this exposes

- **`pnpm setup` + `PATH` on every host** before `pnpm add -g .` is usable.
- **`@leclabs/agent-canon` is currently unpublishable** — it exports `./src/index.ts` with
  `files: ["src"]` and no build, so an installed copy dies on Node's type-stripping restriction
  (`ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`) and works today only via the pnpm workspace symlink's
  realpath escape. If realization (6) needs canon at the consumer's site, canon needs a real build.
- **`agent-runtime` and `agent-memory` are `private: true`.** That flag is the interim state of
  unfinished work, not a decision against publishing.
- **Node version drift** across the fleet should be pinned, since the installed artifact is now built
  per-host rather than once centrally.

## 5. There is no working consumer path to align *to* — yet

The census found that the intended consumer mechanism is scaffolded but **never exercised**:

- `agent-forge init` writes an `agents.config.ts` containing `import canon from '@leclabs/agent-canon'`
  + `defineAgentsConfig({ extends: [canon] })`. That is the designed consumer surface.
- **`@leclabs/agent-canon`'s `AgentPlugin` default export has zero live consumers.** There is not one
  real `import … from '@leclabs/agent-canon'` anywhere in the repo — only two string assertions in
  tests. No package lists it as a dependency; root `node_modules/` has no `@leclabs/` dir at all.
- The projection pipeline **bypasses the plugin/resolver entirely** and dir-scans `src/agents` /
  `src/skills` directly (`project-cli.ts:33-35, 58-75`).
- **`README.md` is five lines** — a thesis and an image. Zero install instructions, zero usage. No
  `npx` in any shipped code; the only mentions are aspirational plan prose.

**`changeset publish` is broken today.** With `ignore: []` and no `private` flag, it would attempt to
publish `@leclabs/agent-canon` as raw untranspiled TS with no `dist`, while its transitive runtime
dependency `@leclabs/agent-runtime` is `private: true` and therefore unpublishable — and `agent-forge`
hard-declares `"@leclabs/agent-runtime": "workspace:*"`.

So install-parity cannot be verified by comparison against a working consumer path. **The consumer
path must be built as part of this work**, and the dev path defined as identical to it by construction.
That is a scope enlargement over the original framing, and it is unavoidable.

### The bin name is a consumer contract embedded in prose

**Zero skill cells declare `runtime:`.** The thin-shim mechanism S6/S8 built is unused. Instead, skills
embed `` `agent-runtime memory …` `` as **prose inside the formalBlock**, which lands verbatim in the
deployed `SKILL.md` — e.g. `wake/SKILL.md:53-60`, `handoff/SKILL.md:23`. My own `/wake` does this.

`packages/agent-runtime/src/bin.ts:11` states the bin name is a **placeholder** pending S9's rebrand
(FORK-4, unresolved, `ready/` and never executed). Therefore **renaming the bin breaks every skill's
embedded command string**, and the breakage is in generated markdown, not in code a compiler checks.
Either the shim mechanism becomes real (so the bin name has one home), or the brand freezes before the
prose multiplies further. I recommend the former: it restores a single home for the name, which is what
the shim was for.

## 6. Forks — reconciled with the existing ledger

These are already logged in `plans/agent-runtime/PLAN.md:33-36`; this work forces both.

- **FORK-3 (publish story) — operator.** Public npm vs private registry vs monorepo-bundled tarball.
  Currently resolved *de facto* as monorepo-bundled-tarball, which is exactly the mechanism this design
  retires. Sibling-host symmetry does **not** require publishing (local `workspace:*` packing suffices),
  so this fork can stay open — but the `private: true` flags on `agent-runtime`/`agent-memory` and the
  broken `changeset publish` must be settled before any first stable release.
- **FORK-4 (binary brand) — signify.** Must be *derived*, not coined; S9's own falsifier demands a
  candidate-free cold-oracle with a negative control. This is my remit and I will run it, but it is
  gated on the prose-vs-shim decision above, because that decides how many homes the name has.
- **Projection placement — SETTLED (operator, correcting me).** Projection runs at the **consumer's
  build time**, never pre-computed. I had proposed pre-rendering; that is wrong, because it forecloses
  plugin composition — the defining property of the build-time-plugin architecture. `agent-canon` ships
  as **code**, and its `dist/` build is now a blocking prerequisite rather than a nice-to-have.

### Live breakage this census surfaced (unrelated to parity, worth fixing now)

`~/.claude/skills/memory/SKILL.md` has **no source cell** and instructs agents to invoke
`node ~/.claude/skills/memory/episodic.mjs`, a binary `retireLocal` already deleted. It survives because
deploy never prunes and the retire step only removes the directory when empty. Any agent reading that
skill is following instructions to a removed binary.

## 7. Remote fleet distribution before a public registry

The question: with no registry, how does a *remote* host install our packages the way a consumer would?

**There is no `ssh:host:path` package protocol.** npm/pnpm accept `file:`/`link:` (same filesystem),
`git+ssh://` (a git remote, not an arbitrary path), and `https://` tarball URLs. Nothing resolves a
package over a bare ssh path.

**The industry-standard answer is a private registry — Verdaccio.** It is the default choice for
exactly this situation: a lightweight npm registry that proxies upstream npm and hosts your own scopes.
It gives *true* parity, because the consumer command becomes literally the consumer command:

```
# on the build host
verdaccio &                                     # :4873, proxies npmjs upstream
pnpm -r publish --registry http://localhost:4873

# on each fleet host — over an ssh reverse tunnel, no public exposure
ssh -R 4873:localhost:4873 <host>
npm i -g @leclabs/<cli> --registry http://localhost:4873
```

This is the strongest available parity short of publishing: same registry protocol, same resolver, same
`npm i -g`, same `workspace:*` → concrete-range rewriting on publish. It also exercises the publish path
itself, which would have caught the broken `changeset publish` described in §5.

**A second option, no daemon:** `git+ssh://` against the monorepo, with a `prepare` script so npm builds
on install. Weaker — it needs each package to be independently installable from a repo subdirectory,
which a monorepo does not give you for free.

**Sequencing decision (operator's, adopted):** defer remote-fleet distribution. Verdaccio is the target
mechanism when it is needed and should not be re-litigated then; but it is *not* a prerequisite for the
work that matters now. Local development parity via `pnpm add -g .` plus `tsup --watch` is the focus,
because it is where the architecture is actually validated — and because the capability-declaration
defect (§3) and the canon-build defect (§1) must be fixed regardless of how bits reach a remote host.

## 8. Method

`DESIGN → SPEC → EXECUTE`. This document is the design. Execution shards are authored only after it
settles, and cite it. No primitive-by-primitive editing before the target is frozen.
