#!/usr/bin/env python3
"""skill-companion-deploy + memory-home-dual-deploy tests.

skill-companion-deploy: dir-form cells (`ideas/<slug>/<slug>.md` beside companion
assets), asset staging into .render, and the placer shipping a skill's whole dir
(SKILL.md + assets) -- WHILE a flat, asset-less skill still ships exactly its
SKILL.md and nothing more (the golden-master invariant).

memory-home-dual-deploy (§5): a `deploy: skill-dir` organ (NOT kind: skill) joins
the skill deploy set, renders SKILL.md from its `## Tool` section (the skill
composer's H1/≜ shape NOT required), and stages a `bundle:` build artifact --
with hard-error guards for a missing `## Tool` or an unbuilt artifact.

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
from place import scope as place_scope  # noqa: E402
from place import ssh as ssh_place  # noqa: E402


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

    # --- 4. Remote --home resolution: a bare home dir gets `.claude` appended
    # (never silently litters <home>/{agents,skills}); a `.claude` dir is verbatim.
    # dry=True keeps `run()` from touching the network; the resolution under test
    # is pure string logic. ---
    cases = [
        ("/Users/lex", "/Users/lex/.claude"),        # bare home -> append (the footgun)
        ("/home/lex/", "/home/lex/.claude"),          # trailing slash tolerated
        ("/Users/lex/.claude", "/Users/lex/.claude"), # already .claude -> verbatim
        ("~/.claude", "$HOME/.claude"),               # default special-case (dry $HOME)
    ]
    for home, want in cases:
        got, rc = ssh_place._resolve_claude_dir("user@host", home, dry=True)
        if (got, rc) != (want, 0):
            fails.append(f"HOME-RESOLVE({home!r}): got {(got, rc)}, want {(want, 0)}")

    # local user_scope mirrors the remote resolver: a bare --home self-corrects
    # (.claude appended); a `.claude` path is verbatim. Closes the local half of
    # the footgun the ssh path fixed in f6197f8 (an explicit --home was taken
    # verbatim, littering <home>/{agents,skills} beside the real ~/.claude).
    local_cases = [
        ("/Users/lex", "/Users/lex/.claude"),          # bare home -> append
        ("/home/lex/", "/home/lex/.claude"),            # trailing slash tolerated
        ("/Users/lex/.claude", "/Users/lex/.claude"),   # already .claude -> verbatim
    ]
    for home, want in local_cases:
        got = str(place_scope.user_scope(home))
        if got != want:
            fails.append(f"USER-SCOPE({home!r}): got {got!r}, want {want!r}")
    if place_scope.user_scope(None) != pathlib.Path.home() / ".claude":
        fails.append("USER-SCOPE(None): default is not $HOME/.claude")

    # --- 5. dual-deploy ("one cell, two deploy fates", memory-home-dual-deploy):
    # a `deploy: skill-dir` organ (NOT kind: skill) joins the skill deploy set,
    # renders SKILL.md from its `## Tool` section, and stages a `bundle:` build
    # artifact -- while a plain structure cell stays out of the set. ---
    with tempfile.TemporaryDirectory() as td:
        root = pathlib.Path(td)
        ideas = root / "ideas"
        # the organ-home: structure kind, deploys as a skill dir, bundles a tool.
        _write(ideas / "org.md",
               "---\nkind: structure\ndeploy: skill-dir\n"
               "bundle: art/tool.mjs\ndelineation: the organ home.\n---\n"
               "# Org\n\nintro\n\n## Tool\n\nrun `tool.mjs encode`.\n\n"
               "## See also\n\n- [[x]]\n")
        _write(ideas / "plain.md",
               "---\nkind: structure\n---\n# Plain\n\na plain structure cell\n")
        _write(ideas / "sk.md", "---\nkind: skill\n---\n# Sk\n\nflat skill\n")
        (root / "art").mkdir()
        (root / "art" / "tool.mjs").write_bytes(b"#!/usr/bin/env node\nTOOL\n")

        old_ideas, old_root = cells.IDEAS, cells.ROOT
        cells.IDEAS, cells.ROOT = ideas, root
        cells.reset_storage_caches()
        try:
            # deploy-set membership: union of kind:skill and deploy:skill-dir;
            # the plain structure cell is excluded.
            if cells.slugs_deploying_as_skill() != ["org", "sk"]:
                fails.append(f"DEPLOY-SET: {cells.slugs_deploying_as_skill()} "
                             f"(want [org, sk]; plain excluded)")
            if not cells.deploys_as_skill_dir("org"):
                fails.append("SKILL-DIR-FLAG: org not recognized as deploy: skill-dir")
            if cells.deploys_as_skill_dir("sk"):
                fails.append("SKILL-DIR-FLAG: a kind:skill cell must not be skill-dir")
            if cells.deploys_as_skill_dir("plain"):
                fails.append("SKILL-DIR-FLAG: a plain structure cell must not be skill-dir")

            # SKILL.md render: name + description + provenance header + the `## Tool`
            # body verbatim (heading itself dropped); the composer's H1/≜ shape is
            # NOT required of an organ cell.
            text, bh, _ = resolve_mod.emit_skill_dir("org", "strong-llm-lean", "claude-code")
            if "name: org" not in text or "description: the organ home." not in text:
                fails.append("SKILLDIR-FM: name/description not emitted")
            if "run `tool.mjs encode`." not in text:
                fails.append("SKILLDIR-BODY: `## Tool` body not emitted")
            if "## Tool" in text:
                fails.append("SKILLDIR-HEADING: the `## Tool` heading leaked into SKILL.md")
            if "intro" in text or "## See also" in text:
                fails.append("SKILLDIR-LEAK: non-Tool sections leaked into SKILL.md")
            if f"content-hash: sha256:{bh}" not in text:
                fails.append("SKILLDIR-HASH: provenance content-hash absent/mismatched")

            # bundle staging: build artifact copied byte-identical; a cell with no
            # `bundle:` is a no-op.
            with tempfile.TemporaryDirectory() as sd:
                dest = pathlib.Path(sd)
                resolve_mod._stage_bundle("org", dest)
                if (dest / "tool.mjs").read_bytes() != b"#!/usr/bin/env node\nTOOL\n":
                    fails.append("STAGE-BUNDLE: artifact not staged byte-identical")
                resolve_mod._stage_bundle("sk", dest)  # no `bundle:` -> no-op
                if list(dest.iterdir()) != [dest / "tool.mjs"]:
                    fails.append("STAGE-BUNDLE-NOOP: bundle-less cell staged something")

            # degrade-visibly: a skill-dir cell with no `## Tool` is a hard error,
            # and an unbuilt bundle artifact is a hard error (never a silent skip).
            _write(ideas / "notool.md",
                   "---\nkind: structure\ndeploy: skill-dir\ndelineation: x.\n---\n# N\n\nbody\n")
            _write(ideas / "missing.md",
                   "---\nkind: structure\ndeploy: skill-dir\nbundle: art/gone.mjs\n"
                   "delineation: x.\n---\n# M\n\n## Tool\n\nt\n")
            cells.reset_storage_caches()
            try:
                resolve_mod.emit_skill_dir("notool", "strong-llm-lean", "claude-code")
                fails.append("NOTOOL-GUARD: a missing `## Tool` did not hard-error")
            except SystemExit:
                pass
            try:
                with tempfile.TemporaryDirectory() as sd2:
                    resolve_mod._stage_bundle("missing", pathlib.Path(sd2))
                fails.append("MISSING-BUNDLE-GUARD: an unbuilt artifact did not hard-error")
            except SystemExit:
                pass
        finally:
            cells.IDEAS, cells.ROOT = old_ideas, old_root
            cells.reset_storage_caches()

    if fails:
        for x in fails:
            print("FAIL", x, file=sys.stderr)
        print(f"\n{len(fails)} failure(s)", file=sys.stderr)
        return 1
    print("PASS place: dir-form cells + asset staging + whole-dir deploy "
          "(asset-less skill ships exactly SKILL.md) + deploy: skill-dir organ "
          "(SKILL.md from `## Tool` + bundle staging, hard-error guards)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
