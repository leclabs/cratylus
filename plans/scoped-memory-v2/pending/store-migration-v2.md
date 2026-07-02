# store-migration-v2 — harvest-and-drop to the CoALA stores, fleet-wide

**Lane** per-agent (each agent harvests its own store; Nico judges) · **wave(2)** · deps:
⊳fleet-cutover-v2 · HELD.

## Static

`../SPEC.md` D1 (projection-dedup bar) + D7 (harvest-and-drop, drop-biased). Homes: all reachable
fleet hosts × 11 agents (rich stores: nico@fire, mav@{fire,forge,upmav}; most others near-stub).
Laws: `.bak`-first (SELF + MEMORY + EPISODIC archived before any change) · SOUL never written ·
audit green per home on completion.

## Scope

Per home: (1) archive; (2) **harvest**: PROCEDURAL ← only inductively generalized cross-project
wisdom that no projection carries (grep SOUL/skills before each keep — a keep needs a NEGATIVE
projection-grep); SEMANTIC ← identity facts + the few durable agent-intrinsic entries; project-scoped
remainders weighed once against the project's `AGENTS.md`, presumed cruft, dropped; (3) legacy
EPISODIC dropped behind the archive; (4) `SELF.md`/`MEMORY.md` removed after verified harvest;
(5) audit exit 0 (allow-file for reviewed pins); (6) wake smoke: the next wake on that host loads
SEMANTIC + PROCEDURAL whole and reorients from git + plan context without loss of thread.

## Accept (falsifiers)

- Every reachable home: `{EPISODIC.jsonl, SEMANTIC.md, PROCEDURAL.md}` present (episodic fresh/empty);
  `SELF.md`/`MEMORY.md` ABSENT; `.bak` archives present; audit exit 0.
- Judge spot-read per rich home: every PROCEDURAL keep survives its negative projection-grep (a
  seeded already-projected keep is caught — prove the bar bites, then fix); no dispositions in
  SEMANTIC; total kept volume small (drop-bias visible — a harvest ≥ half the source size fails
  review by default).
- Post-migration wake transcript on ≥2 hosts (one per founder): correct thread resumed, orientation
  drawn from git/plans, no reference to the removed stores.
