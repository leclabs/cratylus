# Build-time steps go through the build-time CLI — canon stops reimplementing `project`

> **Operator ruling, 2026-08-05.** Root scripts that represent behavior rightly exposed by the CLI
> must be expressed as **proxies through it**. `canon:project:<harness>` convenience aliases are fine
> **only** as proxies. This generalizes to every such command, not just projection.

## Intent

Make this repository a consumer of its own shipped commands, and delete the private duplicates.

## What the census established

`cratylus project --harness <name> --out <dir>` **already exists**
(`packages/forge/src/cli/index.ts:48`, `commands/project.ts`). The option the operator asked
for is already the interface.

Canon nevertheless ships two private CLIs that bypass it:

| file                               | difference                |
| ---------------------------------- | ------------------------- |
| `src/toolkit/project-cli.ts`       | `adapterByName('claude')` |
| `src/toolkit/project-cli-codex.ts` | `adapterByName('codex')`  |

**They are the same program differing by one string, and the corpus already paid for it.** The codex
file's own header records the cost: it once reimplemented the pipeline, _"drifted exactly once and
shipped SESSIONLESS runtime shims to every codex-projected skill for the life of the divergence."_
That is the DRY defect with a receipt.

`cratylus project` cannot run here today because **there is no `agents.config.ts`** anywhere in
the repository, and the command exits 1 without one. That is the real finding underneath the
duplication: the corpus that defines the design is not a consumer of the command that projects it, so
the shipped consumer path has never been exercised by its own author.

The same shape holds one step later — the root's `canon:deploy*` scripts invoke
`node packages/forge/dist/cli/index.js`, reaching **past** the `forge` bin into a build
artifact by path.

## Constraints

- **`ARCHITECTURE.md` is ground and was corrected first**: build-time entry is `forge`,
  run-time entry is the `runtime` bin that `invoke` ships. Do not merge them — they are the
  build-DAG/runtime-DAG seam, the same decomplection `RuntimePlugin`/`AgentPlugin` already makes.
- The `agents.config.ts` this adds is a **real config for this corpus**, not a fixture. It must
  express what `canon:project` expresses today: canon's plugin, projected whole, hooks included.
- Do not subset the plugin set per harness. The codex file's header records why in full: a build step
  that decides what the design IS is the projection silently editing the canon.
- `.render-ts` and `.render-ts-codex` stay separate, stay gitignored, and keep their current paths —
  the oracle is keyed on them.

## Outputs

- `agents.config.ts` at the repository root.
- Root `package.json`: `canon:project` and `canon:project:codex` as **proxies**; `canon:deploy*`
  reaching the `forge` bin rather than a `dist/` path.
- `packages/canon/src/toolkit/project-cli.ts` and `project-cli-codex.ts` **deleted**.
- Any citation of the deleted paths updated — `command-veracity` will convict the stragglers.

## Acceptance

**The render oracle is the whole proof.** After `pnpm canon:project && pnpm canon:project:codex`:

```
find packages/canon/.render-ts packages/canon/.render-ts-codex -type f | sort | xargs shasum | shasum
```

1. → `fe084dd1d531948979dc386713c3f688c96088ab`, **unchanged**. Byte-identical output from the CLI
   path is the proof the private path carried no behaviour the shipped command lacks. A different
   hash is a REAL difference — find it, do not re-baseline to make this pass.
2. `find packages/canon/src/toolkit -name 'project-cli*.ts'` returns **nothing**.
   (Pre-state: two files. The control fails today.)
3. Neither root script contains `tsx src/toolkit/project-cli` or `dist/cli/index.js`.
4. `pnpm test --force` green, 9 tasks, none cached.
5. `pnpm canon:project:codex` exists as a root script and works — the asymmetry that made the oracle
   half a proof is gone.

## The refusal clause

If the oracle moves and the difference turns out to be **behaviour the private CLI had and
`cratylus project` lacks**: **STOP and report it.** That is a missing capability in the shipped
command, which is a far more valuable finding than a green tree — and closing it by re-baselining the
hash or by keeping the private CLI would bury it. A workaround here is a design decision and that is
not yours on this task.
