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
LEXICON = ROOT / "lexicon"  # γ2-B: primitive blocks, per-kind files lexicon/<kind>.md
MINDDIR = ROOT / "mind"     # γ2-B: composites, mind/<kind>/<organ>/<slug>.md

# `[[anchor]]` reference -- kebab-case slug only (placeholders like `[[<x>]]`
# and piped links are intentionally NOT matched here).
REF = re.compile(r"\[\[([a-z0-9-]+)\]\]")
# Block-ref grammar (slice μ): `[[<file>#^<block>]]` -- an Obsidian block reference
# addressing one block within a shared source file (the `lexicon` of primitive
# blocks: a primitive is a block, not a file -- csf-canonicalization §4.1). Both
# segments are anchors. Kept SEPARATE from REF so plain-anchor consumers are
# unaffected; the block-aware consumers (verify validation, projection) opt in.
BLOCK_REF = re.compile(r"\[\[([a-z0-9-]+)#\^([a-z0-9-]+)\]\]")
# ANY_REF: one `[[ ]]` whose inside is a plain anchor OR a block-ref -- the
# projection grain (project_refs) substitutes both. Captures the WHOLE inner
# token (`anchor` or `file#^block`); callers normalize via ref_display.
ANY_REF = re.compile(r"\[\[([a-z0-9-]+(?:#\^[a-z0-9-]+)?)\]\]")


def ref_display(token: str) -> str:
    """The display anchor of a ref token: the block-id for a block-ref
    `file#^block` (the primitive's own anchor), else the token unchanged. One
    home for the block-ref -> name rule ([[cite-dont-copy]])."""
    br = parse_block_ref(token)
    return br[1] if br else token

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
            # block-refs (slice μ) normalize to their lexicon-FILE home so the R1
            # totality walk sees the file as the dependency (the block's own
            # existence is gated separately by gate_schema_and_refs). Plain
            # anchors pass through unchanged.
            for tok in ANY_REF.findall(line):
                br = parse_block_ref(tok)
                out.append(br[0] if br is not None else tok)
    return out


# γ2-B lexicon block delimiter: `<!-- ^<anchor> -->` on its own line opens a
# primitive block whose body is the VERBATIM original cell text (front matter
# included) up to the next marker -- so parse_cell reconstructs a byte-identical
# dict and the projection is storage-invariant ([[regenerate-without-clobbering]]).
_LEX_MARKER = re.compile(r"^<!-- \^([a-z0-9-]+) -->$", re.M)
# Indexes are cached per corpus-ROOT (IDEAS.parent) so monkeypatching cells.IDEAS
# to an isolated fixture corpus moves the lexicon/mind homes with it -- a single
# patch isolates the whole storage layer.
_lex_cache: dict = {}
_comp_cache: dict = {}


def reset_storage_caches() -> None:
    """Drop the lexicon/composite indexes (tests that write fixtures mid-run)."""
    _lex_cache.clear()
    _comp_cache.clear()


def _lexicon_index() -> dict:
    """slug -> (lexicon_file, verbatim_cell_text) for every primitive block in
    `<root>/lexicon/<kind>.md`, keyed on the live corpus root."""
    root = IDEAS.parent
    if root not in _lex_cache:
        out: dict = {}
        lexdir = root / "lexicon"
        if lexdir.is_dir():
            for f in sorted(lexdir.glob("*.md")):
                text = f.read_text(encoding="utf-8")
                marks = list(_LEX_MARKER.finditer(text))
                for i, m in enumerate(marks):
                    start = m.end() + 1  # past the marker line's trailing newline
                    end = marks[i + 1].start() if i + 1 < len(marks) else len(text)
                    out[m.group(1)] = (f, text[start:end])
        _lex_cache[root] = out
    return _lex_cache[root]


