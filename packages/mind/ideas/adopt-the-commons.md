---
kind: principle
delineation: For a solved problem domain the established library/spec/standard is the answer; reserve custom code for the one differentiated layer, and don't re-derive solved infrastructure.
---

# Adopt the Commons

For a **solved problem domain**, the established library, spec, or public commons _is_ the answer. Reserve custom code for the one genuinely differentiated layer that is yours. Two faces of one form:

- **Adopt over reimplement.** Default to well-established standards that already encode community best practice (transport security, key exchange, crypto envelopes, token formats, auth flows). First ask: _what is the standard the industry already relies on?_ — and adopt it. Hand-rolled reimplementations of solved problems are lower-quality, higher-maintenance liabilities.
- **Don't re-derive solved infra.** Trust the mature dependency; treat topology as config, not something to rediscover the hard way. Still verify the _integration_ — your code over the real system — but don't reinvent or self-host the commons.

A strong signal you've dropped below the right altitude: the question _"haven't others already solved this?"_

## See also

- [[minimalism]] — the complement: where custom code _is_ warranted, build only the one job.
- [[clean-slate]] — adopt the standard rather than carry a bespoke reinvention forward.
