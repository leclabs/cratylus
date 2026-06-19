"""Skill composer -- one `kind: skill` cell -> a SKILL.md body.

A skill differs from an agent: an agent def is *all* composition (anchors
resolved to delineations as the operative content); a skill's body is the
**authored operative content** (what it does, how to reach it), and its composed
anchors are mere provenance. The authored form:

    ---
    kind: skill
    delineation: <one-line bound -- the intent-routing surface>
    trigger: /<name>
    ---

    # /<name> — <title>
    <intro>

    <name> ≜ invokes [[…]], references [[…]]    # composed anchors (provenance)

    ## What it helps with
    <authored body the loading agent reads>

    ## Harness: claude-code
    <claude-code deltas>      ## Harness: pi
    <pi deltas>

compose_skill assembles: heading + intro + a ONE-LINE lean provenance of the
composed anchors (names only -- the body carries the meaning, so the anchors do
not bury the operative content; cf. [[context-not-prose]]) + the authored `## `
sections, KEEPING only the `## Harness: <target>` section and dropping the other
well-formed harness dialects. No genus dispositions, identity block, or grants --
those are agent-qua-agent, not skill.

Composition source ([[self-sufficient-formalism]]: one citation per anchor, at
the binding; the cell's composition is DERIVED from its bindings, never restated):

  - **Bindings region present** -- the boundary-bindings are the single citation
    home, so composition = every `[[ref]]` harvested from the `Bindings:`
    paragraph (first-seen, deduped, regardless of binding verb), and the `≜`
    formula is OPTIONAL. This is the convention's home: cite once.
  - **No Bindings region** -- bindings-less skills (wake, handoff, weitermachen,
    ...): composition = the single PROSE `≜` formula's refs. A fenced `≜` is
    formal math, never composition; a skill with neither a Bindings region nor a
    prose `≜` composes empty provenance. The empty-provenance warning is keyed on
    the FINAL composition (≜ and bindings both empty) and lives ONCE in verify.py's
    `gate_skill_provenance` -- never on bare `≜`-absence, which is the correct and
    expected shape of a bindings-homed skill (cite-once).

There is NO agent-style "harvest every prose ref" fallback (it would mistake
verb-table and see-also refs for dispositions). When BOTH a Bindings region and a
prose `≜` are present (a cell's transitional state mid-sweep), Bindings WINS and
verify.py flags the redundant `≜` as a cite-twice violation.

Fence-awareness is AST-derived (core.cells fence_lines / markdown-it-py): the
substitution and formula grains skip fence interiors by construction, so a
`[[x]]` or `≜` inside a formal block can never corrupt the emitted register.
"""
from __future__ import annotations

import re

from core import cells
from core.ir import ComposedDoc
from compose.harness import project_refs, ref_text

# A Bindings region is a PROSE paragraph led by the token `Bindings:` (optionally
# bolded `**Bindings:**`) -- the boundary-binding block of a formal cell, the
# single home for each external anchor ([[self-sufficient-formalism]]). The lead
# token is matched fence-masked like every prose grain; the paragraph runs to the
# next blank line (markdown paragraph break). Leading whitespace is allowed so a
# Bindings paragraph nested under a `## ` section still recognizes.
BINDINGS_RE = re.compile(r"^\s*\*{0,2}Bindings:\*{0,2}")

# A harness-variant selector header is EXACTLY `## Harness: <token>`. Only an
# exact match is treated as a dialect to select/drop; anything else that merely
# starts with "## Harness" (e.g. `## Harness Notes`) is an ordinary section and
# is KEPT, never silently dropped ([[no-permissive-defaults]] --
# a non-selector header degrades to visible content, not to deletion).
HARNESS_RE = re.compile(r"^## Harness:\s*(\S+)\s*$")


def _sections(
    body_lines: list[str], mask: set[int]
) -> tuple[list[int], list[tuple[int, list[int]]]]:
    """Split a cell body into (preamble-index-list, [(heading-index, indices)]).
    Index-based so callers read structure off the ORIGINAL lines and emit the
    transformed ones; a `## ` inside a fence (masked) is content, never a
    section boundary -- the AST decided what is a fence, not this splitter."""
    preamble: list[int] = []
    sections: list[tuple[int, list[int]]] = []
    cur_head: int | None = None
    cur: list[int] = []
    for i, line in enumerate(body_lines):
        if line.startswith("## ") and i not in mask:
            if cur_head is not None:
                sections.append((cur_head, cur))
            cur_head = i
            cur = []
        elif cur_head is None:
            preamble.append(i)
        else:
            cur.append(i)
    if cur_head is not None:
        sections.append((cur_head, cur))
    return preamble, sections


def _projected_lines(body_lines: list[str], mask: set[int], harness: str) -> list[str]:
    """[[x]] -> its harness projection (compose.harness: skill refs print as
    their invocation affordance, the rest **bold**) on every PROSE line; fence
    interiors (masked) pass through verbatim -- immune by construction, never
    by regex luck."""
    return [l if i in mask else project_refs(l, harness)
            for i, l in enumerate(body_lines)]


