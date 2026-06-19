#!/usr/bin/env python3
"""Reader-prior projection axis tests (DESIGN.md §2.2/§3.4).

  DETERMINISM  the default profile (strong-llm, claude-code) emits identical
               bytes on repeat -- the parameterized projector stayed a pure
               function; no silent drift in the shipped agent-def form.
  DIVERGENCE   weak-llm differs from strong-llm by added kind/verb scaffolding
               (the reader-prior density delta is real, not a no-op).
  GUARD        unknown --reader / --harness profiles are rejected, never
               silently defaulted ([[no-permissive-defaults]]).

Run: python3 toolkit/test_reader_axis.py   (exit non-zero on any failure)
"""
from __future__ import annotations

import pathlib
import subprocess
import sys
import tempfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
RESOLVE = ROOT / "toolkit" / "resolve.py"


def emit_to(out: pathlib.Path, *flags: str) -> None:
    subprocess.run(
        [sys.executable, str(RESOLVE), str(out), *flags],
        check=True, capture_output=True,
    )


def main() -> int:
    fails: list[str] = []
    with tempfile.TemporaryDirectory() as t:
        a = pathlib.Path(t) / "a"
        b = pathlib.Path(t) / "b"
        w = pathlib.Path(t) / "w"
        ln = pathlib.Path(t) / "ln"
        emit_to(a)  # default == strong-llm, claude-code
        emit_to(b)  # again
        emit_to(w, "--reader", "weak-llm")
        emit_to(ln, "--reader", "strong-llm-lean")

        # DETERMINISM: two default runs are byte-identical
        for fa in sorted(a.glob("*.md")):
            fb = b / fa.name
            if fa.read_bytes() != fb.read_bytes():
                fails.append(f"DETERMINISM {fa.name}: default emit not stable")

        # REGRESSION (H1): every RENDERED def in the staging dir is byte-identical
        # to a fresh emit at the profile its own header RECORDS -- the def declares
        # what it is; the test honours that, never assumes the default. A failure
        # means cells changed without a re-render, or the emit format drifted;
        # either way, re-run resolve.py and review the diff. (The render is a
        # projection in `.render/`, NOT a `.claude/` deployment -- this checks the
        # staging projection, not any deployed scope.)
        import re as _re
        by_profile = {
            "strong-llm/claude-code": a,
            "weak-llm/claude-code": w,
            "strong-llm-lean/claude-code": ln,
        }
        rendered = ROOT / ".render" / "agents"
        # REGRESSION is a DRIFT check against the on-disk render: it asks whether a
        # rendered def still matches a fresh emit. "Not rendered" is not drift.
        # If there is no projection at all, skip this axis visibly (NOTE) rather
        # than failing every def -- the determinism/divergence/density/guard axes
        # below need no render and stay live. (Mirrors verify.py gate_roundtrip.)
        if not rendered.exists():
            print("NOTE reader-axis: no render present (.render/agents "
                  "absent) -- REGRESSION drift-check skipped; run resolve.py to gate it",
                  file=sys.stderr)
        for fa in (sorted(a.glob("*.md")) if rendered.exists() else []):
            dep = rendered / fa.name
            if not dep.exists():
                fails.append(f"REGRESSION {fa.name}: no rendered def at {dep}")
                continue
            mprof = _re.search(r"profile: (\S+)", dep.read_text(encoding="utf-8"))
            src = by_profile.get(mprof.group(1)) if mprof else None
            if src is None:
                fails.append(f"REGRESSION {fa.name}: unreadable/unknown recorded "
                             f"profile in rendered def")
            elif dep.read_bytes() != (src / fa.name).read_bytes():
                fails.append(f"REGRESSION {fa.name}: emit at recorded profile "
                             f"{mprof.group(1)} != rendered def "
                             f"(re-run resolve.py or reconcile)")

        # DIVERGENCE: weak-llm adds scaffolding the strong profile omits
        for fw in sorted(w.glob("*.md")):
            strong = (a / fw.name).read_text(encoding="utf-8")
            weak = fw.read_text(encoding="utf-8")
            if weak == strong:
                fails.append(f"DIVERGENCE {fw.name}: weak-llm == strong-llm")
            elif ", invoke)_" not in weak and ", embody)_" not in weak \
                    and ", reference)_" not in weak:
                fails.append(f"DIVERGENCE {fw.name}: weak-llm lacks kind cue")

        # MONOTONIC DENSITY: lean drops delineations -> strictly shorter than
        # strong, yet still names every composed anchor (round-trip intact).
        for fl in sorted(ln.glob("*.md")):
            strong = (a / fl.name).read_text(encoding="utf-8")
            lean = fl.read_text(encoding="utf-8")
            if len(lean) >= len(strong):
                fails.append(f"DENSITY {fl.name}: lean not shorter than strong")
            # every anchor the strong def names must survive in lean (bare) --
            # both forms: **bold** and the /trigger skill affordance.
            import re as _re
            for ref in _re.findall(r"^- \*\*([a-z0-9-]+)\*\*", strong, _re.M):
                if f"**{ref}**" not in lean:
                    fails.append(f"DENSITY {fl.name}: lean dropped anchor {ref}")
            for ref in _re.findall(r"^- (/[a-z0-9-]+)", strong, _re.M):
                if ref not in lean:
                    fails.append(f"DENSITY {fl.name}: lean dropped affordance {ref}")

    # GUARD: bad profiles exit non-zero
    for flag, val in (("--reader", "bogus"), ("--harness", "bogus")):
        r = subprocess.run(
            [sys.executable, str(RESOLVE), f"{tempfile.gettempdir()}/_rax", flag, val],
            capture_output=True,
        )
        if r.returncode == 0:
            fails.append(f"GUARD: {flag} {val} accepted (should reject)")

    # PROFILE-GUARD (H2): re-emitting a different profile over an existing deploy
    # must refuse (rc!=0) unless --force.
    with tempfile.TemporaryDirectory() as t2:
        d = pathlib.Path(t2) / "d"
        emit_to(d)  # strong-llm baseline
        refuse = subprocess.run(
            [sys.executable, str(RESOLVE), str(d), "--reader", "strong-llm-lean"],
            capture_output=True)
        if refuse.returncode == 0:
            fails.append("PROFILE-GUARD: lean over strong deploy allowed (should refuse)")
        forced = subprocess.run(
            [sys.executable, str(RESOLVE), str(d), "--reader", "strong-llm-lean", "--force"],
            capture_output=True)
        if forced.returncode != 0:
            fails.append("PROFILE-GUARD: --force did not override the profile guard")

    if fails:
        for x in fails:
            print("FAIL", x, file=sys.stderr)
        print(f"\n{len(fails)} failure(s)", file=sys.stderr)
        return 1
    print("PASS reader-axis: determinism + divergence + guard")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
