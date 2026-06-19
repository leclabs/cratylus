#!/usr/bin/env python3
"""Brownfield rebase (polis-instantiation C2) -- re-ground an EXISTING project on
the polis culture without destroying its in-flight work.

`rebase <target>` is the brownfield sibling of C1's greenfield `init`. Where init
founds a society in an empty dir, rebase enters an *existing* project as an
**invited reformer** ([[consensual-adoption]], A4): the mandate to restructure is
real but *granted*, never seized -- so the same change is reform with consent and
trespass without it. Two acts express that consent operationally:

  STAGE 1 -- PLAN (`--plan`, read-only).  Read the target and emit a **rebase
    plan**: what culture will project, how each forked disposition reconciles
    (project-core + local-delta), what target-local dispositions stay untouched,
    and what in-flight work is preserved. Decides nothing on disk -- the plan is
    the artifact the Operator reviews before authorizing the apply.

  STAGE 2 -- APPLY (default, or `--apply`).  Execute the plan: project the polis
    culture (like init) into `<target>/.claude/`, reconcile the forked
    dispositions in `<target>/.agents/disposition/`, and leave every other file
    -- the target's own code, docs, plans, app files -- BYTE-FOR-BYTE untouched.

The reform touches only the **culture surface** ([[substance-over-accident]]):
`.claude/` (projected culture) and `.agents/disposition/` (the target's
dispositions). In-flight, non-culture content is preserved. The reconciliation
outcomes for a target disposition ([[cite-dont-copy]]):

  - ALIGNED  -- a target disposition that matches a mind cell and is a near-verbatim
                restatement of the canonical with NOTHING material beyond it.
                Reconciles to a pure `[[slug]]` reference (the restatement safely
                collapses into a citation -- nothing local is lost).
  - FORK     -- a target disposition that carries a mind cell's canonical concept
                PLUS a genuine local specialization. The specialization comes in two
                shapes, and the difference is the whole point of this reconciliation:
                  * MARKED delta -- a `## Local delta`/`## specialization` section.
                    The canonical core collapses into `[[slug]]`; the marked section
                    is extracted and preserved verbatim (auto-reconcilable).
                  * WOVEN delta -- the specialization is braided through the prose
                    with NO marker (the real brownfield shape: Oikos weaves its
                    framing into every paragraph). There is no clean line to cut, so
                    a woven FORK is FLAGGED, never auto-collapsed -- collapsing it to
                    a bare citation would silently DESTROY the local work, which is
                    exactly the A4 conqueror failure this tool exists to prevent.
                    Apply preserves the whole disposition pending human review (or,
                    with --force, the Operator may opt into the lossy collapse).
  - LOCAL    -- a target-specific disposition with no mind counterpart (not even an
                alias). Stays local, untouched (no forced mapping onto the commons).

Matching is two-tier ([[cite-dont-copy]] needs the right cell to cite):
  - EXACT  -- the match-slug (stem minus a leading `NN-`/`NN_`) is a corpus slug.
  - ALIAS  -- no exact slug, but the disposition is a *renamed fork* of a cell: same
              concept, different name (Oikos `greenfield-clean-slate` IS a fork of
              `[[clean-slate]]`). Detected by a concept-identity score (token-set /
              jaccard overlap), best above the alias threshold.
  Below the alias threshold -> LOCAL (genuinely no counterpart).

Usage:
  rebase.py <target> --plan            read + emit the rebase plan (read-only)
  rebase.py <target> [--apply]         execute the rebase (apply is the default)
    [--reader R]                       reader profile (default strong-llm-lean)
    [--force]                          overwrite an existing founding AGENTS.md;
                                       AND write the banner+verbatim reconciliation
                                       for a flagged WOVEN fork (default: woven
                                       forks are left BYTE-FOR-BYTE untouched,
                                       flagged for human extraction). Even under
                                       --force the woven delta is preserved, never
                                       destroyed -- the banner records it on disk.

The target corpus is always read from the mind package (cells.ROOT anchored to
this file), independent of cwd. Like init, rebase lays the SOUL (generated defs),
not the individual (SELF/MEMORY/EPISODIC are the running host's deploy concern).
"""
from __future__ import annotations

