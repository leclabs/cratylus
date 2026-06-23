"""emit_manifest — the B8 R3 routing-manifest PRODUCER (Nico's follow-on).

The toolkit already CONSUMES manifests (`verify.py gate_reconstruct` R3); this is
the missing producer half. It RECORDS the homing of a source's realized
factorization into the firm schema `verify._load_manifest` validates:

    { source, exemplified_at, reader,
      routes[]: { fragment_digest, idea_gloss, home_slug, disposition, rank },
      delta[]:  { fragment_digest, idea_gloss } }

Division of labour (why a deterministic recorder is faithful): the exemplify
AGENT is the *certifier* — it runs produce→name→accept, proves meaning(D) ≡ the
composite (round-trip equivalent-or-better), and fixes any dropped idea IN the
composite. This recorder runs DOWNSTREAM of that certification and emits the
manifest from the certified cell's authored `[[ ]]` factorization:

    route   — a prose ref whose anchor HOMES to a live cell (disposition=reuse).
    delta   — a prose ref with no live home yet (homed-nowhere-by-design).

fragment_digest is `core.digest.fragment_digest` of the homed cell's body (the
canonical form of that idea: equal-meaning ⇒ equal-digest), or of the bare
anchor for an unhomed delta. home_slug is the BARE anchor (verify resolves it
against the corpus home-index). Genus organs (principal-ic / semantic-whole /
the memory protocol) are resolver-injected, not authored cell refs, so they are
out of the per-cell manifest's scope ([[cite-dont-copy]]).

Usage (from packages/mind):
    uv run --with markdown-it-py python toolkit/emit_manifest.py <slug> [<slug> ...]
    uv run --with markdown-it-py python toolkit/emit_manifest.py --all-agents
    uv run --with markdown-it-py python toolkit/emit_manifest.py --all-skills
    [--reader R] [--date ISO8601]
"""
from __future__ import annotations

import argparse
import json
import sys

from compose import agent as _agent
from core import cells
from core.digest import fragment_digest

MANIFESTS = cells.ROOT / ".manifests"
# legacy plural-tree source dirs (the exemplify input D); fall back to the cell.
_LEGACY = {"agent": "agents", "skill": "skills"}


def _gloss(slug: str) -> str:
    """A non-empty idea gloss for a homed anchor: front-matter delineation if
    present, else the first non-empty body line (the `≜` definition), else slug."""
    d = cells.delineation(slug)
    if d:
        return d
    try:
        body = cells.parse_cell(slug)["body"]
    except Exception:
        return slug
    for line in body.splitlines():
        if line.strip():
            return line.strip()
    return slug


def _digest_of(slug: str) -> str:
    """Digest the homed cell's canonical body (its content IS the idea)."""
    try:
        body = cells.parse_cell(slug)["body"]
    except Exception:
        body = slug
    return fragment_digest(body or slug)


def _organ_cell(organ: str, value: str):
    """(gloss, digest) for an organ VALUE cell `<organ>/<value>.md`, read by path
    (it is organ-scoped, not a global slug -- the same value recurs across organs)."""
    path = _agent.value_cell_path(organ, value)
    if path is None:
        return value, fragment_digest(f"{organ}/{value}")
    text = path.read_text(encoding="utf-8")
    # strip the leading `---fm---` block to get the body.
    body = text
    if text.startswith("---"):
        parts = text.split("---", 2)
        if len(parts) == 3:
            body = parts[2]
    gloss = next((ln.strip() for ln in body.splitlines() if ln.strip()), value)
    return gloss, fragment_digest(body or value)


def _source_of(slug: str, kind: str) -> str:
    legacy = cells.ROOT / _LEGACY.get(kind, "") / f"{slug}.md"
    if kind in _LEGACY and legacy.exists():
        return f"{_LEGACY[kind]}/{slug}.md"
    return str(cells.cell_path(slug).relative_to(cells.ROOT))


def emit(slug: str, reader: str, date: str) -> dict:
    """Build the manifest dict for one certified source cell.

    AGENT (organ selection vector): routes are organ-SCOPED -- `home_slug` is
    `<organ>/<value>` (a value token recurs across organs, so the bare slug is
    ambiguous; the (organ,value) PAIR is the unique home). SKILL: routes are the
    authored global `[[ ]]` prose refs."""
    cell = cells.parse_cell(slug)
    kind = cell["fm"].get("kind", "")
    routes, delta = [], []
    rank = 0

    if kind == "agent" and _agent.is_selection_form(cell):
        for organ, values in _agent.parse_selection(cell):
            for value in values:
                gloss, digest = _organ_cell(organ, value)
                home = f"{organ}/{value}"
                if _agent.value_cell_path(organ, value) is not None:
                    routes.append({
                        "fragment_digest": digest, "idea_gloss": gloss,
                        "home_slug": home, "disposition": "reuse", "rank": rank,
                    })
                    rank += 1
                else:
                    delta.append({"fragment_digest": digest, "idea_gloss": gloss})
    else:
        # skill (or legacy prose-formula agent): authored fence-immune prose refs.
        seen: set[str] = set()
        for ref in cells.refs_in_prose(cell["body"]):
            if ref == slug or ref in seen:
                continue
            seen.add(ref)
            if cells.exists(ref):
                routes.append({
                    "fragment_digest": _digest_of(ref), "idea_gloss": _gloss(ref),
                    "home_slug": ref, "disposition": "reuse", "rank": rank,
                })
                rank += 1
            else:
                delta.append({"fragment_digest": fragment_digest(ref), "idea_gloss": ref})

    return {
        "source": _source_of(slug, kind),
        "exemplified_at": date,
        "reader": reader,
        "routes": routes,
        "delta": delta,
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("slugs", nargs="*")
    ap.add_argument("--all-agents", action="store_true")
    ap.add_argument("--all-skills", action="store_true")
    ap.add_argument("--reader", default="strong-llm-lean")
    ap.add_argument("--date", default="2026-06-22T00:00:00Z")
    args = ap.parse_args()

    targets = list(args.slugs)
    if args.all_agents:
        targets += cells.slugs_of_kind("agent")
    if args.all_skills:
        targets += cells.slugs_of_kind("skill")
    targets = sorted(dict.fromkeys(targets))
    if not targets:
        ap.error("no targets (give slugs or --all-agents/--all-skills)")

    MANIFESTS.mkdir(exist_ok=True)
    for slug in targets:
        if not cells.exists(slug):
            print(f"SKIP {slug}: no such live cell", file=sys.stderr)
            continue
        data = emit(slug, args.reader, args.date)
        out = MANIFESTS / f"{slug}.json"
        out.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"EMIT {slug} -> {out.relative_to(cells.ROOT)}  "
              f"({len(data['routes'])} routes, {len(data['delta'])} delta)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
