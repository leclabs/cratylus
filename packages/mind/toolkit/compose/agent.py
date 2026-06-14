"""Agent composer -- one `kind: agent` cell + its `[[ ]]` graph -> a ComposedDoc
body. Assembles, in order: heading, authored intro, the `≜`-formula dispositions
(resolved at the reader density) + genus dispositions, the persona delta, the
genus organs (verbatim-render cells -- the identity-&-memory protocol resolved
from [[identity-memory-stack]]'s `## Protocol` section), and the AGENTS.md scope
grants (accidents).

Originally moved verbatim from resolve.emit()'s body-building half so the bytes
matched; resolve.py now decorates + renders around this. The identity block was
hardcoded here (`_identity_block()`); B7 migrated it to the cell as a
`render: verbatim` organ -- a byte-identical no-op (the cell carries the exact
text, ASCII `--`/`->` preserved).
"""
from __future__ import annotations

import re
import sys

from core import cells
from core.ir import ComposedDoc
from compose.harness import project_refs
from compose.reader import render_ref

GRANT = re.compile(r"grant\s+@(\S+)\s+\[\[([a-z0-9-]+)\]\]\s+on\s+(\S+)")

# Genus dispositions: embodied by every agent *qua* agent (like the
# identity-memory protocol), emitted for all -- never copied into each cell's
# ≜ formula ([[cite-dont-copy]]). New genus traits go here, one home.
GENUS_DISPOSITIONS = ("semantic-whole-over-syntactic-substrate",)

# Genus organs: structural cells every agent carries *qua* agent, composed as
# genus refs so the oracle's R1 reaches them (one home, no parallel fidelity
# check) -- but NOT rendered as density-keyed disposition bullets. Each organ
# cell declares `render: verbatim`; the composer emits its `## Protocol` section
# body verbatim, density-immune, `{name}`-parameterized (replacing what was
# hardcoded in _identity_block()). The cell declares its own projection law and
# the machinery obeys generically -- the slug list here is bookkeeping (which
# refs the def declares for R1), never the render text (read from the cell).
GENUS_ORGANS = ("identity-memory-stack",)
# Front-matter `render:` value that routes a ref through the verbatim organ path
# instead of render_ref's density-keyed line; the section it emits verbatim.
VERBATIM_RENDER = "verbatim"
ORGAN_SECTION = "Protocol"

# Founder genus: principal-ic is essence for a founder *qua* founder (the
# [[founder-charter]]), bound to the polis subject -- emitted by the resolver for
# the founders, never a [[scope-grant]] on a path. The emission RULE is machinery
# (here, beside GENUS_DISPOSITIONS); the ROSTER -- *who* the founders are -- is
# constitution, read from the charter cell's `## Founders` section, never
# hardcoded here ([[cite-dont-copy]]).
FOUNDER_DISPOSITIONS = ("principal-ic",)
FOUNDER_CHARTER = "founder-charter"


def founder_slugs() -> tuple[str, ...]:
    """The founder agent-slugs, read from the `## Founders` section of the
    [[founder-charter]] cell -- the constitution names its founders, the machinery
    only reads the roster. Returns () if the charter is absent (the corpus has no
    founders declared yet)."""
    if not (cells.IDEAS / f"{FOUNDER_CHARTER}.md").exists():
        return ()
    body = cells.parse_cell(FOUNDER_CHARTER)["body"]
    mask = cells.fence_lines(body)
    out: list[str] = []
    in_section = False
    for i, line in enumerate(body.splitlines()):
        if line.startswith("## ") and i not in mask:
            in_section = line.lower().startswith("## founders")
            continue
        if in_section and i not in mask:
            out.extend(cells.REF.findall(line))
    seen: set[str] = set()
    return tuple(s for s in out if not (s in seen or seen.add(s)))


def grants_for(agent: str) -> list[tuple[str, str]]:
    """Parse `grant @agent [[exemplar]] on path` lines from mind/AGENTS.md.
    Returns (exemplar, path) accidents for this agent only."""
    out = []
    for agents_md in [cells.ROOT / "AGENTS.md"]:
        if not agents_md.exists():
            continue
        for m in GRANT.finditer(agents_md.read_text(encoding="utf-8")):
            who, exemplar, path = m.groups()
            path = path.strip("`")  # grant line is fenced in AGENTS.md
            if who == agent:
                out.append((exemplar, path))
    return out


