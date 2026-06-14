#!/usr/bin/env python3
"""B4 culture->IR bridge tests (plans/polis-machinery/ready/B4-culture-ir-bridge).

The bridge routes mind's culture projection through koine's canonical IR so a
founded society compiles to *any* client, not just claude-code. These tests
guard the bridge's two load-bearing properties:

  SHAPE        emit_ir produces a schema-shaped koine IR: a manifest (koine=1,
               scope, targets) + agents + skills collections; every agent has
               name+body, every skill has name+description+body; the `/trigger`
               affordances ride in manifest.overrides (DECISION 1: Skill, not
               Command). Carrier keys (`_collection`, `_trigger`) never leak
               into the schema-valid resources.

  PARITY       the IR is *reconstruction-sufficient*: rebuilding the claude-code
               artifact from the IR resource (front-matter re-prepended to the
               resource body, which already carries the GENERATED header) is
               BYTE-IDENTICAL to today's proven render.claude_code output. This
               is the key gate -- the bridge must not regress the proven render
               (11 agents + 7 skills). Diff expected EMPTY.

Run: python3 toolkit/test_ir_bridge.py   (exit non-zero on any failure)
"""
from __future__ import annotations

import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "toolkit"))

import resolve  # noqa: E402
from core import cells  # noqa: E402

READER = "strong-llm-lean"  # the deployed profile (toolkit/AGENTS.md)
_SLUG = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def reconstruct_claude_md(resource: dict, kind: str) -> str:
    """The IR -> claude-code inverse of render.ir: re-prepend the front-matter
    block to the resource body (which already carries the GENERATED header).
    Proves the IR is reconstruction-sufficient -- nothing the proven render
    emitted was lost crossing into the IR. Front-matter field ORDER matches
    mind's decorators (agent: name, description, [color]; skill: name,
    description, trigger, [allowed-tools]) so the bytes match exactly."""
    fm_lines: list[str] = [f"name: {resource['name']}"]
    if kind == "agent":
        if resource.get("description"):
            fm_lines.append(f"description: {resource['description']}")
        if resource.get("color"):
            fm_lines.append(f"color: {resource['color']}")
    else:  # skill
        fm_lines.append(f"description: {resource['description']}")
        fm_lines.append(f"trigger: {resource['_trigger']}")
        if resource.get("allowed_tools"):
            fm_lines.append(f"allowed-tools: {resource['allowed_tools']}")
    # The IR body is koine-canonical (no trailing newline; koine's serializer
    # re-adds it). The claude-code file ends in a single newline -> re-add it.
    body = resource["body"] + "\n"
    return "---\n" + "\n".join(fm_lines) + "\n---\n\n" + body


def test_shape() -> list[str]:
    fails: list[str] = []
    ir = resolve.emit_ir(reader=READER, targets=("claude",))
    m = ir["manifest"]
    if m.get("koine") != 1:
        fails.append(f"SHAPE: manifest.koine != 1 ({m.get('koine')!r})")
    if "scope" not in m or "targets" not in m:
        fails.append("SHAPE: manifest missing scope/targets")
    n_agents = len(cells.slugs_of_kind("agent"))
    n_skills = len(cells.slugs_of_kind("skill"))
    if len(ir["agents"]) != n_agents:
        fails.append(f"SHAPE: {len(ir['agents'])} agents emitted, corpus has {n_agents}")
    if len(ir["skills"]) != n_skills:
        fails.append(f"SHAPE: {len(ir['skills'])} skills emitted, corpus has {n_skills}")
    for a in ir["agents"]:
        if "name" not in a or "body" not in a:
            fails.append(f"SHAPE: agent {a.get('name')!r} missing name/body")
        if "_collection" in a or "_trigger" in a:
            fails.append(f"SHAPE: agent {a.get('name')!r} leaked a carrier key")
    triggers = m.get("overrides", {}).get("claude", {}).get("skill_triggers", {})
    for s in ir["skills"]:
        if not all(k in s for k in ("name", "description", "body")):
            fails.append(f"SHAPE: skill {s.get('name')!r} missing name/description/body")
        if "_trigger" in s or "_collection" in s:
            fails.append(f"SHAPE: skill {s.get('name')!r} leaked a carrier key")
        if s["name"] not in triggers:
            fails.append(f"SHAPE: skill {s['name']!r} has no trigger in manifest.overrides")
    return fails


