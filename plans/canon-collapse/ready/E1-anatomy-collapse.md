# E1 · anatomy-collapse ⚡ FOUNDATION

**Slice** ENGINE · **Wave** 0 · **Deps** none · **State** ready · **Executor** mav

## Starting state — do NOT be surprised (read first)

The working tree is a **deliberate, directionally-correct partial illustration**, NOT a clean checkout — the
Operator hand-edited it to show the target shape. It is **intentionally, partially broken: `pnpm typecheck` is
RED, and that is EXPECTED.** Do not diagnose the red as a bug or revert toward the old shape. Your job is to
realize the intent and **make the tree green as the FIRST step**, then do the type contract below.
- **INTENT already present (complete it):** `persona:` plain string on agents (nico done; others `''`);
  `provenance: {mark}` inlined; `autonomy:` composed array; `base.ts` gutted; roster = 10 agents
  (`boswell`/`cognizant` gone, `boz` added); `simplicity`/`green-field` principle cells added.
- **SCAFFOLD to discard (not the target):** `nico.ts`'s `nicoResolved` block + WIP comments; a `Standing` type
  import that does not exist (the standing is an Autonomy value); leftover partial persona cells. Delete/replace
  these per the spec — do not preserve them.

## Objective

Collapse the `Fragment` machinery in `agent-forge` to the MODEL shape (`body=⟨α,residue⟩`) and eliminate
`ResolvedAgent` **repo-wide**. Ship a codemod so the repo stays green. `.ts` source only.

## Spec

1. **Fragment → per-organ branded string.** Replace the `{organ,slug,definiens,<O,G,C,A>,mark?}` object with a
   nominal-branded string per organ: `type Autonomy = string & { readonly __organ?: 'autonomy' }` (and the 23
   peers). A value is `export const x: Autonomy = '<residue σ* expression>'`. No `organ`/`slug`/`definiens`
   fields; no per-value phantom metadata.
2. **Metadata per organ only.** Keep `ANATOMY` (axis/kind/arity keyed by organ) as the single home; drop the
   per-value `MetaOf` restatement.
3. **provenance is not a branded-string value.** `Agent.provenance = { mark: Mark } | null`. Remove the
   `Provenance` fragment kind. `Mark = {emoji,hue}` stays structured (hue drives color).
4. **Agent shape:** `autonomy: readonly Autonomy[] | null` (composed set, D5); `memory` nullable (D4);
   provenance per (3); **`persona: string`** — a plain identity description, NOT a fragment (D13; remove the
   `Persona` fragment type + persona from the fragment-organ catalog, as with `Provenance`); NO `ResolvedAgent`.
5. **Eliminate `ResolvedAgent` repo-wide (B4).** Remove: the anatomy type; `codegen.ts:255` emission of
   `${name}Resolved`; the `agentBody(a: ResolvedAgent)` signatures in `adapters/claude/anatomy.ts` AND
   `adapters/codex/anatomy.ts`; the toolkit consumers `project-cli.ts`, `project-cli-codex.ts`. Move projection
   (mark→color via `markToColor`, `personaToDescription`, `## Memory/Persona Protocol` + `{name}` substitution)
   into the adapters, derived from the `Agent` vector.
6. **SkillCell / HookCell collapse (D9).** Same MODEL realignment for the other Kinds:
   - HookCell: drop `kind` (restates the type), merge `id`/`slug` into one anchor (they're the same string =
     filename), `definiens`→residue. Keep `events`/`command`/`timeout`/`workers` (behavior/bytes, not σ\*).
   - SkillCell: drop the mutually-derivable `name`/`verb`/`trigger` down to the one that isn't recoverable from
     the filename (trigger is `/`+name; verb often == name), `delineation`→residue-tight, drop empty
     `formalBlock`. Keep `body`/`composition` (procedural content, not a σ\* residue).
7. **Green-keeping codemod (deliverable).** A script that rewrites every existing `organs/**/*.ts` value from
   `{organ,slug,definiens}` → bare branded string with `residue := <old definiens verbatim>` (and the
   analogous mechanical strip for skill/hook structural fields). Runs as part of E1 so the repo typechecks the
   instant the types change. (`O*`/`S*`/`H*` later reduce verbatim→true residue.)

## Acceptance (falsifier)

- FAIL if any organ value must still be a `{organ,slug,definiens}` object to typecheck.
- FAIL if `grep -rn 'ResolvedAgent\|Resolved:' packages/` is non-empty after the task, OR if `pnpm codegen`
  regenerates a `*Resolved`.
- FAIL if `Agent.provenance` accepts anything but `{mark}|null`, or `Mark` collapses to a bare emoji string.
- FAIL if a SOUL cannot be projected from the `Agent` vector alone through EACH adapter (drive one agent → claude
  and codex).
- FAIL if the codemod leaves the repo red: `pnpm -w typecheck && build && test` must be green immediately after
  E1 (type change + codemod together).

## Return

New anatomy types · the ResolvedAgent-elimination grep-proof · the codemod + its run output · one SOUL projected
from a vector through both adapters · whole-repo gate transcript.
