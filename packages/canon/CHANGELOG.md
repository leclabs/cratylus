# @cratylus/canon

## 0.1.2

### Patch Changes

- 805d19b: ρ(`formality-definiens`) = human — a value that governs the operator's prose is written in it

  An operator reported that both agents' check-ins "obfuscate important information within
  high cog, high verbosity, fragmented prose." The cause was `formality: formal ⟨terse ·
dense · symbol-bearing⟩`, carried by mav since 2026-06-24 and by nico since. `expansive`
  was not the repair: it negates the glyphs and pays for it with `unhurried`, licensing the
  volume the register was meant to cut.

  **COMPREHENSION WAS NEVER THE GAP.** The first attempt minted `plain ⟨prose · economical ·
¬symbol-bearing⟩` and it barely moved: measured on `omp/18.1.17` / `claude-opus-5:high`,
  one probe, n=3, scoring the share of reply lines that are bullets, headings, or numbered
  items, the baseline was 0.69 and the new value scored 0.73. Loading the residue with the
  full clause set reached 0.45 at best and 0.81 at worst. Asked to quote its own `formality`
  value, the same session returned it byte-for-byte with every glyph intact — so the value
  was parsed, stored, recitable, and disobeyed. A declaration whose own surface contradicts
  its content does not bind emission, however well the model reads it.

  Relocation was tested too, and it is not the driver: the whole declaration loaded through
  omp's personality slot instead of `--append-system-prompt` scored 0.71 against 0.69 for
  the append carrier, inside the noise band.

  **THE RULING.** ρ binds on `readers(a)`. Every other dimension's definiens is read by the
  model about the model, but a `formality` value's referent IS the text the operator reads,
  so the register it must be written in is the register it describes. `llm-native` already
  said so — `register-resolution ∉ signifier-derivation`: register resolves from the reader
  of what a value GOVERNS, never inherited from the notation its siblings are signified in.
  `formality-definiens` is therefore split out of `dimension-definiens` as ρ=human, and the
  whole five-member repertoire — `casual`, `neutral`, `plain`, `formal`, `expansive` — is
  rewritten as prose. Shipped configuration measures 0.22 (n=4, range 0.17–0.27), with zero
  notation glyphs in the reply.

  **BOTH GATES NOW READ ρ INSTEAD OF ASSUMING IT.** AC-RESIDUE's governing invariant already
  reads "every deployed artifact THE MODEL READS is formal σ*, never human prose — under ρ",
  so it consults `RHO` rather than treating every dimension value as a σ* payload; the
  density gate's unclaimed-class assertion narrows to ρ=LLM, the exemption its own header
  already grants `readme` and `human-doc`. One table, two gates, no drift.

  **AND THE RULING BITES.** `conform` exempts ρ=human, so the declaration alone would have
  let a value regress to σ* silently. The new leg gates formality by AC-RESIDUE's own
  predicate INVERTED — every ρ=human dimension value must be inadmissible as σ*, proving it
  is prose. `registerOf` is the wrong instrument and was tried first: it witnesses the
  tutorial-gloss register (hedges, second person, first-person walkthrough), which is a
  defect signal rather than evidence of prose, and clean prose carries none of those markers.
  Verified non-vacuous by reverting `formal` to its σ\* form and watching the leg convict it.

  mav also regains `llm-native`, dropped in `f7cf5d58`. Its `¬human-prose` clause is guarded
  by `reader = LLM ⟨¬inferred⟩` and so never reaches an operator reply; excluding the
  principle on that basis read the clause outside its own guard.

- 805d19b: omp launcher resolves its own path through symlinks

  `omp-launch` computed `dirname "$0"` and passed `--config <that dir>/omp.yml`.
  Linked into a `PATH` dir - the one way an operator runs a persona by name - `$0`
  is the link, and omp refused to start: `Config overlay not found:
~/.local/bin/omp.yml`. The script now walks `readlink` to the real file before
  resolving its directory, with hops capped so a link cycle fails instead of
  hanging.

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
