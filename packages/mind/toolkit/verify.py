#!/usr/bin/env python3
"""Round-trip verifier (TOOLKIT.md component 3) -- enforces
[[self-application-is-mandatory]] mechanically. Gates:

  SCHEMA      every ideas/*.md is (kind in closed set + delineation) OR gloss:true
  REFERENCES  every prose [[slug]] resolves to an existing slug.md; no dangling;
              no piped links [[a|b]]
  FENCE       no [[ ]] anchor inside a fenced/indented code block -- the register
              rule of references/formal-symbolic-notation.md (anchors in prose,
              symbols in fences; bind imports once at the boundary). REJECT,
              never auto-transform ([[hoare-elegance-no-permissive-defaults]]).
  SYMBOLS     the register rule's positive form: every glyph in a fence interior
              is in (declared symbol table ∪ definienda-class ∪ exemptions); an
              undeclared glyph FAILS, named cell:line + codepoint. FENCE rejects
              the anchor; SYMBOLS rejects any other stray glyph.
  OPERATIVE   every kind:skill cell carries operative content beyond heading +
              ≜ formula (a step, a fenced block, or substantive prose); an empty
              skill body projects a vacuous SKILL.md and round-trips on emptiness.
  PROVENANCE  (warning, not gate) a kind:skill that composes EMPTY provenance
              surfaces as a NOTE -- the recurring fenced-≜-as-formula bug made
              visible so a future skill can't regress silently.
  ROUNDTRIP   every emitted agent def reconstructs its archetype's composed set:
              the def names every [[ref]] the cell composes + every scope grant,
              and carries an intact provenance header + content hash that matches
              its on-disk body (regenerate-without-clobbering ancestor is valid).
  RECONSTRUCT the reconstruction oracle ([[self-application-is-mandatory]]'s
              accept(F) <=> reconstruct(F) >= D, made mechanical). A battery of
              NECESSARY conditions: any violation PROVES not-accept(F) (soundness
              over completeness -- never green-lights a provably-broken corpus,
              never claims to certify a clean one semantically perfect):
                R1 one-home totality -- the transitive [[ ]] ref-graph closure
                   from every composition root resolves to exactly one home cell
                   ([[cite-dont-copy]]'s "one home per exemplar"); a dangling ref
                   (no home) or a duplicated home FAILS -- the dropped-dependency
                   encode, total over the reachable graph, with the path reported.
                R2 cite-don't-copy -- no cell restates another cell's definiens
                   (a contiguous run of its delineation) WITHOUT citing it; an
                   uncited restatement is a palimpsest, not a reconstruction.
                R3 reconstruction-completeness vs Delta -- "every idea in
                   meaning(D) has a home": NOT mechanized (no routing manifest
                   exists; routing is in-the-loop in the exemplify run, never
                   persisted). Emitted as an explicit audit-line NOTE, not faked
                   ([[hoare-elegance-no-permissive-defaults]] degrade-visibly).

One parse: the cell views (core.cells) and the composers' own ref-walks
(compose.agent / compose.skill) are imported, never re-derived -- verify cannot
drift from what compose actually reads ([[cite-dont-copy]]).

Exit non-zero on any gate failure.
"""
from __future__ import annotations

import hashlib
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from core import cells  # noqa: E402  -- the ONE cell reader + AST views
from compose.agent import composition_refs, grants_for  # noqa: E402
from compose.harness import ref_text  # noqa: E402  -- THE ref projection
from compose.skill import _formula_refs  # noqa: E402
from render.claude_code import recorded_profile  # noqa: E402

ROOT = cells.ROOT
IDEAS = cells.IDEAS
AGENTS_OUT = ROOT.parents[1] / ".claude" / "agents"
SKILLS_OUT = ROOT.parents[1] / ".claude" / "skills"

KINDS = {
    "principle", "concept", "process", "utility", "structure", "classification",
    "agent", "persona", "task", "pattern", "runbook", "skill", "troubleshooting",
}
# Broad bracket scan -- SYNTAX wellformedness only (catches piped [[a|b]] and
# other non-slug interiors that the strict cells.REF intentionally skips).
BROAD_REF = re.compile(r"\[\[([^\]]+)\]\]")

