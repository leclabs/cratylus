---
kind: utility
delineation: The OntoClean rubric — tag each property with four meta-properties (Rigidity, Identity, Unity, Dependence) and reject subsumptions that violate their constraints; the reusable test pyramid-decomposition applies to clean a taxonomy.
---

# OntoClean Meta-Properties

The rubric [[pyramid-decomposition]] applies to clean a hierarchy (Guarino & Welty, [[nicola-guarino]]). Tag each property:

- **Rigidity (R)** — essential to every instance (+R), or never essential (anti-rigid, ~R). _Person_ is +R; _student_ is ~R.
- **Identity (I)** — carries an identity criterion (+I); _supplies its own_ (+O).
- **Unity (U)** — its instances are wholes under one unifying relation (+U).
- **Dependence (D)** — every instance requires some external entity (+D).

**Subsumption constraints** — a violation is a taxonomic error to fix:

- An anti-rigid property cannot subsume a rigid one.
- Properties with incompatible identity or unity criteria cannot stand in is-a.
- Identity and unity must carry consistently down a subsumption chain.

## See also

- [[identity-criteria-before-taxonomy]] — the disposition this rubric serves.
- [[formal-ontology]] — the framework it operationalizes.
