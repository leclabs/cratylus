# depollute-migration — one-time de-pollution of existing stores

**Lane** per-agent (each agent dreams its own store; Nico judges) · **wave(3)** · deps: ⊳fleet-cutover ·
**Status** pending (HELD).

## Static

`../SPEC.md` §7. Known targets: mav@upmav `MEMORY.md` ≈27 KB → `web-platform` project/plan `AGENTS.md`;
nico@fire `MEMORY.md` 13.9 KB (Homes / Corpus-doctrine / Ops sections → polis `AGENTS.md` + `docs/`);
all other fleet homes audited. Laws: move-not-copy · net-current · hot-index pointer only where the
vault rule warrants · SOUL never written · memory stays LOCAL-PER-HOST (no cross-host copying).

## Scope

Content moves between memory homes + scoped `AGENTS.md` files only. No corpus/runtime edits. Each
agent's own store is migrated by that agent (or a dispatched instance of it) running the NEW dream;
Nico re-verifies every gate himself.

## Accept (falsifiers)

- `episodic.mjs audit --home <h>` exits 0 on every reachable fleet home (unpinned).
- Moved content grep-verified at its destination `AGENTS.md`; absent from source (move, not copy);
  `.bak` archive exists per touched store.
- Spot-read (judge): surviving SELF/MEMORY entries are cross-project agent-intrinsic only.
