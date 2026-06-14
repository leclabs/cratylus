#!/usr/bin/env python3
"""Resolver / generator (TOOLKIT.md component 1).

Reads an agent cell (`kind: agent`) from `mind/ideas/`, walks its composed
`[[ ]]` graph, replaces each reference with the target cell's `delineation`
(the priors-loaded dense form -> [[exemplar-resolution]] run inverse), layers
scope grants parsed from the relevant `AGENTS.md` as ACCIDENTS without mutating
the kernel ([[substance-over-accident]]), and emits a deployable
`.claude/agents/<name>.md` def carrying:

  - a `GENERATED from ...` provenance header ([[generated-artifact-provenance]])
  - a `content-hash:` of the emitted body ([[regenerate-without-clobbering]]):
    on re-emit, a target whose on-disk body hash != its recorded header hash was
    hand-edited -> we refuse to clobber and surface drift.

Round-trip ([[self-application-is-mandatory]]) is checked by verify.py.
"""
from __future__ import annotations

import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from core import cells  # noqa: E402  -- the shared cell reader
import compose  # noqa: E402
from compose.reader import READERS  # noqa: E402
import decorate  # noqa: E402
import render  # noqa: E402
from render import claude_code as render_cc  # noqa: E402

# Cell-layer primitives now live in core.cells; re-exported here so the tools
# that read `resolve.parse_cell` / `resolve.IDEAS` keep one import surface.
ROOT = cells.ROOT  # packages/mind
IDEAS = cells.IDEAS
parse_cell = cells.parse_cell
delineation = cells.delineation
DEFAULT_OUT = ROOT.parents[1] / ".claude" / "agents"

# Reader axis (weak-llm/strong-llm/strong-llm-lean) lives in compose.reader;
# READERS is imported above. The harness axis is the artifact *form*.
HARNESSES = {"claude-code"}  # only the .md agent-def form is implemented today


def emit(slug: str, reader: str = "strong-llm",
         harness: str = "claude-code") -> tuple[str, str, str]:
    """compose -> decorate -> render, dispatched on the cell's kind. Returns
    (full text, body-hash, body)."""
    composed = compose.compose(slug, reader, harness)
    decorated = decorate.decorate(composed)
    artifact = render.render(decorated)
    return artifact.text, artifact.body_hash, composed.body


def emit_ir_resource(slug: str, reader: str = "strong-llm-lean") -> dict:
    """compose -> decorate -> render.ir: one cell -> one koine IR resource dict
    (the B4 culture->IR bridge). The harness is fixed 'claude-code' because the
    IR carries the SAME composed body the claude-code render hashes (parity
    anchor) -- the IR is the dialect-neutral waypoint, not a third harness form.
    Returns the per-resource dict (tagged with its `_collection`); resolve_ir
    aggregates these into the top-level IR container."""
    from render import ir as render_ir  # local import: the koine-IR dialect seam
    composed = compose.compose(slug, reader, "claude-code")
    decorated = decorate.decorate(composed)
    return render_ir.render(decorated)


def emit_ir(reader: str = "strong-llm-lean", targets: tuple[str, ...] = ("claude",),
            scope: str = "user") -> dict:
    """The whole corpus -> a single schema-valid koine IR document (manifest +
    agents + skills collections). The B4 emitter: mind speaks IR natively, then
    koine's existing adapters compile it to any client. Skill `/trigger`
    affordances ride in manifest.overrides[<target>].skill_triggers (carrier
    keys prefixed `_` are stripped here -- the schema never sees them)."""
    agents: list[dict] = []
    skills: list[dict] = []
    triggers: dict[str, str] = {}
    for slug in cells.slugs_of_kind("agent"):
        res = emit_ir_resource(slug, reader)
        res.pop("_collection")
        agents.append(res)
    for slug in cells.slugs_of_kind("skill"):
        res = emit_ir_resource(slug, reader)
        res.pop("_collection")
        trig = res.pop("_trigger", None)
        if trig is not None:
            triggers[res["name"]] = trig
        skills.append(res)
    manifest: dict = {"koine": 1, "scope": scope, "targets": list(targets)}
    if triggers:
        manifest["overrides"] = {t: {"skill_triggers": triggers} for t in targets}
    return {"manifest": manifest, "agents": agents, "skills": skills}


