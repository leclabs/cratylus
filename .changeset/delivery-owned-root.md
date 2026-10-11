---
'cratylus': minor
'@cratylus/forge': minor
'@cratylus/runtime': minor
---

Install places everything under one owned root, `~/.cratylus/<harness>/` (decision 0108).
For omp the root is an extension package (`agents/`, `skills/`, `extensions/cratylus.ts`,
hook workers, and a `package.json` recording the cratylus version that projected it),
linked into omp's plugin directory as `omp plugin link` would, so every project of the
user is offered it and no host file is overwritten. Installing again replaces the root
whole (upgrade); an earlier installation on omp's own surfaces, the event tap's skill
included, is taken back by its deploy record. `cratylus uninstall --harness omp
[--home <dir>]` removes the root and every reference into it. Agent declarations name
their own model role first, then their tier and effort (decision 0111); install writes no
model roles into host settings. The new `versionSkew` capability (`version_skew` in omp)
reports the projecting and the reached cratylus versions, and every omp session start
warns when they differ. `deploy --scope user` goes through the same owned root.
