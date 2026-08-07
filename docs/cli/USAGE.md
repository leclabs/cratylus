# Cratylus — the command surface

> **Status: PROPOSAL.** This document describes the CLI as it _should_ be, and is the deliverable
> for review. Every section marks what is **today** and what is **proposed**, because a usage guide
> that quietly describes a thing that does not exist is the defect this project exists to prevent.
>
> Grounding: a full audit of the current CLI and package seams was taken at `2b15faaa`. It found
> **29 divergences** between what the help claims and what the code does. They are cited inline
> where they motivate a change.

---

## 1. What cratylus is

**Author agent semantics once; realize them on any harness.**

Cratylus is a plugin-based Node system with a thin CLI over it. You describe agents, skills and
rules as **canon** — signified primitives — and cratylus projects them onto whatever harness you
actually run (Claude Code, Codex, others). The corpus is data; the projector is deterministic; the
harness is a target, not the source of truth.

Three libraries under one command:

| package             | concern                                                                 |
| ------------------- | ----------------------------------------------------------------------- |
| `@cratylus/forge`   | **projection** — resolve a plugin set, render it per harness, place it  |
| `@cratylus/runtime` | **mechanism** — the capabilities deployed artifacts call back into      |
| `@cratylus/canon`   | **meaning** — opinionated default primitives, extensible or replaceable |

The prior art is deliberate: **ESLint** (CLI delegates to a library; config imports plugins),
**Vite** (thin CLI over a Node API, plugins via `vite.config.ts`), **Jest**, **Storybook**.

---

## 2. The mental model

**Agents are beings, not project assets.** They exist out-of-band from any one repository — the
same way a person does. An agent you work with in one project is the same individual in the next:
same identity, same memory, same accumulated craft.

That is why **global install is the recommended path**. A project-local install is for when a
repository wants to pin its own corpus.

| you want                                       | you install         |
| ---------------------------------------------- | ------------------- |
| agents that follow you across projects (usual) | `npm i -g cratylus` |
| a corpus pinned to one repository              | `npm i -D cratylus` |
| to try it once                                 | `npx cratylus`      |

---

## 3. Install

```sh
npm install -g cratylus
cratylus --help
```

> **Proposed, and it is the load-bearing change.** Today there is no `cratylus` package —
> the bin ships inside `@cratylus/forge`, and a second bin `cratylus-run` ships inside
> `@cratylus/invoke`. Worse, **`@cratylus/canon` is not published at all** (`.changeset/config.json`
> `ignore`), so there is currently no way for anyone to install a working cratylus. The unscoped
> name `cratylus` is **free on npm** (verified: registry 404).
>
> `cratylus` becomes a lean composition-hub package depending on `forge` + `runtime`; `forge` keeps
> the library and loses the bin; `@cratylus/invoke` retires.

---

## 4. User stories

### 4.1 "I just want the default agents on this machine"

The whole job, with **no config file at all**:

```sh
npm install -g cratylus
cratylus deploy
```

`deploy` resolves the corpus, renders it for your harness, and places it. With no config,
cratylus uses its **built-in default corpus** (`@cratylus/canon`) — the same way `eslint` runs with
a default ruleset and `vite` builds with no `vite.config.ts`.