def persona_delta(agent_cell: dict, harness: str) -> list[str]:
    """The agent cell's `## Persona` bullets -- the genuine identity delta
    ([[agent-identity-portability]] deltas-only). Returns a list of bullet items
    (emitted as a markdown list, never a '; '-joined run-on); [[x]] -> its
    harness projection (compose.harness), dropping the 'Deltas against ...'
    framing line."""
    body = agent_cell["body"]
    lines = body.splitlines()
    mask = cells.fence_lines(body)  # fenced lines are content, never structure
    section: list[str] = []
    in_persona = False
    for i, line in enumerate(lines):
        if line.startswith("## ") and i not in mask:
            in_persona = line.lower().startswith("## persona")
            continue
        if in_persona and i not in mask:  # a fenced line is never a bullet
            section.append(line)
    bullets = []
    for line in section:
        s = line.strip()
        if not s.startswith("- "):
            continue
        item = s[2:].strip()
        if item.lower().startswith("deltas against"):
            continue
        bullets.append(project_refs(item, harness))  # [[x]] -> harness form
    return bullets


def intro_paragraph(cell: dict, harness: str) -> str:
    """The authored prose between the cell's `# heading` and its first `## `
    section -- the body's identity line, kept distinct from the front-matter
    delineation so the def does not repeat the description verbatim. [[x]] ->
    its harness projection (compose.harness); falls back to the delineation if
    the cell has no intro prose."""
    body = cell["body"]
    mask = cells.fence_lines(body)
    out: list[str] = []
    seen_h1 = False
    for i, line in enumerate(body.splitlines()):
        if line.startswith("# ") and not seen_h1 and i not in mask:
            seen_h1 = True
            continue
        if line.startswith("## ") and i not in mask:
            break
        if "≜" in line and i not in mask:  # the prose formula renders as Dispositions, not intro
            continue
        if seen_h1:
            # fence interiors verbatim; [[x]] -> harness form on prose lines only
            out.append(line if i in mask else project_refs(line, harness))
    text = "\n".join(out).strip()
    if not text:
        return cell["fm"].get("delineation", "")
    return text


def composition_refs(agent_cell: dict) -> list[str]:
    """The agent's composed dispositions, in order, from its PROSE `≜`
    definitional formula -- the single line `<name> ≜ ... [[anchor]] ...` that
    defines the agent in terms of its anchors. ONLY the prose formula's refs are
    dispositions: a fenced `≜` is formal math
    (references/formal-symbolic-notation.md), never latched as the formula --
    a cell whose only `≜` lines are fenced falls through EXPLICITLY (logged).
    The intro's and the `## Persona` section's refs (archetype, influences) are
    not dispositions. Falls back to all non-persona prose refs if a cell has no
    formula yet."""
    body = agent_cell["body"]
    lines = body.splitlines()
    mask = cells.fence_lines(body)
    seen: set[str] = set()
    out: list[str] = []
    for i, line in enumerate(lines):
        if "≜" in line and i not in mask:
            for slug in cells.REF.findall(line):
                if slug not in seen:
                    seen.add(slug)
                    out.append(slug)
            return out
    if any("≜" in lines[i] for i in mask):
        print(
            f"NOTE   {agent_cell['slug']}: no prose ≜ formula (fenced ≜ is math, "
            f"not composition) -- using legacy non-persona-ref fallback",
            file=sys.stderr,
        )
    # legacy fallback: non-persona PROSE refs, first-seen (fences out of register)
    in_persona = False
    for i, line in enumerate(lines):
        if line.startswith("## ") and i not in mask:
            in_persona = line.lower().startswith("## persona")
        if not in_persona and i not in mask:
            for slug in cells.REF.findall(line):
                if slug not in seen:
                    seen.add(slug)
                    out.append(slug)
    return out


def is_verbatim_organ(slug: str) -> bool:
    """True if the cell declares `render: verbatim` -- routing it through the
    organ path (its `## Protocol` body emitted whole, density-immune) rather
    than render_ref's density-keyed disposition line."""
    return cells.parse_cell(slug)["fm"].get("render") == VERBATIM_RENDER