def _composite_index() -> dict:
    """slug -> path for every composite cell. Two homes, read polymorphically so a
    migration moves files without changing resolution ([[regenerate-without-clobbering]]):
    the FLAT layout `<root>/{agents,skills}/<slug>.md` (the mind-structure-flatten
    target) and the legacy NESTED `<root>/mind/<kind>/<organ>/<slug>.md` (γ2-B, being
    retired by the flat migration). Flat wins on a slug collision (post-migration home)."""
    root = IDEAS.parent
    if root not in _comp_cache:
        out: dict = {}
        minddir = root / "mind"
        if minddir.is_dir():
            for q in sorted(minddir.glob("*/*/*.md")):
                out[q.stem] = q
        for sub in ("agents", "skills"):  # flat composite homes (mind-structure-flatten)
            d = root / sub
            if d.is_dir():
                for q in sorted(d.glob("*.md")):
                    out[q.stem] = q  # flat overrides a stale nested entry
        _comp_cache[root] = out
    return _comp_cache[root]


def _cell_text(slug: str) -> str:
    """The raw `---fm---body` text of a cell, from whichever home holds it:
    flat ideas file -> dir-form -> composite mind/<kind>/<organ>/ -> lexicon block.
    A file home wins over a lexicon block (back-compat during migration)."""
    flat = IDEAS / f"{slug}.md"
    if flat.exists():
        return flat.read_text(encoding="utf-8")
    d = cell_dir(slug)
    if d is not None:
        return (d / f"{slug}.md").read_text(encoding="utf-8")
    comp = _composite_index().get(slug)
    if comp is not None:
        return comp.read_text(encoding="utf-8")
    lex = _lexicon_index().get(slug)
    if lex is not None:
        return lex[1]
    raise FileNotFoundError(
        f"no cell for {slug!r}: absent in ideas/, mind/<kind>/<organ>/, lexicon/"
    )


def exists(slug: str) -> bool:
    """True if `slug` names a live cell in any home (file or lexicon block)."""
    return (
        (IDEAS / f"{slug}.md").exists()
        or cell_dir(slug) is not None
        or slug in _composite_index()
        or slug in _lexicon_index()
    )


def cell_dir(slug: str) -> pathlib.Path | None:
    """The source directory of a dir-form cell `ideas/<slug>/` (body at
    `<slug>/<slug>.md`, companion assets beside it), or None for a flat cell.
    A cell is promoted to dir-form ONLY to carry assets; flat stays the default."""
    d = IDEAS / slug
    return d if (d / f"{slug}.md").exists() else None


def cell_path(slug: str) -> pathlib.Path:
    """The cell's body file: flat `ideas/<slug>.md`, else dir-form
    `ideas/<slug>/<slug>.md`. Flat takes precedence; a missing cell resolves to
    the flat path so the read raises a clear FileNotFoundError naming it."""
    flat = IDEAS / f"{slug}.md"
    if flat.exists():
        return flat
    d = cell_dir(slug)
    if d is not None:
        return d / f"{slug}.md"
    comp = _composite_index().get(slug)
    if comp is not None:
        return comp
    lex = _lexicon_index().get(slug)
    if lex is not None:
        return lex[0]  # the lexicon FILE (display/error locator; block via _cell_text)
    return flat  # missing -> flat path for a clear FileNotFoundError


def parse_cell(slug: str) -> dict:
    """Read a cell (flat `ideas/<slug>.md` or dir-form `ideas/<slug>/<slug>.md`)
    into {slug, fm, body}. A well-formed cell is `---\\nfront\\n---\\nbody`; an
    opening `---` with no close is malformed and the whole text is treated as
    body (no front-matter)."""
    text = _cell_text(slug)
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


def parse_block_ref(token: str):
    """`<file>#^<block>` -> (file, block); None if the token is not a block-ref.
    `token` is the inside of a `[[ ]]` (no brackets)."""
    m = re.fullmatch(r"([a-z0-9-]+)#\^([a-z0-9-]+)", token.strip())
    return (m.group(1), m.group(2)) if m else None


