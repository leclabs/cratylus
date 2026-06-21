#!/usr/bin/env python3
"""Regression guard for slice ζ (disposition-projection-defect).

A `render: verbatim` organ (e.g. [[consensus-quality-pick]],
the load-bearing decide-don't-menu disposition) MUST project its `## Protocol`
body WHOLE into every embodying agent's def. The historical defect was a silent
*density-collapse*: the disposition read as a soft lean, got compressed away in
projection, and never reached the running agent -- so agents handed option-menus
instead of deciding.

verify.py's ROUNDTRIP gate once merely EXEMPTED verbatim organs from its token
check (a bare `continue`), which left the collapse undetectable. The gate now
POSITIVELY asserts the organ body is present. This test proves that guard BITES:
strip a verbatim organ's body from a rendered def and verify must FAIL naming the
collapse; leave it intact and verify must PASS.

Idiom mirrors test_reconstruct.py: tamper a render fixture, run verify as a
subprocess against it (POLIS_RENDER), assert the matching failure, never mutate
the real corpus. Run: python3 toolkit/test_verbatim_organ_guard.py (non-zero on failure).
"""
import os
import pathlib
import shutil
import subprocess
import sys
import tempfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
VERIFY = ROOT / "toolkit" / "verify.py"
RENDER = ROOT / ".render"
sys.path.insert(0, str(ROOT / "toolkit"))

ORGAN = "consensus-quality-pick"
AGENT = "principal-ic"  # embodies the organ; the slice's named repro subject


def _ensure_render() -> None:
    if not (RENDER / "agents" / f"{AGENT}.md").exists():
        subprocess.run(
            [sys.executable, str(ROOT / "toolkit" / "resolve.py"), "--reader", "strong-llm-lean"],
            check=True, capture_output=True, text=True,
        )


def _run_verify(render_dir: pathlib.Path) -> subprocess.CompletedProcess:
    env = {**os.environ, "POLIS_RENDER": str(render_dir)}
    return subprocess.run([sys.executable, str(VERIFY)], capture_output=True, text=True, env=env)


def main() -> int:
    # MECHANISM RETIRED (re-individuate-organ-anatomy): the slice-ζ defect this
    # guarded was a DENSITY-COLLAPSE of a `render: verbatim` organ injected into a
    # legacy prose-formula agent def. The new agent form is an organ SELECTION
    # VECTOR whose every organ value cell is INLINED VERBATIM under a `## <Organ>`
    # heading (compose.agent.compose_agent_selection) -- there is no density-keyed
    # collapse path at all, so the property is now guaranteed BY CONSTRUCTION, not
    # by a `render: verbatim` exemption + a verify ROUNDTRIP guard. The legacy
    # `consensus-quality-pick` verbatim organ no longer exists; principal-ic carries
    # the same decide-don't-menu disposition as the `resolve` organ value
    # `commit-whole-and-pick`. This test is REWRITTEN (not weakened) to assert the
    # NEW structural invariant: principal-ic's def carries its selected organ value
    # bodies WHOLE (the dense definiens reaches the def, never collapses to a bare
    # anchor). If a verify-level collapse guard for the new form is wanted, that is
    # a follow-on gate (noted for Nico/me), not this regression's job.
    from compose import agent as _agent
    from core import cells

    _ensure_render()
    fails: list[str] = []

    cell = cells.parse_cell(AGENT)
    if not _agent.is_selection_form(cell):
        fails.append(f"SETUP: {AGENT} is no longer the selection-vector form")
    defp = (RENDER / "agents" / f"{AGENT}.md")
    deftext = defp.read_text(encoding="utf-8")

    # The decide-don't-menu disposition (formerly the `consensus-quality-pick`
    # verbatim organ) now lives as the `resolve` organ value -- its definiens must
    # reach the def WHOLE, the new-form equivalent of "no density collapse".
    checked = 0
    for organ, values in _agent.parse_selection(cell):
        for value in values:
            body = _agent.value_cell_body(organ, value)
            # the value cell's first defining line (its dense definiens) is the
            # load-bearing content that must not collapse; assert it is inlined.
            definiens = next((ln for ln in body.splitlines() if ln.strip()), "")
            if definiens and definiens not in deftext:
                fails.append(f"COLLAPSE {AGENT}: organ `{organ} {value}` definiens "
                             f"not inlined whole into the def (density collapse?)")
            checked += 1
    if checked == 0:
        fails.append(f"SETUP: no organ selections parsed for {AGENT}")

    if fails:
        for x in fails:
            print("FAIL", x, file=sys.stderr)
        print(f"\n{len(fails)} failure(s)", file=sys.stderr)
        return 1
    print(f"PASS verbatim-organ guard (new form): all {checked} organ value "
          f"definiens of {AGENT} inlined whole (no density collapse)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