def render_organ(slug: str, name: str) -> list[str]:
    """The verbatim-organ render path -- a referenced cell whose front-matter is
    `render: verbatim` emits its `## Protocol` section body VERBATIM (the
    `## Protocol` heading itself is NOT emitted), `{name}`-substituted to the
    agent's sidecar dir, at ANY reader density (bypassing render_ref's name-only
    collapse). Load-bearing runtime instruction the def must carry in full --
    the cell is the one home ([[identity-memory-stack]]), the body is read from
    it, never hardcoded here. Trailing "" matches the block's emit spacing."""
    cell = cells.parse_cell(slug)
    section = cells.section_body(cell["body"], ORGAN_SECTION)
    return [line.replace("{name}", name) for line in section] + [""]


def compose_agent(slug: str, reader: str, harness: str) -> ComposedDoc:
    """Assemble the agent def body (no front-matter, no provenance header). The
    returned `body` is the exact text resolve.py hashes + frames."""
    cell = cells.parse_cell(slug)
    name = slug
    desc = cell["fm"]["delineation"]
    refs = composition_refs(cell)
    if slug in founder_slugs():  # founder genus leads: principal-ic is essence qua founder
        refs = list(FOUNDER_DISPOSITIONS) + [r for r in refs if r not in FOUNDER_DISPOSITIONS]
    for g in GENUS_DISPOSITIONS:  # embodied by every agent qua agent
        if g not in refs:
            refs.append(g)
    # Genus organs join `refs` so the oracle's R1 reaches their one home (the def
    # DECLARES the ref), but they render through the verbatim-organ path below --
    # NOT as density-keyed disposition bullets. Split them out of the bullet loop.
    for o in GENUS_ORGANS:
        if o not in refs:
            refs.append(o)
    organs = [r for r in refs if is_verbatim_organ(r)]
    dispositions = [r for r in refs if r not in organs]
    grants = grants_for(slug)

    heading = next(
        (l[2:].strip() for l in cell["body"].splitlines() if l.startswith("# ")),
        slug,
    )
    # Mark facet ([[agent-identity-portability]]): lifted out of the persona
    # bullets -- it projects into heading/front-matter, never re-listed as prose.
    persona = persona_delta(cell, harness)
    mark = ""
    kept: list[str] = []
    for item in persona:
        if item.lower().startswith("mark:"):
            mark = item.split(":", 1)[1].strip()
        else:
            kept.append(item)
    persona = kept
    emoji = mark.split("·", 1)[0].strip() if mark else ""
    if emoji:
        heading = f"{emoji} {heading}"
    body: list[str] = []
    body.append(f"# {heading}")
    body.append("")
    body.append(intro_paragraph(cell, harness))  # authored intro, not the verbatim delineation
    body.append("")
    if dispositions:
        body.append("Dispositions:")
        body.append("")
        for ref in dispositions:
            body.append(render_ref(ref, reader, harness))
        body.append("")
    if persona:
        body.append("Persona (delta against agent-identity-portability):")
        body.append("")
        for item in persona:
            body.append(f"- {item}")
        body.append("")
    # Genus organs (e.g. the identity-&-memory protocol) -- each verbatim organ
    # emits its `## Protocol` body whole + `{name}`-parameterized, density-immune,
    # resolved from the cell (one home), at the position the hardcoded
    # _identity_block() used to occupy.
    for organ in organs:
        body.extend(render_organ(organ, name))
    if grants:
        body.append("Scope grants (accidents -- not kernel):")
        body.append("")
        for exemplar, path in grants:
            grant_line = f"grant @{slug} [[{exemplar}]] on {path}"
            body.append(
                f"- `{grant_line}` -- within `{path}`, act under "
                f"**{exemplar}**: {cells.delineation(exemplar)}"
            )
        body.append("")

    body_text = "\n".join(body).rstrip() + "\n"
    return ComposedDoc(
        name=name, kind="agent", heading=heading, body=body_text,
        delineation=desc, reader=reader, harness=harness, mark=mark,
    )
