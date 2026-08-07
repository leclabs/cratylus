# Cratylus — the command surface

> **Status: PROPOSAL, second draft.** The first draft was reviewed and returned
> **reject-and-redesign**; this is the redesign. What changed and why is in §8, kept rather than
> quietly overwritten — a proposal that hides its own rejected version teaches nothing.
>
> Grounding: an audit of the current CLI and package seams at `2b15faaa` found **29 divergences**
> between what the help claims and what the code does — recorded in [`AUDIT.md`](./AUDIT.md) and
> cited inline where they motivate a change. Prior-art claims are **measured**, not recalled; the
> commands that produced them are given.

---

## 1. What cratylus is

**Author agent semantics once; realize them on any harness.**

You describe agents, skills and rules as a **corpus** of signified primitives. Cratylus projects
that corpus onto whatever harness you actually run — Claude Code, Codex, others — deterministically.
The corpus is data; the projector is a pure function of it; the harness is a target, never the
source of truth.

| package             | concern                                                                |
| ------------------- | ---------------------------------------------------------------------- |
| `@cratylus/forge`   | **projection** — resolve a plugin set, render it per harness, place it |
| `@cratylus/runtime` | **mechanism** — the capabilities deployed artifacts call back into     |
| `@cratylus/canon`   | **meaning** — an opinionated corpus, extended or replaced by yours     |

## 2. The model, and the one thing it is not

**Cratylus ships no corpus of its own.** The projector holds no opinion about what an agent is;
`@cratylus/canon` is a corpus you install and name, exactly as an ESLint user installs and names
`@eslint/js`. This is the load-bearing constraint, and the first draft broke it — see §8.

**Agents are beings, not project assets** — the same individual across projects and harnesses.
Worth stating precisely, because the first draft over-claimed here too: what the model guarantees
is that a being's **memory-home is single, harness-independent, and outside every projected
Target** (`MODEL.md`, `SelfAuthored{SEM,PROC,EPIS} ∉ Target`). Continuity already holds today and
needs no config to hold. What a user-level setup buys is **not retyping the corpus per project** —
ergonomics, and real, but not ontology.

## 3. Install

Cratylus follows the standard Node CLI shape: **the tool may be global; the content is always
local.** That is not our invention — it is ESLint's documented rule, verbatim:

> "It is also possible to install ESLint globally, rather than locally… However, this is not
> recommended, and any plugins or shareable configs that you use **must still be installed locally**
> even if you install ESLint globally."

So the corpus is an ordinary dependency of the directory holding your config, resolved by ordinary
Node rules. **There is no cratylus resolution mechanism, and there must not be one** — npm and pnpm
already are the package manager.

```sh
npm i -D cratylus @cratylus/canon      # in your project
npx cratylus init
npx cratylus deploy
```

> **Proposed, and it is the change that unblocks everything.** Today the bin ships inside
> `@cratylus/forge`, a second bin `cratylus-run` ships inside `@cratylus/invoke`, and
> **`@cratylus/canon` is not published at all** (`.changeset/config.json` `ignore` — `npm view` →
> 404). There is currently no way for anyone to install a working cratylus. The unscoped name
> `cratylus` is free (registry 404, measured).
>
> `cratylus` becomes a lean package declaring **both bin keys** — `cratylus` and `cratylus-run` —
> and depending on `forge` + `runtime`. One install, two commands, and the seam `ARCHITECTURE.md`
> argues for stays intact (§8, item 3).

## 4. User stories

### 4.1 "Set up my agents in this project"

```sh
npm i -D cratylus @cratylus/canon
npx cratylus init          # writes cratylus.config.ts naming the corpus
npx cratylus deploy
```

`init` writes:

```ts
import canon from '@cratylus/canon';
import { defineConfig } from '@cratylus/forge/config';

export default defineConfig({ extends: [canon], patches: [] });
```

**With no config, cratylus refuses and names the fix.** It does not guess a corpus. A wrong
bundler default breaks your build loudly; a wrong _corpus_ produces an agent that behaves subtly
not-as-meant and nothing reports it — so the corpus is always named by you.

Measured, because the first draft asserted the opposite: `eslint@10.8.0` with no config **refuses**
("couldn't find an eslint.config.(js|mjs|cjs)"); `vite@8.2.1 build` with no config **succeeds**.
Cratylus is on ESLint's side of that split, and further along it.

### 4.2 "My agents should follow me across projects"

