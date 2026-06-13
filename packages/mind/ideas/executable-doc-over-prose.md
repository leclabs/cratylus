---
kind: principle
delineation: Author the spec as a runnable artifact whose execution is its own verification — a script, an example, a test that either works or fails — rather than prose that drifts; prose documentation accumulates silent error and gets distrusted, while a runnable artifact can never lie because running it checks it.
---

# Executable Doc Over Prose

Where you can, make the documentation **executable**: a runnable example, a script, a test whose **execution is the verification**. Prose documentation drifts — it describes a system that has since changed, and nothing forces the two back into agreement, so it accumulates silent error until a reader (especially an agent) acts confidently on a stale instruction. A runnable artifact cannot drift the same way: it either works or it fails, never lies, because running it _is_ checking it.

This is the same instinct as the types being the doc, golden-master recordings being the spec, and doctest: the artifact that runs is the artifact that's trusted. The verification step is then automatic and continuous rather than a separate human review that lags behind the code. It is the authoring-side twin of preferring the realized artifact over its description ([[empirical-source-before-normative-doc]], [[verify-at-the-source-not-the-projection]]): there you _read_ the practised source over its manual; here you _write_ the spec as something practised so it can't decay into a manual that lies.

When a doc genuinely must stay prose, route to it rather than restate it ([[cite-dont-copy]]) — but prefer turning the claim into something that runs.

## See also

- [[empirical-source-before-normative-doc]] — read the practised case over the description; this writes the spec to be a practised case.
- [[verify-at-the-source-not-the-projection]] — a runnable artifact's output is source-grade evidence, not a projection to interpret.
- [[doc-mirrors-runtime-truth]] — a prose mirror lags the runtime; an executable artifact closes the gap by construction.
