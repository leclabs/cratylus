---
kind: principle
delineation: A quality metric handed to an agent as a target stops measuring quality — the agent routes around accuracy to hit the number (fake units, force-fit classifications, generic labels); keep the metric a guide, and explicitly reward the inverse decision (approving "this is NOT one") so the honest negative is as creditable as the positive.
---

# Metric Is a Guide, Not a Target

When a numeric target becomes the headline an agent optimizes, it ceases to measure the thing it stood for — Goodhart's law, applied to the very judgement the agent is performing. A coverage target makes the agent **force-fit**: invent units that aren't there, label an orchestrating node as a unit-of-value to bump the count, attach generic labels that pass the tally but say nothing. The number goes up; the quality goes down.

Two corrections:

- **Name the metric a guide, not a target.** It orients attention ("we expect roughly this many"); it does not adjudicate. Quality outranks the count, and a low count reached honestly beats a high count reached by force-fitting.
- **Reward the inverse decision explicitly.** Make "this is **not** one — it is shared infrastructure / a hub / out of scope" a first-class, creditable outcome, equal in standing to a positive classification. If only positives are rewarded, the agent manufactures them. Crediting the honest negative removes the incentive to fake the positive.

A high-outdegree orchestrating node (a page, a module index, a hub) is the classic force-fit trap: it is a **discovery signal** — high connectivity means _look here_ — but it is not itself the unit being classified. Mistaking the index for the unit is how coverage pressure manufactures fake members.

## See also

- [[calibrated-validation-preserves-agency]] — the validator-depth twin of the same Goodhart pressure: an over-deep checker force-fits exactly as an over-weighted metric does.
- [[cite-dont-copy]] — the orchestrating index points at the units; it is where to look, not itself a unit to label.
- [[context-pathologies]] — Artefact Supremacy is this Goodhart pressure at the artifact grain: the proxy artifact eats the goal it served.
