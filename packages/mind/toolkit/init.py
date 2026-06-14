#!/usr/bin/env python3
"""Greenfield init (polis-instantiation C1) -- found a mind-society in a target dir.

`init <target>` turns an empty/target directory into a *founded polis*: not a pile
of agent files, but a society with the [[politeia]] (foundational structure) laid
down. Two acts, in order:

  1. PROJECT THE CULTURE -- render mind's whole corpus (every kind:agent +
     kind:skill cell) into `<target>/.claude/{agents,skills}` via the proven
     claude-code render (`resolve.emit`, deployed profile strong-llm-lean). The
     founders nico + mav are among the projected agents -- "agents born as
     founders" ([[founder-charter]]). This reuses resolve's PURE emit, not its
     main(): resolve.main() deliberately keeps a custom out-dir agents-only
     (preview mode) so the repo's own default render can't be broken; init is a
     distinct operation that COMPOSES the full render at an arbitrary root.

  2. LAY THE FOUNDING SCAFFOLD -- the marker that makes the target a society:
     - `<target>/AGENTS.md` -- cites the constitution ([[politeia]],
       [[founder-charter]]), names the founders born into it, states the
       society's subject. Modeled on polis's own root AGENTS.md.
     - `<target>/plans/` -- a minimal sharded-plan-layout scaffold (the society's
       work-tracking organ): PLAN.md + the four state folders.

Idempotent on the culture render (defs are regenerated substance, overwritten
freely -- [[substance-over-accident]]); refuses to clobber a hand-authored
founding AGENTS.md unless --force. The corpus is always read from the mind
package (cells.ROOT is anchored to this file's location), independent of cwd, so
init can target any path on the host.

Usage:
  init.py <target> [--reader R] [--subject TEXT] [--force]

  <target>    the directory to found a society in (created if absent).
  --reader    reader profile (default strong-llm-lean -- the deployed profile).
  --subject   one-line statement of what this society is for (default: a
              placeholder the founders fill in).
  --force     overwrite an existing founding AGENTS.md (default: refuse).
"""
from __future__ import annotations

import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from core import cells  # noqa: E402
import resolve  # noqa: E402
from compose.reader import READERS  # noqa: E402

HARNESS = "claude-code"  # the proven artifact form (the .md def / SKILL.md)
DEFAULT_READER = "strong-llm-lean"  # the deployed profile
PLAN_STATES = ("pending", "ready", "active", "completed")
DEFAULT_SUBJECT = "<the society's subject -- what this polis is for; the founders fill this in>"


def project_culture(target: pathlib.Path, reader: str) -> tuple[int, int]:
    """Render every agent + skill cell into <target>/.claude/{agents,skills}.
    Returns (agents_written, skills_written). Defs/skills are regenerated
    substance -- overwritten freely. Agent self-layers (SELF/MEMORY/EPISODIC)
    are NOT seeded here: those are the running host's deploy concern
    ([[identity-memory-stack]]); init lays the SOUL (the def), not the
    individual. A host adopts the society by deploying, which seeds them."""
    agents_dir = target / ".claude" / "agents"
    skills_dir = target / ".claude" / "skills"
    agents_dir.mkdir(parents=True, exist_ok=True)
    skills_dir.mkdir(parents=True, exist_ok=True)

    n_agents = 0
    for slug in cells.slugs_of_kind("agent"):
        text, _hash, _body = resolve.emit(slug, reader, HARNESS)
        (agents_dir / f"{slug}.md").write_text(text, encoding="utf-8")
        n_agents += 1

    n_skills = 0
    for slug in cells.slugs_of_kind("skill"):
        text, _hash, _body = resolve.emit(slug, reader, HARNESS)
        d = skills_dir / slug
        d.mkdir(parents=True, exist_ok=True)
        (d / "SKILL.md").write_text(text, encoding="utf-8")
        n_skills += 1

    return n_agents, n_skills


def founding_agents_md(subject: str) -> str:
    """The founding marker: cites the constitution, names the founders born into
    this society, states its subject. Modeled on polis's own root AGENTS.md
    ([[cite-dont-copy]] -- it references the politeia, never restates it)."""
    return f"""# agent conventions

This project is a **founded mind-society** -- a *polis*, not a pile of agents. It was
founded by projecting the polis commons (`packages/mind`) into this repository: the
foundational structure (the **politeia**) is laid down, and the founders are born
among the projected agents.

## Subject

{subject}

## The founders

Born into this society as projected agents (`.claude/agents/`):

- **Nico** 📐 -- master builder of the **constitution**: roles, archetypes, the
  society itself. To mutate the culture, be Nico or delegate to him.
- **Mav** ✈️ -- master builder of the **substrate**: the infrastructure, machinery,
  and delivery the society runs on. For build/delivery, Mav leads.

`principal-ic` is **intrinsic** to both founders -- the founder genus, bound to this
society's subject, not a path-scoped grant (the founder charter).

## How this society was founded

- **Culture** -- every agent + skill in this `.claude/` is a *projection* of a mind
  corpus cell, not a hand-authored copy. Regenerate by re-projecting; do not
  hand-edit the generated defs (each carries a `GENERATED from ...` provenance
  header + content-hash that the projector guards against clobbering).
- **Constitution cited, not copied** -- the founding draws on the polis *politeia*
  (the foundational structure) and *founder-charter* (who founds, on what terms).
  This society *is a polis* because it instantiates that structure.

## Work-tracking

`plans/` is a sharded-plan-layout: `PLAN.md` is the backlog + status mirror; task
files move through state folders (`pending/ -> ready/ -> active/ -> completed/`) as
dependencies clear.
"""