The user-level home is **a normal npm project** — nothing cratylus-specific:

```sh
mkdir -p ~/.config/cratylus && cd ~/.config/cratylus
npm init -y && npm i cratylus @cratylus/canon
npx cratylus init
npx cratylus deploy --scope user
```

**Scope selects the config; it never cascades.** `--scope user` reads the user config and ignores
any project config; `--scope project` reads the project's and ignores the user's. No merge, no
precedence chain. A cascade would make a repository's projection depend on whose `$HOME` ran it,
and the Target is required to be `REGENERABLE` — this repo byte-compares its own render oracle to
prove it.

### 4.3 "Show me what would happen first"

```sh
cratylus deploy --dry-run
```

Prints every file that would be written **and every file that would be deleted**.

> Today `deploy` prunes files and unregisters `settings.json` hook entries, and **no help string
> mentions either** (#5); it writes `$HOME/.cratylus-run.json` unmentioned (#6); and `--dry-run`
> still copies `--assets` into the render tree (#11). Those are defects independent of this
> proposal.

### 4.4 "Is what's deployed still what the corpus says?"

```sh
cratylus deploy --check
```

Exits 0 in sync, 1 on drift, 2 when it could not reach a verdict.

> This verb exists today and answers the question correctly; its problem is purely that it demands
> `--agents-dir`, `--skills-dir` and `--hooks-dir` by hand. **Default all three from the render
> root**, and it becomes a one-word command. That is the whole fix — the first draft proposed a new
> `doctor` verb subsuming four existing surfaces to solve a flag-ergonomics problem (§8, item 4).

### 4.5 "Use someone else's corpus"

```sh
npm i @acme/corpus
```

```ts
import acme from '@acme/corpus';
export default defineConfig({ extends: [acme] });
```

**Install, then import.** No `add` command: neither ESLint, Vite nor Jest has one, and ours does
regex surgery on your hand-authored TypeScript, resolves nothing, and installs nothing (#26). A
tool that can only edit source _it wrote itself_ is a closed loop, not a feature.

### 4.6 "Is my corpus valid?"

```sh
cratylus validate
```

Answers whether the resolved corpus is **acceptable** — every declared symbol round-trips, every
cell is canonical.

> **The genuinely missing verb, and neither the current CLI nor the first draft had it.** `ENGINE.md`
> names `validate` a pipeline stage; the signification gate that implements it is reachable only
> from canon's private tooling. A third party authoring a corpus has no shipped way to ask whether
> their cells are canonical — for a project whose thesis is that anchors _earn_ canonical status
> through evidence, that is the largest absence on the surface.

### 4.7 "Why is this the way it is?"

```sh
cratylus catalog [filter]    # what exists to extend — pre-composition
cratylus explain [filter]    # how the resolved set came to be — post-composition, --json
```

> `compose` is **deleted, not renamed**: its output is a strict subset of `explain`'s, and its
> `--dry-run` never affected behaviour under any flag (#1, #2). An inert flag on a redundant verb is
> the verb reporting that it has no concept of its own.
>
> Both positionals are named `agent` today and **neither filters agents** — they substring-match
> fragment IDs (#14, #15). Renamed to `[filter]`.

### 4.8 "Runtime capabilities"

```sh
cratylus-run memory encode --name mav --body '…'
```

Deployed skills call this; you rarely type it. It stays a **separate command**, shipped by the same
package — see §8, item 3.

---

## 5. Proposed root `--help`

```
cratylus/1.0.0 — author agent semantics once, realize them on any harness

Usage
  $ cratylus <command> [options]

  Requires cratylus.config.ts naming a corpus. `cratylus init` writes one.

Commands
  init                 Write an cratylus.config.ts naming a corpus
  catalog [filter]     What the extended corpora offer
  explain [filter]     Where each resolved value came from
  validate             Does the resolved corpus meet the acceptance criteria?
  project              Render the resolved corpus into a render tree
  deploy               Place a render tree into a harness  (--check audits it)

Options
  -c, --config <path>  Config file (default: nearest cratylus.config.ts)
      --harness <name> Target harness — required; no default is guessed
      --scope <scope>  user | project   (selects which config, never merges)
      --dry-run        Print what would change; write nothing
  -h, --help           Help for any command:  cratylus deploy --help
  -v, --version        Print the version

Runtime capabilities are reached through `cratylus-run` — see `cratylus-run --help`.
```

Six verbs, MECE across **configure / discover / inspect / gate / emit / place**.

| change                                    | why                                                                                  |
| ----------------------------------------- | ------------------------------------------------------------------------------------ |
| header line stating what the program is   | there is none today                                                                  |
| `validate` added                          | §4.6 — the missing pipeline stage                                                    |
| `add`, `compose` deleted                  | §4.5, §4.7                                                                           |
| `optimize` removed from the bin           | corpus **authoring**, not projection; homed in canon's tooling                       |
| `.claude` removed from every description  | `deploy`'s summary hardcodes a harness on a `--harness` command (#3)                 |
| `--harness` required, never auto-detected | an auto-detected harness makes the Target depend on the host, breaking `REGENERABLE` |
| `cratylus-run` named in the root help     | its discoverability was the real complaint behind merging the bins                   |

## 6. What this does not fix, and must

Three closures block the plugin thesis. None is a CLI question; all outrank one.

1. **The harness registry is closed.** `HarnessName = 'claude' | 'codex'` — a third party cannot
   ship an adapter without editing forge. That contradicts VISION's headline, _"realize behavior
   everywhere."_ Adapters should ride the **config** (projection), not the corpus plugin (meaning).
2. **The capability keyspace is closed.** `CAPABILITIES` is a fixed 4-tuple in the runtime. Of its
   members one is a real plugin, two are hardcoded string intercepts, one has no implementation.
   Canon already solved this one axis over with an open, corpus-owned vocabulary.
3. **`buildPlugin` does not exist.** `ARCHITECTURE.md` and `runtime/src/plugin.ts` describe a
   two-named-export plugin contract; `git grep` returns four hits, all prose. The real contract is
   an unnamed `default` export — and the two-bin argument cites that contract as precedent.

`patches` is also declared and **unshipped**, which means _modify_ — the middle term of
extend/modify/replace — does not work today.

## 7. Still open

1. Does `project` keep a separate verb, or is the render tree always implied by `deploy`? (Kept
   separate here: it is forge's charter operation and this repo commits one as an oracle.)
2. Should `init` be `npm create cratylus` instead, as Vite and ESLint both do?
3. `optimize`'s destination — canon tooling is proposed; its sign is also wrong wherever it lands.

## 8. What the first draft got wrong

Kept in full, because the errors are more instructive than the corrections.

1. **A built-in default corpus.** §4.1 proposed cratylus using canon when no config exists. That
   fuses **meaning into projection** — the exact defect the package split exists to prevent — and
   composed three implicit defaults (corpus + destination + harness) into one bare verb that writes
   into your home directory. Not zero-config; zero-consent.
2. **A false prior-art claim, load-bearing.** It asserted zero-config works "the same way `eslint`
   runs with a default ruleset." **ESLint refuses without a config** — measured. The proposal cited
   the one tool that had already faced this question and decided it the other way. `@eslint/js` is
   not even a dependency of `eslint`.
3. **Merging the two bins on a mismeasured argument.** ARCHITECTURE's objection is _install
   closure_, not startup cost. `await import()` defers **evaluation**, never **installation** — the
   hub must still declare both dependencies, so a run-only host still downloads the projector. The
   before/after startup measurement the draft demanded **would have come back green**, which is
   worse than red. The real problem was packaging, and publishing one package with two bin keys
   solves it without touching the seam.
4. **`doctor`.** A bag, not a concept — its own example spanned four concerns already owned by
   other verbs, and the verb had been deliberately excised once before. The draft cited that
   tombstone as evidence of a gap rather than as a prior negative ruling.
5. **`cratylus.config.ts`.** Taking the industry convention without testing it. The discriminator
   is tool-named for _tool behavior_, domain-named for _domain content_ — and `tsconfig.json`,
   in this repo's own root, is named for the domain rather than for `tsc`. Survival test: replace
   the projector tomorrow and `cratylus.config.ts` is still true. (Recorded residual: the file governs
   fragments, agents, rules and skills, so `corpus.config.ts` is arguably nearer still.)
6. **Inventing package management.** A later draft proposed a `resolveFrom` build seam and an `init`
   that "establishes a resolution site," to make a globally-installed corpus resolve from a config
   outside any `node_modules`. Measured: it does not resolve — `ERR_MODULE_NOT_FOUND`. But the fix
   is not a mechanism; it is ESLint's rule (§3). The content is a local dependency, and the user
   home is a plain npm project. npm is the package manager.
