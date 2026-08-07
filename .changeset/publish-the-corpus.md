---
'@cratylus/canon': minor
---

The corpus is published, because a projector with no installable corpus is not installable software.

`@cratylus/canon` was `ignore`d in the changesets config and sat at `0.0.0` while its five siblings
reached `0.1.1`. The consequence was not cosmetic: `@cratylus/forge` ships the `cratylus` bin but
deliberately does not depend on a corpus — it receives one as data through `agents.config.ts` — so
with canon unpublished there was **no way for anyone to install a working cratylus at all**.

It also decides a design question in the open. A globally installed corpus does not resolve from a
config outside any `node_modules` (`ERR_MODULE_NOT_FOUND`, measured), and ESLint's answer to that —
"plugins and shareable configs must still be installed locally" — defeats the model this project is
built on, where an agent is a being that exists out-of-band from any one repository. So the corpus
becomes a dependency of the CLI: always resolvable, wherever the CLI is installed.

**Depending on the corpus is not assuming it.** The dependency makes canon resolvable; the config
still names it. `init` writes `extends: [canon]`, a replacement corpus is installed and named the
same way, and the projector continues to hold no opinion of its own about what an agent is.
