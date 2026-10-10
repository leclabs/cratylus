# Examples · cut 5 · check quality

Context: workflow. Concepts: offline proof, never-assertion, implementation leakage (see the concept journal).
Decisions in force: 0043, 0057. Confirmed by the architect on 2026-10-10 under the operator's delegation. All
structural.

1. (offline proof) **Given** an example "show the total as £12 and identify the currency as pounds", two golden
   recordings that satisfy it in different words, one negative with the wrong total and one with the wrong
   currency, and a check whose assertions each name the words they bind, **when** offline proof runs, **then**
   both goldens pass, each negative fails the one assertion it breaks, and the check may be frozen, with no live
   run.
2. (offline proof) **Given** a check that rejects a golden recording, or one that accepts a negative, **when**
   offline proof runs, **then** it does not succeed and the check cannot be frozen.
3. (offline proof) **Given** an example with two requirements and a check bound to both, but recordings that
   break only one of them, **when** offline proof runs, **then** it does not succeed: an assertion never seen
   to fail is not trusted.
4. (offline proof) **Given** a check that judges the recordings correctly but has an assertion naming none of
   its example's words, **when** offline proof runs, **then** it does not succeed.
5. (offline proof) **Given** an example "tell the customer the request was accepted" and a check that demands one
   wording and treats another that satisfies the example as a negative, **when** offline proof runs, **then**
   the extra restriction is caught as binding what the example never fixed, and the check cannot be frozen.
6. (offline proof) **Given** a check that reads something from the operator's host the example does not name,
   and whose recordings all happen to be judged correctly on this host, **when** offline proof runs, **then**
   the host read is caught and proof does not succeed; **and given** an example that names a host setting, a
   check that reads exactly that setting proves normally.
7. (never-assertion) **Given** a behavioral example "answer the question in at least four of five runs; never
   disclose the access secret", **when** five recordings with four good answers and one disclosure are judged,
   **then** the batch fails; **when** five with four good answers and no disclosure are judged, **then** it
   passes; **when** three good answers and no disclosure, **then** it fails.
8. (implementation leakage) **Given** a concept that names a file location, a decision that names a command and
   an example that requires a named library, **when** the conceptual design is inspected, **then** each is
   reported as a warning naming its passage, concepts and decisions as well as examples.
9. (implementation leakage) **Given** an entry with leakage, **when** it is recorded, **then** it is recorded,
   and the warning is shown to whoever recorded it; nothing is refused for leakage.
10. (implementation leakage) **Given** "a check accepts a recording that satisfies its example", **when** it is
    inspected, **then** it raises no warning: a context's own words are never leakage.
11. (offline proof, sweep) **Given** the behavioral checks already frozen in earlier cuts, **when** offline proof
    is run over each, **then** every one either proves, or its failure is reported to the architect as a
    check-ruling, never changed silently.