# ---- SYMBOLS: the declared-symbol set + the calibrated exemption classes ----
# The register rule (references/formal-symbolic-notation.md): a fenced FORMAL
# block carries only declared symbols + the cell's own definienda. gate_symbols
# enforces it; the symbol table is the truth source (col-1, loaded live so the
# gate cannot drift from the doc). The exemption classes below are NOT a second
# vocabulary -- they ARE "the cell's own definienda" made mechanical (Greek +
# subscripts are definienda-class variables, never operators) plus a register-
# neutral diagram/prose tail (box-drawing carries no logic; em-dash is
# prose-in-fence -- ellipsis is now declared in the table). Exempting these
# classes can never mask a misused LOGIC glyph,
# which is the only thing the register rule is about. Calibrated 2026-06-13
# (Nico): the live corpus is CLEAN under exactly this set.
NOTATION_DOC = ROOT / "references" / "formal-symbolic-notation.md"


def _declared_symbols() -> set[str]:
    """Every non-ASCII glyph in col-1 of the notation table -- loaded live from
    the doc, so the gate tracks the truth source rather than a frozen copy
    ([[cite-dont-copy]]). Col-1 is the first `...`-backticked field of each
    `| ... |` table row; a field may carry several tokens (`dom(f)` · `range(f)`,
    the `──op──→` compound, `·` the list separator -- all contribute their glyphs)."""
    out: set[str] = set()
    for line in NOTATION_DOC.read_text(encoding="utf-8").splitlines():
        if not line.startswith("|"):
            continue
        col1 = line.strip().strip("|").split("|")[0]
        for tok in re.findall(r"`([^`]+)`", col1):
            out.update(ch for ch in tok if ord(ch) > 127)
    return out


def _symbol_exempt(ch: str) -> bool:
    """The definienda-class + register-neutral exemptions (Nico's calibration).
    Returns True for a glyph the register rule does not constrain:
      - ASCII -- never a declared formal symbol's concern.
      - Greek block (U+0391-03C9, both cases) -- definienda-class variables a
        cell defines locally (η σ Φ Δ ρ λ μ ...), not operators.
      - Subscript decoration (U+2080-2089 digits, U+1D62 'ᵢ', U+2C7C 'ⱼ') --
        attaches to a definiendum (C₀, cᵢ, D₁); part of the variable name.
      - Box-drawing (U+2500-257F) -- diagram vocabulary (trees, pipeline rules);
        carries no formal-logic meaning, so exempting it cannot hide a misused
        operator. (`─` U+2500 and `│` U+2502 are ALSO declared -- harmless overlap.)
      - Em dash (U+2014) -- prose-in-fence punctuation.
        (Ellipsis `…` U+2026 is now DECLARED in the table -- the "and so on"
        enumerator -- so it is covered there, not exempted here.)"""
    o = ord(ch)
    if o <= 0x7F:
        return True
    if 0x0391 <= o <= 0x03C9:
        return True
    if 0x2080 <= o <= 0x2089 or o in (0x1D62, 0x2C7C):
        return True
    if 0x2500 <= o <= 0x257F:
        return True
    if o == 0x2014:
        return True
    return False


errors: list[str] = []
notes: list[str] = []


def _body_offset(text: str, body: str) -> int:
    """0-based line index where `body` starts inside the cell file (the
    front-matter block precedes it); body is a suffix of text by construction."""
    return text[: len(text) - len(body)].count("\n")


def gate_schema_and_refs():
    slugs = set(cells.corpus_slugs())
    for slug in sorted(slugs):
        path = IDEAS / f"{slug}.md"
        cell = cells.parse_cell(slug)
        fm, body = cell["fm"], cell["body"]
        # SCHEMA
        if fm.get("gloss") == "true":
            pass
        elif fm.get("kind") in KINDS and fm.get("delineation"):
            pass
        else:
            errors.append(f"SCHEMA {path.name}: needs (kind in set + delineation) or gloss:true")
        # REFERENCES -- prose grain: the same refs compose reads (fences are out
        # of register and gated by FENCE below); front-matter is prose too.
        mask = cells.fence_lines(body)
        prose_text = "\n".join(
            l for i, l in enumerate(body.splitlines()) if i not in mask
        ) + "\n" + " ".join(fm.values())
        for raw in BROAD_REF.findall(prose_text):
            if "|" in raw:
                errors.append(f"REF {path.name}: piped link [[{raw}]] forbidden")
                raw = raw.split("|")[0]
            tok = raw.strip()
            # skip syntactic placeholders: empty `[[ ]]`, template `[[<x>]]`
            if not tok or not re.fullmatch(r"[a-z0-9-]+", tok):
                continue
            if tok not in slugs:
                errors.append(f"REF {path.name}: dangling [[{tok}]] -> no {tok}.md")


