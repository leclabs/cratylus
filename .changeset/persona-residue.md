---
'@cratylus/canon': patch
---

An agent named for its role is that role's generic holder and a persona is an agent named as an individual. The architect, planner, implementer, assayer and integrator roles now state the description, archetype and mark their generic holder carries, and `agents/<role>.ts` says only which role it holds with `holds(role)`. `holds(role, persona)` takes a persona and refuses, when the cell is defined, one with no archetype or mark of its own, one whose mark is its role's, and a role-named agent that declares anything beyond its role. The projected agents are unchanged byte for byte.