# Drift read-back helpers now live in render.claude_code (the harness owns its
# format's inverse); re-exported so resolve.main()/tests keep one import surface.
recorded_hash = render_cc.recorded_hash
recorded_profile = render_cc.recorded_profile
ondisk_body_hash = render_cc.ondisk_body_hash


def parse_argv(argv: list[str]) -> tuple[str, str, pathlib.Path, bool]:
    """`resolve.py [out] [--reader R] [--harness H] [--force]`. Positional
    out-dir optional (defaults to .claude/agents); a CUSTOM out-dir is an
    agent-preview mode (skills emit only on the default run -> .claude/skills).
    Default profile (strong-llm, claude-code) reproduces the deployed defs
    byte-for-byte. Malformed flags are rejected, never silently defaulted
    ([[hoare-elegance-no-permissive-defaults]])."""
    reader, harness, out, force = "strong-llm", "claude-code", None, False
    i = 0
    while i < len(argv):
        a = argv[i]
        if a in ("--reader", "--harness"):
            if i + 1 >= len(argv) or argv[i + 1].startswith("--"):
                sys.exit(f"{a} requires a value")
            if a == "--reader":
                reader = argv[i + 1]
            else:
                harness = argv[i + 1]
            i += 2
            continue
        if a == "--force":
            force = True
            i += 1
            continue
        if a.startswith("--"):
            sys.exit(f"unknown flag {a!r} (use --reader/--harness/--force)")
        if out is not None:
            sys.exit(f"unexpected extra argument {a!r}")
        if a in READERS or a in HARNESSES:
            sys.exit(f"bare {a!r} looks like a profile value -- did you mean "
                     f"--reader/--harness {a}? (a positional is the OUTPUT dir)")
        out = pathlib.Path(a)
        i += 1
    if reader not in READERS:
        sys.exit(f"unknown --reader {reader!r}; choose from {sorted(READERS)}")
    if harness not in HARNESSES:
        sys.exit(f"unknown --harness {harness!r}; choose from {sorted(HARNESSES)}")
    return reader, harness, out or DEFAULT_OUT, force


def _emit_one(slug: str, target: pathlib.Path, reader: str, harness: str,
              profile: str, force: bool) -> int:
    """Drift/profile-guarded emit of one cell to `target`. Returns 0 on write,
    1 on a guarded refusal ([[regenerate-without-clobbering]])."""
    rec = recorded_hash(target)
    cur = ondisk_body_hash(target)
    if rec is not None and cur is not None and rec != cur:
        print(f"DRIFT  {slug}: on-disk body ({cur}) != recorded ({rec}) -- "
              f"hand-edited, refusing to clobber", file=sys.stderr)
        return 1
    prof = recorded_profile(target)
    if prof is not None and prof != profile and not force:
        print(f"PROFILE {slug}: deployed as {prof}, refusing to overwrite with "
              f"{profile} -- pass --force to switch profile", file=sys.stderr)
        return 1
    out, body_hash, _ = emit(slug, reader, harness)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(out, encoding="utf-8")
    print(f"EMIT   {slug} -> {target}  [{profile}]  content-hash sha256:{body_hash}")
    return 0


def main() -> int:
    reader, harness, out_dir, force = parse_argv(sys.argv[1:])
    profile = f"{reader}/{harness}"
    out_dir.mkdir(parents=True, exist_ok=True)
    rc = 0
    # Agents -> out_dir (default .claude/agents), one file per name.
    for agent in cells.slugs_of_kind("agent"):
        rc |= _emit_one(agent, out_dir / f"{agent}.md", reader, harness, profile, force)
    # Skills -> .claude/skills/<name>/SKILL.md (dir-per-skill). Only on the
    # DEFAULT run: a custom positional out-dir is an agent-preview mode, so it
    # neither emits skills nor funnels several profiles into one shared dir.
    if out_dir == DEFAULT_OUT:
        skills_dir = DEFAULT_OUT.parent / "skills"
        for skill in cells.slugs_of_kind("skill"):
            rc |= _emit_one(skill, skills_dir / skill / "SKILL.md", reader, harness, profile, force)
    return rc


if __name__ == "__main__":
    raise SystemExit(main())