import dataclasses
import difflib
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from core import cells  # noqa: E402
import init as init_mod  # noqa: E402  -- reuse project_culture + the founding scaffold
from compose.reader import READERS  # noqa: E402

HARNESS = init_mod.HARNESS
DEFAULT_READER = init_mod.DEFAULT_READER

# Where a brownfield target keeps its own dispositions (the culture surface we
# reconcile). The polis projected culture lands in .claude/ (init's concern);
# the target's pre-existing dispositions live here.
# Candidate disposition locations, searched in order — real brownfield projects
# vary: Oikos keeps them under `.agents/context/disposition/`, others at
# `.agents/disposition/`. The first existing candidate is the target's surface.
TARGET_DISPOSITION_DIRS = ((".agents", "disposition"), (".agents", "context", "disposition"))


def _find_disposition_rel(target: pathlib.Path) -> tuple[str, ...]:
    """The first candidate disposition dir that exists under target (else the
    first candidate, as the default surface)."""
    for cand in TARGET_DISPOSITION_DIRS:
        if target.joinpath(*cand).is_dir():
            return cand
    return TARGET_DISPOSITION_DIRS[0]

# A target disposition "forks" a mind cell when it both (a) names/matches a mind
# cell AND (b) carries content beyond the canonical concept (a local delta). We
# detect a MARKED canonical-vs-local split by section: a section whose heading
# marks it local ("local", "delta", "specialization", or the target's name) is the
# delta; everything else is the restated canonical core. But the real brownfield
# shape is a WOVEN delta with no marker, so the marked split is not the only signal
# (see below).
LOCAL_HEADING_MARKERS = ("local", "delta", "specialization", "specialisation")

# --- Thresholds, calibrated empirically against the real Oikos dispositions
#     (.agents/context/disposition/, 5 dispositions) -- see module docstring and
#     the report. Both are deliberately conservative: when in doubt, FLAG/keep,
#     never silently collapse (A4 -- consensual-adoption forbids destroying local
#     work without consent).
#
#  ALIAS (concept-identity, on the combined score below). A renamed fork shares a
#  cell's *concept* under a different name. Raw `difflib` ratio is a poor identity
#  signal here -- it is dominated by length mismatch and woven prose (the correct
#  alias clean-slate scored only 0.10 by ratio). Token-set (jaccard) overlap is
#  far cleaner: on the real Oikos the two true aliases score 0.50 / 0.55 jaccard
#  while the nearest wrong candidate is 0.195 -- a 2.5x+ margin. 0.25 sits in that
#  gap with room on both sides.
ALIAS_THRESHOLD = 0.25
#
#  ALIGNED requires BOTH conditions (the contract: "similarity >= ALIGNED AND no
#  material beyond the canonical"). Neither alone is sufficient:
#   - SIMILARITY (canonical-prose-vs-mind-body `difflib` ratio) >= ALIGNED_THRESHOLD
#     -- the restatement closely tracks the canonical. On the real Oikos every
#     matched disposition weaves heavy local framing and scores 0.05-0.30 here:
#     none is genuinely aligned. A near-copy must clear a high bar.
#   - EXTRA-MATERIAL (fraction of the target's content tokens absent from the mind
#     cell) <= EXTRA_MATERIAL_THRESHOLD -- the target says nothing material beyond
#     the canonical. This is the decisive second gate: a disposition can restate
#     the canonical VERBATIM (ratio ~0.9) and STILL append a local specialization;
#     the ratio is dominated by the verbatim part and misses the addition, but the
#     extra-material fraction catches it -> FORK (woven), not a lossy ALIGNED
#     collapse. Set just above token-level noise (citations, re-titling); a real
#     woven addition like a release-train bound lands well above it.
ALIGNED_THRESHOLD = 0.90
EXTRA_MATERIAL_THRESHOLD = 0.08


def _tokens(s: str) -> set[str]:
    """Content word-set of a body (>=4-char lowercase alpha tokens) -- the basis
    for the concept-identity (jaccard) measure. Short tokens and punctuation drop
    out so the signal is the substantive vocabulary, not the connective tissue."""
    return set(re.findall(r"[a-z]{4,}", s.lower()))


