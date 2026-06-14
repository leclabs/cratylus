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

    # ROUTE-HIT: a reduction/MECE fragment -> semantic-partition at rank 1
    c = intake.candidates(
        "cut the messy input into non-overlapping segments each matching exactly "
        "one canonical idea, re-cut if a piece fits two", profiles, idf, k=5)
    if not c or c[0][1] != "semantic-partition":
        fails.append(f"ROUTE-HIT: expected semantic-partition rank1, got {[s for _, s in c][:3]}")

    # ROUTE-HIT: a verification fragment -> tester in the top 3
    c2 = intake.candidates(
        "check the change across independent correctness dimensions and never "
        "mark pass when you cannot confirm", profiles, idf, k=5)
    top3 = [s for _, s in c2[:3]]
    if "tester" not in top3:
        fails.append(f"ROUTE-HIT: expected tester in top3, got {top3}")

    # HOMELESS: gibberish -> no candidates
    c3 = intake.candidates("zxqw flibber wozzle gnk", profiles, idf, k=5)
    if c3:
        fails.append(f"HOMELESS: expected none, got {[s for _, s in c3]}")

    # VALIDATE: (action, slug, expected_ok)
    for action, slug, want in [
        ("route", "semantic-partition", True),
        ("route", "nope-not-real", False),
        ("route", "AGENTS", False),               # pseudo-cell, not an anchor
        ("route", "CLAUDE", False),
        ("mint", "semantic-partition", False),       # already taken -> reject
        ("mint", "a-fresh-untaken-anchor", True),
        ("mint", "Bad Slug", False),              # space / caps -> reject
        ("mint", "-bad", False),                  # leading hyphen
        ("mint", "bad-", False),                  # trailing hyphen
        ("mint", "dou--ble", False),              # double hyphen
        ("mint", "123", False),                   # all-digits
        ("mint", "anchor-routing", False),        # existing corpus anchor
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
