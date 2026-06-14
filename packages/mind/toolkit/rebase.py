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
dispositions). In-flight, non-culture content is preserved. The three
reconciliation outcomes for a target disposition ([[cite-dont-copy]]):

  - FORK     -- a target disposition that carries a mind cell's canonical concept
                PLUS a genuine local specialization. Reconciles to: reference the
                mind cell `[[slug]]` for the canonical core + keep ONLY the local
                delta. Not a wholesale replace (the delta is real local work) and
                not left alone (the core is now cited, not restated).
  - ALIGNED  -- a target disposition that matches a mind cell with no local delta
                beyond the canonical concept. Reconciles to a pure `[[slug]]`
                reference (the restatement collapses into a citation).
  - LOCAL    -- a target-specific disposition with no mind counterpart. Stays
                local, untouched (no forced mapping onto the commons).

Usage:
  rebase.py <target> --plan            read + emit the rebase plan (read-only)
  rebase.py <target> [--apply]         execute the rebase (apply is the default)
    [--reader R]                       reader profile (default strong-llm-lean)
    [--force]                          overwrite an existing founding AGENTS.md

The target corpus is always read from the mind package (cells.ROOT anchored to
this file), independent of cwd. Like init, rebase lays the SOUL (generated defs),
not the individual (SELF/MEMORY/EPISODIC are the running host's deploy concern).
"""
from __future__ import annotations

import dataclasses
import difflib
import pathlib
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
TARGET_DISPOSITION_DIR = (".agents", "disposition")

# A target disposition "forks" a mind cell when it both (a) names/matches a mind
# cell AND (b) carries content beyond the canonical concept (a local delta). We
# detect the canonical-vs-local split by section: a section whose heading marks
# it local ("local", "delta", "specialization", "oikos", or the target's name)
# is the delta; everything else is the restated canonical core that collapses
# into the `[[slug]]` citation. The match itself is by slug name (the densest,
# least-rigged signal: a disposition named `principal-agency` is about
# [[principal-agency]]); content similarity corroborates a FORK vs an ALIGNED.
LOCAL_HEADING_MARKERS = ("local", "delta", "specialization", "specialisation")


@dataclasses.dataclass
class Reconciliation:
    """One target disposition's reconciliation verdict."""
    name: str                      # the target disposition slug (file stem)
    outcome: str                   # FORK | ALIGNED | LOCAL
    mind_slug: str | None          # the canonical mind cell it reconciles to (FORK/ALIGNED)
    similarity: float              # content overlap with the mind cell's prose (0..1)
    local_delta: str               # the preserved local specialization (FORK; '' otherwise)
    source_path: pathlib.Path      # the target file read
    reconciled_text: str           # the text apply will write (FORK/ALIGNED); '' for LOCAL


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
    disp_dir = target.joinpath(*TARGET_DISPOSITION_DIR)
    if disp_dir.is_dir():
        for path in sorted(disp_dir.glob("*.md")):
            name = path.stem
            body = path.read_text(encoding="utf-8")
            # strip front-matter if present (reuse the cell parser's split)
            if body.startswith("---") and len(body.split("---", 2)) >= 3:
                body = body.split("---", 2)[2]
            matched = name in corpus
            delta = _local_delta(body, name)
            sim = _similarity(_canonical_prose(body, name), _mind_prose(name)) if matched else 0.0
            if matched and delta:
                outcome, mind_slug = "FORK", name
                text = reconciled_disposition_text(name, name, delta)
            elif matched:
                outcome, mind_slug = "ALIGNED", name
                text = reconciled_disposition_text(name, name, "")
            else:
                outcome, mind_slug, text = "LOCAL", None, ""
            recs.append(Reconciliation(name, outcome, mind_slug, sim,
                                       delta, path, text))

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
                or parts[: len(TARGET_DISPOSITION_DIR)] == TARGET_DISPOSITION_DIR
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
        lines.append(f"   (no target dispositions -- {'/'.join(TARGET_DISPOSITION_DIR)}/ {present})")
    for r in plan["reconciliations"]:
        if r.outcome == "FORK":
            lines.append(
                f"   FORK     {r.name:<28} -> cite [[{r.mind_slug}]] for the core "
                f"+ keep local delta")
            lines.append(
                f"            (canonical/mind similarity {r.similarity:.0%}; "
                f"local delta preserved: {len(r.local_delta)} chars)")
        elif r.outcome == "ALIGNED":
            lines.append(
                f"   ALIGNED  {r.name:<28} -> collapse to a pure [[{r.mind_slug}]] "
                f"citation (no local delta)")
        else:
            lines.append(
                f"   LOCAL    {r.name:<28} -> stays local, untouched "
                f"(no mind counterpart)")
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
    n_fork = n_aligned = n_local = 0
    for r in plan["reconciliations"]:
        if r.outcome == "LOCAL":
            n_local += 1
            continue  # untouched -- no forced mapping
        r.source_path.write_text(r.reconciled_text, encoding="utf-8")
        if r.outcome == "FORK":
            n_fork += 1
        else:
            n_aligned += 1
    print(f"  dispositions:         {n_fork} forked->core+delta, "
          f"{n_aligned} aligned->citation, {n_local} local (untouched)")

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
    ([[hoare-elegance-no-permissive-defaults]]). --plan and --apply are mutually
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