def _jaccard(a: str, b: str) -> float:
    A, B = _tokens(a), _tokens(b)
    if not A or not B:
        return 0.0
    return len(A & B) / len(A | B)


def _extra_material(target: str, mind: str) -> float:
    """Fraction of the TARGET's content tokens that are absent from the mind cell
    -- how much the target says BEYOND the canonical. Directional (unlike jaccard):
    it asks only "what does the target add?", ignoring canonical vocabulary the
    target happens to drop. ~0 means a pure restatement; a woven local addition
    (release-train bounds, oikos-specific framing) pushes it well up."""
    T, M = _tokens(target), _tokens(mind)
    if not T:
        return 0.0
    return len(T - M) / len(T)


def _concept_identity(target_body: str, mind_slug: str) -> float:
    """How strongly the target disposition is *the same concept* as a mind cell,
    independent of its name -- the signal that recovers a renamed fork (ALIAS).

    Token-set (jaccard) overlap, NOT raw `difflib` ratio. The ratio is dominated
    by length mismatch and woven prose: the true alias `clean-slate` scored only
    0.10 by ratio (indistinguishable from noise), but 0.50 by jaccard. On the real
    Oikos the two true aliases score 0.50 / 0.55 jaccard while every wrong
    candidate is <= 0.20 and a genuinely-local disposition is ~0.03 -- a clean,
    wide separation around the 0.25 threshold. (A title-similarity arm was tried
    and dropped: it misfires on short slug-like titles, manufacturing false
    aliases for genuinely-local dispositions; jaccard alone separates cleanly.)"""
    return _jaccard(target_body, _mind_prose(mind_slug))


def _best_alias(target_body: str, corpus: set[str]) -> tuple[str | None, float]:
    """The corpus cell whose concept the target most strongly shares, and that
    score. Used only when there is no exact slug match -- to recover a *renamed*
    fork (an ALIAS) rather than mis-calling it LOCAL."""
    best_slug, best_score = None, 0.0
    for slug in corpus:
        score = _concept_identity(target_body, slug)
        if score > best_score:
            best_slug, best_score = slug, score
    return best_slug, best_score


@dataclasses.dataclass
class Reconciliation:
    """One target disposition's reconciliation verdict."""
    name: str                      # the target disposition slug (file stem)
    outcome: str                   # FORK | ALIGNED | LOCAL
    mind_slug: str | None          # the canonical mind cell it reconciles to (FORK/ALIGNED)
    similarity: float              # content overlap with the mind cell's prose (0..1)
    local_delta: str               # the MARKED local specialization (FORK-marked; '' otherwise)
    source_path: pathlib.Path      # the target file read
    reconciled_text: str           # the text apply will write; '' when nothing is rewritten
    match_kind: str = "EXACT"      # EXACT | ALIAS | NONE -- how mind_slug was found
    delta_kind: str = "NONE"       # NONE | MARKED | WOVEN -- the shape of the specialization
    identity: float = 0.0          # concept-identity score (the alias/match strength)

    @property
    def woven(self) -> bool:
        """A FORK whose specialization is braided through the prose with no marked
        section -- the one that must be FLAGGED, never auto-collapsed."""
        return self.outcome == "FORK" and self.delta_kind == "WOVEN"


def _split_sections(body: str) -> list[tuple[str, str]]:
    """Body -> [(heading-or-'', section-text)] split on `## ` headings (fence-safe
    via the shared cell reader's fence mask). The pre-heading preamble is the
    first entry with heading ''."""
    lines = body.splitlines()
    mask = cells.fence_lines(body)
    sections: list[tuple[str, list[str]]] = [("", [])]
    for i, line in enumerate(lines):
        if line.startswith("## ") and i not in mask:
            sections.append((line[3:].strip(), []))
        else:
            sections[-1][1].append(line)
    return [(h, "\n".join(ls).strip()) for h, ls in sections]


def _is_local_heading(heading: str, name: str) -> bool:
    h = heading.strip().lower()
    if any(m in h for m in LOCAL_HEADING_MARKERS):
        return True
    # a section named after the target disposition itself reads as its local part
    return name.replace("-", " ").lower() in h


