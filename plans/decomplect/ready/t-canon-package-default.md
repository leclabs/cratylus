# The projector names one corpus as the default design, and `init` offers no way out

> Census: [`CENSUS-2026-08-05.md`](../CENSUS-2026-08-05.md). Every number below was measured,
> not quoted forward.

## Intent

`forge/src/config/scaffold.ts:20` — `export const CANON_PACKAGE = '@cratylus/canon';`, interpolated
into `SCAFFOLD_SOURCE` at `:24`. `cratylus init` takes `{ cwd }` only
(`cli/commands/init.ts:28-42`), and its own header (`:13-18`) records that `--scope` was **removed**
as the last option. So every scaffolded project extends this corpus by construction — the projector
deciding what the design IS, which is exactly what ARCHITECTURE forbids it.

## Measured — and it is pinned

7 sites: 1 declaration, 1 interpolation, 1 re-export (`config/index.ts:14`), 2 README lines, and
**2 test assertions**:

- `forge/test/config/scaffold.test.ts:27` — `expect(src).toContain("import canon from '@cratylus/canon'")`
- `forge/test/cli/cli.test.ts:32` — identical

**The same shape as property 1's counter-gate**: a test requires the thing the repair removes. Unlike
property 1 this one is small and the amendment is obvious — but it must be a deliberate act, not a
casualty.

## Constraints

- A default is legitimate; **an unoverridable** default is the defect. Restoring an override may be
  the whole fix.
- `init.ts:13-18` records WHY `--scope` was removed. **Read that warrant before undoing it** — a
  decision taken without reading the warrant for the status quo is how this plan already lost time.

## Acceptance

- A project can be scaffolded against a corpus that is not this one, proven by a test.
- The two pinned assertions are amended deliberately, in the same commit, with the reason stated.