> **Proposed.** Today: zero-config is impossible. `deploy` requires `--agents-dir`, `--skills-dir`
> and `--hooks-dir` to be passed by hand, and the two-step `project` → `deploy` is exposed as the
> user's problem. `project` hard-requires `agents.config.ts` in the **current directory** with no
> walk-up (divergence #27).

### 4.2 "Show me what would happen before it touches my machine"

```sh
cratylus deploy --dry-run
```

Prints every file that would be written, **and every file that would be deleted**.

> Today `deploy` prunes files and unregisters hook entries from `settings.json` — and **no help
> string mentions either** (divergence #5). It also writes `$HOME/.cratylus-run.json` on every run,
> mentioned nowhere (#6). A `--dry-run` still copies `--assets` into the render tree (#11).

### 4.3 "Is my setup healthy?"

```sh
cratylus doctor
```

One command answering the questions a user actually has when something is wrong:

```
cratylus doctor

  node            v24.4.0                                    ok
  cratylus        1.0.0 (global, /opt/homebrew/bin)           ok
  config          none — using built-in corpus                ok
  corpus          @cratylus/canon 1.0.0 · 10 agents 16 skills ok
  harness         claude (auto-detected: ~/.claude present)   ok
  deployed        ~/.claude — in sync with the corpus         ok
  capabilities    memory ok · eventTap ok · carryOn ok
  runtime config  ~/.cratylus-run.json — 31 events            ok
```

…and, when it is not fine, the repair on the same line.

> **Proposed; nothing like it exists.** `doctor` survives only as a tombstone in a comment listing
> nine deleted verbs (#29). The nearest thing is `deploy --check`, which answers exactly one
> question and needs three directory flags supplied by hand. This is the single highest-value
> addition: the drift that stranded five hosts in this homelab was invisible precisely because
> nothing answered _"is this host running what the corpus says?"_

### 4.4 "I want to customize my agents"

```sh
cratylus init          # scaffold cratylus.config.ts
```

```ts
// cratylus.config.ts
import { defineConfig } from 'cratylus';
import canon from '@cratylus/canon';

export default defineConfig({
  extends: [canon],
  patches: [],
});
```

Then `cratylus deploy` as before.

> **Proposed rename:** `agents.config.ts` → **`cratylus.config.ts`**, matching every tool in the
> prior art (`eslint.config.js`, `vite.config.ts`, `jest.config.js`). Discovery gains what those
> tools have and this one lacks: **`.ts` / `.js` / `.mjs` / `.cjs`**, a **walk-up** to the project
> root, `-c/--config` to override, and `--no-config-lookup` to disable. Today: one hardcoded
> filename, cwd-only, no walk-up — run a command from a subdirectory and it behaves as if you had
> no config (#27).

### 4.5 "I want to use someone else's corpus"

```sh
npm i @acme/corpus
```

```ts
import acme from '@acme/corpus';
export default defineConfig({ extends: [acme] });
```

That is the whole protocol — **install, then import**. Exactly ESLint and Vite.

> **`cratylus add <plugin>` is proposed for REMOVAL.** Neither ESLint nor Vite nor Jest has an
> `add`. Today it does regex string-surgery on your config source, resolves nothing, installs
> nothing, accepts any opaque string (`cratylus add @scope/pkg@1.2.3` writes an import specifier
> that is valid for npm and invalid as an ES import), and its "already in extends" message is
> emitted after checking only the _import line_ (#26). It reads like `npm add` and does not install.

### 4.6 "Why is this agent the way it is?"

```sh
cratylus explain mav        # provenance: which plugin or patch set each value
cratylus list               # what this corpus offers
cratylus config             # the fully resolved config, after extends and patches
```

> `cratylus config` replaces today's `compose`, whose `--dry-run` flag **has no effect on
> behaviour** — the command never writes under any flag, and the flag's only observable
> consequence is suppressing a note saying nothing was written (#1, #2). The analogue in the prior
> art is ESLint's `--inspect-config`.
>
> `explain [agent]` and `catalog [agent]` both name their positional `agent` and **neither filters
> agents** — both substring-match fragment IDs, and `catalog` ignores the argument entirely in
> `--corpus` mode (#14, #15).

### 4.7 "My deployed agents need to call back into the runtime"

Deployed skills invoke runtime capabilities through the same command:

```sh
cratylus memory encode --name mav --body '…'
cratylus memory session begin --name mav
cratylus event-tap install --events session.start,turn.end
```

> **Proposed: one bin.** Today these live under a second binary, `cratylus-run`, shipped by
> `@cratylus/invoke`. Vite is the precedent the user's intuition already reaches for — its runtime
> (the dev server) is reached through the same `vite` command, not a `vite-run`.
>
> **This contradicts an explicit, argued decision in `ARCHITECTURE.md`**, which says merging would
> mean "one package owns the `bin` key and must depend on **both** DAGs, so a host that only runs
> agents would drag the whole projection machinery." That objection is real and must be answered,
> not waved past. **The answer is lazy loading**: the `cratylus` package declares both dependencies,
> but each subcommand `await import()`s its implementation, so a `cratylus memory …` invocation
> never loads the projector. Vite does exactly this. The cost the architecture feared is a
> _static-import_ cost, and it is avoidable — but the claim must be **measured** (startup time for
> a runtime verb, before and after) before the seam is changed.
>
> **Migration is not free and no test can see most of it.** Renaming touches every deployed host's
> `~/.local/bin/cratylus-run` shim, every `~/.cratylus-run.json`, and every carry-on gate command
> already written into a harness settings file.

---

## 5. Proposed root `--help`

Today's root help has no header — it does not say what the program _is_ — and its first command
is described as "Scaffold agents.config.ts from a plugin package", which does not parse for a
newcomer.

```
cratylus/1.0.0 — author agent semantics once, realize them on any harness

Usage
  $ cratylus [command] [options]

  With no config file, cratylus uses its built-in corpus. Run `cratylus doctor`
  if anything looks wrong.

Getting started
  init                 Create a cratylus.config.ts in this directory
  deploy               Render the corpus and install it into your harness
  doctor               Check this machine's setup and report what is wrong

Inspecting
  config               Print the resolved configuration (after extends and patches)
  list [filter]        List what the corpus offers — agents, skills, rules
  explain <name>       Show where each of a fragment's values came from

Runtime
  memory <verb>        Agent memory: encode, read, consolidate
  event-tap <verb>     Observe harness lifecycle events
  carry-on <verb>      Autonomy elevation and its terminus

Options
  -c, --config <path>  Use this config instead of searching for cratylus.config.*
      --no-config-lookup   Do not search for a config file
      --harness <name>     Target harness (default: auto-detect)
      --dry-run            Print what would change; write nothing
  -h, --help           Show help for any command:  cratylus deploy --help
  -v, --version        Print the version
```

Changes from today, each traceable to a finding:

| change                                    | why                                                                                                 |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------- |
| a header line stating what the program is | there is none today                                                                                 |
| commands grouped by intent                | flat list of 8 verbs with no ordering                                                               |
| `.claude` removed from every description  | `deploy`'s summary hardcodes a harness on a command with `--harness` (#3)                           |
| `--harness` defaults to **auto-detect**   | three code sites default to the literal `'claude'` (#3)                                             |
| `optimize` removed from the root surface  | it is the last surviving verb of a deleted three-verb flow, and is corpus-authoring, not projection |
| `add` removed                             | §4.5                                                                                                |
| `doctor` added                            | §4.3                                                                                                |
| `compose` → `config`                      | §4.6                                                                                                |

---

## 6. Open questions for review

These are genuinely undecided and are the most valuable things to push back on.

1. **Does `deploy` subsume `project`?** A user wants "make it real"; the render tree is an
   implementation detail. But it is also a legitimate artifact (this repo commits one as a render
   oracle). Proposal: `deploy` does both by default; `project --out <dir>` stays for the tree.
2. **One bin or two?** §4.7. The lazy-loading answer needs a measurement, not an argument.
3. **Should `init` exist at all?** Vite uses `npm create vite`; ESLint uses `npm init @eslint/config`.
   With zero-config working, `init` is only for customization — which may not warrant a verb.
4. **What is the corpus's package identity once published?** `@cratylus/canon` must be published for
   any of this to work. Should the default corpus instead be a dependency _of_ `cratylus`, so
   `npm i -g cratylus` brings it — making §4.1 literally true with one install?
5. **`optimize` — where does it go?** It gates LLM-authored exemplify plans. That is corpus
   authoring, not projection.

## 7. What this document does not cover

The plugin **contract** needs its own pass, and two findings from the audit make it urgent:

- **The documented build-face export does not exist.** `ARCHITECTURE.md` and `runtime/src/plugin.ts`
  both describe a two-named-export contract — `buildPlugin` and `runtimePlugin`. `buildPlugin`
  appears **only in prose**; no package exports it and no consumer imports one. The real contract is
  an unnamed `default` export.
- **The capability keyspace is closed.** `CAPABILITIES = ['memory','eventTap','carryOn','heartbeat']`
  is a fixed tuple in `runtime/src/loader.ts`. A third party **cannot add a capability** without
  editing the runtime — which contradicts "plugin-based, extensible by third parties". Of the four,
  one has a real plugin (`memory`), two are hardcoded string intercepts before any host exists
  (`eventTap`, `carryOn`), and one has no implementation at all (`heartbeat`).
