"""koine-IR renderer -- frames a DecoratedDoc as a koine IR *resource* (the
canonical-superset waypoint, [[canonical-superset-ir]]) instead of claude-code
`.md` bytes. Sibling to render.claude_code: same DecoratedDoc input, a different
dialect out. Where claude_code emits one client's file, this emits the
client-agnostic IR that koine's adapters then compile to *any* client (B4).

The mapping (Nico's bridge contract; Mav's IR-semantics calls):

  - agent  -> koine `Agent`  resource (agent.schema.json)
  - skill  -> koine `Skill`  resource (skill.schema.json)

`body` carries the SAME slice render.claude_code frames downstream of the
front-matter -- the GENERATED provenance header + the composed body -- so the IR
is *reconstruction-sufficient*: koine's claude adapter reproduces the proven
bytes (the parity gate) from these resources. The descriptive front-matter
(name, description, color, trigger) rides as IR resource fields, not buried in
the body.

This module emits the per-resource dict; resolve.py aggregates the resources
into the top-level IR container (manifest + collections) and serializes JSON.
The provenance header is rendered via render.claude_code.provenance_header (one
home for the GENERATED law, shared across dialect renderers)."""
from __future__ import annotations

from core.ir import DecoratedDoc
from render.claude_code import body_hash, provenance_header


def _body_with_header(decorated: DecoratedDoc) -> str:
    """The IR resource body: GENERATED provenance header + composed body, framed
    as render.claude_code frames the post-front-matter slice (blank line after
    the header) -- but with NO trailing newline, matching koine's parsed-body
    convention (core/engine/frontmatter parseFrontmatter strips the single
    trailing newline so IR bodies round-trip byte-identically; koine's
    serializer re-adds it). Emitting the koine-canonical body here makes
    koine's read(write(ir)) byte-clean on the body, and the claude-code
    reconstruction re-adds the trailing newline to recover the proven file."""
    composed = decorated.composed
    bh = body_hash(composed.body)
    profile = f"{composed.reader}/{composed.harness}"
    header = provenance_header(composed.name, profile, bh)
    return header + "\n\n" + composed.body.rstrip("\n")


def render(decorated: DecoratedDoc) -> dict:
    """A DecoratedDoc -> one koine IR resource dict, tagged with its IR resource
    collection (`_collection`: 'agents' | 'skills') so resolve.py can bucket it.
    Carrier keys prefixed `_` are emit-time routing, stripped before the dict
    enters the schema-valid IR (resolve.py owns that lift)."""
    composed = decorated.composed
    fm = decorated.frontmatter
    body = _body_with_header(decorated)

    if composed.kind == "agent":
        resource: dict = {"_collection": "agents", "name": composed.name, "body": body}
        # mind's agent front-matter `name:` is load-bearing (the ./<name>/
        # sidecar join key); koine's Agent.name carries it canonically and the
        # claude adapter re-emits `name:` from it on the way back to bytes.
        if fm.get("description"):
            resource["description"] = fm["description"]
        if fm.get("color"):
            resource["color"] = fm["color"]
        return resource

    if composed.kind == "skill":
        resource = {
            "_collection": "skills",
            "name": composed.name,
            "description": fm["description"],
            "body": body,
        }
        # The `/trigger` affordance: mind skills carry it in front-matter. koine
        # has no first-class trigger field (DECISION 1: Skill, not Command), so
        # carry it as a routing carrier; resolve.py lifts it to
        # manifest.overrides[<adapter>].skill_triggers so it survives to the
        # claude adapter without polluting the IR Skill schema.
        resource["_trigger"] = fm.get("trigger", f"/{composed.name}")
        allowed = fm.get("allowed-tools")
        if allowed:
            resource["allowed_tools"] = (
                allowed if isinstance(allowed, list) else [allowed]
            )
        return resource

    raise ValueError(f"koine-IR renderer has no mapping for kind {composed.kind!r}")
