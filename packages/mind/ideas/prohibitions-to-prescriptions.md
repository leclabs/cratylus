---
kind: principle
delineation: Rewrite "don't X" as "use Y" — a prohibition leaves the agent to guess the right alternative; a prescription names the target; keep the negative form only when the prohibition is genuinely universal with no single positive alternative.
---

# Prohibitions → Prescriptions

`don't mutate` → `use immutable data`; `don't use relative paths` → `use absolute paths`; `don't hardcode credentials` → `read credentials from the vault at request time`. Lists of prohibitions are the Defensive-Prohibition failure mode ([[context-pathologies]]).

The rare exception — no single positive alternative: `never commit secrets`.

**Parameter-shape corollary.** A blast-radius-expanding default is a prohibition-in-disguise ("don't forget the scope or you'll wipe everything"); the rule and its remedy are [[no-permissive-defaults]].

## See also

- [[context-pathologies]] — the Defensive-Prohibition pathology this dissolves.
- [[minimalism]] — a permissive default is a surface you must defend; require it instead.
