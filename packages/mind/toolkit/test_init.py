#!/usr/bin/env python3
"""Greenfield-init tests (polis-instantiation C1) -- founding a mind-society in a
temp dir produces the founded structure: the whole culture projected (every
agent + skill cell), the founding marker (AGENTS.md citing the politeia +
founder-charter, naming the founders), and the plans scaffold. Also asserts the
clobber-refusal guard and idempotent --force re-found.

Run: python3 toolkit/test_init.py   (exit non-zero on any failure)
"""
from __future__ import annotations

import pathlib
import sys
import tempfile

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from core import cells  # noqa: E402
import init as init_mod  # noqa: E402


def main() -> int:
    fails: list[str] = []
    want_agents = cells.slugs_of_kind("agent")
    want_skills = cells.slugs_of_kind("skill")

    with tempfile.TemporaryDirectory() as td:
        target = pathlib.Path(td) / "founded"

        # ACT 1: found a society in a fresh dir.
        rc = init_mod.init(target)
        if rc != 0:
            fails.append(f"INIT: init returned rc={rc} on a fresh target")

        agents_dir = target / ".claude" / "agents"
        skills_dir = target / ".claude" / "skills"

        # Culture projected: every agent cell -> a def, every skill -> a SKILL.md.
        for slug in want_agents:
            f = agents_dir / f"{slug}.md"
            if not f.exists():
                fails.append(f"AGENT-MISSING: {f} not projected")
        for slug in want_skills:
            f = skills_dir / slug / "SKILL.md"
            if not f.exists():
                fails.append(f"SKILL-MISSING: {f} not projected")

        # No stray defs beyond the corpus (count parity).
        got_agents = sorted(p.stem for p in agents_dir.glob("*.md"))
        if got_agents != sorted(want_agents):
            fails.append(f"AGENT-COUNT: got {got_agents}, want {sorted(want_agents)}")
        got_skills = sorted(p.parent.name for p in skills_dir.glob("*/SKILL.md"))
        if got_skills != sorted(want_skills):
            fails.append(f"SKILL-COUNT: got {got_skills}, want {sorted(want_skills)}")

        # A founder def is well-formed: front-matter name + GENERATED provenance +
        # the identity-memory protocol (SOUL/SELF/MEMORY/EPISODIC + WAKE).
        nico = (agents_dir / "nico.md").read_text(encoding="utf-8")
        for needle in ("name: nico", "GENERATED from", "content-hash:",
                       "SELF.md", "MEMORY.md", "EPISODIC.jsonl", "WAKE"):
            if needle not in nico:
                fails.append(f"NICO-MALFORMED: founder def missing {needle!r}")

        # Founding marker: AGENTS.md cites the constitution + names the founders.
        agents_md = (target / "AGENTS.md").read_text(encoding="utf-8")
        for needle in ("mind-society", "politeia", "founder", "Nico", "Mav",
                       "Subject"):
            if needle not in agents_md:
                fails.append(f"FOUNDING-MARKER: AGENTS.md missing {needle!r}")

        # Plans scaffold: PLAN.md + the four state folders.
        plan = target / "plans" / "founding"
        if not (plan / "PLAN.md").exists():
            fails.append("PLANS: founding/PLAN.md missing")
        for state in init_mod.PLAN_STATES:
            if not (plan / state).is_dir():
                fails.append(f"PLANS: state folder {state}/ missing")

        # GUARD: re-init without --force refuses (does not clobber the marker).
        rc = init_mod.init(target)
        if rc == 0:
            fails.append("GUARD: re-init without --force should refuse (rc!=0)")

        # FORCE: idempotent re-found succeeds.
        rc = init_mod.init(target, force=True)
        if rc != 0:
            fails.append(f"FORCE: --force re-found returned rc={rc}")

    # SUBJECT: a passed subject lands in the founding marker.
    with tempfile.TemporaryDirectory() as td:
        target = pathlib.Path(td) / "founded2"
        subj = "proving C1 founds a real polis"
        init_mod.init(target, subject=subj)
        if subj not in (target / "AGENTS.md").read_text(encoding="utf-8"):
            fails.append("SUBJECT: --subject did not land in AGENTS.md")
        if subj not in (target / "plans" / "founding" / "PLAN.md").read_text(encoding="utf-8"):
            fails.append("SUBJECT: --subject did not land in PLAN.md")

    if fails:
        for x in fails:
            print("FAIL", x, file=sys.stderr)
        print(f"\n{len(fails)} failure(s)", file=sys.stderr)
        return 1
    print(f"PASS init: founded society ({len(want_agents)} agents + "
          f"{len(want_skills)} skills) + marker + plans + guards")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
