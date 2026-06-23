"""Agent composer -- one `kind: agent` cell + its `[[ ]]` graph -> a ComposedDoc
body. Assembles, in order: heading, authored intro, the `≜`-formula dispositions
(resolved at the reader density) + genus dispositions, the persona delta, the
genus organs (verbatim-render cells -- the identity-&-memory protocol resolved
from [[memory]]'s `## Protocol` section), and the AGENTS.md scope
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

# Section-driven organs: an agent archetype DECLARES the organs it carries as
# named anatomy sections (`## Memory`, ...) compositing the organ *by reference*
# ([[cite-dont-copy]]) -- no hardcoded genus list. The composer reads those refs
# (section_organ_refs) and renders the `render: verbatim` ones through the organ
# path (their `## Protocol` body, density-immune, `{name}`-parameterized), at the
# position the hardcoded list used to occupy. A non-verbatim organ-section ref is
# source-structure only (glossary-legible), never rendered into the def -- so the
# fuller anatomy can be authored byte-neutrally.
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
    if not cells.exists(FOUNDER_CHARTER):
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
    ([[agent-identity-facets]] deltas-only). Returns a list of bullet items
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
            for slug in cells.ANY_REF.findall(line):
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
            for slug in cells.ANY_REF.findall(line):
                if slug not in seen:
                    seen.add(slug)
                    out.append(slug)
    return out


def is_verbatim_organ(slug: str) -> bool:
    """True if the cell declares `render: verbatim` -- routing it through the
    organ path (its `## Protocol` body emitted whole, density-immune) rather
    than render_ref's density-keyed disposition line."""
    if cells.parse_block_ref(slug) is not None:  # a lexicon primitive is never an organ
        return False
    return cells.parse_cell(slug)["fm"].get("render") == VERBATIM_RENDER


def section_organ_refs(agent_cell: dict) -> list[str]:
    """The verbatim-organ refs an archetype declares in its anatomy sections --
    any `## ` section other than `## Persona` (the persona-delta path), scanned
    for `[[ ]]` refs that resolve to `render: verbatim` organ cells, first-seen
    order. Replaces the hardcoded genus list: the archetype composites its organs
    BY REFERENCE in named sections (e.g. `## Memory` -> [[memory]]) and the
    composer renders the verbatim ones. A non-verbatim organ-section ref is
    source-structure only (never rendered), so the fuller anatomy can be authored
    byte-neutrally."""
    body = agent_cell["body"]
    mask = cells.fence_lines(body)
    out: list[str] = []
    seen: set[str] = set()
    in_organ_section = False
    for i, line in enumerate(body.splitlines()):
        if line.startswith("## ") and i not in mask:
            in_organ_section = not line.lower().startswith("## persona")
            continue
        if in_organ_section and i not in mask:
            for slug in cells.ANY_REF.findall(line):
                if slug not in seen and is_verbatim_organ(slug):
                    seen.add(slug)
                    out.append(slug)
    return out


def _is_agent(slug: str) -> bool:
    """True if `slug` names a `kind: agent` cell -- an EMBODIED archetype a
    composing agent inherits a composition from (e.g. principal-ic). A missing
    cell is not an archetype (verify's REF gate owns the dangling-ref report)."""
    try:
        return cells.parse_cell(slug)["fm"].get("kind") == "agent"
    except FileNotFoundError:
        return False


def transitive_verbatim_organs(refs: list[str]) -> list[str]:
    """Verbatim organs reachable TRANSITIVELY through embodied-archetype refs,
    in stable first-seen order, de-duplicated, EXCLUDING organs already in `refs`
    (those the def cites directly). A `render: verbatim` organ embodied by an
    archetype (principal-ic embodies [[consensus-quality-pick]])
    must reach every agent embodying that archetype (mav, the reviewer, nico via
    founder genus) -- it OVERRIDES a competing base-prior and so must land in the
    def WHOLE, not collapse to the archetype's bare anchor.

    ONLY verbatim organs propagate. A normal (non-verbatim) disposition an
    archetype composes stays ENCAPSULATED behind the archetype's bare anchor
    (dereferenceable, no def bloat). The walk descends ONLY through embodied
    archetypes (`kind: agent` refs) -- a verbatim organ is a leaf, never itself a
    descent edge, so the recursion terminates on the (finite, acyclic-by-corpus)
    archetype graph; a `seen` guard makes a cycle safe regardless."""
    already = set(refs)
    collected: list[str] = []
    seen_archetypes: set[str] = set()

    def walk(archetype: str) -> None:
        if archetype in seen_archetypes:
            return
        seen_archetypes.add(archetype)
        for ref in composition_refs(cells.parse_cell(archetype)):
            if is_verbatim_organ(ref):
                if ref not in already and ref not in collected:
                    collected.append(ref)
            elif _is_agent(ref):  # an embodied archetype: descend transitively
                walk(ref)

    for ref in refs:
        if _is_agent(ref):
            walk(ref)
    return collected