def _canonical_prose(body: str, name: str) -> str:
    """The target body MINUS its local-delta sections -- the restated canonical
    core, used to measure similarity against the mind cell."""
    return "\n".join(
        text for h, text in _split_sections(body)
        if not _is_local_heading(h, name) and text
    )


def _local_delta(body: str, name: str) -> str:
    """The local-delta sections of a target disposition, reassembled verbatim
    (heading + text) -- the genuine local specialization a FORK preserves."""
    out: list[str] = []
    for h, text in _split_sections(body):
        if h and _is_local_heading(h, name):
            out.append(f"## {h}\n\n{text}" if text else f"## {h}")
    return "\n\n".join(out).strip()


def _mind_prose(slug: str) -> str:
    """The mind cell's prose body (used for the similarity measure)."""
    return cells.parse_cell(slug)["body"].strip()


def _similarity(a: str, b: str) -> float:
    if not a or not b:
        return 0.0
    return difflib.SequenceMatcher(None, a, b).ratio()


def reconciled_disposition_text(name: str, mind_slug: str, local_delta: str) -> str:
    """The reconciled file body: cite the mind cell for the canonical core, then
    preserve ONLY the local delta. This is [[cite-dont-copy]] made material -- the
    canonical concept lives once (in the mind cell) and is referenced, never
    restated; the local specialization, which is genuine local work, is kept."""
    core = (
        f"# {name}\n\n"
        f"**Canonical core:** [[{mind_slug}]] -- this disposition's foundational "
        f"concept lives in the polis commons and is referenced here, not restated "
        f"(rebased onto the culture; the prior local copy of the canonical concept "
        f"collapsed into this citation).\n"
    )
    if local_delta:
        return (
            f"{core}\n"
            f"## Local delta\n\n"
            f"The genuine local specialization, preserved across the rebase "
            f"(in-flight work is never destroyed):\n\n"
            f"{local_delta}\n"
        )
    return core


def flagged_woven_text(name: str, mind_slug: str, original_body: str) -> str:
    """Apply output for a WOVEN fork: do NOT collapse. Preserve the whole
    disposition verbatim, prepended with a review banner that records the
    canonical cell it specializes and the explicit decision pending. This is the
    A4-safe default -- the local work survives the rebase intact; a human decides
    how to extract it ([[cite-dont-copy]]) rather than the tool guessing and
    silently destroying the specialization."""
    banner = (
        f"<!-- REBASE: WOVEN-DELTA. This disposition specializes [[{mind_slug}]] "
        f"beyond the canonical, with its specialization woven through the prose "
        f"(no marked '## Local delta' section to extract cleanly). It was NOT "
        f"auto-collapsed to a bare citation -- doing so would silently destroy the "
        f"local work (A4 / consensual-adoption). Review and extract the delta by "
        f"hand: cite [[{mind_slug}]] for the canonical core, keep only what is "
        f"genuinely local. Preserved verbatim below pending that review. -->\n\n"
    )
    return banner + original_body.strip() + "\n"


