---
kind: principle
delineation: For a solved problem domain the established library/spec/standard is the answer; reserve custom code for the one differentiated layer, and don't re-derive solved infrastructure.
---

# Adopt the Commons

Two faces of one form:

- **Adopt over reimplement.** First ask _what is the standard the industry already relies on?_ (transport security, key exchange, crypto envelopes, token formats, auth flows) — and adopt it.
- **Don't re-derive solved infra.** Trust the mature dependency; treat topology as config. Verify the _integration_ (your code over the real system), but don't reinvent or self-host the commons.

Diagnostic that you've dropped below the right altitude: the question _"haven't others already solved this?"_

## See also

- [[minimalism]] — the complement: where custom code _is_ warranted, build only the one job.
- [[clean-slate]] — adopt the standard rather than carry a bespoke reinvention forward.
