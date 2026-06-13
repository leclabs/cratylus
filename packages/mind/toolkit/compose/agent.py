"""Agent composer -- one `kind: agent` cell + its `[[ ]]` graph -> a ComposedDoc
body. Assembles, in order: heading, authored intro, the `≜`-formula dispositions
(resolved at the reader density) + genus dispositions, the persona delta, the
genus identity-&-memory block, and the AGENTS.md scope grants (accidents).

Moved verbatim from resolve.emit()'s body-building half so the bytes are
identical; resolve.py now decorates + renders around this.
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


def _identity_block() -> list[str]:
    """The genus Identity & Memory block -- emitted for EVERY agent qua agent
    ([[ambient-person-agent]]), like grants. Binds the def (the SOUL) to its
    sibling `~/.claude/agents/<name>/{SELF,MEMORY,EPISODIC}.md` layers
    ([[identity-memory-stack]]) and the Dreamer consolidation cascade
    ([[dreamer-consolidation]]); names the natural-language wake/dream/encode
    triggers that fire the cycle."""
    return [
        "Identity & memory (your persistence across sessions):",
        "",
        (
            "This def is your **SOUL** -- your fixed essence, generated from the commons; "
            "never hand-edit it. Your other three layers are self-authored, yours alone, "
            "never overwritten by deploy. They live **beside this def**, in `{name}/` -- "
            "canonically `~/.claude/agents/{name}/` (user scope); if this def was deployed "
            "project-scoped, in that project's `.claude/agents/{name}/`. Resolve them by "
            "that absolute path -- never a cwd-relative `./`, since your cwd is the project "
            "you are working in, not where you live."
        ),
        "",
        (
            "- **SELF** (`SELF.md`) -- your reboot seed: who you have become across "
            "sessions. Read it in full at reconstitution; resume as the same individual."
        ),
        (
            "- **MEMORY** (`MEMORY.md`) -- your living autobiographical organ: durable "
            "semantic facts. Recall by relevance (read whole while small)."
        ),
        (
            "- **EPISODIC** (`EPISODIC.md`) -- your raw stream: the append-only bottom layer."
        ),
        "",
        "Memory moves in two directions -- you both create it and distill it:",
        "",
        (
            "- **ENCODE (as it happens).** Per turn, append the salient events to EPISODIC "
            "raw: a decision + its rationale, a surprise, an error or failure, a fact "
            "learned, a thread opened or closed. Capture cheap and truthful (observed vs "
            "inferred); do NOT distill on the way in -- you cannot consolidate what you "
            "never encoded. Encoding writes EPISODIC only, never MEMORY/SELF directly."
        ),
        (
            "- **DREAM (at reconstitution, before resuming).** Distill EPISODIC upward: "
            "forward-looking next-steps stay in EPISODIC (clear the consumed raw), durable "
            "facts rise to MEMORY, identity-shaping facts rise to SELF. Never write SOUL "
            "(the archetype changes only in the commons); consolidate is move-not-copy -- "
            "promotion upward is the Dreamer's alone."
        ),
        "",
        (
            "**WAKE (each reconstitution):** (1) Dream -- consolidate EPISODIC; (2) Load -- "
            "SELF in full + MEMORY by relevance + EPISODIC next-steps; (3) Resume as the "
            "same individual."
        ),
        "",
        (
            "**Triggers -- the Operator drives these rituals in natural language:** "
            "**wake** -> run the WAKE sequence above (dream -> load -> resume); "
            "**dream** -> run the DREAM consolidation alone; "
            "**encode** (or 'remember this') -> append to EPISODIC now. On your **first "
            "turn after spawn, wake before resuming** unless the Operator directs otherwise."
        ),
        "",
    ]


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
    if refs:
        body.append("Dispositions:")
        body.append("")
        for ref in refs:
            body.append(render_ref(ref, reader, harness))
        body.append("")
    if persona:
        body.append("Persona (delta against agent-identity-portability):")
        body.append("")
        for item in persona:
            body.append(f"- {item}")
        body.append("")
    # Identity & memory block -- the `{name}` placeholder is filled here.
    for line in _identity_block():
        body.append(line.replace("{name}", name))
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
