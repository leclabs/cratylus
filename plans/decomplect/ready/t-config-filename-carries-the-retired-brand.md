# `.agent-factory.config` — a user-facing filename still wearing the retired brand, in two homes

> Surfaced 2026-08-05 during the pre-publish privacy scan, after the scope rename and the bin
> migration had both landed. Everything else stopped saying `agent-factory`. This did not, because it
> is a **filename on a user's disk**, and nothing in the tree greps for it as a brand.

## Symptom

Two independent literals, plus an environment variable and a tracked example:

| site                             | literal                                                         |
| -------------------------------- | --------------------------------------------------------------- |
| `memory/src/cli.ts:221`          | `existsSync('.agent-factory.config') ? '.agent-factory.config'` |
| `memory/src/strategy.ts:132-133` | the same expression, independently written                      |
| both files                       | `$AGENT_FACTORY_CONFIG`                                         |
| `.agent-factory.config.example`  | tracked, and named for the retired project                      |

Roughly a dozen further doc-comment references across `memory/src/{audit,node,cli,strategy}.ts`,
`runtime/src/ports/memory.ts` and `forge/src/config/config.ts`.

## Why it survived two renames

The scope rename swept package specifiers and paths. The bin migration swept the executable name and
everything template-derived from `RUNTIME_BIN`. This is neither: it is a **dotfile a user creates in
their own repository**, so it appears in source only as a bare string in an `existsSync` call. It
matches no import specifier and no bin key, and `bin-name-single-home.test.ts` is scoped to the bin.

It is also the same _shape_ of defect as the shell fallback in
`pending/bin-name-gate-stops-at-the-language-boundary.md`: a brand-carrying identifier that leaves
the region any existing gate watches.

## Why it is publish-blocking

A config filename and an environment variable are **user-facing contract**. After first publish,
someone has a `.agent-factory.config` on disk and renaming it is a breaking change with a migration
path. Before first publish it is free. That is the same window the packages were renamed in, and it
closes at the same moment.

## The name is NOT derived — do not assume one

`.cratylus.config` is the obvious guess and it has not been run through the round-trip. Two questions
have to be answered first, and they are design questions, not renames:

1. **Is this the same concept as `.cratylus-run.json`?** The runtime already has a host config
   dotfile, derived from `RUNTIME_BIN`. This one carries fleet topology, per-host `$HOME` maps and
   `memory.scopeMarkers` — repo/fleet facts, not runtime provider selection. If they are two
   concepts they keep two names, and each name must say which. If they are one, they merge, and that
   is a larger change than a rename.
2. **Whose config is it?** It is read by `memory` but describes the _repository and the fleet_. A
   name derived from the capability that happens to read it would be wrong.

## Constraints

- **One home.** Today the literal is written twice, in `cli.ts` and `strategy.ts`, with the same
  precedence chain (`--config` > env > cwd-present > none) duplicated alongside it. Whatever the new
  name is, it lands as a single exported constant and the precedence chain collapses to one function.
  Renaming two literals to two new literals repeats the defect at a new name.
- The env var moves with the file — they are the same sign in two dialects.
- `.gitignore` and the tracked `.example` follow.
- The example's fleet hostnames were sanitized to generic placeholders in the same act that filed
  this; do not reintroduce real ones.

## Acceptance

- The dotfile name and the env var each have exactly one home in source, and the precedence chain is
  written once.
- The sign round-trips: forward argmin, **blind reverse decode**, occupancy check — including against
  `.cratylus-run.json`, so the two dotfiles do not read as variants of one thing unless they are.
- `grep -rn 'agent-factory' packages/*/src` returns nothing.
- Render oracle unmoved, or a deliberate re-baseline argued in the commit.
- If the answer is that the two configs are one concept: **STOP and report.** That is a merge, not a
  rename, and it is a design decision.
