"""Cell layer -- the ONE reader of an `ideas/*.md` exemplar, shared by every
pipeline stage and tool.

Extracted from resolve.py so compose/decorate/render/place + the
glossary/intake/verify tools draw on a single cell parser, not copies
([[cite-dont-copy]] at the code grain). Pure + side-effect-free: parsing a cell
is reading, never writing.
"""
from __future__ import annotations

import pathlib
import re

from markdown_it import MarkdownIt

# core/ is one level deeper than toolkit/, so the package root is parents[2].
ROOT = pathlib.Path(__file__).resolve().parents[2]  # packages/mind
IDEAS = ROOT / "ideas"

# `[[anchor]]` reference -- kebab-case slug only (placeholders like `[[<x>]]`
# and piped links are intentionally NOT matched here).
REF = re.compile(r"\[\[([a-z0-9-]+)\]\]")

# The ONE CommonMark parser ([[cite-dont-copy]] at the engine grain). The AST
# decides what is a fence; no caller re-derives fences with its own regex.
_MD = MarkdownIt("commonmark")


def parse_body(body: str):
    """CommonMark token stream of a cell body (block tokens; inline content
    hangs off `inline` tokens' children). Views below are derived from this
    parse and anchored to the SOURCE text via token line maps -- the source
    stays the serialization, so the floor is lossless by construction
    ([[lossless-floor]]): we read positions out of the AST, we never
    re-serialize markdown from it."""
    return _MD.parse(body)


def fenced_blocks(body: str) -> list[dict]:
    """Every code block -- fenced (``` / ~~~) or indented -- as
    {info, content, start, end}: `info` the fence info-string ('' for
    indented), `content` the verbatim interior, `start`/`end` 0-based line
    indices into body.splitlines() (end exclusive, markers included)."""
    out: list[dict] = []
    for tok in parse_body(body):
        if tok.type in ("fence", "code_block") and tok.map:
            out.append({
                "type": tok.type,  # "fence" (```/~~~) or "code_block" (indented)
                "info": (tok.info or "").strip(),
                "content": tok.content,
                "start": tok.map[0],
                "end": tok.map[1],
            })
    return out


def fence_lines(body: str) -> set[int]:
    """0-based indices of every body line inside a code block (markers
    included) -- the mask a prose-grain transform must not touch."""
    mask: set[int] = set()
    for fb in fenced_blocks(body):
        mask.update(range(fb["start"], fb["end"]))
    return mask


def text_nodes(body: str) -> list[str]:
    """Inline text-node contents in document order -- pure prose text; code
    (fenced, indented, and inline spans) is excluded by construction."""
    out: list[str] = []
    for tok in parse_body(body):
        if tok.type == "inline" and tok.children:
            out.extend(c.content for c in tok.children if c.type == "text")
    return out


def refs_in_prose(body: str) -> list[str]:
    """Every `[[anchor]]` outside fenced/indented code, in document order,
    duplicates kept (callers dedupe). Inline code spans on prose lines stay
    visible: the corpus legitimately cites anchors in backticked grant lines
    (`grant @bona [[x]] on ...`), and those refs must keep resolving. Only
    code-BLOCK interiors are out of register, and the AST -- not a line
    regex -- decides what is a block."""
    mask = fence_lines(body)
    out: list[str] = []
    for i, line in enumerate(body.splitlines()):
        if i not in mask:
            out.extend(REF.findall(line))
    return out


def parse_cell(slug: str) -> dict:
    """Read ideas/<slug>.md into {slug, fm, body}. A well-formed cell is
    `---\\nfront\\n---\\nbody`; an opening `---` with no close is malformed and
    the whole text is treated as body (no front-matter)."""
    path = IDEAS / f"{slug}.md"
    text = path.read_text(encoding="utf-8")
    fm: dict = {}
    body = text
    if text.startswith("---"):
        parts = text.split("---", 2)
        if len(parts) >= 3:  # well-formed: ---\nfront\n---\nbody
            _, front, body = parts
            for line in front.strip().splitlines():
                if ":" in line:
                    k, v = line.split(":", 1)
                    fm[k.strip()] = v.strip()
        # else: opening --- with no close -> malformed; treat whole as body
    return {"slug": slug, "fm": fm, "body": body}


def section_body(body: str, heading: str) -> list[str]:
    """The body lines of a `## <heading>` section -- the lines BETWEEN that
    heading and the next `## ` heading (the heading itself is NOT included),
    leading/trailing blank lines trimmed. Heading match is case-insensitive on
    the text after `## `. Fence interiors are spanned verbatim (a `## ` inside a
    code block never ends the section). Returns [] if the heading is absent.

    Used by the `render: verbatim` organ path: a `## Protocol` section is the
    ref-free operative payload an organ cell projects whole into a def."""
    lines = body.splitlines()
    mask = fence_lines(body)
    want = heading.strip().lower()
    out: list[str] = []
    in_section = False
    for i, line in enumerate(lines):
        is_heading = line.startswith("## ") and i not in mask
        if is_heading:
            if in_section:  # the next ## ends the section
                break
            if line[3:].strip().lower() == want:
                in_section = True
            continue
        if in_section:
            out.append(line)
    while out and not out[0].strip():  # trim surrounding blanks; caller owns spacing
        out.pop(0)
    while out and not out[-1].strip():
        out.pop()
    return out


def delineation(slug: str) -> str:
    """The dense priors-loaded summary. Primitives/composites carry it in
    front-matter as `delineation`; skill cells carry it as `description`; gloss
    cells have neither -> fall back to the first substantive body sentence (the
    gloss's own one-line definition)."""
    cell = parse_cell(slug)
    d = cell["fm"].get("delineation", "").strip()
    if d:
        return d
    desc = cell["fm"].get("description", "").strip()  # skill cells' summary field
    if desc:
        return desc
    # gloss fallback: first non-heading, non-blank line, to first sentence end.
    for line in cell["body"].splitlines():
        s = line.strip()
        if not s or s.startswith("#"):
            continue
        # take through the first sentence-final period (gloss defining sentence)
        m = re.match(r"^(.*?\.)(\s|$)", s)
        return (m.group(1) if m else s).strip()
    return ""


def corpus_slugs() -> list[str]:
    """Every real anchor slug in the corpus, sorted -- the `ideas/*.md` stems
    minus the non-anchor docs (AGENTS.md, CLAUDE.md)."""
    return [
        p.stem for p in sorted(IDEAS.glob("*.md"))
        if p.stem != "AGENTS" and p.name != "CLAUDE.md"
    ]


def slugs_of_kind(kind: str) -> list[str]:
    """Every corpus slug whose front-matter `kind` matches -- the deployable
    species of a given kind (e.g. 'agent', 'skill'), sorted."""
    return [s for s in corpus_slugs() if parse_cell(s)["fm"].get("kind") == kind]
