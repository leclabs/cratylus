# Held-out · the reconstitution cut

Context: delivery. Used only in judgment. Same run rule as the
[visible examples](../../examples/delivery/reconstitution.md).

## Structural (execution and assertions over delivered output)

1. (capability interface) **Given** a capability's own explanation is changed to reflect an accepted
   concept change, **when** it is delivered again, **then** the harness receives that explanation in
   its own form without a second account being rewritten by hand; no stale adapter-authored
   description survives as another authority for the capability's meaning.

## Behavioral (recorded agent behavior)

2. (capability interface) **Given** a lead has its cut brief and an earlier report naming footage as
   ready, footage has since finished so grading is now ready while captions still depends on
   unfinished grading, and the harness publishes the work package capability's own explanations
   distinguishing inspection of dependencies from finding work ready to dispatch, **when** the lead
   needs the next ready work package, **then** it identifies and calls the ready-work operation from
   that explanation and uses its current answer, grading; it never treats the old report as the
   current answer, mistakes inspection of dependencies for the ready-work operation, or needs a
   separate skill or adapter-authored procedure to explain which operation serves that purpose.
