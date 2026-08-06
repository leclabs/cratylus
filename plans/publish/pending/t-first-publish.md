# t-first-publish

**Wave 5.** The irreversible one.

## Intent

Push, open the Release PR, merge it, and confirm a fleet host can install the result.

## Constraints

- **This is the only shard that cannot be undone.** npm unpublish is a 72-hour window and
  then never. Everything before it is a dry run.
- Merging the Release PR is the operator's act, not the principal's — surface it.
- Verify by INSTALLING, not by reading the registry: `npm i -g @cratylus/invoke` on `ash`,
  then `cratylus-run --version`.
- Only after `latest` exists may `release-next` be dispatched.

## Accept

1. Five packages at `0.1.0` on `latest`, five git tags, provenance attested.
2. `cratylus-run --version` answers on a host that is not `fire`.
3. A dispatched snapshot installs via `@next`.