def gate_fences():
    """No anchor inside a code block, ever -- a fenced [[x]] is a category
    error (prose machinery in the formal register) and is REJECTED loudly,
    never silently transformed or skipped. Template placeholders ([[<x>]])
    follow the corpus-wide convention: not anchors, not flagged."""
    for slug in sorted(cells.corpus_slugs()):
        path = IDEAS / f"{slug}.md"
        text = path.read_text(encoding="utf-8")
        body = cells.parse_cell(slug)["body"]
        offset = _body_offset(text, body)
        for fb in cells.fenced_blocks(body):
            interior_start = fb["start"] + (1 if fb["type"] == "fence" else 0)
            for j, line in enumerate(fb["content"].splitlines()):
                for raw in BROAD_REF.findall(line):
                    tok = raw.strip()
                    # real anchor or piped link -> out of register; template
                    # placeholders ([[<x>]]) are not anchors, not flagged.
                    if not (re.fullmatch(r"[a-z0-9-]+", tok) or "|" in tok):
                        continue
                    file_line = offset + interior_start + j + 1  # 1-based
                    errors.append(
                        f"FENCE {path.name}:{file_line}: [[{tok}]] inside a "
                        f"fenced block -- anchors live in prose; bind at the "
                        f"boundary and use the bare symbol in the fence "
                        f"(references/formal-symbolic-notation.md)"
                    )


def gate_symbols():
    """SYMBOL-COVERAGE: every glyph inside a fence interior must be in
    (declared symbol table ∪ the cell's own definienda ∪ exemptions). The
    register rule's positive form -- FENCE rejects [[ ]] (prose machinery in a
    formal block); gate_symbols rejects any OTHER undeclared glyph (a stray
    operator, a copy-pasted unicode lookalike). FAIL names cell + glyph +
    codepoint. The definienda/exemption classes (_symbol_exempt) are the
    calibration; the live corpus is CLEAN under it (a violation is a real
    undeclared symbol, never a false-positive on η/cᵢ/tree-art)."""
    declared = _declared_symbols()
    for slug in sorted(cells.corpus_slugs()):
        path = IDEAS / f"{slug}.md"
        body = cells.parse_cell(slug)["body"]
        offset = _body_offset(path.read_text(encoding="utf-8"), body)
        for fb in cells.fenced_blocks(body):
            interior_start = fb["start"] + (1 if fb["type"] == "fence" else 0)
            for j, line in enumerate(fb["content"].splitlines()):
                for ch in line:
                    if _symbol_exempt(ch) or ch in declared:
                        continue
                    file_line = offset + interior_start + j + 1  # 1-based
                    errors.append(
                        f"SYMBOL {path.name}:{file_line}: undeclared glyph "
                        f"{ch!r} (U+{ord(ch):04X}) in a fence -- not in the "
                        f"symbol table, not a definiendum-class/exempt glyph "
                        f"(references/formal-symbolic-notation.md). Declare it "
                        f"in the table or rewrite the fence."
                    )