def block_body(file_slug: str, block_id: str):
    """The text of the block tagged ` ^<block_id>` in `<file_slug>.md` -- the
    Obsidian block-reference target for `[[<file_slug>#^<block_id>]]` (slice μ:
    the lexicon's primitive-block addressing). A block is the contiguous run of
    non-blank, non-heading lines ending on the line that carries the marker;
    returns that text with the trailing marker stripped, or None if the file or
    the block is absent. Fence interiors are spanned verbatim (a marker inside a
    code block is not a block tag). The one resolver every block-aware consumer
    reads -- never hand-rolled elsewhere ([[cite-dont-copy]])."""
    try:
        cell = parse_cell(file_slug)
    except FileNotFoundError:
        return None
    lines = cell["body"].splitlines()
    mask = fence_lines(cell["body"])
    marker = f"^{block_id}"
    end = None
    for i, line in enumerate(lines):
        if i not in mask and line.rstrip().endswith(marker):
            end = i
            break
    if end is None:
        return None
    start = end
    while start > 0:
        prev = lines[start - 1]
        if not prev.strip() or prev.startswith("#"):
            break
        start -= 1
    block = lines[start:end + 1]
    block[-1] = block[-1].rstrip()
    if block[-1].endswith(marker):
        block[-1] = block[-1][:-len(marker)].rstrip()
    text = "\n".join(block).strip()
    return text or None


def delineation(slug: str) -> str:
    """The dense priors-loaded summary. Primitives/composites carry it in
    front-matter as `delineation`; skill cells carry it as `description`; gloss
    cells have neither -> fall back to the first substantive body sentence (the
    gloss's own one-line definition)."""
    br = parse_block_ref(slug)
    if br is not None:  # a block-ref's delineation IS its lexicon block body
        return block_body(br[0], br[1]) or ""
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
    """Every real anchor slug in the corpus, sorted -- the flat `ideas/*.md`
    stems plus dir-form cells `ideas/<slug>/<slug>.md`, minus the non-anchor docs
    (AGENTS.md, CLAUDE.md). A directory under ideas/ that holds no `<dir>/<dir>.md`
    body (e.g. graphify-out) is not a cell and is skipped."""
    flat = [
        p.stem for p in IDEAS.glob("*.md")
        if p.stem != "AGENTS" and p.name != "CLAUDE.md"
    ]
    dir_form = [
        d.name for d in IDEAS.iterdir()
        if d.is_dir() and (d / f"{d.name}.md").exists()
    ]
    composite = list(_composite_index().keys())   # mind/<kind>/<organ>/<slug>.md
    lexicon = list(_lexicon_index().keys())        # lexicon/<kind>.md blocks
    return sorted(set(flat) | set(dir_form) | set(composite) | set(lexicon))


def slugs_of_kind(kind: str) -> list[str]:
    """Every corpus slug whose front-matter `kind` matches -- the deployable
    species of a given kind (e.g. 'agent', 'skill'), sorted."""
    return [s for s in corpus_slugs() if parse_cell(s)["fm"].get("kind") == kind]


# Deployment is a projection axis ORTHOGONAL to `kind` (a cell has exactly one
# kind; how it deploys is a separate accident). `deploy: skill-dir` lets a
# non-skill cell ALSO place as a host `skills/<slug>/` dir -- e.g. the `memory`
# organ (kind: structure) both projects its `## Protocol` verbatim into SOULs AND
# deploys as the home that carries the bundled `episodic` tool ("one cell, two
# deploy fates", memory-home-dual-deploy).
DEPLOY_AS_SKILL_DIR = "skill-dir"


def deploys_as_skill_dir(slug: str) -> bool:
    """True if a cell deploys as a host skill dir WITHOUT being `kind: skill` --
    it carries `deploy: skill-dir`. Such a cell renders SKILL.md via the
    dedicated skill-dir path (its `## Tool` section), not the skill composer."""
    fm = parse_cell(slug)["fm"]
    return fm.get("kind") != "skill" and fm.get("deploy") == DEPLOY_AS_SKILL_DIR


def slugs_deploying_as_skill() -> list[str]:
    """Every slug that places as a host `skills/<slug>/` dir: the `kind: skill`
    cells plus any `deploy: skill-dir` cell. The deploy set for `--kind skill`,
    sorted. One name per dir ([[named-marker-as-index-key]])."""
    out = [
        s for s in corpus_slugs()
        if parse_cell(s)["fm"].get("kind") == "skill" or deploys_as_skill_dir(s)
    ]
    return sorted(out)
