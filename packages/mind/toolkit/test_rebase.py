#!/usr/bin/env python3
"""Brownfield-rebase tests (polis-instantiation C2) -- rebasing an EXISTING
project onto the polis culture re-grounds the culture surface without destroying
its in-flight work. Constructs a synthetic brownfield target in a temp dir (a
forked disposition + a target-local disposition + in-flight code/docs), runs the
two-stage rebase, and asserts the consensual-reformer contract:

  (a) culture projected   -- every agent + skill cell -> <target>/.claude/.
  (b) fork reconciled     -- the forked disposition becomes project-core
      (cite [[mind-cell]]) + local-delta (preserved), NOT a wholesale copy.
  (c) in-flight preserved -- non-culture content untouched byte-for-byte.
  (d) plan before apply   -- --plan is read-only (writes nothing); the local
      disposition with no mind counterpart stays local.

Run: python3 toolkit/test_rebase.py   (exit non-zero on any failure)
"""
from __future__ import annotations

import hashlib
import pathlib
import sys
import tempfile

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from core import cells  # noqa: E402
import rebase as rebase_mod  # noqa: E402


FORKED_DISPOSITION = """# principal-agency

Act with delegated principal authority: decide and execute on expertise, maker
not custodian. Don't pause to ask when the plan or sensible defaults already
answer it. Escalate only a genuine fork.

## Local specialization

In the acme-widget oikos, principal authority is additionally bounded by the
release-train cadence: an irreversible deploy inside a freeze window is ALWAYS a
genuine fork and must escalate to the on-call release captain.
"""

LOCAL_DISPOSITION = """# widget-telemetry-discipline

Every widget render path emits a structured telemetry span. Acme-local; no
counterpart in the polis commons.
"""

# A RENAMED FORK: same concept as the [[clean-slate]] mind cell, different name
# (mirrors the real Oikos `greenfield-clean-slate`, which has no exact mind slug
# but IS a fork of [[clean-slate]]). Built by reusing the cell's own substantive
# vocabulary so the token-set (jaccard) concept-identity clears the alias
# threshold -- exact-slug matching alone would mis-call this LOCAL. The local
# specialization is WOVEN (no marked `## delta`), so it must classify FORK via an
# ALIAS match -- never LOCAL, never an ALIGNED collapse.
def _renamed_fork_body() -> str:
    """The clean-slate cell's prose, lightly re-titled + woven with a local twist
    -- a renamed fork. Reuses the canonical vocabulary so concept-identity is high
    while the exact slug differs."""
    canonical = cells.parse_cell("clean-slate")["body"].strip()
    return (
        "# Greenfield discipline -- the past has no vote\n\n"
        + canonical
        + "\n\nIn the acme-widget oikos this additionally means the legacy v1 "
        "render pipeline is deleted on sight, never shimmed.\n"
    )


RENAMED_FORK_NAME = "02-greenfield-discipline"  # NN- prefix; no exact mind slug

# A WOVEN-DELTA FORK on an EXACT slug match: the disposition carries the
# [[principal-agency]] concept but braids a local specialization through the prose
# with NO marked `## delta` section (the real Oikos shape). Today's marked-section
# detector sees no delta -> would call it ALIGNED -> collapse to a bare citation,
# silently destroying the woven specialization (the A4 conqueror failure). The
# refined classifier must call it FORK (woven), FLAG it, and NOT auto-collapse.
def _woven_fork_body() -> str:
    canonical = cells.parse_cell("principal-agency")["body"].strip()
    return (
        "# principal-agency\n\n"
        + canonical
        + "\n\nFor the acme-widget release train, an irreversible deploy inside a "
        "freeze window is ALWAYS a genuine fork and escalates to the on-call "
        "release captain -- this local bound is woven in, with no marked delta "
        "heading to extract.\n"
    )


WOVEN_FORK_NAME = "05-principal-agency"  # NN-strip -> exact slug `principal-agency`