def _formula_refs(slug: str, body_lines: list[str], mask: set[int]) -> list[str]:
    """The composed anchors, in order, from the cell's single PROSE `≜` formula
    line. A fenced `≜` is this package's math symbol, never the composition
    formula (references/formal-symbolic-notation.md) -- a cell whose only `≜`
    lines are fenced reads no prose formula here, never accidentally latching
    fenced math. No fallback: a skill without a prose formula composes nothing
    (returns []).

    PURE reader: it reports the prose `≜` refs and nothing else. The
    empty-provenance NOTE is NOT emitted here -- `≜`-absence is not emptiness
    when a Bindings region homes the composition (the bindings-homed skill, the
    cite-once norm). The single home for the empty-provenance warning is
    verify.py's `gate_skill_provenance`, keyed on the FINAL `composition_refs`
    result (≜ AND bindings both empty) -- so a bindings-homed skill never warns.
    Were the NOTE kept here it would fire on every bindings-homed skill (whose
    `≜` is correctly absent), a log contradicting the composed reality."""
    formula = next(
        (l for i, l in enumerate(body_lines) if "≜" in l and i not in mask), None
    )
    if formula is None:
        return []
    return list(dict.fromkeys(cells.REF.findall(formula)))  # first-seen, deduped


def _bindings_region(body_lines: list[str], mask: set[int]) -> list[int] | None:
    """The line indices of the cell's Bindings paragraph, or None if absent. The
    region is the contiguous run of PROSE lines starting at the `Bindings:`-led
    line and ending at the next blank line (a markdown paragraph break) or the
    next `## ` heading -- the boundary-binding block of a formal cell. Fence
    interiors (masked) are never the lead line and never extend the region: a
    fenced `Bindings:` is content, not the binding paragraph. Returns the first
    such paragraph (a cell has one boundary-binding block)."""
    start = next(
        (i for i, l in enumerate(body_lines)
         if i not in mask and BINDINGS_RE.match(l)),
        None,
    )
    if start is None:
        return None
    region = [start]
    for i in range(start + 1, len(body_lines)):
        line = body_lines[i]
        if not line.strip():  # blank line ends the paragraph
            break
        if line.startswith("## ") and i not in mask:  # a heading ends it too
            break
        region.append(i)
    return region


def _bindings_refs(body_lines: list[str], mask: set[int]) -> list[str]:
    """Every `[[ref]]` in the cell's Bindings paragraph, first-seen and deduped,
    regardless of binding verb (realize/bind/binds/...). This is the cell's
    composition under [[self-sufficient-formalism]]: the boundary-bindings are the
    single citation home, so composition is harvested from them, never restated.
    Returns [] if the cell has no Bindings region (caller falls back to `≜`)."""
    region = _bindings_region(body_lines, mask)
    if region is None:
        return []
    refs: list[str] = []
    for i in region:
        refs.extend(cells.REF.findall(body_lines[i]))
    return list(dict.fromkeys(refs))  # first-seen, deduped


def composition_refs(slug: str, body_lines: list[str], mask: set[int]) -> list[str]:
    """The skill's composed anchors, by the [[self-sufficient-formalism]]
    precedence: a Bindings region (the cite-once home) WINS -- composition is
    harvested from it and the `≜` formula is optional/redundant. Absent a Bindings
    region, composition is the single prose `≜` formula's refs (bindings-less
    skills: wake/handoff/weitermachen). The cite-twice case (both present) is
    flagged by verify.py, not here -- the composer just honors precedence."""
    if _bindings_region(body_lines, mask) is not None:
        return _bindings_refs(body_lines, mask)
    return _formula_refs(slug, body_lines, mask)


def compose_skill(slug: str, reader: str, harness: str) -> ComposedDoc:
    cell = cells.parse_cell(slug)
    name = slug
    desc = cell["fm"]["delineation"]
    body = cell["body"]
    body_lines = body.splitlines()
    mask = cells.fence_lines(body)  # the AST's fence verdict, computed once
    projected = _projected_lines(body_lines, mask, harness)

    heading = next(
        (l[2:].strip() for i, l in enumerate(body_lines)
         if l.startswith("# ") and i not in mask),
        slug,
    )

    # intro: preamble lines (after `# `, before first `## `), minus the formula.
    preamble, sections = _sections(body_lines, mask)
    intro: list[int] = []
    seen_h1 = False
    for i in preamble:
        line = body_lines[i]
        if line.startswith("# ") and not seen_h1 and i not in mask:
            seen_h1 = True
            continue
        if "≜" in line and i not in mask:  # prose formula line; fenced ≜ is content
            continue
        if seen_h1:
            intro.append(i)
    intro_text = "\n".join(projected[i] for i in intro).strip()

    refs = composition_refs(slug, body_lines, mask)

    out: list[str] = []
    out.append(f"# {heading}")
    out.append("")
    if intro_text:
        out.append(intro_text)
        out.append("")
    if refs:
        # Lean, one-line provenance -- names only, never the full delineations.
        # The operative body carries the meaning; the anchors just cite lineage.
        # Each name in its harness form: a skill ref is its /trigger affordance.
        out.append("Composed from " + " · ".join(ref_text(r, harness) for r in refs) + ".")
        out.append("")

    # authored sections: keep all, EXCEPT a `## Harness: <other>` selector; the
    # `## Harness: <target>` selector is kept and re-headed. A header that is not
    # an exact selector (e.g. `## Harness Notes`) is an ordinary section, kept.
    for head_i, line_idx in sections:
        m = HARNESS_RE.match(body_lines[head_i].rstrip())
        if m:  # a harness-variant selector
            if m.group(1) != harness:
                continue  # a non-target harness dialect -- drop it
            out.append(f"## Harness ({harness})")
        else:
            out.append(body_lines[head_i])
        for i in line_idx:
            out.append(projected[i])  # fence interiors verbatim, prose refs projected
        while out and out[-1] == "":  # trim trailing blanks; the join re-adds one
            out.pop()
        out.append("")

    body_text = "\n".join(out).rstrip() + "\n"
    return ComposedDoc(
        name=name, kind="skill", heading=heading, body=body_text,
        delineation=desc, reader=reader, harness=harness,
    )
