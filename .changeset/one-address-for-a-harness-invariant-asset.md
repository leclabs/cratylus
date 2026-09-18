---
'@cratylus/canon': patch
'@cratylus/forge': patch
'@cratylus/schema': patch
---

A harness-invariant hook asset deploys once, to the vendor-neutral `.agents` root

The stance rubric is one 27 kB file every projection scores against, byte-for-byte identical
across claude, codex and omp — and it was being copied into `<harness>/hooks/stance-guardrail/`
three times. The duplication was the smaller half of the cost. The larger half is that the text
had **no address any other realization could name**: an advisor roster entry wanting the same
rubric would have had to `@`-import it out of a sibling harness's tree, which is exactly the
cross-harness reach `harness-independence` forbids. A shared asset has one address, and the
neutral root is the one place every harness may read without reaching into another.

`HookWorker.shared` declares it, `SHARED_STAGE_DIR` stages it, and deploy places it at
`../.agents/<id>/` — the same relative-escape shape the scoped mechanism modules already use,
so the manifest keeps it attributable and prune retires it with its hook. The workers resolve
it by DERIVATION (`.agents` is the sibling of every harness home, three `dirname`s up), never
by a baked `$HOME`, so a sandboxed `--home` deploy resolves correctly — the same discipline
that repaired the `$HOME/.claude` leak, applied before it could become one.

**The criterion is `byte-identical ∧ ¬executable`, and the gate is what corrected it.** The
first cut said byte-identical alone, and it immediately caught two assets that must NOT move:
the worker scripts are byte-identical too, and are positionally coupled to the harness in two
ways their bytes cannot show — each harness's registration addresses its own copy by path, and
each worker resolves `stance-judge.sh` as a sibling. That judge is genuinely harness-specific
(it names the harness's own CLI through `{{fact:harness-judge-bin}}`), so a single shared
worker could not know whose judge to run without the registration passing it in. That trade
relocates harness-specificity into a shared file's arguments and buys only the deduplication of
two scripts that belong beside the registration invoking them. An entry point a harness invokes
is executable; a rubric is not.

The gate holds both directions and is non-vacuous in both arms: the corpus must contain a shared
data asset and a harness-specific one, or the rule is green over nothing.

Verified on a sandboxed two-harness deploy — one rubric on disk, claude and omp both resolving
`<home>/.agents/stance-guardrail/stance-judge-prompt.md`, including from the pre-guard — and
live on omp, where the guard blocked twice reading the shared rubric with a tripwire `claude`
first on `PATH` never invoked.