def render_organ(slug: str, name: str) -> list[str]:
    """The verbatim-organ render path -- a referenced cell whose front-matter is
    `render: verbatim` emits its `## Protocol` section body VERBATIM (the
    `## Protocol` heading itself is NOT emitted), `{name}`-substituted to the
    agent's sidecar dir, at ANY reader density (bypassing render_ref's name-only
    collapse). Load-bearing runtime instruction the def must carry in full --
    the cell is the one home ([[memory]]), the body is read from
    it, never hardcoded here. Trailing "" matches the block's emit spacing."""
    cell = cells.parse_cell(slug)
    section = cells.section_body(cell["body"], ORGAN_SECTION)
    return [line.replace("{name}", name) for line in section] + [""]


# --- new composite-agent form (re-individuate-organ-anatomy, c9bd76c) -----------
# An agent cell's body is an organ SELECTION VECTOR over the 23 organ catalogs:
# a schema formula `<name> ≜ ⊕{organ ↦ value ∈ {organ}-catalog}` then one
# `organ value` (or `organ {v1 · v2 · …}`) line per organ, each value resolving to
# `<root>/<organ>/<value>.md`. The composer INLINES each chosen value cell's body
# under a readable `## <Organ>` heading -> a full, human/LLM-readable def. This is
# a DISTINCT projection from the legacy prose-`≜`-formula form (still used by the
# verify/round-trip fixtures); the two are told apart by the schema sentinel below.
SELECTION_FORMULA = "⊕{organ ↦"  # the canonical new-form formula's signature

# The 23 organ catalogs an agent selects over -- a value line whose first token is
# one of these is an organ selection (NOT prose). Derived from the on-disk catalog
# dirs so a new organ needs no code change: a dir holding a README.md + ≥1 value
# cell IS an organ catalog. Cached on the corpus root (moves with cells.ROOT).
_organ_cache: dict = {}


def organ_catalogs() -> set[str]:
    """The organ-catalog directory names under the corpus root -- every dir that
    carries a README.md (the human-facing organ gloss) and at least one value
    cell. The closed set an agent's selection vector ranges over."""
    root = cells.ROOT
    if root not in _organ_cache:
        out: set[str] = set()
        for d in sorted(root.iterdir()):
            if d.is_dir() and (d / "README.md").exists():
                if any(p.name != "README.md" for p in d.glob("*.md")):
                    out.add(d.name)
        _organ_cache[root] = out
    return _organ_cache[root]


def is_selection_form(cell: dict) -> bool:
    """True if an agent cell is the new organ-selection-vector form (carries the
    `⊕{organ ↦ …}` schema formula), vs the legacy prose-`≜` composition form."""
    mask = cells.fence_lines(cell["body"])
    for i, line in enumerate(cell["body"].splitlines()):
        if i not in mask and SELECTION_FORMULA in line:
            return True
    return False


def organ_title(organ: str) -> str:
    """A readable `## ` heading for an organ dir name: `register-fit` ->
    `Register-Fit`, `disposition-memory` -> `Disposition-Memory`."""
    return "-".join(w.capitalize() for w in organ.split("-"))


def _strip_value(tok: str) -> str:
    """Normalize one selection value token to its bare anchor. The corpus authors a
    selection value in EITHER surface -- bare `guarino-formal-ontologist` or the
    wikilink `[[guarino-formal-ontologist]]` -- so both must resolve to the same
    `<organ>/<value>.md` cell. Strips surrounding `[[ ]]` and whitespace."""
    tok = tok.strip()
    m = re.fullmatch(r"\[\[([a-z0-9-]+)\]\]", tok)
    return m.group(1) if m else tok