def gate_skill_operative():
    """OPERATIVE: a `kind: skill` cell must carry operative content beyond its
    heading + composition formula. A skill whose body is only front-matter + H1
    + the prose `≜` line projects a vacuous SKILL.md and round-trips PASS on
    emptiness (the body is authored, not composed, so the round-trip hash check
    can't see the hollowness). Nico's bar: >=1 operative element after the
    heading/formula -- a numbered/bulleted step, a fenced block, or substantive
    prose. Structure-only (a `## ` heading with nothing under it) does NOT count.

    Excluded as non-operative scaffolding: the H1, blank lines, bare `## `
    section headings, and the single prose `≜` composition-formula line. What
    remains must be a list item, a fenced block, or a substantive prose line."""
    for slug in sorted(cells.slugs_of_kind("skill")):
        path = IDEAS / f"{slug}.md"
        body = cells.parse_cell(slug)["body"]
        if cells.fenced_blocks(body):  # a fenced block IS operative content
            continue
        mask = cells.fence_lines(body)
        operative = False
        for i, line in enumerate(body.splitlines()):
            if i in mask:
                continue  # fence handled above; this branch is fence-free anyway
            s = line.strip()
            if not s:
                continue
            if s.startswith("#"):  # H1/H2 headings are scaffolding, not content
                continue
            if "≜" in line:  # the prose composition-formula line is scaffolding
                continue
            # a list step or any other substantive prose line is operative.
            operative = True
            break
        if not operative:
            errors.append(
                f"OPERATIVE {path.name}: kind 'skill' has no operative content "
                f"beyond heading + ≜ formula -- a skill needs >=1 step, fenced "
                f"block, or substantive prose (an empty skill body projects a "
                f"vacuous SKILL.md)"
            )


def gate_skill_provenance():
    """PROVENANCE (warning): a `kind: skill` cell that composes EMPTY provenance
    surfaces visibly, so a future skill cannot regress into the recurring
    empty-provenance bug silently. Root cause: compose.skill reads the first
    PROSE `≜` line as the composition formula and correctly ignores fenced `≜`
    (formal math, never composition) -- but a skill whose only early `≜` is
    fenced math then composes empty provenance. The composer NOTEs this on the
    deploy path (compose.skill._formula_refs); this lifts it to a verify-level
    warning that fires regardless of deploy state ([[hoare-elegance-no-
    permissive-defaults]] degrade-visibly).

    A WARNING, not a FAIL: a skill MAY legitimately compose from nothing (no
    formula). All 7 live skills currently carry provenance, so any empty one is
    a regression worth a human's eye -- but the composer must not refuse a
    deliberately-provenance-free skill, so it stays a NOTE, never an error."""
    for slug in sorted(cells.slugs_of_kind("skill")):
        body = cells.parse_cell(slug)["body"]
        body_lines = body.splitlines()
        mask = cells.fence_lines(body)
        refs = _formula_refs(slug, body_lines, mask)
        if refs:
            continue
        fenced_formula = any("≜" in body_lines[i] for i in mask)
        diag = (
            "its only `≜` is fenced math (the recurring trap -- move the "
            "composition formula to a prose line)"
            if fenced_formula
            else "no `≜` composition formula at all"
        )
        notes.append(
            f"PROVENANCE {slug}.md: kind 'skill' composes EMPTY provenance "
            f"-- {diag}. (warning, not a failure: a skill may compose from "
            f"nothing; surfaced so it can't regress silently)"
        )


# where each projectable kind's emitted artifact lives.
def _def_path(kind: str, slug: str):
    if kind == "agent":
        return AGENTS_OUT / f"{slug}.md"
    if kind == "skill":
        return SKILLS_OUT / slug / "SKILL.md"
    return None


