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
included, is taken back by its deploy record, save the `modelRoles` entries it seeded,
which stay in the host's config as the host's own. `cratylus uninstall --harness omp
[--home <dir>]` removes the root and every reference into it. Agent declarations name
their own model role first, then their tier and effort (decision 0111), and are never
rewritten with a model. Which model a tier or a persona's role runs on is the operator's
choice and the host's own setting (decision 0112): install asks for each the host does
not bind (or takes `--model-roles <role=model,…|default>`, keyed by tier or agent) and
writes the answer into `~/.omp/agent/config.yml` as an ordinary `modelRoles` entry,
recorded nowhere as cratylus's, so upgrade and uninstall keep it. A run that is neither
told nor able to ask places everything else and names, as the next step, each tier the
agents fall back to that the host does not bind. Whether omp's status line shows the session's agent, where the host hides it, is the
operator's choice the same way (decision 0113): asked, or `--agent-status show|hide`,
written as the host's own setting and never applied again. Install and upgrade leave a
reference place the host has redirected or replaced, and say what to do. The new `versionSkew` capability
(`version_skew` in omp) reports the projecting and the reached cratylus versions, and
every omp session start warns when they differ, whichever is older, comparing the
version the root records with the command's own `--version`; a command lacking a
capability the installation expects is named in the warning, and the rest still load. `deploy --scope user` goes through the
same owned root.
