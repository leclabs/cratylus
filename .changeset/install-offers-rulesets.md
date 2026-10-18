---
"@cratylus/forge": minor
"cratylus": minor
---

`cratylus install` offers the corpus's rulesets: on a terminal each is taken whole, rule by rule, or not at all, and `--rules <ruleset-or-rule,…|none>` settles it instead. None is the default. The choice is recorded by rule name in the owned root's `installation.json`, and installing again keeps it without asking unless `--rules` says otherwise; a rule no longer offered is dropped and named. The summary names the rules placed, and uninstall removes them with the owned root.
