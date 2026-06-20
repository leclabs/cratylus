#!/usr/bin/env python3
"""Intake harness (DESIGN.md §4 -- the `put` half) -- first cut: anchor-routing.

The reduction `put` (raw -> source-graph) is irreducibly semantic: a model runs
[[reductio]] and routes each fragment to its best-fit exemplar, or mints a new
one when the fragment is homeless ([[anchor-routing]] -- never force an ill-fit).
A pure-Python tool cannot make that judgment. What it CAN do is remove the
mechanical toil around it ([[pretransform-shrinks-inference-surface]]):

  candidates()  lexical pre-filter -- rank the corpus anchors by IDF-weighted
                token overlap with a fragment (slug-tokens boosted, since the
                name carries the meaning), shrinking the model's routing surface
                from the whole corpus to top-k.
  CLI           emit a routing-decision template (fragment + candidates) the
                model then resolves: route -> <slug> | mint -> <new-slug>.
  validate()    deterministic post-check of a decision against the corpus:
                a routed slug must exist; a mint slug must be well-formed and
                NOT already taken (MECE -- one home per exemplar).

The semantic call stays with the model; this is the scaffold around it.

Limitation (found by dogfooding, do not over-trust): the pre-filter is purely
LEXICAL, so it has RECALL GAPS on vocabulary mismatch -- a fragment and its true
exemplar that share an idea but not words may miss each other (e.g. a
"navigation projection" fragment failed to surface `projection-is-not-the-source`).
Low, scattered scores are a *hint* of homelessness, not proof: the real anchor
may exist under other words. Treat candidates() as a candidate-GENERATOR, never
a router -- the model must judge fit AND consider anchors outside the top-k. A
semantic (embedding) pre-filter is the eventual complement when recall matters.

Usage:
  intake.py "<raw fragment>" [--k N]
  intake.py --validate route|mint <slug>
"""
from __future__ import annotations

import math
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from core import cells  # noqa: E402  -- the shared cell reader (not the CLI)

# Minimal stop set -- structural words that carry no routing signal.
STOP = set(
    "the a an of to and or is are was were be been being in on for by with as at "
    "it its this that these those not no nor but if then else when while into from "
    "you your they them their we our us he she his her i me my".split()
)
WORD = re.compile(r"[a-z0-9]+")


def tokens(text: str) -> list[str]:
    return [w for w in WORD.findall(text.lower()) if w not in STOP and len(w) > 2]


def load_corpus() -> tuple[dict, dict]:
    """Build per-anchor token profiles and the corpus IDF table."""
    profiles: dict[str, tuple[set, set]] = {}
    df: dict[str, int] = {}
    for s in cells.corpus_slugs():
        slug_toks = {t for t in s.split("-") if t not in STOP and len(t) > 2}
        deli_toks = set(tokens(cells.delineation(s)))
        profiles[s] = (slug_toks, slug_toks | deli_toks)
        for t in (slug_toks | deli_toks):
            df[t] = df.get(t, 0) + 1
    n = max(1, len(profiles))
    idf = {t: math.log((n + 1) / (c + 0.5)) for t, c in df.items()}
    return profiles, idf


def candidates(fragment: str, profiles: dict, idf: dict, k: int = 8) -> list[tuple[float, str]]:
    """Top-k anchors by IDF-weighted token overlap; slug-token hits boosted 2x
    (the anchor name is the densest carrier of its meaning)."""
    ftoks = set(tokens(fragment))
    scored: list[tuple[float, str]] = []
    for s, (slug_toks, all_toks) in profiles.items():
        sc = 0.0
        for t in ftoks & all_toks:
            w = idf.get(t, 0.0)
            if t in slug_toks:
                w *= 2.0
            sc += w
        if sc > 0:
            scored.append((sc, s))
    scored.sort(key=lambda x: (-x[0], x[1]))
    return scored[:k]


# A well-formed anchor slug: kebab-case, no leading/trailing/double hyphen,
# single-token allowed (reductio, confusio), but never all-digits.
SLUG = re.compile(r"[a-z0-9]+(-[a-z0-9]+)*")


def validate(action: str, slug: str) -> tuple[bool, str]:
    """Deterministic post-check of a model's routing decision. Membership is
    judged against the real corpus anchor set (NOT bare file existence -- the
    `ideas/` dir also holds AGENTS.md/CLAUDE.md, which are not anchors)."""
    corpus = set(cells.corpus_slugs())
    if action == "route":
        ok = slug in corpus
        return (ok, "ok" if ok else f"route target {slug!r} is not a corpus anchor")
    if action == "mint":
        if not SLUG.fullmatch(slug):
            return (False, f"mint slug {slug!r} is not well-formed kebab-case")
        if not any(c.isalpha() for c in slug):
            return (False, f"mint slug {slug!r} must contain a letter (not all-digits)")
        if slug in corpus or (cells.IDEAS / f"{slug}.md").exists():
            return (False, f"mint slug {slug!r} already taken -- route to it or pick another")
        return (True, "ok")
    return (False, f"unknown action {action!r} (route|mint)")


def main() -> int:
    args = sys.argv[1:]
    if not args:
        print(__doc__.strip().splitlines()[-3].strip(), file=sys.stderr)
        print("usage: intake.py '<raw fragment>' [--k N] | --validate route|mint <slug>",
              file=sys.stderr)
        return 2

    if args[0] == "--validate":
        if len(args) != 3:
            print("usage: intake.py --validate route|mint <slug>", file=sys.stderr)
            return 2
        ok, msg = validate(args[1], args[2])
        print(f"{'OK' if ok else 'FAIL'}  {msg}")
        return 0 if ok else 1

    k = 8
    if "--k" in args:
        i = args.index("--k")
        if i + 1 >= len(args):
            print("usage: --k requires a positive integer", file=sys.stderr)
            return 2
        try:
            k = int(args[i + 1])
        except ValueError:
            print(f"--k must be an integer, got {args[i + 1]!r}", file=sys.stderr)
            return 2
        if k <= 0:
            print(f"--k must be positive, got {k}", file=sys.stderr)
            return 2
        del args[i:i + 2]
    fragment = " ".join(args).strip()
    if not fragment:
        print("usage: intake.py '<raw fragment>' [--k N]", file=sys.stderr)
        return 2

    profiles, idf = load_corpus()
    cands = candidates(fragment, profiles, idf, k)
    print(f"FRAGMENT: {fragment}\n")
    if not cands:
        print("No lexical overlap with any anchor -> likely HOMELESS.")
        print("DECISION (model resolves): mint -> <new-slug>  (reductio found a "
              "homeless primitive -- minting is correct, not a malfunction)")
        return 0
    print(f"CANDIDATES (top {len(cands)} of {len(profiles)} anchors, "
          f"IDF-weighted lexical pre-filter):")
    for sc, s in cands:
        print(f"  {sc:6.2f}  {s} -- {cells.delineation(s)[:88]}")
    print("\nDECISION (model resolves -- [[anchor-routing]], never force an ill-fit):")
    print("  route -> <slug>   |   mint -> <new-slug>")
    print("  rationale: <why this exemplar, or why homeless>")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
