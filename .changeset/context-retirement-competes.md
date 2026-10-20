---
'@cratylus/runtime': minor
'cratylus': minor
---

A bounded context is retired only while its one current entry is a retirement: a retirement and a description recorded on joined lines of work compete, the retirement listed among `competingDescriptions` as retired with its reason, until a later description or retirement supersedes them all, and closing the books opens the competing retirement as a `retire-context` opening beside the description's. Bringing a retired context back supersedes the retirement and every description it superseded, so a runtime that predates retirement reads one description. The history, decisions and close explanations say what retirement changes in each.
