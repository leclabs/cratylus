"""claude-code renderer -- frames a DecoratedDoc as a claude-code artifact:
front-matter, the GENERATED provenance header + body content-hash
([[generated-artifact-provenance]] / [[regenerate-without-clobbering]]), the
body, and the harness-relative path keyed on kind.

Also owns the read-back helpers that parse this harness's artifact format for
drift detection -- the inverse of render(), kept here so the format lives once.
"""
from __future__ import annotations

import hashlib
import pathlib
import re

from core.ir import DecoratedDoc, RenderedArtifact

# kind -> the claude-code on-disk layout (relative to the .claude/ scope root).
# agents are file-per-name; skills are dir-per-name with a SKILL.md.
def _rel_path(kind: str, name: str) -> str:
    if kind == "agent":
        return f"agents/{name}.md"
    if kind == "skill":
        return f"skills/{name}/SKILL.md"
    raise ValueError(f"claude-code renderer has no path for kind {kind!r}")


def body_hash(body_text: str) -> str:
    """The content-hash of a body slice -- the drift anchor."""
    return hashlib.sha256(body_text.encode("utf-8")).hexdigest()[:16]


def provenance_header(name: str, profile: str, bh: str) -> str:
    """The GENERATED provenance comment block ([[generated-artifact-provenance]] /
    [[regenerate-without-clobbering]]) -- the one home for the header law, shared
    by every dialect renderer (claude_code, ir) so the sentinel + content-hash
    line read identically wherever a mind artifact lands. Returns the 4-line
    comment block (no trailing newline)."""
    return (
        f"<!-- GENERATED from packages/mind/ideas/{name}.md by projecting its "
        f"composed cells at the recorded reader profile.\n"
        f"     profile: {profile}\n"
        f"     Edit the cells and regenerate; do not hand-edit.\n"
        f"     content-hash: sha256:{bh} (regenerate-without-clobbering ancestor) -->"
    )


def render(decorated: DecoratedDoc) -> RenderedArtifact:
    composed = decorated.composed
    body_text = composed.body
    bh = body_hash(body_text)
    profile = f"{composed.reader}/{composed.harness}"

    lines: list[str] = []
    lines.append("---")
    for key, val in decorated.frontmatter.items():
        lines.append(f"{key}: {val}")
    lines.append("---")
    lines.append("")
    lines.append(provenance_header(composed.name, profile, bh))
    lines.append("")
    lines.append(body_text.rstrip("\n"))
    lines.append("")
    text = "\n".join(lines)
    return RenderedArtifact(
        rel_path=_rel_path(composed.kind, composed.name), text=text, body_hash=bh,
    )


# --- read-back / drift helpers: parse this harness's emitted format ----------

def recorded_hash(path: pathlib.Path) -> str | None:
    if not path.exists():
        return None
    m = re.search(r"content-hash: sha256:([0-9a-f]+)", path.read_text(encoding="utf-8"))
    return m.group(1) if m else None


def recorded_profile(path: pathlib.Path) -> str | None:
    """The `<reader>/<harness>` the artifact was last emitted under, or None for
    a pre-profile (legacy) artifact."""
    if not path.exists():
        return None
    m = re.search(r"profile:\s*(\S+)", path.read_text(encoding="utf-8"))
    return m.group(1) if m else None


def ondisk_body_hash(path: pathlib.Path) -> str | None:
    """Recompute the hash of the on-disk body (everything after the header
    comment block), the same slice render() hashes."""
    if not path.exists():
        return None
    text = path.read_text(encoding="utf-8")
    # body starts after the closing `-->` of the provenance comment. Anchor the
    # search at the GENERATED sentinel so a `-->` inside the front-matter
    # description can never be mistaken for the comment close.
    gen = text.find("<!-- GENERATED")
    idx = text.find("-->", gen if gen != -1 else 0)
    if idx == -1:
        return None
    body = text[idx + 3:].lstrip("\n")
    body = body.rstrip("\n") + "\n"
    return body_hash(body)
