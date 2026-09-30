---
'@cratylus/forge': patch
---

A guard on omp now judges a message to a running agent as the dispatch it is. omp messages an agent with `write` to `agent://<id>`; the guard module handed the purview worker that as a `Write` and the judge saw the path alone, never the message. The envelope now spells it as `SendMessage`, the recipient in `agent` and the content in `message`; every other write and every edit is spelled as before.
