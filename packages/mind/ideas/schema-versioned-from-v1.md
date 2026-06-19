---
kind: principle
delineation: Stamp an explicit schema version into the contract from the very first release and close it to unknown fields, so future change is a mechanical migration (from→to) rather than a guessing game over which shape a document follows.
---

# Schema-Versioned From v1

Put a **version literal** into a contract (manifest, schema, wire format) at its **first release** — `version: 1` — even with only one version; the literal is the migration hook (`migrate --from 1 --to 2`). Versioning retrofitted after v2 ships guesses at unversioned v1 documents forever.

Pair it with a **closed contract** — `additionalProperties: false` — so the migration surface stays the exact declared set. Decouple **extension versions from the contract version** they implement against, so a contract bump doesn't force-march every plugin.

## See also

- [[clean-slate]] — a migration converts old shapes to the target and drops them; the version literal is what makes that conversion mechanical rather than a compat shim carried forever.
- [[canonical-superset-ir]] — the IR is one such versioned, closed contract.
