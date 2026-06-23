#!/usr/bin/env python3
"""Intake anchor-routing pre-filter tests (DESIGN.md §4). Deterministic: the
lexical scorer is a pure function, so these assert routing behavior with no
model in the loop.

  ROUTE-HIT  a fragment whose meaning IS an existing anchor ranks that anchor
             at/near the top of the candidate set (the pre-filter surfaces the
             right exemplar for the model to confirm).
  HOMELESS   a fragment with no corpus overlap yields zero candidates -- the
             mint signal ([[anchor-routing]] never forces an ill-fit).
  VALIDATE   route/mint decisions are checked against the corpus: a route
             target must exist; a mint slug must be well-formed and MECE-unique.
"""
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import intake  # noqa: E402


def main() -> int:
    fails: list[str] = []
    profiles, idf = intake.load_corpus()

    # ROUTE-HIT: a "resolve the raw input into its canonical ideas" fragment ->
    # conceptualize at rank 1. REPOINTED (corpus-rebuild, not weakened): the
    # demolished lexicon cell `semantic-partition` named exactly this act (cut the
    # input into non-overlapping ideas); post-rebuild it lives as the
    # `conceptualize` SKILL (resolve a source to the reader's concept lattice).
    # Same invariant: a fragment whose meaning IS an anchor ranks that anchor top.
    c = intake.candidates(
        "read the raw source and resolve it to the reader's concept lattice -- the "
        "closed set of distinctions, deciding which are primitive", profiles, idf, k=5)
    if not c or c[0][1] != "conceptualize":
        fails.append(f"ROUTE-HIT: expected conceptualize rank1, got {[s for _, s in c][:3]}")

    # ROUTE-HIT: a naming fragment -> signify in the top 3. REPOINTED
    # (re-individuate-organ-anatomy): formerly asserted the `tester` AGENT slug
    # (verification routing), when a tester agent cell was prose-rich and carried
    # the verification language itself. Agent cells are now terse organ SELECTION
    # VECTORS with a formulaic `⊕{organ ↦ value}` delineation (no descriptive
    # prose), so an agent is no longer content-routable -- the verification-routing
    # case is RETIRED BY RESTRUCTURE. The route-hit invariant (a fragment whose
    # meaning IS an anchor ranks top) is preserved on a live content-bearing SKILL:
    # a "name each concept its canonical anchor" fragment routes to `signify`.
    c2 = intake.candidates(
        "assign each concept its canonical anchor name -- one name, one concept -- "
        "and coalesce concepts that resolve to the same name", profiles, idf, k=5)
    top3 = [s for _, s in c2[:3]]
    if "signify" not in top3:
        fails.append(f"ROUTE-HIT: expected signify in top3, got {top3}")

    # HOMELESS: gibberish -> no candidates
    c3 = intake.candidates("zxqw flibber wozzle gnk", profiles, idf, k=5)
    if c3:
        fails.append(f"HOMELESS: expected none, got {[s for _, s in c3]}")

    # VALIDATE: (action, slug, expected_ok)
    for action, slug, want in [
        ("route", "conceptualize", True),         # live corpus anchor
        ("route", "nope-not-real", False),
        ("route", "AGENTS", False),               # pseudo-cell, not an anchor
        ("route", "CLAUDE", False),
        ("mint", "conceptualize", False),         # already taken -> reject
        ("mint", "a-fresh-untaken-anchor", True),
        ("mint", "Bad Slug", False),              # space / caps -> reject
        ("mint", "-bad", False),                  # leading hyphen
        ("mint", "bad-", False),                  # trailing hyphen
        ("mint", "dou--ble", False),              # double hyphen
        ("mint", "123", False),                   # all-digits
        ("mint", "signify", False),               # existing corpus anchor
    ]:
        ok, _ = intake.validate(action, slug)
        if ok != want:
            fails.append(f"VALIDATE: {action} {slug} -> {ok}, expected {want}")

    if fails:
        for f in fails:
            print("FAIL", f, file=sys.stderr)
        print(f"\n{len(fails)} failure(s)", file=sys.stderr)
        return 1
    print("PASS intake: route-hit + homeless + validate")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