def test_parity() -> list[str]:
    """Reconstruct each artifact from its IR resource and diff vs the proven
    render.claude_code output -- the byte-equivalence gate."""
    fails: list[str] = []
    for slug in cells.slugs_of_kind("agent"):
        proven, _, _ = resolve.emit(slug, READER, "claude-code")
        res = resolve.emit_ir_resource(slug, READER)
        res.pop("_collection")
        rebuilt = reconstruct_claude_md(res, "agent")
        if rebuilt != proven:
            fails.append(f"PARITY agent {slug}: IR-reconstruction != proven render")
    for slug in cells.slugs_of_kind("skill"):
        proven, _, _ = resolve.emit(slug, READER, "claude-code")
        res = resolve.emit_ir_resource(slug, READER)
        res.pop("_collection")
        rebuilt = reconstruct_claude_md(res, "skill")
        if rebuilt != proven:
            fails.append(f"PARITY skill {slug}: IR-reconstruction != proven render")
    return fails


def test_roundtrip_ready() -> list[str]:
    """The mind-side half of the multi-dialect round-trip gate (B4 done-when).

    The objective IR->dialect->IR identity gate runs on the koine side
    (packages/koine/adapters/test/ir-bridge/round-trip.test.ts: claude + codex
    clean, cursor + opencode lossy-by-design). It consumes the IR this emitter
    produces. This gate guards the *preconditions* that make that round-trip
    achievable, so a corpus change that would break a dialect fails HERE, at the
    source, not only in the koine fixture:

      - every agent/skill `name` is a kebab slug (becomes a filename in claude's
        `<name>.md` / codex's `<name>.toml` / skill dir name, and agent.name
        round-trips THROUGH that filename -- a non-slug name would not recover);
      - every skill carries `description` (parseSkill THROWS without it);
      - every body is non-empty (the system_prompt / SKILL.md body);
      - bodies are free of a leading `---` line (would be misparsed as
        front-matter on read-back through the markdown dialects)."""
    fails: list[str] = []
    ir = resolve.emit_ir(reader=READER, targets=("claude", "codex"))
    for a in ir["agents"]:
        if not _SLUG.match(a["name"]):
            fails.append(f"RT-READY: agent name {a['name']!r} not a kebab slug")
        if not a.get("body"):
            fails.append(f"RT-READY: agent {a['name']!r} has empty body")
        if a["body"].lstrip().startswith("---"):
            fails.append(f"RT-READY: agent {a['name']!r} body leads with '---'")
    for s in ir["skills"]:
        if not _SLUG.match(s["name"]):
            fails.append(f"RT-READY: skill name {s['name']!r} not a kebab slug")
        if not s.get("description"):
            fails.append(f"RT-READY: skill {s['name']!r} missing description")
        if not s.get("body"):
            fails.append(f"RT-READY: skill {s['name']!r} has empty body")
        if s["body"].lstrip().startswith("---"):
            fails.append(f"RT-READY: skill {s['name']!r} body leads with '---'")
    return fails


def main() -> int:
    fails = test_shape() + test_parity() + test_roundtrip_ready()
    if fails:
        for x in fails:
            print("FAIL", x, file=sys.stderr)
        print(f"\n{len(fails)} failure(s)", file=sys.stderr)
        return 1
    n_a = len(cells.slugs_of_kind("agent"))
    n_s = len(cells.slugs_of_kind("skill"))
    print(f"PASS ir-bridge: shape + parity + round-trip-ready "
          f"(mind->IR->claude-code byte-equal: {n_a} agents + {n_s} skills, "
          f"diff empty; IR slug/description/body preconditions for "
          f"claude+codex round-trip hold)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