def _classify(name: str, body: str, path: pathlib.Path,
              corpus: set[str]) -> Reconciliation:
    """Classify one target disposition. Two decisions, in order:

      1. MATCH -- which mind cell (if any) does this carry the concept of?
         EXACT match-slug in corpus; else the strongest ALIAS above threshold;
         else NONE (-> LOCAL).
      2. CLASSIFY a matched/aliased disposition by how much it exceeds the cell:
         a MARKED `## delta` section -> FORK-marked (extract the section);
         else a near-verbatim restatement with nothing material beyond it
         (ratio >= ALIGNED_THRESHOLD AND extra-material <= EXTRA_MATERIAL_THRESHOLD)
         -> ALIGNED; else it says more than the canonical (woven extra material)
         -> FORK-woven (FLAGGED, never auto-collapsed)."""
    match_slug = re.sub(r"^\d+[-_]", "", name)
    # 1. MATCH
    if match_slug in corpus:
        mind_slug, match_kind = match_slug, "EXACT"
        identity = _concept_identity(body, mind_slug)
    else:
        cand, score = _best_alias(body, corpus)
        if cand is not None and score >= ALIAS_THRESHOLD:
            mind_slug, match_kind, identity = cand, "ALIAS", score
        else:
            return Reconciliation(name, "LOCAL", None, 0.0, "", path, "",
                                  match_kind="NONE", delta_kind="NONE",
                                  identity=score)

    # 2. CLASSIFY
    marked = _local_delta(body, name)
    mind_body = _mind_prose(mind_slug)
    sim = _similarity(_canonical_prose(body, name), mind_body)
    extra = _extra_material(body, mind_body)
    if marked:
        # A clean, human-marked seam: collapse the core, extract the section.
        return Reconciliation(
            name, "FORK", mind_slug, sim, marked, path,
            reconciled_disposition_text(name, mind_slug, marked),
            match_kind=match_kind, delta_kind="MARKED", identity=identity)
    if sim >= ALIGNED_THRESHOLD and extra <= EXTRA_MATERIAL_THRESHOLD:
        # Near-verbatim restatement AND nothing material beyond the canonical:
        # the collapse to a bare citation is lossless. BOTH gates required -- a
        # high ratio alone can hide a woven addition the ratio is too coarse to see.
        return Reconciliation(
            name, "ALIGNED", mind_slug, sim, "", path,
            reconciled_disposition_text(name, mind_slug, ""),
            match_kind=match_kind, delta_kind="NONE", identity=identity)
    # Matched, but the target says materially MORE than the canonical and there is
    # no marked seam to cut -> a WOVEN fork. FLAG it; preserve it whole. Never
    # auto-collapse (that is the silent-destruction failure A4 forbids).
    return Reconciliation(
        name, "FORK", mind_slug, sim, "", path,
        flagged_woven_text(name, mind_slug, body),
        match_kind=match_kind, delta_kind="WOVEN", identity=identity)


def plan_target(target: pathlib.Path, reader: str) -> dict:
    """Read the target read-only and produce the rebase PLAN: the culture that
    will project, the disposition reconciliations, and the preserved in-flight
    content. Pure -- touches no disk state."""
    target = target.expanduser().resolve()
    corpus = set(cells.corpus_slugs())

    # 1. Culture that will project (every agent + skill cell) -- the same set init
    #    lays down, reported here so the plan states what arrives.
    plan_agents = cells.slugs_of_kind("agent")
    plan_skills = cells.slugs_of_kind("skill")

    # 2. Reconcile the target's dispositions.
    recs: list[Reconciliation] = []
    disp_rel = _find_disposition_rel(target)
    disp_dir = target.joinpath(*disp_rel)
    if disp_dir.is_dir():
        for path in sorted(disp_dir.glob("*.md")):
            name = path.stem
            body = path.read_text(encoding="utf-8")
            # strip front-matter if present (reuse the cell parser's split)
            if body.startswith("---") and len(body.split("---", 2)) >= 3:
                body = body.split("---", 2)[2]
            # _classify strips a leading ordering prefix (`NN-`/`NN_`) for the
            # match-slug -- the real brownfield convention (Oikos dispositions are
            # `01-principal-agency.md`). The file keeps its name; the citation uses
            # the bare slug.
            recs.append(_classify(name, body, path, corpus))

    # 3. Preserved in-flight content: every file NOT on the culture surface
    #    (.claude/ projected culture, .agents/ dispositions). Reported so the
    #    plan makes the preserve-guarantee legible before apply.
    preserved: list[pathlib.Path] = []
    if target.is_dir():
        for p in sorted(target.rglob("*")):
            if not p.is_file():
                continue
            rel = p.relative_to(target)
            parts = rel.parts
            on_culture_surface = (
                parts[:1] == (".claude",)
                or parts[: len(disp_rel)] == disp_rel
                or rel.name == "AGENTS.md"
            )
            if not on_culture_surface:
                preserved.append(rel)

    return {
        "target": target,
        "reader": reader,
        "agents": plan_agents,
        "skills": plan_skills,
        "reconciliations": recs,
        "preserved": preserved,
        "disposition_dir_exists": disp_dir.is_dir(),
        "disposition_rel": "/".join(disp_rel),
    }


