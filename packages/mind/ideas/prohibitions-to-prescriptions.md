---
kind: principle
delineation: Rewrite "don't X" as "use Y" — a prohibition leaves the agent to guess the right alternative; a prescription names the target; keep the negative form only when the prohibition is genuinely universal with no single positive alternative.
---

# Prohibitions → Prescriptions

Rewrite negative instructions as positive ones: `don't mutate` → `use immutable data`; `don't use relative paths` → `use absolute paths`; `don't hardcode credentials` → `read credentials from the vault at request time`. A prohibition specifies what _not_ to do and leaves the agent to guess the correct alternative; a prescription names the target. Lists of prohibitions are the Defensive-Prohibition failure mode ([[context-pathologies]]).

Keep the negative form only when there is no single positive alternative — when the prohibition is genuinely universal ("never commit secrets"). That is the rare exception.

**Parameter-shape corollary.** A blast-radius-expanding default is a prohibition-in-disguise ("don't forget the scope or you'll wipe everything"); the rule and its remedy are [[no-permissive-defaults]].

## See also

- [[context-pathologies]] — the Defensive-Prohibition pathology this dissolves.
- [[minimalism]] — a permissive default is a surface you must defend; require it instead.
