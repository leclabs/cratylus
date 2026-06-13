"""Harness-affordance axis -- how one resolved `[[slug]]` prints for a given
harness, orthogonal to the reader-density axis (compose.reader). Same species
as the mark facet: a harness affordance projected at compose time, never
stored in cells ([[projection-is-not-the-source]]).

  claude-code   a `kind: skill` target renders as its invocation affordance --
                the TARGET CELL's `trigger` front-matter verbatim (`/dream`),
                legible as a name and invocable, in every position
                (unconditional on kind x harness; no position-keyed cases).
                The trigger is read, never guessed from the slug
                ([[hoare-elegance-no-permissive-defaults]]).
  otherwise     typographic `**bold**` -- the affordance-free default form.
"""
from __future__ import annotations

from core import cells


def ref_text(slug: str, harness: str) -> str:
    """The inline projection of one resolved `[[slug]]` for `harness`."""
    if harness == "claude-code":
        try:
            fm = cells.parse_cell(slug)["fm"]
        except FileNotFoundError:
            # a dangling ref has no kind to key on; keep the typographic form
            # and let verify's REF gate own the failure report.
            return f"**{slug}**"
        if fm.get("kind") == "skill":
            trigger = fm.get("trigger", "").strip()
            if not trigger:
                raise ValueError(
                    f"skill cell {slug!r} has no `trigger` front-matter -- "
                    f"cannot project its invocation affordance (never guessed "
                    f"from the slug)"
                )
            return trigger
    return f"**{slug}**"


def project_refs(text: str, harness: str) -> str:
    """`[[x]]` -> its harness projection across one PROSE grain. Callers mask
    fence interiors first (core.cells.fence_lines) -- the AST decides the
    register; this transform only ever sees prose."""
    return cells.REF.sub(lambda m: ref_text(m.group(1), harness), text)
