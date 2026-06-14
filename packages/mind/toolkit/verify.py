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
  ROUNDTRIP   every emitted agent def reconstructs its archetype's composed set:
              the def names every [[ref]] the cell composes + every scope grant,
              and carries an intact provenance header + content hash that matches
              its on-disk body (regenerate-without-clobbering ancestor is valid).

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


def main() -> int:
    gate_schema_and_refs()
    gate_fences()
    gate_roundtrip()
    for n in notes:
        print("NOTE", n, file=sys.stderr)
    if errors:
        for e in errors:
            print("FAIL", e, file=sys.stderr)
        print(f"\n{len(errors)} failure(s)", file=sys.stderr)
        return 1
    print("PASS schema + references + fences + round-trip")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