def gate_roundtrip():
    # ROUNDTRIP is a DRIFT check: it asks whether a deployed def still matches
    # its archetype. "Not deployed" is not drift. If there is no projection at
    # all (neither host dir exists), there is nothing to drift from -- skip the
    # gate visibly (emit a NOTE) rather than failing every def.
    if not AGENTS_OUT.exists() and not SKILLS_OUT.exists():
        notes.append(
            "no deployed projection (.claude/{agents,skills} absent) -- "
            "roundtrip drift-check skipped; deploy then re-verify to gate it"
        )
        return
    for slug in sorted(cells.corpus_slugs()):
        cell = cells.parse_cell(slug)
        kind = cell["fm"].get("kind")
        if kind not in ("agent", "skill"):
            continue
        defp = _def_path(kind, slug)
        if not defp.exists():
            # host dir present but THIS def absent -> a partial deploy dropped a
            # def: real drift, fail. host dir itself absent -> that kind was
            # never projected: not drift, note + skip.
            host = AGENTS_OUT if kind == "agent" else SKILLS_OUT
            if host.exists():
                errors.append(f"ROUNDTRIP {slug}: no emitted def at {defp}")
            else:
                notes.append(f"ROUNDTRIP {slug}: kind '{kind}' not projected ({host} absent) -- skipped")
            continue
        deftext = defp.read_text(encoding="utf-8")
        # composed refs -- THE composers' own walk, not a parallel one
        if kind == "agent":
            composed = set(composition_refs(cell))
        else:
            body = cell["body"]
            composed = set(
                _formula_refs(slug, body.splitlines(), cells.fence_lines(body))
            )
        # each composed ref must appear in the form THE composer emitted it --
        # ref_text keyed on the def's own recorded harness (a skill ref is its
        # /trigger affordance under claude-code), never a parallel rule.
        prof = recorded_profile(defp)
        if prof is None or "/" not in prof:
            errors.append(f"ROUNDTRIP {slug}: no recorded profile in def header")
        else:
            harness = prof.split("/", 1)[1]
            for ref in composed:
                if ref_text(ref, harness) not in deftext:
                    errors.append(f"ROUNDTRIP {slug}: composed [[{ref}]] missing from def")
        # scope grants present (agents only -- skills carry no grants)
        if kind == "agent":
            for exemplar, _path in grants_for(slug):
                if f"grant @{slug} [[{exemplar}]]" not in deftext:
                    errors.append(f"ROUNDTRIP {slug}: scope grant [[{exemplar}]] missing from def")
        # provenance + content-hash integrity
        if "GENERATED from" not in deftext:
            errors.append(f"ROUNDTRIP {slug}: missing provenance header")
        m = re.search(r"content-hash: sha256:([0-9a-f]+)", deftext)
        if not m:
            errors.append(f"ROUNDTRIP {slug}: missing content-hash")
        else:
            gen = deftext.find("<!-- GENERATED")
            idx = deftext.find("-->", gen if gen != -1 else 0)
            body_disk = deftext[idx + 3:].lstrip("\n").rstrip("\n") + "\n"
            h = hashlib.sha256(body_disk.encode("utf-8")).hexdigest()[:16]
            if h != m.group(1):
                errors.append(
                    f"ROUNDTRIP {slug}: hand-edit drift -- body {h} != recorded {m.group(1)}")


# ---- RECONSTRUCT: the reconstruction oracle (accept(F) <=> reconstruct(F) >= D)

# R2 sensitivity: the contiguous-word run of a cell's definiens (delineation)
# whose appearance in ANOTHER cell's body -- WITHOUT a [[cite]] of the home --
# is a restatement, not a reconstruction. Calibrated against the live corpus:
# with the cite-exemption, 8 is the most sensitive run length at which the clean
# corpus is violation-free (cite-and-echo, which IS legitimate, is exempt). A
# shorter run is common phrasing; the cite-exemption is what makes the gate sound.
R2_RUN = 8
_WORD = re.compile(r"[a-z0-9]+")


def _words(text: str) -> list[str]:
    return _WORD.findall(text.lower())


def _shingles(toks: list[str], n: int) -> set[tuple[str, ...]]:
    """Every contiguous n-word run of `toks`, as a set of tuples."""
    return {tuple(toks[i : i + n]) for i in range(len(toks) - n + 1)} if len(toks) >= n else set()


def _home_index() -> dict[str, list[str]]:
    """anchor-slug -> the list of cell files that home it. The corpus is one
    file per slug, so each list is a singleton in a healthy corpus; a longer
    list is a duplicated home (R1's not-∃!). Built from the filesystem glob,
    not assumed -- a future collision (two *.md projecting one anchor) surfaces."""
    index: dict[str, list[str]] = {}
    for path in sorted(IDEAS.glob("*.md")):
        if path.stem == "AGENTS" or path.name == "CLAUDE.md":
            continue
        index.setdefault(path.stem, []).append(path.name)
    return index


