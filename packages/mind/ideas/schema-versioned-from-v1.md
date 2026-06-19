---
kind: principle
delineation: Stamp an explicit schema version into the contract from the very first release and close it to unknown fields, so future change is a mechanical migration (from→to) rather than a guessing game over which shape a document follows.
---

# Schema-Versioned From v1

Put an explicit **version literal** into a contract (manifest, schema, wire format) from its **first release** — `version: 1` — even when there is only one version. The literal is the hook that makes every later change a **mechanical migration** (`migrate --from 1 --to 2`) instead of heuristic shape-sniffing. Versioning retrofitted after v2 ships has to guess at unversioned v1 documents forever; versioning from v1 never does.

Pair it with a **closed contract** — reject unknown fields (`additionalProperties: false`). A closed schema means no one smuggles in fields that later collide with a real one, and the migration surface stays the exact declared set. Decouple the **versions of extensions from the version of the contract** they implement against, so a contract bump doesn't force-march every plugin.

## See also

- [[clean-slate]] — a migration converts old shapes to the target and drops them; the version literal is what makes that conversion mechanical rather than a compat shim carried forever.
- [[canonical-superset-ir]] — the IR is one such versioned, closed contract.
