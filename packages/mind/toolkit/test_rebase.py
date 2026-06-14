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

APP_TS = "export function greet(n: string): string { return `hi ${n}`; }\n"
README = "# acme-widget\n\nAn existing project with in-flight work.\n"


def _sha(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _build_brownfield(target: pathlib.Path) -> dict[str, str]:
    """Lay a synthetic brownfield target; return the pre-rebase hashes of the
    in-flight (non-culture) files."""
    (target / ".agents" / "disposition").mkdir(parents=True)
    (target / "src").mkdir(parents=True)
    (target / ".agents" / "disposition" / "principal-agency.md").write_text(
        FORKED_DISPOSITION, encoding="utf-8")
    (target / ".agents" / "disposition" / "widget-telemetry-discipline.md").write_text(
        LOCAL_DISPOSITION, encoding="utf-8")
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
    if "principal-agency" not in cells.corpus_slugs():
        print("FAIL FIXTURE: principal-agency not in corpus -- fork undetectable",
              file=sys.stderr)
        return 1
    want_agents = cells.slugs_of_kind("agent")
    want_skills = cells.slugs_of_kind("skill")

    with tempfile.TemporaryDirectory() as td:
        target = pathlib.Path(td) / "acme-widget"
        target.mkdir()
        pre = _build_brownfield(target)
        forked = target / ".agents" / "disposition" / "principal-agency.md"
        local = target / ".agents" / "disposition" / "widget-telemetry-discipline.md"
        pre_local_sha = _sha(local)

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
        if by_name.get("principal-agency") is None or by_name["principal-agency"].outcome != "FORK":
            fails.append("PLAN-CLASS: principal-agency not classified FORK")
        if by_name.get("widget-telemetry-discipline") is None or \
                by_name["widget-telemetry-discipline"].outcome != "LOCAL":
            fails.append("PLAN-CLASS: widget-telemetry-discipline not classified LOCAL")

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
