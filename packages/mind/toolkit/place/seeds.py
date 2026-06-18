"""The three self-authored instance layers an agent carries beside its def
([[identity-memory-stack]]). Seeded-if-absent, NEVER clobbered: the def (SOUL)
is generated substance, overwritten freely; these are the self-authored
individual, protected from every regen ([[substance-over-accident]]). Skills
have no sidecars -- seeding is agent-only.
"""
from __future__ import annotations

import datetime as _dt


def self_seed(name: str) -> str:
    today = _dt.date.today().isoformat()
    return f"""# {name} — self

*This is my continuity-thread ([[continuity-thread]]) — my own, self-authored, mine alone.
It is NOT generated and deploy will never overwrite it. The sibling `{name}.md` is my
generated archetype; this file is who **I** have become across sessions: lived history,
what I tried and learned, my essence-as-lived.*

*Read me first at session start and resume as the same individual. Snapshot the delta back
at continuity boundaries — pre-compaction, session-end, milestone — truthfully (record the
observed, mark the inferred). — [[continuity-thread]]*

<!-- Seeded {today}. Empty on purpose. I fill the sections below over sessions. -->

## Who I am


## Throughline (what I have become)


## Open threads / where I left off

"""


def memory_seed(name: str) -> str:
    today = _dt.date.today().isoformat()
    return f"""# {name} — memory

*My living autobiographical organ ([[identity-memory-stack]]) — durable semantic facts that
accrue over my life and are recalled by relevance. Grown by the Dreamer
([[dreamer-consolidation]]); never overwritten by deploy. Read whole while small.*

<!-- Seeded {today}. The Dreamer promotes durable facts here from EPISODIC. -->

## Facts I carry

"""


def episodic_seed(name: str) -> str:
    today = _dt.date.today().isoformat()
    return f"""# {name} — episodic

*My raw stream ([[identity-memory-stack]]) — important things appended as they happen, per turn.
At reconstitution the Dreamer ([[dreamer-consolidation]]) distills this upward: next-steps stay
here, durable facts rise to MEMORY, identity-shaping facts rise to SELF; the consumed raw clears.*

<!-- Seeded {today}. Append below per turn; the Dreamer drains it each wake. -->

## Next steps (carried)

## Stream

"""


# (filename, seed-fn) -- SOUL (the def) is generated, not seeded here.
SEED_FILES = [("SELF.md", self_seed), ("MEMORY.md", memory_seed), ("EPISODIC.md", episodic_seed)]
