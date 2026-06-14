"""The fragment content-digest ([[content-digest]]) — the byte rule under the
B8 routing-manifest invariant.

A conceptualize fragment (one `[[semantic-partition]]` cut = one idea) is keyed
by the digest of its content, not its source location. The acceptance contract
(Nico's, `plans/polis-machinery/active/B8-r3-routing-manifest.md`) is:

    equal meaning ⇒ equal digest, and a cosmetic source edit must NOT change it.

This is the *producer* half: the future exemplify emit computes a fragment's
`fragment_digest` here; the already-landed consumer (`verify.py`
`gate_reconstruct` R3) reads those strings from a routing manifest. The two
share this digest format (`"sha256:" + hexdigest`). Dormant until the producer
wires it in — a pure function + its test, called by no gate yet.

Normalization — v1, CONSERVATIVE. Only the three unambiguously-cosmetic
transforms are applied, covering the common source edits (reflow, trailing
space, tab/space, NFD↔NFC):

    1. Unicode NFC (canonical composition).
    2. Collapse every run of whitespace (spaces, tabs, newlines) to one space.
    3. Strip leading/trailing whitespace.

DEFERRED (NOT v1): stripping markdown / emphasis / heading markers and other
"decoration vs meaning" cosmetics. Which markdown is decoration vs meaning is a
genuine co-design question that needs real exemplify-run fragments to answer
([[B8-r3-routing-manifest]] "Co-design with Mav"); pinning the exact stripped
token set blind would guess the byte rule. v1 covers only whitespace +
unicode-form cosmetics; richer cosmetic classes are an explicit future
refinement.
"""
from __future__ import annotations

import hashlib
import re
import unicodedata

_WHITESPACE_RUN = re.compile(r"\s+")


def normalize(text: str) -> str:
    """Apply the v1 conservative normalization (NFC → collapse whitespace →
    strip). Pure; the digest's whole cosmetic-invariance lives here."""
    text = unicodedata.normalize("NFC", text)
    text = _WHITESPACE_RUN.sub(" ", text)
    return text.strip()


def fragment_digest(text: str) -> str:
    """Return ``"sha256:" + sha256(normalize(text)).hexdigest()`` — the content
    key for a conceptualize fragment. Equal-meaning-modulo-cosmetic (v1:
    whitespace + unicode-form) text yields an equal digest."""
    payload = normalize(text).encode("utf-8")
    return "sha256:" + hashlib.sha256(payload).hexdigest()
