"""Remote (ssh/scp) placer -- ship generated defs to a host's `.claude/` root and
seed each agent's sidecar layers if-absent, atomically, server-side. Same
substance/accident contract as the local placer; the host is the accident.
"""
from __future__ import annotations

import pathlib
import shlex
import subprocess
import sys

from place.seeds import SEED_FILES


def run(cmd: list[str], dry: bool) -> tuple[int, str]:
    if dry:
        return 0, "(dry-run)"
    p = subprocess.run(cmd, capture_output=True, text=True)
    return p.returncode, (p.stdout + p.stderr).strip()


def _resolve_claude_dir(target: str, home: str, dry: bool) -> tuple[str | None, int]:
    """Reachability check + resolve `home` to an ABSOLUTE remote `.claude` dir.
    Returns (claude_dir, 0) on success, (None, 2) if unreachable/unresolvable.
    Never passes a literal `~` through shlex.quote (that suppresses tilde
    expansion -> writes a literal-named dir); resolves $HOME server-side."""
    rc, _ = run(["ssh", "-o", "ConnectTimeout=6", "-o", "BatchMode=yes", target, "true"], dry)
    if rc != 0 and not dry:
        print(f"  UNREACHABLE {target} -- deferring", file=sys.stderr)
        return None, 2
    if home in ("~/.claude", "~", "~/"):
        rc, msg = run(["ssh", target, "printf %s \"$HOME\""], dry)
        remote_home = (msg.strip() if not dry else "$HOME")
        if not dry and (rc != 0 or not remote_home.startswith("/")):
            print(f"  ERR could not resolve remote $HOME: {msg}", file=sys.stderr)
            return None, 2
        return f"{remote_home}/.claude", 0
    # Explicit path. The flag is named --home; unify with local user_scope
    # (which appends `.claude`). A home that is NOT already the `.claude` dir
    # gets it appended -- LOUDLY -- so passing a bare home dir (e.g.
    # `/Users/lex`) can never again silently litter `<home>/{agents,skills}`
    # beside the real `<home>/.claude`. A path already ending in `.claude` is
    # used verbatim (back-compat).
    p = home.rstrip("/")
    if pathlib.PurePosixPath(p).name != ".claude":
        print(f"  NOTE --home {home!r} is a home dir -> deploying to {p}/.claude", file=sys.stderr)
        return f"{p}/.claude", 0
    return p, 0


def place_agents(user: str, host: str, home: str, defs_dir: pathlib.Path,
                 names: list[str], dry: bool) -> int:
    """Deploy agent defs to <user>@<host>, seeding sidecar layers if-absent."""
    target = f"{user}@{host}"
    claude_dir, rc = _resolve_claude_dir(target, home, dry)
    if claude_dir is None:
        return rc
    agents_dir = f"{claude_dir}/agents"
    rc, _ = run(["ssh", target, f"mkdir -p {shlex.quote(agents_dir)}"], dry)
    seeded, present, copied = [], [], 0
    for name in names:
        src = defs_dir / f"{name}.md"
        if not src.exists():
            print(f"  WARN  no def for {name} at {src}", file=sys.stderr)
            continue
        # copy def (generated substance -- overwrite freely)
        if not dry:
            rc, msg = run(["scp", "-q", str(src), f"{target}:{agents_dir}/{name}.md"], dry)
            if rc != 0:
                print(f"  ERR scp {name}: {msg}", file=sys.stderr)
                continue
        copied += 1
        selfdir = f"{agents_dir}/{name}"
        run(["ssh", target, f"mkdir -p {shlex.quote(selfdir)}"], dry)
        # seed each layer if-absent, atomically, on the remote: test -e guards.
        for fname, seedfn in SEED_FILES:
            remotef = f"{selfdir}/{fname}"
            seed = seedfn(name)
            remote_cmd = (
                f"if [ -e {shlex.quote(remotef)} ]; then echo PRESENT; "
                f"else cat > {shlex.quote(remotef)} <<'MIND_SEED_EOF'\n{seed}\nMIND_SEED_EOF\n echo SEEDED; fi"
            )
            rc, msg = run(["ssh", target, remote_cmd], dry)
            tag = f"{name}/{fname}"
            if dry:
                seeded.append(tag + "?")
            elif msg.strip().endswith("SEEDED"):
                seeded.append(tag)
            elif msg.strip().endswith("PRESENT"):
                present.append(tag)
            else:
                print(f"  ERR seed {tag}: {msg}", file=sys.stderr)
    print(f"  defs copied: {copied}")
    print(f"  layers seeded ({len(seeded)}): {', '.join(seeded) or '-'}")
    print(f"  layers present, untouched ({len(present)}): {', '.join(present) or '-'}")
    return 0


def place_skills(user: str, host: str, home: str, skills_src: pathlib.Path,
                 names: list[str], dry: bool) -> int:
    """Ship <skills_src>/<name>/ -> <remote>/.claude/skills/<name>/ -- SKILL.md
    plus any staged companion assets beside it. Skills are generated substance
    with no sidecars -- overwrite freely."""
    target = f"{user}@{host}"
    claude_dir, rc = _resolve_claude_dir(target, home, dry)
    if claude_dir is None:
        return rc
    skills_dir = f"{claude_dir}/skills"
    copied = 0
    for name in names:
        src_dir = skills_src / name
        if not (src_dir / "SKILL.md").exists():
            print(f"  WARN  no SKILL.md for {name} at {src_dir / 'SKILL.md'}",
                  file=sys.stderr)
            continue
        remote_dir = f"{skills_dir}/{name}"
        run(["ssh", target, f"mkdir -p {shlex.quote(remote_dir)}"], dry)
        files = sorted(f for f in src_dir.iterdir() if f.is_file())
        failed = False
        if not dry:
            for f in files:
                rc, msg = run(["scp", "-q", str(f), f"{target}:{remote_dir}/{f.name}"], dry)
                if rc != 0:
                    print(f"  ERR scp {name}/{f.name}: {msg}", file=sys.stderr)
                    failed = True
                    break
        if failed:
            continue
        copied += 1
        extra = [f.name for f in files if f.name != "SKILL.md"]
        tail = f" (+{len(extra)} asset{'' if len(extra) == 1 else 's'})" if extra else ""
        print(f"  skill {name} -> {target}:{remote_dir}/SKILL.md{tail}")
    print(f"  skills copied: {copied}")
    return 0
