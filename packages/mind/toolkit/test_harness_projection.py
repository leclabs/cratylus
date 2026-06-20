#!/usr/bin/env python3
"""Harness-affordance projection tests (compose.harness; plan task 04).

  PROJECTION   both ways on real corpus cells: a `kind: skill` ref renders as
               its invocation affordance (/dream), a non-skill ref stays
               typographic (**mece**) -- unconditional on kind x harness.
  TRIGGER      the affordance is the TARGET cell's `trigger` front-matter
               VERBATIM, never guessed from the slug (fixture whose trigger
               differs from its slug); a skill cell with no trigger fails
               LOUD ([[no-permissive-defaults]]).
  POSITIONS    the projection holds in every emitted position: skill-body
               prose + provenance line (compose.skill) and agent disposition
               lines at each reader density (compose.reader).

Run: python3 toolkit/test_harness_projection.py   (exit non-zero on failure)
"""
from __future__ import annotations

import pathlib
import sys
import tempfile

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from core import cells  # noqa: E402
from compose.harness import project_refs, ref_text  # noqa: E402
from compose.reader import render_ref  # noqa: E402
from compose.skill import compose_skill  # noqa: E402


def main() -> int:
    fails: list[str] = []

    def check(label: str, got, want) -> None:
        if got != want:
            fails.append(f"{label}: got {got!r}, want {want!r}")

    # PROJECTION -- both ways, on real corpus cells (dream: skill; mece: not).
    check("PROJECTION skill->trigger", ref_text("dream", "claude-code"), "/dream")
    check("PROJECTION non-skill->bold", ref_text("mece", "claude-code"), "**mece**")
    check(
        "PROJECTION mixed prose",
        project_refs("run [[dream]] per [[mece]]", "claude-code"),
        "run /dream per **mece**",
    )
    # a non-claude-code harness has no /trigger affordance: bold everywhere.
    check("PROJECTION other harness", ref_text("dream", "doc"), "**dream**")
    # a dangling ref is not classifiable -> typographic form (verify's REF
    # gate owns the failure report, not the composer).
    check("PROJECTION dangling", ref_text("no-such-cell-xyz", "claude-code"),
          "**no-such-cell-xyz**")

    # TRIGGER -- read verbatim from the target cell, never guessed from the
    # slug; missing trigger fails loud. Fixture corpus, IDEAS repointed.
    real_ideas = cells.IDEAS
    try:
        with tempfile.TemporaryDirectory() as t:
            tmp = pathlib.Path(t)
            (tmp / "fixture-skill.md").write_text(
                "---\nkind: skill\ndelineation: f\ntrigger: /zap\n---\n\n# f\n",
                encoding="utf-8",
            )
            (tmp / "triggerless.md").write_text(
                "---\nkind: skill\ndelineation: f\n---\n\n# f\n",
                encoding="utf-8",
            )
            cells.IDEAS = tmp
            check("TRIGGER verbatim (not /fixture-skill)",
                  ref_text("fixture-skill", "claude-code"), "/zap")
            try:
                ref_text("triggerless", "claude-code")
                fails.append("TRIGGER missing: accepted (should raise, never guess)")
            except ValueError:
                pass
    finally:
        cells.IDEAS = real_ideas

    # POSITIONS -- agent disposition lines at each density.
    check("POSITIONS lean disposition",
          render_ref("exemplify", "strong-llm-lean", "claude-code"),
          "- /exemplify")
    strong = render_ref("exemplify", "strong-llm", "claude-code")
    if not strong.startswith("- /exemplify -- "):
        fails.append(f"POSITIONS strong disposition: {strong!r} lacks '- /exemplify -- '")
    check("POSITIONS lean non-skill",
          render_ref("mece", "strong-llm-lean", "claude-code"), "- **mece**")

    # POSITIONS -- a composed skill body. The projection rule applies to the
    # composition refs, which the cite-once convention homes in ONE place: the
    # Bindings region, emitted as the `Composed from ...` provenance line. So the
    # projection check is scoped to that line: composed SKILL refs render as
    # /trigger, composed non-skill refs stay bold. (Operative prose may *mention*
    # a stage by name in bold -- e.g. exemplify's "Invoke **conceptualize**" --
    # which is a cite-once non-ref mention, NOT an unprojected ref; the body is
    # therefore not asserted ref-free.) exemplify composes 3 skills + ≥1 non-skill.
    body = compose_skill("exemplify", "strong-llm-lean", "claude-code").body
    prov = next((l for l in body.splitlines() if l.startswith("Composed from")), "")
    if "/conceptualize · /signify · /materialize" not in prov:
        fails.append(f"POSITIONS exemplify provenance: skill refs not projected as /trigger: {prov!r}")
    if "**conceptualize**" in prov or "**signify**" in prov or "**materialize**" in prov:
        fails.append(f"POSITIONS exemplify provenance: a skill ref rendered bold, must be /trigger: {prov!r}")
    if "**self-application-is-mandatory**" not in prov:
        fails.append(f"POSITIONS exemplify provenance: non-skill ref not kept typographic: {prov!r}")

    if fails:
        for x in fails:
            print("FAIL", x, file=sys.stderr)
        print(f"\n{len(fails)} failure(s)", file=sys.stderr)
        return 1
    print("PASS harness-projection: projection + trigger + positions")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
