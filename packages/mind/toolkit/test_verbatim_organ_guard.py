#!/usr/bin/env python3
"""Regression guard for slice ζ (disposition-projection-defect).

A `render: verbatim` organ (e.g. [[recommendation-style-consensus-quality-pick]],
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

ORGAN = "recommendation-style-consensus-quality-pick"
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
    from compose.agent import render_organ

    _ensure_render()
    fails: list[str] = []
    want = f"ROUNDTRIP {AGENT}: verbatim organ [[{ORGAN}]]"

    tmp = pathlib.Path(tempfile.mkdtemp(prefix="_polis_organ_guard_"))
    try:
        render_copy = tmp / "render"
        shutil.copytree(RENDER, render_copy)
        defp = render_copy / "agents" / f"{AGENT}.md"
        body = chr(10).join(render_organ(ORGAN, AGENT)).strip()

        # sanity: the organ body IS in the untampered def
        if body and body not in defp.read_text(encoding="utf-8"):
            fails.append(f"SETUP: organ body not found in untampered {AGENT} def")

        # POSITIVE leg: untampered render copy passes the gate cleanly
        r_ok = _run_verify(render_copy)
        if want in r_ok.stderr:
            fails.append(f"POSITIVE: guard false-fired on an intact organ:\n{r_ok.stderr}")

        # NEGATIVE leg: collapse the organ body -> guard must FAIL naming it
        defp.write_text(defp.read_text(encoding="utf-8").replace(body, ""), encoding="utf-8")
        r_bad = _run_verify(render_copy)
        if r_bad.returncode == 0:
            fails.append("NEGATIVE: verify PASSED with a density-collapsed organ (guard inert)")
        if want not in r_bad.stderr:
            fails.append(f"NEGATIVE: expected {want!r} in stderr, got:\n{r_bad.stderr}")
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

    if fails:
        for x in fails:
            print("FAIL", x, file=sys.stderr)
        print(f"\n{len(fails)} failure(s)", file=sys.stderr)
        return 1
    print("PASS verbatim-organ guard: intact organ verifies; collapsed organ is caught")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
