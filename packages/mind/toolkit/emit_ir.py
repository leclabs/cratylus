#!/usr/bin/env python3
"""emit_ir -- the B4 culture->IR bridge CLI. Composes the whole mind corpus
(agents + skills) and writes a single schema-valid koine IR document
(manifest + agents + skills collections) to stdout or a file.

    python3 toolkit/emit_ir.py [out.json] [--reader R] [--target T ...]

The IR is the canonical-superset waypoint ([[canonical-superset-ir]]); koine's
adapters compile it to any client dialect. claude-code becomes one adapter
output, not the emitter -- the proven render (render.claude_code) is preserved
byte-for-byte and parity is asserted against the IR path (test/test_ir_bridge).

Usage examples:
    python3 toolkit/emit_ir.py                       # IR JSON -> stdout
    python3 toolkit/emit_ir.py /tmp/mind.koine.json  # -> file
    python3 toolkit/emit_ir.py --target claude --target codex
"""
from __future__ import annotations

import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import resolve  # noqa: E402
from compose.reader import READERS  # noqa: E402


def parse_argv(argv: list[str]) -> tuple[str, tuple[str, ...], pathlib.Path | None]:
    reader, targets, out = "strong-llm-lean", [], None
    i = 0
    while i < len(argv):
        a = argv[i]
        if a == "--reader":
            if i + 1 >= len(argv) or argv[i + 1].startswith("--"):
                sys.exit("--reader requires a value")
            reader = argv[i + 1]
            i += 2
            continue
        if a == "--target":
            if i + 1 >= len(argv) or argv[i + 1].startswith("--"):
                sys.exit("--target requires a value")
            targets.append(argv[i + 1])
            i += 2
            continue
        if a.startswith("--"):
            sys.exit(f"unknown flag {a!r} (use --reader/--target)")
        if out is not None:
            sys.exit(f"unexpected extra argument {a!r}")
        out = pathlib.Path(a)
        i += 1
    if reader not in READERS:
        sys.exit(f"unknown --reader {reader!r}; choose from {sorted(READERS)}")
    return reader, tuple(targets) or ("claude",), out


def main() -> int:
    reader, targets, out = parse_argv(sys.argv[1:])
    ir = resolve.emit_ir(reader=reader, targets=targets)
    text = json.dumps(ir, ensure_ascii=False, indent=2) + "\n"
    if out is None:
        sys.stdout.write(text)
    else:
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(text, encoding="utf-8")
        n_a, n_s = len(ir["agents"]), len(ir["skills"])
        print(f"EMIT IR  {n_a} agents + {n_s} skills -> {out}  "
              f"[reader={reader} targets={','.join(targets)}]", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