def parse_selection(cell: dict) -> list[tuple[str, list[str]]]:
    """The agent's organ selections in source order: a list of
    `(organ, [value, …])` for every body line `organ value` or
    `organ {v1 · v2 · …}` whose first token is a live organ catalog. A value is
    authored bare or as a `[[wikilink]]` (both normalize to the bare anchor). The
    schema formula line, headings, blanks, and fenced lines are skipped."""
    catalogs = organ_catalogs()
    mask = cells.fence_lines(cell["body"])
    out: list[tuple[str, list[str]]] = []
    for i, line in enumerate(cell["body"].splitlines()):
        if i in mask:
            continue
        s = line.strip()
        if not s or s.startswith("#") or SELECTION_FORMULA in s:
            continue
        parts = s.split(None, 1)
        if len(parts) != 2:
            continue
        organ, rest = parts[0], parts[1].strip()
        if organ not in catalogs:
            continue
        if rest.startswith("{") and rest.endswith("}"):
            values = [_strip_value(v) for v in rest[1:-1].split("·") if v.strip()]
        else:
            values = [_strip_value(rest)]
        out.append((organ, [v for v in values if v]))
    return out


def value_cell_path(organ: str, value: str):
    """The source path of an organ VALUE cell `<root>/<organ>/<value>.md`, or
    None if absent. Resolved by the `(organ, value)` PAIR -- NOT a bare slug --
    because a value token recurs across organs (`emit-fenced-review` lives in
    both `effectors/` and `enaction/`), so a global-slug lookup would be
    ambiguous ([[precise-circumscription]])."""
    p = cells.ROOT / organ / f"{value}.md"
    return p if p.is_file() else None


def value_cell_body(organ: str, value: str) -> str:
    """The inlined body of an organ value cell: its text with the `---fm---`
    front-matter stripped. A missing value cell degrades VISIBLY to a marker
    line ([[degrade-visibly]]) rather than a silent gap -- verify owns the
    dangling-ref FAIL. (Holding is a FORWARD relation -- an agent binds a value
    by citing it in its selection vector, the single source of truth -- so the
    value cell carries no holders roster to strip; gate_no_holders enforces it.)"""
    p = value_cell_path(organ, value)
    if p is None:
        return f"_(unresolved organ value `{organ}/{value}` -- no cell)_"
    text = p.read_text(encoding="utf-8")
    body = text
    if text.startswith("---"):
        parts = text.split("---", 2)
        if len(parts) >= 3:
            body = parts[2]
    return body.strip()


def _persona_value(selection: list[tuple[str, list[str]]]) -> str | None:
    """The agent's chosen `persona` value (its first selected value), the source
    of the def's description + mark."""
    for organ, values in selection:
        if organ == "persona" and values:
            return values[0]
    return None


def _mark_from_persona(persona_value: str | None) -> str:
    """The `emoji · hue` mark facet, parsed from the persona value cell's trailing
    `<emoji>·<hue>` token (e.g. `✈️·green`). Returns '' if no such token is found."""
    if persona_value is None:
        return ""
    p = value_cell_path("persona", persona_value)
    if p is None:
        return ""
    body = value_cell_body("persona", persona_value)
    m = re.search(r"([^\s·]+)·(cyan|green|blue|red|orange|purple|yellow|"
                  r"magenta|teal|gray|grey|pink|indigo|violet|amber|lime)\b", body)
    return f"{m.group(1)} · {m.group(2)}" if m else ""


def _definiens(organ: str, value: str | None) -> str:
    """The dense one-line definiens of a value cell: the text after its `≜` on the
    first defining line (the σ*_LLM bound). Falls back to the whole first line."""
    if value is None:
        return ""
    body = value_cell_body(organ, value)
    for line in body.splitlines():
        s = line.strip()
        if not s:
            continue
        if "≜" in s:
            return s.split("≜", 1)[1].strip()
        return s
    return ""


