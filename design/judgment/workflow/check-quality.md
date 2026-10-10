# Held-out · cut 5 · check quality

Used only in judgment.

1. (offline proof) **Given** a check that passes its goldens and fails its negatives only because it reads the
   current date, which the example does not name, **when** offline proof runs, **then** the host read is caught.
2. (never-assertion) **Given** a batch in which every run satisfies the ordinary assertions and one run breaks a
   never-assertion, **when** it is judged, **then** it fails.
3. (implementation leakage) **Given** a decision that names a tool in quoting what the operator said, and states
   what must hold in the context's own words, **when** it is inspected, **then** the tool name is warned about
   and the rest is not.
