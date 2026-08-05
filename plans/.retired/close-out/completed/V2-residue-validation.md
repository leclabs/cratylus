# V2 · residue-validation

**Objective.** `memory rollover --residue` must refuse malformed input loudly instead of silently
writing a record whose body is a wrapper object. This verb exists so forward state is not lost; it
currently loses it a different way.

## The defect, measured

`packages/memory/src/cli.ts:978` — `store.encode({ body: body as JsonValue }, …)`. The cast is
a naked assertion: `JsonValue` (`record.ts:41-47`) admits objects, so passing `[{"body":"x"}]` — the
natural shape, since that is what a record looks like — type-checks and produces a record whose body
is `{"body":"x"}`. `assertRecord` (`record.ts:71-87`) only checks `'body' in r`, never the value's
shape. Exit 0, `rollover: N residue record(s) re-encoded`. The corruption is invisible until
something reads the store and finds a dict where prose should be.

**The ambiguity that causes it is three docstrings that disagree**, and the agent is never told it
guessed wrong:

| source                                        | says                                   |
| --------------------------------------------- | -------------------------------------- |
| `packages/memory/src/cli.ts:935`              | "the **records** to re-encode"         |
| `packages/memory/src/cli.ts:972` (error text) | "a JSON array of **record bodies**"    |
| `packages/canon/src/skills/dream/skill.ts:23` | `--residue '<json>'` — no shape at all |

The passing test `packages/memory/test/cli.test.ts:670,681` pins bare strings, so bare strings
are the contract.

## Inputs

`packages/memory/src/cli.ts:930-985` · `packages/memory/src/record.ts:41-87` ·
`packages/memory/test/cli.test.ts:660-690`

## Constraints

- Reject, do not coerce. A wrapper object is a caller bug and silently unwrapping it hides the bug in
  the next caller.
- Name the double-wrap specifically in the error — `{body: …}` is the shape callers actually pass, so
  the message should say so and show the wanted shape.
- **`dream/skill.ts` is V3's output, not yours.** Do not edit it; V3 carries the `--residue` shape
  into the cell.

## Outputs

`packages/memory/src/cli.ts` · `packages/memory/test/cli.test.ts`

## Acceptance

1. `memory rollover --residue '[{"body":"x"}]'` exits non-zero with a message naming the index, the
   received type, and the required shape. **Assert exit code and message text.**
2. `memory rollover --residue '[1]'` and `'[null]'` likewise rejected.
3. `memory rollover --residue '["carry this forward"]'` still succeeds and yields
   `body === 'carry this forward'` (the existing test must still pass unchanged).
4. The negative test **fails on the pre-state** — confirm by running it before the fix.
5. Both docstrings at `cli.ts:935` and `cli.ts:972` state the same thing: bodies, as bare strings.