def compose_agent_selection(slug: str, reader: str, harness: str) -> ComposedDoc:
    """New-form composer: inline an agent's organ SELECTION VECTOR into a full def.
    Each `organ value` line -> a `## <Organ>` section carrying the chosen value
    cell(s)' body inlined ([[cite-dont-copy]] at the projection grain: the value
    cell is the one home, the def is its faithful projection). The `description`
    front-matter is the persona definiens; the mark (emoji·hue) is parsed from the
    persona cell."""
    cell = cells.parse_cell(slug)
    name = slug
    heading = next(
        (l[2:].strip() for l in cell["body"].splitlines() if l.startswith("# ")),
        slug,
    )
    selection = parse_selection(cell)
    persona_value = _persona_value(selection)
    mark = _mark_from_persona(persona_value)
    emoji = mark.split("·", 1)[0].strip() if mark else ""
    if emoji:
        heading = f"{emoji} {heading}"
    # Description = the persona definiens (who the agent is), the router-match copy.
    desc = _definiens("persona", persona_value) or slug

    body: list[str] = []
    body.append(f"# {heading}")
    body.append("")
    body.append(f"**{slug}** — an agent composited from its organ anatomy: each "
                f"section below is one organ's selected value, inlined from the "
                f"`packages/mind/<organ>/` catalogs.")
    body.append("")
    for organ, values in selection:
        body.append(f"## {organ_title(organ)}")
        body.append("")
        for value in values:
            body.append(value_cell_body(organ, value))
            body.append("")
    # Genus: every agent carries the memory protocol verbatim ({name}-parameterized)
    # -- the encode/wake/dream discipline. `memory` is the deploy:skill-dir,
    # render:verbatim cell; its `## Protocol` projects into every SOUL (the bundled
    # `episodic` tool ships separately as the host memory skill). One home, projected.
    if cells.exists("memory") and is_verbatim_organ("memory"):
        body.append("## Memory")
        body.append("")
        body.extend(render_organ("memory", name))
    body_text = "\n".join(body).rstrip() + "\n"
    return ComposedDoc(
        name=name, kind="agent", heading=heading, body=body_text,
        delineation=desc, reader=reader, harness=harness, mark=mark,
    )


def compose_agent(slug: str, reader: str, harness: str) -> ComposedDoc:
    """Assemble the agent def body (no front-matter, no provenance header). The
    returned `body` is the exact text resolve.py hashes + frames. Dispatches on
    the cell's FORM: the new organ-selection vector (`⊕{organ ↦ …}`) inlines its
    organ value cells; the legacy prose-`≜` form walks its `[[ ]]` composition
    graph (still exercised by the verify/round-trip fixtures)."""
    cell = cells.parse_cell(slug)
    if is_selection_form(cell):
        return compose_agent_selection(slug, reader, harness)
    name = slug
    desc = cell["fm"]["delineation"]
    refs = composition_refs(cell)
    if slug in founder_slugs():  # founder genus leads: principal-ic is essence qua founder
        refs = list(FOUNDER_DISPOSITIONS) + [r for r in refs if r not in FOUNDER_DISPOSITIONS]
    for g in GENUS_DISPOSITIONS:  # embodied by every agent qua agent
        if g not in refs:
            refs.append(g)
    # Section-declared organs join `refs` so the oracle's R1 reaches their one
    # home (the archetype DECLARES the ref in an anatomy section), but they render
    # through the verbatim-organ path below -- NOT as density-keyed bullets.
    for o in section_organ_refs(cell):
        if o not in refs:
            refs.append(o)
    # Transitive verbatim organs: a `render: verbatim` organ embodied by an
    # archetype this agent embodies (principal-ic -> recommendation-style) must
    # reach the def WHOLE -- it overrides a competing base-prior, so it cannot
    # collapse to the archetype's bare anchor. Collected here (after founder/genus
    # injection so embodied archetypes are in `refs`), appended to the organs that
    # render verbatim below; NOT to the bullet dispositions. Only verbatim organs
    # cross the archetype boundary; normal dispositions stay encapsulated.
    inherited_organs = transitive_verbatim_organs(refs)
    organs = [r for r in refs if is_verbatim_organ(r)] + inherited_organs
    dispositions = [r for r in refs if r not in organs]
    grants = grants_for(slug)

    heading = next(
        (l[2:].strip() for l in cell["body"].splitlines() if l.startswith("# ")),
        slug,
    )
    # Mark facet ([[agent-identity-facets]]): lifted out of the persona
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
        body.append("Persona (delta against agent-identity-facets):")
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