def gate_reconstruct():
    """The reconstruction oracle: R1 (one-home totality over the transitive ref
    closure), R2 (cite-don't-copy), R3 (completeness-vs-Delta, an audit-line).
    Each is a NECESSARY condition -- a violation is a proof of not-accept(F)."""
    slugs = cells.corpus_slugs()
    homes = _home_index()
    bodies = {s: cells.parse_cell(s)["body"] for s in slugs}
    # the corpus dependency graph: cell -> the prose anchors it cites (fence-
    # immune, the SAME reader compose uses, so the oracle cannot drift from it).
    graph = {s: list(dict.fromkeys(cells.refs_in_prose(bodies[s]))) for s in slugs}

    # ---- R1: one-home totality over the transitive [[ ]] closure ----
    # Roots = the composition roots (agent + skill cells): the things that get
    # projected and so must reconstruct totally. Walk each root's reachable graph;
    # every anchor on the way must resolve to EXACTLY ONE home cell. A dangling
    # ref (no home) is a dropped dependency; a duplicated home breaks ∃!. The
    # reachability PATH is reported -- the diagnostic a per-cell scan cannot give.
    roots = [s for s in slugs if cells.parse_cell(s)["fm"].get("kind") in ("agent", "skill")]
    for root in roots:
        seen: set[str] = {root}
        # stack carries (slug, path-from-root) so a failure names the chain.
        stack: list[tuple[str, tuple[str, ...]]] = [(root, (root,))]
        while stack:
            node, path = stack.pop()
            for ref in graph.get(node, ()):
                chain = path + (ref,)
                holders = homes.get(ref, [])
                if not holders:  # not-∃: dropped dependency
                    errors.append(
                        f"R1 {root}: dropped dependency [[{ref}]] has no home cell "
                        f"-- reachable via {' -> '.join(chain)}"
                    )
                    continue
                if len(holders) > 1:  # not-∃!: duplicated home
                    errors.append(
                        f"R1 {root}: [[{ref}]] has {len(holders)} homes "
                        f"({', '.join(holders)}) -- reachable via {' -> '.join(chain)}"
                    )
                if ref not in seen:
                    seen.add(ref)
                    stack.append((ref, chain))

    # ---- R2: cite-don't-copy ----
    # A cell that reproduces a contiguous R2_RUN-word run of cell B's definiens
    # WITHOUT citing [[B]] is inlining what it should link -- a palimpsest, not a
    # reconstruction. Citing B AND echoing a phrase is legitimate (reinforce), so
    # the home-citation is the exemption that makes this sound.
    definiens = {s: _shingles(_words(cells.delineation(s)), R2_RUN) for s in slugs}
    body_shingles = {s: _shingles(_words(bodies[s]), R2_RUN) for s in slugs}
    cites = {s: set(graph[s]) for s in slugs}
    for b in slugs:
        bsh = definiens[b]
        if not bsh:
            continue
        for a in slugs:
            if a == b or b in cites[a]:  # self, or A legitimately cites B
                continue
            shared = bsh & body_shingles[a]
            if shared:
                run = " ".join(next(iter(shared)))
                errors.append(
                    f"R2 {a}: restates [[{b}]]'s definiens without citing it "
                    f'-- shared {R2_RUN}-word run "{run}..." (cite [[{b}]], do not copy)'
                )

    # ---- R3: reconstruction-completeness vs Delta (audit-line, NOT mechanized) ----
    # "every idea in meaning(D) has a home in F ∪ Delta" has no mechanical proxy:
    # no routing manifest exists (routing is in-the-loop in the exemplify run,
    # never persisted). State the boundary; do not fake a green ([[hoare-elegance-
    # no-permissive-defaults]] degrade-visibly). Mechanizing it is the routing-
    # manifest substrate follow-on (resolve/exemplify EMIT source-span -> home).
    notes.append(
        "R3 (reconstruction-completeness vs Delta): MANUAL audit -- no routing "
        "manifest exists yet, so 'every idea in meaning(D) has a home' has no "
        "mechanical proxy; R1 (no dropped dep) + R2 (no uncited restatement) are "
        "mechanical, R3 stays an in-the-loop exemplify-run check until resolve/"
        "exemplify emit a routing manifest (source-span -> home-cell)"
    )


def main() -> int:
    gate_schema_and_refs()
    gate_fences()
    gate_symbols()
    gate_skill_operative()
    gate_skill_provenance()
    gate_roundtrip()
    gate_reconstruct()
    for n in notes:
        print("NOTE", n, file=sys.stderr)
    if errors:
        for e in errors:
            print("FAIL", e, file=sys.stderr)
        print(f"\n{len(errors)} failure(s)", file=sys.stderr)
        return 1
    print("PASS schema + references + fences + symbols + operative + round-trip + reconstruct (R1+R2; R3 manual)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
