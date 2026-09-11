# @cratylus/canon

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
