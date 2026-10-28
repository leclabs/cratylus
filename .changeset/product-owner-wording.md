---
'@cratylus/canon': minor
'@cratylus/forge': minor
'@cratylus/schema': patch
'@cratylus/runtime': patch
'cratylus': minor
---

The person cratylus serves is called the product owner everywhere, never the operator: in the elicit skill, the `install` help and refusals, the READMEs and the code's comments.

**Breaking.** The canon's lifecycle moment `operator.consult.pre` is now `product-owner.consult.pre`, and `@cratylus/forge`'s exported omp bindings (`canonicalActToOmp`, `ompBindingOf`) know it only by the new name. A hook bound to `operator.consult.pre` must now name `product-owner.consult.pre`.
