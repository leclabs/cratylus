---
kind: principle
delineation: Verify a property against the live artifact where it is actually realized — runtime state, the DOM, source, test output — not against a serialized projection of it (screenshot, transcript, video); a projection is a weak, expensive-to-trust signal, and when narrative input is unavoidable, transcribe-and-enumerate it into addressable structure first.
---

# Verify at the Source, Not the Projection

To confirm a property holds, check the **artifact where the property is actually realized** — the live runtime, the DOM and console, the source files, the test output — not a **serialized projection** of it. A screenshot, a recorded walkthrough, a transcript is a **weak signal**: expensive to process, and trusted out of habit rather than because it is addressable. The DOM affords a deterministic query; a bitmap only affords interpretation, and the meaning then lives in the viewer, not the system.

This is [[projection-is-not-the-source]] at the **verification grain**: a projection is a legitimate _record_, never the thing you verify against. Two operative rules:

- **Require evidence at the locus of truth.** Verification protocols demand runtime evidence (devtools state, dev-server output, test results) and treat snapshots as supplementary, never authoritative.
- **When narrative input is unavoidable, convert before acting.** If the only input is a video or a design review, transcribe-and-enumerate it into structured, addressable units keyed by state and variant. The conversion from prose to enumeration _is_ the act of distillation that makes it something an agent can verify against.
- **Perceive through the typed source, not the rendered output.** The same logic governs what an agent _consumes as input_, not only what it verifies against: give it the DOM, the ARIA tree, the network log, the design tool's typed layer hierarchy — the structured data the renderer already produced — rather than a screenshot of the result. A bitmap is a lossy, expensive projection from that typed source; the structure carries semantic identity (named, queryable affordances) that the pixels drop. Hand the agent the source the projection was rendered from.

The same logic chooses the source over its own documentation: trust the artifact that realizes the behaviour over a serialized description of it ([[empirical-source-before-normative-doc]]).

## See also

- [[projection-is-not-the-source]] — the general principle; this is its verification-grain instance.
- [[doc-mirrors-runtime-truth]] — the runtime is the authority; a doc only mirrors it.
- [[empirical-source-before-normative-doc]] — prefer the artifact that practises the behaviour over a description of it.