def render_plan(plan: dict) -> str:
    """The human-reviewable rebase plan ([[consensual-adoption]]: the artifact the
    Operator reviews before authorizing apply)."""
    t = plan["target"]
    lines = [
        f"=== REBASE PLAN for {t}  [reader {plan['reader']}] ===",
        "",
        "An invited-reformer rebase (consensual-adoption / A4): this plan is "
        "emitted for review;",
        "nothing is written until apply. The reform touches ONLY the culture "
        "surface (.claude/,",
        ".agents/disposition/, AGENTS.md); all other in-flight work is preserved "
        "byte-for-byte.",
        "",
        f"-- CULTURE TO PROJECT ({len(plan['agents'])} agents + "
        f"{len(plan['skills'])} skills) -> {t}/.claude/",
        "   (the whole polis commons; target-local agents, if any, are preserved "
        "-- never pruned)",
        "",
        "-- DISPOSITION RECONCILIATION",
    ]
    if not plan["reconciliations"]:
        present = "present but empty" if plan["disposition_dir_exists"] else "absent"
        lines.append(f"   (no target dispositions -- {plan['disposition_rel']}/ {present})")
    n_woven = 0
    for r in plan["reconciliations"]:
        # how the cell was found: exact slug, or a renamed-fork alias.
        via = "" if r.match_kind == "EXACT" else f" [ALIAS, identity {r.identity:.0%}]"
        if r.woven:
            n_woven += 1
            lines.append(
                f"   FORK*    {r.name:<28} -> WOVEN-DELTA: specializes "
                f"[[{r.mind_slug}]]{via}")
            lines.append(
                f"            beyond the canonical (similarity {r.similarity:.0%}; "
                f"no marked '## delta' seam).")
            lines.append(
                f"            *** review/extract before collapsing -- NOT "
                f"auto-collapsed; preserved whole pending review (or --force).")
        elif r.outcome == "FORK":
            lines.append(
                f"   FORK     {r.name:<28} -> cite [[{r.mind_slug}]]{via} for the "
                f"core + keep marked delta")
            lines.append(
                f"            (canonical/mind similarity {r.similarity:.0%}; "
                f"marked local delta preserved: {len(r.local_delta)} chars)")
        elif r.outcome == "ALIGNED":
            lines.append(
                f"   ALIGNED  {r.name:<28} -> collapse to a pure [[{r.mind_slug}]]"
                f"{via} citation (similarity {r.similarity:.0%}, no delta)")
        else:
            lines.append(
                f"   LOCAL    {r.name:<28} -> stays local, untouched "
                f"(no mind counterpart)")
    if n_woven:
        lines += [
            "",
            f"   ! {n_woven} woven-delta fork(s) FLAGGED -- apply preserves each "
            f"whole; no local work is",
            "     silently destroyed. Extract the delta by hand (or --force the "
            "lossy collapse).",
        ]
    lines += [
        "",
        f"-- IN-FLIGHT WORK PRESERVED ({len(plan['preserved'])} files, "
        f"byte-for-byte)",
    ]
    for rel in plan["preserved"][:20]:
        lines.append(f"   keep     {rel}")
    if len(plan["preserved"]) > 20:
        lines.append(f"   ... and {len(plan['preserved']) - 20} more")
    lines += ["", "=== END PLAN (read-only; run apply to execute) ==="]
    return "\n".join(lines)


