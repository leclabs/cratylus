# `agent-cli` names the CLI and ships one of two — the sign is wrong

> Surfaced 2026-08-05 while correcting `ARCHITECTURE.md`, which described this package as _"Forge's
> commands for someone who is not this repository"_. It has no forge dependency and never did.

## Symptom

Three names disagree about one thing:

| name                                       | what it is                                                       |
| ------------------------------------------ | ---------------------------------------------------------------- |
| package `@leclabs/agent-cli`               | claims **the** CLI                                               |
| its `bin` key `agent-runtime`              | claims to be the runtime                                         |
| `@leclabs/agent-forge`'s bin `agent-forge` | the **other** CLI, which the first name implicitly denies exists |

A package named `agent-cli` that ships a bin named `agent-runtime` fails `α(cᵢ) = α(cⱼ) ⇒ D(cᵢ) = D(cⱼ)`
in both directions at once: one concept wearing two signs, and one sign (`cli`) reaching over a
concept it does not cover.

## What the concept actually is

Not "the CLI". The package exists to **break a dependency cycle**, and `bin.ts` says so at length:
every capability package depends on the runtime for its contracts, so the runtime cannot declare the
capabilities; a third package that depends on both wires them by static import, making resolution
succeed by declaration rather than by co-installation accident. It also owns the `bin` key — the one
copy of the bin name no TypeScript can compute.

So the definiendum is something like _the package that composes the runtime with its bundled
capability set and ships it as an installable command_. `cli` names the least specific thing about
it, and the part it does name is the part it shares with `agent-forge`.

## Constraints

- **Run the existence check before naming.** The concept may factor — "the composition root" and "the
  installable entry" may be two things, and if they are, naming them as one is how the next
  palimpsest starts. `⊥ IS A RESULT`.
- **The BIN name is load-bearing on hosts and the package name is not.** Deployed skill shims invoke
  `agent-runtime <capability>`; `RUNTIME_BIN` is imported from `agent-runtime/bin-name` and asserted
  against the manifest by `agent-canon/test/bin-name-single-home.test.ts`. Changing the bin name is a
  migration; changing the package name is a rename. **Do not conflate them** — they are separate
  decisions with different costs, and only the second is cheap today.
- **Nothing is published.** All six packages are `0.0.0` and every one 404s on the registry, so this
  is fully reversible right now and will not be after the first publish. That is what makes this
  worth settling before MVP and not after.
- Occupancy: `runtime`, `forge`, `canon`, `schema`, `memory` are all bound here. `cli` is bound by
  this package and by `agent-forge`'s `src/cli/` directory — a collision that already exists.

## Acceptance

- The package's sign round-trips: a forward argmin, a **blind reverse decode**, and an **occupancy
  check against this repo**. Never mint on forward legs alone, however many agree.
- `ARCHITECTURE.md` and the package's own header agree with the result, in the same act.
- If the answer is that the concept factors, both parts are signified or explicitly returned as `⊥`.
- Whatever lands, a reader given only the package name and its siblings can say which of the two
  entries it ships. That is the test the current name fails.
