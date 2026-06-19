#!/usr/bin/env python3
"""skill-companion-deploy tests: dir-form cells (`ideas/<slug>/<slug>.md` beside
companion assets), asset staging into .render, and the placer shipping a skill's
whole dir (SKILL.md + assets) -- WHILE a flat, asset-less skill still ships
exactly its SKILL.md and nothing more (the golden-master invariant).

Run: python3 toolkit/test_place.py   (exit non-zero on any failure)
"""
from __future__ import annotations

import pathlib
import sys
import tempfile

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from core import cells  # noqa: E402
import resolve as resolve_mod  # noqa: E402
from place import local as local_place  # noqa: E402


def _write(p: pathlib.Path, text: str) -> None:
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding="utf-8")


def main() -> int:
    fails: list[str] = []

    # --- 1. Placer: whole-dir copy (assets ride along) + golden flat skill. ---
    with tempfile.TemporaryDirectory() as td:
        root = pathlib.Path(td)
        rnd = root / "render" / "skills"
        _write(rnd / "bundled" / "SKILL.md", "bundled body\n")
        (rnd / "bundled" / "tool.mjs").write_bytes(b"#!/usr/bin/env node\nA\n")
        _write(rnd / "flat" / "SKILL.md", "flat body\n")
        claude = root / "claude"
        local_place.place_skills(claude, rnd, ["bundled", "flat"], dry=False)

        b = claude / "skills" / "bundled"
        if sorted(p.name for p in b.iterdir()) != ["SKILL.md", "tool.mjs"]:
            fails.append(f"BUNDLED-CONTENTS: {sorted(p.name for p in b.iterdir())}")
        if (b / "tool.mjs").read_bytes() != (rnd / "bundled" / "tool.mjs").read_bytes():
            fails.append("BUNDLED-ASSET-BYTES: asset not copied byte-identical")
        if (b / "SKILL.md").read_text(encoding="utf-8") != "bundled body\n":
            fails.append("BUNDLED-SKILL-BYTES: SKILL.md not copied faithfully")

        f = claude / "skills" / "flat"
        if sorted(p.name for p in f.iterdir()) != ["SKILL.md"]:
            fails.append(
                f"FLAT-STRAY: an asset-less skill shipped extra files: "
                f"{sorted(p.name for p in f.iterdir())}")

    # --- 2. Dir-form cell reader + 3. asset staging (monkeypatch cells.IDEAS). ---
    with tempfile.TemporaryDirectory() as td:
        ideas = pathlib.Path(td)
        _write(ideas / "alpha.md", "---\nkind: skill\n---\nflat alpha\n")
        _write(ideas / "beta" / "beta.md",
               "---\nkind: skill\nassets: t.mjs\n---\ndir beta\n")
        (ideas / "beta" / "t.mjs").write_bytes(b"BETA-TOOL\n")
        # a directory with no `<dir>/<dir>.md` body is NOT a cell (cf. graphify-out)
        (ideas / "noise").mkdir()
        _write(ideas / "noise" / "data.json", "{}\n")

        old = cells.IDEAS
        cells.IDEAS = ideas
        try:
            slugs = cells.corpus_slugs()
            if slugs != ["alpha", "beta"]:
                fails.append(f"CORPUS-SLUGS: {slugs} (want [alpha, beta]; noise excluded)")
            beta = cells.parse_cell("beta")
            if beta["body"].strip() != "dir beta":
                fails.append("DIRFORM-BODY: parse_cell did not read the dir-form body")
            if beta["fm"].get("assets") != "t.mjs":
                fails.append("DIRFORM-FM: front-matter not parsed for a dir-form cell")
            if cells.cell_dir("alpha") is not None:
                fails.append("FLAT-NOT-DIR: a flat cell was reported as dir-form")
            if cells.cell_dir("beta") is None:
                fails.append("DIR-NOT-FOUND: dir-form cell not recognized")

            with tempfile.TemporaryDirectory() as sd:
                dest = pathlib.Path(sd)
                resolve_mod._stage_assets("beta", dest)
                if (dest / "t.mjs").read_bytes() != b"BETA-TOOL\n":
                    fails.append("STAGE-ASSET: declared asset not staged byte-identical")
                resolve_mod._stage_assets("alpha", dest)  # no `assets:` -> no-op
                if list(dest.iterdir()) != [dest / "t.mjs"]:
                    fails.append("STAGE-NOOP: asset-less cell staged something")
        finally:
            cells.IDEAS = old

    if fails:
        for x in fails:
            print("FAIL", x, file=sys.stderr)
        print(f"\n{len(fails)} failure(s)", file=sys.stderr)
        return 1
    print("PASS place: dir-form cells + asset staging + whole-dir deploy "
          "(asset-less skill ships exactly SKILL.md)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