def apply_plan(plan: dict, force: bool = False) -> int:
    """Execute the rebase plan. Returns process rc (0 ok). Projects the culture
    (reusing init.project_culture), reconciles the forked/aligned dispositions in
    place, and lays the founding marker -- leaving every preserved file
    untouched."""
    target = plan["target"]
    reader = plan["reader"]
    agents_md = target / "AGENTS.md"
    if agents_md.exists() and not force:
        # Brownfield targets often have their OWN AGENTS.md (in-flight work). A
        # rebase that overwrote it would be conquest, not reform -- refuse, and
        # let the Operator opt in with --force (the founding marker is part of
        # the culture surface, but clobbering a hand-authored one needs consent).
        print(f"REFUSE  {agents_md} already exists -- a rebase would overwrite "
              f"this project's founding marker; pass --force to re-ground it",
              file=sys.stderr)
        return 1

    print(f"=== rebasing {target} onto polis  [reader {reader}] ===")

    # 1. Project the culture (reuse init's proven projector).
    n_agents, n_skills = init_mod.project_culture(target, reader)
    print(f"  culture projected:    {n_agents} agents + {n_skills} skills "
          f"-> {target}/.claude/")

    # 2. Reconcile dispositions in place.
    n_fork = n_aligned = n_local = n_woven_kept = n_woven_forced = 0
    for r in plan["reconciliations"]:
        if r.outcome == "LOCAL":
            n_local += 1
            continue  # untouched -- no forced mapping
        if r.woven:
            # A4 / consensual-adoption: a woven delta has no clean seam to cut, so
            # collapsing it would silently destroy local work. DEFAULT: leave the
            # source BYTE-FOR-BYTE untouched (already FLAGGED in the plan for human
            # extraction). --force: write the banner+verbatim reconciliation --
            # still lossless (the whole delta is preserved), but recorded on disk.
            if not force:
                n_woven_kept += 1
                continue
            r.source_path.write_text(r.reconciled_text, encoding="utf-8")
            n_woven_forced += 1
            continue
        r.source_path.write_text(r.reconciled_text, encoding="utf-8")
        if r.outcome == "FORK":
            n_fork += 1
        else:
            n_aligned += 1
    woven_note = ""
    if n_woven_kept:
        woven_note += (f", {n_woven_kept} woven-fork FLAGGED+untouched "
                       f"(review/extract by hand)")
    if n_woven_forced:
        woven_note += (f", {n_woven_forced} woven-fork --force banner+verbatim "
                       f"(delta preserved on disk)")
    print(f"  dispositions:         {n_fork} forked->core+delta, "
          f"{n_aligned} aligned->citation, {n_local} local (untouched)"
          f"{woven_note}")

    # 3. Lay the founding marker (the brownfield society is now a founded polis).
    subject = (f"a brownfield project rebased onto polis "
               f"(was: {target.name}); the founders fill in the real subject")
    agents_md.write_text(init_mod.founding_agents_md(subject), encoding="utf-8")
    print(f"  founding marker:      {agents_md}")

    print(f"  in-flight preserved:  {len(plan['preserved'])} files untouched")
    print(f"=== rebased: culture projected, {n_fork + n_aligned} disposition(s) "
          f"reconciled, in-flight work preserved ===")
    return 0


def parse_argv(argv: list[str]) -> tuple[pathlib.Path, str, bool, bool]:
    """`rebase.py <target> [--plan|--apply] [--reader R] [--force]`. Malformed
    flags are rejected, never silently defaulted
    ([[no-permissive-defaults]]). --plan and --apply are mutually
    exclusive; apply is the default when neither is given."""
    reader, force, plan_only, apply_flag, target = DEFAULT_READER, False, False, False, None
    i = 0
    while i < len(argv):
        a = argv[i]
        if a == "--reader":
            if i + 1 >= len(argv) or argv[i + 1].startswith("--"):
                sys.exit("--reader requires a value")
            reader = argv[i + 1]
            i += 2
            continue
        if a == "--plan":
            plan_only = True
            i += 1
            continue
        if a == "--apply":
            apply_flag = True
            i += 1
            continue
        if a == "--force":
            force = True
            i += 1
            continue
        if a.startswith("--"):
            sys.exit(f"unknown flag {a!r} (use --plan/--apply/--reader/--force)")
        if target is not None:
            sys.exit(f"unexpected extra argument {a!r} (one <target> only)")
        target = pathlib.Path(a)
        i += 1
    if target is None:
        sys.exit("rebase.py <target> [--plan|--apply] [--reader R] [--force]")
    if plan_only and apply_flag:
        sys.exit("--plan and --apply are mutually exclusive (plan, then apply)")
    if reader not in READERS:
        sys.exit(f"unknown --reader {reader!r}; choose from {sorted(READERS)}")
    return target, reader, force, plan_only


def main() -> int:
    target, reader, force, plan_only = parse_argv(sys.argv[1:])
    plan = plan_target(target, reader)
    if plan_only:
        print(render_plan(plan))
        return 0
    # Apply path: show the plan first (consensual two-stage -- the plan is always
    # emitted before the change), then execute.
    print(render_plan(plan))
    print()
    return apply_plan(plan, force=force)


if __name__ == "__main__":
    raise SystemExit(main())
