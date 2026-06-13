"""Local filesystem placer -- copy generated defs into a `.claude/` root on this
host and seed each agent's sidecar layers if-absent. The def is overwritten
freely (generated substance); the sidecars are protected ([[substance-over-accident]]).
"""
from __future__ import annotations

import pathlib
import sys

from place.seeds import SEED_FILES


def place_agents(claude_dir: pathlib.Path, defs_dir: pathlib.Path,
                 names: list[str], dry: bool) -> int:
    """Write <claude_dir>/agents/<name>.md for each name; seed
    <claude_dir>/agents/<name>/{SELF,MEMORY,EPISODIC}.md only if absent."""
    agents = claude_dir / "agents"
    if not dry:
        agents.mkdir(parents=True, exist_ok=True)
    seeded, present, copied = [], [], 0
    for name in names:
        src = defs_dir / f"{name}.md"
        if not src.exists():
            print(f"  WARN  no def for {name} at {src}", file=sys.stderr)
            continue
        if not dry:
            (agents / f"{name}.md").write_text(src.read_text(encoding="utf-8"), encoding="utf-8")
        copied += 1
        selfdir = agents / name
        if not dry:
            selfdir.mkdir(parents=True, exist_ok=True)
        for fname, seedfn in SEED_FILES:
            f = selfdir / fname
            if f.exists():
                present.append(f"{name}/{fname}")
            elif not dry:
                f.write_text(seedfn(name), encoding="utf-8")
                seeded.append(f"{name}/{fname}")
            else:
                seeded.append(f"{name}/{fname}")
    print(f"  defs copied: {copied}")
    print(f"  layers seeded ({len(seeded)}): {', '.join(seeded) or '-'}")
    print(f"  layers present, untouched ({len(present)}): {', '.join(present) or '-'}")
    return 0


def place_skills(claude_dir: pathlib.Path, skills_src: pathlib.Path,
                 names: list[str], dry: bool) -> int:
    """Copy <skills_src>/<name>/SKILL.md -> <claude_dir>/skills/<name>/SKILL.md.
    Skills are generated substance with no sidecars -- overwrite freely."""
    dest_root = claude_dir / "skills"
    copied = 0
    for name in names:
        src = skills_src / name / "SKILL.md"
        if not src.exists():
            print(f"  WARN  no SKILL.md for {name} at {src}", file=sys.stderr)
            continue
        dest = dest_root / name / "SKILL.md"
        if not dry:
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(src.read_text(encoding="utf-8"), encoding="utf-8")
        copied += 1
        print(f"  skill {name} -> {dest}")
    print(f"  skills copied: {copied}")
    return 0