def founding_plan_md(subject: str) -> str:
    """A minimal PLAN.md for the founded society's first sharded plan."""
    return f"""# founding -- PLAN

The founding backlog of this mind-society. `PLAN.md` mirrors the state folders;
task files move `pending/ -> ready/ -> active/ -> completed/` as deps clear.

**Subject:** {subject}

## Backlog (pending)

- **F1 -- state the subject** -- replace the placeholder in `AGENTS.md` and above
  with this society's real subject (what this polis is for).
- **F2 -- adopt on a host** -- deploy the founded agents to a running client so the
  founders (nico, mav) wake with their identity-memory sidecars seeded.
"""


def lay_plans_scaffold(target: pathlib.Path, subject: str) -> pathlib.Path:
    """Create <target>/plans/founding/{PLAN.md, pending/, ready/, active/,
    completed/} -- a minimal sharded-plan-layout. Returns the plan dir.
    .gitkeep markers keep the empty state folders materializable in git."""
    plan_dir = target / "plans" / "founding"
    plan_dir.mkdir(parents=True, exist_ok=True)
    (plan_dir / "PLAN.md").write_text(founding_plan_md(subject), encoding="utf-8")
    for state in PLAN_STATES:
        sd = plan_dir / state
        sd.mkdir(parents=True, exist_ok=True)
        (sd / ".gitkeep").write_text("", encoding="utf-8")
    return plan_dir


def init(target: pathlib.Path, reader: str = DEFAULT_READER,
         subject: str = DEFAULT_SUBJECT, force: bool = False) -> int:
    """Found a mind-society in `target`. Returns process rc (0 ok)."""
    target = target.expanduser().resolve()
    agents_md = target / "AGENTS.md"
    if agents_md.exists() and not force:
        print(f"REFUSE  {agents_md} already exists -- this dir may already be a "
              f"founded society; pass --force to overwrite the founding marker",
              file=sys.stderr)
        return 1

    target.mkdir(parents=True, exist_ok=True)
    print(f"=== founding a polis in {target}  [reader {reader}] ===")

    n_agents, n_skills = project_culture(target, reader)
    print(f"  culture projected: {n_agents} agents + {n_skills} skills "
          f"-> {target}/.claude/")

    agents_md.write_text(founding_agents_md(subject), encoding="utf-8")
    print(f"  founding marker:   {agents_md}")

    plan_dir = lay_plans_scaffold(target, subject)
    print(f"  plans scaffold:    {plan_dir}/ (PLAN.md + {'/'.join(PLAN_STATES)})")

    print(f"=== founded: {n_agents} founders+agents born, culture projected ===")
    return 0


def parse_argv(argv: list[str]) -> tuple[pathlib.Path, str, str, bool]:
    """`init.py <target> [--reader R] [--subject TEXT] [--force]`. Malformed flags
    are rejected, never silently defaulted ([[hoare-elegance-no-permissive-defaults]])."""
    reader, subject, force, target = DEFAULT_READER, DEFAULT_SUBJECT, False, None
    i = 0
    while i < len(argv):
        a = argv[i]
        if a in ("--reader", "--subject"):
            if i + 1 >= len(argv) or argv[i + 1].startswith("--"):
                sys.exit(f"{a} requires a value")
            if a == "--reader":
                reader = argv[i + 1]
            else:
                subject = argv[i + 1]
            i += 2
            continue
        if a == "--force":
            force = True
            i += 1
            continue
        if a.startswith("--"):
            sys.exit(f"unknown flag {a!r} (use --reader/--subject/--force)")
        if target is not None:
            sys.exit(f"unexpected extra argument {a!r} (one <target> only)")
        target = pathlib.Path(a)
        i += 1
    if target is None:
        sys.exit("init.py <target> [--reader R] [--subject TEXT] [--force]")
    if reader not in READERS:
        sys.exit(f"unknown --reader {reader!r}; choose from {sorted(READERS)}")
    return target, reader, subject, force


def main() -> int:
    target, reader, subject, force = parse_argv(sys.argv[1:])
    return init(target, reader, subject, force)


if __name__ == "__main__":
    raise SystemExit(main())