# A genuine ALIGNED: the canonical cell restated VERBATIM with nothing material
# beyond it (only a re-title). This is the one case where collapsing to a bare
# `[[slug]]` citation is lossless -- it proves the ALIGNED path is reachable, so
# the woven-FORK guard isn't trivially "never ALIGN". Uses `clean-slate` (the
# alias-fixture's cell) so the corpus dependency is one already asserted present.
def _aligned_body() -> str:
    return "# clean slate\n\n" + cells.parse_cell("clean-slate")["body"].strip() + "\n"


ALIGNED_NAME = "06-clean-slate"  # NN-strip -> exact slug `clean-slate`

APP_TS = "export function greet(n: string): string { return `hi ${n}`; }\n"
README = "# acme-widget\n\nAn existing project with in-flight work.\n"


def _sha(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _build_brownfield(target: pathlib.Path) -> dict[str, str]:
    """Lay a synthetic brownfield target; return the pre-rebase hashes of the
    in-flight (non-culture) files."""
    (target / ".agents" / "disposition").mkdir(parents=True)
    (target / "src").mkdir(parents=True)
    # NN- ordering prefix = the real brownfield convention (Oikos: 01-principal-agency.md);
    # exercises the match-slug prefix-stripping so a forked disposition is reconciled, not
    # mis-classified LOCAL. (Regression guard: an unprefixed name would have hidden the gap.)
    (target / ".agents" / "disposition" / "01-principal-agency.md").write_text(
        FORKED_DISPOSITION, encoding="utf-8")
    (target / ".agents" / "disposition" / "widget-telemetry-discipline.md").write_text(
        LOCAL_DISPOSITION, encoding="utf-8")
    # renamed fork (ALIAS) + woven-delta fork (FORK-flagged, not ALIGNED-collapse).
    (target / ".agents" / "disposition" / f"{RENAMED_FORK_NAME}.md").write_text(
        _renamed_fork_body(), encoding="utf-8")
    (target / ".agents" / "disposition" / f"{WOVEN_FORK_NAME}.md").write_text(
        _woven_fork_body(), encoding="utf-8")
    (target / ".agents" / "disposition" / f"{ALIGNED_NAME}.md").write_text(
        _aligned_body(), encoding="utf-8")
    (target / "src" / "app.ts").write_text(APP_TS, encoding="utf-8")
    (target / "README.md").write_text(README, encoding="utf-8")
    return {
        "src/app.ts": _sha(target / "src" / "app.ts"),
        "README.md": _sha(target / "README.md"),
    }


def main() -> int:
    fails: list[str] = []
    # Guard the fixture's premise: principal-agency must BE a corpus cell (so it
    # is detectable as a fork); if the corpus drops it, this test must say so
    # loudly rather than silently passing on a LOCAL misclassification.
    corpus = cells.corpus_slugs()
    for needed in ("principal-agency", "clean-slate"):
        if needed not in corpus:
            print(f"FAIL FIXTURE: {needed} not in corpus -- "
                  f"fork/alias undetectable", file=sys.stderr)
            return 1
    want_agents = cells.slugs_of_kind("agent")
    want_skills = cells.slugs_of_kind("skill")

    with tempfile.TemporaryDirectory() as td:
        target = pathlib.Path(td) / "acme-widget"
        target.mkdir()
        pre = _build_brownfield(target)
        forked = target / ".agents" / "disposition" / "01-principal-agency.md"
        local = target / ".agents" / "disposition" / "widget-telemetry-discipline.md"
        pre_local_sha = _sha(local)
        renamed = target / ".agents" / "disposition" / f"{RENAMED_FORK_NAME}.md"
        woven = target / ".agents" / "disposition" / f"{WOVEN_FORK_NAME}.md"
        pre_woven_sha = _sha(woven)

        # STAGE 1 -- --plan is READ-ONLY: writes nothing.
        plan = rebase_mod.plan_target(target, rebase_mod.DEFAULT_READER)
        _ = rebase_mod.render_plan(plan)  # must not raise
        if (target / ".claude").exists():
            fails.append("PLAN-WROTE: --plan created .claude/ (should be read-only)")
        if (target / "AGENTS.md").exists():
            fails.append("PLAN-WROTE: --plan created AGENTS.md (should be read-only)")
        if _sha(forked) != _sha(forked) or "release-train" not in forked.read_text():
            fails.append("PLAN-WROTE: --plan mutated the forked disposition")

        # The plan classifies fork vs local correctly.
        by_name = {r.name: r for r in plan["reconciliations"]}
        if by_name.get("01-principal-agency") is None or by_name["01-principal-agency"].outcome != "FORK":
            fails.append("PLAN-CLASS: 01-principal-agency not classified FORK (prefix-strip match)")
        if by_name.get("widget-telemetry-discipline") is None or \
                by_name["widget-telemetry-discipline"].outcome != "LOCAL":
            fails.append("PLAN-CLASS: widget-telemetry-discipline not classified LOCAL")

        # GAP 1 -- a RENAMED fork (no exact mind slug, same concept) is recovered
        # as an ALIAS match, NOT mis-called LOCAL (the exact-slug-only failure).
        rf = by_name.get(RENAMED_FORK_NAME)
        if rf is None or rf.outcome == "LOCAL":
            fails.append(f"PLAN-CLASS: {RENAMED_FORK_NAME} mis-classified LOCAL "
                         f"(renamed fork must ALIAS-match a cell, not stay local)")
        elif rf.match_kind != "ALIAS" or rf.mind_slug != "clean-slate":
            fails.append(f"PLAN-CLASS: {RENAMED_FORK_NAME} not ALIASed to "
                         f"[[clean-slate]] (got match_kind={rf.match_kind!r}, "
                         f"mind_slug={rf.mind_slug!r})")

        # GAP 2 -- a WOVEN delta (exact match, extra prose, NO `## delta` heading)
        # is FORK-flagged, NOT collapsed to ALIGNED. This is the silent-destruction
        # guard: today's marked-only detector would call it ALIGNED and destroy the
        # woven specialization (the A4 conqueror failure).
        wf = by_name.get(WOVEN_FORK_NAME)
        if wf is None:
            fails.append(f"PLAN-CLASS: {WOVEN_FORK_NAME} missing from reconciliations")
        else:
            if wf.outcome == "ALIGNED":
                fails.append(f"PLAN-CLASS: {WOVEN_FORK_NAME} collapsed to ALIGNED -- "
                             f"woven delta would be SILENTLY DESTROYED (A4 violation)")
            if wf.outcome != "FORK" or not wf.woven:
                fails.append(f"PLAN-CLASS: {WOVEN_FORK_NAME} not FORK-woven "
                             f"(got outcome={wf.outcome!r}, delta_kind={wf.delta_kind!r})")
            if wf.mind_slug != "principal-agency":
                fails.append(f"PLAN-CLASS: {WOVEN_FORK_NAME} matched wrong cell "
                             f"{wf.mind_slug!r} (expected principal-agency)")
            # the plan text must FLAG it for review (not present a clean collapse).
            if "WOVEN-DELTA" not in rebase_mod.render_plan(plan):
                fails.append("PLAN-RENDER: woven delta not FLAGGED in the plan text")

        # POSITIVE control -- a genuine ALIGNED (verbatim canonical, nothing beyond
        # it) DOES collapse to a bare citation. Proves the woven-FORK guard is not
        # trivially "never ALIGN": the ALIGNED path stays reachable for the real
        # lossless case.
        al = by_name.get(ALIGNED_NAME)
        if al is None or al.outcome != "ALIGNED":
            fails.append(f"PLAN-CLASS: {ALIGNED_NAME} not ALIGNED "
                         f"(got {al.outcome if al else None!r}) -- verbatim "
                         f"restatement should collapse losslessly")
        elif al.mind_slug != "clean-slate" or al.local_delta:
            fails.append(f"PLAN-CLASS: {ALIGNED_NAME} ALIGNED but mis-shaped "
                         f"(mind_slug={al.mind_slug!r}, delta={al.local_delta!r})")

        # STAGE 2 -- apply.
        rc = rebase_mod.apply_plan(plan)
        if rc != 0:
            fails.append(f"APPLY: apply_plan returned rc={rc}")

        # (a) culture projected.
        agents_dir = target / ".claude" / "agents"
        skills_dir = target / ".claude" / "skills"
        for slug in want_agents:
            if not (agents_dir / f"{slug}.md").exists():
                fails.append(f"CULTURE: agent {slug} not projected")
        for slug in want_skills:
            if not (skills_dir / slug / "SKILL.md").exists():
                fails.append(f"CULTURE: skill {slug} not projected")
        if not (agents_dir / "nico.md").exists() or not (agents_dir / "mav.md").exists():
            fails.append("CULTURE: founders nico/mav not among projected agents")

        # (b) fork reconciled to project-core + local-delta (not wholesale copy).
        reconciled = forked.read_text(encoding="utf-8")
        if "[[principal-agency]]" not in reconciled:
            fails.append("FORK: reconciled disposition does not cite [[principal-agency]]")
        if "release-train" not in reconciled:
            fails.append("FORK: local delta (release-train) not preserved")
        if "Don't pause to ask" in reconciled:
            fails.append("FORK: canonical core copied wholesale (should be cited, not restated)")

        # (c) in-flight content preserved byte-for-byte.
        for rel, h in pre.items():
            if _sha(target / rel) != h:
                fails.append(f"PRESERVE: {rel} changed (in-flight work not preserved)")

        # (d) the LOCAL disposition stays local, untouched.
        if _sha(local) != pre_local_sha:
            fails.append("LOCAL: target-local disposition was mutated (should be untouched)")

        # (e) the WOVEN fork is NOT silently collapsed by apply. Default apply
        # (no --force) leaves it BYTE-FOR-BYTE untouched -- the local woven work
        # survives the rebase intact (A4). It must NOT have become a bare citation.
        if _sha(woven) != pre_woven_sha:
            fails.append("WOVEN: woven-delta fork was mutated by default apply "
                         "(should be untouched pending human review)")
        woven_after = woven.read_text(encoding="utf-8")
        if "release captain" not in woven_after:  # the woven local specialization
            fails.append("WOVEN: woven specialization not preserved after apply "
                         "(silent destruction -- the A4 conqueror failure)")

        # (f) the RENAMED fork (ALIAS) is reconciled -- it cites its aliased cell.
        # It is a woven alias here, so default apply leaves it untouched; the
        # citation it WOULD write names the aliased cell, never mis-stays LOCAL.
        if "[[clean-slate]]" not in renamed.read_text() + \
                by_name[RENAMED_FORK_NAME].reconciled_text:
            fails.append(f"ALIAS: {RENAMED_FORK_NAME} reconciliation does not "
                         f"reference [[clean-slate]]")

        # (g) the genuine ALIGNED disposition collapsed to a bare [[clean-slate]]
        # citation (and dropped the verbatim restatement -- the lossless case).
        aligned_after = (target / ".agents" / "disposition" /
                         f"{ALIGNED_NAME}.md").read_text(encoding="utf-8")
        if "[[clean-slate]]" not in aligned_after:
            fails.append(f"ALIGNED: {ALIGNED_NAME} did not collapse to a "
                         f"[[clean-slate]] citation")

        # founding marker laid (the brownfield project is now a founded polis).
        agents_md = (target / "AGENTS.md").read_text(encoding="utf-8")
        for needle in ("mind-society", "politeia", "Nico", "Mav"):
            if needle not in agents_md:
                fails.append(f"MARKER: AGENTS.md missing {needle!r}")

        # GUARD: a second apply without --force refuses (AGENTS.md now exists).
        if rebase_mod.apply_plan(plan) == 0:
            fails.append("GUARD: re-apply without --force should refuse (rc!=0)")

    if fails:
        for x in fails:
            print("FAIL", x, file=sys.stderr)
        print(f"\n{len(fails)} failure(s)", file=sys.stderr)
        return 1
    print(f"PASS rebase: brownfield re-grounded ({len(want_agents)} agents + "
          f"{len(want_skills)} skills projected) -- fork->core+delta, in-flight "
          f"preserved, plan read-only, local untouched")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
