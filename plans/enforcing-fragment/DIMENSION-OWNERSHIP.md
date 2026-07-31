# The dimension catalog belongs to the corpus — design, ready to execute

> Working handle, **not** an anchor. Reader = LLM.

## Where this stands

`ANATOMY` is now the SINGLE source of the dimension set (`b8e8c7b`): `Dimension`, `SetDimension`,
`DIMENSION_FIELD` and the `Agent` fields all derive from it, and `guardrails`' non-nullability moved
from a hand-written exception into `required: true` catalog data. Four hand-kept copies are gone.

**What remains is ownership.** That single source still lives in `agent-forge` — the projection
package — so a corpus cannot discover a new dimension without editing the projector. This inverts
the thesis at its most load-bearing point: the canon is supposed to be the design discovered from
the model's concept space, and its vocabulary is currently capped by a TypeScript union in the
harness layer.

## The seam, cold-derived

Forge owns the **meta-model**: that a dimension HAS an axis, a kind, an arity, and a requiredness —
and all the machinery that operates on any catalog obeying that shape.

The corpus owns the **instance**: WHICH dimensions exist, and what each one's metadata is.

A projector that knows there are exactly 22 dimensions named these 22 things is not projecting a
design — it contains one.

## Measured, so the next session does not re-measure

|                                                      | count | nature of change                                   |
| ---------------------------------------------------- | ----- | -------------------------------------------------- |
| forge files naming `Dimension`                       | ~9    | real work: generics or structural typing           |
| canon files importing `@leclabs/agent-forge/anatomy` | 178   | mechanical: import-path rewrite, scriptable        |
| new canon modules                                    | 1     | `src/anatomy.ts` — the catalog + its derived types |

The 178 is the intimidating number and the easy half. The ~9 is the design work.

## Approach

1. **Forge keeps the meta-model and goes structural internally.** Its machinery needs "a vector of
   dimension → value(s)", not the 22 names. `DIMENSION_NAMES` is already read off `ANATOMY` at
   runtime; make that an injected catalog, the way `validate/policy.ts` already takes its `Policy`
   (that seam exists and is correctly empty of doctrine — follow it, do not invent a second shape).
2. **Canon declares `src/anatomy.ts`** — its `ANATOMY` const plus the derived `Dimension`, `Agent`,
   `Value<D>` and the 22 `Guardrails`/`Role`/… aliases, using forge's generic helpers.
3. **Rewrite the 178 imports** from `@leclabs/agent-forge/anatomy` to canon's own anatomy. One sed,
   then `tsc`.

## Hazards, named

- **Do not half-parameterize.** Moving the type while leaving the runtime catalog behind (or the
  reverse) is worse than moving neither: the half that still works produces plausible output that
  masks the half that does not. Land the read and the write together.
- **The guardrails catch-all must keep convicting.** Verify it directly, and verify the VERIFIER:
  a loose file under `src/` is not in the build's include set, so a "no error" result there is a
  claim about the command until a deliberately-broken control proves tsc read the file at all.
  Both legs matter — the property missing AND the property null.
- **Both renders must stay byte-identical.** They are the regression oracle for this whole refactor;
  nothing about ownership should change an emitted byte.

## Completion criterion

`agent-canon` declares a dimension its own `src/anatomy.ts` does not share with `agent-forge`, and
the projection accepts it with no edit to `agent-forge`. Measured by adding a throwaway dimension
and projecting, not by the suite passing.
