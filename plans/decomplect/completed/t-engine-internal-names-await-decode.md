# A second owed-signification marker, and the census's grep could not see it

> Found 2026-08-05 while discharging `t-signify-marker`. That shard closed the marker it knew
> about; this one was four lines away the whole time.

## The finding under the finding

The census reported **exactly one** owed-signification marker, measured with a pattern anchored on
`SIGNIFY:` — a colon. `packages/forge/src/catalog/index.ts:167` opens with `[SIGNIFY —` , an
em-dash. **The pattern was narrower than the class it claimed to count**, so a second marker sat
unseen inside the very file the census had opened.

That is the same species as every other finding in this plan: a check whose scope is narrower than
its claim reads as conformance when it is only coverage.

## What is actually owed

Unlike the marker `t-signify-marker` discharged — which named an identity assignment and so had no
referent at all — **this one is real**. Four engine-internal signs await a cold-decode pass:

`PluginFragmentSource` · `DiscoveredFragment` · `DiscoveredPlugin` · `discoverPluginFragments`

They are a coherent family (one source, one discovered thing, one discovered container, one verb),
so they should be derived TOGETHER — deriving them one at a time is how a family drifts into four
unrelated signs.

## Acceptance

- Each of the four has an anchor derived by the full round-trip — forward argmin, blind reverse
  decode, occupancy against the live tree — not picked.
- If any returns `⊥`, the candidate set and the date are recorded, per the C6 protocol this corpus
  paid for.
- **A gate for the CLASS**, matching every marker form rather than one punctuation variant:
  zero owed-signification markers outside `plans/`. Both fixtures — it must convict a planted
  marker in either the colon or the em-dash form, and exonerate a clean tree.

## ▶ RULING 2026-08-05 — the family decodes to three concepts wearing four signs

Derived by three **independent blind derivations**: each reader was given the field shapes and
semantic roles with every existing name withheld, and was forbidden to read the repository. One
declined to make any tool call at all, on the grounds that a single read would destroy the blind
condition that was the exercise's whole value — the right call.

| #   | σ\*                               | what it IS                                                                |
| --- | --------------------------------- | ------------------------------------------------------------------------- |
| 1   | `PluginFragmentRoot`              | where to scan, and under what namespace — an INPUT, built before the scan |
| 2   | `FragmentEntry`                   | identity + axis + body; one fragment as authored                          |
| 3   | `PluginFragmentCatalog`           | what one plugin yielded                                                   |
| 4   | `enumeratePluginFragmentCatalogs` | many roots → many catalogs                                                |

**What all three rejected, unprompted and unanimously.** `Discovered*` names the pipeline STAGE
rather than the thing — and since every value in a pipeline is some stage's output, provenance
never distinguishes. `Source` was rejected twice over: in a module whose subject is authored text,
"source" reads as source code, and the fragment BODY is the actual source.

**Why the long fourth sign.** The cold audit found sign 4 the only one of the four to fail a naive
decode — `enumeratePluginCatalogs` still admits "catalogs _of_ plugins", disambiguated only by the
signature. Carrying the noun's own infix fixes it. The verbosity is paid deliberately: this
function sits beside `enumerateCatalog`, and a sibling pair is exactly where a misread costs most.

**Filed, not fixed — a defect beside the path.** Two readers independently observed that (1) and
(3) are the same functor, `Namespaced<T>` = `Namespaced<AbsolutePath>` and
`Namespaced<readonly FragmentEntry[]>` — so the family is **three concepts in four signs**, a
hand-rolled map in both directions that lets duplicate namespaces through unrejected. Two also
judged (3) thin enough to deserve no name, its namespace being pure passthrough carrying no
discovered information. That is a real structural finding and it is **out of scope here**: this
shard decodes signs, and collapsing the types is a separate cut. `cost(file) < cost(fix)`.

## Execution

<!-- GENERATED from ../spec.mjs by ../sync-shards.mjs. Edit the spec, not this block. -->

- **slice** deploy-surface · **wave** 0
- **depends on** `t-coined-classification`
- **writes** `packages/forge/src/catalog/**` · `packages/forge/src/config/loader.ts` · `packages/forge/test/catalog/discover.test.ts` · `packages/forge/test/catalog/signify-marker-class.test.ts` · `packages/forge/src/project/index.ts` · `packages/forge/src/cli/commands/catalog.ts`
- **compiles against** `packages/schema/src/index.ts`
- **evidence** `packages/forge/src/catalog/index.ts`
- **dispatchable** no ruling owed
