# Examples · the agent catalog re-cut (draft for approval)

Context: agents. Master design: `design/discovery/agents-master-design.md`. All examples are structural:
checked by composing, projecting or installing, then inspecting the result.

1. (catalog) **Given** the catalog, **when** its factors are listed, **then** they are exactly the 18 of the
   master design in its six groups and order; name, description, mark and key are identity details, not factors;
   enforcement level is an attribute on values, not a value of its own.
2. (role) **Given** each of the six roles composed alone, **when** its values are inspected, **then** every
   factor has a value as the master design states it, an explicitly empty set counting as a value, and every
   value carries its enforcement level.
3. (persona) **Given** nico composed over the architect, **when** its values are inspected, **then** its own
   single values replace the architect's (objective parsimony · satisfice; density maintenance), its sets extend
   the architect's (expertise adds semantic-addressing; stance adds analytical, zero-trust, cold-decode-oracle,
   invoke-the-canonical), and every factor it does not mention is the architect's.
4. (persona) **Given** kino and mav composed over the architect, **when** their values are inspected, **then**
   each matches the master design's persona table, with its own mark, and every other factor is the architect's.
5. (persona, reach) **Given** a persona that narrows the architect's reach, **when** it is composed and
   installed, **then** it has exactly the narrower reach; and **given** a persona that adds to the architect's
   reach, **when** composition is attempted, **then** it is refused, naming the widening.
6. (persona, guardrails) **Given** a persona that removes or weakens one of its role's guardrails, **when**
   composition is attempted, **then** it is refused, naming the guardrail.
7. (projection) **Given** a composed agent, **when** its text is projected, **then** it opens with its mark,
   name and description, presents its values grouped in catalog order, each as its name with its explanation,
   and contains no perception-scope, action-scope, handoffs or model as text.
8. (binding, reach) **Given** the roles installed for omp, **when** their settings are inspected, **then**
   reach is held by omp's own settings: the assayer has no tool that changes anything; the architect has no tool
   that edits the work or runs a shell; the builder, assayer, illustrator and check-writer can dispatch no one;
   the architect and the lead can dispatch exactly their handoffs.
9. (binding, model) **Given** the roles and personas installed for omp, **when** their model settings are
   inspected, **then** each agent has its own model role named for it, bound to the tier and effort the master
   design gives it.
10. (retirement) **Given** the catalog, roles, personas and their projections, **when** they are inspected,
    **then** heuristics, situation-awareness, learning, trigger, modalities and reasoning-strategy appear
    nowhere as a dimension or under another name, satisficing is part of the objective, and no agent or role is
    named binder.
11. (names) **Given** every value of the catalog, roles and personas, **when** its name is compared with the
    master design, **then** it matches exactly, and its explanation states the master design's meaning.
12. (identity) **Given** every installed agent, **when** its identity is inspected, **then** it has a key slot,
    and the slot is empty.
