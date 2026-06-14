#!/usr/bin/env python3
"""Fragment content-digest tests (B8) -- the byte rule under Nico's
routing-manifest invariant: equal-meaning-modulo-cosmetic ⇒ equal digest.
Proves v1's three cosmetic classes (whitespace-run collapse, leading/trailing
trim, NFD↔NFC unicode-form) are invariant; different meaning is distinct; and
the wire format is `sha256:<64 hex>`.

Run: python3 toolkit/test_digest.py   (exit non-zero on any failure)
"""
from __future__ import annotations

import pathlib
import re
import sys
import unicodedata

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[0]))

from core.digest import fragment_digest  # noqa: E402

FORMAT = re.compile(r"^sha256:[0-9a-f]{64}$")


def main() -> int:
    fails: list[str] = []

    # INVARIANCE: collapse whitespace runs (incl. newline) + strip → one digest.
    canon = fragment_digest("a b c")
    for variant in ("a  b\n c", "  a b c  ", "a\tb\tc", "\na b\tc\n"):
        if fragment_digest(variant) != canon:
            fails.append(f"INVARIANCE: {variant!r} digest != {'a b c'!r} digest")

    # INVARIANCE: NFD vs NFC of the same accented string → equal digest.
    nfc = unicodedata.normalize("NFC", "café déjà vu")
    nfd = unicodedata.normalize("NFD", "café déjà vu")
    if nfc == nfd:
        fails.append("INVARIANCE: NFC/NFD fixture is not actually composed-differently")
    if fragment_digest(nfd) != fragment_digest(nfc):
        fails.append("INVARIANCE: NFD form digest != NFC form digest")

    # DISTINCTNESS: different meaning → different digest (incl. markdown, which
    # v1 deliberately does NOT strip — emphasis is meaning until co-design says
    # otherwise).
    pairs = [
        ("a b c", "a b d"),
        ("the cat", "the dog"),
        ("plain text", "*plain* text"),
        ("", "x"),
    ]
    for left, right in pairs:
        if fragment_digest(left) == fragment_digest(right):
            fails.append(f"DISTINCTNESS: {left!r} and {right!r} collided")

    # FORMAT: matches ^sha256:[0-9a-f]{64}$ across varied inputs (incl. empty).
    for sample in ("a b c", "", "café", "x" * 5000):
        d = fragment_digest(sample)
        if not FORMAT.match(d):
            fails.append(f"FORMAT: {sample!r:.20} → {d!r} fails ^sha256:[0-9a-f]{{64}}$")

    if fails:
        for x in fails:
            print("FAIL", x, file=sys.stderr)
        print(f"\n{len(fails)} failure(s)", file=sys.stderr)
        return 1
    print(f"PASS digest: invariance (whitespace + NFD/NFC) + distinctness + format ({canon})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
